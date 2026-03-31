import type {
  BuildingRecord,
  Coordinates,
  DashboardStats,
  HeatmapPoint,
  LocationClassification,
  PlaceIntelligence,
  ReportSummary,
  ResolvedLocation,
  RouteResult,
  ScanResponse,
  SearchSuggestion
} from "../../../shared/src/index.js";
import { calculateAbandonmentScore, getConfidenceLevel } from "../../../shared/src/index.js";
import {
  addReport,
  addVote,
  findBuilding,
  getScanMetrics,
  getVoteTotals,
  listBuildings,
  listReports,
  recordScan,
  upsertBuilding
} from "../db/database.js";
import { reverseGeocode, searchGeocodedLocations } from "./geocodingService.js";
import { enrichLocation } from "./placeIntelligenceService.js";
import { distanceKm, jitterCoordinates, offsetWithinRadius } from "../utils/geo.js";

const DEFAULT_SCAN_RADIUS_METERS = 500;
const MIN_SCAN_RADIUS_METERS = 100;
const MAX_SCAN_RADIUS_METERS = 2000;

const byScoreDescending = (a: BuildingRecord, b: BuildingRecord) => b.abandonmentScore - a.abandonmentScore;

const highlightLabelByFactorKey: Record<string, string> = {
  activity: "No recent activity",
  windows: "Visible decay patterns",
  reports: "Multiple user reports",
  vegetation: "Overgrown vegetation",
  permits: "Low permit and utility activity",
  "last-sale": "No recent sale turnover"
};

const scanProfiles: Record<
  LocationClassification,
  {
    prefix: string;
    yearsSinceSale: [number, number];
    vegetationLevel: [number, number];
    brokenWindowsLevel: [number, number];
    activityAbsenceLevel: [number, number];
    reportWeight: [number, number];
    permitGapLevel: [number, number];
    scoreCap?: number;
  }
> = {
  industrial: {
    prefix: "Industrial",
    yearsSinceSale: [8, 18],
    vegetationLevel: [0.4, 0.9],
    brokenWindowsLevel: [0.45, 0.95],
    activityAbsenceLevel: [0.45, 0.95],
    reportWeight: [4, 12],
    permitGapLevel: [0.35, 0.95]
  },
  commercial: {
    prefix: "Commercial",
    yearsSinceSale: [5, 14],
    vegetationLevel: [0.25, 0.75],
    brokenWindowsLevel: [0.25, 0.75],
    activityAbsenceLevel: [0.3, 0.8],
    reportWeight: [2, 9],
    permitGapLevel: [0.2, 0.7]
  },
  warehouse: {
    prefix: "Warehouse",
    yearsSinceSale: [9, 22],
    vegetationLevel: [0.35, 0.85],
    brokenWindowsLevel: [0.4, 0.95],
    activityAbsenceLevel: [0.45, 0.95],
    reportWeight: [4, 12],
    permitGapLevel: [0.35, 0.95]
  },
  abandoned: {
    prefix: "Abandoned",
    yearsSinceSale: [10, 24],
    vegetationLevel: [0.45, 0.95],
    brokenWindowsLevel: [0.5, 1],
    activityAbsenceLevel: [0.55, 1],
    reportWeight: [5, 12],
    permitGapLevel: [0.45, 1]
  },
  residential: {
    prefix: "Residential",
    yearsSinceSale: [0.5, 4],
    vegetationLevel: [0.05, 0.25],
    brokenWindowsLevel: [0, 0.2],
    activityAbsenceLevel: [0.05, 0.25],
    reportWeight: [0, 2],
    permitGapLevel: [0, 0.2],
    scoreCap: 24
  },
  mixed: {
    prefix: "Mixed Use",
    yearsSinceSale: [3, 10],
    vegetationLevel: [0.15, 0.55],
    brokenWindowsLevel: [0.15, 0.55],
    activityAbsenceLevel: [0.2, 0.6],
    reportWeight: [1, 6],
    permitGapLevel: [0.1, 0.55]
  },
  unknown: {
    prefix: "Survey",
    yearsSinceSale: [4, 11],
    vegetationLevel: [0.15, 0.6],
    brokenWindowsLevel: [0.1, 0.6],
    activityAbsenceLevel: [0.15, 0.65],
    reportWeight: [1, 7],
    permitGapLevel: [0.1, 0.55]
  }
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const clampScanRadius = (value?: number) =>
  clamp(Math.round(value ?? DEFAULT_SCAN_RADIUS_METERS), MIN_SCAN_RADIUS_METERS, MAX_SCAN_RADIUS_METERS);

const getLocationLabel = (location: Pick<ResolvedLocation, "city" | "state">) =>
  [location.city, location.state].filter(Boolean).join(", ");

const interpolate = ([min, max]: [number, number], seed: number) => min + (max - min) * seed;

const deriveSummary = (score: number, reportsCount: number) => {
  if (score >= 80) {
    return `This structure shows strong indicators of abandonment, with severe inactivity, visible distress signals, and ${reportsCount} supporting report${reportsCount === 1 ? "" : "s"}.`;
  }
  if (score >= 55) {
    return `This property presents a credible abandonment pattern, with mixed decay evidence and ${reportsCount} community signal${reportsCount === 1 ? "" : "s"} increasing confidence.`;
  }
  return "This location has some inactivity markers, but current evidence still suggests intermittent maintenance or active use.";
};

const buildFactorHighlights = (factors: BuildingRecord["factors"]) =>
  [...factors]
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 3)
    .map((factor) => highlightLabelByFactorKey[factor.key] ?? factor.label);

