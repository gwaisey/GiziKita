import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase URL atau Anon Key belum disetel di file .env');
}

// Inisialisasi client Supabase dengan tipe data yang aman
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
