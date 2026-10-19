import { useAuthStore } from '../store/authStore';
import { UserProfile, UserRole } from '../types';
import { supabase } from '../core/SupabaseClient';
import AuditService from './AuditService';
import NotificationService from './NotificationService';

interface AuthResult {
  success: boolean;
  message?: string;
  user?: UserProfile;
  needsEmailConfirmation?: boolean;
  redirectTo?: string;
}

class AuthService {
  private getFriendlyAuthError(error: any): string {
    const message = String(error?.message || '').toLowerCase();
    const code = String(error?.code || '').toLowerCase();
    const status = error?.status;

    if (status === 429 || message.includes('rate limit') || code.includes('rate')) {
      return 'Terlalu banyak email konfirmasi terkirim. Mohon tunggu beberapa saat sebelum mencoba lagi. Untuk testing, admin dapat menonaktifkan sementara Confirm Email di Supabase Auth.';
    }

    if (message.includes('already registered') || message.includes('already exists') || message.includes('user already')) {
      return 'Email ini sudah terdaftar. Silakan login atau gunakan email lain.';
    }

    if (message.includes('invalid email') || message.includes('email address')) {
      return 'Alamat email tidak valid. Periksa kembali email yang Anda masukkan.';
    }

    if (message.includes('password')) {
      return 'Password belum memenuhi ketentuan. Gunakan minimal 6 karakter.';
    }

    return error?.message || 'Gagal mendaftar. Silakan coba lagi.';
  }

  /**
   * Initialize Auth State
   */
  async init(): Promise<void> {
    await useAuthStore.getState().init();
  }

  get currentUser(): UserProfile | null {
    return useAuthStore.getState().currentUser;
  }

  get sessionUser() {
    return useAuthStore.getState().sessionUser;
  }

  isAuthenticated(): boolean {
    return useAuthStore.getState().currentUser !== null;
  }

  getPostAuthRedirect(user?: UserProfile | null): string {
    if (!user) return '/';
    if (user.role === 'admin_pusat') return '/profil';
    if (user.role === 'admin_sekolah') return user.isApproved ? '/sekolah' : '/profil';
    return '/';
  }

  async login(username: string, password: string): Promise<AuthResult> {
    if (!username || !password) {
      return { success: false, message: 'Username dan password wajib diisi.' };
    }

    const email = username.includes('@') ? username : `${username.toLowerCase()}@gizikita.id`;
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) return { success: false, message: 'Email atau password salah.' };

    await useAuthStore.getState().fetchProfile(data.user.id);
    const user = useAuthStore.getState().currentUser;
    
    // Log login action
    AuditService.log({ action: 'LOGIN', new_data: { username, role: user?.role } });
    
