import { describe, it, expect, vi, beforeEach } from 'vitest';
import AuthService from '@/js/services/AuthService';
import { supabase } from '@/js/core/SupabaseClient';
import { useAuthStore } from '@/js/store/authStore';

// We mock the store's initial state
useAuthStore.setState({ currentUser: null, isInitialized: true });

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ currentUser: null });
  });

  it('should handle login successfully', async () => {
    const mockUser = { id: '123', email: 'test@school.id', user_metadata: { name: 'Test School', role: 'admin_sekolah' } };
    
    // Mock Supabase response
    (supabase.auth.signInWithPassword as any).mockResolvedValue({
      data: { user: mockUser },
      error: null
    });

    // Mock profile fetch
    const mockFrom = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ 
        data: { id: '123', role: 'admin_sekolah', full_name: 'Test School', isApproved: true }, 
        error: null 
      })
    };
    (supabase.from as any).mockReturnValue(mockFrom);

    const result = await AuthService.login('test@school.id', 'password123');
    
    expect(result.success).toBe(true);
    expect(useAuthStore.getState().currentUser?.name).toBe('Test School');
  });

  it('should return error for invalid credentials', async () => {
    (supabase.auth.signInWithPassword as any).mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid login credentials' }
    });

    const result = await AuthService.login('wrong@email.com', 'wrongpass');
    
    expect(result.success).toBe(false);
    expect(result.message).toBe('Username atau password salah.');
    expect(useAuthStore.getState().currentUser).toBeNull();
  });

  it('should clear session on logout', async () => {
    useAuthStore.setState({ currentUser: { id: '123', name: 'User' } as any });
    
    (supabase.auth.signOut as any).mockResolvedValue({ error: null });

    await AuthService.logout();
    
    expect(useAuthStore.getState().currentUser).toBeNull();
  });
});
