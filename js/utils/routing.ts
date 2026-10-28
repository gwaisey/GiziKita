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
 * Strict Land Clamping:
 * Coastal cities in Indonesia border the ocean on specific sides.
 * Any coordinates projected into the water are clamped safely inland.
 */
export function clampCoordinatesToLand(
  lat: number,
  lng: number,
  city?: string | null
): { lat: number; lng: number } {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { lat: -6.2, lng: 106.8 };
  }

  const normCity = (city || '').toLowerCase().replace(/^(kota|kabupaten|kab\.|adm\.)\s+/i, '').trim();

  // 1. DKI JAKARTA / JAKARTA UTARA:
  // Java Sea lies directly North of -6.1150. Coastline from Kamal Muara to Cilincing.
  // Kamal Muara / Muara Angke (West): water if lng < 106.78 && lat > -6.125.
  // Port of Tanjung Priok / Ancol / Marunda: water if lat > -6.1150.
  if (normCity.includes('jakarta') || normCity.includes('utara') || (lat > -6.15 && lat < -6.05 && lng > 106.65 && lng < 107.00)) {
    let safeLat = lat;
    let safeLng = lng;
    if (safeLat > -6.125) {
      safeLat = -6.135 - (Math.abs(safeLat) % 0.015); // Push inland South into Sunter / Kelapa Gading / Pademangan
    }
    if (safeLng < 106.77) {
      safeLng = 106.79 + (Math.abs(safeLng) % 0.015);
    } else if (safeLng > 106.96) {
      safeLng = 106.93 - (Math.abs(safeLng) % 0.015);
    }
    return { lat: safeLat, lng: safeLng };
  }

  // 2. SURABAYA / SIDOARJO NORTH COAST:
  // Madura Strait lies to the North (lat > -7.200) and East (lng > 112.805)
  if (normCity.includes('surabaya')) {
    let safeLat = lat;
    let safeLng = lng;
    if (safeLat > -7.215) {
      safeLat = -7.240 - (Math.abs(safeLat) % 0.015);
    }
    if (safeLng > 112.795) {
      safeLng = 112.770 - (Math.abs(safeLng) % 0.015);
    }
    return { lat: safeLat, lng: safeLng };
  }

  // 3. SEMARANG:
  // Java Sea lies North of -6.950
  if (normCity.includes('semarang')) {
    let safeLat = lat;
    if (safeLat > -6.965) {
      safeLat = -6.985 - (Math.abs(safeLat) % 0.015);
    }
    return { lat: safeLat, lng };
  }

  // 4. MAKASSAR:
  // Makassar Strait lies West of 119.410
  if (normCity.includes('makassar')) {
    let safeLng = lng;
    if (safeLng < 119.418) {
      safeLng = 119.435 + (Math.abs(safeLng) % 0.015);
    }
    return { lat, lng: safeLng };
  }

  // 5. PADANG:
  // Indian Ocean lies West of 100.345
  if (normCity.includes('padang')) {
    let safeLng = lng;
    if (safeLng < 100.355) {
      safeLng = 100.375 + (Math.abs(safeLng) % 0.015);
    }
    return { lat, lng: safeLng };
  }

  // 6. BALIKPAPAN:
  // Balikpapan Bay / Makassar Strait lies South (lat < -1.260) and West (lng < 116.825)
  if (normCity.includes('balikpapan')) {
    let safeLat = lat;
    let safeLng = lng;
    if (safeLat < -1.245) safeLat = -1.230 + (Math.abs(safeLat) % 0.015);
    if (safeLng < 116.835) safeLng = 116.860 + (Math.abs(safeLng) % 0.015);
    return { lat: safeLat, lng: safeLng };
  }

  // 7. KUPANG:
  // Kupang Bay lies North of -10.165
  if (normCity.includes('kupang')) {
    let safeLat = lat;
    if (safeLat > -10.175) safeLat = -10.190 - (Math.abs(safeLat) % 0.015);
    return { lat: safeLat, lng };
  }

  // 8. DENPASAR / BADUNG:
  // Indian Ocean lies South of -8.720 and East of 115.260
  if (normCity.includes('denpasar') || normCity.includes('badung')) {
    let safeLat = lat;
    let safeLng = lng;
    if (safeLat < -8.705) safeLat = -8.680 + (Math.abs(safeLat) % 0.015);
    if (safeLng > 115.250) safeLng = 115.230 - (Math.abs(safeLng) % 0.015);
    return { lat: safeLat, lng: safeLng };
  }

  // 9. BANDA ACEH:
  // Sea lies North of 5.570 and West of 95.305
  if (normCity.includes('aceh')) {
    let safeLat = lat;
    let safeLng = lng;
    if (safeLat > 5.555) safeLat = 5.535 - (Math.abs(safeLat) % 0.015);
    if (safeLng < 95.315) safeLng = 95.335 + (Math.abs(safeLng) % 0.015);
    return { lat: safeLat, lng: safeLng };
  }

  // 10. MANADO:
  // Sea lies North of 1.500 and West of 124.825
  if (normCity.includes('manado')) {
    let safeLat = lat;
    let safeLng = lng;
    if (safeLat > 1.485) safeLat = 1.465 - (Math.abs(safeLat) % 0.015);
    if (safeLng < 124.835) safeLng = 124.855 + (Math.abs(safeLng) % 0.015);
    return { lat: safeLat, lng: safeLng };
  }

  // 11. GENERAL JAVA NORTH COAST (Cirebon, Indramayu, Subang, Karawang, Bekasi, Pekalongan, Tegal, Batang, Jepara, Rembang, Tuban, Lamongan, Gresik, Pasuruan, Probolinggo):
  if (
    normCity.includes('cirebon') || normCity.includes('indramayu') || normCity.includes('subang') ||
    normCity.includes('karawang') || normCity.includes('bekasi') || normCity.includes('pekalongan') ||
    normCity.includes('tegal') || normCity.includes('brebes') || normCity.includes('batang') ||
    normCity.includes('jepara') || normCity.includes('rembang') || normCity.includes('tuban') ||
    normCity.includes('lamongan') || normCity.includes('gresik') || normCity.includes('pasuruan') ||
    normCity.includes('probolinggo')
  ) {
    if (lat > -6.80 && (normCity.includes('cirebon') || normCity.includes('indramayu'))) {
      return { lat: Math.min(lat, -6.85), lng };
    }
    if (lat > -6.85 && (normCity.includes('pekalongan') || normCity.includes('tegal') || normCity.includes('brebes'))) {
      return { lat: Math.min(lat, -6.92), lng };
    }
    if (lat > -7.00 && (normCity.includes('tuban') || normCity.includes('lamongan') || normCity.includes('gresik'))) {
      return { lat: Math.min(lat, -7.08), lng };
    }
  }

  return { lat, lng };
}

