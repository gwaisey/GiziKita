# GiziKita: Platform Monitoring Distribusi Gizi Nasional

GiziKita dikembangkan sebagai solusi digital untuk mendukung transparansi dan efektivitas dalam **Program Makan Bergizi Gratis**. Proyek ini bertujuan untuk menjembatani komunikasi data secara real-time antara pihak sekolah, orang tua, dan pemerintah pusat melalui Badan Gizi Nasional.

## 🛠 Arsitektur & Teknologi
Proyek ini mengadopsi stack modern dengan fokus pada performa dan skalabilitas:

- **Frontend**: **Next.js & React**. Memanfaatkan *component-based architecture* untuk membangun antarmuka yang modular dan reaktif.
- **Backend-as-a-Service**: **Supabase**. Seluruh infrastruktur mencakup database (PostgreSQL), autentikasi user, serta penyimpanan aset media (Storage) dikelola secara terpusat.
- **State Management**: **Zustand**. Digunakan untuk menangani global state secara ringan dan efisien di sisi client.
- **Data Validation**: **Zod & TypeScript**. Penegakan *type-safety* dan validasi skema data guna meminimalisir runtime error.
- **Serverless Logic**: **Supabase Edge Functions (Deno)**. Digunakan sebagai gateway untuk pemrosesan AI (GiziBot) guna mengisolasi logika backend dan menjaga keamanan API Key.

## 🎓 Fokus Pengembangan (Learning Journey)
Dalam pengembangan GiziKita, terdapat beberapa objektif teknis utama yang menjadi fokus pembelajaran:
1. **Modern Serverless Stack**: Eksplorasi membangun aplikasi full-stack tanpa harus mengelola server tradisional (pergeseran dari pola MVC tradisional seperti Laravel/Spring Boot).
2. **Database-Level Security**: Implementasi **Row Level Security (RLS)** pada PostgreSQL untuk memastikan isolasi data yang ketat antar entitas sekolah.
3. **AI Integration**: Pemanfaatan LLM (Google Gemini & Llama 3) untuk memberikan nilai tambah berupa analisis nutrisi otomatis bagi pengguna.

## 🔐 Manajemen Akses & Peran
Akses data dalam aplikasi dibagi menjadi tiga entitas utama dengan hak akses yang terisolasi:

### 1. Admin Pusat (Badan Gizi Nasional)
- Monitoring dashboard nasional dan verifikasi data sekolah.
- Manajemen umpan balik publik dan audit sistem secara menyeluruh.

### 2. Admin Sekolah
- Pelaporan log distribusi harian (upload dokumentasi foto, jumlah porsi, dan verifikasi kondisi).
- Data yang diinput hanya dapat diakses oleh sekolah yang bersangkutan melalui kebijakan RLS.

### 3. Masyarakat Umum / Orang Tua
- Akses informasi menu mingguan beserta analisis kandungan gizinya.
- Sistem pengiriman umpan balik (feedback) jika ditemukan ketidaksesuaian di lapangan.

## 🚀 Fitur Unggulan: Real-time Vehicle Tracker
Untuk memaksimalkan transparansi distribusi, GiziKita dilengkapi dengan fitur pelacakan armada pengiriman secara *real-time*:
- **Live Map Visualization**: Menggunakan **Mapbox GL JS** untuk merender posisi tiap kendaraan distribusi di atas peta interaktif.
- **Real-time Synchronization**: Terintegrasi langsung dengan fitur **Supabase Realtime** sehingga pergerakan marker dan perubahan status armada (misalnya *en_route* menjadi *unloading*) langsung diperbarui di layar pengguna tanpa perlu memuat ulang halaman (*page reload*).
- **State Optimization**: Di-handle menggunakan **Zustand** agar rendering komponen peta tetap mulus (60fps) meskipun menerima pembaruan koordinat GPS secara terus-menerus.
*(Untuk mencoba fitur ini secara lokal, Anda perlu mengatur `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` di file `.env`.)*

## 🔧 Panduan Instalasi & Pengembangan

### 1. Instalasi Dependensi
```bash
npm install
```

### 2. Konfigurasi Environment
Buat file `.env` di root direktori dan masukkan kredensial Supabase Anda:
```bash
NEXT_PUBLIC_SUPABASE_URL="isi_dengan_project_url_supabase_anda"
NEXT_PUBLIC_SUPABASE_ANON_KEY="isi_dengan_anon_public_key_supabase_anda"
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN="isi_dengan_mapbox_access_token_anda"
```

### 3. Deployment Edge Functions
Untuk memperbarui atau deploy gateway AI:
```bash
npx supabase functions deploy ai-gateway
```

## 🛡 Keamanan & Standar Kode
- **Isolasi Data**: Keamanan data antar sekolah dijamin melalui RLS, bukan sekadar filter di sisi frontend.
- **Clean Code**: Mengutamakan penggunaan TypeScript secara ketat dan menghindari penggunaan `any` guna mempermudah *maintenance*.
- **Data Persistence**: Seluruh status aplikasi kini dikelola melalui database persisten di Supabase, memastikan konsistensi data di berbagai sesi pengguna.

---
*GiziKita — Mewujudkan Generasi Emas Indonesia Melalui Transparansi Gizi.*
