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

router.get("/", async (req, res) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);

  if (!lat || !lng) return res.status(400).json({ error: "Latitude and longitude are required." });

  try {
    // Overpass QL to find nearby shops, cafes, offices within 3km
    const query = `
      [out:json][timeout:10];
      (
        node["shop"](around:3000,${lat},${lng});
        node["amenity"~"cafe|restaurant|fast_food|bank|clinic"](around:3000,${lat},${lng});
        node["office"](around:3000,${lat},${lng});
      );
      out body 5;
    `;
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch from Overpass");
    
    const data = await response.json();
    
    if (!data.elements || data.elements.length === 0) {
      return res.json([]);
    }

    // Map Overpass elements to our suggestion format
    const suggestions = data.elements.map((el) => {
      const name = el.tags?.name || el.tags?.shop || el.tags?.amenity || "Busy Location";
      const amenity = el.tags?.amenity ? ` (${el.tags.amenity})` : "";
      return {
        id: `osm-${el.id}`,
        address: `${name}${amenity}`,
        lat: el.lat,
        lng: el.lon,
        distanceKm: Number(haversineKm({ lat, lng }, { lat: el.lat, lng: el.lon }).toFixed(1)),
      };
    })
    // Sort by nearest
    .sort((a, b) => a.distanceKm - b.distanceKm)
    // Return top 4
    .slice(0, 4);

    res.json(suggestions);
  } catch (err) {
    console.error("Overpass API error:", err.message);
    // Fallback if Overpass fails
    res.json([]);
  }
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
