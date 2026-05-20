import { z } from 'zod';

/**
 * Schema validasi untuk laporan distribusi harian.
 * Didesain untuk standar integritas data pemerintah.
 */
export const distributionReportSchema = z.object({
  school_id: z.string().min(1, "Sekolah harus dipilih"),
  
  received_portions: z.number({ 
    message: "Jumlah porsi harus berupa angka" 
  }).int("Porsi harus berupa angka bulat").min(0, "Porsi tidak boleh negatif").max(2000, "Porsi melebihi batas maksimal"),
  
  condition: z.enum(["Sangat Baik", "Baik", "Ada Kerusakan/Kekurangan"], {
    message: "Kondisi makanan tidak valid"
  }),
  
  notes: z.string().max(500, "Catatan terlalu panjang (maksimal 500 karakter)").optional(),
  
  photos: z.array(z.any()).min(1, "Minimal harus melampirkan 1 foto bukti"),
});

// Inferensi tipe data otomatis dari schema
export type DistributionReportInput = z.infer<typeof distributionReportSchema>;
