import type { Coordinates } from "../../../shared/src/index.js";

const earthRadiusKm = 6371;

const toRadians = (value: number) => (value * Math.PI) / 180;

export const distanceKm = (a: Coordinates, b: Coordinates) => {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const hav =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(hav));
};

export const jitterCoordinates = (center: Coordinates, offsetIndex: number): Coordinates => {
  const angle = ((offsetIndex * 57) % 360) * (Math.PI / 180);
  const distance = 0.006 + offsetIndex * 0.0018;

  return {
    lat: center.lat + Math.sin(angle) * distance,
    lng: center.lng + Math.cos(angle) * distance
  };
};

export const offsetWithinRadius = (center: Coordinates, radiusMeters: number, seed: number): Coordinates => {
  const angle = ((seed * 67) % 360) * (Math.PI / 180);
  const distanceMeters = radiusMeters * (0.28 + ((seed * 37) % 43) / 100);
  const distanceKm = distanceMeters / 1000;

  const deltaLat = (distanceKm / 111.32) * Math.sin(angle);
  const deltaLng =
    (distanceKm / (111.32 * Math.max(Math.cos(toRadians(center.lat)), 0.2))) * Math.cos(angle);

  return {
    lat: center.lat + deltaLat,
    lng: center.lng + deltaLng
  };
};
