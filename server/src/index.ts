import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { initDatabase } from "./db/database.js";
import apiRouter from "./routes/api.js";
import signalsRouter from "./routes/signals.js";

const start = async () => {
  await initDatabase();

  const app = express();
  app.use(cors({ origin: env.clientOrigin, credentials: true }));
  app.use(express.json({ limit: "2mb" }));
  app.use("/uploads", express.static(env.uploadsPath));
  app.use("/api", apiRouter);
  app.use("/api", signalsRouter);

  app.listen(env.port, () => {
    console.log(`Abandonment Scanner API listening on http://localhost:${env.port}`);
  });
};

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
