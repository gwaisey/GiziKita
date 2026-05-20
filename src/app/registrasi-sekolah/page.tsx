'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  GraduationCap, 
  Building2, 
  Users, 
  MapPin, 
  FileText, 
  Upload, 
  CheckCircle2, 
  Loader2, 
  ArrowLeft,
  X
} from 'lucide-react';
import SchoolService from '@/js/services/SchoolService';
import { useUIStore } from '@/js/store/uiStore';

export default function RegisterSchoolPage() {
  const router = useRouter();
  const showToast = useUIStore((state) => state.showToast);

  // Form State
  const [name, setName] = useState('');
  const [npsn, setNpsn] = useState('');
  const [address, setAddress] = useState('');
  const [pupils, setPupils] = useState('');
  const [level, setLevel] = useState('');
  const [file, setFile] = useState<File | null>(null);
  
  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!name || !npsn || !address || !pupils || !level) {
      showToast('Harap lengkapi seluruh data sekolah.');
      return;
    }

    if (npsn.length !== 8 || isNaN(Number(npsn))) {
      showToast('NPSN harus terdiri dari 8 digit angka.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await SchoolService.registerSchool({
        name,
        npsn,
        address,
        pupils: Number(pupils),
        level,
        file: file || undefined
      });

      if (result.success) {
        setIsSuccess(true);
        showToast('Pendaftaran sekolah berhasil dikirim!');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        showToast(result.message || 'Gagal mendaftarkan sekolah.');
      }
    } catch (err) {
      showToast('Terjadi kesalahan koneksi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > 5 * 1024 * 1024) {
        showToast('Ukuran file maksimal 5MB.');
        return;
      }
      setFile(selectedFile);
    }
  };

  if (isSuccess) {
    return (
      <div style={{ background: 'var(--cream)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ background: '#fff', padding: '60px 40px', borderRadius: '32px', boxShadow: '0 30px 80px rgba(0,0,0,0.05)', maxWidth: '600px', textAlign: 'center' }}>
          <div style={{ width: '80px', height: '80px', background: '#d4edda', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: '#155724' }}>
            <CheckCircle2 size={48} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: '32px', fontWeight: 900, color: 'var(--maroon)', marginBottom: '16px' }}>Pendaftaran Berhasil!</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '16px', lineHeight: 1.6, marginBottom: '32px' }}>
            Terima kasih telah mendaftarkan sekolah Anda. Tim verifikator Badan Gizi Nasional akan segera meninjau permohonan Anda. Konfirmasi akan dikirimkan melalui kontak yang terdaftar.
          </p>
          <button className="btn btn-primary" onClick={() => router.push('/sekolah')} style={{ padding: '16px 40px', borderRadius: '16px' }}>
            Lihat Daftar Sekolah
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--cream)', position: 'relative', overflow: 'hidden', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Decorative SVG */}
      <svg className="deco-flower" style={{ position: 'absolute', right: '-30px', bottom: '120px', width: '260px', opacity: 0.15 }} viewBox="0 0 200 200">
        <g transform="translate(100,100)">
          <ellipse rx="45" ry="22" transform="rotate(0)" fill="#E8673A"/><ellipse rx="45" ry="22" transform="rotate(30)" fill="#E8673A"/><ellipse rx="45" ry="22" transform="rotate(60)" fill="#E8673A"/><ellipse rx="45" ry="22" transform="rotate(90)" fill="#E8673A"/><ellipse rx="45" ry="22" transform="rotate(120)" fill="#E8673A"/><ellipse rx="45" ry="22" transform="rotate(150)" fill="#E8673A"/><circle r="32" fill="#FFF0C0"/><circle r="18" fill="#F4C662"/>
        </g>
      </svg>

      <div className="page-inner" style={{ flex: 1, padding: '40px 20px', maxWidth: '800px', margin: '0 auto' }}>
        <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--maroon)', fontWeight: 700, border: 'none', background: 'none', cursor: 'pointer', marginBottom: '32px' }}>
          <ArrowLeft size={20} /> Kembali
        </button>

        <h1 className="page-heading" style={{ fontFamily: 'var(--font-playfair)', fontSize: '40px', fontWeight: 900, color: 'var(--maroon)', margin: '0 0 12px 0' }}>
          Daftarkan Sekolah Anda
        </h1>
        <p className="page-sub" style={{ color: 'var(--text-muted)', fontSize: '18px', marginBottom: '40px' }}>
          Bergabunglah dalam misi nasional Makan Bergizi Gratis (MBG).
        </p>

        <div style={{ background: '#fff', borderRadius: '24px', padding: '40px', boxShadow: '0 25px 70px rgba(139,28,63,0.08)' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '28px' }}>
              <div className="form-group">
                <label style={{ display: 'block', fontWeight: 800, fontSize: '13px', color: 'var(--maroon)', marginBottom: '8px', textTransform: 'uppercase' }}>Nama Sekolah Resmi</label>
                <div style={{ position: 'relative' }}>
                  <Building2 size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#ccc' }} />
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: SD Negeri 05 Bandung"
                    style={{ width: '100%', padding: '14px 16px 14px 48px', borderRadius: '12px', border: '2px solid #eee', fontSize: '15px' }}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label style={{ display: 'block', fontWeight: 800, fontSize: '13px', color: 'var(--maroon)', marginBottom: '8px', textTransform: 'uppercase' }}>NPSN (8 Digit)</label>
                <div style={{ position: 'relative' }}>
                  <FileText size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#ccc' }} />
                  <input 
                    type="text" 
                    value={npsn}
                    onChange={(e) => setNpsn(e.target.value)}
                    maxLength={8}
                    placeholder="Masukkan 8 digit NPSN"
                    style={{ width: '100%', padding: '14px 16px 14px 48px', borderRadius: '12px', border: '2px solid #eee', fontSize: '15px' }}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label style={{ display: 'block', fontWeight: 800, fontSize: '13px', color: 'var(--maroon)', marginBottom: '8px', textTransform: 'uppercase' }}>Alamat Lengkap Sekolah</label>
              <div style={{ position: 'relative' }}>
                <MapPin size={20} style={{ position: 'absolute', left: '16px', top: '16px', color: '#ccc' }} />
                <textarea 
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Jl. Raya Utama No. 123, Kelurahan, Kecamatan..."
                  style={{ width: '100%', padding: '14px 16px 14px 48px', borderRadius: '12px', border: '2px solid #eee', fontSize: '15px', minHeight: '100px' }}
                  required
                ></textarea>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '28px' }}>
              <div className="form-group">
                <label style={{ display: 'block', fontWeight: 800, fontSize: '13px', color: 'var(--maroon)', marginBottom: '8px', textTransform: 'uppercase' }}>Jumlah Siswa</label>
                <div style={{ position: 'relative' }}>
                  <Users size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#ccc' }} />
                  <input 
                    type="number" 
                    value={pupils}
                    onChange={(e) => setPupils(e.target.value)}
                    placeholder="Jumlah seluruh siswa"
                    style={{ width: '100%', padding: '14px 16px 14px 48px', borderRadius: '12px', border: '2px solid #eee', fontSize: '15px' }}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label style={{ display: 'block', fontWeight: 800, fontSize: '13px', color: 'var(--maroon)', marginBottom: '8px', textTransform: 'uppercase' }}>Jenjang Pendidikan</label>
                <div style={{ position: 'relative' }}>
                  <GraduationCap size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#ccc' }} />
                  <select 
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    style={{ width: '100%', padding: '14px 16px 14px 48px', borderRadius: '12px', border: '2px solid #eee', fontSize: '15px', appearance: 'none', background: '#fff' }}
                    required
                  >
                    <option value="">-- Pilih Jenjang --</option>
                    <option>SD (Sekolah Dasar)</option>
                    <option>SMP (Sekolah Menengah Pertama)</option>
                    <option>SMA (Sekolah Menengah Atas)</option>
                    <option>SMK (Sekolah Menengah Kejuruan)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label style={{ display: 'block', fontWeight: 800, fontSize: '13px', color: 'var(--maroon)', marginBottom: '8px', textTransform: 'uppercase' }}>Surat Permohonan Resmi (PDF)</label>
              <div 
                style={{ border: '2px dashed #ddd', borderRadius: '16px', padding: '32px', textAlign: 'center', background: file ? 'rgba(40,167,69,0.03)' : '#fafafa', cursor: 'pointer', transition: 'all 0.2s' }}
                onClick={() => document.getElementById('reg-file')?.click()}
                onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--maroon)'}
                onMouseOut={(e) => e.currentTarget.style.borderColor = '#ddd'}
              >
                {file ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                    <div style={{ background: '#d4edda', padding: '8px', borderRadius: '8px' }}>
                      <FileText size={24} color="#155724" />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 800, fontSize: '14px', color: '#155724' }}>{file.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                    </div>
                    <button 
                      type="button" 
                      onClick={(e) => { e.stopPropagation(); setFile(null); }}
                      style={{ background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer', padding: '4px' }}
                    >
                      <X size={20} />
                    </button>
                  </div>
                ) : (
                  <div>
                    <Upload size={32} color="var(--maroon)" style={{ marginBottom: '12px' }} />
                    <div style={{ fontWeight: 800, color: 'var(--maroon)', fontSize: '15px' }}>Klik untuk Unggah File</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Surat permohonan resmi dalam format PDF (maks. 5MB)</div>
                  </div>
                )}
                <input type="file" id="reg-file" accept=".pdf" style={{ display: 'none' }} onChange={handleFileChange} />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={isSubmitting}
              style={{ width: '100%', padding: '18px', borderRadius: '16px', fontSize: '17px', fontWeight: 900, marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}
            >
              {isSubmitting ? <Loader2 className="spinner" size={24} /> : 'Kirim Permohonan Pendaftaran'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
