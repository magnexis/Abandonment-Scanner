import express from "express";
import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
import multer from "multer";
import type { ReportSummary } from "../../../shared/src/index.js";
import { env } from "../config/env.js";
import {
  createReport,
  getBuilding,
  getBuildings,
  getDashboard,
  getHeatmap,
  getReportsForBuilding,
  scanArea,
  scanLocation,
  searchBuildings,
  voteOnBuilding
} from "../services/buildingService.js";
import { getRoute } from "../services/routingService.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    fs.mkdirSync(env.uploadsPath, { recursive: true });
    callback(null, env.uploadsPath);
  },
  filename: (_req, file, callback) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "-").toLowerCase();
    callback(null, `${Date.now()}-${safeName}`);
  }
});

const upload = multer({ storage });

router.get("/health", (_req, res) => {
  res.json({ data: { ok: true, service: "abandonment-scanner-api" } });
});

router.get("/buildings", async (_req, res) => {
  res.json({ data: await getBuildings() });
});

router.get("/locations", async (_req, res) => {
  res.json({ data: await getBuildings() });
});

router.get("/buildings/:id", async (req, res) => {
  const building = await getBuilding(req.params.id);
  if (!building) {
    res.status(404).json({ error: "Building not found" });
    return;
  }

  const reports = await getReportsForBuilding(building.id);
  res.json({ data: { building, reports } });
});

router.get("/dashboard", async (_req, res) => {
  res.json({ data: await getDashboard() });
});

router.get("/heatmap", async (_req, res) => {
  res.json({ data: await getHeatmap() });
});

router.get("/search", async (req, res) => {
  const query = typeof req.query.q === "string" ? req.query.q : "";
  res.json({ data: await searchBuildings(query) });
});

router.post("/scan", async (req, res) => {
  res.json({ data: await scanLocation(req.body) });
});

router.post("/scan-area", async (req, res) => {
  res.json({ data: await scanArea(req.body.center) });
});

router.post("/route", async (req, res) => {
  const route = await getRoute(req.body.from, req.body.to, req.body.profile ?? "driving");
  res.json({ data: route });
});

router.post("/reports", upload.single("image"), async (req, res) => {
  const imageFile = req.file;
  const imageUrl = imageFile ? `/uploads/${path.basename(imageFile.path)}` : req.body.imageUrl;

  const report: ReportSummary = {
    id: crypto.randomUUID(),
    buildingId: req.body.buildingId,
    reporter: req.body.reporter || "Anonymous",
    summary: req.body.summary,
    severity: req.body.severity,
    imageUrl,
    createdAt: new Date().toISOString()
  };

  res.status(201).json({ data: await createReport(report) });
});

router.post("/report", upload.single("image"), async (req, res) => {
  const imageFile = req.file;
  const imageUrl = imageFile ? `/uploads/${path.basename(imageFile.path)}` : req.body.imageUrl;

  const report: ReportSummary = {
    id: crypto.randomUUID(),
    buildingId: req.body.buildingId,
    reporter: req.body.reporter || "Anonymous",
    summary: req.body.summary,
    severity: req.body.severity,
    imageUrl,
    createdAt: new Date().toISOString()
  };

  res.status(201).json({ data: await createReport(report) });
});

router.post("/votes", async (req, res) => {
  const totals = await voteOnBuilding(req.body.buildingId, req.body.direction);
  res.json({ data: totals });
});

export default router;
