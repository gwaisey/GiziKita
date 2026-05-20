import Component from '../core/Component.js';
import Footer from '../components/Footer.js';

export default class LoginPage extends Component {
  constructor() {
    super('page-login');
  }

  render() {
    return `
      <div style="display:flex;min-height:calc(100vh - 70px);position:relative;overflow:hidden;background:var(--cream);">
        <!-- Decorations -->
        <svg class="deco-flower" style="right:40px;bottom:40px;width:220px;opacity:.25;" viewBox="0 0 200 200">
          <g transform="translate(100,100)">
            <ellipse rx="45" ry="22" transform="rotate(0)" fill="#E8673A"/><ellipse rx="45" ry="22" transform="rotate(30)" fill="#E8673A"/><ellipse rx="45" ry="22" transform="rotate(60)" fill="#E8673A"/><ellipse rx="45" ry="22" transform="rotate(90)" fill="#E8673A"/><ellipse rx="45" ry="22" transform="rotate(120)" fill="#E8673A"/><ellipse rx="45" ry="22" transform="rotate(150)" fill="#E8673A"/><circle r="32" fill="#FFF0C0"/><circle r="18" fill="#F4C662"/>
          </g>
        </svg>
        
        <div style="position:absolute;left:0;top:0;bottom:0;width:38%;overflow:hidden;" class="auth-food-strip">
          <div style="width:100%;height:100%;background:linear-gradient(180deg,#E8673A,#8B1C3F);"></div>
          <img src="Assets/daftar-masuk.jpg" alt="GiziKita" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;" onload="this.previousElementSibling.style.display='none'" onerror="this.style.display='none'"/>
        </div>

        <div class="auth-form-container" style="flex:1;display:flex;align-items:center;justify-content:flex-end;padding:40px 12% 40px 0;position:relative;z-index:5;">
          <div style="width:100%;max-width:380px;" class="auth-form-wrap">
            <div style="text-align:center;margin-bottom:28px;">
              <img src="Assets/logo.png" width="52" style="margin-bottom:6px;" onerror="this.style.display='none'"/>
              <div style="font-family:'Playfair Display',serif;font-size:22px;font-weight:700;color:var(--maroon);">Gizi Kita</div>
            </div>
            
            <div class="auth-box" style="background:#fff;border-radius:18px;padding:32px 28px;box-shadow:0 6px 40px rgba(139,28,63,.14);">
              <h2 style="font-family:'Playfair Display',serif;font-size:24px;margin-bottom:6px;color:var(--maroon);">Masuk ke Akun</h2>
              <p style="font-size:13px;color:var(--text-muted);margin-bottom:22px;">Masukkan nama dan password Anda</p>
              
              <div id="login-error" class="alert alert-error" style="display:none; margin-bottom:15px; font-size:13px;"></div>
              
              <div class="form-group">
                <label>Username</label>
                <input type="text" id="login-name" placeholder="Username Anda"/>
              </div>
              <div class="form-group">
                <label>Password</label>
                <div class="input-icon-wrap">
                   <input type="password" id="login-pass" placeholder="••••••••"/>
                   <button class="eye-btn" id="login-toggle-pass" type="button" style="display:flex; align-items:center; justify-content:center; padding:0; background:none; border:none; cursor:pointer; color:var(--maroon); width:24px; height:24px;">
                     <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-eye"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                   </button>
                 </div>
              </div>
              <button class="btn btn-primary" style="width:100%;margin-top:4px;" id="login-btn">Login</button>
            </div>
            <p style="text-align:center;margin-top:16px;font-size:13px;color:var(--text-muted);">Belum punya akun? <a href="#" id="go-signup" style="color:var(--maroon);font-weight:600;text-decoration:none;">Daftar sekarang</a></p>
          </div>
        </div>
      </div>
      ${Footer.render()}
      <style>
        @media (max-width:768px) { 
          .auth-food-strip { display:none !important; } 
          .auth-form-container { justify-content:center !important; padding:40px 20px !important; }
          .auth-form-wrap { max-width:100% !important; }
        }
      </style>
    `;
  }

  afterMount() {
    this.container.querySelector('#go-signup').addEventListener('click', (e) => {
      e.preventDefault();
      window.app.router.navigate('signup');
    });

    this.container.querySelector('#login-toggle-pass').addEventListener('click', (e) => {
      const input = this.container.querySelector('#login-pass');
      const btn = e.currentTarget;
      input.type = input.type === 'password' ? 'text' : 'password';
      
      if (input.type === 'password') {
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
      } else {
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;
      }
    });

    this.container.querySelector('#login-btn').addEventListener('click', async () => {
      const name = this.container.querySelector('#login-name').value.trim();
      const pass = this.container.querySelector('#login-pass').value;
      const btn = this.container.querySelector('#login-btn');
      const errEl = this.container.querySelector('#login-error');

      if (!name || !pass) {
        errEl.textContent = 'Mohon isi semua kolom.';
        errEl.style.display = 'flex';
        return;
      }

      // Professional Loading State
      const originalText = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner" style="width:16px; height:16px; border-width:2px;"></span> Memproses...';
      errEl.style.display = 'none';

      try {
        const res = await window.app.services.auth.login(name, pass);
        
        if (res.success) {
          const user = res.user || window.app.services.auth.currentUser;
          const nextPage = 'home';
          window.app.components.toast.show('Login berhasil! Selamat datang, ' + name);
          window.app.router.navigate(nextPage);
        } else {
          errEl.textContent = res.message;
          errEl.style.display = 'flex';
          btn.disabled = false;
          btn.innerHTML = originalText;
        }
      } catch (err) {
        errEl.textContent = 'Terjadi kesalahan sistem. Silakan coba lagi.';
        errEl.style.display = 'flex';
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
    });
  }
}
