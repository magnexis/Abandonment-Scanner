import type { Coordinates, ResolvedLocation, RouteResult } from "@shared/index";

export const DEFAULT_CENTER: Coordinates = { lat: 42.3315, lng: -83.0671 };
export const TILE_URL = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
export const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; CARTO';

export const getScoreColor = (score: number) => {
  if (score >= 70) return "#f85149";
  if (score >= 35) return "#d29922";
  return "#2ea44f";
};

export const toLeafletLatLng = (coordinates: Coordinates): [number, number] => [coordinates.lat, coordinates.lng];

export const toLeafletRoute = (route: RouteResult): [number, number][] =>
  route.geometry.map(([lng, lat]) => [lat, lng]);

export const formatResolvedLocation = (location?: ResolvedLocation | null) => {
  if (!location) return "Select a location";
  return [location.city, location.state, location.country].filter(Boolean).join(", ");
};

export const createMarkerHtml = (color: string, active = false, pulse = false) => `
  <span
    class="leaflet-marker-shell${active ? " is-active" : ""}${pulse ? " is-pulse" : ""}"
    style="--marker-color:${color}"
  >
    <span class="leaflet-marker-core"></span>
  </span>
`;

