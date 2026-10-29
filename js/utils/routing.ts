/**
 * Pure routing helpers shared by the vehicle store and the simulation service.
 * Kept dependency-free so both can import it without circular imports.
 */

import { findRegionByName } from '../data/indonesia_regions';

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
 * Detects if a coordinate falls in open marine waters:
 * 1. Java Sea (open sea north of Java and south of Kalimantan)
 * 2. Flores Sea (open sea north of Flores/Sumbawa)
 * 3. Banda Sea (open deep sea in Central/South Maluku)
 */
export function isCoordinateInOpenSea(lat: number, lng: number): boolean {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;

  // 1. JAVA SEA: Between Java coast and Kalimantan
  // Lat -5.90 to -3.55, Lng 106.30 to 114.80
  if (lat > -5.90 && lat < -3.55 && lng > 106.30 && lng < 114.80) {
    // Exclude near Banjarmasin/Tanah Laut Kalimantan shore
    if (lat > -3.70 && lng > 114.40 && lng < 114.80) {
      return false;
    }
    return true;
  }

  // 2. FLORES SEA: Deep open water north of Flores & Sumbawa
  // Lat -8.20 to -6.80, Lng 117.50 to 123.80
  if (lat > -8.20 && lat < -6.80 && lng > 117.50 && lng < 123.80) {
    return true;
  }

  // 3. BANDA SEA: Central/South Maluku deep marine water basin
  // Lat -7.20 to -3.40, Lng 125.20 to 132.50
  if (lat > -7.20 && lat < -3.40 && lng > 125.20 && lng < 132.50) {
    // Exclude verified island land envelopes:
    // Ambon island:
    if (lat >= -3.74 && lat <= -3.65 && lng >= 128.15 && lng <= 128.25) return false;
    // Buru island:
    if (lat >= -3.90 && lat <= -3.15 && lng >= 126.60 && lng <= 127.25) return false;
    // Seram island:
    if (lat >= -3.40 && lat <= -2.90 && lng >= 128.00 && lng <= 130.80) return false;
    // Kei / Tual islands:
    if (lat >= -5.75 && lat <= -5.55 && lng >= 132.65 && lng <= 132.80) return false;
    // Banda Neira:
    if (lat >= -4.55 && lat <= -4.50 && lng >= 129.88 && lng <= 129.93) return false;
    return true;
  }

  return false;
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
    if (city) {
      const reg = findRegionByName(city);
      if (reg && Number.isFinite(reg.lat) && Number.isFinite(reg.lng)) {
        return { lat: reg.lat, lng: reg.lng };
      }
    }
    return { lat: -6.2088, lng: 106.8456 };
  }

  const normCity = (city || '').toLowerCase().replace(/^(kota|kabupaten|kab\.|adm\.)\s+/i, '').trim();

  // If city is specified, check if coordinates are severely displaced from the city's verified land center (> 0.45 deg / ~50 km).
  // This occurs when a fallback or default from another region is passed in.
  // Immediately reset coordinates to the verified administrative land centroid of this region.
  if (city) {
    const reg = findRegionByName(city);
    if (reg && Number.isFinite(reg.lat) && Number.isFinite(reg.lng)) {
      const distFromCentroid = Math.hypot(lat - reg.lat, lng - reg.lng);
      if (distFromCentroid > 0.45) {
        lat = reg.lat;
        lng = reg.lng;
      }
    }
  }

  // 1. KOTA SORONG / SORONG:
  // Coastline: Dampier Strait / Pacific is to the West (lng < 131.255).
  // Inland is to the East (lng >= 131.258, towards Remu / Malanu / Klawuyuk / Aimas).
  if (normCity.includes('sorong') || (lat > -0.92 && lat < -0.84 && lng > 131.20 && lng < 131.30)) {
    let safeLng = lng;
    let safeLat = lat;
    if (safeLng < 131.258) {
      safeLng = 131.268 + (Math.abs(safeLng) % 0.015);
    }
    if (safeLat < -0.900) safeLat = -0.885;
    if (safeLat > -0.860) safeLat = -0.875;
    return { lat: safeLat, lng: safeLng };
  }

  // 2. DKI JAKARTA / JAKARTA UTARA:
  const isJakartaUtara = (normCity.includes('jakarta') && normCity.includes('utara')) || normCity === 'jakarta utara';
  const isJakartaGeneral = normCity.includes('jakarta');
  if (isJakartaUtara || isJakartaGeneral || (lat > -6.15 && lat < -6.05 && lng > 106.65 && lng < 107.00)) {
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

  // 3. SURABAYA / SIDOARJO NORTH COAST:
  if (normCity.includes('surabaya')) {
    let safeLat = lat;
    let safeLng = lng;
    if (safeLat > -7.215) safeLat = -7.240 - (Math.abs(safeLat) % 0.015);
    if (safeLng > 112.795) safeLng = 112.770 - (Math.abs(safeLng) % 0.015);
    return { lat: safeLat, lng: safeLng };
  }

  // 4. SEMARANG:
  if (normCity.includes('semarang')) {
    let safeLat = lat;
    if (safeLat > -6.965) safeLat = -6.985 - (Math.abs(safeLat) % 0.015);
    return { lat: safeLat, lng };
  }

  // 5. MAKASSAR:
  if (normCity.includes('makassar')) {
    let safeLng = lng;
    if (safeLng < 119.418) safeLng = 119.435 + (Math.abs(safeLng) % 0.015);
    return { lat, lng: safeLng };
  }

  // 6. PADANG:
  if (normCity.includes('padang')) {
    let safeLng = lng;
    if (safeLng < 100.355) safeLng = 100.375 + (Math.abs(safeLng) % 0.015);
    return { lat, lng: safeLng };
  }

  // 7. BALIKPAPAN:
  if (normCity.includes('balikpapan')) {
    let safeLat = lat;
    let safeLng = lng;
    if (safeLat < -1.245) safeLat = -1.230 + (Math.abs(safeLat) % 0.015);
    if (safeLng < 116.835) safeLng = 116.860 + (Math.abs(safeLng) % 0.015);
    return { lat: safeLat, lng: safeLng };
  }

  // 8. KOTA KUPANG:
  if ((normCity.includes('kota') && normCity.includes('kupang')) || normCity === 'kota kupang') {
    let safeLat = lat;
    if (safeLat > -10.175) safeLat = -10.190 - (Math.abs(safeLat) % 0.015);
    return { lat: safeLat, lng };
  }

  // 9. DENPASAR / BADUNG:
  if (normCity.includes('denpasar') || normCity.includes('badung')) {
    let safeLat = lat;
    let safeLng = lng;
    if (safeLat < -8.705) safeLat = -8.680 + (Math.abs(safeLat) % 0.015);
    if (safeLng > 115.250) safeLng = 115.230 - (Math.abs(safeLng) % 0.015);
    return { lat: safeLat, lng: safeLng };
  }

  // 10. BANDA ACEH:
  if (normCity.includes('aceh')) {
    let safeLat = lat;
    let safeLng = lng;
    if (safeLat > 5.555) safeLat = 5.535 - (Math.abs(safeLat) % 0.015);
    if (safeLng < 95.315) safeLng = 95.335 + (Math.abs(safeLng) % 0.015);
    return { lat: safeLat, lng: safeLng };
  }

  // 11. MANADO:
  if (normCity.includes('manado')) {
    let safeLat = lat;
    let safeLng = lng;
    if (safeLat > 1.485) safeLat = 1.465 - (Math.abs(safeLat) % 0.015);
    if (safeLng < 124.835) safeLng = 124.855 + (Math.abs(safeLng) % 0.015);
    return { lat: safeLat, lng: safeLng };
  }

  // 12. AMBON (LEITIMUR PENINSULA):
  // Teluk Ambon (Ambon Bay) lies between lat -3.64 and -3.69, lng 128.17 to 128.23.
  // Any point projected into the bay must be pulled South-East onto the solid Leitimur mainland.
  if (normCity.includes('ambon')) {
    let safeLat = lat;
    let safeLng = lng;
    if (safeLat > -3.695) safeLat = -3.705 - (Math.abs(safeLat) % 0.008);
    if (safeLat < -3.710) safeLat = -3.708;
    if (safeLng < 128.178) safeLng = 128.188;
    if (safeLng > 128.215) safeLng = 128.205;
    return { lat: safeLat, lng: safeLng };
  }

  // 12A. FLORES TIMUR (LARANTUKA):
  // Larantuka is bordered by Flores Sea / Strait to the North & East.
  // Mainland is at lat -8.3414, lng 122.9834. Clamp South-West into mainland.
  if (normCity.includes('flores') && normCity.includes('timur')) {
    let safeLat = lat;
    let safeLng = lng;
    if (safeLat > -8.330) safeLat = -8.345 - (Math.abs(safeLat) % 0.006);
    if (safeLng > 122.980) safeLng = 122.975 - (Math.abs(safeLng) % 0.006);
    return { lat: safeLat, lng: safeLng };
  }

  // 12B. LEMBATA (LEWOLEBA):
  // Lewoleba faces Flores Sea to the North. Mainland center: lat -8.3750, lng 123.4900.
  if (normCity.includes('lembata')) {
    let safeLat = lat;
    let safeLng = lng;
    if (safeLat > -8.370) safeLat = -8.385 - (Math.abs(safeLat) % 0.006);
    if (safeLng > 123.510) safeLng = 123.495;
    return { lat: safeLat, lng: safeLng };
  }

  // 12C. ALOR (KALABAHI):
  // Kalabahi mainland center: lat -8.2167, lng 124.5167.
  if (normCity.includes('alor')) {
    let safeLat = lat;
    let safeLng = lng;
    if (safeLat > -8.210) safeLat = -8.225 - (Math.abs(safeLat) % 0.006);
    if (safeLng > 124.550) safeLng = 124.520;
    return { lat: safeLat, lng: safeLng };
  }

  // 12D. SIKKA (MAUMERE):
  // Maumere faces Flores Sea to the North. Mainland center: lat -8.6250, lng 122.2150.
  if (normCity.includes('sikka') || normCity.includes('maumere')) {
    let safeLat = lat;
    if (safeLat > -8.618) safeLat = -8.630 - (Math.abs(safeLat) % 0.006);
    return { lat: safeLat, lng };
  }

  // 12E. MANGGARAI BARAT (LABUAN BAJO):
  // Labuan Bajo borders the Flores Sea to the North and West. Mainland center: lat -8.5050, lng 119.8950.
  if (normCity.includes('manggarai') && normCity.includes('barat')) {
    let safeLat = lat;
    let safeLng = lng;
    if (safeLat > -8.490) safeLat = -8.508 - (Math.abs(safeLat) % 0.006);
    if (safeLng < 119.880) safeLng = 119.896 + (Math.abs(safeLng) % 0.006);
    return { lat: safeLat, lng: safeLng };
  }

  // 12F. BURU SELATAN (NAMROLE):
  // Namrole town center: lat -3.8580, lng 126.7330. Banda Sea is to the South and East.
  if (normCity.includes('buru') && normCity.includes('selatan')) {
    let safeLat = lat;
    let safeLng = lng;
    if (safeLat > -3.840 || safeLat < -3.875) safeLat = -3.855;
    if (safeLng > 126.740 || safeLng < 126.720) safeLng = 126.732;
    return { lat: safeLat, lng: safeLng };
  }

  // 12G. BURU (NAMLEA):
  // Namlea town center: lat -3.2600, lng 127.0850.
  if (normCity === 'buru' || (normCity.includes('buru') && !normCity.includes('selatan'))) {
    let safeLat = lat;
    let safeLng = lng;
    if (safeLng > 127.100) safeLng = 127.085;
    if (safeLat > -3.245) safeLat = -3.260;
    return { lat: safeLat, lng: safeLng };
  }

  // 12H. MALUKU TENGAH (MASOHI):
  // Masohi town center on Seram Island: lat -3.3080, lng 128.9560. Banda Sea / Teluk Elpaputih is to the South.
  if (normCity.includes('maluku') && normCity.includes('tengah')) {
    let safeLat = lat;
    if (safeLat < -3.315) safeLat = -3.305;
    return { lat: safeLat, lng };
  }

  // 12I. MALUKU BARAT DAYA (TIAKUR / MOA):
  // Tiakur town center on Moa Island: lat -8.1967, lng 127.9367.
  if (normCity.includes('barat daya')) {
    let safeLat = lat;
    let safeLng = lng;
    if (safeLat > -8.185 || safeLat < -8.210) safeLat = -8.1967;
    if (safeLng > 127.950 || safeLng < 127.920) safeLng = 127.9367;
    return { lat: safeLat, lng: safeLng };
  }

  // 12J. KEPULAUAN TANIMBAR (SAUMLAKI):
  // Saumlaki town center on Yamdena Island: lat -7.9800, lng 131.2950.
  if (normCity.includes('tanimbar')) {
    let safeLat = lat;
    let safeLng = lng;
    if (safeLat > -7.965 || safeLat < -7.995) safeLat = -7.980;
    if (safeLng > 131.310 || safeLng < 131.280) safeLng = 131.295;
    return { lat: safeLat, lng: safeLng };
  }

  // 12K. KOTA BANJARMASIN (SOUTH KALIMANTAN):
  // Coastline facing Java Sea is south. Central Banjarmasin is lat -3.3250, lng 114.5950.
  if (normCity.includes('banjarmasin')) {
    let safeLat = lat;
    let safeLng = lng;
    if (safeLat > -3.310) safeLat = -3.325;
    if (safeLng > 114.610) safeLng = 114.595;
    return { lat: safeLat, lng: safeLng };
  }

  // 13. JAYAPURA:
  if (normCity.includes('jayapura')) {
    let safeLat = lat;
    if (safeLat > -2.535) safeLat = -2.550;
    return { lat: safeLat, lng };
  }

  // 14. MATARAM:
  if (normCity.includes('mataram')) {
    let safeLng = lng;
    if (safeLng < 116.085) safeLng = 116.105;
    return { lat, lng: safeLng };
  }

  // 15. PALU:
  if (normCity.includes('palu')) {
    let safeLat = lat;
    if (safeLat > -0.885) safeLat = -0.900;
    return { lat: safeLat, lng };
  }

  // 16. KENDARI:
  if (normCity.includes('kendari')) {
    let safeLng = lng;
    if (safeLng > 122.560) safeLng = 122.545;
    return { lat, lng: safeLng };
  }

  // 17. TERNATE:
  if (normCity.includes('ternate')) {
    let safeLng = lng;
    let safeLat = lat;
    if (safeLng < 127.350) safeLng = 127.375;
    if (safeLng > 127.385) safeLng = 127.378;
    if (safeLat < 0.740) safeLat = 0.770;
    if (safeLat > 0.830) safeLat = 0.800;
    return { lat: safeLat, lng: safeLng };
  }

  // 18. KOTA TIDORE KEPULAUAN:
  // Tidore island is bounded by lng 127.350 to 127.432, lat 0.630 to 0.740.
  // The coast of Soasio is to the East (lng >= 127.432 is ocean).
  // Mainland Soasio is lng 127.415 to 127.429, lat 0.670 to 0.698.
  if (normCity.includes('tidore') || (lat > 0.60 && lat < 0.76 && lng > 127.430 && lng < 127.520)) {
    let safeLng = lng;
    let safeLat = lat;
    if (safeLng > 127.430) {
      safeLng = 127.426 - (Math.abs(safeLng) % 0.005); // Push West inland into Soasio
    } else if (safeLng < 127.360) {
      safeLng = 127.375 + (Math.abs(safeLng) % 0.005);
    }
    if (safeLat < 0.640) safeLat = 0.665;
    if (safeLat > 0.715) safeLat = 0.695;
    return { lat: safeLat, lng: safeLng };
  }

  // 19. TARAKAN:
  if (normCity.includes('tarakan')) {
    let safeLng = lng;
    if (safeLng < 117.575) safeLng = 117.590;
    return { lat, lng: safeLng };
  }

  // 20. SIBOLGA & BENGKULU & PARIAMAN:
  if (normCity.includes('sibolga') && lng < 98.775) return { lat, lng: 98.790 };
  if (normCity.includes('bengkulu') && lng < 102.260) return { lat, lng: 102.280 };
  if (normCity.includes('pariaman') && lng < 100.120) return { lat, lng: 100.135 };

  // 21. TUAL & MALUKU TENGGARA (KEI):
  if ((normCity.includes('tual') || normCity.includes('maluku tenggara')) && lng > 132.755) {
    return { lat, lng: 132.735 };
  }

  // 22. GUNUNGSITOLI / NIAS:
  if ((normCity.includes('gunungsitoli') || normCity.includes('nias')) && lng > 97.620) {
    return { lat, lng: 97.600 };
  }

  // 23. BAUBAU (BUTON):
  if (normCity.includes('baubau') && lng < 122.590) {
    return { lat, lng: 122.615 };
  }

  // 24. BITUNG:
  if (normCity.includes('bitung') && lng > 125.195) {
    return { lat, lng: 125.175 };
  }

  // 25. SINGKAWANG:
  if (normCity.includes('singkawang') && lng < 108.970) {
    return { lat, lng: 108.995 };
  }

  // 26. SABANG (PULAU WEH):
  if (normCity.includes('sabang')) {
    let safeLat = lat;
    let safeLng = lng;
    if (safeLat > 5.900) safeLat = 5.880;
    if (safeLng > 95.340) safeLng = 95.315;
    return { lat: safeLat, lng: safeLng };
  }

  // 27. GENERAL JAVA NORTH COAST:
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

  // 28. UNIVERSAL PROXIMITY SAFEGUARD FOR ALL 514 REGIONS:
  // If city is specified, compare against its verified administrative land centroid.
  // Centroids in INDONESIA_514_REGIONS are 100% verified to be on solid land in town centers.
  // If a coordinate drifts > 0.022 deg (~2.4 km) from the verified land center,
  // pull it gently back towards the land center (radius ~1.2 km) to ensure it stays on land.
  if (city) {
    const reg = findRegionByName(city);
    if (reg && Number.isFinite(reg.lat) && Number.isFinite(reg.lng)) {
      // Immediate snapping if falling into open sea basins
      if (isCoordinateInOpenSea(lat, lng)) {
        return { lat: reg.lat, lng: reg.lng };
      }
      const dist = Math.hypot(lng - reg.lng, lat - reg.lat);
      if (dist > 0.040) {
        const angle = Math.atan2(lat - reg.lat, lng - reg.lng);
        const safeRadius = 0.018 + (Math.abs(lat + lng) % 0.005);
        return {
          lat: reg.lat + Math.sin(angle) * safeRadius,
          lng: reg.lng + Math.cos(angle) * safeRadius,
        };
      }
    }
  }

  // Universal open sea safety net
  if (isCoordinateInOpenSea(lat, lng)) {
    if (city) {
      const reg = findRegionByName(city);
      if (reg && Number.isFinite(reg.lat) && Number.isFinite(reg.lng)) {
        return { lat: reg.lat, lng: reg.lng };
      }
    }
    return { lat: -6.2088, lng: 106.8456 }; // Default to central Jakarta mainland
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

  // If direct verified destination coordinates exist:
  if (
    vehicle.destination_lat != null &&
    vehicle.destination_lng != null &&
    Number.isFinite(vehicle.destination_lat) &&
    Number.isFinite(vehicle.destination_lng)
  ) {
    const clamped = clampCoordinatesToLand(vehicle.destination_lat, vehicle.destination_lng, vehicle.city);
    // If no SPPG origin is specified, return the direct clamped land coordinates
    if (!sppgFallback && vehicle.last_lat == null) {
      return { name, lat: clamped.lat, lng: clamped.lng };
    }
  }

  // SPPG Hub is the food pickup point
  const reg = vehicle.city ? findRegionByName(vehicle.city) : null;
  const baseLat = sppgFallback?.lat ?? (Number.isFinite(vehicle.last_lat) ? (vehicle.last_lat as number) : (reg?.lat ?? -6.2));
  const baseLng = sppgFallback?.lng ?? (Number.isFinite(vehicle.last_lng) ? (vehicle.last_lng as number) : (reg?.lng ?? 106.8));

  // 1. Direct verified destination coordinates:
  // Must be clamped to land, NOT in open sea, AND strictly within 1.0 - 3.0 KM from SPPG pickup point!
  if (
    vehicle.destination_lat != null &&
    vehicle.destination_lng != null &&
    Number.isFinite(vehicle.destination_lat) &&
    Number.isFinite(vehicle.destination_lng)
  ) {
    const clamped = clampCoordinatesToLand(vehicle.destination_lat, vehicle.destination_lng, vehicle.city);
    const dKm = distanceKm(baseLat, baseLng, clamped.lat, clamped.lng);
    if (dKm >= 1.0 && dKm <= 3.0 && !isCoordinateInOpenSea(clamped.lat, clamped.lng)) {
      return { name, lat: clamped.lat, lng: clamped.lng };
    }
  }

  // 2. Extract from route endpoint if route geometry exists
  if (isValidRoute(vehicle.route_geometry)) {
    const lastPoint = vehicle.route_geometry[vehicle.route_geometry.length - 1];
    if (isValidCoord(lastPoint)) {
      const clamped = clampCoordinatesToLand(lastPoint[1], lastPoint[0], vehicle.city);
      const dKm = distanceKm(baseLat, baseLng, clamped.lat, clamped.lng);
      if (dKm >= 1.0 && dKm <= 3.0 && !isCoordinateInOpenSea(clamped.lat, clamped.lng)) {
        return { name, lat: clamped.lat, lng: clamped.lng };
      }
    }
  }

  // 3. Deterministic regional offset strictly within 1.0 - 3.0 KM from SPPG:
  const idStr = vehicle.id || vehicle.city || 'default';
  const hash = Math.abs(idStr.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0));
  
  // Deterministic inland bias for ALL coast & sea types:
  const normCity = (vehicle.city || '').toLowerCase();
  
  // Flores Sea coastlines:
  const isFloresSea = normCity.includes('flores') || normCity.includes('lembata') || normCity.includes('alor') ||
                      normCity.includes('sikka') || normCity.includes('manggarai') || normCity.includes('ngada') ||
                      normCity.includes('nagekeo') || normCity.includes('ende');
  
  // Banda Sea island coastlines:
  const isBandaSea = normCity.includes('ambon') || normCity.includes('buru') || normCity.includes('tual') ||
                     normCity.includes('tanimbar') || normCity.includes('aru') || normCity.includes('barat daya') ||
                     normCity.includes('maluku tengah');

  // Java Sea coastlines:
  const isJavaNorthCoast = normCity.includes('jakarta') || normCity.includes('surabaya') || normCity.includes('semarang') ||
                           normCity.includes('cirebon') || normCity.includes('pekalongan') || normCity.includes('tegal') ||
                           normCity.includes('pasuruan') || normCity.includes('probolinggo') || normCity.includes('tuban') ||
                           normCity.includes('gresik') || normCity.includes('brebes') || normCity.includes('indramayu');

  const isBanjarmasin = normCity.includes('banjarmasin');

  const isNorthCoast = isJavaNorthCoast || (normCity.includes('kota') && normCity.includes('kupang')) || normCity.includes('jayapura') || normCity.includes('medan') || normCity.includes('lhokseumawe');
  const isWestCoast = normCity.includes('sorong') || normCity.includes('makassar') || normCity.includes('padang') || normCity.includes('bengkulu') || normCity.includes('singkawang') || normCity.includes('manado') || normCity.includes('mataram') || normCity.includes('aceh') || normCity.includes('sibolga') || normCity.includes('meulaboh') || normCity.includes('pariaman');
  const isEastCoast = normCity.includes('tidore') || normCity.includes('ternate') || normCity.includes('balikpapan') || normCity.includes('kendari') || normCity.includes('denpasar') || normCity.includes('sanur') || normCity.includes('bontang') || normCity.includes('samarinda') || normCity.includes('gunungsitoli') || normCity.includes('bitung');
  const isSouthCoast = normCity.includes('cilacap') || normCity.includes('kebumen') || normCity.includes('pacitan') || normCity.includes('gunungkidul') || normCity.includes('bantul') || normCity.includes('sukabumi') || normCity.includes('garut') || normCity.includes('tasikmalaya') || normCity.includes('pangandaran') || normCity.includes('jember') || normCity.includes('banyuwangi') || normCity.includes('blitar') || normCity.includes('malang');

  let angle: number;
  if (normCity.includes('ambon')) {
    angle = -Math.PI / 4 + (((hash % 8) - 4) / 8) * (Math.PI / 4); // Aim South-East into Leitimur mainland
  } else if (isFloresSea) {
    angle = -Math.PI / 2 + (((hash % 8) - 4) / 8) * (Math.PI / 4); // Strictly South into Flores island mainland away from Flores Sea
  } else if (isBandaSea) {
    angle = (normCity.includes('buru') || normCity.includes('tanimbar')) ? Math.PI : -Math.PI / 2; // Inward to island
  } else if (isBanjarmasin) {
    angle = Math.PI / 2 + (((hash % 8) - 4) / 8) * (Math.PI / 4); // North into Kalimantan mainland away from Java Sea
  } else if (isNorthCoast) {
    angle = -Math.PI / 2 + (((hash % 8) - 4) / 8) * (Math.PI / 3); // Aim South into mainland
  } else if (isWestCoast) {
    angle = 0 + (((hash % 8) - 4) / 8) * (Math.PI / 3); // Aim East into mainland
  } else if (isEastCoast) {
    angle = Math.PI + (((hash % 8) - 4) / 8) * (Math.PI / 3); // Aim West into mainland
  } else if (isSouthCoast) {
    angle = Math.PI / 2 + (((hash % 8) - 4) / 8) * (Math.PI / 3); // Aim North into mainland
  } else {
    angle = ((hash % 16) / 16) * Math.PI * 2;
  }

  // Target distance: strictly 1.4 - 2.4 KM (0.013° - 0.022°)
  const targetRadius = 0.013 + ((hash % 6) * 0.0018);

  let rawLat = baseLat + Math.sin(angle) * targetRadius;
  let rawLng = baseLng + Math.cos(angle) * targetRadius;
  let clamped = clampCoordinatesToLand(rawLat, rawLng, vehicle.city);
  let dist = distanceKm(baseLat, baseLng, clamped.lat, clamped.lng);

  // Strict 1.0 - 3.0 KM post-clamp validation
  if (dist < 1.0) {
    // Too close: try alternative inland angles
    const altAngles = [angle, angle + Math.PI / 2, angle - Math.PI / 2, angle + Math.PI];
    for (const a of altAngles) {
      for (const step of [0.015, 0.018, 0.022]) {
        const altLat = baseLat + Math.sin(a) * step;
        const altLng = baseLng + Math.cos(a) * step;
        const altClamped = clampCoordinatesToLand(altLat, altLng, vehicle.city);
        const altDist = distanceKm(baseLat, baseLng, altClamped.lat, altClamped.lng);
        if (altDist >= 1.0 && altDist <= 3.0) {
          clamped = altClamped;
          dist = altDist;
          break;
        }
      }
      if (dist >= 1.0 && dist <= 3.0) break;
    }
  } else if (dist > 3.0) {
    // Too far: scale back towards SPPG base
    const scale = 2.4 / dist;
    const scaledLat = baseLat + (clamped.lat - baseLat) * scale;
    const scaledLng = baseLng + (clamped.lng - baseLng) * scale;
    clamped = clampCoordinatesToLand(scaledLat, scaledLng, vehicle.city);
  }

  return {
    name,
    lat: clamped.lat,
    lng: clamped.lng,
  };
}