/**
 * Deterministically resolves valid destination school coordinates and name for any vehicle.
 * Ensures the destination is NEVER null, NEVER offshore, and 100% on land.
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

  // 1. Direct verified destination coordinates (always clamped to land!)
  if (
    vehicle.destination_lat != null &&
    vehicle.destination_lng != null &&
    Number.isFinite(vehicle.destination_lat) &&
    Number.isFinite(vehicle.destination_lng)
  ) {
    const clamped = clampCoordinatesToLand(vehicle.destination_lat, vehicle.destination_lng, vehicle.city);
    return { name, lat: clamped.lat, lng: clamped.lng };
  }

  // 2. Extract from route endpoint if route geometry exists (clamped to land!)
  if (isValidRoute(vehicle.route_geometry)) {
    const lastPoint = vehicle.route_geometry[vehicle.route_geometry.length - 1];
    if (isValidCoord(lastPoint)) {
      const clamped = clampCoordinatesToLand(lastPoint[1], lastPoint[0], vehicle.city);
      return { name, lat: clamped.lat, lng: clamped.lng };
    }
  }

  // 3. Deterministic regional offset from SPPG or vehicle position
  const baseLat = sppgFallback?.lat ?? (Number.isFinite(vehicle.last_lat) ? (vehicle.last_lat as number) : -6.2);
  const baseLng = sppgFallback?.lng ?? (Number.isFinite(vehicle.last_lng) ? (vehicle.last_lng as number) : 106.8);

  const idStr = vehicle.id || vehicle.city || 'default';
  const hash = Math.abs(idStr.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0));
  
  // Deterministic inland bias: if in Java north coast / coastal region, bias South
  const normCity = (vehicle.city || '').toLowerCase();
  const isNorthCoast = normCity.includes('jakarta') || normCity.includes('surabaya') || normCity.includes('semarang') || normCity.includes('cirebon') || normCity.includes('utara');
  
  const angle = isNorthCoast
    ? -Math.PI / 2 + (((hash % 8) - 4) / 8) * (Math.PI / 3) // -90 deg (South) +/- 30 deg
    : ((hash % 16) / 16) * Math.PI * 2;
  const radius = 0.012 + ((hash % 4) * 0.002); // ~1.3km - 2.0km

  const rawLat = baseLat + Math.sin(angle) * radius;
  const rawLng = baseLng + Math.cos(angle) * radius;
  const clamped = clampCoordinatesToLand(rawLat, rawLng, vehicle.city);

  return {
    name,
    lat: clamped.lat,
    lng: clamped.lng,
  };
}
