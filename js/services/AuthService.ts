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
    if (user.role === 'admin_sekolah') return user.isApproved ? '/distribusi' : '/profil';
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

    if (error) return { success: false, message: 'Username atau password salah.' };

    await useAuthStore.getState().fetchProfile(data.user.id);
    const user = useAuthStore.getState().currentUser;
    
    // Log login action
    AuditService.log({ action: 'LOGIN', new_data: { username, role: user?.role } });
    
    return { success: true, user: user || undefined, redirectTo: this.getPostAuthRedirect(user) };
  }

  async signup(name: string, username: string, email: string, instansi: string, password: string, role: UserRole = 'user_umum', verificationCode: string = ''): Promise<AuthResult> {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedUsername = username.trim().toLowerCase();

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
      if (role === 'admin_sekolah' && verificationCode === 'GIZIKITA2025') {
        schoolId = '1'; 
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert([{
          id: authData.user.id,
          full_name: name,
          username: normalizedUsername,
          instansi,
          role: role,
          school_id: schoolId
        }], { onConflict: 'id' });

      if (profileError) {
        if (authData.session) throw profileError;
        console.warn('Profile will be completed after email confirmation/login:', profileError.message);
      }
      
      // If a school admin registers, notify Admin Pusat
      if (role === 'admin_sekolah' && !profileError) {
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
