'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Camera, 
  Upload, 
  Download, 
  Loader2, 
  Plus, 
  X,
  MapPin,
  ClipboardList
} from 'lucide-react';
import { useAuthStore } from '@/js/store/authStore';
import { useUIStore } from '@/js/store/uiStore';
import DistributionService from '@/js/services/DistributionService';
import SchoolService from '@/js/services/SchoolService';
import NotificationService from '@/js/services/NotificationService';

export default function DistributionPage() {
  const router = useRouter();
  const { currentUser, isInitialized } = useAuthStore();
  const showToast = useUIStore((state) => state.showToast);

  // State
  const [isLoaded, setIsLoaded] = useState(false);
  const [isReportedToday, setIsReportedToday] = useState(false);
  const [metrics, setMetrics] = useState({ totalReceived: 0, successRate: 0, issues: 0 });
  const [history, setHistory] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [capturedFiles, setCapturedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form State
  const [selectedSchool, setSelectedSchool] = useState('');
  const [portions, setPortions] = useState('');
  const [condition, setCondition] = useState('');
  const [notes, setNotes] = useState('');

  // Camera Refs
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [hasCheckedAlerts, setHasCheckedAlerts] = useState(false);
  const alertsCheckedRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isInitialized && !currentUser) {
      router.push('/login');
      return;
    }

    if (isInitialized && currentUser) {
      fetchData();
    }
  }, [isInitialized, currentUser]);

  const fetchData = async () => {
    try {
      const [todayReport, todayMetrics, distHistory, schoolData] = await Promise.all([
        DistributionService.checkTodayReport(),
        DistributionService.getTodayMetrics(),
        DistributionService.getHistory(),
        SchoolService.getSchoolsByProvince('Semua')
      ]);

      setIsReportedToday(todayReport);
      setMetrics(todayMetrics);
      setHistory(distHistory);
      setSchools(schoolData);
    } catch (err) {
      showToast('Gagal memuat data distribusi.');
    } finally {
      setIsLoaded(true);
    }
  };

  // Check for missing reports (Admin Pusat Only)
  useEffect(() => {
    if (currentUser?.role === 'admin_pusat' && isLoaded && !alertsCheckedRef.current) {
      alertsCheckedRef.current = true;
      const now = new Date();
      // Send warning if it's after 2 PM (14:00)
      if (now.getHours() >= 14) {
        DistributionService.getMissingReportsToday().then(missing => {
          if (missing.length > 0) {
            NotificationService.notify(
              currentUser.id,
              'Peringatan Laporan Kosong',
              `Terdapat ${missing.length} sekolah yang belum mengirim laporan hari ini.`,
              '/distribusi',
              'warning'
            );
          }
        });
      }
    }

    // Check for late report (Admin Sekolah Only)
    if (currentUser?.role === 'admin_sekolah' && isLoaded && !alertsCheckedRef.current) {
      alertsCheckedRef.current = true;
      const now = new Date();
      // Send nudge if it's after 12 PM (12:00) and not reported today
      if (now.getHours() >= 12 && !isReportedToday) {
        NotificationService.notify(
          currentUser.id,
          'Ingat Laporan Harian',
          'Anda belum mengirim laporan distribusi hari ini. Harap segera lengkapi data.',
          '/distribusi',
          'warning'
        );
      }
      setHasCheckedAlerts(true);
    }
  }, [isLoaded, currentUser, hasCheckedAlerts, isReportedToday]);

  // --- CAMERA LOGIC ---
  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
      streamRef.current = stream;
      setIsCameraOpen(true);
    } catch (err: any) {
      showToast('Gagal mengakses kamera: ' + err.message);
    }
  };

  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
            setCapturedFiles(prev => [...prev, file]);
            closeCamera();
          }
        }, 'image/jpeg', 0.8);
      }
    }
  };

  const removePhoto = (index: number) => {
    setCapturedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // --- FORM SUBMISSION ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (capturedFiles.length === 0) {
      showToast('Harap lampirkan minimal 1 bukti foto makanan!');
      return;
    }

    setIsSubmitting(true);
    try {
      await DistributionService.submitReport({
        receivedPortions: portions,
        condition: condition,
        notes: notes,
        photos: capturedFiles,
        school_id: selectedSchool || currentUser?.school_id
      });

      showToast('Laporan distribusi berhasil dikirim!');

      // Notify user locally about the action
      if (currentUser) {
        await NotificationService.notify(
          currentUser.id,
          'Laporan Terkirim',
          `Laporan harian unit sekolah telah berhasil dicatat oleh sistem.`,
          '/distribusi',
          'success'
        );
      }

      fetchData(); // Refresh data
      setPortions('');
      setCondition('');
      setNotes('');
      setCapturedFiles([]);
    } catch (err: any) {
      showToast(err.message || 'Gagal mengirim laporan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadCSV = () => {
    if (history.length === 0) {
      showToast('Belum ada data untuk diunduh.');
      return;
    }
    
    let csvContent = "Tanggal,Waktu Tiba,Porsi Diterima,Target Porsi,Kondisi,Status,Sekolah\n";
    history.forEach(log => {
      const row = [
        log.date,
        log.timeReceived,
        log.receivedPortions,
        log.targetPortions,
        `"${log.condition}"`,
        log.status,
        `"${log.schoolName}"`
      ].join(",");
      csvContent += row + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Rekap_Distribusi_GiziKita.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Rekap berhasil diunduh!');
  };

  if (!isLoaded) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
         <Loader2 className="spinner" size={40} color="var(--maroon)" />
      </div>
    );
  }

  const isPusat = currentUser?.role === 'admin_pusat';
  const schoolLabel = isPusat ? 'Seluruh Sekolah (Pusat)' : (currentUser?.schoolName || 'Instansi Terdaftar');

  return (
    <div className="page-inner wide">
      <div className="page-header">
         <div>
            <span className="eyebrow">Operasional</span>
            <h1 className="page-title">
              {isPusat ? 'Dashboard Pengelolaan Distribusi' : 'Kelola Laporan Distribusi'}
            </h1>
            <p className="page-sub">
              {isPusat ? 'Pantau performa distribusi nasional dan rekapitulasi data MBG.' : 'Pantau dan laporkan penerimaan makanan bergizi (MBG) secara real-time.'}
            </p>
         </div>
         <div className="status-badge" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: 'var(--white)', border: '1px solid rgba(139, 28, 63, 0.08)', borderRadius: '12px', fontSize: '14px', fontWeight: 600, color: 'var(--maroon)' }}>
            <MapPin size={16} />
            <span>{isPusat ? 'Mode' : 'Sekolah'}: <span style={{ color: 'var(--text)' }}>{schoolLabel}</span></span>
         </div>
      </div>

      {/* Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '56px' }}>
        <MetricCard 
          title={`Porsi Diterima (${isPusat ? 'Nasional' : 'Bulan Ini'})`}
          value={metrics.totalReceived.toLocaleString('id-ID')}
          unit="Porsi"
          footer={isPusat ? 'Akumulasi Seluruh Instansi' : 'Sesuai Kuota Target'}
          color="var(--maroon)"
        />
        <MetricCard 
          title="Tingkat Kesesuaian Gizi"
          value={`${metrics.successRate}%`}
          progressBar={metrics.successRate}
          color="var(--coral)"
        />
        <div className="card metric-card">
          <div className="metric-title">
            {isPusat ? 'Laporan Masuk' : 'Status Hari Ini'}
          </div>
          <div style={{ marginTop: '8px' }}>
             {isPusat ? (
               <div className="metric-value" style={{ color: 'var(--text)' }}>{history.length} <span className="metric-unit">Data</span></div>
             ) : (
               isReportedToday ? (
                 <span className="badge badge-good" style={{ fontSize: '14px', padding: '6px 12px' }}>Telah Dilaporkan</span>
               ) : (
                 <span className="badge badge-pending" style={{ fontSize: '14px', padding: '6px 12px' }}>Belum Dilaporkan</span>
               )
             )}
          </div>
          <div className="metric-footer" style={{ color: 'var(--text-muted)' }}>{isPusat ? 'Data Terverifikasi' : 'Target: 450 Porsi / Hari'}</div>
        </div>
      </div>

      {/* Form Section */}
      <div className="card card-large" style={{ marginBottom: '60px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
           <div style={{ width: '40px', height: '40px', background: 'var(--maroon)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900 }}>
             <Plus size={24} />
           </div>
           <h2 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text)', margin: 0 }}>Kirim Laporan Harian</h2>
        </div>
        
        {isReportedToday ? (
          <div style={{ padding: '40px', background: 'rgba(40,167,69,0.05)', borderRadius: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ fontSize: '52px', marginBottom: '16px' }}>✨</div>
            <strong style={{ fontSize: '20px', color: '#155724' }}>Terima Kasih, Laporan Terkirim!</strong>
            <p style={{ marginTop: '12px', color: '#155724', opacity: 0.8, maxWidth: '400px', lineHeight: 1.6 }}>
              Data penerimaan makanan hari ini telah berhasil diverifikasi oleh sistem pusat. Anda dapat melihat detailnya di tabel riwayat di bawah.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '32px' }}>
              {isPusat && (
                <div className="form-group">
                  <label>Pilih Sekolah</label>
                  <select 
                    value={selectedSchool} 
                    onChange={(e) => setSelectedSchool(e.target.value)}
                    required
                  >
                    <option value="" disabled>Pilih Sekolah...</option>
                    {schools.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="form-group">
                <label>Jumlah Porsi Diterima (Target: 450)</label>
                <input 
                  type="number" 
                  value={portions}
                  onChange={(e) => setPortions(e.target.value)}
                  min="0" 
                  max="2000" 
                  placeholder="Misal: 450" 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Kondisi Makanan</label>
                <select 
                  value={condition} 
                  onChange={(e) => setCondition(e.target.value)}
                  required
                >
                  <option value="" disabled>Pilih Kondisi...</option>
                  {['Sangat Baik', 'Baik', 'Ada Kerusakan/Kekurangan'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Bukti Foto Makanan Tiba (Minimal 1)</label>
              <div style={{ border: '2px dashed var(--border)', borderRadius: '20px', padding: '32px', textAlign: 'center', background: '#fafafa' }}>
                 {capturedFiles.length === 0 ? (
                    <div>
                      <div style={{ fontSize: '40px', marginBottom: '16px' }}>📸</div>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <button type="button" className="btn btn-outline btn-sm" onClick={openCamera}>
                          <Camera size={16} /> Ambil Foto
                        </button>
                        <button type="button" className="btn btn-outline btn-sm" onClick={() => document.getElementById('dist-photo')?.click()}>
                          <Upload size={16} /> Pilih File
                        </button>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '12px' }}>Lampirkan minimal 1 foto bukti fisik makanan</div>
                    </div>
                 ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '16px' }}>
                      {capturedFiles.map((file, idx) => (
                        <div key={idx} style={{ position: 'relative', aspectRatio: '1/1', borderRadius: '12px', overflow: 'hidden' }}>
                          <img src={URL.createObjectURL(file)} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button 
                            type="button" 
                            onClick={() => removePhoto(idx)}
                            style={{ position: 'absolute', top: '5px', right: '5px', background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                      <button 
                        type="button" 
                        onClick={openCamera}
                        style={{ border: '2px dashed #ccc', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', cursor: 'pointer', background: 'none' }}
                      >
                        <Plus size={24} />
                      </button>
                    </div>
                 )}
                 <input type="file" id="dist-photo" accept="image/*" style={{ display: 'none' }} multiple onChange={(e) => {
                   if (e.target.files) {
                     setCapturedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                   }
                 }} />
              </div>
            </div>

            <div className="form-group">
              <label>Catatan Tambahan (Opsional)</label>
              <textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Misal: Kurir tiba pukul 10:15, semua paket masih hangat..." 
              ></textarea>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary btn-lg" disabled={isSubmitting}>
                {isSubmitting ? <><Loader2 size={20} className="spinner" /> Mengirim...</> : 'Kirim Laporan ke Pusat'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* History Table */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
         <h2 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text)', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
           <ClipboardList /> Riwayat Distribusi
         </h2>
         <button className="btn btn-sm btn-outline" onClick={downloadCSV}>
           <Download size={16} /> Download Rekap (CSV)
         </button>
      </div>
      
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>{isPusat ? 'Sekolah' : 'Waktu Tiba'}</th>
              <th>Porsi Diterima</th>
              <th>Kondisi</th>
              <th>Status Verifikasi</th>
            </tr>
          </thead>
          <tbody>
            {history.map((log, idx) => (
              <tr key={idx} style={{ background: log.status === 'Bermasalah' ? 'rgba(232,103,58,0.05)' : 'transparent' }}>
                <td style={{ fontWeight: 700, color: 'var(--text)' }}>{log.date}</td>
                <td>{isPusat ? <strong>{log.schoolName}</strong> : `${log.timeReceived} WIB`}</td>
                <td>
                   <strong style={{ fontSize: '16px' }}>{log.receivedPortions}</strong> 
                   <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}> / {log.targetPortions}</span>
                </td>
                <td>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: log.condition.includes('Baik') ? '#28a745' : '#dc3545' }}></span>
                      {log.condition}
                   </div>
                </td>
                <td>
                  <span className={`badge ${log.status === 'Selesai' || log.status === 'Disetujui' ? 'badge-good' : 'badge-bad'}`}>
                    {log.status}
                  </span>
                </td>
              </tr>
            ))}
            {history.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Belum ada riwayat laporan distribusi.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Camera Modal */}
      {isCameraOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 2000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '500px', background: '#000', borderRadius: '20px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <video ref={videoRef} autoPlay playsInline style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover' }}></video>
            <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#111' }}>
              <button type="button" className="btn btn-outline" onClick={closeCamera} style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}>Batal</button>
              <button type="button" onClick={capturePhoto} style={{ width: '64px', height: '64px', background: '#fff', border: '5px solid rgba(255,255,255,0.3)', borderRadius: '50%', cursor: 'pointer' }}></button>
              <div style={{ width: '60px' }}></div>
            </div>
          </div>
          <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
        </div>
      )}
    </div>
  );
}

// --- HELPER COMPONENTS ---

function MetricCard({ title, value, unit = '', footer = '', progressBar = 0, color }: any) {
  return (
    <div className="card metric-card">
      <div className="metric-title">{title}</div>
      <div className="metric-value" style={{ color: color }}>
        {value} {unit && <span className="metric-unit">{unit}</span>}
      </div>
      {progressBar > 0 ? (
        <div className="metric-progress-bg">
           <div className="metric-progress-fill" style={{ width: `${progressBar}%`, background: color }}></div>
        </div>
      ) : (
        <div className="metric-footer" style={{ color: '#28a745' }}>
           <span className="metric-dot" style={{ background: '#28a745' }}></span> {footer}
        </div>
      )}
    </div>
  );
}
