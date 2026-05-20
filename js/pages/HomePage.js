import Component from '../core/Component.js';
import Footer from '../components/Footer.js';

export default class HomePage extends Component {
  constructor() {
    super('page-home');
  }

  render() {
    const isAuth = window.app.services.auth ? window.app.services.auth.isAuthenticated() : false;
    const user = window.app.services.auth ? window.app.services.auth.currentUser : null;
    const isAdminPusat = user && user.role === 'admin_pusat';
    const isAdminSekolah = user && user.role === 'admin_sekolah';
    const isUserUmum = user && user.role === 'user_umum';
    const isAdmin = user && (user.role === 'admin_pusat' || user.role === 'admin_sekolah');

    const responsiveStyles = `
      <style>
        .home-section { padding: 88px 60px 44px; }
        .home-card-inner { padding: 56px 54px; }
        .hero-title { font-size: 56px; line-height: 1.05; }
        .hero-desc { font-size: 16px; margin-bottom: 28px; max-width: 560px; }
        .badge-card { min-width: 240px; flex: 1; max-width: 320px; padding: 24px 22px; }
        .grid-container { grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }

        @media (max-width: 860px) {
          .home-section { padding: 40px 20px 20px !important; }
          .home-card-inner { padding: 32px 24px !important; border-radius: 24px !important; }
          .hero-title { font-size: 32px !important; margin-bottom: 12px !important; }
          .hero-desc { font-size: 14px !important; line-height: 1.6 !important; margin-bottom: 24px !important; }
          .hero-btns { gap: 10px !important; }
          .hero-btns .btn { width: 100% !important; padding: 12px 20px !important; }
          .badge-card { min-width: 100% !important; margin-top: 20px !important; }
        }
      </style>
    `;

    if (isAdminPusat) {
      return `
        ${responsiveStyles}
        <div style="background:var(--cream);min-height:100vh;display:flex;flex-direction:column;position:relative;overflow:hidden;">
          <div style="position:absolute;top:-120px;right:-120px;width:380px;height:380px;background:radial-gradient(circle, rgba(244,198,98,0.24), transparent 72%);border-radius:50%;"></div>
          <div style="position:absolute;bottom:-160px;left:-120px;width:420px;height:420px;background:radial-gradient(circle, rgba(139,28,63,0.10), transparent 72%);border-radius:50%;"></div>

          <section class="home-section" style="position:relative;z-index:2;">
            <div class="home-card-inner" style="max-width:1100px;margin:0 auto;background:linear-gradient(135deg, #7A1434, #4D0A1E);border-radius:30px;color:#fff;box-shadow:0 28px 70px rgba(77,10,30,0.28);">
              <div style="display:flex;justify-content:space-between;gap:28px;align-items:flex-start;flex-wrap:wrap;">
                <div style="flex:2;min-width:300px;">
                  <div style="font-size:13px;letter-spacing:1.2px;text-transform:uppercase;opacity:0.8;font-weight:700;margin-bottom:14px;">Panel Admin Pusat</div>
                  <h1 class="hero-title" style="font-family:'Playfair Display',serif;margin:0;">Selamat datang, ${Component.escapeHTML(user.name || 'Admin Pusat')}.</h1>
                  <p class="hero-desc" style="opacity:0.92;margin-top:16px;">Anda sudah masuk ke area internal GiziKita. Dari sini Anda bisa meninjau pendaftaran sekolah, memantau umpan balik masyarakat, dan membuka panel persetujuan akun admin sekolah.</p>
                  <div class="hero-btns" style="display:flex;gap:14px;flex-wrap:wrap;">
                    <button class="btn btn-primary" data-page="profile" style="padding:15px 28px;background:#F4C662;color:#4D0A1E;box-shadow:none;">Buka Panel Admin</button>
                    <button class="btn btn-outline" data-page="feedback" style="padding:15px 28px;border-color:rgba(255,255,255,0.6);color:#fff;">Tinjau Umpan Balik</button>
                  </div>
                </div>
                <div class="badge-card" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:22px;backdrop-filter:blur(8px);">
                  <div style="font-size:13px;opacity:0.8;margin-bottom:8px;">Peran Aktif</div>
                  <div style="font-size:26px;font-weight:800;margin-bottom:8px;">Admin Pusat</div>
                  <div style="font-size:14px;line-height:1.6;opacity:0.88;">Akses ini dipakai untuk verifikasi akun, audit sekolah, dan tindak lanjut laporan dari masyarakat.</div>
                </div>
              </div>
            </div>
          </section>

          <section style="padding:0 60px 40px;position:relative;z-index:2;">
            <div style="max-width:1100px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fit, minmax(240px, 1fr));gap:22px;">
              <div class="card" style="padding:28px;">
                <div style="font-size:12px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:var(--coral);margin-bottom:10px;">Persetujuan</div>
                <h2 style="font-family:'Playfair Display',serif;font-size:30px;margin:0 0 10px;color:var(--maroon);">Kelola Pendaftaran Admin Sekolah</h2>
                <p style="font-size:14px;line-height:1.7;color:var(--text-muted);margin:0 0 18px;">Buka tabel persetujuan akun dan verifikasi pendaftar yang masih menunggu tinjauan pusat.</p>
                <button class="btn btn-primary" data-page="profile">Buka Persetujuan</button>
              </div>

              <div class="card" style="padding:28px;">
                <div style="font-size:12px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:var(--coral);margin-bottom:10px;">Pengawasan</div>
                <h2 style="font-family:'Playfair Display',serif;font-size:30px;margin:0 0 10px;color:var(--maroon);">Pantau Sekolah Terdaftar</h2>
                <p style="font-size:14px;line-height:1.7;color:var(--text-muted);margin:0 0 18px;">Periksa data sekolah penerima, status, dan gambaran distribusi yang sudah tercatat di sistem.</p>
                <button class="btn btn-outline" data-page="school-list">Lihat Daftar Sekolah</button>
              </div>

              <div class="card" style="padding:28px;">
                <div style="font-size:12px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:var(--coral);margin-bottom:10px;">Tindak Lanjut</div>
                <h2 style="font-family:'Playfair Display',serif;font-size:30px;margin:0 0 10px;color:var(--maroon);">Balas Umpan Balik Publik</h2>
                <p style="font-size:14px;line-height:1.7;color:var(--text-muted);margin:0 0 18px;">Masuk ke pusat umpan balik untuk membaca laporan masyarakat dan kirim pembaruan resmi.</p>
                <button class="btn btn-outline" data-page="feedback">Buka Umpan Balik</button>
              </div>
            </div>
          </section>

          <section style="padding:0 60px 120px;position:relative;z-index:2;">
            <div style="max-width:1100px;margin:0 auto;background:#fff;border-radius:26px;padding:34px 34px 30px;box-shadow:0 20px 50px rgba(139,28,63,0.10);display:flex;justify-content:space-between;gap:24px;flex-wrap:wrap;align-items:center;">
              <div style="max-width:640px;">
                <h3 style="font-family:'Playfair Display',serif;font-size:34px;margin:0 0 10px;color:var(--text);">Butuh akses cepat ke panel utama?</h3>
                <p style="font-size:15px;line-height:1.7;color:var(--text-muted);margin:0;">Masuk ke halaman profil admin untuk melihat tabel persetujuan akun dan akses kontrol yang memang khusus untuk admin pusat.</p>
              </div>
              <button class="btn btn-primary" data-page="profile" style="padding:15px 28px;">Masuk ke Profil Admin</button>
            </div>
          </section>

          ${Footer.render()}
        </div>
      `;
    }

    if (isAdminSekolah) {
      return `
        ${responsiveStyles}
        <div style="background:var(--cream);min-height:100vh;display:flex;flex-direction:column;position:relative;overflow:hidden;">
          <div style="position:absolute;top:-120px;right:-120px;width:380px;height:380px;background:radial-gradient(circle, rgba(232,103,58,0.18), transparent 72%);border-radius:50%;"></div>
          <div style="position:absolute;bottom:-180px;left:-140px;width:440px;height:440px;background:radial-gradient(circle, rgba(139,28,63,0.10), transparent 72%);border-radius:50%;"></div>

          <section class="home-section" style="position:relative;z-index:2;">
            <div class="home-card-inner" style="max-width:1100px;margin:0 auto;background:linear-gradient(135deg, #FFF4E8, #FFE7D2);border-radius:30px;box-shadow:0 24px 60px rgba(139,28,63,0.10);border:1px solid rgba(139,28,63,0.08);">
              <div style="display:flex;justify-content:space-between;gap:28px;align-items:flex-start;flex-wrap:wrap;">
                <div style="flex:2;min-width:300px;">
                  <div style="font-size:13px;letter-spacing:1.2px;text-transform:uppercase;color:var(--coral);font-weight:800;margin-bottom:14px;">Dashboard Admin Sekolah</div>
                  <h1 class="hero-title" style="font-family:'Playfair Display',serif;margin:0;color:var(--maroon);">Selamat datang, ${Component.escapeHTML(user.name || 'Admin Sekolah')}.</h1>
                  <p class="hero-desc" style="color:var(--text-muted);margin-top:16px;">Anda sudah masuk ke area operasional sekolah. Dari sini Anda bisa mencatat distribusi, meninjau menu, dan memantau status akun instansi Anda.</p>
                  <div class="hero-btns" style="display:flex;gap:14px;flex-wrap:wrap;">
                    <button class="btn btn-primary" data-page="distribusi" style="padding:15px 28px;">Buka Laporan Distribusi</button>
                    <button class="btn btn-outline" data-page="profile" style="padding:15px 28px;">Buka Profil Instansi</button>
                  </div>
                </div>
                <div class="badge-card" style="background:#fff;border:1px solid rgba(139,28,63,0.08);border-radius:22px;">
                  <div style="font-size:13px;color:var(--text-muted);margin-bottom:8px;">Instansi Aktif</div>
                  <div style="font-size:24px;font-weight:800;color:var(--maroon);margin-bottom:8px;">${Component.escapeHTML(user.instansi || user.schoolName || 'Instansi Sekolah')}</div>
                  <div style="font-size:14px;line-height:1.6;color:var(--text-muted);">${user.isApproved ? 'Akun Anda sudah aktif dan siap dipakai untuk pelaporan.' : 'Akun Anda masih menunggu persetujuan admin pusat untuk akses penuh.'}</div>
                </div>
              </div>
            </div>
          </section>

          <section style="padding:0 60px 40px;position:relative;z-index:2;">
            <div style="max-width:1100px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fit, minmax(240px, 1fr));gap:22px;">
              <div class="card" style="padding:28px;">
                <div style="font-size:12px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:var(--coral);margin-bottom:10px;">Operasional</div>
                <h2 style="font-family:'Playfair Display',serif;font-size:30px;margin:0 0 10px;color:var(--maroon);">Catat Distribusi Harian</h2>
                <p style="font-size:14px;line-height:1.7;color:var(--text-muted);margin:0 0 18px;">Isi laporan penerimaan makanan, jumlah porsi, dan dokumentasi distribusi di sekolah Anda.</p>
                <button class="btn btn-primary" data-page="distribusi">Isi Laporan Sekarang</button>
              </div>

              <div class="card" style="padding:28px;">
                <div style="font-size:12px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:var(--coral);margin-bottom:10px;">Referensi</div>
                <h2 style="font-family:'Playfair Display',serif;font-size:30px;margin:0 0 10px;color:var(--maroon);">Tinjau Menu Mingguan</h2>
                <p style="font-size:14px;line-height:1.7;color:var(--text-muted);margin:0 0 18px;">Lihat susunan menu yang sedang berjalan agar operasional sekolah selaras dengan jadwal distribusi.</p>
                <button class="btn btn-outline" data-page="menu">Lihat Menu</button>
              </div>

              <div class="card" style="padding:28px;">
                <div style="font-size:12px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:var(--coral);margin-bottom:10px;">Status Akun</div>
                <h2 style="font-family:'Playfair Display',serif;font-size:30px;margin:0 0 10px;color:var(--maroon);">Kelola Profil Instansi</h2>
                <p style="font-size:14px;line-height:1.7;color:var(--text-muted);margin:0 0 18px;">Periksa identitas akun sekolah Anda dan pantau apakah akun sudah disetujui untuk akses penuh.</p>
                <button class="btn btn-outline" data-page="profile">Buka Profil</button>
              </div>
            </div>
          </section>

          <section style="padding:0 60px 120px;position:relative;z-index:2;">
            <div style="max-width:1100px;margin:0 auto;background:#fff;border-radius:26px;padding:34px 34px 30px;box-shadow:0 20px 50px rgba(139,28,63,0.10);display:flex;justify-content:space-between;gap:24px;flex-wrap:wrap;align-items:center;">
              <div style="max-width:640px;">
                <h3 style="font-family:'Playfair Display',serif;font-size:34px;margin:0 0 10px;color:var(--text);">Butuh kirim aspirasi atau minta bantuan?</h3>
                <p style="font-size:15px;line-height:1.7;color:var(--text-muted);margin:0;">Anda tetap bisa membuka pusat umpan balik dan halaman bantuan kapan saja dari navbar untuk berkomunikasi dengan tim pusat.</p>
              </div>
              <div style="display:flex;gap:12px;flex-wrap:wrap;">
                <button class="btn btn-outline" data-page="feedback" style="padding:15px 24px;">Buka Umpan Balik</button>
                <button class="btn btn-primary" data-page="help" style="padding:15px 24px;">Buka Bantuan</button>
              </div>
            </div>
          </section>

          ${Footer.render()}
        </div>
      `;
    }

    if (isUserUmum) {
      return `
        ${responsiveStyles}
        <div style="background:var(--cream);min-height:100vh;display:flex;flex-direction:column;position:relative;overflow:hidden;">
          <div style="position:absolute;top:-100px;right:-100px;width:360px;height:360px;background:radial-gradient(circle, rgba(244,198,98,0.20), transparent 70%);border-radius:50%;"></div>
          <div style="position:absolute;bottom:-160px;left:-120px;width:420px;height:420px;background:radial-gradient(circle, rgba(232,103,58,0.10), transparent 72%);border-radius:50%;"></div>

          <section class="home-section" style="position:relative;z-index:2;">
            <div class="home-card-inner" style="max-width:1100px;margin:0 auto;background:linear-gradient(135deg, #FFFFFF, #FFF8EF);border-radius:30px;box-shadow:0 24px 60px rgba(139,28,63,0.10);border:1px solid rgba(139,28,63,0.08);">
              <div style="display:flex;justify-content:space-between;gap:28px;align-items:flex-start;flex-wrap:wrap;">
                <div style="flex:2;min-width:300px;">
                  <div style="font-size:13px;letter-spacing:1.2px;text-transform:uppercase;color:var(--coral);font-weight:800;margin-bottom:14px;">Beranda Pengguna</div>
                  <h1 class="hero-title" style="font-family:'Playfair Display',serif;margin:0;color:var(--maroon);">Halo, ${Component.escapeHTML(user.name || 'Pengguna GiziKita')}.</h1>
                  <p class="hero-desc" style="color:var(--text-muted);margin-top:16px;">Anda sudah masuk. Dari sini Anda bisa memantau menu bergizi, membaca informasi sekolah, dan mengirim umpan balik ke tim GiziKita.</p>
                  <div class="hero-btns" style="display:flex;gap:14px;flex-wrap:wrap;">
                    <button class="btn btn-primary" data-page="menu" style="padding:15px 28px;">Lihat Menu Makanan</button>
                    <button class="btn btn-outline" data-page="feedback" style="padding:15px 28px;">Kirim Umpan Balik</button>
                  </div>
                </div>
                <div class="badge-card" style="background:#fff;border:1px solid rgba(139,28,63,0.08);border-radius:22px;">
                  <div style="font-size:13px;color:var(--text-muted);margin-bottom:8px;">Akses Aktif</div>
                  <div style="font-size:24px;font-weight:800;color:var(--maroon);margin-bottom:8px;">Masyarakat Umum</div>
                  <div style="font-size:14px;line-height:1.6;color:var(--text-muted);">Gunakan akses ini untuk memantau program, mencari bantuan, dan mengirimkan masukan secara langsung.</div>
                </div>
              </div>
            </div>
          </section>

          <section style="padding:0 60px 40px;position:relative;z-index:2;">
            <div style="max-width:1100px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fit, minmax(240px, 1fr));gap:22px;">
              <div class="card" style="padding:28px;">
                <div style="font-size:12px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:var(--coral);margin-bottom:10px;">Gizi</div>
                <h2 style="font-family:'Playfair Display',serif;font-size:30px;margin:0 0 10px;color:var(--maroon);">Lihat Menu Mingguan</h2>
                <p style="font-size:14px;line-height:1.7;color:var(--text-muted);margin:0 0 18px;">Pantau makanan yang sedang disiapkan dan pelajari manfaat gizinya untuk anak-anak.</p>
                <button class="btn btn-primary" data-page="menu">Buka Menu</button>
              </div>

              <div class="card" style="padding:28px;">
                <div style="font-size:12px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:var(--coral);margin-bottom:10px;">Transparansi</div>
                <h2 style="font-family:'Playfair Display',serif;font-size:30px;margin:0 0 10px;color:var(--maroon);">Cek Sekolah Terdaftar</h2>
                <p style="font-size:14px;line-height:1.7;color:var(--text-muted);margin:0 0 18px;">Lihat daftar sekolah yang sudah masuk dalam sistem program makan bergizi gratis.</p>
                <button class="btn btn-outline" data-page="school-list">Lihat Sekolah</button>
              </div>

              <div class="card" style="padding:28px;">
                <div style="font-size:12px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:var(--coral);margin-bottom:10px;">Aspirasi</div>
                <h2 style="font-family:'Playfair Display',serif;font-size:30px;margin:0 0 10px;color:var(--maroon);">Sampaikan Masukan</h2>
                <p style="font-size:14px;line-height:1.7;color:var(--text-muted);margin:0 0 18px;">Berikan saran, keluhan, atau apresiasi Anda agar layanan terus membaik.</p>
                <button class="btn btn-outline" data-page="feedback">Buka Umpan Balik</button>
              </div>
            </div>
          </section>

          <section style="padding:0 60px 120px;position:relative;z-index:2;">
            <div style="max-width:1100px;margin:0 auto;background:#fff;border-radius:26px;padding:34px 34px 30px;box-shadow:0 20px 50px rgba(139,28,63,0.10);display:flex;justify-content:space-between;gap:24px;flex-wrap:wrap;align-items:center;">
              <div style="max-width:640px;">
                <h3 style="font-family:'Playfair Display',serif;font-size:34px;margin:0 0 10px;color:var(--text);">Perlu panduan cepat?</h3>
                <p style="font-size:15px;line-height:1.7;color:var(--text-muted);margin:0;">Masuk ke halaman bantuan untuk bertanya tentang menu, sekolah, atau penggunaan aplikasi GiziKita.</p>
              </div>
              <button class="btn btn-primary" data-page="help" style="padding:15px 28px;">Buka Bantuan</button>
            </div>
          </section>

          ${Footer.render()}
        </div>
      `;
    }
    
    return `
      ${responsiveStyles}
      <style>
        @media (max-width: 860px) {
          .hero-content { padding: 60px 20px !important; }
          .hero-content h1 { font-size: 40px !important; }
          .hero-content p { font-size: 14px !important; }
          .feature-section { padding: 60px 20px !important; gap: 40px !important; }
          .feature-section h2 { font-size: 32px !important; }
        }
      </style>
      <!-- Hero -->
      <div class="hero" style="position:relative; min-height:500px; display:flex; align-items:center; overflow:hidden;">
        <img class="hero-img" src="/Assets/landing-page1.jpg" alt="Makanan Bergizi"
             style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover; object-position:center; z-index:1;"/>
        <div class="hero-bg" style="position:absolute; inset:0; background:linear-gradient(120deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.1) 70%); z-index:2;"></div>
        
        <div class="hero-content" style="position:relative; z-index:3; padding:100px 60px; max-width:700px; color:#fff; animation:fadeUp .7s ease both;">
          <h1 style="font-family:'Playfair Display',serif; font-size:64px; font-weight:900; line-height:1.05; margin-bottom:24px; text-shadow:0 2px 12px rgba(0,0,0,0.3);">Selamat Datang!</h1>
          <p style="font-size:16px; line-height:1.7; opacity:0.92; margin-bottom:32px; max-width:550px;">
            Setiap anak Indonesia berhak mendapatkan makanan bergizi melalui sistem yang transparan dan efisien. Dengan sistem ini, pendaftaran sekolah menjadi lebih mudah dan distribusi makanan lebih merata.
          </p>
          ${isAuth ? `
            <button class="btn btn-primary" data-page="register-school" style="padding:16px 36px; box-shadow:0 10px 20px rgba(139,28,63,0.3);">Daftarkan Sekolah</button>
          ` : `
            <div style="display:flex; gap:16px; flex-wrap:wrap;">
              <button class="btn btn-primary" data-page="signup" style="padding:16px 36px; box-shadow:0 10px 20px rgba(139,28,63,0.3);">Daftar Sekarang</button>
              <button class="btn btn-outline" data-page="login" style="padding:16px 36px; color:#fff; border-color:rgba(255,255,255,0.6);">Masuk</button>
            </div>
          `}
        </div>
      </div>

      <!-- Feature 1: Pendataan -->
      <div class="feature-section" style="padding:120px 60px; display:flex; align-items:center; gap:80px; flex-wrap:wrap; background:#fff; position:relative; overflow:hidden;">
        <div style="flex:1; min-width:300px; position:relative; z-index:2;">
          <img src="/Assets/landing-page2.jpg" alt="Pendaftaran Sekolah"
               style="width:100%; border-radius:30px 30px 0 30px; border:8px solid #fff; box-shadow:0 20px 50px rgba(0,0,0,0.1);"/>
        </div>
        <div style="flex:1; min-width:300px; display:flex; flex-direction:column; gap:24px; z-index:2;">
          <h2 style="font-family:'Playfair Display',serif; font-size:48px; font-weight:900; color:var(--maroon); line-height:1.1;">Pendataan Sekolah<br/>Cepat & Akurat</h2>
          <p style="font-size:16px; color:var(--text-muted); line-height:1.7;">
            Proses pendaftaran sekolah kini lebih terintegrasi. Pastikan setiap sekolah mendapatkan hak distribusinya secara tepat waktu.
          </p>
          ${isAuth ? `
            <button class="btn btn-primary" data-page="register-school" style="width:fit-content; background:var(--maroon);">Kelola Sekarang</button>
          ` : `
            <button class="btn btn-primary" data-page="login" style="width:fit-content; background:var(--maroon);">Masuk untuk Mengelola</button>
          `}
        </div>
      </div>

      <!-- Feature 2: Menu Sehat -->
      <div class="feature-section" style="padding:120px 60px; display:flex; align-items:center; gap:80px; flex-wrap:wrap; background:var(--cream); flex-direction: row-reverse; position:relative; overflow:hidden;">
        <div style="flex:1; min-width:300px; position:relative; z-index:2;">
          <img src="/Assets/landing-page3.jpg" alt="Menu Sehat"
               style="width:100%; border-radius:30px 0 30px 30px; border:8px solid #fff; box-shadow:0 20px 50px rgba(0,0,0,0.1);"/>
        </div>
        <div style="flex:1; min-width:300px; display:flex; flex-direction:column; gap:24px; z-index:2;">
          <h2 style="font-family:'Playfair Display',serif; font-size:48px; font-weight:900; color:var(--maroon); line-height:1.1;">Menu Sehat<br/>Setiap Hari</h2>
          <p style="font-size:16px; color:var(--text-muted); line-height:1.7;">
            Asupan gizi seimbang adalah prioritas kami. Lihat daftar menu mingguan yang telah dirancang khusus untuk pertumbuhan anak.
          </p>
          ${isAuth ? `
            <button class="btn btn-primary" data-page="menu" style="width:fit-content; background:var(--maroon);">Lihat Menu Mingguan</button>
          ` : `
            <button class="btn btn-primary" data-page="login" style="width:fit-content; background:var(--maroon);">Masuk untuk Melihat Menu</button>
          `}
        </div>
      </div>

      <!-- Feature 3: Pantau Distribusi -->
      <div style="background:#fff; padding:120px 60px; display:flex; align-items:center; gap:80px; flex-wrap:wrap;">
        <div style="flex:1; min-width:300px; position:relative;">
           <div style="width:100%; aspect-ratio:1/1; border-radius:50% 50% 0 50%; overflow:hidden; border:10px solid #fff; box-shadow:0 25px 60px rgba(139,28,63,0.12);">
              <img src="/Assets/distribution.png" alt="Distribusi" style="width:100%; height:100%; object-fit:cover;"/>
           </div>
        </div>
        <div style="flex:1; min-width:300px; display:flex; flex-direction:column; gap:24px;">
           <h2 style="font-family:'Playfair Display',serif; font-size:48px; font-weight:900; color:var(--text); line-height:1.1;">
             ${isAdmin ? 'Pantau & Atur<br/>Distribusi' : 'Pantau<br/>Distribusi'}
           </h2>
           <p style="color:var(--text-muted); font-size:16px; line-height:1.7;">
             Pantau setiap tahapan distribusi makanan ke sekolah-sekolah di seluruh Nusantara dengan transparansi penuh.
           </p>
           <div style="display:flex; flex-wrap:wrap; gap:12px;">
              <button class="btn btn-primary" style="background:var(--maroon); box-shadow:0 10px 25px rgba(139,28,63,0.2);" data-page="school-list">Cek Sekolah Terdaftar</button>
              ${isAdmin ? `
                <button class="btn btn-outline" style="border-color:var(--maroon); color:var(--maroon);" data-page="distribusi">Kelola Laporan Distribusi</button>
              ` : ''}
           </div>
        </div>
      </div>

      <!-- Feature 4: Dengar Suara Masyarakat (Premium Overlap Version) -->
      <div style="background:var(--cream); padding:140px 60px; display:flex; align-items:center; gap:100px; flex-wrap:wrap; position:relative; overflow:hidden;">
        
        <!-- Premium Decorations -->
        <div style="position:absolute; top:-100px; right:-100px; width:400px; height:400px; background:radial-gradient(circle, rgba(244,198,98,0.15), transparent 70%); border-radius:50%; z-index:1;"></div>
        
        <div style="flex:1; min-width:300px; display:flex; flex-direction:column; gap:32px; align-items:flex-start; z-index:2;">
           <h2 style="font-family:'Playfair Display',serif; font-size:52px; font-weight:900; color:var(--text); line-height:1.1; margin:0;">Dengar Suara<br/>Masyarakat!</h2>
           <p style="color:var(--text-muted); font-size:17px; max-width:420px; line-height:1.8; margin:0;">Umpan balik Anda adalah energi bagi kami untuk terus memberikan pelayanan terbaik.</p>
           <button class="btn btn-primary" style="min-width:240px; background:var(--maroon); box-shadow:0 10px 25px rgba(139,28,63,0.25);" data-page="feedback">Lihat Semua Umpan Balik</button>
        </div>
        
        <div style="flex:1; min-width:300px; display:flex; justify-content:center; align-items:center; position:relative; z-index:2;">
           <div style="width:100%; max-width:500px; display:flex; flex-direction:column; gap:32px;">
              
              <!-- Floating Bubble 1 (White - Staggered Left) -->
              <div class="feedback-bubble bubble-white" style="background:#fff; border-radius:32px 32px 32px 8px; padding:32px; box-shadow:0 25px 60px rgba(139,28,63,0.12); width:90%; align-self:flex-start; transform:translateY(0); transition:all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); animation: float 6s ease-in-out infinite;">
                 <div style="display:flex; gap:18px; align-items:center; margin-bottom:20px;">
                    <div style="width:60px; height:60px; border-radius:50%; background:linear-gradient(135deg, #E8673A, #8B1C3F); display:flex; align-items:center; justify-content:center; color:#fff; font-weight:900; font-size:26px; box-shadow:0 10px 25px rgba(232,103,58,0.4);">I</div>
                    <div>
                       <div style="font-weight:900; font-size:18px; color:var(--maroon); margin-bottom:2px;">Ibu Ratna</div>
                       <div style="font-size:13px; color:var(--text-muted); font-weight:700; letter-spacing:0.5px;">Wali Murid SDN 01</div>
                    </div>
                 </div>
                 <div style="font-size:16px; line-height:1.7; color:var(--text); font-weight:500; font-style:italic;">"Menu bergizi hari ini sangat baik, anak saya jadi lebih semangat belajar di sekolah!"</div>
              </div>

              <!-- Floating Bubble 2 (Dark Maroon - Staggered Right) -->
              <div class="feedback-bubble bubble-dark" style="background:linear-gradient(135deg, #7A1434, #4D0A1E); color:#fff; border-radius:32px 32px 8px 32px; padding:32px; box-shadow:0 35px 80px rgba(0,0,0,0.3); width:90%; align-self:flex-end; transform:translateY(0); transition:all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); animation: float 5s ease-in-out infinite reverse;">
                 <div style="display:flex; gap:18px; align-items:center; margin-bottom:20px;">
                    <div style="width:60px; height:60px; border-radius:50%; background:rgba(255,255,255,0.15); display:flex; align-items:center; justify-content:center; font-weight:900; font-size:26px; color:var(--gold); border:1px solid rgba(255,255,255,0.2);">G</div>
                    <div>
                       <div style="font-weight:900; font-size:18px; margin-bottom:2px; letter-spacing:1px;">Tim GiziKita</div>
                       <div style="font-size:13px; opacity:0.8; font-weight:700; letter-spacing:0.5px;">Admin Pusat</div>
                    </div>
                 </div>
                 <div style="font-size:16px; line-height:1.7; opacity:0.95; font-weight:400;">"Terima kasih Ibu! Kami akan terus memantau kualitas distribusi gizi secara berkala."</div>
              </div>
           </div>
        </div>
      </div>

      <style>
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        .feedback-bubble:hover {
          transform: scale(1.05) translateY(-10px) !important;
          z-index: 10 !important;
        }
        .bubble-white:hover {
          box-shadow: 0 50px 100px rgba(139,28,63,0.2) !important;
        }
        .bubble-dark:hover {
          box-shadow: 0 50px 100px rgba(0,0,0,0.5) !important;
        }
      </style>
      ${Footer.render()}
    `;
  }

  afterMount() {
    if (window.lucide) window.lucide.createIcons();
  }
}
