'use client';


import Link from 'next/link';
import { useAuthStore } from '@/js/store/authStore';
import { ArrowRight, Loader2, Shield, ClipboardList, MessageSquare, School, User } from 'lucide-react';

/**
 * Landing Page - Adaptive Home for GiziKita Enterprise
 */
export default function Home() {
  const { currentUser, isInitialized } = useAuthStore();

  if (!isInitialized) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <Loader2 className="spinner" size={48} color="var(--maroon)" />
      </div>
    );
  }

  const role = currentUser?.role || 'guest';

  // Render content based on role
  if (role === 'admin_pusat') return <AdminPusatHome user={currentUser} />;
  if (role === 'admin_sekolah') return <AdminSekolahHome user={currentUser} />;
  if (role === 'user_umum') return <UserUmumHome user={currentUser} />;
  
  return <GuestHome />;
}

// --- SUB-COMPONENTS FOR DIFFERENT ROLES ---

function AdminPusatHome({ user }: { user: any }) {
  return (
    <div className="admin-home">
      <section className="admin-hero">
        <div className="admin-shell">
          <div className="hero-panel">
            <div className="hero-copy">
              <span className="admin-eyebrow">Panel Admin Pusat</span>
              <h1>Selamat datang, {user?.name || 'Admin Pusat'}.</h1>
              <p>Area kerja internal untuk verifikasi akun sekolah, pemantauan data penerima, dan tindak lanjut laporan masyarakat.</p>
            </div>

            <aside className="role-card">
              <div className="role-icon">
                <Shield size={24} />
              </div>
              <span>Peran aktif</span>
              <strong>Admin Pusat</strong>
              <p>Akses pusat untuk verifikasi akun, audit sekolah, dan respons laporan publik.</p>
            </aside>
          </div>
        </div>
      </section>

      <section className="admin-workspace">
        <div className="admin-shell">
          <div className="section-heading">
            <div>
              <span className="admin-eyebrow">Prioritas kerja</span>
              <h2>Kelola operasional pusat</h2>
            </div>
          </div>

          <div className="action-grid">
          <AdminActionCard 
            title="Kelola Pendaftaran Admin Sekolah"
            desc="Buka tabel persetujuan akun dan verifikasi pendaftar yang masih menunggu tinjauan pusat."
            icon={<User size={24} />}
            link="/profil"
            label="Buka Persetujuan"
          />
          <AdminActionCard 
            title="Pantau Sekolah Terdaftar"
            desc="Periksa data sekolah penerima, status, dan gambaran distribusi yang sudah tercatat di sistem."
            icon={<School size={24} />}
            link="/sekolah"
            label="Lihat Daftar Sekolah"
            outline
          />
          <AdminActionCard 
            title="Audit Aset Kendaraan"
            desc="Verifikasi inventaris aset pemerintah dan sinkronisasi live GPS untuk mencegah kehilangan atau pencurian."
            icon={<Shield size={24} />}
            link="/audit"
            label="Buka Audit Aset"
            outline
          />
          <AdminActionCard 
            title="Balas Umpan Balik Publik"
            desc="Masuk ke pusat umpan balik untuk membaca laporan masyarakat dan kirim pembaruan resmi."
            icon={<MessageSquare size={24} />}
            link="/feedback"
            label="Buka Umpan Balik"
            outline
          />
          </div>
        </div>
      </section>

      <style jsx>{`
        .admin-home {
          min-height: 100vh;
          background:
            linear-gradient(180deg, #fffbf5 0%, #fff7ed 46%, #fffbf5 100%);
          color: var(--text);
        }

        .admin-shell {
          width: min(1180px, calc(100% - 40px));
          margin: 0 auto;
        }

        .admin-hero {
          padding: 32px 0 22px;
        }

        .hero-panel {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 320px;
          gap: 28px;
          align-items: stretch;
          padding: 34px;
          color: #fff;
          border-radius: 18px;
          background:
            linear-gradient(135deg, rgba(122, 20, 52, 0.98), rgba(77, 10, 30, 0.98));
          box-shadow: 0 18px 48px rgba(77, 10, 30, 0.18);
          overflow: hidden;
        }

        .hero-copy {
          min-width: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .admin-eyebrow {
          display: inline-flex;
          margin-bottom: 10px;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: .08em;
          text-transform: uppercase;
          color: inherit;
          opacity: .76;
        }

        .hero-copy h1 {
          max-width: 720px;
          margin: 0;
          font-family: var(--font-playfair);
          font-size: clamp(34px, 5vw, 52px);
          line-height: 1.05;
          letter-spacing: 0;
        }

        .hero-copy p {
          max-width: 640px;
          margin: 16px 0 0;
          color: rgba(255, 255, 255, 0.9);
          font-size: 16px;
          line-height: 1.65;
        }

        .hero-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 28px;
        }

        .primary-action,
        .secondary-action {
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          padding: 0 18px;
          font-weight: 800;
          text-decoration: none;
          transition: transform .16s ease, background .16s ease, border-color .16s ease;
        }

        .primary-action {
          background: var(--gold);
          color: #4d0a1e;
        }

        .secondary-action {
          border: 1px solid rgba(255, 255, 255, 0.42);
          color: #fff;
        }

        .primary-action:hover,
        .secondary-action:hover {
          transform: translateY(-1px);
        }

        .secondary-action:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.58);
        }

        .role-card {
          min-height: 232px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 24px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.14);
        }

        .role-icon {
          width: 46px;
          height: 46px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 18px;
          border-radius: 12px;
          background: rgba(244, 198, 98, 0.14);
          color: var(--gold);
        }

        .role-card span {
          color: rgba(255, 255, 255, 0.72);
          font-size: 13px;
          font-weight: 700;
        }

        .role-card strong {
          display: block;
          margin-top: 8px;
          color: #fff;
          font-size: 27px;
          line-height: 1.15;
        }

        .role-card p {
          margin: 12px 0 0;
          color: rgba(255, 255, 255, 0.82);
          font-size: 14px;
          line-height: 1.62;
        }

        .admin-workspace {
          padding: 14px 0 72px;
        }

        .section-heading {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 28px;
          margin-bottom: 18px;
        }

        .section-heading .admin-eyebrow {
          color: var(--coral);
          opacity: 1;
        }

        .section-heading h2 {
          margin: 0;
          color: var(--maroon);
          font-family: var(--font-playfair);
          font-size: 30px;
          line-height: 1.15;
        }

        .section-heading p {
          max-width: 360px;
          margin: 0;
          color: var(--text-muted);
          font-size: 14px;
          line-height: 1.6;
          text-align: right;
        }

        .action-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 18px;
        }

        @media (max-width: 980px) {
          .hero-panel {
            grid-template-columns: 1fr;
          }

          .role-card {
            min-height: 0;
          }

          .action-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 720px) {
          .admin-shell {
            width: min(100% - 28px, 1180px);
          }

          .admin-hero {
            padding-top: 22px;
          }

          .hero-panel {
            padding: 24px;
            border-radius: 14px;
          }

          .hero-actions,
          .primary-action,
          .secondary-action {
            width: 100%;
          }

          .section-heading {
            align-items: flex-start;
            flex-direction: column;
            gap: 8px;
          }

          .section-heading p {
            text-align: left;
          }
        }
      `}</style>
    </div>
  );
}

