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

  async registerSchool(data: { name: string; npsn: string; address: string; province: string; city: string; pupils: number; level: string; file?: File }): Promise<{ success: boolean; message?: string }> {
    try {
      const { province, city } = data;

      // Siapkan data sesuai kolom yang benar-benar ada di tabel database schools
      // (name, province, city, pupils, status)
      const dbPayload = {
        name: data.name,
        province,
        city,
        pupils: data.pupils,
        status: 'Pendaftaran Baru'
      };

      // 3. Coba simpan ke Supabase dengan batas timeout 5 detik agar UI tidak macet/ngeload selamanya
      try {
        const insertPromise = supabase.from('schools').insert([dbPayload]).select();
        const timeoutPromise = new Promise<{ error: any }>((_, reject) => 
          setTimeout(() => reject(new Error('TIMEOUT')), 5000)
        );

        const res: any = await Promise.race([insertPromise, timeoutPromise]);
        if (res?.error) {
          console.warn('Supabase schools insert note:', res.error.message || res.error);
        }
      } catch (err: any) {
        console.warn('Supabase schools insert skipped/timed out:', err?.message || err);
      }

      // 4. Buat objek data sekolah pendaftaran baru
      const newSchool: School = {
        id: String(Date.now()),
        name: data.name,
        npsn: data.npsn,
        address: data.address,
        province,
        city,
        pupils: data.pupils,
        level: data.level,
        status: 'Pendaftaran Baru',
        target_portions: data.pupils,
        lat: null,
        lng: null
      };

      // 5. Simpan ke localStorage agar tidak hilang saat reload
      if (typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem('gizikita_registered_schools');
          const existing: School[] = raw ? JSON.parse(raw) : [];
          const updated = [newSchool, ...existing.filter((s: School) => s.name !== newSchool.name)];
          localStorage.setItem('gizikita_registered_schools', JSON.stringify(updated));
        } catch (storageErr) {
          console.warn('Could not save to localStorage:', storageErr);
        }
      }

      // 6. Perbarui in-memory Zustand store agar langsung muncul di halaman daftar sekolah
      useSchoolStore.setState((state) => {
        const currentAll = state.schoolsByProvince['Semua'] || [];
        const currentProv = state.schoolsByProvince[province] || [];
        return {
          schoolsByProvince: {
            ...state.schoolsByProvince,
            ['Semua']: [newSchool, ...currentAll.filter((s: School) => s.name !== newSchool.name)],
            [province]: [newSchool, ...currentProv.filter((s: School) => s.name !== newSchool.name)]
          }
        };
      });

      return { success: true };
    } catch (err: any) {
      console.error('Error registering school:', err);
      return { success: false, message: err?.message || 'Gagal memproses pendaftaran sekolah.' };
    }
  }
}

export default new SchoolService();
