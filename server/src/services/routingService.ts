import type { Coordinates, RouteResult } from "../../../shared/src/index.js";
import { buildLocalFallbackRoute } from "./buildingService.js";

const getOsrmRoute = async (
  from: Coordinates,
  to: Coordinates,
  profile: "driving" | "walking"
): Promise<RouteResult | null> => {
  const mode = profile === "walking" ? "foot" : "driving";
  const response = await fetch(
    `https://router.project-osrm.org/route/v1/${mode}/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`
  );

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    routes?: Array<{
      distance: number;
      duration: number;
      geometry: { coordinates: [number, number][] };
    }>;
  };

  const route = payload.routes?.[0];
  if (!route) {
    return null;
  }

  return {
    profile,
    distanceKm: Number((route.distance / 1000).toFixed(1)),
    durationMinutes: Math.max(1, Math.round(route.duration / 60)),
    geometry: route.geometry.coordinates,
    provider: "osrm"
  };
};

export const getRoute = async (
  from: Coordinates,
  to: Coordinates,
  profile: "driving" | "walking"
): Promise<RouteResult> => {
  try {
    const osrmRoute = await getOsrmRoute(from, to, profile);
    if (osrmRoute) {
      return osrmRoute;
    }
  } catch {
    // Ignore and fall back to simulated route.
  }

  return buildLocalFallbackRoute(from, to, profile);
};
