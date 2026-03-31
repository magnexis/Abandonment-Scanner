import type {
  BuildingRecord,
  DashboardStats,
  HeatmapPoint,
  ReportSummary,
  RouteResult,
  ScanResponse,
  SearchSuggestion,
  SignalAnalysis,
  SignalRecord
} from "@shared/index";
import type { Coordinates, SubmitSignalRequest } from "@shared/index";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api";

async function unwrap<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const payload = await response.text();
    throw new Error(payload || "Request failed");
  }

  const json = (await response.json()) as { data: T };
  return json.data;
}

export const api = {
  async getBuildings() {
    return unwrap<BuildingRecord[]>(await fetch(`${API_BASE}/locations`));
  },
  async getDashboard() {
    return unwrap<DashboardStats>(await fetch(`${API_BASE}/dashboard`));
  },
  async getBuilding(id: string) {
    return unwrap<{ building: BuildingRecord; reports: ReportSummary[] }>(await fetch(`${API_BASE}/buildings/${id}`));
  },
  async search(query: string) {
    return unwrap<SearchSuggestion[]>(await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`));
  },
  async scan(payload: { query?: string; coordinates?: Coordinates; radiusMeters?: number }) {
    return unwrap<ScanResponse>(
      await fetch(`${API_BASE}/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
    );
  },
  async scanArea(center: Coordinates) {
    return unwrap<BuildingRecord[]>(
      await fetch(`${API_BASE}/scan-area`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ center })
      })
    );
  },
  async getHeatmap() {
    return unwrap<HeatmapPoint[]>(await fetch(`${API_BASE}/heatmap`));
  },
  async route(payload: { from: Coordinates; to: Coordinates; profile: "driving" | "walking" }) {
    return unwrap<RouteResult>(
      await fetch(`${API_BASE}/route`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
    );
  },
  async submitReport(input: {
    buildingId: string;
    reporter: string;
    summary: string;
    severity: "low" | "medium" | "high";
    file?: File | null;
  }) {
    const form = new FormData();
    form.append("buildingId", input.buildingId);
    form.append("reporter", input.reporter);
    form.append("summary", input.summary);
    form.append("severity", input.severity);
    if (input.file) {
      form.append("image", input.file);
    }

    return unwrap<ReportSummary>(
      await fetch(`${API_BASE}/report`, {
        method: "POST",
        body: form
      })
    );
  },
  async submitSignal(payload: SubmitSignalRequest) {
    return unwrap<{ signal: SignalRecord; analysis: SignalAnalysis }>(
      await fetch(`${API_BASE}/signals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
    );
  },
  async getSignals() {
    return unwrap<SignalRecord[]>(await fetch(`${API_BASE}/signals`));
  },
  async getNearbySignals(payload: { lat: number; lng: number; radiusMeters?: number }) {
    const query = new URLSearchParams({
      lat: String(payload.lat),
      lng: String(payload.lng),
      radiusMeters: String(payload.radiusMeters ?? 500)
    });
    return unwrap<SignalRecord[]>(await fetch(`${API_BASE}/signals/nearby?${query.toString()}`));
  },
  async vote(buildingId: string, direction: "up" | "down") {
    return unwrap(
      await fetch(`${API_BASE}/votes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buildingId, direction })
      })
    );
  }
};
