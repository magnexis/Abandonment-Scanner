import type { Coordinates, PlaceIntelligence, ResolvedLocation } from "../../../shared/src/index.js";
import { distanceKm } from "../utils/geo.js";

interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements?: OverpassElement[];
}

interface RankedCandidate {
  name: string;
  type: PlaceIntelligence["type"];
  category: string;
  confidence: number;
  notes: string;
  adjustment: number;
  active: boolean;
}

const OVERPASS_API_URL = "https://overpass-api.de/api/interpreter";

const headers = {
  "Accept-Language": "en-US,en;q=0.9",
  "User-Agent": "AbandonmentScanner/1.0"
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const locationTypePatterns: Array<[PlaceIntelligence["type"], RegExp]> = [
  ["residential", /\b(house|detached|residential|apartments|home|dormitory)\b/i],
  ["industrial", /\b(warehouse|industrial|factory|manufacture|manufacturing|depot|storage|hangar|works)\b/i],
  ["commercial", /\b(commercial|retail|shop|store|mall|supermarket|office|restaurant|bank|pharmacy|hotel|market)\b/i]
];

const publicUsePattern = /\b(school|college|university|hospital|library|police|fire_station|government|civic|townhall|kindergarten|public)\b/i;
const activeBusinessPattern = /\b(shop|store|restaurant|cafe|bank|pharmacy|office|hotel|supermarket|fuel|clinic)\b/i;

const fetchOverpass = async (query: string) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5500);

  try {
    const response = await fetch(OVERPASS_API_URL, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "text/plain;charset=UTF-8"
      },
      body: query,
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`Overpass lookup failed with ${response.status}`);
    }

    return (await response.json()) as OverpassResponse;
  } finally {
    clearTimeout(timeout);
  }
};

const getElementCoordinates = (element: OverpassElement): Coordinates | null => {
  if (typeof element.lat === "number" && typeof element.lon === "number") {
    return { lat: element.lat, lng: element.lon };
  }

  if (element.center && typeof element.center.lat === "number" && typeof element.center.lon === "number") {
    return { lat: element.center.lat, lng: element.center.lon };
  }

  return null;
};

const inferType = (raw: string): PlaceIntelligence["type"] => {
  for (const [type, pattern] of locationTypePatterns) {
    if (pattern.test(raw)) {
      return type;
    }
  }

  return "unknown";
};

const inferCategory = (tags: Record<string, string>) => {
  return (
    tags.building && tags.building !== "yes"
      ? tags.building
      : tags.shop ||
          tags.amenity ||
          tags.office ||
          tags.landuse ||
          tags.man_made ||
          tags.tourism ||
          tags.leisure ||
          "site"
  ).replace(/_/g, " ");
};

