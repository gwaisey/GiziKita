import Component from '../core/Component.js';
import Footer from '../components/Footer.js';

export default class PrivacyPage extends Component {
  constructor() {
    super('page-privacy');
  }

  render() {
    return `
      <div style="background:var(--cream); min-height:100vh; display:flex; flex-direction:column;">
        <!-- Header -->
        <section style="padding:80px 40px 40px; text-align:center;">
          <h1 style="font-family:'Playfair Display', serif; font-size:48px; font-weight:900; color:var(--maroon); margin-bottom:16px;">Kebijakan Privasi</h1>
          <p style="color:var(--text-muted); font-size:14px;">Terakhir diperbarui: 29 April 2026</p>
        </section>

        <!-- Content -->
        <section style="max-width:800px; margin:0 auto 100px; padding:0 40px; flex:1;">
          <div style="background:#fff; padding:60px; border-radius:40px; box-shadow:0 20px 50px rgba(0,0,0,0.05); line-height:1.8; color:var(--text);">
            
            <h2 style="font-family:'Playfair Display', serif; font-size:24px; font-weight:800; color:var(--maroon); margin-bottom:20px;">1. Pendahuluan</h2>
            <p style="margin-bottom:30px;">
              Selamat datang di GiziKita. Kami sangat menghargai privasi Anda dan berkomitmen untuk melindungi data pribadi Anda. Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi informasi Anda saat menggunakan platform kami.
            </p>

            <h2 style="font-family:'Playfair Display', serif; font-size:24px; font-weight:800; color:var(--maroon); margin-bottom:20px;">2. Informasi yang Kami Kumpulkan</h2>
            <p style="margin-bottom:16px;">Kami mengumpulkan beberapa jenis informasi untuk memberikan layanan terbaik:</p>
            <ul style="margin-bottom:30px; padding-left:20px; list-style-type:circle;">
              <li><strong>Informasi Profil:</strong> Nama, alamat email, dan nomor telepon saat Anda mendaftar.</li>
              <li><strong>Informasi Sekolah:</strong> Data pendaftaran sekolah, jumlah murid, dan lokasi geografis.</li>
              <li><strong>Data Distribusi:</strong> Laporan pengiriman dan penerimaan makanan bergizi.</li>
              <li><strong>Log Aktivitas:</strong> Informasi tentang bagaimana Anda berinteraksi dengan platform kami.</li>
            </ul>

            <h2 style="font-family:'Playfair Display', serif; font-size:24px; font-weight:800; color:var(--maroon); margin-bottom:20px;">3. Penggunaan Informasi</h2>
            <p style="margin-bottom:16px;">Informasi yang kami kumpulkan digunakan untuk:</p>
            <ul style="margin-bottom:30px; padding-left:20px; list-style-type:circle;">
              <li>Memproses pendaftaran sekolah dalam Program Makan Bergizi Gratis.</li>
              <li>Memantau dan mengoptimalkan jalur distribusi makanan.</li>
              <li>Menyediakan layanan bantuan pelanggan melalui asisten AI.</li>
              <li>Melakukan analisis data untuk transparansi program nasional.</li>
            </ul>

            <h2 style="font-family:'Playfair Display', serif; font-size:24px; font-weight:800; color:var(--maroon); margin-bottom:20px;">4. Keamanan Data</h2>
            <p style="margin-bottom:30px;">
              Kami menggunakan teknologi enkripsi terkini dan protokol keamanan standar industri untuk memastikan data Anda aman dari akses yang tidak sah, perubahan, atau pengungkapan.
            </p>

            <h2 style="font-family:'Playfair Display', serif; font-size:24px; font-weight:800; color:var(--maroon); margin-bottom:20px;">5. Hak-Hak Anda</h2>
            <p style="margin-bottom:30px;">
              Anda memiliki hak untuk mengakses, memperbaiki, atau menghapus data pribadi Anda yang tersimpan di sistem kami. Silakan hubungi kami jika Anda ingin menggunakan hak-hak tersebut.
            </p>

            <h2 style="font-family:'Playfair Display', serif; font-size:24px; font-weight:800; color:var(--maroon); margin-bottom:20px;">6. Perubahan Kebijakan</h2>
            <p style="margin-bottom:30px;">
              Kami dapat memperbarui kebijakan privasi ini dari waktu ke waktu. Setiap perubahan akan diinformasikan melalui halaman ini atau melalui notifikasi dalam aplikasi.
            </p>

            <div style="background:var(--peach-card); padding:30px; border-radius:24px; border-left:6px solid var(--maroon);">
              <p style="margin:0; font-weight:600; color:var(--maroon);">Hubungi Kami</p>
              <p style="margin:8px 0 0; font-size:14px;">Jika Anda memiliki pertanyaan tentang kebijakan privasi ini, silakan hubungi kami di <strong>privacy@gizikita.com</strong>.</p>
            </div>
          </div>
        </section>

        ${Footer.render()}
      </div>
    `;
  }

  afterMount() {
    if (window.lucide) window.lucide.createIcons();
  }
}
