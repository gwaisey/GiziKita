import Component from '../core/Component.js';

const NAV_LINKS = {
  adminPusat: [
    { page: 'distribusi', label: 'Laporan' },
    { page: 'menu', label: 'Menu Makanan' },
    { page: 'feedback', label: 'Umpan Balik' },
    { page: 'help', label: 'Bantuan' },
    { page: 'school-list', label: 'Sekolah' },
    { page: 'profile', label: 'Panel Admin' }
  ],
  adminSekolah: [
    { page: 'register-school', label: 'Registrasi' },
    { page: 'distribusi', label: 'Distribusi' },
    { page: 'menu', label: 'Menu Makanan' },
    { page: 'feedback', label: 'Umpan Balik' },
    { page: 'help', label: 'Bantuan' }
  ],
  userUmum: [
    { page: 'menu', label: 'Menu Makanan' },
    { page: 'feedback', label: 'Umpan Balik' },
    { page: 'help', label: 'Bantuan' },
    { page: 'profile', label: 'Profil' }
  ],
  guest: [
    { page: 'feedback', label: 'Umpan Balik' },
    { page: 'login', label: 'Masuk', extraClass: 'login-btn' },
    { page: 'signup', label: 'Daftar', extraClass: 'signup-btn' }
  ]
};

export default class Navbar extends Component {
  constructor() {
    super(); 
    // Sambungkan langsung ke elemen di index.html
    this.container = document.getElementById('navbar-root');
    this.isMobileMenuOpen = false;
    // Render awal
    this.render();
  }

  render(overridePath = null) {
    if (!this.container) return;
    
    const isAuth = window.app.services.auth ? window.app.services.auth.isAuthenticated() : false;
    const user = isAuth ? window.app.services.auth.currentUser : null;
    const current = this.normalizePath(overridePath || window.location.pathname);
    
    const getActive = (linkPage) => {
      return current === this.normalizePath(linkPage) ? 'active' : '';
    };

    const links = isAuth
      ? (user?.role === 'admin_pusat'
          ? NAV_LINKS.adminPusat
          : user?.role === 'admin_sekolah'
            ? NAV_LINKS.adminSekolah
            : NAV_LINKS.userUmum)
      : NAV_LINKS.guest;

    const linksHTML = this.renderNavLinks(links, getActive);

    this.container.innerHTML = `
      <nav class="immersive-nav">
        <a class="nav-logo" href="#" data-page="home">
          <img src="Assets/logo.png" alt="GiziKita Logo" onerror="this.style.display='none';"/>
          <span class="logo-text">Gizi<br/>Kita</span>
        </a>

        <div class="nav-right-container">
          <ul class="nav-links desktop-only">
            ${linksHTML}
          </ul>

          ${isAuth ? `
          <div class="nav-icons-wrapper">
            <div class="nav-icon-btn" id="nav-notif-icon">
              <i data-lucide="bell" style="width:20px;height:20px;"></i>
              <span class="notif-dot"></span>
            </div>
            <div class="nav-icon-btn profile-btn" id="nav-profile-icon">
              <i data-lucide="user" style="width:18px;height:18px;"></i>
            </div>
          </div>
          ` : ''}

          <div class="hamburger-btn mobile-only" id="hamburger-btn">
             <i data-lucide="menu" style="width:28px;height:28px;color:var(--maroon);"></i>
          </div>
        </div>
      </nav>

      <div class="mobile-menu-overlay" id="mobile-menu">
          <div class="mobile-menu-panel">
          <div class="mobile-menu-header">
            <span class="mobile-menu-title">Menu</span>
            <div class="close-menu-btn" id="close-menu-btn" aria-label="Tutup menu">
                <i data-lucide="x" style="width:28px;height:28px;color:var(--maroon);"></i>
            </div>
          </div>
          <ul class="mobile-nav-links">
            ${linksHTML}
          </ul>
          </div>
      </div>

      <style>
        .immersive-nav {
          background: rgba(255, 251, 245, 0.9);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 40px; height: 74px;
          position: sticky; top: 0; z-index: 1000;
          box-shadow: 0 4px 20px rgba(139,28,63,0.08);
          border-bottom: 1px solid rgba(255,255,255,0.3);
        }

        .nav-logo { display:flex; align-items:center; gap:10px; text-decoration:none; cursor:pointer; transition: transform .2s; }
        .nav-logo:hover { transform: scale(1.05); }
        .nav-logo img { width:42px !important; height:42px !important; object-fit:contain; flex-shrink:0; }
        .logo-text { font-family:'Playfair Display',serif; font-size:20px; font-weight:900; color:var(--maroon); line-height:1; white-space:nowrap; }

        .nav-right-container { display:flex; align-items:center; gap:24px; }
        .nav-links { display:flex; gap:8px; align-items:center; list-style:none; margin:0; padding:0; }
        
        .nav-link-item { 
          color:var(--maroon); text-decoration:none; padding:10px 20px; 
          border-radius:30px; font-weight:600; font-size:14px; 
          transition: all 0.2s ease;
        }
        
        .nav-link-item.active { 
          background: var(--maroon) !important; 
          color: #fff !important; 
          box-shadow: 0 4px 12px rgba(139,28,63,0.3) !important; 
        }
        .nav-link-item:hover:not(.active) { background: rgba(139,28,63,0.08); }
        
        .login-btn,
        .signup-btn {
          box-shadow: inset 0 0 0 1px rgba(139,28,63,0.14);
        }
        .login-btn { background: rgba(139,28,63,0.05); }
        .signup-btn {
          background: rgba(139,28,63,0.10);
          color: var(--maroon);
        }

        .nav-icons-wrapper { display:flex; align-items:center; gap:8px; padding-left:16px; border-left:1.5px solid rgba(139,28,63,0.1); }
        .nav-icon-btn { position:relative; width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all 0.2s; color:var(--maroon); }
        .nav-icon-btn:hover { background: rgba(139,28,63,0.08); }
        .profile-btn { background:var(--maroon); color:white; }
        
        .notif-dot { position:absolute; top:10px; right:10px; width:8px; height:8px; background:var(--coral); border-radius:50%; border:2px solid #fff; display:none; }

        .mobile-only { display: none; }
        @media (max-width: 860px) {
          .desktop-only { display: none !important; }
          .mobile-only { display: block; }
          .immersive-nav { padding: 0 20px; }
        }

        .mobile-menu-overlay {
          position: fixed; top: 0; right: -100%; width: 100%; height: 100vh;
          background: rgba(255, 251, 245, 0.98);
          backdrop-filter: blur(20px); z-index: 2000; 
          transition: right 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex; flex-direction: column;
        }
        .mobile-menu-overlay.open { right: 0; }
        .mobile-menu-panel {
          width: min(100%, 420px);
          height: 100%;
          padding: 28px 24px 36px;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
        }
        .mobile-menu-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 28px;
          padding-left: 18px;
        }
        .mobile-menu-title {
          font-family: 'Playfair Display', serif;
          font-size: 24px;
          font-weight: 900;
          color: var(--maroon);
          line-height: 1;
        }
        .close-menu-btn {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          cursor: pointer;
          transition: background 0.2s ease;
        }
        .close-menu-btn:hover { background: rgba(139,28,63,0.08); }
        .mobile-nav-links {
          display: flex;
          flex-direction: column;
          gap: 6px;
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .mobile-nav-links li {
          display: flex;
        }
        .mobile-nav-links .nav-link-item {
          font-size: 18px;
          padding: 14px 18px;
          width: 100%;
          border-radius: 22px;
          box-sizing: border-box;
        }
      </style>
    `;

    // Pasang ulang event listener dan ikon SETIAP kali render
    this.bindEvents();
    if (window.lucide) window.lucide.createIcons({ root: this.container });
  }

