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
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ──────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    // Allow localhost (dev) and any Vercel deployment URL
    if (
      !origin ||
      /^http:\/\/localhost:\d+$/.test(origin) ||
      /\.vercel\.app$/.test(origin)
    ) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
}));
app.use(express.json());

// ── Routes ─────────────────────────────────────────────────
app.use("/api/routes", routesApi);
app.use("/api/fleet", fleetApi);
app.use("/api/nearby", nearbyApi);

// ── AI Chat Assistant Proxy ──────────────────────────────────
app.post("/api/chat", async (req, res) => {
  const { message } = req.body;
  const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;

  if (!NVIDIA_API_KEY) {
    console.error("DEBUG: NVIDIA_API_KEY is missing in process.env");
    return res.status(500).json({ error: "NVIDIA API Key not configured on server. Please check backend/.env" });
  }

  try {
    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NVIDIA_API_KEY}`
      },
      body: JSON.stringify({
        model: 'meta/llama-3.1-8b-instruct',
        messages: [
          {
            role: 'system',
            content: 'You are SmartRoute AI Assistant, a delivery route optimization expert. Help delivery boys with route planning, fuel saving tips, traffic advice, and delivery optimization. Keep answers short and practical.'
          },
          { role: 'user', content: message }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || `API error: ${response.status}`);
    }

    res.json({ reply: data.choices[0].message.content });
  } catch (error) {
    console.error("Chat proxy error:", error);
    res.status(500).json({ error: error.message });
  }
});
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