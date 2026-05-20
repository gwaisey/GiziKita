import Component from '../core/Component.js';
import Footer from '../components/Footer.js';

export default class SchoolListPage extends Component {
  constructor() {
    super('page-school-list');
    this.filter = 'Semua';
  }

  render() {
    return `
      <style>
        .table-responsive {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
        @media (max-width: 860px) {
          .page-inner.wide { padding: 24px 16px !important; }
          .page-heading { font-size: 28px !important; }
          .school-table th, .school-table td { 
            padding: 12px 10px !important; 
            font-size: 13px !important; 
          }
          .hide-mobile { display: none !important; }
          .school-table { min-width: 600px; }
        }
      </style>
      <div class="page-inner wide">
        <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:32px; flex-wrap:wrap; gap:20px;">
          <div>
            <h1 class="page-heading">Daftar Sekolah Penerima</h1>
            <p class="page-sub" style="margin-bottom:0;">Data real sekolah negeri peserta program Makan Bergizi Gratis (MBG).</p>
          </div>
          
          <div class="form-group" style="margin-bottom:0; min-width:240px;">
            <label>Filter Provinsi</label>
            <select id="province-filter" disabled>
              <option>Memuat data...</option>
            </select>
          </div>
        </div>

        <div class="card" style="padding:0; overflow:hidden;" id="school-table-container">
          <div style="padding:40px; text-align:center;">
             <span class="spinner" style="border-color:var(--maroon); border-bottom-color:transparent; width:40px; height:40px;"></span>
             <p style="margin-top:16px; color:var(--text-muted);">Menghubungkan ke database Supabase...</p>
          </div>
        </div>

        <div style="margin-top:40px; padding:24px; background:rgba(232,103,58,0.1); border-radius:12px; display:flex; gap:16px; align-items:center;">
           <span style="font-size:24px;">ℹ️</span>
           <p style="font-size:13px; color:var(--text-muted); line-height:1.5;">
             <strong>Catatan:</strong> Data ini dikelola oleh Badan Gizi Nasional dan diperbarui secara berkala sesuai perluasan Satuan Pelayanan Pemenuhan Gizi (SPPG) di masing-masing provinsi.
           </p>
        </div>
      </div>
      ${Footer.render()}
    `;
  }

  async afterMount() {
    const service = window.app.services.schools;
    
    // Fetch filter data
    const provinces = await service.getProvinces();
    const filterSelect = this.container.querySelector('#province-filter');
    
    if (filterSelect) {
      filterSelect.innerHTML = provinces.map(p => `<option value="${p}" ${this.filter === p ? 'selected' : ''}>${p}</option>`).join('');
      filterSelect.disabled = false;
      
      // Prevent multiple listeners if re-mounting
      filterSelect.onchange = async (e) => {
        this.filter = e.target.value;
        await this.loadTableData();
      };
    }

    await this.loadTableData();
  }

  async loadTableData(retryCount = 0) {
    const service = window.app.services.schools;
    const container = this.container.querySelector('#school-table-container');
    
    // Initial loading state
    if (retryCount === 0) {
      container.innerHTML = `
        <div style="padding:40px; text-align:center;">
           <span class="spinner" style="border-color:var(--maroon); border-bottom-color:transparent; width:40px; height:40px;"></span>
           <p style="margin-top:16px; color:var(--text-muted);">Memuat data sekolah...</p>
        </div>
      `;
    } else {
      container.querySelector('p').innerText = `Koneksi agak lambat, mencoba lagi (${retryCount}/3)...`;
    }

    try {
      const schools = await service.getSchoolsByProvince(this.filter);
      
      container.innerHTML = `
        <div class="table-responsive">
          <table class="school-table" style="width:100%; border-collapse:collapse; text-align:left; font-size:14px;">
            <thead style="background:var(--nav-gold); color:var(--maroon);">
              <tr>
                <th style="padding:16px 20px;">No.</th>
                <th style="padding:16px 20px;">Nama Sekolah</th>
                <th style="padding:16px 20px;">Kota / Kabupaten</th>
                <th class="hide-mobile" style="padding:16px 20px;">Provinsi</th>
                <th style="padding:16px 20px;">Jumlah Siswa</th>
                <th style="padding:16px 20px;">Status MBG</th>
              </tr>
            </thead>
            <tbody>
              ${schools.length > 0 ? schools.map((s, i) => `
                <tr style="border-bottom:1px solid rgba(0,0,0,0.05); transition:background .2s;" onmouseover="this.style.background='rgba(232,103,58,0.03)'" onmouseout="this.style.background='transparent'">
                  <td style="padding:16px 20px; color:var(--text-muted);">${i + 1}</td>
                  <td style="padding:16px 20px; font-weight:600; color:var(--maroon);">${s.name}</td>
                  <td style="padding:16px 20px;">${s.city}</td>
                  <td class="hide-mobile" style="padding:16px 20px;">${s.province}</td>
                  <td style="padding:16px 20px;">${s.pupils}</td>
                  <td style="padding:16px 20px;">
                    <span class="badge ${s.status.includes('Pilot') ? 'badge-good' : 'badge-neutral'}" style="text-transform:none;">
                      ${s.status}
                    </span>
                  </td>
                </tr>
              `).join('') : `
                <tr>
                  <td colspan="6" style="padding:40px; text-align:center; color:var(--text-muted);">Tidak ada data sekolah untuk wilayah ini.</td>
                </tr>
              `}
            </tbody>
          </table>
        </div>
      `;
    } catch (error) {
      console.error("Fetch error:", error);
      if (retryCount < 3) {
        setTimeout(() => this.loadTableData(retryCount + 1), 2000);
      } else {
        container.innerHTML = `
          <div style="padding:40px; text-align:center; color:var(--maroon);">
            <p>Gagal memuat data. Periksa koneksi internet Anda.</p>
            <button class="btn btn-primary" style="margin-top:16px;" onclick="location.reload()">Coba Lagi</button>
          </div>
        `;
      }
    }
  }
}
