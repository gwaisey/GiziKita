import { supabase } from '@/js/core/SupabaseClient';
import { useVehicleStore, Vehicle, VehicleStatus, VerifiedDrivingRoute } from '@/js/store/vehicleStore';

// Status metadata: labels, colours, descriptions
export const VEHICLE_STATUS_META: Record<VehicleStatus, { label: string; color: string; description: string }> = {
  idle:        { label: 'Siaga',        color: '#6c757d', description: 'Kendaraan sedang menunggu di depot' },
  en_route:    { label: 'Dalam Perjalanan', color: '#8B1C3F', description: 'Sedang menuju lokasi sekolah' },
  loading:     { label: 'Memuat',       color: '#F4C662', description: 'Sedang memuat makanan ke kendaraan' },
  unloading:   { label: 'Menurunkan',   color: '#2e7d32', description: 'Sedang menurunkan makanan di sekolah' },
  delayed:     { label: 'Tertunda',     color: '#fd7e14', description: 'Perjalanan mengalami keterlambatan' },
  accident:    { label: 'Kecelakaan',   color: '#dc3545', description: 'Terjadi insiden di perjalanan' },
  maintenance: { label: 'Perawatan',    color: '#ffc107', description: 'Kendaraan sedang dalam perawatan' },
  off_route:   { label: 'Keluar Rute',  color: '#e83e8c', description: 'Kendaraan menyimpang dari rute yang dijadwalkan' },
  offline:     { label: 'Offline',      color: '#adb5bd', description: 'Tidak ada sinyal dari kendaraan' },
};

// Sample vehicles seeded around Jakarta area for simulation
// List of sample names and schools for dynamic generation
const FIRST_NAMES = [
  'Andi', 'Budi', 'Cahyo', 'Darto', 'Eka', 'Fajar', 'Gita', 'Hendra', 'Joko', 'Ratna', 'Supri', 'Sari', 'Tono', 'Yanto', 'Zein',
  'Bambang', 'Agus', 'Slamet', 'Mulyono', 'Wahyu', 'Sugeng', 'Sri', 'Siti', 'Aminah', 'Yusuf', 'Ridwan', 'Arif', 'Edi', 'Hari',
  'Gunawan', 'Iwan', 'Rudy', 'Sony', 'Toto', 'Ujang', 'Cecep', 'Dadang', 'Entis', 'Neneng', 'Kokom', 'Lilis', 'Wayan', 'Made',
  'Nyoman', 'Ketut', 'Gede', 'Putu', 'Bagus', 'Ayu', 'Kadek', 'Luhut', 'Hotman', 'Basuki', 'Ganjar', 'Anies', 'Prabowo', 'Gibran',
  'Mahfud', 'Erick', 'Sandi', 'Bahlil', 'Tito', 'Retno', 'Sri', 'Moeldoko', 'Haedar', 'Yahya', 'Benny', 'Doni'
];

const LAST_NAMES = [
  'Susanto', 'Wijaya', 'Saputra', 'Setiawan', 'Pratama', 'Hidayat', 'Kusuma', 'Santoso', 'Purwanto', 'Gunawan',
  'Nasution', 'Simanjuntak', 'Siregar', 'Hasibuan', 'Lubis', 'Pane', 'Harahap', 'Pasaribu', 'Situmorang', 'Nababan',
  'Ginting', 'Sembiring', 'Tarigan', 'Karo-Karo', 'Perangin-angin', 'Manurung', 'Siahaan', 'Pangaribuan', 'Hutapea',
  'Sitorus', 'Tampubolon', 'Sinaga', 'Sidabutar', 'Pandiangan', 'Nainggolan', 'Simalango', 'Simatupang', 'Siburian'
];

function generateDriverName(): string {
  const isPak = Math.random() > 0.3;
  const honorific = isPak ? 'Pak' : 'Ibu';
  const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  return `${honorific} ${first} ${last}`;
}

