'use client';


import Link from 'next/link';

export default function Footer() {
  return (
    <footer style={{ background: 'var(--maroon)', color: '#fff', padding: '60px 40px 30px', position: 'relative', overflow: 'hidden', marginTop: 'auto' }}>
      {/* Large Flower Graphic Backgrounds */}
      <div style={{ position: 'absolute', bottom: '-100px', left: '-100px', width: '300px', height: '300px', opacity: 0.15, pointerEvents: 'none' }}>
         <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 0L58.5 8.5L70 5L75 16.5L86.5 21.5L83 33L91.5 41.5L85 50L91.5 58.5L83 67L86.5 78.5L75 83.5L70 95L58.5 91.5L50 100L41.5 91.5L30 95L25 83.5L13.5 78.5L17 67L8.5 58.5L15 50L8.5 41.5L17 33L13.5 21.5L25 16.5L30 5L41.5 8.5L50 0Z" fill="#fff"/>
            <circle cx="50" cy="50" r="30" fill="#fff" opacity="0.3"/>
         </svg>
      </div>
      <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '260px', height: '260px', opacity: 0.1, pointerEvents: 'none' }}>
         <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 0L58.5 8.5L70 5L75 16.5L86.5 21.5L83 33L91.5 41.5L85 50L91.5 58.5L83 67L86.5 78.5L75 83.5L70 95L58.5 91.5L50 100L41.5 91.5L30 95L25 83.5L13.5 78.5L17 67L8.5 58.5L15 50L8.5 41.5L17 33L13.5 21.5L25 16.5L30 5L41.5 8.5L50 0Z" fill="#fff"/>
         </svg>
      </div>

      <div style={{ position: 'relative', zIndex: 2, maxWidth: '1200px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '40px' }}>
         
         {/* Column 1: Brand */}
         <div style={{ flex: 1, minWidth: '250px' }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', textDecoration: 'none', color: 'inherit', width: 'fit-content' }}>
               <img src="/Assets/logo.png" alt="GiziKita Logo" style={{ width: 42, height: 42, objectFit: 'contain' }} />
               <span style={{ fontFamily: 'var(--font-playfair)', fontSize: '24px', fontWeight: 700, lineHeight: 1 }}>Gizi<br/>Kita</span>
            </Link>
            <p style={{ opacity: 0.8, fontSize: '14px', lineHeight: 1.6, maxWidth: '280px', margin: 0 }}>
               Sistem pemantauan terpadu untuk Program Makan Bergizi Gratis (MBG) bagi anak sekolah di seluruh Indonesia.
            </p>
         </div>

          {/* Column 2: Navigation */}
          <div style={{ flex: 1, minWidth: '150px' }}>
             <h4 style={{ fontFamily: 'var(--font-playfair)', fontSize: '18px', fontWeight: 700, marginBottom: 20 }}>Tautan Penting</h4>
             <nav style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Link href="/" className="footer-link">Beranda</Link>
                <Link href="/tentang" className="footer-link">Tentang Kami</Link>
                <Link href="/help" className="footer-link">Bantuan & Panduan</Link>
                <Link href="/privasi" className="footer-link">Kebijakan Privasi</Link>
             </nav>
          </div>

         {/* Column 3: Contact */}
         <div style={{ flex: 1.5, minWidth: '250px' }}>
            <h4 style={{ fontFamily: 'var(--font-playfair)', fontSize: '18px', fontWeight: 700, marginBottom: 20 }}>Kontak & Bantuan</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
               <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <span style={{ opacity: 0.8, fontSize: '16px' }}>📍</span>
                  <p style={{ opacity: 0.8, fontSize: '14px', margin: 0, lineHeight: 1.6 }}>Jl. Merdeka No. 123, Kel. Sukajaya, Kec. Harmoni,<br/>Jakarta Pusat, DKI Jakarta 10110</p>
               </div>
               <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span style={{ opacity: 0.8, fontSize: '16px' }}>📧</span>
                  <p style={{ opacity: 0.8, fontSize: '14px', margin: 0 }}>support@gizikita.com</p>
               </div>
               <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span style={{ opacity: 0.8, fontSize: '16px' }}>📞</span>
                  <p style={{ opacity: 0.8, fontSize: '14px', margin: 0 }}>0812-3456-7890</p>
               </div>
            </div>
         </div>

      </div>

      {/* Footer Bottom */}
      <div style={{ position: 'relative', zIndex: 2, maxWidth: '1200px', margin: '40px auto 0', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
         <p style={{ fontSize: '13px', opacity: 0.6, margin: 0 }}>© 2026 Pemerintah Republik Indonesia. Hak cipta dilindungi undang-undang.</p>
         <p style={{ fontSize: '13px', opacity: 0.6, margin: 0 }}>Versi 2.0.0 (Enterprise)</p>
      </div>

      <style jsx>{`
        .footer-link {
          color: #fff;
          text-decoration: none;
          opacity: 0.8;
          font-size: 14px;
          transition: all 0.2s;
          display: inline-block;
        }
        .footer-link:hover {
          opacity: 1;
          transform: translateX(5px);
        }
      `}</style>
    </footer>
  );
}
