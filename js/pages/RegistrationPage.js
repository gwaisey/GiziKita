import Component from '../core/Component.js';
import Footer from '../components/Footer.js';

export default class RegistrationPage extends Component {
  constructor() {
    super('page-register-school');
  }

  render() {
    return `
      <div style="background:var(--cream);position:relative;overflow:hidden;min-height:100vh;display:flex;flex-direction:column;">
        <svg class="deco-flower" style="right:-30px;bottom:120px;width:260px;opacity:.15;" viewBox="0 0 200 200">
          <g transform="translate(100,100)">
            <ellipse rx="45" ry="22" transform="rotate(0)" fill="#E8673A"/><ellipse rx="45" ry="22" transform="rotate(30)" fill="#E8673A"/><ellipse rx="45" ry="22" transform="rotate(60)" fill="#E8673A"/><ellipse rx="45" ry="22" transform="rotate(90)" fill="#E8673A"/><ellipse rx="45" ry="22" transform="rotate(120)" fill="#E8673A"/><ellipse rx="45" ry="22" transform="rotate(150)" fill="#E8673A"/><circle r="32" fill="#FFF0C0"/><circle r="18" fill="#F4C662"/>
          </g>
        </svg>

        <div class="page-inner" style="flex:1;">
          <h1 class="page-heading">Daftarkan Sekolah ke<br/>Program Makan Bergizi!</h1>
          <p class="page-sub">Lengkapi data sekolah berikut untuk mendaftarkan sekolah Anda ke program MBG.</p>

          <div id="reg-success" class="alert alert-success" style="display:none;">
            ✅ Sekolah berhasil didaftarkan! Tim kami akan segera memproses permohonan Anda.
          </div>

          <div style="background:#fff;border-radius:18px;padding:32px;box-shadow:var(--shadow);max-width:780px;">
            <div class="two-col">
              <div class="form-group"><label>Nama Sekolah</label><input type="text" id="reg-nama" placeholder="Contoh: SMP Negeri 1 Jakarta"/></div>
              <div class="form-group"><label>NPSN (Nomor Pokok Sekolah Nasional)</label><input type="text" id="reg-npsn" placeholder="8 digit NPSN"/></div>
              <div class="form-group"><label>Alamat Sekolah</label><input type="text" id="reg-alamat" placeholder="Jl. ..."/></div>
              <div class="form-group"><label>Jumlah Siswa</label><input type="number" id="reg-siswa" placeholder="Jumlah siswa"/></div>
              <div class="form-group">
                <label>Jenjang Pendidikan</label>
                <select id="reg-jenjang">
                  <option value="">-- Pilih Jenjang --</option>
                  <option>SD (Sekolah Dasar)</option><option>SMP (Sekolah Menengah Pertama)</option>
                  <option>SMA (Sekolah Menengah Atas)</option><option>SMK (Sekolah Menengah Kejuruan)</option>
                </select>
              </div>
              <div class="form-group">
                <label>Surat Permohonan Sekolah Resmi</label>
                <div class="file-upload" id="reg-file-wrap">
                  <input type="file" id="reg-file" accept=".pdf,.doc,.docx" style="display:none;"/>
                  <label class="file-upload-label" id="reg-file-label" style="cursor:pointer;display:block;"><span>Unggah File</span> (PDF atau Word, maks. 5MB)</label>
                </div>
              </div>
            </div>
            <div style="text-align:center;margin-top:12px;">
              <button class="btn btn-primary" style="min-width:180px;" id="reg-btn">Daftarkan</button>
            </div>
          </div>
        </div>
        ${Footer.render()}
        <style>
          .file-upload { border: 2px dashed rgba(139,28,63,.3); border-radius: 10px; padding: 16px; text-align: center; cursor: pointer; transition: border-color .2s, background .2s; }
          .file-upload:hover { border-color: var(--maroon); background: rgba(139,28,63,.04); }
          .file-upload-label span { color: var(--maroon); font-weight: 600; }
        </style>
      </div>
    `;
  }

  afterMount() {
    const fileInput = this.container.querySelector('#reg-file');
    const fileWrap = this.container.querySelector('#reg-file-wrap');
    
    fileWrap.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => {
      if (fileInput.files[0]) {
        this.container.querySelector('#reg-file-label').innerHTML = `📄 <strong>${fileInput.files[0].name}</strong>`;
      }
    });

    this.container.querySelector('#reg-btn').addEventListener('click', () => {
      const nama = this.container.querySelector('#reg-nama').value.trim();
      const npsn = this.container.querySelector('#reg-npsn').value.trim();
      const alamat = this.container.querySelector('#reg-alamat').value.trim();
      const siswa = this.container.querySelector('#reg-siswa').value.trim();
      const jenjang = this.container.querySelector('#reg-jenjang').value;

      if (!nama || !npsn || !alamat || !siswa || !jenjang) {
        window.app.components.toast.show('Lengkapi semua field terlebih dahulu.');
        return;
      }
      if (npsn.length !== 8 || isNaN(npsn)) {
        window.app.components.toast.show('NPSN harus 8 digit angka.');
        return;
      }

      const btn = this.container.querySelector('#reg-btn');
      btn.innerHTML = '<span class="spinner"></span> Memproses...';
      btn.disabled = true;

      setTimeout(() => {
        btn.innerHTML = 'Daftarkan';
        btn.disabled = false;
        this.container.querySelector('#reg-success').style.display = 'flex';
        ['reg-nama','reg-npsn','reg-alamat','reg-siswa'].forEach(id => this.container.querySelector('#'+id).value = '');
        this.container.querySelector('#reg-jenjang').value = '';
        window.scrollTo({top:0, behavior:'smooth'});
      }, 1500);
    });
  }
}
