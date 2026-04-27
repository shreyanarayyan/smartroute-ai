import express from "express";
import data from "../data-store.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.json(data.fleet);
});

router.post("/", (req, res) => {
  const vehicle = req.body;
  if (!vehicle || !vehicle.id) {
    return res.status(400).json({ error: "Vehicle id and payload are required." });
  }

  data.fleet.push(vehicle);
  res.status(201).json(vehicle);
});

router.put("/:id", (req, res) => {
  const { id } = req.params;
  const index = data.fleet.findIndex((item) => item.id === id);
  if (index === -1) return res.status(404).json({ error: "Vehicle not found." });

  data.fleet[index] = { ...data.fleet[index], ...req.body };
  res.json(data.fleet[index]);
});

router.delete("/:id", (req, res) => {
  const { id } = req.params;
  data.fleet = data.fleet.filter((item) => item.id !== id);
  res.status(204).send();
});

export default router;
