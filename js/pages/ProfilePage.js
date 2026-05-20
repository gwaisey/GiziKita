import Component from '../core/Component.js';
import Footer from '../components/Footer.js';

export default class ProfilePage extends Component {
  constructor() {
    super('page-profile');
  }

  render() {
    const user = window.app.services.auth.currentUser;
    const isAdmin = user && (user.role === 'admin_pusat' || user.role === 'admin_sekolah');

    return `
      <div style="background:var(--cream);position:relative;overflow:hidden;min-height:100vh;display:flex;flex-direction:column;">
        <svg class="deco-flower" style="right:-20px;bottom:100px;width:240px;opacity:.16;" viewBox="0 0 200 200">
          <g transform="translate(100,100)">
            <ellipse rx="45" ry="22" transform="rotate(0)" fill="#E8673A"/><ellipse rx="45" ry="22" transform="rotate(30)" fill="#E8673A"/><ellipse rx="45" ry="22" transform="rotate(60)" fill="#E8673A"/><ellipse rx="45" ry="22" transform="rotate(90)" fill="#E8673A"/><ellipse rx="45" ry="22" transform="rotate(120)" fill="#E8673A"/><ellipse rx="45" ry="22" transform="rotate(150)" fill="#E8673A"/><circle r="32" fill="#FFF0C0"/><circle r="18" fill="#F4C662"/>
          </g>
        </svg>

        <div class="page-inner" style="flex:1;">
          <h1 class="page-heading">Edit Informasi Akun</h1>
          <div style="background:#fff;border-radius:18px;padding:32px;box-shadow:var(--shadow);max-width:720px;margin-bottom:24px;">
            <div style="display:flex;gap:40px;align-items:flex-start;flex-wrap:wrap;">
              
              <div style="flex:1;min-width:240px;">
                <div class="form-group"><label>Nama Lengkap</label><input type="text" id="prof-nama"/></div>
                <div class="form-group"><label>Username</label><input type="text" id="prof-username"/></div>
                <div class="form-group"><label>Password</label>
                  <div class="input-icon-wrap">
                     <input type="password" id="prof-pass" placeholder="••••••••"/>
                     <button class="eye-btn" id="prof-toggle-pass" type="button" style="display:flex; align-items:center; justify-content:center; padding:0; background:none; border:none; cursor:pointer; color:var(--maroon); width:24px; height:24px;">
                       <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-eye"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                     </button>
                   </div>
                </div>
                <div class="form-group"><label>Instansi</label><input type="text" id="prof-instansi"/></div>
                <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:4px;">
                  <button class="btn btn-outline btn-sm" id="btn-change-pass">Ganti Password</button>
                  <button class="btn btn-primary btn-sm" id="btn-save-prof">Simpan</button>
                  <button class="btn btn-sm" style="background:var(--peach-card);color:var(--maroon);" id="btn-logout">Keluar</button>
                </div>
              </div>

              <div style="display:flex;flex-direction:column;align-items:center;gap:10px;">
                <div style="width:100px;height:100px;border-radius:50%;background:var(--peach-card);display:flex;align-items:center;justify-content:center;font-size:40px;border:3px solid var(--maroon);" id="profile-photo-default">👤</div>
                <img id="profile-photo-img" style="display:none;width:100px;height:100px;border-radius:50%;object-fit:cover;border:3px solid var(--maroon);"/>
                <button class="btn btn-outline btn-sm" id="btn-change-photo">Ganti Foto</button>
                <input type="file" id="prof-photo-input" accept="image/*" style="display:none;"/>
              </div>

            </div>
          </div>

          ${user && user.role === 'admin_sekolah' && !user.isApproved ? `
            <div class="alert alert-error" style="background:#FFF3CD; border:1px solid #FFE69C; color:#856404; max-width:720px; padding:24px; border-radius:18px;">
               <div style="font-size:32px; margin-bottom:12px;">⏳</div>
               <h3 style="margin-bottom:8px;">Akun Menunggu Persetujuan</h3>
               <p style="font-size:14px; line-height:1.6; margin:0;">Akun instansi Anda sedang dalam proses verifikasi oleh Admin Pusat. Fitur pengelolaan distribusi akan terbuka otomatis setelah akun Anda disetujui.</p>
            </div>
          ` : ''}

          ${isAdmin && user.isApproved ? `
            <h2 style="font-family:'Playfair Display',serif;font-size:24px;color:var(--text);margin-bottom:16px;">Dashboard Admin (Instansi)</h2>
            <div style="background:#fff;border-radius:18px;padding:32px;box-shadow:var(--shadow);max-width:720px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:20px;margin-bottom:32px;">
               <div>
                  <h3 style="margin-bottom:8px;font-size:16px;">Kelola Laporan Distribusi MBG</h3>
                  <p style="font-size:13.5px;color:var(--text-muted);margin:0;max-width:380px;">Isi form penerimaan harian, unggah foto makanan yang tiba, dan lihat riwayat logistik sekolah/instansi Anda.</p>
               </div>
               <button class="btn btn-primary" id="btn-admin-distribusi">Buka Dashboard Logistik</button>
            </div>
          ` : ''}

          ${user && user.role === 'admin_pusat' ? `
            <h2 style="font-family:'Playfair Display',serif;font-size:24px;color:var(--text);margin-bottom:16px;">Manajemen Persetujuan Akun</h2>
            <div class="card" style="max-width:720px; padding:0; overflow:hidden;">
              <table style="width:100%; border-collapse:collapse; text-align:left; font-size:14px;">
                <thead style="background:var(--nav-gold); color:var(--maroon);">
                  <tr>
                    <th style="padding:16px 20px;">Instansi</th>
                    <th style="padding:16px 20px;">Pendaftar</th>
                    <th style="padding:16px 20px;">Aksi</th>
                  </tr>
                </thead>
                <tbody id="pending-users-list">
                  <!-- JS Render -->
                </tbody>
              </table>
            </div>
          ` : ''}
        </div>
        ${Footer.render()}
      </div>
    `;
  }

