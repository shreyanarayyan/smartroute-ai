// server.js — THE MAIN FILE
// This starts your Express server and connects all routes.

import express from "express";
import cors from "cors";
import optimizeRoute from "./routes/optimize.js";
import routesApi from "./routes/routes.js";
import fleetApi from "./routes/fleet.js";
import nearbyApi from "./routes/nearby.js";
import historyApi from "./routes/history.js";
import analyticsApi from "./routes/analytics.js";

const app = express();
const PORT = 3001;

// ── Middleware ──────────────────────────────────────────────
app.use(cors({ origin: ["http://localhost:8080", "http://localhost:8081", "http://localhost:8082"] }));
app.use(express.json());

// ── Routes ─────────────────────────────────────────────────
app.use("/api/routes", routesApi);
app.use("/api/fleet", fleetApi);
app.use("/api/nearby", nearbyApi);
app.use("/api/history", historyApi);
app.use("/api/analytics", analyticsApi);
app.use('/api', optimizeRoute);

// ── Health check ───────────────────────────────────────────
// Visit http://localhost:3001/ to confirm the server is running
app.get('/', (req, res) => {
  res.json({ message: 'SmartRoute AI backend is running!' });
});

// ── Start server ───────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`SmartRoute AI backend running on http://localhost:${PORT}`);
});