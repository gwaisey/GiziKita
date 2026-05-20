'use client';


import { useRouter } from 'next/navigation';
import { ArrowRight, ShieldAlert } from 'lucide-react';

export default function AccessDeniedPage() {
  const router = useRouter();

  return (
    <div style={{ background: 'var(--cream)', position: 'relative', overflow: 'hidden', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Decorative SVG */}
      <svg className="deco-flower" style={{ position: 'absolute', right: '40px', bottom: '60px', width: '220px', opacity: 0.25 }} viewBox="0 0 200 200">
        <g transform="translate(100,100)">
          <ellipse rx="45" ry="22" transform="rotate(0)" fill="#E8673A"/><ellipse rx="45" ry="22" transform="rotate(30)" fill="#E8673A"/><ellipse rx="45" ry="22" transform="rotate(60)" fill="#E8673A"/><ellipse rx="45" ry="22" transform="rotate(90)" fill="#E8673A"/><ellipse rx="45" ry="22" transform="rotate(120)" fill="#E8673A"/><ellipse rx="45" ry="22" transform="rotate(150)" fill="#E8673A"/><circle r="32" fill="#FFF0C0"/><circle r="18" fill="#F4C662"/>
        </g>
      </svg>
      
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '32px', textAlign: 'center', padding: '40px', position: 'relative', zIndex: 2 }}>
        <div style={{ width: '100px', height: '100px', background: 'rgba(139,28,63,0.1)', borderRadius: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--maroon)', marginBottom: '8px' }}>
          <ShieldAlert size={56} />
        </div>
        
        <div>
          <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: '36px', fontWeight: 900, color: 'var(--maroon)', marginBottom: '16px' }}>
            Akses Terbatas
          </h1>
          <p style={{ fontSize: '18px', lineHeight: 1.6, color: 'var(--text-muted)', maxWidth: '450px', margin: '0 auto' }}>
            Maaf, halaman ini hanya dapat diakses oleh pengguna terverifikasi. Silakan masuk ke akun Anda terlebih dahulu.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <button 
            className="btn btn-primary" 
            onClick={() => router.push('/login')}
            style={{ padding: '16px 40px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            Masuk Sekarang <ArrowRight size={20} />
          </button>
          <button 
            className="btn btn-outline" 
            onClick={() => router.push('/')}
            style={{ padding: '16px 32px', borderRadius: '16px', color: 'var(--maroon)' }}
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    </div>
  );
}