export const CITIES_CONFIG = [
  // Sumatra
  { name: 'Aceh', capital: 'Banda Aceh', prefix: 'BL', lat: 5.5483, lng: 95.3238, sdn_count: 3336 },
  { name: 'Sumatera Utara', capital: 'Medan', prefix: 'BK', lat: 3.5952, lng: 98.6722, sdn_count: 8116 },
  { name: 'Sumatera Barat', capital: 'Padang', prefix: 'BA', lat: -0.9471, lng: 100.4172, sdn_count: 3892 },
  { name: 'Riau', capital: 'Pekanbaru', prefix: 'BM', lat: 0.5071, lng: 101.4478, sdn_count: 3232 },
  { name: 'Kepulauan Riau', capital: 'Tanjung Pinang', prefix: 'BP', lat: 0.9167, lng: 104.4500, sdn_count: 683 },
  { name: 'Jambi', capital: 'Jambi', prefix: 'BH', lat: -1.6101, lng: 103.6131, sdn_count: 2302 },
  { name: 'Sumatera Selatan', capital: 'Palembang', prefix: 'BG', lat: -2.9761, lng: 104.7754, sdn_count: 4250 },
  { name: 'Bengkulu', capital: 'Bengkulu', prefix: 'BD', lat: -3.7937, lng: 102.2605, sdn_count: 1289 },
  { name: 'Bangka Belitung', capital: 'Pangkal Pinang', prefix: 'BN', lat: -2.1333, lng: 106.1167, sdn_count: 761 },
  { name: 'Lampung', capital: 'Bandar Lampung', prefix: 'BE', lat: -5.4267, lng: 105.2601, sdn_count: 4295 },
  // Java
  { name: 'Banten', capital: 'Serang', prefix: 'A', lat: -6.1119, lng: 106.1472, sdn_count: 3954 },
  { name: 'DKI Jakarta', capital: 'Jakarta', prefix: 'B', lat: -6.2088, lng: 106.8456, sdn_count: 1305 },
  { name: 'Jawa Barat', capital: 'Bandung', prefix: 'D', lat: -6.9175, lng: 107.6191, sdn_count: 16980 },
  { name: 'Jawa Tengah', capital: 'Semarang', prefix: 'H', lat: -6.9667, lng: 110.4167, sdn_count: 17254 },
  { name: 'DI Yogyakarta', capital: 'Yogyakarta', prefix: 'AB', lat: -7.7956, lng: 110.3695, sdn_count: 1435 },
  { name: 'Jawa Timur', capital: 'Surabaya', prefix: 'L', lat: -7.2575, lng: 112.7521, sdn_count: 16924 },
  // Bali & Nusa Tenggara
  { name: 'Bali', capital: 'Denpasar', prefix: 'DK', lat: -8.6500, lng: 115.2167, sdn_count: 2306 },
  { name: 'Nusa Tenggara Barat', capital: 'Mataram', prefix: 'EA', lat: -8.5833, lng: 116.1167, sdn_count: 3011 },
  { name: 'Nusa Tenggara Timur', capital: 'Kupang', prefix: 'EB', lat: -10.1772, lng: 123.5962, sdn_count: 3348 },
  // Kalimantan
  { name: 'Kalimantan Barat', capital: 'Pontianak', prefix: 'KB', lat: -0.0278, lng: 109.3425, sdn_count: 4877 },
  { name: 'Kalimantan Tengah', capital: 'Palangka Raya', prefix: 'KH', lat: -2.2167, lng: 113.9167, sdn_count: 2400 },
  { name: 'Kalimantan Selatan', capital: 'Banjarbaru', prefix: 'DA', lat: -3.4477, lng: 114.8322, sdn_count: 2800 },
  { name: 'Kalimantan Timur', capital: 'Samarinda', prefix: 'KT', lat: -0.5022, lng: 117.1536, sdn_count: 1600 },
  { name: 'Kalimantan Utara', capital: 'Tanjung Selor', prefix: 'KU', lat: 2.8465, lng: 117.3621, sdn_count: 400 },
  // Sulawesi
  { name: 'Sulawesi Utara', capital: 'Manado', prefix: 'DB', lat: 1.4748, lng: 124.8421, sdn_count: 2100 },
  { name: 'Gorontalo', capital: 'Gorontalo', prefix: 'DM', lat: 0.5333, lng: 123.0667, sdn_count: 900 },
  { name: 'Sulawesi Tengah', capital: 'Palu', prefix: 'DN', lat: -0.8917, lng: 119.8708, sdn_count: 2600 },
  { name: 'Sulawesi Barat', capital: 'Mamuju', prefix: 'DC', lat: -2.6833, lng: 118.8833, sdn_count: 1400 },
  { name: 'Sulawesi Selatan', capital: 'Makassar', prefix: 'DD', lat: -5.1477, lng: 119.4327, sdn_count: 6000 },
  { name: 'Sulawesi Tenggara', capital: 'Kendari', prefix: 'DT', lat: -3.9936, lng: 122.5140, sdn_count: 2200 },
  // Maluku & Papua
  { name: 'Maluku', capital: 'Ambon', prefix: 'DE', lat: -3.6547, lng: 128.1906, sdn_count: 1500 },
  { name: 'Maluku Utara', capital: 'Sofifi', prefix: 'DG', lat: 0.7167, lng: 127.5667, sdn_count: 1100 },
  { name: 'Papua Barat', capital: 'Manokwari', prefix: 'PB', lat: -0.8656, lng: 134.0754, sdn_count: 600 },
  { name: 'Papua', capital: 'Jayapura', prefix: 'PA', lat: -2.5333, lng: 140.7167, sdn_count: 1000 },
];


