export type AbandonmentStatus = "Active" | "Suspicious" | "Likely Abandoned";

export type RiskLevel = "Low" | "Moderate" | "High";
export type ConfidenceLevel = "Low" | "Medium" | "High";
export type LocationClassification =
  | "industrial"
  | "commercial"
  | "warehouse"
  | "abandoned"
  | "residential"
  | "mixed"
  | "unknown";

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface ScoreFactor {
  key: string;
  label: string;
  impact: number;
  value: string;
  confidence: number;
}

export interface ReportSummary {
  id: string;
  buildingId: string;
  reporter: string;
  summary: string;
  severity: "low" | "medium" | "high";
  imageUrl?: string;
  createdAt: string;
}

export interface SignalAnalysis {
  abandonment_score: number;
  risk_level: "low" | "medium" | "high";
  reasoning: string;
}

export interface SignalRecord {
  id: number;
  latitude: number;
  longitude: number;
  description: string;
  confidence: number;
  score: number;
  createdAt: string;
  riskLevel: "low" | "medium" | "high";
  reasoning: string;
}

export interface SubmitSignalRequest {
  lat: number;
  lng: number;
  description: string;
  confidence: number;
}

export interface PlaceIntelligence {
  name: string;
  type: "industrial" | "commercial" | "residential" | "unknown";
  category: string;
  confidence: number;
  notes: string;
}

export interface RouteResult {
  profile: "driving" | "walking";
  distanceKm: number;
  durationMinutes: number;
  geometry: [number, number][];
  provider: string;
  warning?: string;
}

export interface ResolvedLocation {
  coordinates: Coordinates;
  fullAddress: string;
  city: string;
  state: string;
  country: string;
  label: string;
  classification: LocationClassification;
  scanAllowed: boolean;
  placeIntelligence?: PlaceIntelligence;
}

export interface HeatmapPoint {
  id: string;
  coordinates: Coordinates;
  score: number;
  intensity: number;
  color: string;
  radiusMeters: number;
}

export interface BuildingRecord {
  id: string;
  name: string;
  address: string;
  fullAddress: string;
  city: string;
  state: string;
  country: string;
  coordinates: Coordinates;
  abandonmentScore: number;
  status: AbandonmentStatus;
  riskLevel: RiskLevel;
  confidence: ConfidenceLevel;
  lastSaleDate: string;
  lastKnownActivity: string;
  reportsCount: number;
  activityLevel: number;
  imageUrl: string;
  thumbnailUrl: string;
  conditionSummary: string;
  explorerNote: string;
  factorHighlights: string[];
  factors: ScoreFactor[];
  routeHint: string;
  similarIds: string[];
}

export interface DashboardStats {
  totalBuildings: number;
  averageScore: number;
  recentScans: number;
  reportsToday: number;
  mostAbandoned: BuildingRecord[];
  recentBuildings: BuildingRecord[];
}

export interface ScanRequest {
  query?: string;
  coordinates?: Coordinates;
  radiusMeters?: number;
}

export interface ScanResponse {
  building: BuildingRecord;
  nearby: BuildingRecord[];
  routePreviewOrigin: Coordinates;
  location: ResolvedLocation;
  heatmap: HeatmapPoint[];
  scanRadiusMeters: number;
  residentialFiltered: boolean;
}

export interface SearchSuggestion {
  id: string;
  label: string;
  subtitle: string;
  coordinates: Coordinates;
}

export interface ReportInput {
  buildingId: string;
  reporter: string;
  summary: string;
  severity: "low" | "medium" | "high";
  imageUrl?: string;
}

export interface VoteInput {
  buildingId: string;
  direction: "up" | "down";
}

export interface ApiEnvelope<T> {
  data: T;
}
