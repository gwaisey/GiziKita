import AuthService from './AuthService';

interface TourStep {
  element: string;
  title: string;
  content: string;
}

class TourService {
  private currentStep: number = 0;
  private overlay: HTMLElement | null = null;
  private spotlight: HTMLElement | null = null;
  private card: HTMLElement | null = null;
  private activeSteps: TourStep[] = [];

  public canAccessTutorial(): boolean {
    const user = AuthService.currentUser;
    return Boolean(
      user &&
      AuthService.isAuthenticated() &&
      typeof user.username === 'string' &&
      user.username.trim() !== ''
    );
  }

  public getTutorialAudienceLabel(): string {
    const user = AuthService.currentUser;
    if (!this.canAccessTutorial() || !user) return '';

    return (user.role === 'admin_pusat' || user.role === 'admin_sekolah')
      ? 'Lihat tutorial admin sesuai fitur pengelolaan sekolah dan distribusi.'
      : 'Lihat tutorial orang tua dan masyarakat untuk memantau menu, bantuan, dan umpan balik.';
  }

  private getSteps(role: string): TourStep[] {
    const common: TourStep[] = [
      {
        element: '.nav-logo',
        title: '🏠 Beranda (Halaman Depan)',
        content: 'Klik logo ini kapan saja untuk kembali ke halaman paling depan.',
      }
    ];

    const parentSteps: TourStep[] = [
      ...common,
      {
        element: 'a[href="/menu"]',
        title: '🍱 Menu Makanan',
        content: 'Klik di sini untuk melihat daftar makanan bergizi yang akan dibagikan minggu ini.',
      },
      {
        element: 'a[href="/feedback"]',
        title: '💬 Kirim Saran',
        content: 'Punya saran atau keluhan? Klik di sini untuk berbicara langsung dengan kami.',
      },
      {
        element: 'a[href="/help"]',
        title: '🤖 Tanya GiziBot',
        content: 'Jika bingung, klik di sini untuk bertanya pada GiziBot, asisten pintar kami.',
      }
    ];

    const adminSteps: TourStep[] = [
      ...common,
      {
        element: 'a[href="/distribusi"]',
        title: '📝 Laporan Distribusi',
        content: 'Klik di sini untuk mengelola dan melaporkan distribusi makanan sekolah.',
      },
      {
        element: 'a[href="/menu"]',
        title: '🍱 Menu Makanan',
        content: 'Lihat daftar menu mingguan yang sedang berjalan.',
      },
      {
        element: 'a[href="/feedback"]',
        title: '💬 Kotak Saran',
        content: 'Pantau saran dari masyarakat dan balas pesan mereka di sini.',
      }
    ];

    return (role === 'admin_pusat' || role === 'admin_sekolah') ? adminSteps : parentSteps;
  }

  public start(force: boolean = false) {
    const user = AuthService.currentUser;
    if (!this.canAccessTutorial() || !user) return;

    if (this.overlay && !force) return;
    if (force) this.finish();

    if (!force && localStorage.getItem(`gizikita_tour_done_${user.username}`)) return;

    // Only on Desktop/Large Screen
    if (typeof window !== 'undefined' && window.innerWidth < 860) return;

    this.activeSteps = this.getSteps(user.role);
    this.currentStep = 0;
    this._createOverlay();
    this._showStep();
  }

  private _createOverlay() {
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

  private _showStep() {
    const step = this.activeSteps[this.currentStep];
    const el = document.querySelector(step.element) as HTMLElement;

    if (!el) {
      this._next();
      return;
    }

    const rect = el.getBoundingClientRect();
    const padding = 10;

    if (this.spotlight) {
      this.spotlight.style.top = `${rect.top - padding}px`;
      this.spotlight.style.left = `${rect.left - padding}px`;
      this.spotlight.style.width = `${rect.width + (padding * 2)}px`;
      this.spotlight.style.height = `${rect.height + (padding * 2)}px`;
    }

    if (this.card) {
      let cardTop = rect.bottom + 25;
      let cardLeft = rect.left + (rect.width / 2) - 170;

      if (cardLeft < 20) cardLeft = 20;
      if (cardLeft + 340 > window.innerWidth - 20) cardLeft = window.innerWidth - 360;
      if (cardTop + 200 > window.innerHeight) cardTop = rect.top - 220;

      this.card.style.top = `${cardTop}px`;
      this.card.style.left = `${cardLeft}px`;

      this.card.innerHTML = `
        <div>
          <div style="font-family:'Playfair Display',serif; font-size:22px; font-weight:900; color:var(--maroon); margin-bottom:8px;">${step.title}</div>
          <p style="font-size:15px; color:var(--text-muted); line-height:1.6; margin:0;">${step.content}</p>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid #eee; margin-top:8px; padding-top:16px;">
          <span style="font-size:12px; color:var(--text-muted); font-weight:700;">Langkah ${this.currentStep + 1} dari ${this.activeSteps.length}</span>
          <div style="display:flex; gap:10px;">
             ${this.currentStep > 0 ? `<button id="tour-prev" class="btn btn-outline" style="padding:8px 16px; font-size:13px; border-color:var(--maroon); color:var(--maroon); border-radius:10px;">Kembali</button>` : ''}
             <button id="tour-next" class="btn btn-primary" style="padding:8px 20px; font-size:13px; border-radius:10px;">${this.currentStep === this.activeSteps.length - 1 ? 'Selesai' : 'Lanjut'}</button>
          </div>
        </div>
      `;

      const nextBtn = this.card.querySelector('#tour-next') as HTMLButtonElement;
      if (nextBtn) nextBtn.onclick = () => this._next();
      
      const prevBtn = this.card.querySelector('#tour-prev') as HTMLButtonElement;
      if (prevBtn) prevBtn.onclick = () => this._prev();
    }
    
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  private _next() {
    this.currentStep++;
    if (this.currentStep < this.activeSteps.length) {
      this._showStep();
    } else {
      this.finish();
    }
  }

  private _prev() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this._showStep();
    }
  }

  public finish() {
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
