import { describe, it, expect, vi, beforeEach } from 'vitest';
import VehicleService from '@/js/services/VehicleService';
import { useVehicleStore, Vehicle } from '@/js/store/vehicleStore';
import { supabase } from '@/js/core/SupabaseClient';

describe('VehicleService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
    useVehicleStore.setState({ vehicles: [] });
  });

  describe('fetchMapboxRoute', () => {
    it('should return null if MAPBOX_ACCESS_TOKEN is missing', async () => {
      const originalToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
      delete process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

      const route = await VehicleService.fetchMapboxRoute([106.8, -6.2], [106.9, -6.3]);
      expect(route).toBeNull();

      process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN = originalToken;
    });

    it('should return coordinates array on successful API call', async () => {
      process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN = 'mock-token';
      const mockCoords = [[106.8, -6.2], [106.85, -6.25], [106.9, -6.3]];
      
      const mockResponse = {
        ok: true,
        json: async () => ({
          routes: [{
            geometry: {
              coordinates: mockCoords
            }
          }]
        })
      };
      
      (global.fetch as any).mockResolvedValue(mockResponse);

      const route = await VehicleService.fetchMapboxRoute([106.8, -6.2], [106.9, -6.3]);
      
      expect(global.fetch).toHaveBeenCalledTimes(1);
      const urlCall = (global.fetch as any).mock.calls[0][0];
      expect(urlCall).toContain('api.mapbox.com/directions');
      expect(urlCall).toContain('mock-token');
      expect(route).toEqual(mockCoords);
    });

    it('should return null and log error if fetch fails', async () => {
      process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN = 'mock-token';
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const mockResponse = {
        ok: false,
        status: 403
      };
      
      (global.fetch as any).mockResolvedValue(mockResponse);

      const route = await VehicleService.fetchMapboxRoute([106.8, -6.2], [106.9, -6.3]);
      
      expect(route).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('[MAPBOX ROUTE FETCH ERROR]', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('updateVehicleRoute', () => {
    it('should update route_geometry in Zustand store and queue to pendingUpdates', async () => {
      const mockVehicle: Vehicle = {
        id: 'v123',
        license_plate: 'B 1234 BGN',
        driver_name: 'Andi',
        status: 'en_route',
        last_lat: -6.2,
        last_lng: 106.8,
        route_progress: 5,
        updated_at: new Date().toISOString()
      };
      
      useVehicleStore.setState({ vehicles: [mockVehicle] });
      
      const newRoute = [[106.8, -6.2], [106.9, -6.3]];
      await VehicleService.updateVehicleRoute('v123', newRoute);

      // Verify Zustand store is updated
      const updatedVehicle = useVehicleStore.getState().vehicles[0];
      expect(updatedVehicle.route_geometry).toEqual(newRoute);
      expect(updatedVehicle.route_progress).toBe(0);

      // Verify it was queued to pendingUpdates buffer instead of direct Supabase call
      const pendingUpdatesMap = (VehicleService as any).pendingUpdates;
      expect(pendingUpdatesMap.has('v123')).toBe(true);
      expect(pendingUpdatesMap.get('v123').route_geometry).toEqual(newRoute);
      expect(pendingUpdatesMap.get('v123').route_progress).toBe(0);
    });

    it('should merge consecutive updates in pendingUpdates instead of overwriting them', async () => {
      // 1. Queue a route update first
      const route = [[106.8, -6.2], [106.9, -6.3]];
      await VehicleService.updateVehicleRoute('v999', route);

      // 2. Queue a simulation step update afterwards
      const stepUpdate = {
        last_lat: -6.25,
        last_lng: 106.85,
        status: 'en_route',
        route_progress: 1
      };
      (VehicleService as any).queueUpdate('v999', stepUpdate);

      // 3. Verify the final value contains both route_geometry AND last_lat
      const pendingUpdatesMap = (VehicleService as any).pendingUpdates;
      expect(pendingUpdatesMap.has('v999')).toBe(true);
      
      const merged = pendingUpdatesMap.get('v999');
      expect(merged.route_geometry).toEqual(route);
      expect(merged.last_lat).toBe(-6.25);
      expect(merged.last_lng).toBe(106.85);
      expect(merged.route_progress).toBe(1);
    });
  });

  describe('clearDemoData', () => {
    it('should successfully clear data when supabase deletes succeed', async () => {
      const mockDelete = vi.fn().mockReturnThis();
      const mockNeq = vi.fn().mockResolvedValue({ error: null });
      
      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        delete: mockDelete,
        neq: mockNeq
      });

      const res = await VehicleService.clearDemoData();
      
      expect(res.success).toBe(true);
      expect(res.message).toContain('berhasil dihapus secara permanen');
      expect(supabase.from).toHaveBeenCalledWith('vehicles');
      expect(supabase.from).toHaveBeenCalledWith('sppg_units');
    });

    it('should fail and return success: false when vehicles delete fails', async () => {
      const mockDelete = vi.fn().mockReturnThis();
      const mockNeq = vi.fn()
        .mockResolvedValueOnce({ error: { message: 'Vehicles Delete Failed' } })
        .mockResolvedValue({ error: null });
      
      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        delete: mockDelete,
        neq: mockNeq
      });

      const res = await VehicleService.clearDemoData();
      
      expect(res.success).toBe(false);
      expect(res.message).toContain('Vehicles Delete Failed');
    });

    it('should fail and return success: false when sppg_units delete fails', async () => {
      const mockDelete = vi.fn().mockReturnThis();
      const mockNeq = vi.fn()
        .mockResolvedValueOnce({ error: null }) // first call for vehicles succeeds
        .mockResolvedValueOnce({ error: { message: 'SPPG Delete Failed' } }); // second for sppg_units fails
      
      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        delete: mockDelete,
        neq: mockNeq
      });

      const res = await VehicleService.clearDemoData();
      
      expect(res.success).toBe(false);
      expect(res.message).toContain('SPPG Delete Failed');
    });
  });
});
