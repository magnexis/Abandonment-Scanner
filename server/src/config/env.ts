import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../../..");

dotenv.config({ path: path.resolve(repoRoot, ".env") });
dotenv.config();

const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const env = {
  port: toNumber(process.env.PORT, 4000),
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
  databasePath: process.env.DATABASE_PATH ?? path.resolve(repoRoot, "server", "data", "abandonment-scanner.sqlite"),
  uploadsPath: process.env.UPLOADS_PATH ?? path.resolve(repoRoot, "server", "uploads")
};
