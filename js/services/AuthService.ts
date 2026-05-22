import { useAuthStore } from '../store/authStore';
import { UserProfile, UserRole } from '../types';
import { supabase } from '../core/SupabaseClient';
import AuditService from './AuditService';
import NotificationService from './NotificationService';

class AuthService {
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

  async login(username: string, password: string): Promise<{ success: boolean; message?: string; user?: UserProfile }> {
    if (!username || !password) {
      return { success: false, message: 'Username dan password wajib diisi.' };
    }

    const email = username.includes('@') ? username : `${username.toLowerCase()}@gizikita.id`;
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) return { success: false, message: 'Username atau password salah.' };

    await useAuthStore.getState().fetchProfile(data.user.id);
    const user = useAuthStore.getState().currentUser;
    
    // Log login action
    AuditService.log({ action: 'LOGIN', new_data: { username, role: user?.role } });
    
    return { success: true, user: user || undefined };
  }

  async signup(name: string, username: string, _instansi: string, password: string, role: UserRole = 'user_umum', verificationCode: string = ''): Promise<{ success: boolean; message?: string; user?: UserProfile }> {
    try {
      const email = `${username.toLowerCase()}@gizikita.id`;

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Gagal membuat akun.");

      let schoolId: string | null = null;
      if (role === 'admin_sekolah' && verificationCode === 'GIZIKITA2025') {
        schoolId = '1'; 
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: authData.user.id,
          full_name: name,
          role: role,
          school_id: schoolId
        }]);

      if (profileError) throw profileError;
      
      // If a school admin registers, notify Admin Pusat
      if (role === 'admin_sekolah') {
        await NotificationService.notifyAdminPusat(
          'Pendaftaran Sekolah Baru',
          `Instansi ${name} baru saja mendaftar. Segera verifikasi akun mereka.`,
          '/profil',
          'info'
        );
      }

      await useAuthStore.getState().fetchProfile(authData.user.id);
      const user = useAuthStore.getState().currentUser;

      return { success: true, user: user || undefined };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  async logout(): Promise<void> {
    await useAuthStore.getState().logout();
  }

  async getPendingUsers(): Promise<UserProfile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, schools(name)')
      .eq('role', 'admin_sekolah')
      .is('school_id', null);
    
    if (error || !data) return [];
    
    return data.map((profile: any) => ({
      id: profile.id,
      role: profile.role as UserRole,
      name: profile.full_name,
      username: profile.username || '',
      instansi: profile.instansi || (profile.schools ? profile.schools.name : 'Masyarakat Umum'),
      school_id: profile.school_id,
      schoolName: profile.schools ? profile.schools.name : 'Masyarakat Umum',
      isApproved: false
    }));
  }

  async updateProfile(data: { name?: string; username?: string; instansi?: string; avatar_url?: string; password?: string }): Promise<{ success: boolean; message?: string }> {
    const user = this.currentUser;
    if (!user) return { success: false, message: 'Sesi tidak ditemukan.' };

    try {
      // Update Auth Password if provided
      if (data.password) {
        const { error: passError } = await supabase.auth.updateUser({ password: data.password });
        if (passError) throw passError;
      }

      // Update Profile in DB
      const { error: profError } = await supabase
        .from('profiles')
        .update({
          full_name: data.name,
          username: data.username,
          instansi: data.instansi,
          avatar_url: data.avatar_url
        })
        .eq('id', user.id);

      if (profError) throw profError;

      // Refresh local store
      await useAuthStore.getState().fetchProfile(user.id);
      
      AuditService.log({ action: 'UPDATE_PROFILE', new_data: data });
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  async approveUser(userId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ isApproved: true })
        .eq('id', userId);

      if (error) throw error;
      
      // Notify the user about approval
      await NotificationService.notify(
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
