import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { supabase } from '@/js/core/SupabaseClient';
import NotificationService from '@/js/services/NotificationService';


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

interface VehicleState {
  vehicles: Vehicle[];
  loading: boolean;
  error: string | null;
  selectedCity: string;
  hasDemoData: boolean; // Tracking if demo data is currently seeded
  actions: {
    loadVehicles: () => Promise<Vehicle[]>;
    invalidatePendingLoads: () => void;
    subscribeRealtime: () => (() => void);
    setSelectedCity: (city: string) => void;
    setHasDemoData: (val: boolean) => void;
  };
}

export const useVehicleStore = create<VehicleState>()(
  devtools((set, get) => ({
    vehicles: [],
    loading: false,
    error: null,
    selectedCity: 'Semua',
    hasDemoData: false,
    actions: {
      setSelectedCity: (city: string) => set({ selectedCity: city }),
      setHasDemoData: (val: boolean) => set({ hasDemoData: val }),
      invalidatePendingLoads: () => { vehicleLoadGeneration += 1; },
      loadVehicles: async () => {
        const requestGeneration = ++vehicleLoadGeneration;
        set({ loading: true, error: null });
        try {
          const { data, error } = await supabase.from('vehicles').select('*');
          if (error) throw error;
          const fetchedVehicles: Vehicle[] = data ?? [];
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
                const vehicles = [...state.vehicles, newVehicle];
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
                };

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
