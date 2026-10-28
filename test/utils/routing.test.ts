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

  it('resolveVehicleDestination guarantees land destination even if input is offshore', () => {
    const vehicle = {
      id: 'test-veh-1',
      city: 'Jakarta Utara',
      destination_lat: -6.075, // in Java Sea
      destination_lng: 106.88,
      destination_school_name: 'SDN Pantai Muara 01'
    };

    const resolved = resolveVehicleDestination(vehicle);
    expect(resolved.name).toBe('SDN Pantai Muara 01');
    expect(resolved.lat).toBeLessThanOrEqual(-6.125);
  });
});
