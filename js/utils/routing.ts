/**
 * Pure routing helpers shared by the vehicle store and the simulation service.
 * Kept dependency-free so both can import it without circular imports.
 */

export type LngLat = [number, number];

/** Euclidean distance in degrees (cheap; fine for the sub-km comparisons we do). */
export function degDistance(a: number[], b: number[]): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

/** Great-circle distance in kilometres. */
export function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(bLat - aLat);
  const dLng = rad(bLng - aLng);
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/** True when the value is a finite coordinate pair. */
export function isValidCoord(p: unknown): p is number[] {
  return Array.isArray(p) && p.length >= 2 && Number.isFinite(p[0]) && Number.isFinite(p[1]);
}

/** True when the geometry is a usable polyline (>= 2 finite points). */
export function isValidRoute(route: unknown): route is number[][] {
  return Array.isArray(route) && route.length >= 2 && route.every(isValidCoord);
}

/**
 * Gently curved 4-point polyline from origin to destination. It always starts
 * EXACTLY at the origin and ends EXACTLY at the destination, so a vehicle that
 * follows it never teleports and always "arrives" physically at the school.
 */
export function createFallbackRoute(
  origin: { lng: number; lat: number },
  destination: { lng: number; lat: number },
): number[][] {
  const p1 = [origin.lng, origin.lat];
  const p4 = [destination.lng, destination.lat];
  const dLng = p4[0] - p1[0];
  const dLat = p4[1] - p1[1];
  const offLng = -dLat * 0.15;
  const offLat = dLng * 0.15;
  const p2 = [p1[0] + dLng * 0.33 + offLng, p1[1] + dLat * 0.33 + offLat];
  const p3 = [p1[0] + dLng * 0.66 - offLng, p1[1] + dLat * 0.66 - offLat];
  return [p1, p2, p3, p4];
}
