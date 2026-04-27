import express from "express";
import { predictRouteMetrics } from "../ml/routeModel.js";

const router = express.Router();

// ── Haversine straight-line distance (km) ──────────────────────────────────
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Build NxN distance matrix ───────────────────────────────────────────────
function buildDistanceMatrix(points) {
  const n = points.length;
  const matrix = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i !== j) {
        matrix[i][j] = haversineDistance(
          points[i].lat, points[i].lng,
          points[j].lat, points[j].lng
        );
      }
    }
  }
  return matrix;
}

// ── Nearest Neighbour TSP ───────────────────────────────────────────────────
function nearestNeighbour(distanceMatrix, startIndex) {
  const n = distanceMatrix.length;
  const visited = new Array(n).fill(false);
  const route = [startIndex];
  visited[startIndex] = true;

  for (let i = 0; i < n - 1; i++) {
    const current = route[route.length - 1];
    let nearestDist = Infinity;
    let nearestIndex = -1;

    for (let j = 0; j < n; j++) {
      if (!visited[j] && distanceMatrix[current][j] < nearestDist) {
        nearestDist = distanceMatrix[current][j];
        nearestIndex = j;
      }
    }
    visited[nearestIndex] = true;
    route.push(nearestIndex);
  }
  return route;
}

// ── Address/coordinate normaliser ──────────────────────────────────────────
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
    return { address: point.address || "Unknown location", lat: point.lat, lng: point.lng };
  }
  const seed = hashText(point?.address || "Unknown location");
  const lat = ((seed % 180) - 90) + ((seed >> 4) % 10) * 0.03;
  const lng = (((seed >> 8) % 360) - 180) + ((seed >> 2) % 10) * 0.03;
  return { address: point?.address || "Unknown location", lat: Number(lat.toFixed(5)), lng: Number(lng.toFixed(5)) };
}

// ── Route stats builder ─────────────────────────────────────────────────────
function buildRouteStats(start, orderedStops, options) {
  const points = [start, ...orderedStops];
  const legs = points.slice(1).map((point, index) => ({
    from: points[index],
    to: point,
    distance: haversineDistance(points[index].lat, points[index].lng, point.lat, point.lng),
  }));

  const totalDistance = legs.reduce((sum, leg) => sum + leg.distance, 0);
  const speedKph = 30;
  const travelTimeMinutes = Math.max(5, Math.round((totalDistance / speedKph) * 60 + orderedStops.length * 5));
  const mileage = options.vehicle === "truck" ? 8 : options.vehicle === "bike" ? 45 : 15;
  const fuelLitres = Number((totalDistance / mileage).toFixed(2));
  const fuelCost = Number((fuelLitres * 103).toFixed(2));
  const baseCharge = 150 + totalDistance * 12 + orderedStops.length * 80;
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

// ── POST /api/optimize-route ────────────────────────────────────────────────
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

  // All points: index 0 = pickup, 1..n = stops
  const allPoints = [startPoint, ...normalizedStops];

  console.log("\n─── Route Optimization ───────────────────────────────");
  console.log("Original order:", allPoints.map((p, i) => `[${i}] ${p.address}`));

  // Build NxN distance matrix
  const distanceMatrix = buildDistanceMatrix(allPoints);
  console.log("Distance matrix (km, rounded):");
  distanceMatrix.forEach((row, i) => {
    console.log(`  [${i}]`, row.map((d) => d.toFixed(1)).join("  "));
  });

  // Run Nearest Neighbour TSP starting from index 0 (pickup)
  const routeIndices = nearestNeighbour(distanceMatrix, 0);
  console.log("Optimized index order:", routeIndices);
  console.log("Optimized stop order:", routeIndices.slice(1).map((i) => allPoints[i].address));
  console.log("──────────────────────────────────────────────────────\n");

  // Map indices back to point objects (skip 0 = pickup)
  const orderedStops = routeIndices.slice(1).map((i) => allPoints[i]);

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
