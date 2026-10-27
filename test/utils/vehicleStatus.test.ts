import { describe, it, expect } from 'vitest';
import { computeFleetStats, STATUS_TO_CATEGORY, VehicleStatCategory } from '@/js/utils/vehicleStatus';
import { Vehicle, VehicleStatus } from '@/js/store/vehicleStore';

describe('vehicleStatus utility', () => {
  const allStatuses: VehicleStatus[] = [
    'idle',
    'en_route',
    'loading',
    'unloading',
    'delayed',
    'accident',
    'maintenance',
    'off_route',
    'offline',
  ];

  it('exhaustively categorizes all VehicleStatus values without undefined', () => {
    for (const status of allStatuses) {
      const category: VehicleStatCategory = STATUS_TO_CATEGORY[status];
      expect(category).toBeDefined();
      expect(['moving', 'unloading', 'idle', 'other']).toContain(category);
    }
  });

  it('maps unloading specifically to unloading category', () => {
    expect(STATUS_TO_CATEGORY['unloading']).toBe('unloading');
  });

  it('maps en_route, delayed, off_route to moving', () => {
    expect(STATUS_TO_CATEGORY['en_route']).toBe('moving');
    expect(STATUS_TO_CATEGORY['delayed']).toBe('moving');
    expect(STATUS_TO_CATEGORY['off_route']).toBe('moving');
  });

  it('maps idle and loading to idle (standby)', () => {
    expect(STATUS_TO_CATEGORY['idle']).toBe('idle');
    expect(STATUS_TO_CATEGORY['loading']).toBe('idle');
  });

  it('maps accident, maintenance, offline to other', () => {
    expect(STATUS_TO_CATEGORY['accident']).toBe('other');
    expect(STATUS_TO_CATEGORY['maintenance']).toBe('other');
    expect(STATUS_TO_CATEGORY['offline']).toBe('other');
  });

  it('returns zeros for null, undefined, or empty arrays', () => {
    const emptyResult = { total: 0, moving: 0, unloading: 0, idle: 0, other: 0 };
    expect(computeFleetStats(null)).toEqual(emptyResult);
    expect(computeFleetStats(undefined)).toEqual(emptyResult);
    expect(computeFleetStats([])).toEqual(emptyResult);
  });

  it('strictly satisfies the invariant: moving + unloading + idle + other === total', () => {
    const mockVehicles: Vehicle[] = allStatuses.map((status, idx) => ({
      id: `v-${idx}`,
      license_plate: `B ${1000 + idx} BGN`,
      driver_name: `Driver ${idx}`,
      status,
      last_lat: -6.2,
      last_lng: 106.8,
      updated_at: new Date().toISOString(),
    }));

    const stats = computeFleetStats(mockVehicles);

    expect(stats.total).toBe(mockVehicles.length);
    expect(stats.moving + stats.unloading + stats.idle + stats.other).toBe(stats.total);
    expect(stats.unloading).toBe(1);
    expect(stats.moving).toBe(3); // en_route, delayed, off_route
    expect(stats.idle).toBe(2);   // idle, loading
    expect(stats.other).toBe(3);  // accident, maintenance, offline
  });

  it('handles unknown or unexpected status gracefully into other category', () => {
    const strangeVehicle = {
      id: 'v-strange',
      license_plate: 'B 9999 STR',
      driver_name: 'Unknown',
      status: 'unforeseen_status' as unknown as VehicleStatus,
      last_lat: 0,
      last_lng: 0,
      updated_at: new Date().toISOString(),
    };

    const stats = computeFleetStats([strangeVehicle]);
    expect(stats.total).toBe(1);
    expect(stats.other).toBe(1);
    expect(stats.moving + stats.unloading + stats.idle + stats.other).toBe(stats.total);
  });
});
