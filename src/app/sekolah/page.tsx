'use client';

import { useState, useEffect } from 'react';
import { 
  MapPin, 
  Info, 
  Loader2, 
  Filter,
  GraduationCap,
  Users
} from 'lucide-react';
import SchoolService from '@/js/services/SchoolService';
import { School } from '@/js/types';

export default function SchoolListPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [provinces, setProvinces] = useState<string[]>(['Semua']);
  const [activeFilter, setActiveFilter] = useState('Semua');
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    fetchProvinces();
  }, []);

  useEffect(() => {
    fetchSchools();
  }, [activeFilter, retryCount]);

  const fetchProvinces = async () => {
    try {
      const data = await SchoolService.getProvinces();
      setProvinces(data);
    } catch (err) {
      console.error('Failed to fetch provinces');
    }
  };

  const fetchSchools = async () => {
    setIsLoading(true);
    try {
      const data = await SchoolService.getSchoolsByProvince(activeFilter);
      setSchools(data);
    } catch (err) {
      console.error('Failed to fetch schools');
      if (retryCount < 3) {
        setTimeout(() => setRetryCount(prev => prev + 1), 2000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ background: 'var(--cream)', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* Decorative Elements */}
      <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(139,28,63,0.03)', zIndex: 0 }}></div>
      <div style={{ position: 'absolute', bottom: '-50px', left: '-50px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(232,103,58,0.03)', zIndex: 0 }}></div>

      <div className="page-inner wide" style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '48px', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <h1 className="page-heading" style={{ fontFamily: 'var(--font-playfair)', fontSize: '42px', fontWeight: 900, color: 'var(--maroon)', margin: 0, lineHeight: 1.1 }}>
              Daftar Sekolah Penerima
            </h1>
            <p className="page-sub" style={{ color: 'var(--text-muted)', marginTop: '12px', fontSize: '16px' }}>
              Data real sekolah negeri peserta program Makan Bergizi Gratis (MBG).
            </p>
          </div>
          
          <div className="filter-card" style={{ background: '#fff', padding: '12px 24px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid #eee', display: 'flex', alignItems: 'center', gap: '16px', minWidth: '280px' }}>
            <Filter size={20} color="var(--maroon)" />
            <div style={{ flex: 1 }}>
               <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Filter Provinsi</label>
               <select 
                 value={activeFilter}
                 onChange={(e) => setActiveFilter(e.target.value)}
                 style={{ width: '100%', border: 'none', background: 'none', fontSize: '15px', fontWeight: 700, color: 'var(--maroon)', outline: 'none', cursor: 'pointer' }}
               >
                 {provinces.map(p => <option key={p} value={p}>{p}</option>)}
               </select>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden', border: 'none', boxShadow: '0 30px 80px rgba(139,28,63,0.08)', borderRadius: '24px', background: '#fff' }}>
          {isLoading && schools.length === 0 ? (
            <div style={{ padding: '100px 0', textAlign: 'center' }}>
               <Loader2 className="spinner" size={48} color="var(--maroon)" />
               <p style={{ marginTop: '20px', color: 'var(--text-muted)', fontWeight: 600 }}>Menghubungkan ke database GiziKita...</p>
            </div>
          ) : (
            <div className="table-container" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
                <thead style={{ background: '#FFF0C0' }}>
                  <tr>
                    <th style={{ padding: '24px', fontSize: '14px', fontWeight: 800, color: 'var(--maroon)' }}>No.</th>
                    <th style={{ padding: '24px', fontSize: '14px', fontWeight: 800, color: 'var(--maroon)' }}>Nama Sekolah</th>
                    <th style={{ padding: '24px', fontSize: '14px', fontWeight: 800, color: 'var(--maroon)' }}>Kota / Kabupaten</th>
                    <th style={{ padding: '24px', fontSize: '14px', fontWeight: 800, color: 'var(--maroon)' }}>Provinsi</th>
                    <th style={{ padding: '24px', fontSize: '14px', fontWeight: 800, color: 'var(--maroon)' }}>Siswa</th>
                    <th style={{ padding: '24px', fontSize: '14px', fontWeight: 800, color: 'var(--maroon)' }}>Status MBG</th>
                  </tr>
                </thead>
                <tbody>
                  {schools.map((school, i) => (
                    <tr key={school.id} className="school-row" style={{ borderBottom: '1px solid #f8f8f8', transition: 'all 0.2s ease' }}>
                      <td style={{ padding: '20px 24px', color: 'var(--text-muted)', fontSize: '14px' }}>{i + 1}</td>
                      <td style={{ padding: '20px 24px' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '36px', height: '36px', background: 'rgba(232,103,58,0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                               <GraduationCap size={18} color="var(--coral)" />
                            </div>
                            <strong style={{ fontSize: '15px', color: 'var(--maroon)' }}>{school.name}</strong>
                         </div>
                      </td>
                      <td style={{ padding: '20px 24px', fontSize: '14px' }}>{school.city}</td>
                      <td style={{ padding: '20px 24px', fontSize: '14px' }}>
                         <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <MapPin size={14} color="var(--text-muted)" /> {school.province}
                         </span>
                      </td>
                      <td style={{ padding: '20px 24px', fontSize: '14px' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                            <Users size={14} /> {school.pupils.toLocaleString('id-ID')}
                         </div>
                      </td>
                      <td style={{ padding: '20px 24px' }}>
                        <span style={{ 
                          padding: '6px 14px', 
                          borderRadius: '30px', 
                          fontSize: '11px', 
                          fontWeight: 800, 
                          background: school.status.includes('Pilot') ? '#d4edda' : '#eee',
                          color: school.status.includes('Pilot') ? '#155724' : '#666'
                        }}>
                          {school.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {schools.length === 0 && !isLoading && (
                    <tr>
                      <td colSpan={6} style={{ padding: '80px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        Tidak ada data sekolah untuk wilayah ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={{ marginTop: '48px', padding: '32px', background: 'rgba(139,28,63,0.03)', borderRadius: '24px', display: 'flex', gap: '20px', alignItems: 'center', border: '1px solid rgba(139,28,63,0.08)' }}>
           <div style={{ width: '48px', height: '48px', background: 'var(--maroon)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
             <Info size={24} />
           </div>
           <div>
             <strong style={{ display: 'block', fontSize: '16px', color: 'var(--maroon)', marginBottom: '4px' }}>Sumber Data Resmi</strong>
             <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
               Data ini dikelola secara terpusat oleh <strong>Badan Gizi Nasional</strong> dan diperbarui secara berkala sesuai perluasan Satuan Pelayanan Pemenuhan Gizi (SPPG) di setiap provinsi di Indonesia.
             </p>
           </div>
        </div>
      </div>

      <style jsx>{`
        .school-row:hover {
          background-color: rgba(139,28,63,0.02) !important;
          transform: scale(1.002);
        }
        .filter-card:focus-within {
          border-color: var(--maroon) !important;
          box-shadow: 0 10px 30px rgba(139,28,63,0.1) !important;
        }
        @media (max-width: 860px) {
           .page-heading { font-size: 32px !important; }
           .page-inner { padding: 30px 16px !important; }
        }
      `}</style>
    </div>
  );
}
