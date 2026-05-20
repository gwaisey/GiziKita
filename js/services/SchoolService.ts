import { useSchoolStore } from '../store/schoolStore';
import { School } from '../types';
import { supabase } from '../core/SupabaseClient';

class SchoolService {
  async getSchoolsByProvince(province: string = 'Semua'): Promise<School[]> {
    return await useSchoolStore.getState().getSchoolsByProvince(province);
  }

  async prefetch(): Promise<void> {
    await useSchoolStore.getState().prefetch();
  }

  async getProvinces(): Promise<string[]> {
    return await useSchoolStore.getState().getProvinces();
  }

  get isLoading(): boolean {
    return useSchoolStore.getState().isLoading;
  }

  async registerSchool(data: { name: string; npsn: string; address: string; pupils: number; level: string; file?: File }): Promise<{ success: boolean; message?: string }> {
    try {
      // In a real app, we would upload the file to Supabase Storage first
      // For now, we'll insert the school data
      const { error } = await supabase.from('schools').insert([{
        name: data.name,
        npsn: data.npsn,
        address: data.address,
        city: 'Menunggu Verifikasi', // Default until admin sets it
        province: 'Menunggu Verifikasi',
        pupils: data.pupils,
        status: 'Pendaftaran Baru',
        level: data.level
      }]);

      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      console.error('Error registering school:', err);
      return { success: false, message: err.message };
    }
  }
}

export default new SchoolService();
