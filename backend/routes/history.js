import express from "express";
import data from "../data-store.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.json(data.history);
});

router.post("/", (req, res) => {
  const entry = req.body;
  if (!entry || !entry.id) {
    return res.status(400).json({ error: "History entry id and payload are required." });
  }

  data.history.push(entry);
  res.status(201).json(entry);
});

export default router;
