import Component from '../core/Component.js';
import Footer from '../components/Footer.js';

export default class AboutPage extends Component {
  constructor() {
    super('page-about');
  }

  render() {
    return `
      <div style="background:var(--cream); min-height:100vh; display:flex; flex-direction:column;">
        <!-- Hero Section -->
        <section style="position:relative; padding:120px 40px; background:linear-gradient(135deg, var(--maroon) 0%, #7A1434 100%); color:#fff; overflow:hidden;">
          <div style="position:absolute; top:-100px; right:-100px; width:400px; height:400px; background:radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%); border-radius:50%;"></div>
          <div style="max-width:1000px; margin:0 auto; position:relative; z-index:2; text-align:center;">
            <h1 style="font-family:'Playfair Display', serif; font-size:56px; font-weight:900; margin-bottom:24px; animation:fadeUp .7s ease both;">Tentang GiziKita</h1>
            <p style="font-size:18px; line-height:1.8; opacity:0.9; max-width:700px; margin:0 auto; animation:fadeUp .7s ease both .2s;">
              Membangun masa depan Indonesia melalui nutrisi yang tepat sasaran, transparan, dan terintegrasi untuk setiap anak sekolah.
            </p>
          </div>
        </section>

        <!-- Vision & Mission -->
        <section style="padding:100px 40px; max-width:1200px; margin:0 auto; display:flex; flex-wrap:wrap; gap:60px; align-items:center;">
          <div style="flex:1; min-width:300px;">
            <img src="Assets/landing-page2.jpg" alt="Visi Kami" style="width:100%; border-radius:40px; box-shadow:0 30px 60px rgba(139,28,63,0.15); border:10px solid #fff;">
          </div>
          <div style="flex:1; min-width:300px;">
            <h2 style="font-family:'Playfair Display', serif; font-size:36px; font-weight:900; color:var(--maroon); margin-bottom:24px;">Visi Kami</h2>
            <p style="font-size:16px; color:var(--text-muted); line-height:1.8; margin-bottom:32px;">
              GiziKita lahir dari semangat untuk memastikan Program Makan Bergizi Gratis (MBG) terlaksana dengan standar kualitas tertinggi. Kami percaya bahwa transparansi data dan kemudahan akses informasi adalah kunci keberhasilan program nasional ini.
            </p>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:24px;">
              <div style="background:#fff; padding:24px; border-radius:24px; box-shadow:0 10px 30px rgba(0,0,0,0.05);">
                <div style="font-size:24px; margin-bottom:12px;">🎯</div>
                <div style="font-weight:700; color:var(--maroon); margin-bottom:8px;">Tepat Sasaran</div>
                <div style="font-size:13px; color:var(--text-muted);">Memastikan bantuan sampai ke sekolah yang membutuhkan.</div>
              </div>
              <div style="background:#fff; padding:24px; border-radius:24px; box-shadow:0 10px 30px rgba(0,0,0,0.05);">
                <div style="font-size:24px; margin-bottom:12px;">🛡️</div>
                <div style="font-weight:700; color:var(--maroon); margin-bottom:8px;">Transparansi</div>
                <div style="font-size:13px; color:var(--text-muted);">Setiap butir nasi dan lauk pauk dapat dipantau distribusinya.</div>
              </div>
            </div>
          </div>
        </section>

        <!-- Our Story -->
        <section style="background:#fff; padding:100px 40px;">
          <div style="max-width:1000px; margin:0 auto; text-align:center;">
            <h2 style="font-family:'Playfair Display', serif; font-size:36px; font-weight:900; color:var(--maroon); margin-bottom:40px;">Cerita Kami</h2>
            <div style="position:relative; padding:20px 0;">
              <div style="position:absolute; top:0; bottom:0; left:50%; width:2px; background:rgba(139,28,63,0.1); transform:translateX(-50%);"></div>
              
              <div style="display:flex; justify-content:flex-end; padding-right:55%; position:relative; margin-bottom:40px;">
                <div style="position:absolute; right:calc(50% - 8px); top:10px; width:16px; height:16px; border-radius:50%; background:var(--maroon); border:4px solid #fff; box-shadow:0 0 0 4px rgba(139,28,63,0.1);"></div>
                <div style="background:var(--cream); padding:24px; border-radius:20px; text-align:right;">
                  <div style="font-weight:900; color:var(--maroon); font-size:20px; margin-bottom:8px;">2025</div>
                  <div style="font-size:14px; color:var(--text-muted);">Inisiasi platform GiziKita sebagai pilot project pemantauan gizi nasional.</div>
                </div>
              </div>

              <div style="display:flex; justify-content:flex-start; padding-left:55%; position:relative;">
                <div style="position:absolute; left:calc(50% - 8px); top:10px; width:16px; height:16px; border-radius:50%; background:var(--maroon); border:4px solid #fff; box-shadow:0 0 0 4px rgba(139,28,63,0.1);"></div>
                <div style="background:var(--cream); padding:24px; border-radius:20px; text-align:left;">
                  <div style="font-weight:900; color:var(--maroon); font-size:20px; margin-bottom:8px;">2026</div>
                  <div style="font-size:14px; color:var(--text-muted);">Peluncuran Versi 1.0 (Beta) dengan integrasi AI untuk layanan bantuan.</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- CTA -->
        <section style="padding:100px 40px; text-align:center;">
          <h2 style="font-family:'Playfair Display', serif; font-size:32px; font-weight:900; color:var(--maroon); margin-bottom:24px;">Ingin Berkontribusi?</h2>
          <p style="color:var(--text-muted); margin-bottom:40px; max-width:600px; margin-left:auto; margin-right:auto;">
            Kami selalu terbuka untuk masukan dan kerjasama dari berbagai pihak demi kemajuan anak bangsa.
          </p>
          <button class="btn btn-primary" data-page="help" style="padding:16px 40px; border-radius:50px;">Hubungi Kami</button>
        </section>

        ${Footer.render()}
      </div>
    `;
  }

  afterMount() {
    if (window.lucide) window.lucide.createIcons();
  }
}
