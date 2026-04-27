import express from "express";
import { predictRouteMetrics } from "../ml/routeModel.js";

const router = express.Router();

const EARTH_RADIUS_KM = 6371;

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function haversineDistance(a, b) {
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const deltaLat = toRadians(b.lat - a.lat);
  const deltaLng = toRadians(b.lng - a.lng);

  const inside = Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;

  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(inside), Math.sqrt(1 - inside));
}

function hashText(value = "") {
  let hash = 0;

  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }

  return Math.abs(hash);
}

function normalizePoint(point) {
  if (point && typeof point.lat === "number" && typeof point.lng === "number") {
    return {
      address: point.address || "Unknown location",
      lat: point.lat,
      lng: point.lng,
    };
  }

  const seed = hashText(point?.address || "Unknown location");
  const latitude = ((seed % 180) - 90) + ((seed >> 4) % 10) * 0.03;
  const longitude = (((seed >> 8) % 360) - 180) + ((seed >> 2) % 10) * 0.03;

  return {
    address: point?.address || "Unknown location",
    lat: Number(latitude.toFixed(5)),
    lng: Number(longitude.toFixed(5)),
  };
}

function optimizeStops(start, stops) {
  const remaining = [...stops];
  const route = [];
  let current = start;

  while (remaining.length) {
    let nearestIndex = 0;
    let nearestDistance = haversineDistance(current, remaining[0]);

    for (let index = 1; index < remaining.length; index += 1) {
      const distance = haversineDistance(current, remaining[index]);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    }

    const nextStop = remaining.splice(nearestIndex, 1)[0];
    route.push(nextStop);
    current = nextStop;
  }

  return route;
}

function buildRouteStats(start, orderedStops, options) {
  const points = [start, ...orderedStops];
  const legs = points.slice(1).map((point, index) => {
    const from = points[index];
    return {
      from,
      to: point,
      distance: haversineDistance(from, point),
    };
  });

  const totalDistance = legs.reduce((sum, leg) => sum + leg.distance, 0);
  const speedKph = options.vehicle === "truck" ? 45 : options.vehicle === "bike" ? 22 : 35;
  const travelTimeMinutes = Math.max(10, Math.round(totalDistance / speedKph * 60 + orderedStops.length * 4));
  const mpg = options.vehicle === "truck" ? 8 : options.vehicle === "bike" ? 0 : 24;
  const fuelLitres = options.vehicle === "bike" ? 0 : Number(Math.max(1, (totalDistance / 1.60934 / mpg) * 3.785).toFixed(1));
  const fuelCost = Number((fuelLitres * options.fuelPrice).toFixed(2));

  const baseCharge = Math.max(1008, totalDistance * 88.73 + orderedStops.length * 420);
  const priorityModifier = options.priority === "urgent" ? 1.18 : options.priority === "eco" ? 0.88 : 1;
  const routeCost = Number((baseCharge * priorityModifier + fuelCost).toFixed(2));

  return {
    orderedStops: orderedStops.map((stop, index) => ({
      label: `Stop ${index + 1}`,
      address: stop.address,
      lat: stop.lat,
      lng: stop.lng,
    })),
    mapPoints: points.map((point, index) => ({
      label: index === 0 ? "Pickup" : `Stop ${index}`,
      address: point.address,
      lat: point.lat,
      lng: point.lng,
    })),
    totalDistanceKm: Number(totalDistance.toFixed(1)),
    travelTimeMinutes,
    fuelGallons: fuelLitres,
    fuelCost,
    routeCost,
    estimatedArrival: new Date(Date.now() + travelTimeMinutes * 60000).toISOString(),
    efficiency: Math.min(98, Math.max(64, Math.round(70 + orderedStops.length * 2 + (options.priority === "eco" ? 10 : options.priority === "urgent" ? 2 : 5)))),
    fuelSaved: Math.min(100, Math.round(11 + orderedStops.length * 2 + (options.priority === "eco" ? 10 : 3))),
  };
}

router.post("/optimize-route", async (req, res) => {
  const { pickup, stops, priority = "balanced", vehicle = "van", fuelPrice = 103 } = req.body;

  if (!pickup || !Array.isArray(stops) || stops.length === 0) {
    return res.status(400).json({ error: "Pickup and stops are required." });
  }

  const startPoint = normalizePoint(pickup);
  const normalizedStops = stops
    .filter((stop) => stop && stop.address && stop.address.trim())
    .map(normalizePoint);

  if (normalizedStops.length === 0) {
    return res.status(400).json({ error: "At least one valid stop is required." });
  }

  const orderedStops = optimizeStops(startPoint, normalizedStops);
  const stats = buildRouteStats(startPoint, orderedStops, { priority, vehicle, fuelPrice });
  const mlPrediction = await predictRouteMetrics(stats.totalDistanceKm, normalizedStops.length, vehicle, priority);

  const mergedStats = {
    ...stats,
    travelTimeMinutes: mlPrediction.predictedTime,
    fuelGallons: mlPrediction.predictedFuel,
    fuelCost: Number((mlPrediction.predictedFuel * fuelPrice).toFixed(2)),
    routeCost: mlPrediction.predictedCost,
    efficiency: mlPrediction.predictedScore,
    modelPrediction: mlPrediction,
  };

  return res.json({ pickup: startPoint, ...mergedStats });
});

export default router;