const normalizeBuilding = (building: BuildingRecord): BuildingRecord => ({
  ...building,
  fullAddress:
    building.fullAddress ||
    `${building.address}, ${building.city}, ${building.state}, ${building.country || "United States"}`,
  country: building.country || "United States",
  confidence: building.confidence || getConfidenceLevel(building.abandonmentScore, building.factors),
  factorHighlights:
    building.factorHighlights?.length ? building.factorHighlights : buildFactorHighlights(building.factors),
  conditionSummary: building.conditionSummary || deriveSummary(building.abandonmentScore, building.reportsCount)
});

const uniqueById = (items: BuildingRecord[]) => {
  const map = new Map<string, BuildingRecord>();
  items.forEach((item) => map.set(item.id, item));
  return [...map.values()];
};

const toHeatColor = (score: number) => {
  if (score >= 70) return "#f85149";
  if (score >= 35) return "#d29922";
  return "#2ea44f";
};

const toHeatmapPoints = (buildings: BuildingRecord[]): HeatmapPoint[] =>
  uniqueById(buildings).map((building) => ({
    id: building.id,
    coordinates: building.coordinates,
    score: building.abandonmentScore,
    intensity: Number((building.abandonmentScore / 100).toFixed(2)),
    color: toHeatColor(building.abandonmentScore),
    radiusMeters: 220 + building.abandonmentScore * 12
  }));

const toResolvedLocationFromBuilding = (building: BuildingRecord): ResolvedLocation => ({
  coordinates: building.coordinates,
  fullAddress: building.fullAddress,
  city: building.city,
  state: building.state,
  country: building.country,
  label: building.address,
  classification: "unknown",
  scanAllowed: true
});

const applyPlaceIntelligenceToLocation = (
  location: ResolvedLocation,
  intelligence: PlaceIntelligence
): ResolvedLocation => ({
  ...location,
  classification: intelligence.type !== "unknown" ? intelligence.type : location.classification,
  scanAllowed: intelligence.type === "residential" ? false : location.scanAllowed,
  placeIntelligence: intelligence
});

const refineBuildingWithPlaceIntelligence = (
  building: BuildingRecord,
  intelligence: PlaceIntelligence & { adjustment: number; active: boolean }
) => {
  const nextScore = clamp(building.abandonmentScore + intelligence.adjustment, 0, 100);
  const nextStatus = nextScore >= 70 ? "Likely Abandoned" : nextScore >= 30 ? "Suspicious" : "Active";
  const nextRisk = nextScore >= 75 ? "High" : nextScore >= 45 ? "Moderate" : "Low";

  const nextHighlights = intelligence.active
    ? [...building.factorHighlights.filter((item) => item !== "Active place metadata detected"), "Active place metadata detected"].slice(0, 4)
    : [
        ...building.factorHighlights.filter((item) => item !== "Industrial context without active business tags"),
        ...(intelligence.type === "industrial" ? ["Industrial context without active business tags"] : [])
      ].slice(0, 4);

  return normalizeBuilding({
    ...building,
    abandonmentScore: nextScore,
    status: nextStatus,
    riskLevel: nextRisk,
    confidence: getConfidenceLevel(nextScore, building.factors),
    factorHighlights: nextHighlights,
    conditionSummary: `${building.conditionSummary} ${intelligence.notes}`.trim(),
    explorerNote: `${intelligence.name} identified as ${intelligence.category} (${intelligence.type}, ${intelligence.confidence}% confidence). ${intelligence.notes}`
  });
};

