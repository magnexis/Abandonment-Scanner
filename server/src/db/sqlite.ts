import type { SignalAnalysis, SignalRecord, SubmitSignalRequest } from "../../../shared/src/index.js";
import { getDatabase, persistDatabase } from "./database.js";
import { analyzeSignal } from "../services/analyzer.js";
import { distanceKm } from "../utils/geo.js";

type SignalRow = {
  id: number;
  latitude: number;
  longitude: number;
  description: string;
  confidence: number;
  score: number;
  created_at: string;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const mapSignalRow = (row: SignalRow, analysis?: SignalAnalysis): SignalRecord => {
  const evaluated = analysis ?? analyzeSignal(row.description, Number(row.confidence));

  return {
    id: Number(row.id),
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    description: row.description,
    confidence: Number(row.confidence),
    score: Number(row.score),
    createdAt: String(row.created_at),
    riskLevel: evaluated.risk_level,
    reasoning: evaluated.reasoning
  };
};

const parseRows = <T>(statement: { step: () => boolean; getAsObject: () => unknown; free: () => void }) => {
  const rows: T[] = [];
  while (statement.step()) {
    rows.push(statement.getAsObject() as T);
  }
  statement.free();
  return rows;
};

export const createSignal = async (input: SubmitSignalRequest) => {
  const db = await getDatabase();
  const normalized: SubmitSignalRequest = {
    lat: Number(input.lat),
    lng: Number(input.lng),
    description: input.description.trim(),
    confidence: clamp(Math.round(Number(input.confidence)), 0, 100)
  };

  const analysis = analyzeSignal(normalized.description, normalized.confidence);
  const insert = db.prepare(`
    INSERT INTO signals (latitude, longitude, description, confidence, score)
    VALUES (?, ?, ?, ?, ?)
  `);
  insert.run([
    normalized.lat,
    normalized.lng,
    normalized.description,
    normalized.confidence,
    analysis.abandonment_score
  ]);
  insert.free();

  const idResult = db.exec("SELECT last_insert_rowid() as id");
  const insertedId = Number(idResult[0]?.values?.[0]?.[0] ?? 0);
  const select = db.prepare(`
    SELECT id, latitude, longitude, description, confidence, score, created_at
    FROM signals
    WHERE id = ?
  `);
  select.bind([insertedId]);
  const row = select.step() ? (select.getAsObject() as SignalRow) : null;
  select.free();

  persistDatabase();

  if (!row) {
    throw new Error("Signal was saved, but the stored record could not be loaded.");
  }

  return {
    signal: mapSignalRow(row, analysis),
    analysis
  };
};

export const listSignals = async (): Promise<SignalRecord[]> => {
  const db = await getDatabase();
  const statement = db.prepare(`
    SELECT id, latitude, longitude, description, confidence, score, created_at
    FROM signals
    ORDER BY datetime(created_at) DESC, id DESC
  `);

  return parseRows<SignalRow>(statement).map((row) =>
    mapSignalRow(row, {
      ...analyzeSignal(row.description, Number(row.confidence)),
      abandonment_score: Number(row.score)
    })
  );
};

export const listNearbySignals = async (lat: number, lng: number, radiusMeters: number): Promise<SignalRecord[]> => {
  const center = { lat: Number(lat), lng: Number(lng) };
  const radiusKm = clamp(Number(radiusMeters) / 1000, 0.05, 50);
  const signals = await listSignals();

  return signals.filter((signal) => {
    return distanceKm(center, { lat: signal.latitude, lng: signal.longitude }) <= radiusKm;
  });
};
