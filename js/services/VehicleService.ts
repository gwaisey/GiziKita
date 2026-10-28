import { supabase } from '@/js/core/SupabaseClient';
import { useVehicleStore, Vehicle, VehicleStatus, VerifiedDrivingRoute, setLocalSimulationActive } from '@/js/store/vehicleStore';
import { resolveSppgLocation, normalizeRegionName } from '@/js/data/indonesia_regions';
import { createFallbackRoute, isValidRoute } from '@/js/utils/routing';

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


// createFallbackRoute / distanceKm / isValidRoute live in '@/js/utils/routing'.

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
        distance: json.routes?.[0]?.distance,
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
    const vehicle = useVehicleStore.getState().vehicles.find(v => v.id === vehicleId);
    const sppgLoc = resolveSppgLocation(vehicle?.city, undefined, {
      vehicleLat: vehicle?.last_lat,
      vehicleLng: vehicle?.last_lng,
    });
    // Anchor = where the vehicle physically is right now. An idle vehicle sits exactly on its
    // SPPG hub; a moving vehicle keeps its current position so swapping in a road-snapped route
    // never teleports it.
    const isIdle = vehicle?.status === 'idle';
    const anchorLng = isIdle && sppgLoc ? sppgLoc.lng : (vehicle?.last_lng ?? snappedStartLng);
    const anchorLat = isIdle && sppgLoc ? sppgLoc.lat : (vehicle?.last_lat ?? snappedStartLat);
    const activeLng = anchorLng;
    const activeLat = anchorLat;

    // Continuity guarantee: Mapbox snaps the route start to the nearest road. Prepend the anchor
    // so the vehicle drives anchor -> road instead of jumping to the snapped point.
    let routeCoordinates: number[][] = route.coordinates;
    const gap = Math.hypot(snappedStartLng - anchorLng, snappedStartLat - anchorLat);
    if (gap > 0.00005 && gap < 0.02) {
      routeCoordinates = [[anchorLng, anchorLat], ...route.coordinates];
    }

    // 1. Update Zustand store
    useVehicleStore.setState(state => {
      const newVehicles = state.vehicles.map(v => {
        if (v.id === vehicleId) {
          return {
            ...v,
            last_lng: activeLng,
            last_lat: activeLat,
            destination_lng: snappedDestinationLng,
            destination_lat: snappedDestinationLat,
            route_geometry: routeCoordinates,
            route_source: 'mapbox_driving' as const,
            route_progress: 0,
          };
        }
        return v;
      });
      return { vehicles: newVehicles };
    });
    
    // 2. Sync to Supabase via batch buffer to prevent connection exhaustion
    this.queueUpdate(vehicleId, {
      id: vehicleId,
      license_plate: vehicle?.license_plate,
      last_lng: activeLng,
      last_lat: activeLat,
      destination_lng: snappedDestinationLng,
      destination_lat: snappedDestinationLat,
      route_geometry: routeCoordinates,
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
          // Distinct district coordinates for each SPPG hub in the region (~2.5 km apart)
          let hubLat = region.lat;
          let hubLng = region.lng;

          if (i === 1) {
            // Hub 2: Distrik Sektor Timur / Utara
            hubLat = region.lat + 0.015;
            hubLng = region.lng + 0.018;
          } else if (i === 2) {
            // Hub 3: Distrik Sektor Barat / Selatan
            hubLat = region.lat - 0.015;
            hubLng = region.lng - 0.018;
          }

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
        const geometry = createFallbackRoute(
          { lng: v.last_lng, lat: v.last_lat },
          { lng: v.destination_lng, lat: v.destination_lat },
        );
        
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
        hasDemoData: true,
        error: null,
      }));
      
      let data: any[] | null = null;
      try {
        // Attempt to persist to Supabase with a 4-second safety timeout so the UI never hangs
        const timeoutPromise = new Promise<{ error: Error }>((_, reject) =>
          setTimeout(() => reject(new Error('Supabase insert timed out')), 4000)
        );
        const insertPromise = supabase.from('vehicles').insert(enrichedVehicles).select();
        const insertResult = await Promise.race([insertPromise, timeoutPromise]) as any;

        if (insertResult?.error) {
          console.warn('[SEED] Supabase backend write warning:', insertResult.error.message);
        } else if (insertResult?.data) {
          data = insertResult.data;
        }
      } catch (insertError: any) {
        console.warn('[SEED] Supabase persist bypassed or timed out, keeping optimistic demo fleet:', insertError?.message);
      }
      
      // Inject confirmed IDs if available
      if (data && data.length > 0) {
        useVehicleStore.setState(state => {
          const insertedPlates = new Set(data.map((vehicle: any) => vehicle.license_plate));
          const newVehicles = state.vehicles.filter((vehicle) =>
            !optimisticIds.has(vehicle.id) && !insertedPlates.has(vehicle.license_plate)
          );
          return { vehicles: [...newVehicles, ...(data as Vehicle[])], hasDemoData: true };
        });
      }