function createFallbackRoute(vehicle: {
  last_lng: number;
  last_lat: number;
  destination_lng: number;
  destination_lat: number;
}): number[][] {
  const p1 = [vehicle.last_lng, vehicle.last_lat];
  const p4 = [vehicle.destination_lng, vehicle.destination_lat];
  
  // Add some perpendicular offset to create a curve/zigzag route (so it's not a straight line)
  const diffLng = p4[0] - p1[0];
  const diffLat = p4[1] - p1[1];
  
  // Perpendicular offset vector (slightly rotated)
  const offsetLng = -diffLat * 0.15;
  const offsetLat = diffLng * 0.15;
  
  const p2 = [p1[0] + diffLng * 0.33 + offsetLng, p1[1] + diffLat * 0.33 + offsetLat];
  const p3 = [p1[0] + diffLng * 0.66 - offsetLng, p1[1] + diffLat * 0.66 - offsetLat];
  
  return [p1, p2, p3, p4];
}

function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const dLat = radians(bLat - aLat);
  const dLng = radians(bLng - aLng);
  const haversine = Math.sin(dLat / 2) ** 2
    + Math.cos(radians(aLat)) * Math.cos(radians(bLat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

class VehicleService {
  public fetchingRoutes = new Set<string>();

  /** Fetch real driving route from Mapbox Directions API */
  async fetchMapboxRoute(start: [number, number], end: [number, number], vehicleId?: string): Promise<VerifiedDrivingRoute | null> {
    if (vehicleId) {
      if (this.fetchingRoutes.has(vehicleId)) return null;
      this.fetchingRoutes.add(vehicleId);
    }

    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (!mapboxToken) {
      if (vehicleId) this.fetchingRoutes.delete(vehicleId);
      return null;
    }
    
    try {
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson&overview=full&exclude=ferry&access_token=${mapboxToken}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Mapbox API responded with status ${res.status}`);
      const json = await res.json();
      const coords = json.routes?.[0]?.geometry?.coordinates;
      const snappedStart = json.waypoints?.[0]?.location;
      const snappedDestination = json.waypoints?.[1]?.location;
      if (!Array.isArray(coords) || coords.length < 2 || coords.some((point: unknown) =>
        !Array.isArray(point) || point.length < 2 || !Number.isFinite(point[0]) || !Number.isFinite(point[1])
      ) || !Array.isArray(snappedStart) || !Array.isArray(snappedDestination)) return null;
      return {
        coordinates: coords as number[][],
        snappedStart: snappedStart as [number, number],
        snappedDestination: snappedDestination as [number, number],
      };
    } catch (err) {
      console.error('[MAPBOX ROUTE FETCH ERROR]', err);
      return null;
    } finally {
      if (vehicleId) this.fetchingRoutes.delete(vehicleId);
    }
  }

  private queueUpdate(vehicleId: string, data: any) {
    const existing = this.pendingUpdates.get(vehicleId) || {};
    this.pendingUpdates.set(vehicleId, {
      ...existing,
      ...data
    });
  }

  /** Update route geometry for a vehicle in store and Supabase database */
  async updateVehicleRoute(vehicleId: string, route: VerifiedDrivingRoute) {
    // The directions geometry is our single source of truth.  Mapbox waypoint
    // snapping is useful metadata, but using a different coordinate for the
    // marker than the line endpoint creates a visible "last mile" over water.
    const [snappedStartLng, snappedStartLat] = route.coordinates[0] as [number, number];
    const [snappedDestinationLng, snappedDestinationLat] = route.coordinates[route.coordinates.length - 1] as [number, number];
    // 1. Update Zustand store
    useVehicleStore.setState(state => {
      const newVehicles = state.vehicles.map(v => {
        if (v.id === vehicleId) {
          return {
            ...v,
            last_lng: snappedStartLng,
            last_lat: snappedStartLat,
            destination_lng: snappedDestinationLng,
            destination_lat: snappedDestinationLat,
            route_geometry: route.coordinates,
            route_source: 'mapbox_driving' as const,
            route_progress: 0,
          };
        }
        return v;
      });
      return { vehicles: newVehicles };
    });
    
    // 2. Sync to Supabase via batch buffer to prevent connection exhaustion
    const vehicle = useVehicleStore.getState().vehicles.find(v => v.id === vehicleId);
    this.queueUpdate(vehicleId, {
      id: vehicleId,
      license_plate: vehicle?.license_plate,
      last_lng: snappedStartLng,
      last_lat: snappedStartLat,
      destination_lng: snappedDestinationLng,
      destination_lat: snappedDestinationLat,
      route_geometry: route.coordinates,
      route_source: 'mapbox_driving',
      route_progress: 0,
      updated_at: new Date().toISOString()
    });

    if (vehicle?.destination_school_name) {
      const { error } = await supabase
        .from('schools')
        .update({ lng: snappedDestinationLng, lat: snappedDestinationLat })
        .eq('name', vehicle.destination_school_name);
      if (error) console.warn('Could not save road-snapped school location:', error.message);
    }
    
    // Ensure background sync is running to flush this update
    this.startBackgroundSync();
  }

  /** Fetch all vehicles from Supabase */
  async getAll(): Promise<Vehicle[]> {
    const { data, error } = await supabase.from('vehicles').select('*');
    if (error) throw error;
    return data ?? [];
  }

  /** Seed sample data into the vehicles table (for demo purposes) */
  async seedSampleData(_mapboxMap?: any): Promise<{ success: boolean; message: string }> {
    try {
      // Get existing vehicles to prevent duplicates
      const existingVehicles = useVehicleStore.getState().vehicles;
      const usedPlates = new Set(existingVehicles.map(v => v.license_plate));

      // Create a realistic fleet proportional to the number of schools in each province
      const tempVehicles: any[] = [];
      const schoolsToSeed = new Map<string, any>();
      const sppgToSeed = new Map<string, any>();
      const assetRegistry: any[] = [];
      
      // --- ULTIMATE 514-REGION NATIONWIDE COVERAGE ---
      const { INDONESIA_514_REGIONS } = await import('@/js/data/indonesia_regions');
      
      for (const region of INDONESIA_514_REGIONS) {
        // Requirement: AT LEAST MORE THAN ONE (>1) i.e. MIN 2
        const stationCount = region.isKota ? 3 : 2; 
        const cityStations: any[] = [];
        
        for (let i = 0; i < stationCount; i++) {
          // --- NUCLEAR PRECISION ANCHOR (Hub stays at center) ---
          let hubLat = region.lat;
          let hubLng = region.lng;

          const station = {
            name: `SPPG ${region.name} - Hub ${i + 1}`,
            city: region.name,
            province: region.province,
            lat: hubLat,
            lng: hubLng,
            capacity: 20
          };
          cityStations.push(station);
          sppgToSeed.set(`${station.name}-${region.province}-${i}`, station);

          // Demo school coordinates are not published until Mapbox successfully
          // snaps a driving route endpoint to a road. A region centroid or a
          // random offset is not proof that a point lies on land.
          const destinationRadius = 0.010 + Math.random() * 0.017;
          const destinationAngle = Math.random() * Math.PI * 2;
          const destination = {
            lng: station.lng + Math.cos(destinationAngle) * destinationRadius,
            lat: station.lat + Math.sin(destinationAngle) * destinationRadius,
          };

          const school = {
            name: `Sekolah Bina Gizi ${region.name} #${i + 1}`,
            lat: null,
            lng: null,
            city: region.name,
            province: region.province,
            pupils: 300,
            status: 'Aktif'
          };
          schoolsToSeed.set(`${school.name}-${school.province}`, school);

          const plate = `${region.prefix} ${Math.floor(1000 + Math.random() * 8999)} BGN`;
          usedPlates.add(plate);

          const models = ['Mitsubishi Fuso Canter', 'Isuzu Elf NMR 71', 'Hino Dutro 130 HD', 'Toyota Dyna 130 HT'];
          const vehicleModel = models[Math.floor(Math.random() * models.length)];

          assetRegistry.push({
            license_plate: plate,
            vin: `BGN-${region.prefix}-${Math.floor(1000000 + Math.random() * 8999999)}`,
            model: vehicleModel,
            type: 'Truck Box Gizi',
            city: region.name, // Use region name for more specificity
            status: 'In Use'
          });

          tempVehicles.push({
            license_plate: plate,
            driver_name: generateDriverName(),
            // Do not claim a trip has started until a road-verified route exists.
            status: 'idle' as VehicleStatus,
            city: region.name, // Fixed: Use Regency name for accurate sidebar labeling
            last_lat: station.lat,
            last_lng: station.lng,
            destination_school_name: school.name,
            destination_lat: destination.lat,
            destination_lng: destination.lng
          });
      }
    }

      console.log(`[SEED] Generating routes for ${tempVehicles.length} vehicles across Indonesia...`);
      
      // Distribute vehicles realistically along their routes
      const enrichedVehicles = tempVehicles.map((v) => {
        const geometry = createFallbackRoute(v);
        
        // --- STATIONARY START: Initialize at exactly 0% (the Hub) ---
        // This ensures vehicles stay at the station until simulation starts
        const progress = 0;
        
        return {
          ...v,
          route_geometry: geometry,
          route_source: 'demo_unverified',
          route_progress: progress,
          last_lat: v.last_lat, // Already set to station.lat in loop above
          last_lng: v.last_lng  // Already set to station.lng in loop above
        };
      });

      // Optimistic fleet: render the demo immediately while Supabase writes
      // the authoritative rows. Replace these temporary IDs after confirmation.
      const optimisticVehicles = enrichedVehicles.map((vehicle, index) => ({
        ...vehicle,
        id: `demo-pending-${Date.now()}-${index}`,
        updated_at: new Date().toISOString(),
      })) as Vehicle[];
      const optimisticIds = new Set(optimisticVehicles.map((vehicle) => vehicle.id));
      useVehicleStore.setState((state) => ({
        vehicles: [...state.vehicles, ...optimisticVehicles],
        error: null,
      }));
      
      let data: any[] | null;
      try {
        const insertResult = await supabase.from('vehicles').insert(enrichedVehicles).select();
        if (insertResult.error) throw insertResult.error;
        data = insertResult.data;
      } catch (insertError) {
        useVehicleStore.setState((state) => ({
          vehicles: state.vehicles.filter((vehicle) => !optimisticIds.has(vehicle.id)),
        }));
        throw insertError;
      }
      
      // Inject manually to guarantee instant UI update (bypassing WebSocket lag)
      if (data) {
        useVehicleStore.setState(state => {
          const insertedPlates = new Set(data.map((vehicle: any) => vehicle.license_plate));
          const newVehicles = state.vehicles.filter((vehicle) =>
            !optimisticIds.has(vehicle.id) && !insertedPlates.has(vehicle.license_plate)
          );
          return { vehicles: [...newVehicles, ...(data as Vehicle[])] };
        });
      }

      // Fleet visibility is the primary action. Persist supporting map layers
      // afterwards so schools/hubs/inventory cannot delay the first vehicles.
      void Promise.allSettled([
        supabase.from('schools').upsert(Array.from(schoolsToSeed.values()), { onConflict: 'name,province' }),
        supabase.from('sppg_units').upsert(Array.from(sppgToSeed.values()), { onConflict: 'name,province' }),
        supabase.from('vehicle_inventory').upsert(assetRegistry, { onConflict: 'license_plate' }),
      ]).then((results) => {
        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            console.warn(`[SEED] Supporting write ${index + 1} failed:`, result.reason);
          } else if (result.value.error) {
            console.warn(`[SEED] Supporting write ${index + 1} failed:`, result.value.error.message);
          }
        });
      });

      return { success: true, message: `${enrichedVehicles.length} kendaraan berhasil disinkronkan.` };
    } catch (err: any) {
      const message = err?.message || 'Unknown error';
      console.error('Seed error:', err);
      return { success: false, message: `Gagal: ${message}` };
    }
  }

  /** Clear all vehicle data */
  async clearDemoData(): Promise<{ success: boolean; message: string }> {
    try {
      // 1. Clear local memory buffer immediately to prevent re-syncing to DB
      this.pendingUpdates.clear();

      // 2. Perform a direct, robust deletion on the server
      // We use a dummy filter that matches everything to bypass the "no-filter" deletion safety
      const { error: vehicleError } = await supabase
        .from('vehicles')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      const { error: sppgError } = await supabase
        .from('sppg_units')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (vehicleError) throw vehicleError;
      if (sppgError) throw sppgError;

      // The UI should reflect the confirmed empty database immediately.
      this.stopSimulation();
      useVehicleStore.getState().actions.invalidatePendingLoads();
      useVehicleStore.setState({ vehicles: [], hasDemoData: false, error: null });
      return { success: true, message: 'Semua data kendaraan berhasil dihapus secara permanen.' };
    } catch (err: any) {
      const message = err?.message || 'Unknown error';
      console.error('Clear error:', err);
      return { success: false, message: `Gagal: ${message}` };
    }
  }

  private isSimulating = false;
  private pendingUpdates = new Map<string, any>();
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private simulationInterval: ReturnType<typeof setInterval> | null = null;

  public startSimulation() {
    if (this.simulationInterval) return;
    if (!useVehicleStore.getState().vehicles.some(vehicle => vehicle.route_source === 'mapbox_driving')) return;
    console.log('[SIMULATION] Starting real-time tracking engine...');
    this.simulationInterval = setInterval(() => this.simulateStep(), 1000);
    this.startBackgroundSync();
  }

  public stopSimulation() {
    if (this.simulationInterval) {
      console.log('[SIMULATION] Stopping engine...');
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
    this.stopBackgroundSync();

    // Reset all in-motion vehicles back to idle (Siaga) in local state.
    // The DB will be reconciled on the next page load via loadVehicles().
    const ACTIVE_STATUSES: VehicleStatus[] = ['en_route', 'delayed', 'unloading', 'loading'];
    useVehicleStore.setState(state => ({
      vehicles: state.vehicles.map(v =>
        ACTIVE_STATUSES.includes(v.status) ? { ...v, status: 'idle' as VehicleStatus } : v
      )
    }));
  }

  private stopBackgroundSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  public getPositionAtProgress(geometry: number[][], progress: number): { lat: number, lng: number } {
    if (!geometry || geometry.length === 0) return { lat: -6.2, lng: 106.8 };
    
    const floorIdx = Math.floor(progress);
    const ceilIdx = Math.min(floorIdx + 1, geometry.length - 1);
    
    if (floorIdx === ceilIdx) return { lng: geometry[floorIdx][0], lat: geometry[floorIdx][1] };
    
    const fraction = progress - floorIdx;
    const start = geometry[floorIdx];
    const end = geometry[ceilIdx];
    
    return {
      lng: start[0] + (end[0] - start[0]) * fraction,
      lat: start[1] + (end[1] - start[1]) * fraction
    };
  }

  constructor() {
    // Initialized, but sync only starts when simulation is active
  }

  private startBackgroundSync() {
    if (this.syncInterval) clearInterval(this.syncInterval);
    
    this.syncInterval = setInterval(async () => {
      if (this.pendingUpdates.size === 0) return;

      console.log(`[BATCH SYNC] Pushing ${this.pendingUpdates.size} updates to Supabase...`);
      const updates = Array.from(this.pendingUpdates.values());
      
      // Clear current buffer before sending to avoid race conditions with next ticks
      // Filter out records missing license_plate to prevent not-null constraint errors
      const updatesToSend = [...updates].filter(u => u.license_plate);
      this.pendingUpdates.clear();

      try {
        const { error } = await supabase
          .from('vehicles')
          .upsert(updatesToSend, { onConflict: 'id' });

        if (error) {
          console.error('[BATCH SYNC ERROR]', error.message);
          // Optional: Re-add failed updates back to buffer
        } else {
          console.log(`[BATCH SYNC] Successfully synced ${updatesToSend.length} records.`);
        }
      } catch (err) {
        console.error('[BATCH SYNC CRITICAL]', err);
      }
    }, 10000); // 10-second sync cycle
  }

  /**
   * Simulate movement for all vehicles strictly following their route_geometry.
   */
  async simulateStep(): Promise<void> {
    const vehicles = useVehicleStore.getState().vehicles;
    if (vehicles.length === 0) return;

    if (this.isSimulating) return; 
    this.isSimulating = true;

    try {
      const stateUpdates: any[] = [];

      for (const v of vehicles) {
        // Never simulate along generated/legacy polylines that may cross water.
        if (v.route_source !== 'mapbox_driving' || !v.route_geometry || v.route_geometry.length < 2) continue;
        if (v.status === 'offline' || v.status === 'maintenance') continue;

        let newStatus = v.status;
        let newProgress = v.route_progress ?? 0;
        let newBearing = v.bearing ?? 0;

        if (newStatus === 'unloading') {
          const distanceToSchool = v.destination_lat == null || v.destination_lng == null
            ? Number.POSITIVE_INFINITY
            : distanceKm(v.last_lat ?? 0, v.last_lng ?? 0, v.destination_lat, v.destination_lng);
          if (distanceToSchool > 0.02) newStatus = 'en_route';
        }

        // Auto-start journey if idle/loading
        if (v.status === 'idle' || v.status === 'delayed' || v.status === 'loading') {
          newStatus = 'en_route'; 
          newProgress = 0;
        }

        if (newStatus === 'en_route' && v.route_geometry && v.route_geometry.length > 0) {
          let distanceToMove = 0.0003; // Movement speed
          
          while (distanceToMove > 0) {
            const floorIdx = Math.floor(newProgress);
            const ceilIdx = floorIdx + 1;
            const currentPosition = this.getPositionAtProgress(v.route_geometry, newProgress);
            
            if (ceilIdx >= v.route_geometry.length) {
              const destinationLat = v.destination_lat;
              const destinationLng = v.destination_lng;
              const distanceToDestination = destinationLat == null || destinationLng == null
                ? Number.POSITIVE_INFINITY
                : distanceKm(currentPosition.lat, currentPosition.lng, destinationLat, destinationLng);
              // Arrival must be based on physical proximity, not merely the
              // final index in a stale/incorrect route polyline.
              newStatus = distanceToDestination <= 0.02 ? 'unloading' : 'en_route';
              break;
            }
            
            const start = v.route_geometry[floorIdx];
            const end = v.route_geometry[ceilIdx];
            
            const currentSubLat = start[1] + (end[1] - start[1]) * (newProgress - floorIdx);
            const currentSubLng = start[0] + (end[0] - start[0]) * (newProgress - floorIdx);
            
            const dLat = end[1] - currentSubLat;
            const dLng = end[0] - currentSubLng;
            const segmentDist = Math.sqrt(dLat * dLat + dLng * dLng);
            
            if (segmentDist <= 0.0000001) {
              newProgress = ceilIdx;
              continue;
            }

            if (distanceToMove >= segmentDist) {
              distanceToMove -= segmentDist;
              newProgress = ceilIdx;
            } else {
              const ratio = distanceToMove / segmentDist;
              newProgress += (1 - (newProgress - floorIdx)) * ratio;
              distanceToMove = 0;
            }
          }

          // Calculate Bearing
          const floorIdx = Math.min(Math.floor(newProgress), v.route_geometry.length - 2);
          const p1 = v.route_geometry[floorIdx];
          const p2 = v.route_geometry[floorIdx + 1];
          if (p1 && p2) {
            const bY = Math.sin((p2[0] - p1[0]) * Math.PI / 180) * Math.cos(p2[1] * Math.PI / 180);
            const bX = Math.cos(p1[1] * Math.PI / 180) * Math.sin(p2[1] * Math.PI / 180) -
                       Math.sin(p1[1] * Math.PI / 180) * Math.cos(p2[1] * Math.PI / 180) * Math.cos((p2[0] - p1[0]) * Math.PI / 180);
            newBearing = (Math.atan2(bY, bX) * 180 / Math.PI + 360) % 360;
          }
        }

        const finalPos = this.getPositionAtProgress(v.route_geometry || [], newProgress);

        if (newStatus !== v.status || Math.abs(newProgress - (v.route_progress ?? 0)) > 0.000001 || Math.abs(newBearing - (v.bearing ?? 0)) > 0.1) {
          const updatedData = {
            id: v.id,
            license_plate: v.license_plate, // Required for Supabase upsert constraints
            last_lat: finalPos.lat,
            last_lng: finalPos.lng,
            status: newStatus,
            route_progress: newProgress,
            bearing: newBearing,
            updated_at: new Date().toISOString(),
          };
          
          stateUpdates.push(updatedData);
          
          // ADD TO SYNC BUFFER (Only essential fields to minimize payload)
          this.queueUpdate(v.id, updatedData);
        }
      }

      // 1. OPTIMISTIC UI UPDATE: Immediate 1Hz refresh for local client
      if (stateUpdates.length > 0) {
        useVehicleStore.setState(state => {
          const newVehicles = [...state.vehicles];
          stateUpdates.forEach(update => {
            const idx = newVehicles.findIndex(veh => veh.id === update.id);
            if (idx !== -1) {
              newVehicles[idx] = { ...newVehicles[idx], ...update };
            }
          });
          return { vehicles: newVehicles };
        });
      }
    } catch (err) {
      console.error('[SIMULATION CRITICAL ERROR]', err);
    } finally {
      this.isSimulating = false;
    }
  }
}

export default new VehicleService();
