import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { supabase } from '@/js/core/SupabaseClient';
import NotificationService from '@/js/services/NotificationService';
import { createFallbackRoute, degDistance, distanceKm, isValidRoute, clampCoordinatesToLand, resolveVehicleDestination } from '@/js/utils/routing';


export type VehicleStatus =
  | 'idle'
  | 'en_route'
  | 'loading'
  | 'unloading'
  | 'delayed'
  | 'accident'
  | 'maintenance'
  | 'off_route'
  | 'offline';

export type VehicleRouteSource = 'mapbox_driving' | 'legacy_unverified' | 'demo_unverified';

export interface VerifiedDrivingRoute {
  coordinates: number[][];
  snappedStart: [number, number];
  snappedDestination: [number, number];
  distance?: number;
}

export interface Vehicle {
  id: string;
  license_plate: string;
  driver_name: string | null;
  status: VehicleStatus;
  city?: string;
  last_lat: number | null;
  last_lng: number | null;
  destination_school_name?: string | null;
  destination_lat?: number | null;
  destination_lng?: number | null;
  route_geometry?: number[][] | null;
  route_source?: VehicleRouteSource | null;
  route_progress?: number | null;
  bearing?: number | null;
  display_lat?: number;
  display_lng?: number;
  updated_at: string;
}

let vehicleLoadGeneration = 0;

// While the local simulation engine runs it is the single source of truth for
// motion fields. Realtime echoes of our own (delayed) batch sync must not rewind them.
let localSimulationActive = false;
export const setLocalSimulationActive = (active: boolean) => { localSimulationActive = active; };
export const isLocalSimulationActive = () => localSimulationActive;

export type FleetFilterCategory = 'all' | 'moving' | 'unloading' | 'idle' | 'other';

interface VehicleState {
  vehicles: Vehicle[];
  loading: boolean;
  error: string | null;
  selectedCity: string;
  selectedCategory: FleetFilterCategory;
  hasDemoData: boolean; // Tracking if demo data is currently seeded
  actions: {
    loadVehicles: () => Promise<Vehicle[]>;
    invalidatePendingLoads: () => void;
    subscribeRealtime: () => (() => void);
    setSelectedCity: (city: string) => void;
    setSelectedCategory: (category: FleetFilterCategory) => void;
    setHasDemoData: (val: boolean) => void;
  };
}