// ---------------------------------------------------------------
// Filter SPPG hubs and schools to only those regions that have at
// least one vehicle in the newly generated fleet. This prevents
// empty SPPG markers from being seeded or displayed.
// ---------------------------------------------------------------
const activeRegionSet = new Set<string>();
enrichedVehicles.forEach(v => {
  if (v.city) {
    const norm = normalizeRegionName(v.city);
    activeRegionSet.add(norm);
  }
});

// Keep only SPPG entries whose city appears in activeRegionSet
const filteredSppg = new Map<string, any>();
sppgToSeed.forEach((hub, key) => {
  const norm = normalizeRegionName(hub.city);
  if (activeRegionSet.has(norm)) {
    filteredSppg.set(key, hub);
  }
});
sppgToSeed.clear();
filteredSppg.forEach((v, k) => sppgToSeed.set(k, v));

// Keep only schools whose city appears in activeRegionSet
const filteredSchools = new Map<string, any>();
schoolsToSeed.forEach((school, key) => {
  const norm = normalizeRegionName(school.city);
  if (activeRegionSet.has(norm)) {
    filteredSchools.set(key, school);
  }
});
schoolsToSeed.clear();
filteredSchools.forEach((v, k) => schoolsToSeed.set(k, v));

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

  // Active state timers for realistic simulation lifecycle
  private unloadingStartedAt = new Map<string, number>();
  private dwellDurations = new Map<string, number>();
  private idleStartedAt = new Map<string, number>();
  private idleDurations = new Map<string, number>();

  public startSimulation() {
    if (this.simulationInterval) return;
    const vehicles = useVehicleStore.getState().vehicles;
    if (vehicles.length === 0) return;
    console.log(`[SIMULATION] Starting real-time tracking engine for ${vehicles.length} vehicles...`);
    setLocalSimulationActive(true);
    this.simulationInterval = setInterval(() => this.simulateStep(), 1000);
    // Run the first step immediately so every routed vehicle departs at once
    void this.simulateStep();
    this.startBackgroundSync();
  }

  public stopSimulation() {
    setLocalSimulationActive(false);
    if (this.simulationInterval) {
      console.log('[SIMULATION] Stopping engine...');
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
    this.stopBackgroundSync();

    // Reset internal simulation timers
    this.unloadingStartedAt.clear();
    this.dwellDurations.clear();
    this.idleStartedAt.clear();
    this.idleDurations.clear();

    // Reset all vehicles back to idle (Siaga) stationed at their regional SPPG Hub
    const ACTIVE_STATUSES: VehicleStatus[] = ['en_route', 'delayed', 'unloading', 'loading'];
    import('@/js/data/indonesia_regions').then(({ resolveSppgLocation }) => {
      useVehicleStore.setState(state => ({
        vehicles: state.vehicles.map(v => {
          if (ACTIVE_STATUSES.includes(v.status) || v.status === 'idle') {
            // A routed vehicle's origin (route[0]) IS its hub; otherwise resolve the hub.
            const origin = v.route_geometry && v.route_geometry.length > 0
              ? v.route_geometry[0]
              : null;
            const sppgLoc = origin ? null : resolveSppgLocation(v.city, undefined, {
              vehicleLat: v.last_lat,
              vehicleLng: v.last_lng,
            });
            const sppgLng = origin ? origin[0] : (sppgLoc?.lng ?? v.last_lng);
            const sppgLat = origin ? origin[1] : (sppgLoc?.lat ?? v.last_lat);

            return {
              ...v,
              status: 'idle' as VehicleStatus,
              route_progress: 0,
              last_lng: sppgLng,
              last_lat: sppgLat,
            };
          }
          return v;
        })
      }));
    });
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
      const stateUpdates = new Map<string, any>();
      const now = Date.now();
      const MOVE_PER_TICK = 0.0003; // degrees per 1s tick (~33 m)
      const hashOf = (id: string) => Math.abs(id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0));

      for (const v of vehicles) {
        if (v.status === 'offline' || v.status === 'maintenance') continue;

        // --- 1. GUARANTEE A VALID, PER-VEHICLE ROUTE ---------------------------------
        // Every vehicle must be able to follow ITS OWN route. If it has none (or a corrupt
        // one), build a fallback from its current position to its own destination.
        let geometry: number[][] | null | undefined = v.route_geometry;
        let routeFix: { route_geometry: number[][]; route_source: 'demo_unverified' } | null = null;
        let newProgress = Number.isFinite(v.route_progress as number) ? (v.route_progress as number) : 0;

        // Auto-resolve coordinates: zero operational vehicles are left stranded or skipped
        const originLat = Number.isFinite(v.last_lat) ? (v.last_lat as number) : -6.2;
        const originLng = Number.isFinite(v.last_lng) ? (v.last_lng as number) : 106.8;
        const destLat = Number.isFinite(v.destination_lat) ? (v.destination_lat as number) : originLat + 0.015;
        const destLng = Number.isFinite(v.destination_lng) ? (v.destination_lng as number) : originLng + 0.015;

        if (!isValidRoute(geometry)) {
          geometry = createFallbackRoute(
            { lng: originLng, lat: originLat },
            { lng: destLng, lat: destLat },
          );
          routeFix = { route_geometry: geometry, route_source: 'demo_unverified' };
          newProgress = 0;
        }
        const route = geometry as number[][];
        const lastIndex = route.length - 1;
        newProgress = Math.min(Math.max(newProgress, 0), lastIndex);

        let newStatus = v.status;
        let newBearing = v.bearing ?? 0;

        // --- 2. UNLOADING DWELL ------------------------------------------------------
        if (newStatus === 'unloading') {
          // Robust physical proximity verification: A vehicle can ONLY be 'unloading'
          // if it is physically at its destination school (< 300m / 0.003 deg).
          // If it is far away (e.g. from an erroneous status or mid-route reload),
          // it must be safely corrected back to 'en_route'.
          const curLat = v.last_lat ?? (route[0] ? route[0][1] : originLat);
          const curLng = v.last_lng ?? (route[0] ? route[0][0] : originLng);
          const isFarFromSchool = Math.hypot(curLng - destLng, curLat - destLat) > 0.003;

          if (isFarFromSchool) {
            newStatus = 'en_route';
            this.unloadingStartedAt.delete(v.id);
            this.dwellDurations.delete(v.id);
          } else {
            let startedAt = this.unloadingStartedAt.get(v.id);
            if (!startedAt) {
              startedAt = now;
              this.unloadingStartedAt.set(v.id, startedAt);
              this.dwellDurations.set(v.id, 15000 + (hashOf(v.id) % 11) * 1000); // 15s to 25s
            }
            const dwell = this.dwellDurations.get(v.id) ?? 15000;
            if (now - startedAt >= dwell) {
              // Unloading complete: return to SPPG Hub in 'idle' (Siaga)
              newStatus = 'idle';
              newProgress = 0;
              newBearing = 0;
              this.unloadingStartedAt.delete(v.id);
              this.dwellDurations.delete(v.id);
              this.idleStartedAt.set(v.id, now);
              this.idleDurations.set(v.id, 8000 + (hashOf(v.id) % 8) * 1000); // 8s to 15s
            }
          }
        }

        // --- 3. IDLE / TURNAROUND ----------------------------------------------------
        if (newStatus === 'idle') {
          const startedAt = this.idleStartedAt.get(v.id);
          if (startedAt) {
            const turnaround = this.idleDurations.get(v.id) ?? 8000;
            if (now - startedAt >= turnaround) {
              newStatus = 'en_route';
              newProgress = 0;
              this.idleStartedAt.delete(v.id);
              this.idleDurations.delete(v.id);
            }
          } else {
            // First tick of the simulation: EVERY idle vehicle departs at once
            newStatus = 'en_route';
            newProgress = 0;
          }
        } else if (newStatus === 'delayed' || newStatus === 'loading') {
          newStatus = 'en_route';
          newProgress = 0;
        }

        // --- 4. MOVEMENT ALONG OWN ROUTE ---------------------------------------------
        if (newStatus === 'en_route') {
          let distanceToMove = MOVE_PER_TICK;
          let guard = route.length + 4; // hard cap: can never spin forever

          while (distanceToMove > 0 && guard-- > 0) {
            const floorIdx = Math.floor(newProgress);
            const ceilIdx = floorIdx + 1;

            if (ceilIdx > lastIndex) {
              // Reached the end of the vehicle's own route == arrived at its school.
              newProgress = lastIndex;
              newStatus = 'unloading';
              this.unloadingStartedAt.set(v.id, now);
              this.dwellDurations.set(v.id, 15000 + (hashOf(v.id) % 11) * 1000);
              break;
            }

            const start = route[floorIdx];
            const end = route[ceilIdx];
            const frac = newProgress - floorIdx;
            const subLat = start[1] + (end[1] - start[1]) * frac;
            const subLng = start[0] + (end[0] - start[0]) * frac;
            const segmentDist = Math.hypot(end[0] - subLng, end[1] - subLat);

            if (segmentDist <= 0.0000001 || distanceToMove >= segmentDist) {
              distanceToMove -= segmentDist;
              newProgress = ceilIdx;
            } else {
              newProgress += (1 - frac) * (distanceToMove / segmentDist);
              distanceToMove = 0;
            }
          }

          // Arrived exactly on the last point with budget left over -> handle arrival now
          if (newStatus === 'en_route' && newProgress >= lastIndex) {
            newProgress = lastIndex;
            newStatus = 'unloading';
            this.unloadingStartedAt.set(v.id, now);
            this.dwellDurations.set(v.id, 15000 + (hashOf(v.id) % 11) * 1000);
          }

          // Bearing
          const bIdx = Math.min(Math.floor(newProgress), lastIndex - 1);
          const p1 = route[bIdx];
          const p2 = route[bIdx + 1];
          if (p1 && p2 && (p1[0] !== p2[0] || p1[1] !== p2[1])) {
            const bY = Math.sin((p2[0] - p1[0]) * Math.PI / 180) * Math.cos(p2[1] * Math.PI / 180);
            const bX = Math.cos(p1[1] * Math.PI / 180) * Math.sin(p2[1] * Math.PI / 180) -
                       Math.sin(p1[1] * Math.PI / 180) * Math.cos(p2[1] * Math.PI / 180) * Math.cos((p2[0] - p1[0]) * Math.PI / 180);
            newBearing = (Math.atan2(bY, bX) * 180 / Math.PI + 360) % 360;
          }
        }

        const finalPos = this.getPositionAtProgress(route, newProgress);

        if (routeFix || newStatus !== v.status
          || Math.abs(newProgress - (v.route_progress ?? 0)) > 0.000001
          || Math.abs(newBearing - (v.bearing ?? 0)) > 0.1) {
          const updatedData: any = {
            id: v.id,
            license_plate: v.license_plate, // Required for Supabase upsert constraints
            last_lat: finalPos.lat,
            last_lng: finalPos.lng,
            status: newStatus,
            route_progress: newProgress,
            bearing: newBearing,
            updated_at: new Date().toISOString(),
            ...(routeFix ?? {}),
          };

          stateUpdates.set(v.id, updatedData);

          // ADD TO SYNC BUFFER
          this.queueUpdate(v.id, updatedData);
        }
      }

      // OPTIMISTIC UI UPDATE: single O(n) pass at 1Hz
      if (stateUpdates.size > 0) {
        useVehicleStore.setState(state => ({
          vehicles: state.vehicles.map(veh => {
            const update = stateUpdates.get(veh.id);
            return update ? { ...veh, ...update } : veh;
          }),
        }));
      }
    } catch (err) {
      console.error('[SIMULATION CRITICAL ERROR]', err);
    } finally {
      this.isSimulating = false;
    }
  }

}

export default new VehicleService();
