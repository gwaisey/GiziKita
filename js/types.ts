export type UserRole = 'admin_pusat' | 'admin_sekolah' | 'user_umum';

export interface UserProfile {
  id: string;
  role: UserRole;
  name: string;
  username: string;
  instansi: string;
  school_id: string | null;
  schoolName: string;
  isApproved: boolean;
  avatar_url?: string;
}

export interface School {
  id: string;
  name: string;
  npsn: string;
  address: string;
  province: string;
  city: string;
  pupils: number;
  level: string;
  status: string;
  target_portions: number;
  lat: number | null;
  lng: number | null;
}

export interface DistributionReport {
  id: string;
  school_id: string;
  reporter_id: string;
  date: string;
  time_received: string;
  target_portions: number;
  received_portions: number;
  condition: string;
  notes: string;
  photo_url: string; // Store as JSON string or array
  status: 'Selesai' | 'Bermasalah' | 'Disetujui';
}