export const useVehicleStore = create<VehicleState>()(
  devtools((set, get) => ({
    vehicles: [],
    loading: false,
    error: null,
    selectedCity: 'Semua',
    selectedCategory: 'all',
    hasDemoData: false,
    actions: {
      setSelectedCity: (city: string) => set({ selectedCity: city }),
      setSelectedCategory: (category: FleetFilterCategory) => set({ selectedCategory: category }),
      setHasDemoData: (val: boolean) => set({ hasDemoData: val }),
      invalidatePendingLoads: () => { vehicleLoadGeneration += 1; },
      loadVehicles: async () => {
        const requestGeneration = ++vehicleLoadGeneration;
        set({ loading: true, error: null });
        try {
          const { data, error } = await supabase.from('vehicles').select('*');
          if (error) throw error;

          const { resolveSppgLocation } = await import('../data/indonesia_regions');

          // Reset any "active" statuses persisted from a previous simulation session.
          // Simulation is never running at startup, so all moving vehicles must appear
          // as 'idle' (Siaga) and positioned at the SPPG Hub (start of their route).
          const ACTIVE_STATUSES: VehicleStatus[] = ['en_route', 'delayed', 'unloading', 'loading'];
          const cityVehicleCounts = new Map<string, number>();
          const fetchedVehicles: Vehicle[] = (data ?? []).map((v: Vehicle) => {
            const isIdle = ACTIVE_STATUSES.includes(v.status) || v.status === 'idle';
            if (isIdle) {
              const cityKey = (v.city || '').toLowerCase();
              const idx = cityVehicleCounts.get(cityKey) || 0;
              cityVehicleCounts.set(cityKey, idx + 1);

              const clLast = (v.last_lat != null && v.last_lng != null)
                ? clampCoordinatesToLand(v.last_lat, v.last_lng, v.city)
                : null;
              const cleanLastLat = clLast ? clLast.lat : v.last_lat;
              const cleanLastLng = clLast ? clLast.lng : v.last_lng;

              const sppgLoc = resolveSppgLocation(v.city, undefined, {
                vehicleLat: cleanLastLat,
                vehicleLng: cleanLastLng,
                vehicleIndex: idx,
              });
              const rawSppgLng = sppgLoc?.lng ?? cleanLastLng;
              const rawSppgLat = sppgLoc?.lat ?? cleanLastLat;
              const clampedSppg = clampCoordinatesToLand(
                rawSppgLat ?? -6.2,
                rawSppgLng ?? 106.8,
                v.city
              );
              const sppgLng = clampedSppg.lng;
              const sppgLat = clampedSppg.lat;

              // Ensure destination is 100% on land, non-null, and strictly within 1.0 - 3.0 KM from SPPG
              let destLng = v.destination_lng;
              let destLat = v.destination_lat;
              let destSchoolName = v.destination_school_name;
              const safeSppgLat = sppgLat ?? -6.2;
              const safeSppgLng = sppgLng ?? 106.8;
              const hasCoords = destLng != null && destLat != null && Number.isFinite(destLng) && Number.isFinite(destLat);
              const curDist = hasCoords ? distanceKm(safeSppgLat, safeSppgLng, destLat as number, destLng as number) : 0;

              if (!hasCoords || curDist < 1.0 || curDist > 3.0) {
                const resolved = resolveVehicleDestination(v, { lat: safeSppgLat, lng: safeSppgLng });
                destLat = resolved.lat;
                destLng = resolved.lng;
                destSchoolName = resolved.name;
              } else {
                const clamped = clampCoordinatesToLand(destLat as number, destLng as number, v.city);
                destLat = clamped.lat;
                destLng = clamped.lng;
              }

              const hasRoute = isValidRoute(v.route_geometry);
              const hasHub = sppgLng != null && sppgLat != null;
              const startsAtHub = hasRoute && (!hasHub
                || degDistance(v.route_geometry![0], [sppgLng as number, sppgLat as number]) < 0.005);
              const endsAtSchool = hasRoute
                && degDistance(v.route_geometry![v.route_geometry!.length - 1], [destLng as number, destLat as number]) < 0.005;

              let routeGeometry = v.route_geometry;
              let routeSource = v.route_source;
              if ((!startsAtHub || !endsAtSchool || !hasRoute) && hasHub) {
                // Rebuild clean overland route from Hub to School
                routeGeometry = createFallbackRoute(
                  { lng: sppgLng as number, lat: sppgLat as number },
                  { lng: destLng as number, lat: destLat as number },
                );
                routeSource = 'demo_unverified';
              }

              if (Array.isArray(routeGeometry)) {
                routeGeometry = routeGeometry.map((coord: number[]) => {
                  if (Array.isArray(coord) && coord.length >= 2 && Number.isFinite(coord[0]) && Number.isFinite(coord[1])) {
                    const cl = clampCoordinatesToLand(coord[1], coord[0], v.city);
                    return [cl.lng, cl.lat];
                  }
                  return coord;
                });
              }

              const res: Vehicle = {
                ...v,
                status: 'idle' as VehicleStatus,
                route_progress: 0,
                last_lng: sppgLng,
                last_lat: sppgLat,
                destination_lat: destLat,
                destination_lng: destLng,
                destination_school_name: destSchoolName || v.destination_school_name,
                route_source: routeSource ?? 'demo_unverified',
              };
              if (routeGeometry !== undefined) {
                res.route_geometry = routeGeometry;
              }
              return res;
            }
            return v;
          });

          if (requestGeneration !== vehicleLoadGeneration) return get().vehicles;
          set({ 
            vehicles: fetchedVehicles,
            error: null,
            hasDemoData: fetchedVehicles.length > 0
          });
          return fetchedVehicles;
        } catch (error: any) {
          if (requestGeneration !== vehicleLoadGeneration) return get().vehicles;
          console.error('Failed to load vehicles:', error?.message || error);
          set({ error: error?.message || 'Gagal memuat kendaraan.' });
          throw error;
        } finally {
          if (requestGeneration === vehicleLoadGeneration) set({ loading: false });
        }
      },
      subscribeRealtime: () => {
        const existingChannel = supabase.getChannels().find((c: any) => c.topic === 'realtime:public:vehicles');
        if (existingChannel) {
          supabase.removeChannel(existingChannel);
        }

        const channel = supabase
          .channel('public:vehicles')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicles' }, (payload: any) => {
            set((state) => {
              if (payload.eventType === 'DELETE') {
                const vehicles = state.vehicles.filter((v) => v.id !== payload.old.id);
                return { vehicles, hasDemoData: vehicles.length > 0 };
              }

              const newVehicle = payload.new as Vehicle;
              const idx = state.vehicles.findIndex((v) => v.id === newVehicle.id);
              
              if (payload.eventType === 'INSERT' && idx === -1) {
                const clLast = (newVehicle.last_lat != null && newVehicle.last_lng != null)
                  ? clampCoordinatesToLand(newVehicle.last_lat, newVehicle.last_lng, newVehicle.city)
                  : null;
                const clDest = (newVehicle.destination_lat != null && newVehicle.destination_lng != null)
                  ? clampCoordinatesToLand(newVehicle.destination_lat, newVehicle.destination_lng, newVehicle.city)
                  : null;
                const safeInsert: Vehicle = {
                  ...newVehicle,
                  last_lat: clLast ? clLast.lat : newVehicle.last_lat,
                  last_lng: clLast ? clLast.lng : newVehicle.last_lng,
                  destination_lat: clDest ? clDest.lat : newVehicle.destination_lat,
                  destination_lng: clDest ? clDest.lng : newVehicle.destination_lng,
                };
                const vehicles = [...state.vehicles, safeInsert];
                return { vehicles, hasDemoData: vehicles.length > 0 };
              }
              
              if (payload.eventType === 'UPDATE' && idx !== -1) {
                const newVehicles = [...state.vehicles];
                const existingVehicle = newVehicles[idx];
                const updatedVehicle = { 
                  ...existingVehicle, 
                  ...newVehicle,
                  route_geometry: newVehicle.route_geometry || existingVehicle.route_geometry,
                  route_source: newVehicle.route_source || existingVehicle.route_source,
                  ...(localSimulationActive ? {
                    last_lat: existingVehicle.last_lat,
                    last_lng: existingVehicle.last_lng,
                    route_progress: existingVehicle.route_progress,
                    bearing: existingVehicle.bearing,
                    status: existingVehicle.status,
                    // keep the locally-built route (it may include the hub connector)
                    route_geometry: existingVehicle.route_geometry || newVehicle.route_geometry,
                  } : {}),
                };

                if (updatedVehicle.last_lat != null && updatedVehicle.last_lng != null) {
                  const cl = clampCoordinatesToLand(updatedVehicle.last_lat, updatedVehicle.last_lng, updatedVehicle.city);
                  updatedVehicle.last_lat = cl.lat;
                  updatedVehicle.last_lng = cl.lng;
                }
                if (updatedVehicle.destination_lat != null && updatedVehicle.destination_lng != null) {
                  const cl = clampCoordinatesToLand(updatedVehicle.destination_lat, updatedVehicle.destination_lng, updatedVehicle.city);
                  updatedVehicle.destination_lat = cl.lat;
                  updatedVehicle.destination_lng = cl.lng;
                }

                // Trigger alerts for critical status changes
                if (updatedVehicle.status !== existingVehicle.status) {
                  const criticalStatuses: VehicleStatus[] = ['accident', 'delayed', 'off_route'];
                  if (criticalStatuses.includes(updatedVehicle.status)) {
                    NotificationService.notifyAdminPusat(
                      'Peringatan Kendaraan',
                      `Kendaraan ${updatedVehicle.license_plate} berstatus ${updatedVehicle.status.replace('_', ' ')}.`,
                      '/vehicles',
                      'warning'
                    );
                  }

                  // Notification for School Admins: Food is on the way
                  if (updatedVehicle.status === 'en_route' && updatedVehicle.destination_school_name) {
                    // Fetch school_id by name to notify specific admins
                    supabase
                      .from('schools')
                      .select('id')
                      .eq('name', updatedVehicle.destination_school_name)
                      .single()
                      .then(({ data: school }: { data?: any }) => {
                        if (school) {
                          NotificationService.notifySchoolAdmins(
                            school.id,
                            'Makanan Sedang Menuju Lokasi',
                            `Armada ${updatedVehicle.license_plate} telah memulai perjalanan menuju sekolah Anda.`,
                            '/vehicles',
                            'success'
                          );
                        }
                      });
                  }
                }

                newVehicles[idx] = updatedVehicle;
                return { vehicles: newVehicles, hasDemoData: newVehicles.length > 0 };
              }

              if (payload.eventType === 'UPDATE' && idx === -1) {
                const vehicles = [...state.vehicles, newVehicle];
                return { vehicles, hasDemoData: vehicles.length > 0 };
              }

              return state;
            });
          })
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      },
    }
  }))
);
