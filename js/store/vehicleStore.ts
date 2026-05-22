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
  route_progress?: number | null;
  bearing?: number | null;
  display_lat?: number;
  display_lng?: number;
  updated_at: string;
}

interface VehicleState {
  vehicles: Vehicle[];
  loading: boolean;
  selectedCity: string;
  hasDemoData: boolean; // Tracking if demo data is currently seeded
  actions: {
    loadVehicles: () => Promise<Vehicle[]>;
    subscribeRealtime: () => (() => void);
    setSelectedCity: (city: string) => void;
    setHasDemoData: (val: boolean) => void;
  };
}

export const useVehicleStore = create<VehicleState>()(
  devtools((set) => ({
    vehicles: [],
    loading: false,
    selectedCity: 'Semua',
    hasDemoData: false,
    actions: {
      setSelectedCity: (city: string) => set({ selectedCity: city }),
      setHasDemoData: (val: boolean) => set({ hasDemoData: val }),
      loadVehicles: async () => {
        set({ loading: true });
        const { data, error } = await supabase.from('vehicles').select('*');
        let fetchedVehicles: Vehicle[] = [];
        
        if (error) {
          console.error('Failed to load vehicles:', error.message, error.details, error.hint);
        }
        else {
          fetchedVehicles = data ?? [];
          set({ 
            vehicles: fetchedVehicles,
            hasDemoData: fetchedVehicles.length > 50 // Assume > 50 means demo data is active
          });
        }
        set({ loading: false });
        return fetchedVehicles;
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
                return { vehicles: state.vehicles.filter((v) => v.id !== payload.old.id) };
              }

              const newVehicle = payload.new as Vehicle;
              const idx = state.vehicles.findIndex((v) => v.id === newVehicle.id);
              
              if (payload.eventType === 'INSERT' && idx === -1) {
                return { vehicles: [...state.vehicles, newVehicle] };
              }
              
              if (payload.eventType === 'UPDATE' && idx !== -1) {
                const newVehicles = [...state.vehicles];
                const existingVehicle = newVehicles[idx];
                const updatedVehicle = { 
                  ...existingVehicle, 
                  ...newVehicle,
                  route_geometry: newVehicle.route_geometry || existingVehicle.route_geometry 
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
                return { vehicles: newVehicles };
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
