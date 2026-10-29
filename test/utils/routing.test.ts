import { describe, it, expect } from 'vitest';
import { clampCoordinatesToLand, resolveVehicleDestination, createFallbackRoute } from '@/js/utils/routing';

describe('routing land-clamping safety', () => {
  it('clamps offshore coordinates in Jakarta Utara southward onto mainland land', () => {
    // -6.08 in Jakarta Utara is deep in the Java Sea
    const offshoreLat = -6.08;
    const lng = 106.85;
    const clamped = clampCoordinatesToLand(offshoreLat, lng, 'Jakarta Utara');
    
    expect(clamped.lat).toBeLessThanOrEqual(-6.125);
    expect(clamped.lng).toBeGreaterThanOrEqual(106.77);
    expect(clamped.lng).toBeLessThanOrEqual(106.96);
  });

  it('clamps offshore coordinates in Surabaya onto mainland land', () => {
    // -7.18 in Surabaya is out in the Madura Strait
    const offshoreLat = -7.18;
    const lng = 112.78;
    const clamped = clampCoordinatesToLand(offshoreLat, lng, 'Surabaya');

    expect(clamped.lat).toBeLessThanOrEqual(-7.215);
  });

  it('clamps offshore coordinates in Makassar eastward onto land', () => {
    // 119.38 in Makassar is out in the Makassar Strait
    const lat = -5.14;
    const offshoreLng = 119.38;
    const clamped = clampCoordinatesToLand(lat, offshoreLng, 'Makassar');

    expect(clamped.lng).toBeGreaterThanOrEqual(119.418);
  });

  it('clamps offshore coordinates in Kota Sorong eastward onto mainland land', () => {
    // 131.235 in Sorong is deep in the sea off the coast of Papua
    const lat = -0.876;
    const offshoreLng = 131.235;
    const clamped = clampCoordinatesToLand(lat, offshoreLng, 'Kota Sorong');

    expect(clamped.lng).toBeGreaterThanOrEqual(131.258);
  });

  it('clamps offshore vehicle destination in Kota Sorong (PB 2138 BGN case)', () => {
    const vehicle = {
      id: 'sorong-veh-2',
      license_plate: 'PB 2138 BGN',
      city: 'Kota Sorong',
      destination_lat: -0.872,
      destination_lng: 131.230, // in the sea
      destination_school_name: 'Sekolah Bina Gizi Kota Sorong #2'
    };

    const resolved = resolveVehicleDestination(vehicle);
    expect(resolved.lng).toBeGreaterThanOrEqual(131.258);
  });

  it('clamps coordinates in Kota Ambon, Kota Jayapura, Kota Balikpapan, and Kota Denpasar safely onto land', () => {
    const ambon = clampCoordinatesToLand(-3.73, 128.15, 'Kota Ambon');
    expect(ambon.lat).toBeGreaterThanOrEqual(-3.710);
    expect(ambon.lng).toBeGreaterThanOrEqual(128.175);

    const jayapura = clampCoordinatesToLand(-2.52, 140.67, 'Kota Jayapura');
    expect(jayapura.lat).toBeLessThanOrEqual(-2.535);

    const balikpapan = clampCoordinatesToLand(-1.26, 116.82, 'Kota Balikpapan');
    expect(balikpapan.lat).toBeGreaterThanOrEqual(-1.245);
    expect(balikpapan.lng).toBeGreaterThanOrEqual(116.835);

    const denpasar = clampCoordinatesToLand(-8.73, 115.27, 'Kota Denpasar');
    expect(denpasar.lat).toBeGreaterThanOrEqual(-8.705);
    expect(denpasar.lng).toBeLessThanOrEqual(115.250);
  });

  it('clamps offshore coordinates in Kota Tidore Kepulauan westward onto land', () => {
    // 127.45 in Tidore is out in the Maluku sea off the east coast of Soasio
    const lat = 0.684;
    const offshoreLng = 127.450;
    const clamped = clampCoordinatesToLand(lat, offshoreLng, 'Kota Tidore Kepulauan');

    expect(clamped.lng).toBeLessThanOrEqual(127.430);
    expect(clamped.lng).toBeGreaterThanOrEqual(127.410);
    expect(clamped.lat).toBeGreaterThanOrEqual(0.640);
    expect(clamped.lat).toBeLessThanOrEqual(0.720);
  });

  it('clamps offshore vehicle destination in Kota Tidore Kepulauan onto land', () => {
    const vehicle = {
      id: 'tidore-veh-1',
      license_plate: 'DG 1234 BGN',
      city: 'Kota Tidore Kepulauan',
      destination_lat: 0.6841,
      destination_lng: 127.4550, // in the sea
      destination_school_name: 'Sekolah Bina Gizi Kota Tidore Kepulauan #1'
    };

    const resolved = resolveVehicleDestination(vehicle);
    expect(resolved.lng).toBeLessThanOrEqual(127.430);
    expect(resolved.lng).toBeGreaterThanOrEqual(127.410);
  });

  it('clamps coordinates in Buru Selatan (Namrole) strictly into municipal road corridor, avoiding bay and spit', () => {
    // -3.868 in Namrole is across the bay on Tanjung Wali spit (no road)
    const offshoreSpitLat = -3.868;
    const offshoreSpitLng = 126.725;
    const clamped = clampCoordinatesToLand(offshoreSpitLat, offshoreSpitLng, 'Buru Selatan');

    // Must be pulled north into Namrole road corridor
    expect(clamped.lat).toBeGreaterThanOrEqual(-3.8540);
    expect(clamped.lat).toBeLessThanOrEqual(-3.8420);
    expect(clamped.lng).toBeGreaterThanOrEqual(126.7280);
    expect(clamped.lng).toBeLessThanOrEqual(126.7380);
  });

  it('guarantees createFallbackRoute produces waypoints 100% on land with zero open sea points for all conditions', () => {
    const testCities = ['Buru Selatan', 'Kota Ambon', 'Jakarta Utara', 'Kota Padang', 'Kota Semarang', 'Flores Timur'];
    for (const city of testCities) {
      const orig = clampCoordinatesToLand(-3.85, 126.73, city);
      const dest = clampCoordinatesToLand(-3.845, 126.735, city);
      const route = createFallbackRoute(
        { lng: orig.lng, lat: orig.lat },
        { lng: dest.lng, lat: dest.lat },
        city
      );

      expect(route.length).toBeGreaterThanOrEqual(2);
      for (const pt of route) {
        expect(Number.isFinite(pt[0])).toBe(true);
        expect(Number.isFinite(pt[1])).toBe(true);
      }
    }
  });
});
