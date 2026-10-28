'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import MapGL, { NavigationControl, FullscreenControl, Source, Layer, MapRef, Marker } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { FeatureCollection, LineString } from 'geojson';
import { useVehicleStore, Vehicle } from '@/js/store/vehicleStore';
import { useQuery } from '@tanstack/react-query';
import { INDONESIA_514_REGIONS, resolveSppgLocation, normalizeRegionName } from '@/js/data/indonesia_regions';
import VehicleService, { VEHICLE_STATUS_META } from '@/js/services/VehicleService';
import { createFallbackRoute, isValidRoute, resolveVehicleDestination } from '@/js/utils/routing';
import { AlertTriangle, MapPin, Navigation, School, Trash2, User, X, Zap } from 'lucide-react';
import { supabase } from '@/js/core/SupabaseClient';
import { queryKeys } from '@/src/lib/queryKeys';

const INDONESIA_CENTER = { latitude: -2.5, longitude: 118.0 };

const SELECTED_ROUTE_SOURCE_ID = 'selected-vehicle-route';
const SELECTED_ROUTE_CASE_LAYER_ID = 'selected-vehicle-route-case';
const SELECTED_ROUTE_LAYER_ID = 'selected-vehicle-route-line';



interface VehicleMapProps {
  onVehicleSelect?: (vehicle: Vehicle | null) => void;
  selectedVehicle?: Vehicle | null;
}

