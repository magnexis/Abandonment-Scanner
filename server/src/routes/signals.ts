import express from "express";
import { createSignal, listNearbySignals, listSignals } from "../db/sqlite.js";

const router = express.Router();

router.post("/signals", async (req, res) => {
  try {
    const { lat, lng, description, confidence } = req.body ?? {};

    if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) {
      res.status(400).json({ error: "lat and lng must be valid numbers." });
      return;
    }

    if (typeof description !== "string" || !description.trim()) {
      res.status(400).json({ error: "description is required." });
      return;
    }

    if (!Number.isFinite(Number(confidence))) {
      res.status(400).json({ error: "confidence must be a valid number." });
      return;
    }

    const result = await createSignal({
      lat: Number(lat),
      lng: Number(lng),
      description,
      confidence: Number(confidence)
    });

    res.status(201).json({ data: result });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Unable to store signal." });
  }
});

router.get("/signals", async (_req, res) => {
  try {
    res.json({ data: await listSignals() });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Unable to load signals." });
  }
});

router.get("/signals/nearby", async (req, res) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const radiusMeters = Number(req.query.radiusMeters ?? req.query.radius ?? 500);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      res.status(400).json({ error: "lat and lng query parameters are required." });
      return;
    }

    res.json({ data: await listNearbySignals(lat, lng, radiusMeters) });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Unable to load nearby signals." });
  }
});

export default router;