const buildSyntheticRecord = (
  label: string,
  coordinates: Coordinates,
  index: number,
  location: ResolvedLocation,
  classification: LocationClassification
): BuildingRecord => {
  const profile = scanProfiles[classification];
  const seed = Math.min(0.98, ((label.length + (index + 1) * 13) % 91) / 100);
  const scoreResult = calculateAbandonmentScore({
    yearsSinceSale: interpolate(profile.yearsSinceSale, seed),
    vegetationLevel: interpolate(profile.vegetationLevel, seed),
    brokenWindowsLevel: interpolate(profile.brokenWindowsLevel, seed),
    activityAbsenceLevel: interpolate(profile.activityAbsenceLevel, seed),
    reportWeight: interpolate(profile.reportWeight, seed),
    permitGapLevel: interpolate(profile.permitGapLevel, seed)
  });

  const score =
    typeof profile.scoreCap === "number"
      ? Math.min(scoreResult.score, profile.scoreCap)
      : scoreResult.score;

  const normalizedScore = calculateAbandonmentScore({
    yearsSinceSale: Math.min(interpolate(profile.yearsSinceSale, seed), 18),
    vegetationLevel: classification === "residential" ? 0.12 : interpolate(profile.vegetationLevel, seed),
    brokenWindowsLevel: classification === "residential" ? 0.08 : interpolate(profile.brokenWindowsLevel, seed),
    activityAbsenceLevel:
      classification === "residential" ? 0.12 : interpolate(profile.activityAbsenceLevel, seed),
    reportWeight: classification === "residential" ? 1 : interpolate(profile.reportWeight, seed),
    permitGapLevel: classification === "residential" ? 0.08 : interpolate(profile.permitGapLevel, seed)
  });

  const finalFactors = normalizedScore.factors;
  const finalScore = typeof profile.scoreCap === "number" ? Math.min(normalizedScore.score, score) : score;
  const finalConfidence = getConfidenceLevel(finalScore, finalFactors);

  return {
    id: `scan-${Date.now()}-${classification}-${index}`,
    name: `${profile.prefix} ${location.city} Candidate ${index + 1}`,
    address: location.label,
    fullAddress: location.fullAddress,
    city: location.city,
    state: location.state,
    country: location.country,
    coordinates,
    abandonmentScore: finalScore,
    status: finalScore >= 70 ? "Likely Abandoned" : finalScore >= 30 ? "Suspicious" : "Active",
    riskLevel: finalScore >= 75 ? "High" : finalScore >= 45 ? "Moderate" : "Low",
    confidence: finalConfidence,
    lastSaleDate: classification === "residential" ? "2023-05-12" : "2014-07-12",
    lastKnownActivity:
      classification === "residential"
        ? "Residential filter lowered the score and blocked high-abandonment classification."
        : "Generated within the selected scan radius using zoning-aware simulation heuristics.",
    reportsCount: classification === "residential" ? 0 : Math.round(2 + seed * 10),
    activityLevel: classification === "residential" ? 78 : Math.round(20 + (1 - seed) * 48),
    imageUrl:
      "https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=1200&q=80",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=600&q=80",
    conditionSummary:
      classification === "residential"
        ? "This location appears residential, so the scanner suppresses high-abandonment scoring to avoid false positives."
        : deriveSummary(finalScore, Math.round(2 + seed * 10)),
    explorerNote:
      classification === "residential"
        ? "Residential zoning detected. The radius scan returned low-confidence, low-risk output only."
        : `Radius scan generated this candidate near ${getLocationLabel(location)} with ${classification} bias.`,
    factorHighlights:
      classification === "residential"
        ? ["Residential filter applied", "False positive suppression", "Low-risk scoring bias"]
        : buildFactorHighlights(finalFactors),
    factors: finalFactors,
    routeHint:
      classification === "residential"
        ? "Residential area filtered. Route preview remains available, but the scan engine avoids elevated risk scoring here."
        : "Field validation recommended before using this location operationally. Route preview centers on the selected scan point.",
    similarIds: []
  };
};

