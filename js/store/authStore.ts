import { create } from 'zustand';
import { supabase } from '../core/SupabaseClient';
import { UserProfile, UserRole } from '../types';

interface AuthState {
  currentUser: UserProfile | null;
  sessionUser: any | null;
  isInitialized: boolean;
  isLoading: boolean;
  
  // Actions
  init: () => Promise<void>;
  setCurrentUser: (user: UserProfile | null) => void;
  logout: () => Promise<void>;
  fetchProfile: (userId: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: null,
  sessionUser: null,
  isInitialized: false,
  isLoading: false,

  setCurrentUser: (user) => set({ currentUser: user }),

  init: async () => {
    if (get().isInitialized) return;

    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      // Handle stale/invalid refresh token gracefully
      if (error) {
        console.warn('Sesi kedaluwarsa, membersihkan sesi lama:', error.message);
        await supabase.auth.signOut();
        set({ sessionUser: null, currentUser: null });
      } else if (session) {
        set({ sessionUser: session.user });
        await get().fetchProfile(session.user.id);
      }
    } catch (err) {
      console.error('Auth initialization error:', err);
      // Force clean state on any unexpected error
      set({ sessionUser: null, currentUser: null });
    } finally {
      set({ isInitialized: true });
    }

    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      console.log('Auth event in Store:', event);

      // Handle failed token refresh (stale session)
      if (event === 'TOKEN_REFRESHED' && !session) {
        console.warn('Token refresh gagal, membersihkan sesi...');
        await supabase.auth.signOut();
        set({ sessionUser: null, currentUser: null });
        return;
      }

      if (event === 'SIGNED_OUT') {
        set({ sessionUser: null, currentUser: null });
        return;
      }

      if (session) {
        set({ sessionUser: session.user });
        await get().fetchProfile(session.user.id);
      } else {
        set({ sessionUser: null, currentUser: null });
      }
    });
  },

  fetchProfile: async (userId: string) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, schools(name)')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const schoolName = data.schools ? data.schools.name : 'Masyarakat Umum';
        const user: UserProfile = {
          id: data.id,
          role: data.role as UserRole,
          name: data.full_name || 'Pengguna GiziKita',
          username: data.username || '',
          instansi: data.instansi || (data.role === 'admin_pusat' ? 'Badan Gizi Nasional' : schoolName),
          school_id: data.school_id,
          schoolName: schoolName,
          isApproved: data.isApproved ?? true,
          avatar_url: data.avatar_url
        };
        set({ currentUser: user });
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try {
      await supabase.auth.signOut();
      set({ currentUser: null, sessionUser: null });
      window.location.href = '/';
    } catch (err) {
      console.error('Logout error:', err);
    }
  }
}));