  normalizePath(path) {
    if (!path || path === '/') return 'home';
    return String(path).replace(/^\/|\/$/g, '') || 'home';
  }

  renderNavLinks(links, getActive) {
    return links.map(({ page, label, extraClass = '' }) => {
      const activeClass = getActive(page);
      const classes = ['nav-link-item', extraClass, activeClass].filter(Boolean).join(' ');
      return `<li><a href="#" class="${classes}" data-active="${activeClass === 'active'}" data-page="${page}">${label}</a></li>`;
    }).join('');
  }

  bindEvents() {
    if (!this.container) return;
    
    this.container.querySelectorAll('a[data-page]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = e.currentTarget.getAttribute('data-page');
        window.app.router.navigate(page);
        this.closeMobileMenu();
      });
    });

    const notifBtn = this.container.querySelector('#nav-notif-icon');
    if(notifBtn) notifBtn.addEventListener('click', () => window.app.components.toast.show('Belum ada notifikasi baru'));

    const profileBtn = this.container.querySelector('#nav-profile-icon');
    if(profileBtn) profileBtn.addEventListener('click', () => window.app.router.navigate('profile'));

    const hamburger = this.container.querySelector('#hamburger-btn');
    const closeBtn = this.container.querySelector('#close-menu-btn');
    if(hamburger) hamburger.addEventListener('click', () => this.openMobileMenu());
    if(closeBtn) closeBtn.addEventListener('click', () => this.closeMobileMenu());
  }

  openMobileMenu() {
    const menu = this.container.querySelector('#mobile-menu');
    if (menu) {
      menu.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  }

  closeMobileMenu() {
    const menu = this.container.querySelector('#mobile-menu');
    if (menu) {
      menu.classList.remove('open');
      document.body.style.overflow = '';
    }
  }
}
