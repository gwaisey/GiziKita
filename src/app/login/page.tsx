'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import AuthService from '@/js/services/AuthService';
import { useUIStore } from '@/js/store/uiStore';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showToast = useUIStore((state) => state.showToast);
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get('registered') === 'check-email') {
      showToast('Pendaftaran berhasil. Cek email untuk konfirmasi akun, lalu login.');
    }
  }, [searchParams, showToast]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Mohon isi semua kolom.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await AuthService.login(username, password);
      
      if (res.success) {
        showToast(`Login berhasil! Selamat datang, ${username}`);
        router.push(res.redirectTo || '/');
        // Note: In Next.js, layout will automatically update because it listens to Zustand state
      } else {
        setError(res.message || 'Username atau password salah.');
      }
    } catch (err) {
      setError('Terjadi kesalahan sistem. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 148px)', position: 'relative', overflow: 'hidden', background: 'var(--cream)' }}>
      {/* Decorations */}
      <svg className="deco-flower" style={{ position: 'absolute', right: '40px', bottom: '40px', width: '220px', opacity: 0.25 }} viewBox="0 0 200 200">
        <g transform="translate(100,100)">
          <ellipse rx="45" ry="22" transform="rotate(0)" fill="#E8673A"/><ellipse rx="45" ry="22" transform="rotate(30)" fill="#E8673A"/><ellipse rx="45" ry="22" transform="rotate(60)" fill="#E8673A"/><ellipse rx="45" ry="22" transform="rotate(90)" fill="#E8673A"/><ellipse rx="45" ry="22" transform="rotate(120)" fill="#E8673A"/><ellipse rx="45" ry="22" transform="rotate(150)" fill="#E8673A"/><circle r="32" fill="#FFF0C0"/><circle r="18" fill="#F4C662"/>
        </g>
      </svg>
      
      <div className="auth-food-strip" style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '38%', overflow: 'hidden' }}>
        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(180deg,#E8673A,#8B1C3F)' }}></div>
        <img src="/Assets/daftar-masuk.jpg" alt="GiziKita" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>

      <div className="auth-form-container" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '40px 12% 40px 0', position: 'relative', zIndex: 5 }}>
        <div style={{ width: '100%', maxWidth: '380px' }} className="auth-form-wrap">
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <img src="/Assets/logo.png" width="52" style={{ marginBottom: '6px' }} alt="Logo" />
            <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '22px', fontWeight: 700, color: 'var(--maroon)' }}>Gizi Kita</div>
          </div>
          
          <div className="auth-box" style={{ background: '#fff', borderRadius: '18px', padding: '32px 28px', boxShadow: '0 6px 40px rgba(139,28,63,.14)' }}>
            <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '24px', marginBottom: '6px', color: 'var(--maroon)' }}>Masuk ke Akun</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '22px' }}>Masukkan email dan password Anda</p>
            
            {error && (
              <div className="alert alert-error" style={{ marginBottom: '15px', fontSize: '13px', display: 'flex' }}>
                {error}
              </div>
            )}
            
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label>Email</label>
                <input 
                  type="text" 
                  placeholder="email@domain.com"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <div className="input-icon-wrap">
                   <input 
                    type={showPassword ? 'text' : 'password'} 
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                   />
                   <button 
                    className="eye-btn" 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--maroon)', width: 24, height: 24 }}
                   >
                     {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                   </button>
                 </div>
              </div>
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="spinner" /> Memproses...
                  </>
                ) : 'Login'}
              </button>
            </form>
          </div>
          <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px', color: 'var(--text-muted)' }}>
            Belum punya akun? <Link href="/signup" style={{ color: 'var(--maroon)', fontWeight: 600, textDecoration: 'none' }}>Daftar sekarang</Link>
          </p>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 768px) { 
          .auth-food-strip { display: none !important; } 
          .auth-form-container { justify-content: center !important; padding: 40px 20px !important; }
          .auth-form-wrap { max-width: 100% !important; }
        }
      `}</style>
    </div>
  );
}
