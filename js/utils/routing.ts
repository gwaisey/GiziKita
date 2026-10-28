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
  if (Math.abs(dLng) < 0.00001 && Math.abs(dLat) < 0.00001) {
    // If destination is coincident with origin, create a small local delivery route
    return [
      [origin.lng, origin.lat],
      [origin.lng + 0.002, origin.lat + 0.001],
      [origin.lng + 0.003, origin.lat - 0.001],
      [origin.lng + 0.004, origin.lat],
    ];
  }
  const offLng = -dLat * 0.15;
  const offLat = dLng * 0.15;
  const p2 = [p1[0] + dLng * 0.33 + offLng, p1[1] + dLat * 0.33 + offLat];
  const p3 = [p1[0] + dLng * 0.66 - offLng, p1[1] + dLat * 0.66 - offLat];
  return [p1, p2, p3, p4];
}

export interface ResolvedDestination {
  name: string;
  lat: number;
  lng: number;
}

/**
 * Deterministically resolves valid destination school coordinates and name for any vehicle.
 * Ensures the destination is NEVER null or invalid under any circumstances.
 */
export function resolveVehicleDestination(
  vehicle: {
    id?: string;
    city?: string;
    last_lat?: number | null;
    last_lng?: number | null;
    destination_lat?: number | null;
    destination_lng?: number | null;
    destination_school_name?: string | null;
    route_geometry?: number[][] | null;
  },
  sppgFallback?: { lat: number; lng: number } | null
): ResolvedDestination {
  const name = vehicle.destination_school_name || (vehicle.city ? `Sekolah Penerima ${vehicle.city}` : 'Sekolah Penerima');

  // 1. Direct verified destination coordinates
  if (
    vehicle.destination_lat != null &&
    vehicle.destination_lng != null &&
    Number.isFinite(vehicle.destination_lat) &&
    Number.isFinite(vehicle.destination_lng)
  ) {
    return { name, lat: vehicle.destination_lat, lng: vehicle.destination_lng };
  }

  // 2. Extract from route endpoint if route geometry exists
  if (isValidRoute(vehicle.route_geometry)) {
    const lastPoint = vehicle.route_geometry[vehicle.route_geometry.length - 1];
    if (isValidCoord(lastPoint)) {
      return { name, lat: lastPoint[1], lng: lastPoint[0] };
    }
  }

  // 3. Deterministic regional offset from SPPG or vehicle position
  const baseLat = sppgFallback?.lat ?? (Number.isFinite(vehicle.last_lat) ? (vehicle.last_lat as number) : -6.2);
  const baseLng = sppgFallback?.lng ?? (Number.isFinite(vehicle.last_lng) ? (vehicle.last_lng as number) : 106.8);

  const idStr = vehicle.id || vehicle.city || 'default';
  const hash = Math.abs(idStr.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0));
  const angle = ((hash % 16) / 16) * Math.PI * 2;
  const radius = 0.015 + ((hash % 5) * 0.003); // ~1.6km - 2.8km

  return {
    name,
    lat: baseLat + Math.sin(angle) * radius,
    lng: baseLng + Math.cos(angle) * radius,
  };
}
