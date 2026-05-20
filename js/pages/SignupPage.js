import Component from '../core/Component.js';
import Footer from '../components/Footer.js';

export default class SignupPage extends Component {
  constructor() {
    super('page-signup');
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
          <div style="width:100%;height:100%;background:linear-gradient(180deg,#F4C662,#E8673A);"></div>
          <img src="Assets/daftar-masuk.jpg" alt="GiziKita" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;" onload="this.previousElementSibling.style.display='none'" onerror="this.style.display='none'"/>
        </div>

        <div class="auth-form-container" style="flex:1;display:flex;align-items:center;justify-content:flex-end;padding:40px 12% 40px 0;position:relative;z-index:5;">
          <div style="width:100%;max-width:420px;" class="auth-form-wrap">
            <div style="text-align:center;margin-bottom:28px;">
              <img src="Assets/logo.png" width="52" style="margin-bottom:6px;" onerror="this.style.display='none'"/>
              <div style="font-family:'Playfair Display',serif;font-size:22px;font-weight:700;color:var(--maroon);">Gizi Kita</div>
            </div>
            
            <div class="auth-box" style="background:#fff;border-radius:18px;padding:32px 28px;box-shadow:0 6px 40px rgba(139,28,63,.14);">
              <h2 style="font-family:'Playfair Display',serif;font-size:24px;margin-bottom:6px;color:var(--maroon);">Buat Akun Baru</h2>
              <p style="font-size:13px;color:var(--text-muted);margin-bottom:22px;">Isi data diri Anda untuk mendaftar</p>
              
              <div class="form-group">
                <label>Nama Lengkap</label>
                <input type="text" id="signup-name" placeholder="Nama lengkap"/>
              </div>
              <div class="form-group">
                <label>Username</label>
                <input type="text" id="signup-username" placeholder="username"/>
              </div>
              <div class="form-group">
                <label>Daftar Sebagai</label>
                <select id="signup-role">
                  <option value="admin_sekolah">Pihak Sekolah / Instansi (Pelapor)</option>
                  <option value="user_umum">Orang Tua / Masyarakat (Umum)</option>
                </select>
              </div>
              <div class="form-group" id="instansi-group">
                <label>Nama Instansi / Sekolah</label>
                <input type="text" id="signup-instansi" placeholder="Nama sekolah atau instansi"/>
              </div>
              <div class="form-group" id="verification-group">
                <label>Kode Verifikasi Sekolah</label>
                <input type="text" id="signup-code" placeholder="Masukkan kode resmi dari BGN"/>
              </div>
              <div class="form-group">
                <label>Password</label>
                <div class="input-icon-wrap">
                   <input type="password" id="signup-pass" placeholder="Min. 6 karakter"/>
                   <button class="eye-btn" id="signup-toggle-pass" type="button" style="display:flex; align-items:center; justify-content:center; padding:0; background:none; border:none; cursor:pointer; color:var(--maroon); width:24px; height:24px;">
                     <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-eye"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                   </button>
                 </div>
              </div>
              <button class="btn btn-primary" style="width:100%;margin-top:4px;" id="signup-btn">Daftar</button>
            </div>
            <p style="text-align:center;margin-top:16px;font-size:13px;color:var(--text-muted);">Sudah punya akun? <a href="#" id="go-login" style="color:var(--maroon);font-weight:600;text-decoration:none;">Masuk di sini</a></p>
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
    this.container.querySelector('#go-login').addEventListener('click', (e) => {
      e.preventDefault();
      window.app.router.navigate('login');
    });

    this.container.querySelector('#signup-toggle-pass').addEventListener('click', (e) => {
      const input = this.container.querySelector('#signup-pass');
      const btn = e.currentTarget;
      input.type = input.type === 'password' ? 'text' : 'password';

      if (input.type === 'password') {
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
      } else {
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;
      }
    });

    const roleSelect = this.container.querySelector('#signup-role');
    const instansiGroup = this.container.querySelector('#instansi-group');
    const verificationGroup = this.container.querySelector('#verification-group');

    roleSelect.addEventListener('change', () => {
      const isUmum = roleSelect.value === 'user_umum';
      instansiGroup.style.display = isUmum ? 'none' : 'block';
      verificationGroup.style.display = isUmum ? 'none' : 'block';
    });

    this.container.querySelector('#signup-btn').addEventListener('click', async () => {
      const name = this.container.querySelector('#signup-name').value.trim();
      const user = this.container.querySelector('#signup-username').value.trim();
      const role = roleSelect.value;
      const inst = role === 'user_umum' ? 'Masyarakat Umum' : this.container.querySelector('#signup-instansi').value.trim();
      const code = role === 'user_umum' ? '' : this.container.querySelector('#signup-code').value.trim();
      const pass = this.container.querySelector('#signup-pass').value;
      const btn = this.container.querySelector('#signup-btn');

      if (!name || !user || !pass) {
        window.app.components.toast.show('Mohon lengkapi semua data diri.');
        return;
      }

      // Professional Loading State
      const originalText = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner" style="width:16px; height:16px; border-width:2px;"></span> Mendaftar...';

      try {
        const res = await window.app.services.auth.signup(name, user, inst, pass, role, code);
        if (res.success) {
          window.app.components.toast.show('Akun berhasil dibuat! Selamat bergabung.');
          window.app.router.navigate('home');
        } else {
          window.app.components.toast.show(res.message);
          btn.disabled = false;
          btn.innerHTML = originalText;
        }
      } catch (err) {
        window.app.components.toast.show('Gagal mendaftar. Silakan cek koneksi Anda.');
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
    });
  }
}
