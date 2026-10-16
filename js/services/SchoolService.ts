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
        id: Date.now(),
        name: data.name,
        province,
        city,
        pupils: data.pupils,
        status: 'Pendaftaran Baru',
        created_at: new Date().toISOString()
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

  private extractLocation(address: string): { province: string; city: string } {
    const knownProvinces = [
      'Aceh', 'Sumatera Utara', 'Sumatera Barat', 'Riau', 'Jambi', 'Sumatera Selatan', 'Bengkulu', 'Lampung',
      'Kepulauan Bangka Belitung', 'Kepulauan Riau', 'DKI Jakarta', 'Jawa Barat', 'Jawa Tengah', 'DI Yogyakarta',
      'Jawa Timur', 'Banten', 'Bali', 'Nusa Tenggara Barat', 'Nusa Tenggara Timur', 'Kalimantan Barat',
      'Kalimantan Tengah', 'Kalimantan Selatan', 'Kalimantan Timur', 'Kalimantan Utara', 'Sulawesi Utara',
      'Sulawesi Tengah', 'Sulawesi Selatan', 'Sulawesi Tenggara', 'Gorontalo', 'Sulawesi Barat', 'Maluku',
      'Maluku Utara', 'Papua Barat', 'Papua'
    ];
    
    let province = 'Jawa Tengah';
    for (const p of knownProvinces) {
      if (address.toLowerCase().includes(p.toLowerCase())) {
        province = p;
        break;
      }
    }

    let city = 'Kota Semarang';
    const cityMatch = address.match(/(Kota\s+[A-Za-z]+|Kab(?:upaten)?\.?\s+[A-Za-z]+)/i);
    if (cityMatch) {
      city = cityMatch[1];
    } else {
      const parts = address.split(',').map(s => s.trim());
      for (const part of parts) {
        if (/semarang|bandung|jakarta|surabaya|yogyakarta|solo|surakarta|sukabumi|bogor|malang/i.test(part)) {
          city = part;
          break;
        }
      }
    }

    return { province, city };
  }
}

export default new SchoolService();
