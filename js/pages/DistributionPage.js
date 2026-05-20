import Component from '../core/Component.js';
import Footer from '../components/Footer.js';

export default class DistributionPage extends Component {
  constructor() {
    super('page-distribution');
    this.state = {
      isLoaded: false,
      isReportedToday: false,
      metrics: { totalReceived: 0, successRate: 0, issues: 0 },
      history: [],
      schools: [] // New state for dynamic schools
    };
    this.capturedFiles = []; // Array to store multiple files
  }

  async fetchData() {
    const distService = window.app.services.distribution;
    const schoolService = window.app.services.schools;
    
    const [isReportedToday, metrics, history, schools] = await Promise.all([
      distService.checkTodayReport(),
      distService.getTodayMetrics(),
      distService.getHistory(),
      schoolService.getSchoolsByProvince('Semua') // Fetch real schools
    ]);

    this.state = {
      isLoaded: true,
      isReportedToday,
      metrics,
      history,
      schools
    };

    // 2. Re-mount to show data
    this.mount(document.getElementById('app-root'));
  }

  render() {
    const { isLoaded, isReportedToday, metrics, history } = this.state;

    if (!isLoaded) {
      return `
        <div class="page-inner wide" style="display:flex; justify-content:center; align-items:center; min-height:60vh;">
           <div class="spinner" style="border-top-color:var(--maroon); width:40px; height:40px;"></div>
        </div>
      `;
    }

    const user = window.app.services.auth.currentUser;
    const isPusat = user && user.role === 'admin_pusat';
    const schoolLabel = isPusat ? 'Seluruh Sekolah (Pusat)' : (user.schoolName || 'SDN 01 Menteng');

    return `
      <div class="page-inner wide">
        <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:48px; flex-wrap:wrap; gap:20px;">
           <div>
              <h1 class="page-heading">${isPusat ? 'Dashboard Pengelolaan Distribusi' : 'Kelola Laporan Distribusi'}</h1>
              <p class="page-sub" style="margin-bottom:0;">${isPusat ? 'Pantau performa distribusi nasional dan rekapitulasi data MBG.' : 'Pantau dan laporkan penerimaan makanan bergizi (MBG) secara real-time.'}</p>
           </div>
           <div style="padding:12px 20px; background:var(--white); border:1px solid var(--border); border-radius:12px; font-size:14px; font-weight:600; color:var(--maroon);">
              📍 ${isPusat ? 'Mode' : 'Sekolah'}: <span style="color:var(--text);">${schoolLabel}</span>
           </div>
        </div>

        <!-- Dashboard Metrik -->
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:24px; margin-bottom:56px;">
          <div class="card" style="padding:32px; border:none; box-shadow:0 15px 40px rgba(139,28,63,0.08);">
            <div style="font-size:12px; color:var(--text-muted); font-weight:700; text-transform:uppercase; letter-spacing:1px; margin-bottom:12px;">Porsi Diterima (${isPusat ? 'Nasional' : 'Bulan Ini'})</div>
            <div style="font-size:36px; font-weight:900; color:var(--maroon);">${metrics.totalReceived.toLocaleString('id-ID')} <span style="font-size:16px; font-weight:700; color:var(--text-muted);">Porsi</span></div>
            <div style="margin-top:16px; font-size:13px; color:#28a745; font-weight:700; display:flex; align-items:center; gap:6px;">
               <span style="width:8px; height:8px; background:#28a745; border-radius:50%;"></span> ${isPusat ? 'Akumulasi Seluruh Instansi' : 'Sesuai Kuota Target'}
            </div>
          </div>

          <div class="card" style="padding:32px; border:none; box-shadow:0 15px 40px rgba(232,103,58,0.08);">
            <div style="font-size:12px; color:var(--text-muted); font-weight:700; text-transform:uppercase; letter-spacing:1px; margin-bottom:12px;">Tingkat Kesesuaian Gizi</div>
            <div style="font-size:36px; font-weight:900; color:var(--coral);">${metrics.successRate}%</div>
            <div style="margin-top:16px; width:100%; height:8px; background:rgba(0,0,0,0.05); border-radius:4px; overflow:hidden;">
               <div style="width:${metrics.successRate}%; height:100%; background:var(--coral); border-radius:4px;"></div>
            </div>
          </div>

          <div class="card" style="padding:32px; border:none; box-shadow:0 15px 40px ${isReportedToday ? 'rgba(40,167,69,0.1)' : 'rgba(245,201,122,0.15)'};">
            <div style="font-size:12px; color:var(--text-muted); font-weight:700; text-transform:uppercase; letter-spacing:1px; margin-bottom:12px;">${isPusat ? 'Laporan Masuk' : 'Status Hari Ini'}</div>
            <div style="margin-top:8px;">
               ${isPusat 
                 ? `<div style="font-size:24px; font-weight:900; color:var(--text);">${history.length} <span style="font-size:14px; color:var(--text-muted);">Data</span></div>`
                 : (isReportedToday 
                   ? '<span class="badge badge-good" style="font-size:14px; padding:8px 18px; border-radius:8px;">Telah Dilaporkan</span>' 
                   : '<span class="badge badge-pending" style="font-size:14px; padding:8px 18px; border-radius:8px;">Belum Dilaporkan</span>')}
            </div>
            <div style="margin-top:16px; font-size:13px; color:var(--text-muted); font-weight:600;">${isPusat ? 'Data Terverifikasi' : 'Target: 450 Porsi / Hari'}</div>
          </div>
        </div>

        <!-- Form Input -->
        <div class="card" style="margin-bottom:60px; padding:48px; border:none; box-shadow:0 30px 70px rgba(0,0,0,0.05);">
          <div style="display:flex; align-items:center; gap:16px; margin-bottom:32px;">
             <div style="width:40px; height:40px; background:var(--maroon); border-radius:10px; display:flex; align-items:center; justify-content:center; color:#fff; font-weight:900;">+</div>
             <h2 style="font-size:24px; font-weight:900; color:var(--text); margin:0;">Kirim Laporan Harian</h2>
          </div>
          
          ${isReportedToday ? `
            <div class="alert alert-success" style="padding:40px; border:none; background:rgba(40,167,69,0.05); border-radius:20px; display:flex; flex-direction:column; align-items:center; text-align:center;">
              <div style="font-size:52px; margin-bottom:16px;">✨</div>
              <strong style="font-size:20px; color:#155724;">Terima Kasih, Laporan Terkirim!</strong>
              <p style="margin-top:12px; color:#155724; opacity:0.8; max-width:400px; line-height:1.6;">Data penerimaan makanan hari ini telah berhasil diverifikasi oleh sistem pusat. Anda dapat melihat detailnya di tabel riwayat di bawah.</p>
            </div>
          ` : `
            <form id="dist-form" style="display:flex; flex-direction:column; gap:32px;">
              <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(250px, 1fr)); gap:32px;">
                <div class="form-group">
                  <label>Pilih Sekolah (Simulator Admin Pusat)</label>
                  <select id="dist-school-id" required style="padding:16px; border-radius:12px; border:2px solid #eee; background-position: right 20px center;">
                    <option value="" disabled selected>Pilih Sekolah...</option>
                    ${this.state.schools.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
                  </select>
                </div>
                <div class="form-group">
                  <label>Jumlah Porsi Diterima (Target: 450)</label>
                  <input type="number" id="dist-portions" min="0" max="1000" placeholder="Misal: 450" required style="padding:16px; border-radius:12px; border:2px solid #eee;" />
                </div>
                <div class="form-group">
                  <label>Kondisi Makanan</label>
                  <select id="dist-condition" required style="padding:16px; border-radius:12px; border:2px solid #eee; background-position: right 20px center;">
                    <option value="" disabled selected>Pilih Kondisi...</option>
                    <option value="Sangat Baik">Sangat Baik (Sesuai Standar)</option>
                    <option value="Baik">Baik (Ada Catatan Kecil)</option>
                    <option value="Ada Kerusakan/Kekurangan">Ada Kerusakan/Kekurangan</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label>Bukti Foto Makanan Tiba (Minimal 1, Bisa Banyak)</label>
                <div style="border:2px dashed #ddd; border-radius:20px; padding:32px; text-align:center; background:#fafafa; transition:all 0.3s; position:relative;" id="photo-container">
                   <div id="photo-placeholder">
                      <div style="font-size:40px; margin-bottom:16px;">📸</div>
                      <div style="display:flex; justify-content:center; gap:12px; flex-wrap:wrap;">
                        <button type="button" class="btn btn-outline btn-sm" id="btn-open-camera" style="border-radius:10px; width:160px;">
                          <i data-lucide="camera" style="width:16px;height:16px;"></i> Ambil Foto
                        </button>
                        <button type="button" class="btn btn-outline btn-sm" id="btn-browse-file" style="border-radius:10px; width:160px;">
                          <i data-lucide="upload" style="width:16px;height:16px;"></i> Pilih File
                        </button>
                      </div>
                      <div style="font-size:12px; color:var(--text-muted); margin-top:12px;">Lampirkan minimal 1 foto bukti fisik makanan</div>
                   </div>
                   
                   <input type="file" id="dist-photo" accept="image/*" style="display:none;" multiple />
                   <div id="preview-list" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(120px, 1fr)); gap:16px; margin-top:20px;">
                      <!-- Photo Previews will appear here -->
                   </div>
                </div>
              </div>

