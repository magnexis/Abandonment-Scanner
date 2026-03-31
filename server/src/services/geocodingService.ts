import type {
  Coordinates,
  LocationClassification,
  ResolvedLocation,
  SearchSuggestion
} from "../../../shared/src/index.js";

interface NominatimAddress {
  house_number?: string;
  road?: string;
  pedestrian?: string;
  neighbourhood?: string;
  suburb?: string;
  city?: string;
  town?: string;
  village?: string;
  hamlet?: string;
  county?: string;
  state?: string;
  country?: string;
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name?: string;
  address?: NominatimAddress;
  type?: string;
  class?: string;
  category?: string;
  addresstype?: string;
}

const headers = {
  "Accept-Language": "en-US,en;q=0.9",
  "User-Agent": "AbandonmentScanner/1.0"
};

const getCity = (address?: NominatimAddress) =>
  address?.city || address?.town || address?.village || address?.hamlet || address?.county || "Unknown locality";

const getState = (address?: NominatimAddress) => address?.state || address?.county || "Unknown state";

const formatAddressLine = (address?: NominatimAddress) =>
  [address?.house_number, address?.road || address?.pedestrian || address?.neighbourhood || address?.suburb]
    .filter(Boolean)
    .join(" ")
    .trim();

const fallbackLocation = (coordinates: Coordinates): ResolvedLocation => ({
  coordinates,
  fullAddress: `${coordinates.lat.toFixed(5)}, ${coordinates.lng.toFixed(5)}`,
  city: "Unknown locality",
  state: "Unknown state",
  country: "Unknown country",
  label: `${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}`,
  classification: "unknown",
  scanAllowed: true
});

const classifyLocation = (item: NominatimResult): LocationClassification => {
  const raw = [item.type, item.class, item.category, item.addresstype, item.display_name]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (/(warehouse|depot|storage|hangar)/.test(raw)) return "warehouse";
  if (/(industrial|factory|manufacturing|brownfield)/.test(raw)) return "industrial";
  if (/(commercial|retail|office|shop|mall|supermarket)/.test(raw)) return "commercial";
  if (/(abandoned|ruins|derelict)/.test(raw)) return "abandoned";
  if (/(house|residential|apartments|neighbourhood|suburb|hamlet)/.test(raw)) return "residential";
  if (/(mixed|civic|service|amenity)/.test(raw)) return "mixed";
  return "unknown";
};

const isAllowedScanZone = (classification: LocationClassification) => classification !== "residential";

const toResolvedLocation = (item: NominatimResult, fallbackCoordinates: Coordinates): ResolvedLocation => {
  const coordinates = {
    lat: Number(item.lat || fallbackCoordinates.lat),
    lng: Number(item.lon || fallbackCoordinates.lng)
  };
  const city = getCity(item.address);
  const state = getState(item.address);
  const country = item.address?.country || "Unknown country";
  const addressLine = formatAddressLine(item.address);
  const label = addressLine || [city, state].filter(Boolean).join(", ");
  const classification = classifyLocation(item);

  return {
    coordinates,
    fullAddress: item.display_name || [addressLine, city, state, country].filter(Boolean).join(", "),
    city,
    state,
    country,
    label: label || `${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}`,
    classification,
    scanAllowed: isAllowedScanZone(classification)
  };
};

const fetchJson = async <T>(url: string) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4500);

  try {
    const response = await fetch(url, { headers, signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Geocoding failed with ${response.status}`);
    }
    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
};

export const reverseGeocode = async (coordinates: Coordinates): Promise<ResolvedLocation> => {
  try {
    const params = new URLSearchParams({
      format: "jsonv2",
      lat: String(coordinates.lat),
      lon: String(coordinates.lng),
      zoom: "18",
      addressdetails: "1"
    });
    const result = await fetchJson<NominatimResult>(
      `https://nominatim.openstreetmap.org/reverse?${params.toString()}`
    );
    return toResolvedLocation(result, coordinates);
  } catch {
    return fallbackLocation(coordinates);
  }
};

export const searchGeocodedLocations = async (query: string): Promise<SearchSuggestion[]> => {
  try {
    const params = new URLSearchParams({
      format: "jsonv2",
      q: query,
      addressdetails: "1",
      limit: "5"
    });
    const results = await fetchJson<NominatimResult[]>(
      `https://nominatim.openstreetmap.org/search?${params.toString()}`
    );

    return results.map((result, index) => {
      const resolved = toResolvedLocation(result, {
        lat: Number(result.lat),
        lng: Number(result.lon)
      });

      return {
        id: `nominatim-${index}-${resolved.coordinates.lat}-${resolved.coordinates.lng}`,
        label: resolved.label,
        subtitle: resolved.fullAddress,
        coordinates: resolved.coordinates
      };
    });
  } catch {
    return [];
  }
};