  afterMount() {
    this.loadProfile();
    this.renderPendingUsers();

    const adminDistBtn = this.container.querySelector('#btn-admin-distribusi');
    if(adminDistBtn) {
      adminDistBtn.addEventListener('click', () => {
         window.app.router.navigate('distribusi');
      });
    }

    this.container.querySelector('#prof-toggle-pass').addEventListener('click', (e) => {
      const input = this.container.querySelector('#prof-pass');
      const btn = e.currentTarget;
      input.type = input.type === 'password' ? 'text' : 'password';

      if (input.type === 'password') {
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
      } else {
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;
      }
    });

    this.container.querySelector('#btn-change-pass').addEventListener('click', () => {
      window.app.components.toast.show('Fitur ganti password akan segera hadir!');
    });

    this.container.querySelector('#btn-save-prof').addEventListener('click', () => {
      window.app.services.auth.updateProfile({
        name: this.container.querySelector('#prof-nama').value.trim(),
        username: this.container.querySelector('#prof-username').value.trim(),
        instansi: this.container.querySelector('#prof-instansi').value.trim()
      });
      const newPass = this.container.querySelector('#prof-pass').value;
      if(newPass) window.app.services.auth.updateProfile({ pass: newPass });
      window.app.components.toast.show('Profil berhasil disimpan!');
    });

    this.container.querySelector('#btn-logout').addEventListener('click', async () => {
      const btn = this.container.querySelector('#btn-logout');
      btn.disabled = true;
      btn.innerHTML = 'Memproses...';
      
      window.app.components.toast.show('Anda telah keluar.');
      await window.app.services.auth.logout();
    });

    const fileInput = this.container.querySelector('#prof-photo-input');
    this.container.querySelector('#btn-change-photo').addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => {
      if (fileInput.files[0]) {
        const url = URL.createObjectURL(fileInput.files[0]);
        this.container.querySelector('#profile-photo-default').style.display = 'none';
        const img = this.container.querySelector('#profile-photo-img');
        img.src = url; img.style.display = 'block';
      }
    });
  }

  async renderPendingUsers() {
    const list = this.container.querySelector('#pending-users-list');
    if (!list) return;

    const pending = await window.app.services.auth.getPendingUsers();
    if (pending.length === 0) {
      list.innerHTML = `<tr><td colspan="3" style="padding:24px; text-align:center; color:var(--text-muted);">Tidak ada antrean persetujuan saat ini.</td></tr>`;
      return;
    }

    list.innerHTML = pending.map(user => `
      <tr style="border-bottom:1px solid rgba(0,0,0,0.05);">
        <td style="padding:16px 20px;">
           <div style="font-weight:700;">${user.instansi || user.schoolName || 'Instansi belum diisi'}</div>
        </td>
        <td style="padding:16px 20px;">
           <div style="font-size:13px; color:var(--text-muted);">${user.name || user.full_name || 'Tanpa Nama'}${user.username ? ` (@${user.username})` : ''}</div>
        </td>
        <td style="padding:16px 20px;">
           <button class="btn btn-primary btn-sm btn-approve" data-user="${user.id || user.username || ''}">Setujui Akun</button>
        </td>
      </tr>
    `).join('');

    list.querySelectorAll('.btn-approve').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const userId = e.target.getAttribute('data-user');
        const result = await window.app.services.auth.approveUser(userId);
        window.app.components.toast.show(result.success ? 'Akun berhasil disetujui!' : result.message);
        this.renderPendingUsers();
      });
    });
  }

  loadProfile() {
    const user = window.app.services.auth.currentUser;
    if (user) {
      this.container.querySelector('#prof-nama').value = user.name || '';
      this.container.querySelector('#prof-username').value = user.username || '';
      this.container.querySelector('#prof-instansi').value = user.instansi || '';
    }
  }
}