const buildResidentialFilteredRecord = (coordinates: Coordinates, location: ResolvedLocation): BuildingRecord =>
  buildSyntheticRecord("Residential Filter", coordinates, 0, location, "residential");

const generateRadiusCandidates = (
  center: Coordinates,
  radiusMeters: number,
  location: ResolvedLocation,
  buildings: BuildingRecord[],
  selected?: BuildingRecord
) => {
  const normalizedBuildings = buildings.map(normalizeBuilding);
  const radiusKm = radiusMeters / 1000;
  const candidateCount = clamp(Math.round(radiusMeters / 250) + 2, 3, 8);

  const existing = normalizedBuildings
    .filter((building) => distanceKm(center, building.coordinates) <= radiusKm)
    .sort(byScoreDescending)
    .slice(0, 2);

  const classification = location.classification === "residential" ? "mixed" : location.classification;
  const generated = Array.from({ length: Math.max(0, candidateCount - existing.length) }, (_, index) =>
    buildSyntheticRecord(
      location.label || location.city || "Radius Scan",
      offsetWithinRadius(center, radiusMeters, index + 1),
      index + 1,
      location,
      classification
    )
  );

  const combined = uniqueById([...(selected ? [selected] : []), ...existing, ...generated]).sort(byScoreDescending);
  return combined.slice(0, candidateCount);
};

export const getBuildings = async () => {
  return (await listBuildings()).map(normalizeBuilding).sort(byScoreDescending);
};

export const getBuilding = async (id: string) => {
  const building = await findBuilding(id);
  return building ? normalizeBuilding(building) : null;
};

export const getDashboard = async (): Promise<DashboardStats> => {
  const buildings = (await listBuildings()).map(normalizeBuilding);
  const metrics = await getScanMetrics();

  const averageScore = Math.round(
    buildings.reduce((total, building) => total + building.abandonmentScore, 0) / Math.max(buildings.length, 1)
  );

  return {
    totalBuildings: buildings.length,
    averageScore,
    recentScans: metrics.totalScans,
    reportsToday: metrics.reportsToday,
    mostAbandoned: [...buildings].sort(byScoreDescending).slice(0, 3),
    recentBuildings: [...buildings].slice(0, 4)
  };
};

export const searchBuildings = async (query: string): Promise<SearchSuggestion[]> => {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return [];
  }

  const local = (await listBuildings())
    .map(normalizeBuilding)
    .filter((building) =>
      [building.name, building.address, building.city, building.state].some((field) =>
        field.toLowerCase().includes(trimmed)
      )
    )
    .slice(0, 6)
    .map((building) => ({
      id: building.id,
      label: building.name,
      subtitle: `${building.address}, ${building.city}, ${building.state}`,
      coordinates: building.coordinates
    }));

  if (local.length >= 4) {
    return local;
  }

  const remote = await searchGeocodedLocations(query);
  return [...local, ...remote].slice(0, 6);
};

