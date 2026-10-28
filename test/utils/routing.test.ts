import { describe, it, expect } from 'vitest';
import { clampCoordinatesToLand, resolveVehicleDestination } from '@/js/utils/routing';

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
});