const rankElement = (element: OverpassElement, center: Coordinates): RankedCandidate | null => {
  const tags = element.tags ?? {};
  const coordinates = getElementCoordinates(element);
  if (!coordinates) {
    return null;
  }

  const raw = Object.entries(tags)
    .map(([key, value]) => `${key} ${value}`)
    .join(" ");

  const type = inferType(raw);
  const category = inferCategory(tags);
  const name =
    tags.name || tags.brand || tags.operator || tags.amenity || tags.shop || tags.office || tags.building || "Unnamed place";
  const distanceMeters = distanceKm(center, coordinates) * 1000;
  const isPublic = publicUsePattern.test(raw);
  const activeBusiness = activeBusinessPattern.test(raw) || Boolean(tags.shop || tags.office);
  const genericBuilding = tags.building === "yes";
  const corroborationCount = [tags.building, tags.landuse, tags.amenity, tags.shop, tags.office].filter(Boolean).length;

  let confidence = 40;
  if (tags.name || tags.brand) confidence += 18;
  if (!genericBuilding) confidence += 12;
  if (corroborationCount >= 2) confidence += 10;
  if (distanceMeters <= 60) confidence += 10;
  if (distanceMeters <= 20) confidence += 6;
  if (type !== "unknown") confidence += 8;
  if (genericBuilding && type === "unknown") confidence -= 10;
  if (distanceMeters > 150) confidence -= 12;

  let notes = "Nearby OSM metadata is limited, so enrichment remains cautious.";
  let adjustment = 0;

  if (type === "industrial" && !activeBusiness && !isPublic) {
    notes = "Nearby warehouse or industrial tags appear without strong active business markers, which slightly increases abandonment likelihood.";
    adjustment = 6;
  } else if (type === "commercial" && activeBusiness) {
    notes = "Nearby shop or office tags suggest an active commercial place, which lowers abandonment likelihood.";
    adjustment = -12;
  } else if (type === "residential") {
    notes = "Nearby residential tags suggest a home or apartment context, so high-abandonment scoring should be reduced.";
    adjustment = -24;
  } else if (isPublic) {
    notes = "Nearby public-use tags suggest a school, civic, or service building, which usually lowers abandonment likelihood.";
    adjustment = -14;
  } else if (type === "commercial") {
    notes = "Commercial context is present, but active business metadata is limited. Abandonment refinement stays cautious.";
    adjustment = -4;
  }

  return {
    name,
    type,
    category,
    confidence: clamp(Math.round(confidence), 15, 98),
    notes,
    adjustment,
    active: activeBusiness || isPublic
  };
};

const fallbackIntelligence = (location: ResolvedLocation): PlaceIntelligence => {
  const name = location.label || location.city || "Unknown place";
  const fallbackType =
    location.classification === "industrial" ||
    location.classification === "commercial" ||
    location.classification === "residential"
      ? location.classification
      : location.classification === "warehouse"
        ? "industrial"
      : "unknown";

  return {
    name,
    type: fallbackType,
    category: location.classification === "unknown" ? "site" : location.classification.replace(/_/g, " "),
    confidence: 38,
    notes: "Public place metadata was limited, so enrichment fell back to reverse-geocoded context only."
  };
};

export const enrichLocation = async (
  lat: number,
  lng: number,
  location: ResolvedLocation
): Promise<PlaceIntelligence & { adjustment: number; active: boolean }> => {
  const center = { lat, lng };
  const query = `
[out:json][timeout:8];
(
  node(around:120,${lat},${lng})[amenity];
  way(around:120,${lat},${lng})[amenity];
  relation(around:120,${lat},${lng})[amenity];
  node(around:120,${lat},${lng})[shop];
  way(around:120,${lat},${lng})[shop];
  relation(around:120,${lat},${lng})[shop];
  node(around:140,${lat},${lng})[office];
  way(around:140,${lat},${lng})[office];
  relation(around:140,${lat},${lng})[office];
  node(around:180,${lat},${lng})[building];
  way(around:180,${lat},${lng})[building];
  relation(around:180,${lat},${lng})[building];
  way(around:180,${lat},${lng})[landuse];
  relation(around:180,${lat},${lng})[landuse];
);
out center tags qt 30;
`.trim();

  try {
    const response = await fetchOverpass(query);
    const candidates = (response.elements ?? [])
      .map((element) => rankElement(element, center))
      .filter((candidate): candidate is RankedCandidate => Boolean(candidate))
      .sort((a, b) => b.confidence - a.confidence);

    if (!candidates.length) {
      return {
        ...fallbackIntelligence(location),
        adjustment: location.classification === "industrial" ? 4 : 0,
        active: false
      };
    }

    const best = candidates[0];

    return {
      name: best.name || location.label || location.city,
      type: best.type,
      category: best.category,
      confidence: best.confidence,
      notes: best.notes,
      adjustment: best.adjustment,
      active: best.active
    };
  } catch {
    return {
      ...fallbackIntelligence(location),
      adjustment: location.classification === "industrial" ? 4 : 0,
      active: false
    };
  }
};