    return { success: true, user: user || undefined, redirectTo: this.getPostAuthRedirect(user) };
  }

  async signup(name: string, username: string, email: string, instansi: string, password: string, role: UserRole = 'user_umum', verificationCode: string = '', schoolData?: { province: string; city: string; students: number }): Promise<AuthResult> {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedUsername = username.trim().toLowerCase() || 
        (name.trim() 
          ? name.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
          : normalizedEmail.split('@')[0].replace(/[^a-z0-9_]/g, ''));

      if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        return { success: false, message: 'Alamat email tidak valid.' };
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: { full_name: name, username: normalizedUsername, instansi, role }
        }
      });

      if (authError) {
        return { success: false, message: this.getFriendlyAuthError(authError) };
      }
      if (!authData.user) throw new Error("Gagal membuat akun.");
      if (Array.isArray(authData.user.identities) && authData.user.identities.length === 0) {
        return { success: false, message: 'Email ini sudah terdaftar. Silakan login atau gunakan email lain.' };
      }

      let schoolId: string | null = null;
      if (role === 'admin_sekolah' && schoolData?.province && schoolData?.city && schoolData?.students) {
        // Create school entry in schools table
        try {
          const { data: schoolData_result, error: schoolError } = await supabase
            .from('schools')
            .insert([{
              name: instansi,
              province: schoolData.province,
              city: schoolData.city,
              pupils: schoolData.students,
              address: 'Alamat akan diisi kemudian',
              level: 'Sekolah Dasar',
              status: 'Pendaftaran Baru',
              target_portions: schoolData.students // Default: 1 porsi per siswa
            }])
            .select('id')
            .single();

          if (!schoolError && schoolData_result) {
            schoolId = schoolData_result.id;
          } else {
            console.warn('School creation result:', schoolError?.message);
          }
        } catch (err) {
          console.warn('Error creating school:', err);
        }
      }
      if (role === 'admin_sekolah' && verificationCode === 'GIZIKITA2025') {
        if (!schoolId) {
          schoolId = '1'; 
        }
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert([{
          id: authData.user.id,
          full_name: name,
          username: normalizedUsername,
          role: role,
          school_id: schoolId ? (isNaN(Number(schoolId)) ? schoolId : Number(schoolId)) : null
        }], { onConflict: 'id' });

      if (profileError) {
        if (authData.session) throw profileError;
        console.warn('Profile will be completed after email confirmation/login:', profileError.message);
      }
      
      // Ensure profile exists with correct role (fallback mechanism)
      const profileEnsured = await this.ensureProfileExists(authData.user.id, role);
      if (!profileEnsured) {
        console.warn('Could not ensure profile exists, proceeding anyway');
      }
      
      // If a school admin registers, notify Admin Pusat
      if (role === 'admin_sekolah' && (!profileError || profileEnsured)) {
        await NotificationService.notifyAdminPusat(
          'Pendaftaran Sekolah Baru',
          `Instansi ${name} baru saja mendaftar. Segera verifikasi akun mereka.`,
          '/profil',
          'info'
        );
      }

      await useAuthStore.getState().fetchProfile(authData.user.id);
      const user = useAuthStore.getState().currentUser;

      if (!authData.session) {
        return {
          success: true,
          needsEmailConfirmation: true,
          message: 'Pendaftaran berhasil. Silakan cek email untuk konfirmasi akun, lalu login.',
          redirectTo: '/login'
        };
      }

      return { success: true, user: user || undefined, redirectTo: this.getPostAuthRedirect(user) };
    } catch (err: any) {
      return { success: false, message: this.getFriendlyAuthError(err) };
    }
  }

  async logout(): Promise<void> {
    await useAuthStore.getState().logout();
  }

  /**
   * Ensures a profile exists with the correct role
   * This is useful for fixing existing profiles or verifying newly created ones
   */
  async ensureProfileExists(userId: string, role: UserRole = 'user_umum'): Promise<boolean> {
    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', userId)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      if (!data) {
        // Profile doesn't exist, create it from auth user metadata
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          const meta = authUser.user_metadata || {};
          const { error: createError } = await supabase
            .from('profiles')
            .insert([{
              id: userId,
              full_name: meta.full_name || authUser.email || 'Pengguna GiziKita',
              username: meta.username || '',
              role: role,
              school_id: null
            }]);
          
          if (createError) {
            console.error('Error creating profile:', createError);
            return false;
          }
        }
      } else if (data.role !== role) {
        // Profile exists but has wrong role, update it
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ role: role })
          .eq('id', userId);
        
        if (updateError) {
          console.error('Error updating profile role:', updateError);
          return false;
        }
      }
      
      return true;
    } catch (err) {
      console.error('Error ensuring profile exists:', err);
      return false;
    }
  }

  async getPendingUsers(): Promise<UserProfile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, schools(name)')
      .eq('role', 'admin_sekolah')
      .is('school_id', null);
    
    if (error) throw error;
    if (!data) return [];
    
    return data.map((profile: any) => ({
      id: profile.id,
      role: profile.role as UserRole,
      name: profile.full_name,
      username: profile.username || '',
      instansi: profile.schools ? profile.schools.name : 'Instansi Menunggu Verifikasi',
      school_id: profile.school_id,
      schoolName: profile.schools ? profile.schools.name : 'Menunggu Verifikasi',
      isApproved: false
    }));
  }

  async updateProfile(data: { name?: string; username?: string; instansi?: string; avatar_url?: string; password?: string }): Promise<{ success: boolean; message?: string }> {
    const user = this.currentUser;
    if (!user) return { success: false, message: 'Sesi tidak ditemukan.' };

    try {
      // Update Auth Password & Metadata if provided
      const authUpdates: any = {};
      if (data.password) authUpdates.password = data.password;
      if (data.instansi || data.avatar_url) {
        authUpdates.data = {
          ...(data.instansi ? { instansi: data.instansi } : {}),
          ...(data.avatar_url ? { avatar_url: data.avatar_url } : {})
        };
      }

      if (Object.keys(authUpdates).length > 0) {
        const { error: authError } = await supabase.auth.updateUser(authUpdates);
        if (authError) throw authError;
      }

      // Update Profile in DB (only existing columns in profiles)
      const profileUpdates: any = {};
      if (data.name !== undefined) profileUpdates.full_name = data.name;
      if (data.username !== undefined) profileUpdates.username = data.username;

      if (Object.keys(profileUpdates).length > 0) {
        const { error: profError } = await supabase
          .from('profiles')
          .update(profileUpdates)
          .eq('id', user.id);

        if (profError) throw profError;
      }

      // Reflect the confirmed profile write immediately without an extra read.
      useAuthStore.getState().setCurrentUser({
        ...user,
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.username !== undefined ? { username: data.username } : {}),
        ...(data.instansi !== undefined ? { instansi: data.instansi } : {}),
        ...(data.avatar_url !== undefined ? { avatar_url: data.avatar_url } : {}),
      });
      
      AuditService.log({ action: 'UPDATE_PROFILE', new_data: data });
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  async approveUser(userId: string, defaultSchoolId: number = 1): Promise<{ success: boolean; message?: string }> {
    try {
      // Approving school admin binds them to a valid school (school_id is no longer null)
      const { error } = await supabase
        .from('profiles')
        .update({ school_id: defaultSchoolId })
        .eq('id', userId);

      if (error) throw error;
      
      // Notify the user about approval
      void NotificationService.notify(
        userId,
        'Akun Disetujui!',
        'Selamat! Akun instansi Anda telah diverifikasi oleh pusat. Sekarang Anda bisa mengakses Dashboard Logistik.',
        '/distribusi',
        'success'
      );

      AuditService.log({ action: 'APPROVE_USER', new_data: { approved_user_id: userId } });
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }
}

export default new AuthService();
