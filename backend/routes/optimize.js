import express from "express";
import { predictRouteMetrics } from "../ml/routeModel.js";

const router = express.Router();

// ── Haversine straight-line distance (km) ──────────────────────────────────
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Nearest Neighbour TSP ───────────────────────────────────────────────
// Works directly on stop objects — no distance matrix needed.
// Greedy: always pick the unvisited stop closest to the current position.
function nearestNeighbourTSP(stops, startLat, startLng) {
  const unvisited = [...stops];
  const route = [];
  let currentLat = startLat;
  let currentLng = startLng;

  while (unvisited.length > 0) {
    let nearestIndex = 0;
    let nearestDist = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const dist = haversineDistance(
        currentLat, currentLng,
        unvisited[i].lat, unvisited[i].lng
      );
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestIndex = i;
      }
    }

    route.push(unvisited[nearestIndex]);
    currentLat = unvisited[nearestIndex].lat;
    currentLng = unvisited[nearestIndex].lng;
    unvisited.splice(nearestIndex, 1);
  }
  return route;
}

// ── Address/coordinate normaliser ──────────────────────────────────────────

// Returns { address, lat, lng } when real coords exist, or null when coords are missing.
// We no longer silently generate hash fallbacks — missing coords must be caught
// before calling the optimizer so the user gets a clear error.
function normalizePoint(point) {
  if (
    point &&
    typeof point.lat === "number" &&
    typeof point.lng === "number" &&
    !isNaN(point.lat) &&
    !isNaN(point.lng)
  ) {
    return { address: point.address || "Unknown location", lat: point.lat, lng: point.lng };
  }
  // Return null to signal that this point has no usable coordinates.
  return null;
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
  console.log("\n=== BACKEND RECEIVED ===");
  console.log("Start lat:", req.body.pickup?.lat);
  console.log("Start lng:", req.body.pickup?.lng);
  console.log("Pickup address:", req.body.pickup?.address);
  console.log("Stops received:", req.body.stops?.map(s => ({
    address: s.address,
    lat: s.lat,
    lng: s.lng
  })));
  console.log("========================\n");

  const { pickup, stops, priority = "balanced", vehicle = "van", fuelPrice = 103 } = req.body;

  if (!pickup || !Array.isArray(stops) || stops.length === 0) {
    return res.status(400).json({ error: "Pickup and stops are required." });
  }

  // ── Fix #5: Validate coordinates BEFORE running the optimizer ────────────
  // Check pickup
  const startPoint = normalizePoint(pickup);
  if (!startPoint) {
    return res.status(400).json({
      error: `Pickup location "${pickup?.address || "(unknown)"}" is missing coordinates. Please select it from the autocomplete dropdown.`,
    });
  }

  // Check each stop
  const validStops = stops.filter((stop) => stop && stop.address && stop.address.trim());
  if (validStops.length === 0) {
    return res.status(400).json({ error: "At least one valid stop is required." });
  }

  const missingCoordStops = validStops.filter(
    (s) => typeof s.lat !== "number" || typeof s.lng !== "number" || isNaN(s.lat) || isNaN(s.lng)
  );
  if (missingCoordStops.length > 0) {
    const names = missingCoordStops.map((s) => `"${s.address}"`).join(", ");
    return res.status(400).json({
      error: `The following stop(s) are missing coordinates — please select them from the autocomplete dropdown: ${names}`,
    });
  }

  const normalizedStops = validStops.map((stop) => normalizePoint(stop));

  // Save original order for comparison
  const originalStops = normalizedStops.map((s, i) => ({
    label: `Stop ${i + 1}`,
    address: s.address,
    lat: s.lat,
    lng: s.lng,
  }));

  console.log("\n══════════════════════════════════════════════════════");
  console.log("  ROUTE OPTIMIZATION — Nearest Neighbour TSP");
  console.log("══════════════════════════════════════════════════════");
  console.log(`\n📍 Pickup: ${startPoint.address}  (lat=${startPoint.lat.toFixed(4)}, lng=${startPoint.lng.toFixed(4)})`);
  console.log("\n📋 ORIGINAL ORDER (as entered by user):");
  normalizedStops.forEach((s, i) =>
    console.log(`   [${i + 1}] ${s.address}  (lat=${s.lat.toFixed(4)}, lng=${s.lng.toFixed(4)})`)
  );

  // Run Nearest Neighbour TSP directly on stop objects, starting from pickup coords
  const optimizedStops = nearestNeighbourTSP(normalizedStops, startPoint.lat, startPoint.lng);

  console.log("\n✅ OPTIMIZED ORDER (Nearest Neighbour TSP):");
  optimizedStops.forEach((s, i) =>
    console.log(`   [${i + 1}] ${s.address}  (lat=${s.lat.toFixed(4)}, lng=${s.lng.toFixed(4)})`)
  );

  const wasReordered = optimizedStops.some((s, i) => s.address.trim().toLowerCase() !== normalizedStops[i]?.address.trim().toLowerCase());
  console.log(wasReordered ? "\n🔄 Order WAS resequenced by TSP!" : "\n✔️  Order unchanged — stops were already in optimal sequence.");
  console.log("══════════════════════════════════════════════════════\n");

  const stats = buildRouteStats(startPoint, optimizedStops, { priority, vehicle, fuelPrice });
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

  return res.json({
    success: true,
    wasReordered,
    originalStops,
    optimizedStops: stats.orderedStops,
    pickup: startPoint,
    ...mergedStats,
  });
});

export default router;
