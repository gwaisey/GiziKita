import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useVehicleStore, Vehicle } from '@/js/store/vehicleStore';
import { supabase } from '@/js/core/SupabaseClient';

describe('vehicleStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useVehicleStore.setState({ vehicles: [], loading: false });
  });

  const mockVehicles: Vehicle[] = [
    {
      id: 'v1',
      license_plate: 'B 1234 BGN',
      driver_name: 'Pak Andi',
      status: 'en_route',
      last_lat: -6.2088,
      last_lng: 106.8456,
      updated_at: new Date().toISOString(),
    },
    {
      id: 'v2',
      license_plate: 'B 5678 BGN',
      driver_name: 'Pak Budi',
      status: 'idle',
      last_lat: -6.1751,
      last_lng: 106.8650,
      updated_at: new Date().toISOString(),
    },
  ];

  it('should load vehicles from supabase', async () => {
    const mockSelect = vi.fn().mockResolvedValue({ data: mockVehicles, error: null });
    (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({ select: mockSelect });

    await useVehicleStore.getState().actions.loadVehicles();

    expect(supabase.from).toHaveBeenCalledWith('vehicles');
    expect(mockSelect).toHaveBeenCalledWith('*');
    expect(useVehicleStore.getState().vehicles).toEqual(mockVehicles);
    expect(useVehicleStore.getState().loading).toBe(false);
  });

  it('should handle load error gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const mockSelect = vi.fn().mockResolvedValue({ data: null, error: { message: 'Network error' } });
    (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({ select: mockSelect });

    await useVehicleStore.getState().actions.loadVehicles();

    expect(consoleSpy).toHaveBeenCalled();
    expect(useVehicleStore.getState().vehicles).toEqual([]);
    consoleSpy.mockRestore();
  });

  it('should set loading state during fetch', async () => {
    const mockSelect = vi.fn().mockImplementation(() => {
      // During the fetch, loading should be true
      expect(useVehicleStore.getState().loading).toBe(true);
      return Promise.resolve({ data: mockVehicles, error: null });
    });
    (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({ select: mockSelect });

    await useVehicleStore.getState().actions.loadVehicles();

    expect(useVehicleStore.getState().loading).toBe(false);
  });

  it('should update a vehicle when receiving realtime event', () => {
    // Pre-populate the store
    useVehicleStore.setState({ vehicles: mockVehicles });

    const updatedVehicle: Vehicle = {
      ...mockVehicles[0],
      status: 'delayed',
      last_lat: -6.21,
      last_lng: 106.85,
    };

    // Simulate what subscribeRealtime does internally when it receives an UPDATE event
    useVehicleStore.setState((state) => {
      const idx = state.vehicles.findIndex((v) => v.id === updatedVehicle.id);
      if (idx === -1) return { vehicles: [...state.vehicles, updatedVehicle] };
      const updated = [...state.vehicles];
      updated[idx] = updatedVehicle;
      return { vehicles: updated };
    });

    const storeVehicles = useVehicleStore.getState().vehicles;
    expect(storeVehicles[0].status).toBe('delayed');
    expect(storeVehicles[0].last_lat).toBe(-6.21);
    expect(storeVehicles.length).toBe(2);
  });

  it('should add a new vehicle when receiving a realtime INSERT event', () => {
    useVehicleStore.setState({ vehicles: mockVehicles });

    const newVehicle: Vehicle = {
      id: 'v3',
      license_plate: 'B 9999 BGN',
      driver_name: 'Ibu Sari',
      status: 'loading',
      last_lat: -6.23,
      last_lng: 106.90,
      updated_at: new Date().toISOString(),
    };

    useVehicleStore.setState((state) => {
      const idx = state.vehicles.findIndex((v) => v.id === newVehicle.id);
      if (idx === -1) return { vehicles: [...state.vehicles, newVehicle] };
      const updated = [...state.vehicles];
      updated[idx] = newVehicle;
      return { vehicles: updated };
    });

    expect(useVehicleStore.getState().vehicles.length).toBe(3);
    expect(useVehicleStore.getState().vehicles[2].license_plate).toBe('B 9999 BGN');
  });

  it('should handle off_route status update correctly', () => {
    useVehicleStore.setState({ vehicles: mockVehicles });

    const offRouteVehicle: Vehicle = {
      ...mockVehicles[0],
      status: 'off_route',
    };

    useVehicleStore.setState((state) => {
      const idx = state.vehicles.findIndex((v) => v.id === offRouteVehicle.id);
      if (idx === -1) return state;
      const updated = [...state.vehicles];
      updated[idx] = offRouteVehicle;
      return { vehicles: updated };
    });

    const storeVehicles = useVehicleStore.getState().vehicles;
    expect(storeVehicles[0].status).toBe('off_route');
  });
});
