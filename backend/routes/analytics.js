import express from "express";
import data from "../data-store.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.json(data.analytics);
});

router.get("/prediction-insights", (req, res) => {
  res.json({
    averagePredictionAccuracy: 87,
    estimatedTimeReduction: 14,
    fuelEfficiencyGain: 11,
    clusterCount: 3,
    mlScoreTrend: [72, 76, 79, 82, 85],
  });
});

export default router;
