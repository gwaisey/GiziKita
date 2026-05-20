import AuthService from './AuthService';

class TourService {
  constructor() {
    this.currentStep = 0;
    this.overlay = null;
    this.spotlight = null;
    this.card = null;
    this.activeSteps = [];
  }

  canAccessTutorial() {
    const user = AuthService.currentUser;
    return Boolean(
      user &&
      AuthService.isAuthenticated() &&
      typeof user.username === 'string' &&
      user.username.trim() !== ''
    );
  }

  getTutorialAudienceLabel() {
    const user = AuthService.currentUser;
    if (!this.canAccessTutorial()) return '';

    return (user.role === 'admin_pusat' || user.role === 'admin_sekolah')
      ? 'Lihat tutorial admin sesuai fitur pengelolaan sekolah dan distribusi.'
      : 'Lihat tutorial orang tua dan masyarakat untuk memantau menu, bantuan, dan umpan balik.';
  }

  getSteps(role) {
    const common = [
      {
        element: '.nav-logo',
        title: '🏠 Beranda (Halaman Depan)',
        content: 'Klik logo ini kapan saja untuk kembali ke halaman paling depan.',
      }
    ];

    const parentSteps = [
      ...common,
      {
        element: 'a[data-page="menu"]',
        title: '🍱 Menu Makanan',
        content: 'Klik di sini untuk melihat daftar makanan bergizi yang akan dibagikan minggu ini.',
      },
      {
        element: 'a[data-page="feedback"]',
        title: '💬 Kirim Saran',
        content: 'Punya saran atau keluhan? Klik di sini untuk berbicara langsung dengan kami.',
      },
      {
        element: 'a[data-page="help"]',
        title: '🤖 Tanya GiziBot',
        content: 'Jika bingung, klik di sini untuk bertanya pada GiziBot, asisten pintar kami.',
      },
      {
        element: '#nav-profile-icon',
        title: '👤 Profil & Keluar',
        content: 'Di sini Anda bisa melihat data diri atau keluar (Logout) dari aplikasi.',
      }
    ];

    const adminSteps = [
      ...common,
      {
        element: 'a[data-page="register-school"]',
        title: '📝 Daftar Sekolah',
        content: 'Klik di sini untuk mendaftarkan sekolah baru ke dalam sistem.',
      },
      {
        element: 'a[data-page="menu"]',
        title: '🍱 Menu Makanan',
        content: 'Lihat daftar menu mingguan yang sedang berjalan.',
      },
      {
        element: 'a[data-page="feedback"]',
        title: '💬 Kotak Saran',
        content: 'Pantau saran dari masyarakat dan balas pesan mereka di sini.',
      },
      {
        element: '#nav-profile-icon',
        title: '👤 Profil & Keluar',
        content: 'Klik di sini untuk pengaturan akun atau keluar.',
      }
    ];

    return (role === 'admin_pusat' || role === 'admin_sekolah') ? adminSteps : parentSteps;
  }

   start(force = false) {
     const user = AuthService.currentUser;
     if (!this.canAccessTutorial()) return;

     if (this.overlay && !force) return;
     if (force) this.finish();

     // Check if already finished
     if (!force && localStorage.getItem(`gizikita_tour_done_${user.username}`)) return;

     // Only on Desktop/Large Screen for better visibility
     if (window.innerWidth < 860) return;

     this.activeSteps = this.getSteps(user.role);
     this.currentStep = 0;
     this._createOverlay();
     this._showStep();
   }

  _createOverlay() {
    if (this.overlay) return;

    this.overlay = document.createElement('div');
    this.overlay.id = 'tour-overlay';
    this.overlay.style.cssText = `
      position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 9999;
      pointer-events: auto; display: flex; flex-direction: column;
      align-items: center; justify-content: center; transition: opacity 0.3s;
    `;

    this.spotlight = document.createElement('div');
    this.spotlight.id = 'tour-spotlight';
    this.spotlight.style.cssText = `
      position: absolute; border-radius: 12px;
      box-shadow: 0 0 0 9999px rgba(0,0,0,0.7);
      transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      pointer-events: none; z-index: 10000;
    `;

    this.card = document.createElement('div');
    this.card.id = 'tour-card';
    this.card.style.cssText = `
      position: absolute; background: #fff; padding: 28px; border-radius: 20px;
      width: 340px; box-shadow: 0 20px 60px rgba(0,0,0,0.4);
      z-index: 10001; transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex; flex-direction: column; gap: 16px; border: 2px solid var(--maroon);
    `;

    document.body.appendChild(this.overlay);
    document.body.appendChild(this.spotlight);
    document.body.appendChild(this.card);
  }

  _showStep() {
    const step = this.activeSteps[this.currentStep];
    const el = document.querySelector(step.element);

    if (!el) {
      this._next();
      return;
    }

    const rect = el.getBoundingClientRect();
    const padding = 10;

    this.spotlight.style.top = `${rect.top - padding}px`;
    this.spotlight.style.left = `${rect.left - padding}px`;
    this.spotlight.style.width = `${rect.width + (padding * 2)}px`;
    this.spotlight.style.height = `${rect.height + (padding * 2)}px`;

    let cardTop = rect.bottom + 25;
    let cardLeft = rect.left + (rect.width / 2) - 170;

    if (cardLeft < 20) cardLeft = 20;
    if (cardLeft + 340 > window.innerWidth - 20) cardLeft = window.innerWidth - 360;
    if (cardTop + 200 > window.innerHeight) cardTop = rect.top - 200;

    this.card.style.top = `${cardTop}px`;
    this.card.style.left = `${cardLeft}px`;

    this.card.innerHTML = `
      <div>
        <div style="font-family:'Playfair Display',serif; font-size:22px; font-weight:900; color:var(--maroon); margin-bottom:8px;">${step.title}</div>
        <p style="font-size:15px; color:var(--text-muted); line-height:1.6; margin:0;">${step.content}</p>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid #eee; pt:16px; margin-top:8px; padding-top:16px;">
        <span style="font-size:12px; color:var(--text-muted); font-weight:700;">Langkah ${this.currentStep + 1} dari ${this.activeSteps.length}</span>
        <div style="display:flex; gap:10px;">
           ${this.currentStep > 0 ? `<button id="tour-prev" class="btn btn-outline" style="padding:8px 16px; font-size:13px; border-color:var(--maroon); color:var(--maroon); border-radius:10px;">Kembali</button>` : ''}
           <button id="tour-next" class="btn btn-primary" style="padding:8px 20px; font-size:13px; border-radius:10px;">${this.currentStep === this.activeSteps.length - 1 ? 'Selesai' : 'Lanjut'}</button>
        </div>
      </div>
    `;

    this.card.querySelector('#tour-next').onclick = () => this._next();
    if (this.card.querySelector('#tour-prev')) {
      this.card.querySelector('#tour-prev').onclick = () => this._prev();
    }
    
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  _next() {
    this.currentStep++;
    if (this.currentStep < this.activeSteps.length) {
      this._showStep();
    } else {
      this.finish();
    }
  }

  _prev() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this._showStep();
    }
  }

  finish() {
    const user = AuthService.currentUser;
    if (this.overlay) this.overlay.remove();
    if (this.spotlight) this.spotlight.remove();
    if (this.card) this.card.remove();
    this.overlay = null;
    this.spotlight = null;
    this.card = null;
    if (user) localStorage.setItem(`gizikita_tour_done_${user.username}`, 'true');
  }
}

export default new TourService();
