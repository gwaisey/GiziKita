'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import AuthService from '@/js/services/AuthService';
import { useUIStore } from '@/js/store/uiStore';
import { UserRole } from '@/js/types';

export default function SignupPage() {
  const router = useRouter();
  const showToast = useUIStore((state) => state.showToast);

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<UserRole>('user_umum');
  const [instansi, setInstansi] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !username || !password) {
      showToast('Mohon lengkapi semua data diri.');
      return;
    }

    setIsLoading(true);

    try {
      const finalInstansi = role === 'user_umum' ? 'Masyarakat Umum' : instansi;
      const res = await AuthService.signup(name, username, finalInstansi, password, role, verificationCode);
      
      if (res.success) {
        showToast('Akun berhasil dibuat! Selamat bergabung.');
        router.push('/');
      } else {
        showToast(res.message || 'Gagal mendaftar. Silakan coba lagi.');
      }
    } catch (err) {
      showToast('Terjadi kesalahan sistem. Silakan coba lagi nanti.');
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
        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(180deg,#F4C662,#E8673A)' }}></div>
        <img src="/Assets/daftar-masuk.jpg" alt="GiziKita" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>

      <div className="auth-form-container" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '40px 12% 40px 0', position: 'relative', zIndex: 5 }}>
        <div style={{ width: '100%', maxWidth: '420px' }} className="auth-form-wrap">
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <img src="/Assets/logo.png" width="52" style={{ marginBottom: '6px' }} alt="Logo" />
            <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '22px', fontWeight: 700, color: 'var(--maroon)' }}>Gizi Kita</div>
          </div>
          
          <div className="auth-box" style={{ background: '#fff', borderRadius: '18px', padding: '32px 28px', boxShadow: '0 6px 40px rgba(139,28,63,.14)' }}>
            <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '24px', marginBottom: '6px', color: 'var(--maroon)' }}>Buat Akun Baru</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '22px' }}>Isi data diri Anda untuk mendaftar</p>
            
            <form onSubmit={handleSignup}>
              <div className="form-group">
                <label>Nama Lengkap</label>
                <input 
                  type="text" 
                  placeholder="Nama lengkap"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="form-group">
                <label>Username</label>
                <input 
                  type="text" 
                  placeholder="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="form-group">
                <label>Daftar Sebagai</label>
                <select 
                  value={role} 
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  disabled={isLoading}
                >
                  <option value="admin_sekolah">Pihak Sekolah / Instansi (Pelapor)</option>
                  <option value="user_umum">Orang Tua / Masyarakat (Umum)</option>
                </select>
              </div>

              {role === 'admin_sekolah' && (
                <>
                  <div className="form-group">
                    <label>Nama Instansi / Sekolah</label>
                    <input 
                      type="text" 
                      placeholder="Nama sekolah atau instansi"
                      value={instansi}
                      onChange={(e) => setInstansi(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="form-group">
                    <label>Kode Verifikasi Sekolah</label>
                    <input 
                      type="text" 
                      placeholder="Masukkan kode resmi dari BGN"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </>
              )}

              <div className="form-group">
                <label>Password</label>
                <div className="input-icon-wrap">
                   <input 
                    type={showPassword ? 'text' : 'password'} 
                    placeholder="Min. 6 karakter"
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
                    <Loader2 size={16} className="spinner" /> Mendaftar...
                  </>
                ) : 'Daftar'}
              </button>
            </form>
          </div>
          <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px', color: 'var(--text-muted)' }}>
            Sudah punya akun? <Link href="/login" style={{ color: 'var(--maroon)', fontWeight: 600, textDecoration: 'none' }}>Masuk di sini</Link>
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
