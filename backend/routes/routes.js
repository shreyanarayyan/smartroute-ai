import express from "express";
import data from "../data-store.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.json(data.routes);
});

router.post("/", (req, res) => {
  const route = req.body;
  if (!route || !route.id) {
    return res.status(400).json({ error: "Route id and payload are required." });
  }

  data.routes.push(route);
  res.status(201).json(route);
});

router.put("/:id", (req, res) => {
  const { id } = req.params;
  const index = data.routes.findIndex((item) => item.id === id);
  if (index === -1) return res.status(404).json({ error: "Route not found." });

  data.routes[index] = { ...data.routes[index], ...req.body };
  res.json(data.routes[index]);
});

router.delete("/:id", (req, res) => {
  const { id } = req.params;
  data.routes = data.routes.filter((item) => item.id !== id);
  res.status(204).send();
});

router.get("/:id", (req, res) => {
  const { id } = req.params;
  const route = data.routes.find((item) => item.id === id);
  if (!route) return res.status(404).json({ error: "Route not found." });
  res.json(route);
});

export default router;
