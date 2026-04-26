// server.js — THE MAIN FILE
// This starts your Express server and connects all routes.

import express from "express";
import cors from "cors";
import optimizeRoute from "./routes/optimize.js";

const app = express();
const PORT = 3001;

// ── Middleware ──────────────────────────────────────────────
app.use(cors({ origin: "http://localhost:8080" }));
app.use(express.json());

// ── Routes ─────────────────────────────────────────────────
// All requests to /api/optimize-route are handled by optimize.js
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