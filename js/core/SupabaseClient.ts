import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase URL atau Anon Key belum disetel di file .env');
}

// Jangan memanggil createClient dengan string kosong saat variabel lingkungan tidak disetel,
// karena versi terbaru Supabase akan melempar error pada inisialisasi.
let _supabase: any;
if (supabaseUrl && supabaseAnonKey) {
  _supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  // Export stub yang akan menampilkan error saat dipanggil sehingga build tidak melempar
  const throwMissing = () => {
    throw new Error('Supabase env vars are missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  };
  const handler = {
    get() {
      return throwMissing;
    },
  };
  _supabase = new Proxy({}, handler);
}

export const supabase = _supabase;
