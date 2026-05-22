'use client';


import { useRouter } from 'next/navigation';
import { 
  Target, 
  ShieldCheck, 
  ArrowRight, 
  History, 
  Award, 
  Heart,
  Calendar,
  MessageCircle
} from 'lucide-react';

export default function AboutPage() {
  const router = useRouter();

  return (
    <div style={{ background: 'var(--cream)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Hero Section */}
      <section style={{ 
        position: 'relative', 
        padding: '120px 40px', 
        background: 'linear-gradient(135deg, var(--maroon) 0%, #7A1434 100%)', 
        color: '#fff', 
        overflow: 'hidden',
        textAlign: 'center'
      }}>
        <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)', borderRadius: '50%' }}></div>
        <div style={{ position: 'absolute', bottom: '-50px', left: '-50px', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)', borderRadius: '50%' }}></div>
        
        <div style={{ maxWidth: '1000px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: '64px', fontWeight: 900, marginBottom: '24px', letterSpacing: '-1px' }}>Tentang GiziKita</h1>
          <p style={{ fontSize: '20px', lineHeight: 1.8, opacity: 0.9, maxWidth: '700px', margin: '0 auto' }}>
            Membangun masa depan Indonesia melalui nutrisi yang tepat sasaran, transparan, dan terintegrasi untuk setiap anak sekolah.
          </p>
        </div>
      </section>

      {/* Vision & Mission */}
      <section style={{ padding: '100px 20px', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '80px', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '320px' }}>
          <div style={{ position: 'relative' }}>
             <img 
               src="Assets/makanan-bungkusan.jpg" 
               alt="Visi Kami" 
               style={{ width: '100%', borderRadius: '40px', boxShadow: '0 30px 80px rgba(139,28,63,0.15)', border: '12px solid #fff' }} 
             />
             <div style={{ position: 'absolute', bottom: '-30px', right: '-30px', background: 'var(--gold)', color: 'var(--maroon)', padding: '24px', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', fontWeight: 900, fontSize: '20px' }}>
               100%<br/><span style={{ fontSize: '14px', fontWeight: 600 }}>Transparan</span>
             </div>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: '320px' }}>
          <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '42px', fontWeight: 900, color: 'var(--maroon)', marginBottom: '24px' }}>Visi Kami</h2>
          <p style={{ fontSize: '17px', color: 'var(--text-muted)', lineHeight: 1.8, marginBottom: '40px' }}>
            GiziKita lahir dari semangat untuk memastikan Program Makan Bergizi Gratis (MBG) terlaksana dengan standar kualitas tertinggi. Kami percaya bahwa transparansi data dan kemudahan akses informasi adalah kunci keberhasilan program nasional ini.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
            <div style={{ background: '#fff', padding: '32px', borderRadius: '24px', boxShadow: '0 15px 40px rgba(0,0,0,0.04)', border: '1px solid #f0f0f0' }}>
              <div style={{ width: '48px', height: '48px', background: 'rgba(232,103,58,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                 <Target size={24} color="var(--coral)" />
              </div>
              <div style={{ fontWeight: 800, color: 'var(--maroon)', marginBottom: '8px', fontSize: '16px' }}>Tepat Sasaran</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>Memastikan bantuan sampai ke sekolah yang benar-benar membutuhkan.</div>
            </div>
            <div style={{ background: '#fff', padding: '32px', borderRadius: '24px', boxShadow: '0 15px 40px rgba(0,0,0,0.04)', border: '1px solid #f0f0f0' }}>
              <div style={{ width: '48px', height: '48px', background: 'rgba(139,28,63,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                 <ShieldCheck size={24} color="var(--maroon)" />
              </div>
              <div style={{ fontWeight: 800, color: 'var(--maroon)', marginBottom: '8px', fontSize: '16px' }}>Transparansi</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>Setiap butir nasi dan lauk pauk dapat dipantau distribusinya secara publik.</div>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section style={{ background: '#fff', padding: '100px 20px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'rgba(139,28,63,0.05)', padding: '10px 20px', borderRadius: '50px', color: 'var(--maroon)', fontWeight: 800, fontSize: '14px', marginBottom: '24px' }}>
            <History size={18} /> PERJALANAN KAMI
          </div>
          <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '42px', fontWeight: 900, color: 'var(--maroon)', marginBottom: '60px' }}>Sejarah GiziKita</h2>
          
          <div style={{ position: 'relative', padding: '40px 0' }}>
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: '3px', background: 'rgba(139,28,63,0.1)', transform: 'translateX(-50%)' }}></div>
            
            {/* 2025 */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingRight: 'calc(50% + 40px)', position: 'relative', marginBottom: '60px' }}>
              <div style={{ position: 'absolute', right: 'calc(-40px - 10px)', top: '10px', width: '20px', height: '20px', borderRadius: '50%', background: 'var(--maroon)', border: '4px solid #fff', boxShadow: '0 0 0 4px rgba(139,28,63,0.1)', zIndex: 2 }}></div>
              <div style={{ background: 'var(--cream)', padding: '32px', borderRadius: '24px', textAlign: 'right', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', maxWidth: '400px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', color: 'var(--coral)', fontWeight: 900, fontSize: '24px', marginBottom: '12px' }}>
                   2025 <Calendar size={20} />
                </div>
                <div style={{ fontWeight: 800, color: 'var(--maroon)', fontSize: '18px', marginBottom: '8px' }}>Inisiasi Platform</div>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>GiziKita dimulai sebagai pilot project pemantauan gizi nasional oleh tim pengembang UREEKA untuk mendukung program MBG.</p>
              </div>
            </div>

            {/* 2026 */}
            <div style={{ display: 'flex', justifyContent: 'flex-start', paddingLeft: 'calc(50% + 40px)', position: 'relative' }}>
              <div style={{ position: 'absolute', left: 'calc(-40px - 10px)', top: '10px', width: '20px', height: '20px', borderRadius: '50%', background: 'var(--maroon)', border: '4px solid #fff', boxShadow: '0 0 0 4px rgba(139,28,63,0.1)', zIndex: 2 }}></div>
              <div style={{ background: 'var(--cream)', padding: '32px', borderRadius: '24px', textAlign: 'left', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', maxWidth: '400px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '8px', color: 'var(--maroon)', fontWeight: 900, fontSize: '24px', marginBottom: '12px' }}>
                   <Award size={24} /> 2026
                </div>
                <div style={{ fontWeight: 800, color: 'var(--maroon)', fontSize: '18px', marginBottom: '8px' }}>Peluncuran Versi 1.0</div>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>Rilis resmi platform GiziKita dengan integrasi penuh AI untuk analisis nutrisi dan layanan bantuan chatbot 24/7.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section style={{ padding: '100px 20px', textAlign: 'center', background: 'var(--cream)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
           <Heart size={48} color="var(--coral)" style={{ marginBottom: '24px' }} />
           <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '36px', fontWeight: 900, color: 'var(--maroon)', marginBottom: '24px' }}>Nilai-Nilai Kami</h2>
           <p style={{ fontSize: '18px', color: 'var(--text-muted)', lineHeight: 1.8, marginBottom: '60px' }}>
             "Kami tidak hanya mengelola data, kami mengawal masa depan generasi emas Indonesia."
           </p>
           
           <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'center' }}>
                 <div style={{ fontSize: '32px', fontWeight: 900, color: 'var(--maroon)' }}>5.000+</div>
                 <div style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 600 }}>Sekolah Terdaftar</div>
              </div>
              <div style={{ width: '1px', background: '#ddd', height: '60px' }}></div>
              <div style={{ textAlign: 'center' }}>
                 <div style={{ fontSize: '32px', fontWeight: 900, color: 'var(--maroon)' }}>1,2 Juta</div>
                 <div style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 600 }}>Porsi Terdistribusi</div>
              </div>
              <div style={{ width: '1px', background: '#ddd', height: '60px' }}></div>
              <div style={{ textAlign: 'center' }}>
                 <div style={{ fontSize: '32px', fontWeight: 900, color: 'var(--maroon)' }}>24/7</div>
                 <div style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 600 }}>Pemantauan Aktif</div>
              </div>
           </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '100px 20px', textAlign: 'center', background: '#fff' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto', background: 'var(--nav-gold)', padding: '60px', borderRadius: '40px', boxShadow: '0 20px 50px rgba(139,28,63,0.1)' }}>
          <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '36px', fontWeight: 900, color: 'var(--maroon)', marginBottom: '20px' }}>Ingin Berkontribusi?</h2>
          <p style={{ color: 'var(--maroon)', opacity: 0.8, marginBottom: '32px', fontSize: '16px', lineHeight: 1.6 }}>
            Kami selalu terbuka untuk masukan, saran, dan kerjasama dari berbagai pihak demi kemajuan anak bangsa Indonesia.
          </p>
          <button 
            className="btn btn-primary" 
            onClick={() => router.push('/help')}
            style={{ padding: '18px 48px', borderRadius: '50px', display: 'flex', alignItems: 'center', gap: '10px', margin: '0 auto' }}
          >
            <MessageCircle size={20} /> Hubungi Kami <ArrowRight size={20} />
          </button>
        </div>
      </section>

    </div>
  );
}
