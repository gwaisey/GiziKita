export default class Footer {
  /**
   * Renders footer HTML string
   */
  static render() {
    return `
      <footer style="background:var(--maroon); color:#fff; padding:60px 40px 30px; position:relative; overflow:hidden; margin-top:auto;">
        <!-- Large Flower Graphic Backgrounds -->
        <div style="position:absolute; bottom:-100px; left:-100px; width:300px; height:300px; opacity:0.15; pointer-events:none;">
           <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M50 0L58.5 8.5L70 5L75 16.5L86.5 21.5L83 33L91.5 41.5L85 50L91.5 58.5L83 67L86.5 78.5L75 83.5L70 95L58.5 91.5L50 100L41.5 91.5L30 95L25 83.5L13.5 78.5L17 67L8.5 58.5L15 50L8.5 41.5L17 33L13.5 21.5L25 16.5L30 5L41.5 8.5L50 0Z" fill="#fff"/>
              <circle cx="50" cy="50" r="30" fill="#fff" opacity="0.3"/>
           </svg>
        </div>
        <div style="position:absolute; top:-80px; right:-80px; width:260px; height:260px; opacity:0.1; pointer-events:none;">
           <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M50 0L58.5 8.5L70 5L75 16.5L86.5 21.5L83 33L91.5 41.5L85 50L91.5 58.5L83 67L86.5 78.5L75 83.5L70 95L58.5 91.5L50 100L41.5 91.5L30 95L25 83.5L13.5 78.5L17 67L8.5 58.5L15 50L8.5 41.5L17 33L13.5 21.5L25 16.5L30 5L41.5 8.5L50 0Z" fill="#fff"/>
           </svg>
        </div>

        <div class="footer-content" style="position:relative; z-index:2; max-width:1200px; margin:0 auto; display:flex; flex-wrap:wrap; justify-content:space-between; gap:40px;">
           
           <!-- Column 1: Brand -->
           <div style="flex: 1; min-width: 250px;">
              <a href="#" data-page="home" style="display:flex; align-items:center; gap:8px; margin-bottom:16px; text-decoration:none; color:inherit; width:fit-content; transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                 <img src="Assets/logo.png" alt="GiziKita Logo" style="width:42px; height:42px; object-fit:contain;"/>
                 <span style="font-family:'Playfair Display',serif; font-size:24px; font-weight:700; line-height:1;">Gizi<br/>Kita</span>
              </a>
              <p style="opacity:0.8; font-size:14px; line-height:1.6; max-width:280px; margin:0;">
                 Sistem pemantauan terpadu untuk Program Makan Bergizi Gratis (MBG) bagi anak sekolah di seluruh Indonesia.
              </p>
           </div>

            <!-- Column 2: Navigation -->
            <div style="flex: 1; min-width: 150px;">
               <h4 style="font-family:'Playfair Display',serif; font-size:18px; font-weight:700; margin-bottom:20px;">Tautan Penting</h4>
               <nav style="display:flex; flex-direction:column; gap:12px;">
                  <a href="#" data-page="home" style="color:#fff; text-decoration:none; opacity:0.8; font-size:14px; transition:all 0.2s; display:inline-block;" onmouseover="this.style.opacity='1'; this.style.transform='translateX(5px)'" onmouseout="this.style.opacity='0.8'; this.style.transform='translateX(0)'">Beranda</a>
                  <a href="#" data-page="about" style="color:#fff; text-decoration:none; opacity:0.8; font-size:14px; transition:all 0.2s; display:inline-block;" onmouseover="this.style.opacity='1'; this.style.transform='translateX(5px)'" onmouseout="this.style.opacity='0.8'; this.style.transform='translateX(0)'">Tentang Kami</a>
                  <a href="#" data-page="help" style="color:#fff; text-decoration:none; opacity:0.8; font-size:14px; transition:all 0.2s; display:inline-block;" onmouseover="this.style.opacity='1'; this.style.transform='translateX(5px)'" onmouseout="this.style.opacity='0.8'; this.style.transform='translateX(0)'">Bantuan & Panduan</a>
                  <a href="#" data-page="privacy" style="color:#fff; text-decoration:none; opacity:0.8; font-size:14px; transition:all 0.2s; display:inline-block;" onmouseover="this.style.opacity='1'; this.style.transform='translateX(5px)'" onmouseout="this.style.opacity='0.8'; this.style.transform='translateX(0)'">Kebijakan Privasi</a>
               </nav>
            </div>

           <!-- Column 3: Contact -->
           <div style="flex: 1.5; min-width: 250px;">
              <h4 style="font-family:'Playfair Display',serif; font-size:18px; font-weight:700; margin-bottom:20px;">Kontak & Bantuan</h4>
              <div style="display:flex; flex-direction:column; gap:12px;">
                 <div style="display:flex; gap:12px; align-items:flex-start;">
                    <span style="opacity:0.8; font-size:16px;">📍</span>
                    <p style="opacity:0.8; font-size:14px; margin:0; line-height:1.6;">Jl. Merdeka No. 123, Kel. Sukajaya, Kec. Harmoni,<br/>Jakarta Pusat, DKI Jakarta 10110</p>
                 </div>
                 <div style="display:flex; gap:12px; align-items:center;">
                    <span style="opacity:0.8; font-size:16px;">📧</span>
                    <p style="opacity:0.8; font-size:14px; margin:0;">support@gizikita.com</p>
                 </div>
                 <div style="display:flex; gap:12px; align-items:center;">
                    <span style="opacity:0.8; font-size:16px;">📞</span>
                    <p style="opacity:0.8; font-size:14px; margin:0;">0812-3456-7890</p>
                 </div>
              </div>
           </div>

        </div>

        <!-- Footer Bottom -->
        <div style="position:relative; z-index:2; max-width:1200px; margin:40px auto 0; padding-top:20px; border-top:1px solid rgba(255,255,255,0.1); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
           <p style="font-size:13px; opacity:0.6; margin:0;">© 2026 Pemerintah Republik Indonesia. Hak cipta dilindungi undang-undang.</p>
           <p style="font-size:13px; opacity:0.6; margin:0;">Versi 1.0.0 (Beta)</p>
        </div>
      </footer>
    `;
  }
}