export const scanLocation = async (input: {
  query?: string;
  coordinates?: Coordinates;
  radiusMeters?: number;
}): Promise<ScanResponse> => {
  const buildings = (await listBuildings()).map(normalizeBuilding);
  const query = input.query?.trim();
  const radiusMeters = clampScanRadius(input.radiusMeters);

  let selected: BuildingRecord | undefined;
  let location: ResolvedLocation | null = null;

  if (query) {
    selected = buildings.find((building) =>
      [building.name, building.address, building.city].some((field) =>
        field.toLowerCase().includes(query.toLowerCase())
      )
    );

    if (selected) {
      location = toResolvedLocationFromBuilding(selected);
    } else {
      const remote = await searchGeocodedLocations(query);
      if (remote[0]) {
        location = await reverseGeocode(remote[0].coordinates);
      }
    }
  }

  if (!selected && input.coordinates) {
    location = await reverseGeocode(input.coordinates);
    selected = [...buildings].sort(
      (a, b) => distanceKm(a.coordinates, input.coordinates!) - distanceKm(b.coordinates, input.coordinates!)
    )[0];
    if (selected && distanceKm(selected.coordinates, input.coordinates) > radiusMeters / 1000) {
      selected = undefined;
    }
  }

  const origin = input.coordinates ?? location?.coordinates ?? selected?.coordinates ?? { lat: 42.3314, lng: -83.0458 };
  const baseResolved = location ?? (await reverseGeocode(origin));
  const placeIntelligence = await enrichLocation(origin.lat, origin.lng, baseResolved);
  const resolved = applyPlaceIntelligenceToLocation(baseResolved, placeIntelligence);

  if (!resolved.scanAllowed) {
    const filtered = buildResidentialFilteredRecord(origin, resolved);
    return {
      building: filtered,
      nearby: [],
      routePreviewOrigin: { lat: origin.lat + 0.01, lng: origin.lng - 0.01 },
      location: resolved,
      heatmap: toHeatmapPoints(buildings),
      scanRadiusMeters: radiusMeters,
      residentialFiltered: true
    };
  }

  const candidates = generateRadiusCandidates(origin, radiusMeters, resolved, buildings, selected);
  const basePrimary =
    selected ?? candidates[0] ?? buildSyntheticRecord(query || resolved.city || "Explorer", origin, 0, resolved, resolved.classification);
  const primary = refineBuildingWithPlaceIntelligence(basePrimary, placeIntelligence);

  await upsertBuilding(primary);
  await recordScan(primary.id);

  const allBuildings = uniqueById([...buildings, ...candidates, primary]);
  return {
    building: primary,
    nearby: candidates.filter((candidate) => candidate.id !== primary.id),
    routePreviewOrigin: { lat: origin.lat + 0.01, lng: origin.lng - 0.01 },
    location: resolved,
    heatmap: toHeatmapPoints(allBuildings),
    scanRadiusMeters: radiusMeters,
    residentialFiltered: false
  };
};

export const scanArea = async (center: Coordinates) => {
  const buildings = (await listBuildings()).map(normalizeBuilding);
  const nearby = buildings.filter((building) => distanceKm(center, building.coordinates) <= 25);

  if (nearby.length >= 3) {
    return nearby.slice(0, 5);
  }

  const resolved = await reverseGeocode(center);
  const generated = Array.from({ length: 4 }, (_, index) =>
    buildSyntheticRecord("Area Scan", jitterCoordinates(center, index + 1), index + 1, resolved, resolved.classification)
  );
  for (const record of generated) {
    await upsertBuilding(record);
  }

  return generated;
};

export const getReportsForBuilding = async (buildingId: string): Promise<ReportSummary[]> => {
  const reports = await listReports(buildingId);
  return reports.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
};

export const createReport = async (report: ReportSummary) => {
  await addReport(report);
  const building = await findBuilding(report.buildingId);
  if (building) {
    const next = normalizeBuilding({ ...building, reportsCount: building.reportsCount + 1 });
    next.conditionSummary = deriveSummary(next.abandonmentScore, next.reportsCount);
    await upsertBuilding(next);
  }
  return report;
};

export const voteOnBuilding = async (buildingId: string, direction: "up" | "down") => {
  await addVote(buildingId, direction);
  return getVoteTotals();
};

export const getHeatmap = async () => {
  return toHeatmapPoints((await listBuildings()).map(normalizeBuilding));
};

export const buildLocalFallbackRoute = (
  from: Coordinates,
  to: Coordinates,
  profile: "driving" | "walking"
): RouteResult => {
  const kilometers = distanceKm(from, to);
  const speed = profile === "walking" ? 4.8 : 34;
  const durationMinutes = Math.max(3, Math.round((kilometers / speed) * 60));

  return {
    profile,
    distanceKm: Number(kilometers.toFixed(1)),
    durationMinutes,
    geometry: [
      [from.lng, from.lat],
      [(from.lng + to.lng) / 2 + 0.01, (from.lat + to.lat) / 2 + 0.006],
      [to.lng, to.lat]
    ],
    provider: "simulation",
    warning: "Using simulated route preview because OSRM was unavailable."
  };
};
