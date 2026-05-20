'use client';


import { 
  ShieldCheck, 
  Eye, 
  Lock, 
  UserCheck, 
  FileEdit, 
  Mail,
  Info,
  CheckCircle
} from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div style={{ background: 'var(--cream)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header */}
      <section style={{ padding: '100px 40px 60px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-100px', left: '50%', transform: 'translateX(-50%)', width: '300px', height: '300px', background: 'rgba(139,28,63,0.03)', borderRadius: '50%', zIndex: 0 }}></div>
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'rgba(139,28,63,0.05)', padding: '10px 20px', borderRadius: '50px', color: 'var(--maroon)', fontWeight: 800, fontSize: '13px', marginBottom: '24px' }}>
            <ShieldCheck size={18} /> KEAMANAN DATA TERJAMIN
          </div>
          <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: '56px', fontWeight: 900, color: 'var(--maroon)', marginBottom: '16px', letterSpacing: '-1px' }}>Kebijakan Privasi</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '15px', fontWeight: 600 }}>Terakhir diperbarui: 30 April 2026</p>
        </div>
      </section>

      {/* Content */}
      <section style={{ maxWidth: '900px', margin: '0 auto 100px', padding: '0 20px', flex: 1, position: 'relative', zIndex: 1 }}>
        <div style={{ background: '#fff', padding: '60px 80px', borderRadius: '40px', boxShadow: '0 40px 100px rgba(139,28,63,0.06)', border: '1px solid #f5f5f5' }}>
          
          {/* Section 1 */}
          <div style={{ marginBottom: '48px' }}>
            <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '28px', fontWeight: 800, color: 'var(--maroon)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Info size={24} color="var(--coral)" /> 1. Pendahuluan
            </h2>
            <p style={{ fontSize: '16px', lineHeight: 1.8, color: 'var(--text)', margin: 0 }}>
              Selamat datang di GiziKita. Kami sangat menghargai privasi Anda dan berkomitmen untuk melindungi data pribadi Anda. Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi informasi Anda saat menggunakan platform pemantauan gizi nasional ini.
            </p>
          </div>

          {/* Section 2 */}
          <div style={{ marginBottom: '48px' }}>
            <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '28px', fontWeight: 800, color: 'var(--maroon)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Eye size={24} color="var(--coral)" /> 2. Informasi yang Kami Kumpulkan
            </h2>
            <p style={{ fontSize: '16px', lineHeight: 1.8, color: 'var(--text)', marginBottom: '20px' }}>
              Kami mengumpulkan beberapa jenis informasi untuk memberikan layanan terbaik dan transparansi program:
            </p>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { label: 'Informasi Profil', text: 'Nama, alamat email, dan username saat Anda melakukan pendaftaran akun.' },
                { label: 'Informasi Sekolah', text: 'Data NPSN, alamat fisik, jenjang pendidikan, dan jumlah murid terdaftar.' },
                { label: 'Data Distribusi', text: 'Laporan harian, waktu tiba logistik, dan bukti foto fisik makanan.' },
                { label: 'Log Aktivitas', text: 'Informasi interaksi Anda dengan platform untuk keperluan audit dan keamanan.' }
              ].map((item, idx) => (
                <li key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                   <div style={{ marginTop: '6px' }}><CheckCircle size={16} color="var(--maroon)" /></div>
                   <div style={{ fontSize: '15px', lineHeight: 1.6 }}>
                      <strong style={{ color: 'var(--maroon)' }}>{item.label}:</strong> {item.text}
                   </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Section 3 */}
          <div style={{ marginBottom: '48px' }}>
            <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '28px', fontWeight: 800, color: 'var(--maroon)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <UserCheck size={24} color="var(--coral)" /> 3. Penggunaan Informasi
            </h2>
            <p style={{ fontSize: '16px', lineHeight: 1.8, color: 'var(--text)', marginBottom: '20px' }}>
              Informasi yang kami kumpulkan digunakan secara eksklusif untuk kepentingan program nasional:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
               {[
                 'Memproses verifikasi pendaftaran sekolah baru.',
                 'Memantau real-time jalur distribusi pangan bergizi.',
                 'Layanan bantuan cerdas melalui Chatbot AI 24/7.',
                 'Analisis data statistik untuk transparansi publik.'
               ].map((text, idx) => (
                 <div key={idx} style={{ background: '#fafafa', padding: '16px 20px', borderRadius: '12px', fontSize: '14px', borderLeft: '3px solid var(--maroon)' }}>
                   {text}
                 </div>
               ))}
            </div>
          </div>

          {/* Section 4 */}
          <div style={{ marginBottom: '48px' }}>
            <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '28px', fontWeight: 800, color: 'var(--maroon)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Lock size={24} color="var(--coral)" /> 4. Keamanan Data
            </h2>
            <p style={{ fontSize: '16px', lineHeight: 1.8, color: 'var(--text)', margin: 0 }}>
              Kami menggunakan teknologi enkripsi SSL terkini dan protokol keamanan database standar industri (AES-256) untuk memastikan data Anda aman dari akses yang tidak sah. Audit keamanan dilakukan secara berkala oleh tim teknis pusat.
            </p>
          </div>

          {/* Section 5 */}
          <div style={{ marginBottom: '48px' }}>
            <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '28px', fontWeight: 800, color: 'var(--maroon)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FileEdit size={24} color="var(--coral)" /> 5. Hak-Hak Anda
            </h2>
            <p style={{ fontSize: '16px', lineHeight: 1.8, color: 'var(--text)', margin: 0 }}>
              Anda memiliki hak penuh untuk mengakses, memperbaiki, atau meminta penghapusan data profil Anda. Sebagai admin sekolah, Anda juga berhak mendapatkan salinan data laporan yang telah Anda kirimkan untuk keperluan arsip internal instansi.
            </p>
          </div>

          {/* Contact Highlight */}
          <div style={{ background: 'linear-gradient(135deg, var(--maroon) 0%, #7A1434 100%)', padding: '40px', borderRadius: '24px', color: '#fff', display: 'flex', alignItems: 'center', gap: '32px', flexWrap: 'wrap' }}>
             <div style={{ width: '64px', height: '64px', background: 'rgba(255,255,255,0.1)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
               <Mail size={32} />
             </div>
             <div style={{ flex: 1, minWidth: '240px' }}>
               <h3 style={{ fontSize: '20px', fontWeight: 900, marginBottom: '8px' }}>Ada Pertanyaan?</h3>
               <p style={{ fontSize: '14px', opacity: 0.8, margin: 0, lineHeight: 1.5 }}>
                 Jika Anda memiliki kekhawatiran mengenai privasi data, tim perlindungan data kami siap membantu Anda di:
               </p>
               <div style={{ marginTop: '12px', fontWeight: 800, fontSize: '18px', color: 'var(--gold)' }}>privacy@gizikita.id</div>
             </div>
          </div>

        </div>
      </section>

      {/* Mobile Padding Helper */}
      <style jsx>{`
        @media (max-width: 768px) {
          section { padding: 60px 16px 40px !important; }
          .page-inner { padding: 40px 24px !important; }
          h1 { font-size: 36px !important; }
          div { padding: 40px 24px !important; }
        }
      `}</style>

    </div>
  );
}
