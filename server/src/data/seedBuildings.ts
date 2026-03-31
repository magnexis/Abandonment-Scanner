import type { BuildingRecord, Coordinates } from "../../../shared/src/index.js";
import { calculateAbandonmentScore } from "../../../shared/src/index.js";

interface SeedInput {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  coordinates: Coordinates;
  lastSaleDate: string;
  lastKnownActivity: string;
  reportsCount: number;
  activityLevel: number;
  imageUrl: string;
  thumbnailUrl: string;
  explorerNote: string;
  routeHint: string;
  similarIds: string[];
  signals: {
    vegetationLevel: number;
    brokenWindowsLevel: number;
    activityAbsenceLevel: number;
    reportWeight: number;
    permitGapLevel: number;
  };
}

const yearsBetween = (dateString: string) => {
  const now = new Date("2026-03-31T12:00:00.000Z");
  const then = new Date(dateString);
  return (now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
};

const highlightLabelByFactorKey: Record<string, string> = {
  activity: "No recent activity",
  windows: "Visible decay patterns",
  reports: "Multiple user reports",
  vegetation: "Overgrown vegetation",
  permits: "Low permit and utility activity",
  "last-sale": "No recent sale turnover"
};

const toBuilding = (seed: SeedInput): BuildingRecord => {
  const score = calculateAbandonmentScore({
    yearsSinceSale: yearsBetween(seed.lastSaleDate),
    vegetationLevel: seed.signals.vegetationLevel,
    brokenWindowsLevel: seed.signals.brokenWindowsLevel,
    activityAbsenceLevel: seed.signals.activityAbsenceLevel,
    reportWeight: seed.signals.reportWeight,
    permitGapLevel: seed.signals.permitGapLevel
  });

  const conditionSummary =
    score.score >= 75
      ? "Multiple neglect indicators stack together here, including long sale inactivity, repeated decay signals, and minimal day-to-day activity."
      : score.score >= 45
        ? "The property shows a mix of deterioration and weak activity signals that make it worth a closer field review."
        : "Signals suggest the site still has enough upkeep or regular activity to avoid a high abandonment classification.";

  return {
    id: seed.id,
    name: seed.name,
    address: seed.address,
    fullAddress: `${seed.address}, ${seed.city}, ${seed.state}, United States`,
    city: seed.city,
    state: seed.state,
    country: "United States",
    coordinates: seed.coordinates,
    abandonmentScore: score.score,
    status: score.status,
    riskLevel: score.riskLevel,
    confidence: score.confidence,
    lastSaleDate: seed.lastSaleDate,
    lastKnownActivity: seed.lastKnownActivity,
    reportsCount: seed.reportsCount,
    activityLevel: seed.activityLevel,
    imageUrl: seed.imageUrl,
    thumbnailUrl: seed.thumbnailUrl,
    conditionSummary,
    explorerNote: seed.explorerNote,
    factorHighlights: [...score.factors]
      .sort((a, b) => b.impact - a.impact)
      .slice(0, 3)
      .map((factor) => highlightLabelByFactorKey[factor.key] ?? factor.label),
    factors: score.factors,
    routeHint: seed.routeHint,
    similarIds: seed.similarIds
  };
};

export const seedBuildings: BuildingRecord[] = [
  toBuilding({
    id: "det-fern-warehouse",
    name: "Fern Street Cold Storage",
    address: "1811 Fern St",
    city: "Detroit",
    state: "MI",
    coordinates: { lat: 42.3315, lng: -83.0671 },
    lastSaleDate: "2008-06-10",
    lastKnownActivity: "Utility draw dropped below baseline 14 months ago",
    reportsCount: 18,
    activityLevel: 11,
    imageUrl: "https://images.unsplash.com/photo-1523419409543-a5e549c1c4c5?auto=format&fit=crop&w=1200&q=80",
    thumbnailUrl: "https://images.unsplash.com/photo-1523419409543-a5e549c1c4c5?auto=format&fit=crop&w=600&q=80",
    explorerNote: "North entrance is fenced, but public sidewalk visibility is strong from the east edge.",
    routeHint: "Best approached from the south frontage road due to blocked loading docks.",
    similarIds: ["det-ash-hotel", "det-sterling-school"],
    signals: {
      vegetationLevel: 0.84,
      brokenWindowsLevel: 0.92,
      activityAbsenceLevel: 0.87,
      reportWeight: 11,
      permitGapLevel: 0.88
    }
  }),
  toBuilding({
    id: "det-ash-hotel",
    name: "Ashby Motor Hotel",
    address: "942 Ashby Ave",
    city: "Detroit",
    state: "MI",
    coordinates: { lat: 42.3387, lng: -83.0918 },
    lastSaleDate: "2013-11-02",
    lastKnownActivity: "No tenant movement detected after winter season",
    reportsCount: 13,
    activityLevel: 24,
    imageUrl: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
    thumbnailUrl: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=600&q=80",
    explorerNote: "Graffiti turnover is high here, which often tracks lack of active ownership.",
    routeHint: "Use the alley approach only on foot; vehicle access is better from Ashby Ave.",
    similarIds: ["det-fern-warehouse", "det-sterling-school"],
    signals: {
      vegetationLevel: 0.63,
      brokenWindowsLevel: 0.74,
      activityAbsenceLevel: 0.72,
      reportWeight: 9,
      permitGapLevel: 0.71
    }
  }),
  toBuilding({
    id: "det-sterling-school",
    name: "Sterling Technical School",
    address: "312 Sterling Blvd",
    city: "Detroit",
    state: "MI",
    coordinates: { lat: 42.3499, lng: -83.0524 },
    lastSaleDate: "2010-09-15",
    lastKnownActivity: "Security patrols ended during 2024 budget cuts",
    reportsCount: 16,
    activityLevel: 18,
    imageUrl: "https://images.unsplash.com/photo-1523413651479-597eb2da0ad6?auto=format&fit=crop&w=1200&q=80",
    thumbnailUrl: "https://images.unsplash.com/photo-1523413651479-597eb2da0ad6?auto=format&fit=crop&w=600&q=80",
    explorerNote: "Open athletic field increases visibility, but rear annex remains hard to inspect remotely.",
    routeHint: "Approach from Sterling Blvd for the clearest front elevation view.",
    similarIds: ["det-fern-warehouse", "det-ash-hotel"],
    signals: {
      vegetationLevel: 0.78,
      brokenWindowsLevel: 0.68,
      activityAbsenceLevel: 0.8,
      reportWeight: 10,
      permitGapLevel: 0.75
    }
  }),
  toBuilding({
    id: "chi-river-mill",
    name: "River Mill Exchange",
    address: "44 Canal Forge Rd",
    city: "Chicago",
    state: "IL",
    coordinates: { lat: 41.8798, lng: -87.6524 },
    lastSaleDate: "2020-04-10",
    lastKnownActivity: "Occasional contractor presence logged this quarter",
    reportsCount: 4,
    activityLevel: 46,
    imageUrl: "https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=1200&q=80",
    thumbnailUrl: "https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=600&q=80",
    explorerNote: "Scaffolding remains in place, which lowers certainty on true abandonment.",
    routeHint: "Driving route is easiest from the west service lane.",
    similarIds: ["phl-cedar-clinic", "det-ash-hotel"],
    signals: {
      vegetationLevel: 0.34,
      brokenWindowsLevel: 0.28,
      activityAbsenceLevel: 0.41,
      reportWeight: 3,
      permitGapLevel: 0.32
    }
  }),
  toBuilding({
    id: "phl-cedar-clinic",
    name: "Cedar Point Clinic Annex",
    address: "201 Cedar Point Dr",
    city: "Philadelphia",
    state: "PA",
    coordinates: { lat: 39.9584, lng: -75.1737 },
    lastSaleDate: "2016-02-28",
    lastKnownActivity: "Mail overflow noted by local submissions",
    reportsCount: 7,
    activityLevel: 37,
    imageUrl: "https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=1200&q=80",
    thumbnailUrl: "https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=600&q=80",
    explorerNote: "Rear parking lot striping is fading, but frontage landscaping still receives some maintenance.",
    routeHint: "Walking approach from Cedar Point Dr offers the shortest safe line.",
    similarIds: ["chi-river-mill", "det-sterling-school"],
    signals: {
      vegetationLevel: 0.48,
      brokenWindowsLevel: 0.39,
      activityAbsenceLevel: 0.58,
      reportWeight: 5,
      permitGapLevel: 0.44
    }
  }),
  toBuilding({
    id: "bos-quarry-estate",
    name: "Quarry Estate Gatehouse",
    address: "9 Quarry View Ln",
    city: "Boston",
    state: "MA",
    coordinates: { lat: 42.3608, lng: -71.0713 },
    lastSaleDate: "2022-08-19",
    lastKnownActivity: "Landscape contractor observed within 60 days",
    reportsCount: 2,
    activityLevel: 62,
    imageUrl: "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80",
    thumbnailUrl: "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=600&q=80",
    explorerNote: "Vacancy is possible, but signs point more toward intermittent occupancy than abandonment.",
    routeHint: "Route from the main road; private lane access narrows quickly.",
    similarIds: ["chi-river-mill", "phl-cedar-clinic"],
    signals: {
      vegetationLevel: 0.22,
      brokenWindowsLevel: 0.18,
      activityAbsenceLevel: 0.26,
      reportWeight: 1,
      permitGapLevel: 0.14
    }
  })
];
