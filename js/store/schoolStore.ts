import { create } from 'zustand';
import { supabase } from '../core/SupabaseClient';
import { School } from '../types';

interface SchoolState {
  schoolsByProvince: Record<string, School[]>;
  provinces: string[];
  isPrefetched: boolean;
  isLoading: boolean;
  
  // Actions
  getSchoolsByProvince: (province?: string) => Promise<School[]>;
  getProvinces: () => Promise<string[]>;
  prefetch: () => Promise<void>;
  _fetchAndCache: (province: string) => Promise<School[]>;
}

export const useSchoolStore = create<SchoolState>((set, get) => ({
  schoolsByProvince: {},
  provinces: ['Semua'],
  isPrefetched: false,
  isLoading: false,

  getSchoolsByProvince: async (province = 'Semua') => {
    const { schoolsByProvince } = get();
    
    // Return cache if available for instant load
    if (schoolsByProvince[province]) {
      // Trigger background refresh silently
      get()._fetchAndCache(province);
      return schoolsByProvince[province];
    }

    return await get()._fetchAndCache(province);
  },

  _fetchAndCache: async (province: string) => {
    set({ isLoading: true });
    try {
      let query = supabase.from('schools').select('*').order('name', { ascending: true });
      
      if (province && province !== 'Semua') {
        query = query.eq('province', province);
      }

      const { data, error } = await query;
      if (error) throw error;

      const schools = data as School[];
      set((state) => ({
        schoolsByProvince: {
          ...state.schoolsByProvince,
          [province]: schools
        }
      }));
      return schools;
    } catch (err) {
      console.error(`Error fetching schools for ${province}:`, err);
      return get().schoolsByProvince[province] || [];
    } finally {
      set({ isLoading: false });
    }
  },

  getProvinces: async () => {
    const { provinces } = get();
    if (provinces.length > 1) return provinces; // Already cached (beyond 'Semua')

    try {
      const { data, error } = await supabase.from('schools').select('province');
      if (error || !data) return ['Semua'];

      const uniqueProvinces = [...new Set(data.map(s => s.province))];
      const result = ['Semua', ...uniqueProvinces.sort()];
      
      set({ provinces: result });
      return result;
    } catch (err) {
      console.error('Error fetching provinces:', err);
      return ['Semua'];
    }
  },

  prefetch: async () => {
    if (get().isPrefetched) return;
    set({ isPrefetched: true });
    
    console.log("SchoolStore: Starting background prefetch...");
    await Promise.all([
      get().getSchoolsByProvince('Semua'),
      get().getProvinces()
    ]);
  }
}));
