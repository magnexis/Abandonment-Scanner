import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import initSqlJs, { type Database, type SqlJsStatic } from "sql.js";
import type { BuildingRecord, ReportSummary } from "../../../shared/src/index.js";
import { env } from "../config/env.js";
import { seedBuildings } from "../data/seedBuildings.js";

let sql: SqlJsStatic | null = null;
let database: Database | null = null;

const ensureFolder = (filePath: string) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
};

const createSchema = (db: Database) => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS buildings (
      id TEXT PRIMARY KEY,
      payload TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      building_id TEXT NOT NULL,
      payload TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS votes (
      id TEXT PRIMARY KEY,
      building_id TEXT NOT NULL,
      direction TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS scans (
      id TEXT PRIMARY KEY,
      building_id TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS signals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      latitude REAL,
      longitude REAL,
      description TEXT,
      confidence INTEGER,
      score INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
};

const persist = () => {
  if (!database) return;
  ensureFolder(env.databasePath);
  fs.writeFileSync(env.databasePath, Buffer.from(database.export()));
};

const loadDb = async () => {
  if (!sql) {
    sql = await initSqlJs({});
  }

  if (database) {
    return database;
  }

  ensureFolder(env.databasePath);
  if (fs.existsSync(env.databasePath)) {
    database = new sql.Database(fs.readFileSync(env.databasePath));
  } else {
    database = new sql.Database();
  }

  createSchema(database);

  const existing = database.exec("SELECT COUNT(*) as count FROM buildings");
  const count = Number(existing[0]?.values[0]?.[0] ?? 0);
  if (count === 0) {
    const insert = database.prepare("INSERT INTO buildings (id, payload) VALUES (?, ?)");
    seedBuildings.forEach((building) => insert.run([building.id, JSON.stringify(building)]));
    insert.free();
    persist();
  }

  return database;
};

const parseRows = <T>(statement: ReturnType<Database["prepare"]>): T[] => {
  const rows: T[] = [];
  while (statement.step()) {
    rows.push(statement.getAsObject() as T);
  }
  statement.free();
  return rows;
};

export const initDatabase = async () => {
  await loadDb();
  fs.mkdirSync(env.uploadsPath, { recursive: true });
};

export const getDatabase = async () => loadDb();

export const persistDatabase = () => {
  persist();
};

export const listBuildings = async (): Promise<BuildingRecord[]> => {
  const db = await loadDb();
  const statement = db.prepare("SELECT payload FROM buildings");
  const rows = parseRows<{ payload: string }>(statement);
  return rows.map((row) => JSON.parse(row.payload) as BuildingRecord);
};

export const upsertBuilding = async (building: BuildingRecord) => {
  const db = await loadDb();
  const statement = db.prepare(`
    INSERT INTO buildings (id, payload) VALUES (?, ?)
    ON CONFLICT(id) DO UPDATE SET payload = excluded.payload
  `);
  statement.run([building.id, JSON.stringify(building)]);
  statement.free();
  persist();
};

export const findBuilding = async (id: string) => {
  const db = await loadDb();
  const statement = db.prepare("SELECT payload FROM buildings WHERE id = ?");
  statement.bind([id]);
  const found = statement.step() ? (statement.getAsObject() as { payload: string }) : null;
  statement.free();
  return found ? (JSON.parse(found.payload) as BuildingRecord) : null;
};

export const recordScan = async (buildingId: string) => {
  const db = await loadDb();
  const statement = db.prepare("INSERT INTO scans (id, building_id, created_at) VALUES (?, ?, ?)");
  statement.run([crypto.randomUUID(), buildingId, new Date().toISOString()]);
  statement.free();
  persist();
};

export const listReports = async (buildingId?: string): Promise<ReportSummary[]> => {
  const db = await loadDb();
  const statement = buildingId
    ? db.prepare("SELECT payload FROM reports WHERE building_id = ?")
    : db.prepare("SELECT payload FROM reports");
  if (buildingId) {
    statement.bind([buildingId]);
  }
  const rows = parseRows<{ payload: string }>(statement);
  return rows.map((row) => JSON.parse(row.payload) as ReportSummary);
};

export const addReport = async (report: ReportSummary) => {
  const db = await loadDb();
  const statement = db.prepare("INSERT INTO reports (id, building_id, payload) VALUES (?, ?, ?)");
  statement.run([report.id, report.buildingId, JSON.stringify(report)]);
  statement.free();
  persist();
};

export const addVote = async (buildingId: string, direction: "up" | "down") => {
  const db = await loadDb();
  const statement = db.prepare("INSERT INTO votes (id, building_id, direction, created_at) VALUES (?, ?, ?, ?)");
  statement.run([crypto.randomUUID(), buildingId, direction, new Date().toISOString()]);
  statement.free();
  persist();
};

export const getVoteTotals = async () => {
  const db = await loadDb();
  const statement = db.prepare(`
    SELECT building_id as buildingId,
      SUM(CASE WHEN direction = 'up' THEN 1 ELSE 0 END) as upVotes,
      SUM(CASE WHEN direction = 'down' THEN 1 ELSE 0 END) as downVotes
    FROM votes
    GROUP BY building_id
  `);
  return parseRows<{ buildingId: string; upVotes: number; downVotes: number }>(statement);
};

export const getScanMetrics = async () => {
  const db = await loadDb();
  const scansStatement = db.prepare("SELECT COUNT(*) as totalScans FROM scans");
  const reportsStatement = db.prepare(`
    SELECT COUNT(*) as reportsToday
    FROM reports
    WHERE json_extract(payload, '$.createdAt') >= datetime('now', '-1 day')
  `);

  const totalScans = parseRows<{ totalScans: number }>(scansStatement)[0]?.totalScans ?? 0;
  const reportsToday = parseRows<{ reportsToday: number }>(reportsStatement)[0]?.reportsToday ?? 0;
  return { totalScans: Number(totalScans), reportsToday: Number(reportsToday) };
};