function AdminSekolahHome({ user }: { user: any }) {
  return (
    <div style={{ background: 'var(--cream)', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '-120px', right: '-120px', width: '380px', height: '380px', background: 'radial-gradient(circle, rgba(232,103,58,0.18), transparent 72%)', borderRadius: '50%' }}></div>
      <div style={{ position: 'absolute', bottom: '-180px', left: '-140px', width: '440px', height: '440px', background: 'radial-gradient(circle, rgba(139,28,63,0.10), transparent 72%)', borderRadius: '50%' }}></div>

      <section className="home-section" style={{ paddingTop: '88px', paddingBottom: '44px', position: 'relative', zIndex: 2 }}>
        <div className="home-card-inner" style={{ maxWidth: '1100px', margin: '0 auto', background: 'linear-gradient(135deg, #FFF4E8, #FFE7D2)', borderRadius: '30px', boxShadow: '0 24px 60px rgba(139,28,63,0.10)', border: '1px solid rgba(139,28,63,0.08)', padding: '56px 54px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '28px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ flex: 2, minWidth: '280px' }}>
              <div style={{ fontSize: '13px', letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--coral)', fontWeight: 800, marginBottom: '14px' }}>Dashboard Admin Sekolah</div>
              <h1 className="hero-title" style={{ fontFamily: 'var(--font-playfair)', margin: 0, color: 'var(--maroon)', fontSize: '56px', lineHeight: 1.05 }}>Selamat datang, {user?.name || 'Admin Sekolah'}.</h1>
              <p className="hero-desc" style={{ color: 'var(--text-muted)', marginTop: '16px', maxWidth: '560px', marginBottom: '28px', fontSize: '16px' }}>Anda sudah masuk ke area operasional sekolah. Dari sini Anda bisa mencatat distribusi, meninjau menu, dan memantau status akun instansi Anda.</p>
            </div>
            <div className="badge-card" style={{ background: '#fff', border: '1px solid rgba(139,28,63,0.08)', borderRadius: '22px', padding: '24px 22px', minWidth: '240px', flex: 1, maxWidth: '320px' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>Instansi Aktif</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--maroon)', marginBottom: '8px' }}>{user?.instansi || 'Instansi Sekolah'}</div>
              <div style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-muted)' }}>{user?.isApproved ? 'Akun Anda sudah aktif dan siap dipakai untuk pelaporan.' : 'Akun Anda masih menunggu persetujuan admin pusat untuk akses penuh.'}</div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: '0 60px 40px', position: 'relative', zIndex: 2 }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '22px' }}>
          <AdminActionCard 
            title="Catat Distribusi Harian"
            desc="Isi laporan penerimaan makanan, jumlah porsi, dan dokumentasi distribusi di sekolah Anda."
            icon={<ClipboardList size={24} />}
            link="/distribusi"
            label="Isi Laporan Sekarang"
            iconLabel="Operasional"
          />
          <AdminActionCard 
            title="Tinjau Menu Mingguan"
            desc="Lihat susunan menu yang sedang berjalan agar operasional sekolah selaras dengan jadwal distribusi."
            icon={<MessageSquare size={24} />}
            link="/menu"
            label="Lihat Menu"
            outline
            iconLabel="Referensi"
          />
          <AdminActionCard 
            title="Kelola Profil Instansi"
            desc="Periksa identitas akun sekolah Anda dan pantau apakah akun sudah disetujui untuk akses penuh."
            icon={<User size={24} />}
            link="/profil"
            label="Buka Profil"
            outline
            iconLabel="Status Akun"
          />
        </div>
      </section>

      <section style={{ padding: '0 60px 120px', position: 'relative', zIndex: 2 }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', background: '#fff', borderRadius: '26px', padding: '34px', boxShadow: '0 20px 50px rgba(139,28,63,0.10)', display: 'flex', justifyContent: 'space-between', gap: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ maxWidth: '640px' }}>
            <h3 style={{ fontFamily: 'var(--font-playfair)', fontSize: '34px', margin: '0 0 10px', color: 'var(--text)' }}>Butuh kirim aspirasi atau minta bantuan?</h3>
            <p style={{ fontSize: '15px', lineHeight: 1.7, color: 'var(--text-muted)', margin: 0 }}>Anda tetap bisa membuka pusat umpan balik dan halaman bantuan kapan saja dari navbar untuk berkomunikasi dengan tim pusat.</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Link href="/feedback" className="btn btn-outline" style={{ padding: '15px 24px' }}>Buka Umpan Balik</Link>
            <Link href="/help" className="btn btn-primary" style={{ padding: '15px 24px' }}>Buka Bantuan</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function UserUmumHome({ user }: { user: any }) {
  return (
    <div style={{ background: 'var(--cream)', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '360px', height: '360px', background: 'radial-gradient(circle, rgba(244,198,98,0.20), transparent 70%)', borderRadius: '50%' }}></div>
      <div style={{ position: 'absolute', bottom: '-160px', left: '-120px', width: '420px', height: '420px', background: 'radial-gradient(circle, rgba(232,103,58,0.10), transparent 72%)', borderRadius: '50%' }}></div>

      <section className="home-section" style={{ paddingTop: '88px', paddingBottom: '44px', position: 'relative', zIndex: 2 }}>
        <div className="home-card-inner" style={{ maxWidth: '1100px', margin: '0 auto', background: 'linear-gradient(135deg, #FFFFFF, #FFF8EF)', borderRadius: '30px', boxShadow: '0 24px 60px rgba(139,28,63,0.10)', border: '1px solid rgba(139,28,63,0.08)', padding: '56px 54px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '28px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ flex: 2, minWidth: '280px' }}>
              <div style={{ fontSize: '13px', letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--coral)', fontWeight: 800, marginBottom: '14px' }}>Beranda Pengguna</div>
              <h1 className="hero-title" style={{ fontFamily: 'var(--font-playfair)', margin: 0, color: 'var(--maroon)', fontSize: '56px', lineHeight: 1.05 }}>Halo, {user?.name || 'Pengguna GiziKita'}.</h1>
              <p className="hero-desc" style={{ color: 'var(--text-muted)', marginTop: '16px', maxWidth: '560px', marginBottom: '28px', fontSize: '16px' }}>Anda sudah masuk. Dari sini Anda bisa memantau menu bergizi, membaca informasi sekolah, dan mengirim umpan balik ke tim GiziKita.</p>
            </div>
            <div className="badge-card" style={{ background: '#fff', border: '1px solid rgba(139,28,63,0.08)', borderRadius: '22px', padding: '24px 22px', minWidth: '240px', flex: 1, maxWidth: '320px' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>Akses Aktif</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--maroon)', marginBottom: '8px' }}>Masyarakat Umum</div>
              <div style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-muted)' }}>Gunakan akses ini untuk memantau program, mencari bantuan, dan mengirimkan masukan secara langsung.</div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: '0 60px 40px', position: 'relative', zIndex: 2 }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '22px' }}>
          <AdminActionCard 
            title="Lihat Menu Mingguan"
            desc="Pantau makanan yang sedang disiapkan dan pelajari manfaat gizinya untuk anak-anak."
            icon={<ClipboardList size={24} />}
            link="/menu"
            label="Buka Menu"
            iconLabel="Gizi"
          />
          <AdminActionCard 
            title="Cek Sekolah Terdaftar"
            desc="Lihat daftar sekolah yang sudah masuk dalam sistem program makan bergizi gratis."
            icon={<School size={24} />}
            link="/sekolah"
            label="Lihat Sekolah"
            outline
            iconLabel="Transparansi"
          />
          <AdminActionCard 
            title="Sampaikan Masukan"
            desc="Berikan saran, keluhan, atau apresiasi Anda agar layanan terus membaik."
            icon={<MessageSquare size={24} />}
            link="/feedback"
            label="Buka Umpan Balik"
            outline
            iconLabel="Aspirasi"
          />
        </div>
      </section>

      <section style={{ padding: '0 60px 120px', position: 'relative', zIndex: 2 }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', background: '#fff', borderRadius: '26px', padding: '34px', boxShadow: '0 20px 50px rgba(139,28,63,0.10)', display: 'flex', justifyContent: 'space-between', gap: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ maxWidth: '640px' }}>
            <h3 style={{ fontFamily: 'var(--font-playfair)', fontSize: '34px', margin: '0 0 10px', color: 'var(--text)' }}>Perlu panduan cepat?</h3>
            <p style={{ fontSize: '15px', lineHeight: 1.7, color: 'var(--text-muted)', margin: 0 }}>Masuk ke halaman bantuan untuk bertanya tentang menu, sekolah, atau penggunaan aplikasi GiziKita.</p>
          </div>
          <Link href="/help" className="btn btn-primary" style={{ padding: '15px 28px' }}>Buka Bantuan</Link>
        </div>
      </section>
    </div>
  );
}

function GuestHome() {
  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Hero */}
      <div className="hero" style={{ position: 'relative', minHeight: '500px', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
        <img className="hero-img" src="/Assets/landing-page1.jpg" alt="Makanan Bergizi"
             style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', zIndex: 1 }} />
        <div className="hero-bg" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(120deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.1) 70%)', zIndex: 2 }}></div>
        
        <div className="hero-content" style={{ position: 'relative', zIndex: 3, padding: '100px 60px', maxWidth: '700px', color: '#fff' }}>
          <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: '64px', fontWeight: 900, lineHeight: 1.05, marginBottom: '24px', textShadow: '0 2px 12px rgba(0,0,0,0.3)' }}>Selamat Datang!</h1>
          <p style={{ fontSize: '16px', lineHeight: 1.7, opacity: 0.92, marginBottom: '32px', maxWidth: '550px' }}>
            Setiap anak Indonesia berhak mendapatkan makanan bergizi melalui sistem yang transparan dan efisien. Dengan sistem ini, pendaftaran sekolah menjadi lebih mudah dan distribusi makanan lebih merata.
          </p>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <Link href="/signup" className="btn btn-primary btn-lg">Daftar Sekarang</Link>
            <Link href="/login" className="btn btn-outline btn-lg" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.6)' }}>Masuk</Link>
          </div>
        </div>
      </div>

      {/* Feature 1: Pendataan */}
      <LandingFeature 
        title="Pendataan Sekolah Cepat & Akurat"
        desc="Proses pendaftaran sekolah kini lebih terintegrasi. Pastikan setiap sekolah mendapatkan hak distribusinya secara tepat waktu."
        img="/Assets/landing-page2.jpg"
      />

      {/* Feature 2: Menu Sehat */}
      <LandingFeature 
        title="Menu Sehat Setiap Hari"
        desc="Asupan gizi seimbang adalah prioritas kami. Lihat daftar menu mingguan yang telah dirancang khusus untuk pertumbuhan anak."
        img="/Assets/landing-page3.jpg"
        reverse
      />

      {/* Feature 3: Pantau Distribusi */}
      <div style={{ background: '#fff', padding: '120px 60px', display: 'flex', alignItems: 'center', gap: '80px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '300px', position: 'relative' }}>
           <div style={{ width: '100%', aspectRatio: '1/1', borderRadius: '50% 50% 0 50%', overflow: 'hidden', border: '10px solid #fff', boxShadow: '0 25px 60px rgba(139,28,63,0.12)' }}>
              <img src="/Assets/distribution.png" alt="Distribusi" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
           </div>
        </div>
        <div style={{ flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
           <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '48px', fontWeight: 900, color: 'var(--text)', lineHeight: 1.1 }}>
             Pantau<br/>Distribusi
           </h2>
           <p style={{ color: 'var(--text-muted)', fontSize: '16px', lineHeight: 1.7 }}>
             Pantau setiap tahapan distribusi makanan ke sekolah-sekolah di seluruh Nusantara dengan transparansi penuh.
           </p>
           <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              <Link href="/sekolah" className="btn btn-primary">Cek Sekolah Terdaftar</Link>
           </div>
        </div>
      </div>

      {/* Feature 4: Dengar Suara Masyarakat */}
      <div style={{ background: 'var(--cream)', padding: '140px 60px', display: 'flex', alignItems: 'center', gap: '100px', flexWrap: 'wrap', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(244,198,98,0.15), transparent 70%)', borderRadius: '50%', zIndex: 1 }}></div>
        
        <div style={{ flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '32px', alignItems: 'flex-start', zIndex: 2 }}>
           <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '52px', fontWeight: 900, color: 'var(--text)', lineHeight: 1.1, margin: 0 }}>Dengar Suara<br/>Masyarakat!</h2>
           <p style={{ color: 'var(--text-muted)', fontSize: '17px', maxWidth: '420px', lineHeight: 1.8, margin: 0 }}>Umpan balik Anda adalah energi bagi kami untuk terus memberikan pelayanan terbaik.</p>
           <Link href="/feedback" className="btn btn-primary">Lihat Semua Umpan Balik</Link>
        </div>
        
        <div style={{ flex: 1, minWidth: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', zIndex: 2 }}>
           <div style={{ width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <FeedbackBubble name="Ibu Ratna" role="Wali Murid SDN 01" text="Menu bergizi hari ini sangat baik, anak saya jadi lebih semangat belajar di sekolah!" />
              <FeedbackBubble name="Tim GiziKita" role="Admin Pusat" text="Terima kasih Ibu! Kami akan terus memantau kualitas distribusi gizi secara berkala." dark />
           </div>
        </div>
      </div>
    </div>
  );
}

// --- HELPER UI COMPONENTS ---

function AdminActionCard({ title, desc, icon, link, label, outline = false, iconLabel }: any) {
  return (
    <div className="admin-action-card">
      <div className="action-meta">
        <span className="action-icon">{icon}</span>
        <span>{iconLabel || title.split(' ')[0]}</span>
      </div>
      <h2>{title}</h2>
      <p>{desc}</p>
      <Link href={link} className={outline ? 'card-action outline' : 'card-action'}>
        {label}
        <ArrowRight size={16} />
      </Link>

      <style jsx>{`
        .admin-action-card {
          min-height: 270px;
          height: 100%;
          display: flex;
          flex-direction: column;
          padding: 24px;
          border-radius: 16px;
          background: #fff;
          border: 1px solid rgba(139, 28, 63, 0.08);
          box-shadow: 0 12px 30px rgba(44, 24, 16, 0.05);
          transition: transform .16s ease, box-shadow .16s ease, border-color .16s ease;
        }

        .admin-action-card:hover {
          transform: translateY(-2px);
          border-color: rgba(139, 28, 63, 0.18);
          box-shadow: 0 16px 36px rgba(44, 24, 16, 0.08);
        }

        .action-meta {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 18px;
          color: var(--coral);
          font-size: 12px;
          font-weight: 800;
          letter-spacing: .08em;
          text-transform: uppercase;
        }

        .action-icon {
          width: 36px;
          height: 36px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          background: rgba(232, 103, 58, 0.08);
        }

        .admin-action-card h2 {
          margin: 0;
          color: var(--maroon);
          font-family: var(--font-playfair);
          font-size: clamp(24px, 3vw, 32px);
          line-height: 1.14;
          letter-spacing: 0;
        }

        .admin-action-card p {
          margin: 14px 0 24px;
          color: var(--text-muted);
          font-size: 14px;
          line-height: 1.7;
          flex-grow: 1;
        }

        .card-action {
          width: fit-content;
          min-height: 42px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: auto;
          padding: 0 16px;
          border-radius: 10px;
          background: var(--maroon);
          color: #fff;
          border: 1.5px solid var(--maroon);
          font-weight: 800;
          text-decoration: none;
          transition: background .16s ease, color .16s ease;
        }

        .card-action.outline {
          background: transparent;
          color: var(--maroon);
        }

        .card-action:hover {
          background: #6f1432;
          color: #fff;
        }

        .card-action.outline:hover {
          background: rgba(139, 28, 63, 0.08);
          color: var(--maroon);
        }

        @media (max-width: 980px) {
          .admin-action-card {
            min-height: 0;
          }
        }
      `}</style>
    </div>
  );
}

function LandingFeature({ title, desc, img, reverse = false }: any) {
  return (
    <div className="feature-section" style={{ padding: '120px 60px', display: 'flex', alignItems: 'center', gap: '80px', flexWrap: 'wrap', background: reverse ? 'var(--cream)' : '#fff', flexDirection: reverse ? 'row-reverse' : 'row', position: 'relative', overflow: 'hidden' }}>
      <div style={{ flex: 1, minWidth: '300px', position: 'relative', zIndex: 2 }}>
        <img src={img} alt={title} style={{ width: '100%', borderRadius: reverse ? '30px 0 30px 30px' : '30px 30px 0 30px', border: '8px solid #fff', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }} />
      </div>
      <div style={{ flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '24px', zIndex: 2 }}>
        <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '48px', fontWeight: 900, color: 'var(--maroon)', lineHeight: 1.1 }}>{title}</h2>
        <p style={{ fontSize: '16px', color: 'var(--text-muted)', lineHeight: 1.7 }}>{desc}</p>
        <Link href="/login" className="btn btn-primary">Masuk untuk Mengelola</Link>
      </div>
    </div>
  );
}

function FeedbackBubble({ name, role, text, dark = false }: any) {
  return (
    <div className={`feedback-bubble ${dark ? 'bubble-dark' : 'bubble-white'}`} style={{ 
      background: dark ? 'linear-gradient(135deg, #7A1434, #4D0A1E)' : '#fff', 
      color: dark ? '#fff' : 'inherit',
      borderRadius: dark ? '32px 32px 8px 32px' : '32px 32px 32px 8px', 
      padding: '32px', 
      boxShadow: dark ? '0 35px 80px rgba(0,0,0,0.3)' : '0 25px 60px rgba(139,28,63,0.12)', 
      width: '90%', 
      alignSelf: dark ? 'flex-end' : 'flex-start'
    }}>
      <div style={{ display: 'flex', gap: '18px', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: dark ? 'rgba(255,255,255,0.15)' : 'linear-gradient(135deg, #E8673A, #8B1C3F)', display: 'flex', alignItems: 'center', color: dark ? 'var(--gold)' : '#fff', fontWeight: 900, fontSize: '26px', border: dark ? '1px solid rgba(255,255,255,0.2)' : 'none', boxShadow: dark ? 'none' : '0 10px 25px rgba(232,103,58,0.4)', justifyContent: 'center' }}>
          {name[0]}
        </div>
        <div>
          <div style={{ fontWeight: 900, fontSize: '18px', color: dark ? '#fff' : 'var(--maroon)', marginBottom: '2px' }}>{name}</div>
          <div style={{ fontSize: '13px', color: dark ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.5px' }}>{role}</div>
        </div>
      </div>
      <div style={{ fontSize: '16px', lineHeight: 1.7, fontStyle: 'italic' }}>"{text}"</div>
    </div>
  );
}
