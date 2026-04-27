import express from "express";
import data from "../data-store.js";

const router = express.Router();

const toRadians = (value) => (value * Math.PI) / 180;
const haversineKm = (a, b) => {
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const dLat = toRadians(b.lat - a.lat);
  const dLon = toRadians(b.lng - a.lng);
  const hav = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(hav), Math.sqrt(1 - hav));
};

router.get("/", (req, res) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);

  if (!lat || !lng) return res.status(400).json({ error: "Latitude and longitude are required." });

  const suggestions = [
    { id: "nearby-1", address: "Ferry Street Pickup", lat: lat + 0.015, lng: lng + 0.018 },
    { id: "nearby-2", address: "Maple Logistics Center", lat: lat - 0.014, lng: lng + 0.02 },
    { id: "nearby-3", address: "Union Avenue Warehouse", lat: lat + 0.02, lng: lng - 0.016 },
    { id: "nearby-4", address: "Broadway Dispatch Hub", lat: lat - 0.022, lng: lng - 0.013 },
  ].map((stop) => ({
    ...stop,
    distanceKm: Number(haversineKm({ lat, lng }, stop).toFixed(1)),
  }));

  res.json(suggestions);
});

router.post("/import", (req, res) => {
  const stop = req.body;
  if (!stop || !stop.id) return res.status(400).json({ error: "Nearby stop data is required." });
  data.history.push({
    id: `import-${stop.id}-${Date.now()}`,
    name: `Nearby import ${stop.address}`,
    route: {
      pickup: { label: "Imported pickup", address: stop.address, lat: stop.lat, lng: stop.lng },
      orderedStops: [],
      mapPoints: [],
      totalDistanceKm: 0,
      travelTimeMinutes: 0,
      fuelGallons: 0,
      fuelCost: 0,
      routeCost: 0,
      estimatedArrival: new Date().toISOString(),
      efficiency: 0,
      fuelSaved: 0,
    },
    createdAt: new Date().toISOString(),
  });

  res.status(201).json(stop);
});

export default router;