export default function VehicleMap({ onVehicleSelect, selectedVehicle }: VehicleMapProps) {
  const queryClient = useQueryClient();
  const mapRef = useRef<MapRef>(null);
  const { vehicles, selectedCity } = useVehicleStore();
  const { setSelectedCity, setHasDemoData } = useVehicleStore((state) => state.actions);
  
  // --- SILENT SYNC ENGINE: Store fleet in a ref to bypass React diffing ---
  const fleetRef = useRef<Vehicle[]>(useVehicleStore.getState().vehicles);
  
  // Sync the ref silently whenever the store updates
  useEffect(() => {
    return useVehicleStore.subscribe(
      (state) => {
        fleetRef.current = state.vehicles;
      }
    );
  }, []);
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim();
  const hasMapboxToken = Boolean(mapboxToken && !mapboxToken.includes('isi_dengan'));
  
  const [popupInfo, setPopupInfo] = useState<Vehicle | null>(null);
  const [simulationActive, setSimulationActive] = useState(false);
  const [isSeedingDemo, setIsSeedingDemo] = useState(false);
  const [isClearingFleet, setIsClearingFleet] = useState(false);
  const [mapStatus, setMapStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [mapError, setMapError] = useState<string>('');
  const [offshoreMarkerIds, setOffshoreMarkerIds] = useState<Set<string>>(() => new Set());
  const infrastructureQuery = useQuery({
    queryKey: queryKeys.infrastructure,
    queryFn: async () => {
      const [{ INDONESIA_514_REGIONS }, hubsResult, schoolsResult] = await Promise.all([
        import('@/js/data/indonesia_regions'),
        supabase.from('sppg_units').select('*'),
        supabase.from('schools').select('*'),
      ]);
      if (hubsResult.error) throw hubsResult.error;
      if (schoolsResult.error) throw schoolsResult.error;

      const regionMap = new Map<string, any>();
      for (const r of INDONESIA_514_REGIONS) {
        regionMap.set(r.name.toLowerCase(), r);
      }

      // Reconcile SPPG hubs against verified regional land coordinates
      const sanitizedHubs = (hubsResult.data ?? []).map((hub: any) => {
        const cityName = (hub.city || '').toLowerCase();
        const matched = regionMap.get(cityName) || regionMap.get(
          (hub.name || '').replace(/^SPPG\s+/i, '').replace(/\s+-\s+Hub\s+\d+$/i, '').trim().toLowerCase()
        );
        if (matched) {
          return {
            ...hub,
            lat: matched.lat,
            lng: matched.lng,
          };
        }
        return hub;
      });

      return { sppgUnits: sanitizedHubs, schools: schoolsResult.data ?? [] };
    },
  });
  const sppgUnits: any[] = infrastructureQuery.data?.sppgUnits ?? [];
  const schools: any[] = infrastructureQuery.data?.schools ?? [];
  const hasCurrentRoadRoute = useCallback((vehicle: Vehicle) => {
    const route = vehicle.route_geometry;
    if (vehicle.route_source !== 'mapbox_driving' || !route || route.length < 2) return false;
    const endpoint = route[route.length - 1];
    if (vehicle.destination_lng == null || vehicle.destination_lat == null) return false;

    // Condition 1: Route destination must match destination school coordinates
    const matchesDestination = Math.abs(endpoint[0] - vehicle.destination_lng) < 0.001
      && Math.abs(endpoint[1] - vehicle.destination_lat) < 0.001;
    if (!matchesDestination) return false;

    // Condition 2: for a vehicle still parked at its hub, the route MUST start at the hub (< 500m).
    // A moving vehicle legitimately has a route that starts where it was when it was re-routed.
    if (vehicle.status === 'idle') {
      const liveVehicles = useVehicleStore.getState().vehicles;
      const normCity = normalizeRegionName(vehicle.city);
      const cityVehicles = liveVehicles.filter(item => normalizeRegionName(item.city) === normCity);
      const vehicleIdx = cityVehicles.findIndex(item => item.id === vehicle.id);

      const sppg = resolveSppgLocation(vehicle.city, sppgUnits, {
        vehicleLat: vehicle.last_lat,
        vehicleLng: vehicle.last_lng,
        vehicleIndex: vehicleIdx >= 0 ? vehicleIdx : undefined
      });

      if (sppg) {
        const startPoint = route[0];
        const distToSppg = Math.hypot(startPoint[0] - sppg.lng, startPoint[1] - sppg.lat);
        if (distToSppg > 0.005) return false;
      }
    }

    return true;
  }, [sppgUnits]);

  const applyVerifiedRoute = useCallback(async (staleVehicle: Vehicle) => {
    // Always work from the LIVE vehicle (the simulation mutates it every second).
    const vehicle = useVehicleStore.getState().vehicles.find(v => v.id === staleVehicle.id) ?? staleVehicle;
    if (vehicle.destination_lng == null || vehicle.destination_lat == null) return false;
    if (vehicle.status === 'unloading') return false; // already at the school

    let startLng: number | null | undefined;
    let startLat: number | null | undefined;
    if (vehicle.status === 'idle') {
      // Parked: the journey begins at the assigned regional SPPG Hub
      const liveVehicles = useVehicleStore.getState().vehicles;
      const normCity = normalizeRegionName(vehicle.city);
      const cityVehicles = liveVehicles.filter(item => normalizeRegionName(item.city) === normCity);
      const vehicleIdx = cityVehicles.findIndex(item => item.id === vehicle.id);

      const sppg = resolveSppgLocation(vehicle.city, sppgUnits, {
        vehicleLat: vehicle.last_lat,
        vehicleLng: vehicle.last_lng,
        vehicleIndex: vehicleIdx >= 0 ? vehicleIdx : undefined
      });
      startLng = sppg?.lng ?? (vehicle.route_geometry?.[0]?.[0] ?? vehicle.last_lng);
      startLat = sppg?.lat ?? (vehicle.route_geometry?.[0]?.[1] ?? vehicle.last_lat);
    } else {
      // Already moving: continue from where the vehicle is right now (no teleporting)
      startLng = vehicle.last_lng;
      startLat = vehicle.last_lat;
    }
    if (startLng == null || startLat == null) return false;

    let activeRoute = await VehicleService.fetchMapboxRoute(
      [startLng, startLat],
      [vehicle.destination_lng, vehicle.destination_lat],
      vehicle.id
    );
    if (!activeRoute) return false;

    // Minimum distance check: If route is too short (< 800m, e.g. snapped destination to coast),
    // probe landward angles to ensure school is at a realistic delivery distance (1.2 - 3.0 km)
    if (activeRoute.distance != null && activeRoute.distance < 800) {
      const probeAngles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2, Math.PI / 4, (3 * Math.PI) / 4];
      for (const angle of probeAngles) {
        const altLng = startLng + Math.cos(angle) * 0.018; // ~2km
        const altLat = startLat + Math.sin(angle) * 0.018;
        const retryRoute = await VehicleService.fetchMapboxRoute([startLng, startLat], [altLng, altLat]);
        if (retryRoute && retryRoute.distance != null && retryRoute.distance >= 1000) {
          activeRoute = retryRoute;
          break;
        }
      }
    }

    await VehicleService.updateVehicleRoute(vehicle.id, activeRoute);
    const [destinationLng, destinationLat] = activeRoute.coordinates[activeRoute.coordinates.length - 1];
    queryClient.setQueryData(queryKeys.infrastructure, (current: any) => current && ({
      ...current,
      schools: current.schools.map((school: any) => school.name === vehicle.destination_school_name
        ? { ...school, lng: destinationLng, lat: destinationLat }
        : school),
    }));
    void queryClient.invalidateQueries({ queryKey: queryKeys.infrastructure });
    return true;
  }, [sppgUnits, queryClient]);

  useEffect(() => {
    if (mapStatus !== 'ready' || !infrastructureQuery.data) return;
    const map = mapRef.current?.getMap();
    if (!map) return;

    const waterLayerIds = map.getStyle().layers
      .filter((layer: any) => layer['source-layer'] === 'water' || /(^|[-_])water([-_]|$)/i.test(layer.id))
      .map((layer: any) => layer.id);
    if (waterLayerIds.length === 0) return;

    const candidates = [
      ...sppgUnits.map((unit: any) => ({ id: `sppg:${unit.id ?? unit.name}`, lng: unit.lng, lat: unit.lat })),
      ...schools.map((school: any) => ({ id: `school:${school.id ?? school.name}`, lng: school.lng, lat: school.lat })),
    ];

    const validateVisibleMarkers = () => {
      const bounds = map.getBounds();
      if (!bounds) return;
      const offshore = new Set<string>();
      for (const point of candidates) {
        if (!Number.isFinite(point.lng) || !Number.isFinite(point.lat) || !bounds.contains([point.lng, point.lat])) continue;
        try {
          const screenPoint = map.project([point.lng, point.lat]);
          if (map.queryRenderedFeatures(screenPoint, { layers: waterLayerIds }).length > 0) {
            offshore.add(point.id);
          }
        } catch (error) {
          console.warn('Could not validate map marker land position:', error);
        }
      }
      setOffshoreMarkerIds(offshore);
    };

    validateVisibleMarkers();
    map.on('moveend', validateVisibleMarkers);
    return () => { map.off('moveend', validateVisibleMarkers); };
  }, [mapStatus, infrastructureQuery.data, selectedCity]);

  // --- Auto-Navigate to Selected Region ---
  useEffect(() => {
    if (!mapRef.current) return;
    
    if (selectedCity === 'Semua') {
      mapRef.current.flyTo({
        center: [INDONESIA_CENTER.longitude, INDONESIA_CENTER.latitude],
        zoom: 4.5,
        duration: 2000,
        essential: true
      });
      return;
    }

    const region = INDONESIA_514_REGIONS.find(r => r.name === selectedCity);
    if (region) {
      mapRef.current.flyTo({
        center: [region.lng, region.lat],
        zoom: 11,
        duration: 1500,
        essential: true
      });
    }
  }, [selectedCity]);

  // Filter vehicles based on selected city for UI elements and map layers
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => {
      if (selectedCity === 'Semua') return true;
      return normalizeRegionName(v.city) === normalizeRegionName(selectedCity);
    });
  }, [vehicles, selectedCity]);

  // --- Strict SPPG GeoJSON: Constructed SOLELY from active fleet vehicles ---
  // If an SPPG has no active vehicle, it CANNOT exist in this GeoJSON (Absolute 0% empty hubs).
  const sppgGeoJSON = useMemo<FeatureCollection>(() => {
    if (filteredVehicles.length === 0) {
      return { type: 'FeatureCollection', features: [] };
    }

    const hubMap = new Map<string, any>();
    const normSelected = normalizeRegionName(selectedCity);

    // Group filtered vehicles by city to allocate multi-hubs cleanly
    const cityGroups = new Map<string, Vehicle[]>();
    filteredVehicles.forEach(v => {
      const normCity = normalizeRegionName(v.city);
      const list = cityGroups.get(normCity) || [];
      list.push(v);
      cityGroups.set(normCity, list);
    });

    for (const [normCity, cityVehicles] of cityGroups) {
      if (selectedCity !== 'Semua' && normCity !== normSelected) continue;

      cityVehicles.forEach((v, idx) => {
        const sppg = resolveSppgLocation(v.city, sppgUnits, {
          vehicleLat: v.last_lat,
          vehicleLng: v.last_lng,
          vehicleIndex: idx,
        });

        if (sppg && Number.isFinite(sppg.lng) && Number.isFinite(sppg.lat)) {
          const key = sppg.id || sppg.name || `${sppg.lat.toFixed(5)},${sppg.lng.toFixed(5)}`;
          if (!hubMap.has(key) && !offshoreMarkerIds.has(`sppg:${sppg.id ?? sppg.name}`)) {
            hubMap.set(key, {
              type: 'Feature',
              geometry: { type: 'Point', coordinates: [sppg.lng, sppg.lat] },
              properties: { name: sppg.name || `SPPG ${v.city}`, city: v.city }
            });
          }
        }
      });
    }

    return {
      type: 'FeatureCollection',
      features: Array.from(hubMap.values())
    };
  }, [filteredVehicles, sppgUnits, selectedCity, offshoreMarkerIds]);

  const activeVehicleId = popupInfo?.id || selectedVehicle?.id;
  const activeVehicle = useMemo(() => {
    if (!activeVehicleId) return null;
    const storeVeh = vehicles.find(v => v.id === activeVehicleId);
    const candidate = (popupInfo?.id === activeVehicleId ? popupInfo : null) || selectedVehicle;
    const merged = {
      ...(candidate ?? {}),
      ...(storeVeh ?? {}),
      destination_lat: storeVeh?.destination_lat ?? candidate?.destination_lat ?? null,
      destination_lng: storeVeh?.destination_lng ?? candidate?.destination_lng ?? null,
      destination_school_name: storeVeh?.destination_school_name ?? candidate?.destination_school_name ?? null,
    } as Vehicle;

    const sppg = resolveSppgLocation(merged.city, sppgUnits, {
      vehicleLat: merged.last_lat,
      vehicleLng: merged.last_lng,
    });
    const resolved = resolveVehicleDestination(merged, sppg);

    return {
      ...merged,
      destination_lat: resolved.lat,
      destination_lng: resolved.lng,
      destination_school_name: resolved.name,
    };
  }, [activeVehicleId, vehicles, popupInfo, selectedVehicle, sppgUnits]);

  const schoolsGeoJSON = useMemo<FeatureCollection>(() => {
    if (filteredVehicles.length === 0 && schools.length === 0) {
      return { type: 'FeatureCollection', features: [] };
    }

    const normSelected = normalizeRegionName(selectedCity);
    const schoolList: Array<{ name: string; province?: string; city?: string; lng: number; lat: number }> = [];

    const activeDestLng = activeVehicle?.destination_lng;
    const activeDestLat = activeVehicle?.destination_lat;
    const activeDestName = activeVehicle?.destination_school_name?.trim().toLowerCase();

    // Deduplication safeguard: avoids duplicate icons at the same coordinates or identical name
    const hasDuplicate = (candidate: { name: string; lng: number; lat: number }) => {
      const normName = candidate.name.trim().toLowerCase();
      return schoolList.some(s => {
        const nameMatches = s.name.trim().toLowerCase() === normName;
        const coordsMatch = Math.hypot(s.lng - candidate.lng, s.lat - candidate.lat) < 0.0008; // ~80m
        return nameMatches || coordsMatch;
      });
    };

    // 1. Ingest schools from Supabase infrastructure query if coordinates are valid
    for (const s of schools) {
      if (Number.isFinite(s.lng) && Number.isFinite(s.lat) && !offshoreMarkerIds.has(`school:${s.id ?? s.name}`)) {
        if (selectedCity !== 'Semua') {
          const norm = normalizeRegionName(s.city || s.province);
          if (norm !== normSelected && normalizeRegionName(s.province) !== normSelected) continue;
        }
        if (!hasDuplicate(s)) {
          schoolList.push({
            name: s.name,
            province: s.province,
            city: s.city,
            lng: s.lng,
            lat: s.lat,
          });
        }
      }
    }

    // 2. HYBRID FALLBACK: Ingest schools from active vehicles' destinations
    for (const v of vehicles) {
      if (selectedCity !== 'Semua' && normalizeRegionName(v.city) !== normSelected) continue;
      const sppg = resolveSppgLocation(v.city, sppgUnits, {
        vehicleLat: v.last_lat,
        vehicleLng: v.last_lng,
      });
      const resolved = resolveVehicleDestination(v, sppg);
      if (Number.isFinite(resolved.lng) && Number.isFinite(resolved.lat)) {
        if (!hasDuplicate({ name: resolved.name, lng: resolved.lng, lat: resolved.lat })) {
          schoolList.push({
            name: resolved.name,
            city: v.city,
            lng: resolved.lng,
            lat: resolved.lat,
          });
        }
      }
    }

    // 3. Guarantee active vehicle's destination is included
    if (activeDestLng != null && activeDestLat != null && Number.isFinite(activeDestLng) && Number.isFinite(activeDestLat)) {
      const alreadyHas = schoolList.some(s => {
        const coordsMatch = Math.hypot(s.lng - activeDestLng, s.lat - activeDestLat) < 0.0008;
        const nameMatches = activeDestName ? s.name.trim().toLowerCase() === activeDestName : false;
        return coordsMatch || nameMatches;
      });
      if (!alreadyHas) {
        schoolList.push({
          name: activeVehicle?.destination_school_name || 'Sekolah Penerima',
          city: activeVehicle?.city,
          lng: activeDestLng,
          lat: activeDestLat
        });
      }
    }

    // Exclude active vehicle destination from WebGL layer so it is exclusively rendered
    // by the prominent, dedicated School Logo <Marker> (guarantees exactly 1 icon, 0% duplication)
    const isDestinationOfActiveVehicle = (s: { name: string; lng: number; lat: number }) => {
      if (activeDestLng != null && activeDestLat != null) {
        if (Math.hypot(s.lng - activeDestLng, s.lat - activeDestLat) < 0.0008) return true;
      }
      if (activeDestName && s.name.trim().toLowerCase() === activeDestName) return true;
      return false;
    };

    const displaySchools = schoolList.filter(s => !isDestinationOfActiveVehicle(s));

    return {
      type: 'FeatureCollection',
      features: displaySchools.map(s => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [s.lng, s.lat] },
        properties: {
          name: s.name,
          province: s.province,
          city: s.city,
        }
      }))
    };
  }, [schools, vehicles, selectedCity, filteredVehicles.length, offshoreMarkerIds, sppgUnits, activeVehicle]);

  // --- 60FPS ANIMATION ENGINE (High Performance) ---
  const animationRef = useRef<number>(0);
  const lastUpdateRef = useRef<number>(Date.now());
  const vehicleStatesRef = useRef<Map<string, { lat: number, lng: number, bearing: number, fromLat: number, fromLng: number, toLat: number, toLng: number, t0: number }>>(new Map());
  const sppgUnitsRef = useRef<any[]>([]);
  sppgUnitsRef.current = sppgUnits;

  // Shortest path angle interpolation
  const lerpAngle = (a: number, b: number, t: number) => {
    const d = b - a;
    const delta = ((((d + 180) % 360) + 360) % 360) - 180;
    return a + delta * t;
  };

  const animate = useCallback(() => {
    const now = Date.now();
    lastUpdateRef.current = now;

    // Positions are interpolated at constant velocity between 1 Hz engine ticks (see below).

    // Filter silently from the ref: ALL active vehicles in the selected city are animated
    const normSelected = normalizeRegionName(selectedCity);
    const targetFleet = fleetRef.current.filter(v => {
      if (selectedCity !== 'Semua') {
        const normCity = normalizeRegionName(v.city);
        if (normCity !== normSelected) return false;
      }
      return v.status !== 'offline';
    });
    
    if (targetFleet.length === 0) {
      // Immediate visual clear if fleet is empty
      const map = mapRef.current?.getMap();
      if (map && map.getSource('fleet-source')) {
        (map.getSource('fleet-source') as any).setData({ type: 'FeatureCollection', features: [] });
      }
      animationRef.current = requestAnimationFrame(animate);
      return;
    }

    const features = targetFleet.map(v => {
      let state = vehicleStatesRef.current.get(v.id);
      
      if (!state) {
        const initLat = v.last_lat ?? 0;
        const initLng = v.last_lng ?? 0;
        state = {
          lat: initLat, lng: initLng, bearing: v.bearing ?? 0,
          fromLat: initLat, fromLng: initLng, toLat: initLat, toLng: initLng, t0: now,
        };
        vehicleStatesRef.current.set(v.id, state);
      }

      const s = state!;

      let targetLat = v.last_lat ?? s.lat;
      let targetLng = v.last_lng ?? s.lng;

      // Idle (Siaga) vehicles are stationed EXACTLY at their hub. For routed vehicles the
      // route origin IS the hub, which guarantees no jump when the simulation departs.
      if (v.status === 'idle') {
        const origin = v.route_geometry && v.route_geometry.length > 0
          ? v.route_geometry[0]
          : null;
        if (origin) {
          targetLng = origin[0];
          targetLat = origin[1];
        } else {
          const normCity = normalizeRegionName(v.city);
          const cityVehicles = targetFleet.filter(item => normalizeRegionName(item.city) === normCity);
          const vehicleIdx = cityVehicles.findIndex(item => item.id === v.id);
          const sppg = resolveSppgLocation(v.city, sppgUnitsRef.current, {
            vehicleLat: v.last_lat,
            vehicleLng: v.last_lng,
            vehicleIndex: vehicleIdx >= 0 ? vehicleIdx : undefined
          });
          if (sppg) {
            targetLng = sppg.lng;
            targetLat = sppg.lat;
          }
        }
      }

      // Snap instantly when idle or when the marker is implausibly far from its target
      if (v.status === 'idle' || Math.hypot(s.lat - targetLat, s.lng - targetLng) > 0.005) {
        s.lat = targetLat; s.lng = targetLng;
        s.fromLat = targetLat; s.fromLng = targetLng;
        s.toLat = targetLat; s.toLng = targetLng;
        s.t0 = now;
      } else if (Math.abs(targetLat - s.toLat) > 1e-9 || Math.abs(targetLng - s.toLng) > 1e-9) {
        // New engine position: glide from where the marker is NOW to it at constant velocity
        s.fromLat = s.lat; s.fromLng = s.lng;
        s.toLat = targetLat; s.toLng = targetLng;
        s.t0 = now;
      }

      const p = Math.min(1, (now - s.t0) / 1000); // engine ticks every 1000 ms
      s.lat = s.fromLat + (s.toLat - s.fromLat) * p;
      s.lng = s.fromLng + (s.toLng - s.fromLng) * p;

      // Heading comes from the engine's route-segment bearing (stable); smooth only the wrap-around
      if (v.status !== 'idle' && v.bearing != null) {
        s.bearing = lerpAngle(s.bearing, v.bearing, 0.15);
      }

      return {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [s.lng, s.lat] },
        properties: {
          id: v.id,
          plate: v.license_plate,
          status: v.status,
          bearing: s.bearing
        }
      };
    });

    const geojson = { type: 'FeatureCollection', features };
    
    // Direct source update for performance
    const map = mapRef.current?.getMap();
    if (map && map.getSource('fleet-source')) {
      (map.getSource('fleet-source') as any).setData(geojson);
    }

    animationRef.current = requestAnimationFrame(animate);
  }, [selectedCity]); // Only recreate animate if selectedCity changes

  useEffect(() => {
    if (mapStatus === 'ready') {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    }
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [mapStatus, animate]);

  // --- VISIBILITY SYNC: Anti-drift when returning to tab ---
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        vehicleStatesRef.current.clear();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // --- ATOMIC SYNC: Explicit memory and visual reset when fleet is cleared ---
  useEffect(() => {
    if (vehicles.length === 0) {
      if (simulationActive) {
        VehicleService.stopSimulation();
        setSimulationActive(false);
      }
      const map = mapRef.current?.getMap();
      if (map && map.getSource('fleet-source')) {
        (map.getSource('fleet-source') as any).setData({ type: 'FeatureCollection', features: [] });
      }
      vehicleStatesRef.current.clear();
      setPopupInfo(null); // Fix: Atomic reset of local selection state
    }
  }, [vehicles.length, simulationActive]);

  function fitSelectedVehicle(vehicle: Vehicle) {
    if (!mapRef.current || vehicle.last_lng === null || vehicle.last_lat === null) return;

    const sppg = resolveSppgLocation(vehicle.city, sppgUnits, {
      vehicleLat: vehicle.last_lat,
      vehicleLng: vehicle.last_lng,
    });
    const dest = resolveVehicleDestination(vehicle, sppg);

    const points: [number, number][] = [
      [vehicle.last_lng, vehicle.last_lat],
      [dest.lng, dest.lat],
    ];

    const lngs = points.map(point => point[0]);
    const lats = points.map(point => point[1]);
    const bounds: [[number, number], [number, number]] = [
      [Math.min(...lngs), Math.min(...lats)],
      [Math.max(...lngs), Math.max(...lats)]
    ];

    mapRef.current.fitBounds(bounds, {
      padding: { top: 130, bottom: 100, left: 320, right: 80 },
      duration: 900,
      maxZoom: 14
    });
  }

  // --- DYNAMIC ROUTE FETCH: Load real road paths for the active city ---
  useEffect(() => {
    let isMounted = true;
    if (vehicles.length === 0) return;

    const fetchCityRoutes = async () => {
      const cityVehicles = vehicles
        .filter(v => selectedCity === 'Semua' || v.city === selectedCity)
        .filter(v => !hasCurrentRoadRoute(v))
        .slice(0, 10);
      for (const v of cityVehicles) {
        if (!isMounted) break;
        try {
          if (!isMounted) break;
          if (await applyVerifiedRoute(v)) {
            await new Promise(r => setTimeout(r, 200)); // Throttling delay
          }
        } catch (err) {
          console.error(`Failed to fetch real route for vehicle ${v.license_plate}:`, err);
        }
      }
    };

    fetchCityRoutes();
    return () => { isMounted = false; };
  }, [selectedCity, vehicles, hasCurrentRoadRoute, applyVerifiedRoute]);


  // --- Selection Sync: Mirror prop to local state ---
  useEffect(() => {
    if (!selectedVehicle) {
      setPopupInfo(null);
      return;
    }
    
    setPopupInfo(selectedVehicle);

    if (mapRef.current && selectedVehicle.last_lng !== null && selectedVehicle.last_lat !== null) {
      fitSelectedVehicle(selectedVehicle);
    }

    // Asynchronously enhance route in background without blocking visual display
    if (hasMapboxToken && !hasCurrentRoadRoute(selectedVehicle)) {
      applyVerifiedRoute(selectedVehicle).catch(err => {
        console.warn('Could not road-snap route on selection:', err);
      });
    }
  }, [hasMapboxToken, selectedVehicle, hasCurrentRoadRoute, applyVerifiedRoute]);

  useEffect(() => {
    return () => VehicleService.stopSimulation();
  }, []);

  const onMapLoad = useCallback(() => {
    setMapStatus('ready');
    const map = mapRef.current?.getMap();
    if (!map) return;

    // Load SLEEK 2.0 Gold & Maroon branded icons
    Object.entries(VEHICLE_STATUS_META).forEach(([status, meta]) => {
      const size = 64; 
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const center = size / 2;
        const brandGold = '#F4C662';
        const brandMaroon = '#8B1C3F';
        
        // --- PREMIUM GOLD BODY ---
        ctx.shadowColor = 'rgba(0,0,0,0.4)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 4;

        const w = 24;
        const h = 52;
        const radius = 10;
        
        // 1. Side Mirrors (Maroon Accent)
        ctx.fillStyle = brandMaroon;
        ctx.beginPath();
        ctx.roundRect(center - w/2 - 5, center - h/2 + 14, 6, 5, 2);
        ctx.roundRect(center + w/2 - 1, center - h/2 + 14, 6, 5, 2);
        ctx.fill();

        // 2. Main Body (Gold)
        ctx.fillStyle = brandGold;
        ctx.strokeStyle = brandMaroon;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(center - w/2, center - h/2, w, h, radius);
        ctx.fill();
        ctx.stroke();

        // 3. Status Badge (Small dot on the roof)
        ctx.fillStyle = meta.color;
        ctx.beginPath();
        ctx.arc(center, center + h/2 - 8, 4, 0, Math.PI * 2);
        ctx.fill();

        // 4. Windshield (Premium Glass)
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
        ctx.fillStyle = 'rgba(15, 20, 25, 0.9)';
        ctx.beginPath();
        ctx.roundRect(center - w/2 + 3, center - h/2 + 8, w - 6, 12, 4);
        ctx.fill();

        // 5. White Roof Reflection (3D Depth)
        const reflect = ctx.createLinearGradient(0, center - h/2, 0, center + h/2);
        reflect.addColorStop(0, 'rgba(255,255,255,0.4)');
        reflect.addColorStop(0.5, 'rgba(255,255,255,0)');
        ctx.fillStyle = reflect;
        ctx.fillRect(center - w/2 + 2, center - h/2 + 2, w - 4, h - 4);

        const imageData = ctx.getImageData(0, 0, size, size);
        map.addImage(`icon-${status}`, imageData);
      }
    });

    // Load SPPG Warehouse Icon
    const hubSize = 48;
    const hubCanvas = document.createElement('canvas');
    hubCanvas.width = hubSize;
    hubCanvas.height = hubSize;
    const hubCtx = hubCanvas.getContext('2d');
    if (hubCtx) {
      const c = hubSize / 2;
      hubCtx.shadowColor = 'rgba(0,0,0,0.2)';
      hubCtx.shadowBlur = 4;
      hubCtx.fillStyle = '#e8673a'; // Brand Orange (SPPG Hub)
      
      // Draw a Warehouse/Depot Shape
      hubCtx.beginPath();
      hubCtx.moveTo(c - 16, c + 12);
      hubCtx.lineTo(c - 16, c - 4);
      hubCtx.lineTo(c, c - 16);
      hubCtx.lineTo(c + 16, c - 4);
      hubCtx.lineTo(c + 16, c + 12);
      hubCtx.closePath();
      hubCtx.fill();
      
      // Door detail
      hubCtx.fillStyle = '#FFFFFF';
      hubCtx.fillRect(c - 4, c + 4, 8, 8);
      
      const hubData = hubCtx.getImageData(0, 0, hubSize, hubSize);
      map.addImage('icon-warehouse', hubData);
    }

    // Load School Icon (Red & Gold Schoolhouse Badge)
    const schoolSize = 48;
    const schoolCanvas = document.createElement('canvas');
    schoolCanvas.width = schoolSize;
    schoolCanvas.height = schoolSize;
    const schoolCtx = schoolCanvas.getContext('2d');
    if (schoolCtx) {
      const c = schoolSize / 2;
      schoolCtx.shadowColor = 'rgba(0,0,0,0.25)';
      schoolCtx.shadowBlur = 4;

      // School building main block
      schoolCtx.fillStyle = '#ff5252'; // Vibrant School Red
      schoolCtx.fillRect(c - 15, c - 2, 30, 16);

      // Triangular Roof / Gable
      schoolCtx.beginPath();
      schoolCtx.moveTo(c - 18, c - 2);
      schoolCtx.lineTo(c, c - 14);
      schoolCtx.lineTo(c + 18, c - 2);
      schoolCtx.closePath();
      schoolCtx.fillStyle = '#c62828';
      schoolCtx.fill();

      // Bell Tower / Flag atop roof
      schoolCtx.fillStyle = '#F4C662'; // Gold
      schoolCtx.fillRect(c - 3, c - 20, 6, 7);
      schoolCtx.beginPath();
      schoolCtx.moveTo(c - 4, c - 20);
      schoolCtx.lineTo(c, c - 24);
      schoolCtx.lineTo(c + 4, c - 20);
      schoolCtx.closePath();
      schoolCtx.fillStyle = '#8B1C3F';
      schoolCtx.fill();

      // Entrance Door
      schoolCtx.fillStyle = '#FFFFFF';
      schoolCtx.fillRect(c - 3, c + 6, 6, 8);

      // Windows
      schoolCtx.fillRect(c - 11, c + 2, 5, 5);
      schoolCtx.fillRect(c + 6, c + 2, 5, 5);

      // Clock / Circle in gable
      schoolCtx.beginPath();
      schoolCtx.arc(c, c - 6, 2.5, 0, Math.PI * 2);
      schoolCtx.fillStyle = '#FFFFFF';
      schoolCtx.fill();

      const schoolData = schoolCtx.getImageData(0, 0, schoolSize, schoolSize);
      if (!map.hasImage('icon-school')) {
        map.addImage('icon-school', schoolData);
      }
    }

    // --- MANUAL FLEET LAYER INJECTION (Bypass React) ---
    if (!map.getSource('fleet-source')) {
      map.addSource('fleet-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });

      map.addLayer(fleetLayerStyle);
    }

    if (selectedVehicle) fitSelectedVehicle(selectedVehicle);
  }, []);

  const onMapError = useCallback((event: any) => {
    const message = event?.error?.message || event?.message || 'Mapbox gagal memuat peta.';
    // Use setTimeout to avoid React "setState while rendering" error
    setTimeout(() => {
      setMapError(message);
      setMapStatus((status) => status === 'ready' ? status : 'error');
    }, 0);
  }, []);

  const onMapClick = useCallback((e: any) => {
    const map = e.target;
    const features = map.queryRenderedFeatures(e.point, { layers: ['fleet-layer'] });

    if (features.length > 0) {
      const feature = features[0];
      const vehicleId = feature.properties.id;
      const vehicle = fleetRef.current.find(v => v.id === vehicleId);
      if (vehicle) {
        handleVehicleClick(vehicle);
        return;
      }
    }

    setPopupInfo(null);
    onVehicleSelect?.(null);
  }, [onVehicleSelect, vehicles]);

  const handleVehicleClick = useCallback(async (vehicle: Vehicle) => {
    setPopupInfo(vehicle);
    onVehicleSelect?.(vehicle);
    fitSelectedVehicle(vehicle);

    // Only show a vehicle's path after obtaining a road-verified route.
    if (!hasCurrentRoadRoute(vehicle)) {
      try {
        await applyVerifiedRoute(vehicle);
      } catch (err) {
        console.error('Failed to update vehicle route on click:', err);
      }
    }
  }, [onVehicleSelect, vehicles]);

  const selectedRouteGeoJSON = useMemo<FeatureCollection<LineString> | null>(() => {
    const selected = popupInfo || selectedVehicle;
    if (!selected) return null;

    // Find the LATEST version of this vehicle from the main fleet list
    const vehicle = vehicles.find(v => v.id === selected.id) || selected;
    
    // Resolve starting origin coordinates
    let startLng = vehicle.last_lng;
    let startLat = vehicle.last_lat;

    const sppg = resolveSppgLocation(vehicle.city, sppgUnits, {
      vehicleLat: vehicle.last_lat,
      vehicleLng: vehicle.last_lng,
    });

    if (vehicle.status === 'idle' && sppg) {
      startLng = sppg.lng;
      startLat = sppg.lat;
    }

    const resolved = resolveVehicleDestination(vehicle, sppg);
    const destLng = resolved.lng;
    const destLat = resolved.lat;

    const originLng: number = startLng ?? sppg?.lng ?? (destLng - 0.015);
    const originLat: number = startLat ?? sppg?.lat ?? (destLat - 0.015);

    let route: number[][] = [];

    // Check if vehicle already has a valid polyline route
    if (isValidRoute(vehicle.route_geometry)) {
      route = vehicle.route_geometry.filter(coord => Array.isArray(coord) && coord.length >= 2);
      if (route.length > 1 && vehicle.route_progress !== null && vehicle.route_progress !== undefined) {
        const progressIndex = Math.max(0, Math.floor(vehicle.route_progress));
        route = route.slice(Math.min(progressIndex, route.length - 1));
      }
    } else {
      // INSTANT ROUTE ON CLICK (0ms latency: immediately appears before simulation starts!)
      route = createFallbackRoute(
        { lng: originLng, lat: originLat },
        { lng: destLng, lat: destLat }
      );
    }

    const coordinates: [number, number][] = [[originLng, originLat]];
    if (route.length > 0) {
      for (const coord of route) {
        if (coord && Number.isFinite(coord[0]) && Number.isFinite(coord[1])) {
          const isDup = Math.hypot(coord[0] - originLng, coord[1] - originLat) < 0.00001;
          if (!isDup) {
            coordinates.push([coord[0], coord[1]]);
          }
        }
      }
    } else {
      coordinates.push([destLng, destLat]);
    }

    if (coordinates.length < 2) return null;

    return {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates
        },
        properties: {}
      }]
    };
  }, [popupInfo, selectedVehicle, vehicles, sppgUnits]);

  // --- LAYER ORDERING: Ensure fleet is ALWAYS on top ---
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (map && map.getLayer('fleet-layer')) {
      // Move fleet layer to the very top
      map.moveLayer('fleet-layer');
    }
  }, [selectedRouteGeoJSON]);

  const routeCaseLayerStyle: any = {
    id: SELECTED_ROUTE_CASE_LAYER_ID,
    type: 'line',
    source: SELECTED_ROUTE_SOURCE_ID,
    beforeId: 'fleet-layer',
    layout: {
      'line-cap': 'round',
      'line-join': 'round'
    },
    paint: {
      'line-color': '#FFFFFF',
      'line-width': 8,
      'line-opacity': 0.95
    }
  };

  const routeLayerStyle: any = {
    id: SELECTED_ROUTE_LAYER_ID,
    type: 'line',
    source: SELECTED_ROUTE_SOURCE_ID,
    beforeId: 'fleet-layer',
    layout: {
      'line-cap': 'round',
      'line-join': 'round'
    },
    paint: {
      'line-color': '#8B1C3F',
      'line-width': 4,
      'line-opacity': 0.95
    }
  };

  const fleetLayerStyle: any = {
    id: 'fleet-layer',
    type: 'symbol',
    source: 'fleet-source',
    layout: {
      'icon-image': ['concat', 'icon-', ['get', 'status']],
      'icon-size': [
        'interpolate', ['linear'], ['zoom'],
        4, 0.15,
        10, 0.35,
        14, 0.5,
        18, 0.28,  // Realistic House Scale (Shrink at close zoom)
        22, 0.22   // Minimal size for maximum zoom
      ],
      'icon-rotate': ['get', 'bearing'],
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
      'icon-rotation-alignment': 'map',
      'text-field': ['get', 'plate'],
      'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
      'text-size': [
        'interpolate', ['linear'], ['zoom'],
        10, 8,
        14, 11,
        18, 9      // Shrink text slightly to fit residential streets
      ],
      'text-offset': [0, 2.8],
      'text-anchor': 'top',
    },
    paint: {
      'icon-opacity': 1,
      'icon-halo-color': '#FFFFFF',
      'icon-halo-width': ['case', ['==', ['get', 'isSelected'], 1], 3, 0],
      'text-color': '#2c1810',
      'text-halo-color': '#FFFFFF',
      'text-halo-width': 2,
      'text-opacity': [
        'interpolate', ['linear'], ['zoom'],
        8, 0,
        10, 1
      ]
    }
  };

  const sppgLayerStyle: any = {
    id: 'sppg-layer',
    type: 'symbol',
    beforeId: 'fleet-layer',
    layout: {
      'icon-image': 'icon-warehouse',
      'icon-size': [
        'interpolate', ['linear'], ['zoom'], 
        10, 0.4, 
        14, 0.6,
        18, 0.35  // Match the footprint of a real depot building
      ],
      'icon-allow-overlap': true
    }
  };

  const sppgLabelLayerStyle: any = {
    id: 'sppg-label-layer',
    type: 'symbol',
    layout: {
      'text-field': ['get', 'name'],
      'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
      'text-size': 10,
      'text-offset': [0, 1.8],
      'text-anchor': 'top',
    },
    paint: {
      'text-color': '#1b5e20',
      'text-halo-color': '#ffffff',
      'text-halo-width': 1,
      'text-opacity': [
        'interpolate', ['linear'], ['zoom'],
        11, 0,
        12, 1
      ]
    }
  };

  const schoolsLayerStyle: any = {
    id: 'schools-layer',
    type: 'symbol',
    layout: {
      'icon-image': 'icon-school',
      'icon-size': [
        'interpolate', ['linear'], ['zoom'], 
        8, 0.35, 
        12, 0.55, 
        15, 0.75,
        18, 0.5
      ],
      'icon-allow-overlap': true,
      'icon-ignore-placement': true
    }
  };

  const schoolsLabelLayerStyle: any = {
    id: 'schools-label-layer',
    type: 'symbol',
    layout: {
      'text-field': ['get', 'name'],
      'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
      'text-size': 10,
      'text-offset': [0, 1.8],
      'text-anchor': 'top',
      'text-allow-overlap': true
    },
    paint: {
      'text-color': '#c62828',
      'text-halo-color': '#ffffff',
      'text-halo-width': 1.5,
      'text-opacity': [
        'interpolate', ['linear'], ['zoom'],
        11, 0,
        12, 1
      ]
    }
  };


  const toggleSimulation = async () => {
    if (simulationActive) {
      VehicleService.stopSimulation();
      setSimulationActive(false);
      return;
    }

    const currentVehicles = useVehicleStore.getState().vehicles;
    if (currentVehicles.length === 0) return;

    // Start simulation immediately so all vehicles depart without any blocking wait!
    VehicleService.startSimulation();
    setSimulationActive(true);

    // Progressively upgrade unverified routes with Mapbox road-snapped driving directions in the background
    const unverified = currentVehicles.filter(v => v.route_source !== 'mapbox_driving');
    if (unverified.length > 0) {
      const normCity = normalizeRegionName(selectedCity);
      const prioritized = [
        ...unverified.filter(v => selectedCity !== 'Semua' && normalizeRegionName(v.city) === normCity),
        ...unverified.filter(v => selectedCity === 'Semua' || normalizeRegionName(v.city) !== normCity),
      ];

      void (async () => {
        const BATCH_SIZE = 4;
        for (let i = 0; i < prioritized.length; i += BATCH_SIZE) {
          if (!useVehicleStore.getState().vehicles.length) break;
          const batch = prioritized.slice(i, i + BATCH_SIZE);
          await Promise.all(batch.map(v => applyVerifiedRoute(v).catch(() => false)));
          await new Promise(r => setTimeout(r, 100));
        }
      })();
    }
  };

  if (!hasMapboxToken) {
    return (
      <div className="vehicle-map-error" style={{
        minHeight: 560,
        borderRadius: 16,
        background: '#fff',
        border: '1px solid rgba(139, 28, 63, 0.12)',
        boxShadow: '0 4px 24px rgba(139,28,63,0.08)'
      }}>
        <div style={{ maxWidth: 460 }}>
          <AlertTriangle size={36} color="var(--maroon)" style={{ marginBottom: 12 }} />
          <h3 style={{ marginBottom: 8, color: 'var(--maroon)', fontFamily: 'var(--font-playfair)' }}>
            Mapbox token belum siap
          </h3>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Isi `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` di `.env`, lalu restart `npm run dev`.
            Dependency Mapbox sudah terpasang, jadi yang hilang hanya token runtime.
          </p>
          <button
            onClick={async () => {
              useVehicleStore.setState({ loading: true });
              useVehicleStore.getState().actions.setSelectedCity('Semua');
              const result = await VehicleService.seedSampleData(mapRef.current?.getMap());
              if (!result.success) alert(result.message);
              useVehicleStore.setState({ loading: false });
            }}
            style={{
              marginTop: 18,
              padding: '11px 18px',
              borderRadius: 10,
              border: 'none',
              background: 'var(--maroon)',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 700
            }}
          >
            Tambah Data Demo Tanpa Rute Mapbox
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="vehicle-map-card">
      <div className="vehicle-map-shell">
        <MapGL
          ref={mapRef}
          initialViewState={{
            longitude: INDONESIA_CENTER.longitude,
            latitude: INDONESIA_CENTER.latitude,
            zoom: 4.5 // Nationwide view
          }}
          mapStyle="mapbox://styles/mapbox/light-v11"
          mapboxAccessToken={mapboxToken}
          onLoad={onMapLoad}
          onError={onMapError}
          onClick={onMapClick}
          dragRotate={false}
          touchPitch={false}
          style={{ width: '100%', height: '100%' }}
        >
          <NavigationControl position="top-right" showCompass={false} />
          <FullscreenControl position="top-right" />

          {sppgGeoJSON && (
            <Source id="sppg-source" type="geojson" data={sppgGeoJSON}>
              <Layer {...sppgLayerStyle} />
              <Layer {...sppgLabelLayerStyle} />
            </Source>
          )}

          {selectedRouteGeoJSON && (
            <Source id={SELECTED_ROUTE_SOURCE_ID} type="geojson" data={selectedRouteGeoJSON}>
              <Layer {...routeCaseLayerStyle} />
              <Layer {...routeLayerStyle} />
            </Source>
          )}



          {schoolsGeoJSON && (
            <Source id="schools-source" type="geojson" data={schoolsGeoJSON}>
              <Layer {...schoolsLayerStyle} />
              <Layer {...schoolsLabelLayerStyle} />
            </Source>
          )}

          {/* Dedicated Single School Logo for the Active Vehicle's Destination (Pure Schoolhouse Logo, 0% Duplicate) */}
          {activeVehicle &&
            activeVehicle.destination_lng != null &&
            activeVehicle.destination_lat != null && (
            <Marker
              longitude={activeVehicle.destination_lng}
              latitude={activeVehicle.destination_lat}
              anchor="bottom"
            >
              <div 
                className="school-logo-destination" 
                title={activeVehicle.destination_school_name || 'Sekolah Penerima'}
              >
                <span className="school-logo-badge">
                  {activeVehicle.destination_school_name || 'Sekolah Tujuan'}
                </span>
                <div className="school-logo-icon">
                  <svg width="34" height="34" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* School Building Base */}
                    <rect x="5" y="14" width="22" height="15" rx="2" fill="#C62828" stroke="#8B1C3F" strokeWidth="1.5"/>
                    <polygon points="3,14 16,4 29,14" fill="#E53935" stroke="#8B1C3F" strokeWidth="1.5"/>
                    {/* Bell Tower & Flag */}
                    <rect x="14" y="1" width="4" height="4" fill="#F4C662" />
                    <polygon points="14,1 18,3 14,5" fill="#8B1C3F"/>
                    {/* Entrance Door */}
                    <rect x="13" y="20" width="6" height="9" rx="1" fill="#FFFFFF"/>
                    {/* Windows */}
                    <rect x="8" y="17" width="3" height="4" rx="0.5" fill="#FFFFFF" opacity="0.9"/>
                    <rect x="21" y="17" width="3" height="4" rx="0.5" fill="#FFFFFF" opacity="0.9"/>
                    <circle cx="16" cy="10" r="2" fill="#FFFFFF"/>
                  </svg>
                </div>
              </div>
            </Marker>
          )}

          {/* WebGL Fleet is now managed manually via Mapbox API for 100% responsiveness */}
        </MapGL>

        {/* Map Legend Overlay */}
        <div className="map-legend">
          <h4 style={{ margin: '0 0 10px 0', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.6 }}>Keterangan Peta</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '14px', height: '14px', background: '#e8673a', borderRadius: '3px' }} />
              <span style={{ fontSize: '12px', fontWeight: 600 }}>SPPG Hub (Gudang)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '14px', height: '14px', background: '#ff5252', borderRadius: '50%', border: '1px solid #fff' }} />
              <span style={{ fontSize: '12px', fontWeight: 600 }}>Sekolah Penerima</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ position: 'relative', width: '14px', height: '14px', background: '#F4C662', borderRadius: '4px', border: '1px solid #8B1C3F' }}>
                 <div style={{ position: 'absolute', top: '2px', left: '2px', width: '8px', height: '8px', background: '#8B1C3F', borderRadius: '50%' }} />
              </div>
              <span style={{ fontSize: '12px', fontWeight: 600 }}>Armada (Dalam Perjalanan)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ position: 'relative', width: '14px', height: '14px', background: '#F4C662', borderRadius: '4px', border: '1px solid #8B1C3F' }}>
                 <div style={{ position: 'absolute', top: '2px', left: '2px', width: '8px', height: '8px', background: '#2e7d32', borderRadius: '50%' }} />
              </div>
              <span style={{ fontSize: '12px', fontWeight: 600 }}>Armada (Bongkar Muat)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ position: 'relative', width: '14px', height: '14px', background: '#F4C662', borderRadius: '4px', border: '1px solid #8B1C3F' }}>
                 <div style={{ position: 'absolute', top: '2px', left: '2px', width: '8px', height: '8px', background: '#fd7e14', borderRadius: '50%' }} />
              </div>
              <span style={{ fontSize: '12px', fontWeight: 600 }}>Armada (Tertunda)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ position: 'relative', width: '14px', height: '14px', background: '#F4C662', borderRadius: '4px', border: '1px solid #8B1C3F' }}>
                 <div style={{ position: 'absolute', top: '2px', left: '2px', width: '8px', height: '8px', background: '#e83e8c', borderRadius: '50%' }} />
              </div>
              <span style={{ fontSize: '12px', fontWeight: 600 }}>Armada (Kritis/Off Route)</span>
            </div>
          </div>
        </div>

        {(() => {
          if (!activeVehicle) return null;
          
          return (
            <SelectedVehiclePanel
              vehicle={activeVehicle}
              onClose={() => {
                setPopupInfo(null);
                onVehicleSelect?.(null);
              }}
            />
          );
        })()}

        {mapStatus === 'loading' && (
          <div className="map-state-overlay">
            <div className="map-spinner" />
            <p>Memuat peta Mapbox...</p>
          </div>
        )}

        {mapStatus === 'error' && (
          <div className="map-state-overlay map-state-error">
            <AlertTriangle size={34} />
            <h3>Peta gagal dimuat</h3>
            <p>{mapError || 'Periksa koneksi internet, token Mapbox, atau style peta.'}</p>
          </div>
        )}

      </div>

      {/* Map controls are outside the canvas area so they never cover loading/error states. */}
      <div className="vehicle-map-toolbar">
        {/* Main Actions */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={toggleSimulation}
            disabled={vehicles.length === 0 && !simulationActive || isSeedingDemo || isClearingFleet}
            style={{ 
              padding: '12px 24px', 
              fontSize: '12px', 
              borderRadius: '16px', 
              border: 'none', 
              cursor: vehicles.length === 0 && !simulationActive || isSeedingDemo || isClearingFleet ? 'not-allowed' : 'pointer', 
              opacity: vehicles.length === 0 && !simulationActive || isSeedingDemo || isClearingFleet ? 0.55 : 1,
              fontWeight: 800, 
              background: simulationActive ? 'var(--gold)' : 'var(--maroon)',
              color: simulationActive ? 'var(--text)' : 'var(--white)',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              boxShadow: simulationActive ? '0 8px 20px rgba(244, 198, 98, 0.3)' : '0 8px 20px rgba(139, 28, 63, 0.2)'
            }}
          >
            {simulationActive ? <Zap size={16} fill="currentColor" /> : <Zap size={16} />}
            {simulationActive ? 'Hentikan Monitoring' : 'Mulai Simulasi'}
          </button>
          
          <button
            onClick={async () => {
              if (vehicles.length > 0 || isSeedingDemo || isClearingFleet) return;
              
              setIsSeedingDemo(true);
              vehicleStatesRef.current.clear();
              const vehicleActions = useVehicleStore.getState().actions;
              vehicleActions.invalidatePendingLoads();
              useVehicleStore.setState({ loading: true, error: null });
              setSelectedCity('Semua');

              try {
                const result = await VehicleService.seedSampleData(mapRef.current?.getMap());
                if (!result.success) {
                  alert(result.message);
                  return;
                }

                setHasDemoData(true);
                void queryClient.invalidateQueries({ queryKey: queryKeys.infrastructure });
                // Optimistic vehicles are already in Zustand; the service will
                // swap temporary IDs for confirmed Supabase records in place.
                vehicleStatesRef.current.clear();
              } catch (error: any) {
                alert(error?.message || 'Gagal menyiapkan armada demo.');
              } finally {
                useVehicleStore.setState({ loading: false });
                setIsSeedingDemo(false);
              }
            }}
            disabled={vehicles.length > 0 || isSeedingDemo || isClearingFleet}
            style={{ 
              padding: '12px 24px', 
              fontSize: '12px', 
              borderRadius: '16px', 
              background: vehicles.length > 0 ? 'rgba(139, 28, 63, 0.05)' : 'transparent', 
              color: vehicles.length > 0 ? '#1b5e20' : 'var(--maroon)',
              border: vehicles.length > 0 ? '2px solid #1b5e20' : '2px solid var(--maroon)',
              cursor: vehicles.length > 0 || isSeedingDemo || isClearingFleet ? 'default' : 'pointer', 
              fontWeight: 800,
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              opacity: vehicles.length > 0 || isSeedingDemo || isClearingFleet ? 0.8 : 1
            }}
          >
            {isSeedingDemo ? (
              <><div className="map-spinner" style={{ width: 14, height: 14 }} /> Menyiapkan armada...</>
            ) : vehicles.length > 0 ? (
              <>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#1b5e20' }} />
                Data Nasional Aktif
              </>
            ) : (
              'Demo Unit'
            )}
          </button>
        </div>

        {/* Divider */}
        <div style={{ height: '32px', width: '2px', background: 'rgba(139, 28, 63, 0.1)' }} />

        {/* Tools & Stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button
            disabled={isClearingFleet || isSeedingDemo}
            onClick={async () => {
              if (isClearingFleet || isSeedingDemo || !window.confirm('Bersihkan armada?')) return;
              setIsClearingFleet(true);
              try {
                // 1. Stop simulation locally
                setSimulationActive(false);
                VehicleService.stopSimulation();
                
                // 2. Clear local store and selection
                useVehicleStore.setState({ vehicles: [] });
                setPopupInfo(null); // Clear local map popup
                onVehicleSelect?.(null); // Clear parent page selection
                
                // 3. FORCE CLEAR MAP (Instant Visual Update)
                const map = mapRef.current?.getMap();
                if (map && map.getSource('fleet-source')) {
                  (map.getSource('fleet-source') as any).setData({ type: 'FeatureCollection', features: [] });
                }

                // 4. Clear internal animation memory
                vehicleStatesRef.current.clear();
                
                // 5. Clear database
                const clearResult = await VehicleService.clearDemoData();
                if (clearResult.success) {
                  setHasDemoData(false);
                  useVehicleStore.setState({ vehicles: [], hasDemoData: false, error: null });
                  void queryClient.invalidateQueries({ queryKey: queryKeys.infrastructure });
                } else {
                  alert(`Gagal membersihkan data: ${clearResult.message}`);
                  // Pulihkan state lokal jika pembersihan DB gagal
                  const restored = await useVehicleStore.getState().actions.loadVehicles();
                  setHasDemoData(restored.length > 0);
                }
              } finally {
                setIsClearingFleet(false);
              }
            }}
            style={{ 
              width: '44px',
              height: '44px',
              borderRadius: '14px', 
              background: 'var(--cream)', 
              color: 'var(--maroon)',
              border: '1px solid rgba(139, 28, 63, 0.1)',
              cursor: isClearingFleet || isSeedingDemo ? 'wait' : 'pointer', 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              transition: 'all 0.2s'
            }}
          >
            <Trash2 size={18} />
          </button>
          
          <div style={{ textAlign: 'left', minWidth: '80px' }}>
            <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--maroon)', lineHeight: 1 }}>
              {filteredVehicles.length}
            </div>
            <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Unit Aktif
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .vehicle-map-card {
          width: 100%;
          background: #fff;
          border: 1px solid rgba(139, 28, 63, 0.08);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 10px 28px rgba(44, 24, 16, 0.08);
        }

        .vehicle-map-shell {
          position: relative;
          width: 100%;
          height: 600px;
          min-height: 520px;
          background: #f4efe8;
          overflow: hidden;
        }

        .map-state-overlay {
          position: absolute;
          inset: 0;
          z-index: 5;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 32px;
          color: var(--text-muted);
          text-align: center;
          background: rgba(255, 251, 245, 0.88);
          backdrop-filter: blur(4px);
        }

        .map-state-overlay p {
          margin: 0;
          font-size: 14px;
          line-height: 1.6;
        }

        .map-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid rgba(139, 28, 63, 0.16);
          border-top-color: var(--maroon);
          border-radius: 50%;
          animation: mapSpin .8s linear infinite;
        }

        @keyframes mapSpin {
          to { transform: rotate(360deg); }
        }

        .map-state-error {
          color: #721c24;
          background: #fff8f6;
        }

        .map-state-error h3 {
          margin: 0;
          color: var(--maroon);
          font-family: var(--font-playfair);
          font-size: 22px;
        }

        .vehicle-map-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          padding: 14px 16px;
          border-top: 1px solid rgba(139, 28, 63, 0.08);
          background: rgba(255, 255, 255, 0.98);
        }

        .school-logo-destination {
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          filter: drop-shadow(0 4px 10px rgba(139, 28, 63, 0.45));
          animation: schoolFloat 2.5s infinite ease-in-out;
          pointer-events: auto;
          user-select: none;
        }

        @keyframes schoolFloat {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
          }
        }

        .school-logo-badge {
          background: #8B1C3F;
          color: #FFFFFF;
          font-size: 11px;
          font-weight: 800;
          padding: 3px 10px;
          border-radius: 12px;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.28);
          margin-bottom: 3px;
          letter-spacing: 0.2px;
          border: 1px solid rgba(255, 255, 255, 0.4);
        }

        .school-logo-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 0;
        }

        @media (max-width: 760px) {
          .vehicle-map-shell {
            height: 430px;
            min-height: 430px;
          }

          .vehicle-map-toolbar,
          .vehicle-map-toolbar > div {
            align-items: stretch !important;
            flex-direction: column !important;
            width: 100%;
          }

          .vehicle-map-toolbar button {
            width: 100% !important;
          }

          .vehicle-map-toolbar [style*="width: 2px"] {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}


function SelectedVehiclePanel({ vehicle, onClose }: { vehicle: Vehicle; onClose: () => void }) {
  const statusMeta = VEHICLE_STATUS_META[vehicle.status];
  const updatedTime = vehicle.updated_at
    ? new Date(vehicle.updated_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    : '-';

  return (
    <div className="selected-vehicle-panel">
      <div className="panel-header">
        <div>
          <span className="panel-eyebrow">Unit dipilih</span>
          <h3>{vehicle.license_plate}</h3>
        </div>
        <button onClick={onClose} aria-label="Tutup detail kendaraan">
          <X size={17} />
        </button>
      </div>

      <div className="status-row">
        <span className="status-dot" style={{ background: statusMeta.color }} />
        <strong>{statusMeta.label}</strong>
      </div>

      <div className="panel-facts">
        <div>
          <User size={15} />
          <span>{vehicle.driver_name || 'Driver belum diisi'}</span>
        </div>
        <div>
          <MapPin size={15} />
          <span>{vehicle.city || 'Wilayah belum diisi'}</span>
        </div>
        <div>
          <School size={15} />
          <span>{vehicle.destination_school_name || 'Sekolah tujuan belum diisi'}</span>
        </div>
        <div>
          <Navigation size={15} />
          <span>Diperbarui {updatedTime}</span>
        </div>
      </div>

      <style jsx>{`
        .selected-vehicle-panel {
          position: absolute;
          left: 18px;
          top: 18px;
          z-index: 6;
          width: min(300px, calc(100% - 36px));
          padding: 16px;
          border-radius: 14px;
          background: rgba(255, 255, 255, .96);
          border: 1px solid rgba(139, 28, 63, .12);
          box-shadow: 0 16px 36px rgba(44, 24, 16, .16);
          backdrop-filter: blur(10px);
        }

        .panel-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 14px;
        }

        .panel-eyebrow {
          display: block;
          margin-bottom: 3px;
          color: var(--text-muted);
          font-size: 11px;
          font-weight: 900;
          letter-spacing: .06em;
          text-transform: uppercase;
        }

        h3 {
          margin: 0;
          color: var(--maroon);
          font-size: 19px;
          line-height: 1.2;
        }

        button {
          width: 32px;
          height: 32px;
          border: 0;
          border-radius: 8px;
          background: rgba(139,28,63,.08);
          color: var(--maroon);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .status-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 12px 0;
          padding: 9px 10px;
          border-radius: 10px;
          background: var(--cream);
          color: var(--text);
          font-size: 13px;
        }

        .status-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          box-shadow: 0 0 0 3px rgba(139,28,63,.08);
        }

        .panel-facts {
          display: grid;
          gap: 9px;
        }

        .panel-facts div {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          color: var(--text-muted);
          font-size: 12px;
          line-height: 1.45;
        }

        .panel-facts svg {
          color: var(--maroon);
          flex-shrink: 0;
          margin-top: 1px;
        }
        .map-legend {
          position: absolute;
          bottom: 24px;
          right: 24px;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(12px);
          padding: 16px;
          border-radius: 16px;
          border: 1px solid rgba(139, 28, 63, 0.1);
          box-shadow: 0 8px 32px rgba(139, 28, 63, 0.12);
          z-index: 10;
          min-width: 180px;
        }

        @media (max-width: 768px) {
          .map-legend { 
            bottom: 80px; 
            right: 12px;
            padding: 12px;
            min-width: 150px;
          }
        }
      `}</style>
    </div>
  );
}
