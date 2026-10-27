import { Vehicle, VehicleStatus } from '@/js/store/vehicleStore';

export type VehicleStatCategory = 'moving' | 'unloading' | 'idle' | 'other';

/**
 * Strict exhaustive categorization mapping for all VehicleStatus values.
 * Using Record<VehicleStatus, VehicleStatCategory> ensures at compile-time
 * that no status can ever be missing or unhandled.
 */
export const STATUS_TO_CATEGORY: Record<VehicleStatus, VehicleStatCategory> = {
  // In-transit / active movements
  en_route: 'moving',
  delayed: 'moving',
  off_route: 'moving',

  // Active delivery at school destination
  unloading: 'unloading',

  // Standby / depot preparation
  idle: 'idle',
  loading: 'idle',

  // Non-operational / incidents
  accident: 'other',
  maintenance: 'other',
  offline: 'other',
};

export interface FleetStats {
  total: number;
  moving: number;
  unloading: number;
  idle: number;
  other: number;
}

/**
 * Computes fleet stats in a single O(N) pass.
 * Robust against empty arrays, null/undefined properties, or unknown statuses.
 * 
 * Strict Invariant Guarantee:
 * stats.moving + stats.unloading + stats.idle + stats.other === stats.total
 */
export function computeFleetStats(vehicles: readonly Vehicle[] | null | undefined): FleetStats {
  const stats: FleetStats = {
    total: 0,
    moving: 0,
    unloading: 0,
    idle: 0,
    other: 0,
  };

  if (!vehicles || vehicles.length === 0) {
    return stats;
  }

  for (let i = 0; i < vehicles.length; i++) {
    const v = vehicles[i];
    if (!v) continue;
    stats.total++;

    const category = STATUS_TO_CATEGORY[v.status] ?? 'other';
    stats[category]++;
  }

  return stats;
}