              <!-- Camera Modal -->
              <div id="camera-modal" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.9); z-index:2000; flex-direction:column; align-items:center; justify-content:center; padding:20px;">
                <div style="position:relative; width:100%; max-width:500px; background:#000; border-radius:20px; overflow:hidden; display:flex; flex-direction:column;">
                  <video id="camera-stream" autoplay playsinline style="width:100%; aspect-ratio:3/4; object-fit:cover;"></video>
                  <div style="padding:24px; display:flex; justify-content:space-between; align-items:center; background:#111;">
                    <button type="button" class="btn btn-outline" id="btn-cancel-camera" style="color:#fff; border-color:rgba(255,255,255,0.3);">Batal</button>
                    <button type="button" id="btn-capture" style="width:64px; height:64px; background:#fff; border:5px solid rgba(255,255,255,0.3); border-radius:50%; cursor:pointer;"></button>
                    <div style="width:60px;"></div> <!-- Spacer -->
                  </div>
                </div>
                <canvas id="camera-canvas" style="display:none;"></canvas>
              </div>

              <div class="form-group">
                <label>Catatan Tambahan (Opsional)</label>
                <textarea id="dist-notes" placeholder="Misal: Kurir tiba pukul 10:15, semua paket masih hangat..." style="padding:16px; border-radius:12px; border:2px solid #eee; min-height:120px;"></textarea>
              </div>

              <div style="display:flex; justify-content:flex-end;">
                <button type="submit" class="btn btn-primary" id="btn-submit-dist" style="padding:18px 48px; font-size:16px; font-weight:700; border-radius:16px;">Kirim Laporan ke Pusat</button>
              </div>
            </form>
          `}
        </div>

        <!-- Riwayat -->
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px;">
           <h2 style="font-size:24px; font-weight:900; color:var(--text); margin:0;">Riwayat Distribusi</h2>
           <button class="btn btn-sm btn-outline" id="btn-download-rekap" style="border-radius:10px;">Download Rekap (Excel)</button>
        </div>
        
        <div class="card" style="padding:0; overflow:hidden; border:none; box-shadow:0 20px 50px rgba(0,0,0,0.03); border-radius:20px;">
          <table style="width:100%; border-collapse:collapse; text-align:left; font-size:15px; min-width:800px;">
            <thead style="background:var(--nav-gold); color:var(--maroon);">
              <tr>
                <th style="padding:20px 24px; font-weight:800;">Tanggal</th>
                <th style="padding:20px 24px; font-weight:800;">${isPusat ? 'Sekolah' : 'Waktu Tiba'}</th>
                <th style="padding:20px 24px; font-weight:800;">Porsi Diterima</th>
                <th style="padding:20px 24px; font-weight:800;">Kondisi</th>
                <th style="padding:20px 24px; font-weight:800;">Status Verifikasi</th>
              </tr>
            </thead>
            <tbody>
              ${history.map(log => `
                <tr style="border-bottom:1px solid rgba(0,0,0,0.03); background:${log.status === 'Bermasalah' ? 'rgba(232,103,58,0.05)' : 'transparent'};">
                  <td style="padding:20px 24px; font-weight:700; color:var(--text);">${log.date}</td>
                  <td style="padding:20px 24px;">${isPusat ? `<strong>${log.schoolName}</strong>` : `${log.timeReceived} WIB`}</td>
                  <td style="padding:20px 24px;">
                     <strong style="font-size:16px;">${log.receivedPortions}</strong> 
                     <span style="color:var(--text-muted); font-size:13px;">/ ${log.targetPortions}</span>
                  </td>
                  <td style="padding:20px 24px;">
                     <div style="display:flex; align-items:center; gap:8px;">
                        <span style="width:8px; height:8px; border-radius:50%; background:${log.condition.includes('Baik') ? '#28a745' : '#dc3545'};"></span>
                        ${log.condition}
                     </div>
                  </td>
                  <td style="padding:20px 24px;">
                    <span class="badge ${log.status === 'Selesai' || log.status === 'Disetujui' ? 'badge-good' : 'badge-bad'}" style="padding:6px 14px; border-radius:6px; font-size:12px;">
                      ${log.status}
                    </span>
                  </td>
                </tr>
              `).join('')}
              ${history.length === 0 ? `<tr><td colspan="5" style="padding:60px; text-align:center; color:var(--text-muted); font-weight:600;">Belum ada riwayat laporan distribusi.</td></tr>` : ''}
            </tbody>
          </table>
        </div>

      </div>
      ${Footer.render()}
    `;
  }

  afterMount() {
    // Auth guard
    if (!window.app.services.auth.isAuthenticated()) {
      window.app.router.navigate('login');
      return;
    }

    // Trigger initial fetch if not loaded
    if (!this.state.isLoaded) {
      this.fetchData();
      return;
    }

    const form = this.container.querySelector('#dist-form');
    if (form) {
      const photoInput = this.container.querySelector('#dist-photo');
      const photoPlaceholder = this.container.querySelector('#photo-placeholder');
      const previewList = this.container.querySelector('#preview-list');
      
      const btnOpenCamera = this.container.querySelector('#btn-open-camera');
      const btnBrowseFile = this.container.querySelector('#btn-browse-file');
      
      const cameraModal = this.container.querySelector('#camera-modal');
      const cameraStream = this.container.querySelector('#camera-stream');
      const cameraCanvas = this.container.querySelector('#camera-canvas');
      const btnCapture = this.container.querySelector('#btn-capture');
      const btnCancelCamera = this.container.querySelector('#btn-cancel-camera');

      let stream = null;
      this.capturedFile = null;

      // Handle File Browse
      btnBrowseFile.addEventListener('click', () => photoInput.click());
      photoInput.addEventListener('change', () => {
        if (photoInput.files && photoInput.files[0]) {
          const reader = new FileReader();
          reader.onload = (e) => {
            photoPreview.src = e.target.result;
            photoPlaceholder.style.display = 'none';
            previewWrapper.style.display = 'block';
            this.capturedFile = photoInput.files[0];
          };
          reader.readAsDataURL(photoInput.files[0]);
        }
      });

      // Handle Camera
      btnOpenCamera.addEventListener('click', async () => {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
          });
          cameraStream.srcObject = stream;
          cameraModal.style.display = 'flex';
        } catch (err) {
          window.app.components.toast.show('Gagal mengakses kamera: ' + err.message);
        }
      });

      const closeCamera = () => {
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
          stream = null;
        }
        cameraModal.style.display = 'none';
      };

      btnCancelCamera.addEventListener('click', closeCamera);

      btnCapture.addEventListener('click', () => {
        const context = cameraCanvas.getContext('2d');
        cameraCanvas.width = cameraStream.videoWidth;
        cameraCanvas.height = cameraStream.videoHeight;
        context.drawImage(cameraStream, 0, 0);
        
        cameraCanvas.toBlob((blob) => {
          const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
          this.capturedFiles.push(file);
          updatePreviews();
          closeCamera();
        }, 'image/jpeg', 0.8);
      });

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const portions = this.container.querySelector('#dist-portions').value;
        const condition = this.container.querySelector('#dist-condition').value;
        const notes = this.container.querySelector('#dist-notes').value;
        const schoolIdSelect = this.container.querySelector('#dist-school-id');
        const schoolId = schoolIdSelect ? schoolIdSelect.value : null;

        if (this.capturedFiles.length === 0) {
          window.app.components.toast.show('Harap lampirkan minimal 1 bukti foto makanan!');
          return;
        }

        try {
          const btn = this.container.querySelector('#btn-submit-dist');
          btn.disabled = true;
          btn.innerHTML = '<span class="spinner"></span> Mengirim...';

          await window.app.services.distribution.submitReport({
            receivedPortions: portions,
            condition: condition,
            notes: notes,
            photos: this.capturedFiles, // Pass the array of files
            school_id: schoolId
          });

          window.app.components.toast.show('Laporan distribusi berhasil dikirim!');
          
          this.state.isLoaded = false;
          this.fetchData();
        } catch (err) {
          window.app.components.toast.show('Gagal mengirim laporan: ' + err.message);
          const btn = this.container.querySelector('#btn-submit-dist');
          btn.disabled = false;
          btn.innerHTML = 'Kirim Laporan ke Pusat';
        }
      });
    }

    const downloadBtn = this.container.querySelector('#btn-download-rekap');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => {
        if (this.state.history.length === 0) {
           window.app.components.toast.show('Belum ada data untuk diunduh.');
           return;
        }
        
        // Buat header CSV
        let csvContent = "Tanggal,Waktu Tiba,Porsi Diterima,Target Porsi,Kondisi,Status,Sekolah\n";
        
        // Loop data history
        this.state.history.forEach(log => {
           // Escaping untuk amankan tanda koma di notes atau condition
           const condition = '"' + log.condition + '"';
           const school = '"' + (log.schoolName || 'SDN 01 Menteng') + '"';
           
           const row = [
             log.date,
             log.timeReceived,
             log.receivedPortions,
             log.targetPortions,
             condition,
             log.status,
             school
           ].join(",");
           
           csvContent += row + "\n";
        });

        // Trigger file download (CSV format yang bisa dibuka Excel)
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "Rekap_Distribusi_GiziKita.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        window.app.components.toast.show('Rekap berhasil diunduh!');
      });
    }

    if (window.lucide) window.lucide.createIcons();
  }
}
