import { supabase } from '../core/SupabaseClient';
import { distributionReportSchema } from '../schemas/distributionSchema';
import { UserProfile } from '../types';
import AuditService from './AuditService';
import AuthService from './AuthService';

class DistributionService {
  private tableName = 'distribution_reports';
  private bucketName = 'distribution-photos';
  private cache = new Map<string, any>();

  private get currentUser(): UserProfile | null {
    return AuthService.currentUser;
  }

  async getHistory(): Promise<any[]> {
    try {
      const user = this.currentUser;
      if (!user) return [];

      const cacheKey = `history_${user.id}`;
      if (this.cache.has(cacheKey)) {
        this._refreshHistoryCache(cacheKey);
        return this.cache.get(cacheKey);
      }

      return await this._fetchHistory(user, cacheKey);
    } catch (err) {
      console.error('Error fetching distribution history:', err);
      return [];
    }
  }

  private async _fetchHistory(user: UserProfile, cacheKey: string): Promise<any[]> {
    let query = supabase
      .from(this.tableName)
      .select(`
        *,
        schools (
          name
        )
      `)
      .order('date', { ascending: false })
      .limit(25);

    if (user.role === 'admin_sekolah' && user.school_id) {
      query = query.eq('school_id', user.school_id);
    }

    const { data, error } = await query;
    if (error) throw error;
    
    const formatted = data.map(log => ({
      id: log.id,
      date: log.date,
      timeReceived: log.time_received ? log.time_received.slice(0, 5) : '--:--',
      targetPortions: log.target_portions,
      receivedPortions: log.received_portions,
      condition: log.condition,
      status: log.status,
      notes: log.notes,
      photoUrl: log.photo_url,
      schoolName: log.schools ? log.schools.name : 'Sekolah Umum'
    }));

    this.cache.set(cacheKey, formatted);
    return formatted;
  }

  private async _refreshHistoryCache(cacheKey: string) {
    const user = this.currentUser;
    if (user) this._fetchHistory(user, cacheKey);
  }

  async checkTodayReport(): Promise<boolean> {
    try {
      const user = this.currentUser;
      if (!user || !user.school_id || user.role === 'admin_pusat') return false;
      
      const today = new Date().toISOString().split('T')[0];
      const cacheKey = `today_${user.id}_${today}`;
      if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

      const { data, error } = await supabase
        .from(this.tableName)
        .select('id')
        .eq('date', today)
        .eq('school_id', user.school_id)
        .limit(1);

      if (error) throw error;
      const result = data.length > 0;
      this.cache.set(cacheKey, result);
      return result;
    } catch (err) {
      console.error('Error checking today report:', err);
      return false;
    }
  }

  async getTodayMetrics(): Promise<any> {
    try {
      const user = this.currentUser;
      if (!user) return { totalReceived: 0, successRate: 0, issues: 0 };
      
      const cacheKey = `metrics_${user.id}`;
      if (this.cache.has(cacheKey)) {
        this._refreshMetricsCache(cacheKey);
        return this.cache.get(cacheKey);
      }

      return await this._fetchMetrics(user, cacheKey);
    } catch (err) {
      console.error('Error getting metrics:', err);
      return { totalReceived: 0, successRate: 0, issues: 0 };
    }
  }

  private async _fetchMetrics(user: UserProfile, cacheKey: string): Promise<any> {
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    let query = supabase
      .from(this.tableName)
      .select('target_portions, received_portions, condition, date')
      .gte('date', `${currentMonth}-01`);

    if (user.role === 'admin_sekolah' && user.school_id) {
      query = query.eq('school_id', user.school_id);
    }

    const { data, error } = await query;
    if (error) throw error;

    let totalTarget = 0;
    let totalReceived = 0;
    let issues = 0;

    data.forEach(log => {
      totalTarget += log.target_portions;
      totalReceived += log.received_portions;
      if (log.condition === "Ada Kerusakan/Kekurangan") issues++;
    });

    const successRate = totalTarget > 0 ? Math.round((totalReceived / totalTarget) * 100) : 0;
    const result = { totalReceived, successRate, issues };
    this.cache.set(cacheKey, result);
    return result;
  }

  private async _refreshMetricsCache(cacheKey: string) {
    const user = this.currentUser;
    if (user) this._fetchMetrics(user, cacheKey);
  }

  async prefetch() {
    this.getHistory();
    this.getTodayMetrics();
    this.checkTodayReport();
  }

  async submitReport(formData: any): Promise<any> {
    try {
      const user = this.currentUser;
      if (!user || (user.role !== 'admin_sekolah' && user.role !== 'admin_pusat')) {
        throw new Error('Otoritas tidak cukup untuk mengirim laporan.');
      }

      // --- Fase 3: Data Integrity (Validation) ---
      const validatedData = distributionReportSchema.parse({
        school_id: formData.school_id || user.school_id,
        received_portions: parseInt(formData.receivedPortions),
        condition: formData.condition,
        notes: formData.notes,
        photos: formData.photos
      });

      let photoUrls: string[] = [];

      // 1. Parallel Photo Uploads
      if (validatedData.photos && validatedData.photos.length > 0) {
        const uploadPromises = validatedData.photos.map(async (file: File, index: number) => {
          const fileExt = file.name.split('.').pop() || 'jpg';
          const fileName = `report_${validatedData.school_id}_${Date.now()}_${index}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from(this.bucketName)
            .upload(fileName, file);

          if (uploadError) throw new Error(`Gagal upload foto ke-${index+1}`);

          const { data: { publicUrl } } = supabase.storage
            .from(this.bucketName)
            .getPublicUrl(fileName);
          
          return publicUrl;
        });

        photoUrls = await Promise.all(uploadPromises);
      }

      // 2. Database Insert
      const newLog = {
        school_id: validatedData.school_id,
        reporter_id: user.id,
        date: new Date().toISOString().split('T')[0],
        time_received: new Date().toLocaleTimeString('id-ID', { hour12: false }),
        target_portions: 450,
        received_portions: validatedData.received_portions,
        condition: validatedData.condition,
        notes: validatedData.notes || "",
        photo_url: JSON.stringify(photoUrls),
        status: validatedData.condition === "Ada Kerusakan/Kekurangan" ? "Bermasalah" : "Selesai"
      };

      const { data, error } = await supabase
        .from(this.tableName)
        .insert([newLog])
        .select();

      if (error) throw error;
      
      const savedLog = data[0];

      // Log the report submission for audit
      AuditService.log({
        action: 'SUBMIT_REPORT',
        table_name: this.tableName,
        record_id: savedLog.id,
        new_data: { 
          school_id: savedLog.school_id, 
          portions: savedLog.received_portions,
          condition: savedLog.condition
        }
      });

      // Clear cache to show new data
      this.cache.clear();
      
      return savedLog;
    } catch (err: any) {
      if (err.errors) {
        // Handle Zod errors
        throw new Error(err.errors[0].message);
      }
      throw err;
    }
  }

  /**
   * Finds schools that have NOT reported today (for Admin Pusat alerts)
   */
  async getMissingReportsToday(): Promise<string[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // 1. Get all schools
      const { data: allSchools, error: schoolError } = await supabase
        .from('schools')
        .select('id, name');
      
      if (schoolError || !allSchools) return [];

      // 2. Get reported school IDs for today
      const { data: reported, error: reportError } = await supabase
        .from(this.tableName)
        .select('school_id')
        .eq('date', today);

      if (reportError) return [];

      const reportedIds = new Set(reported.map(r => r.school_id));

      // 3. Filter schools that are NOT in reportedIds
      const missing = allSchools
        .filter(s => !reportedIds.has(s.id))
        .map(s => s.name);

      return missing;
    } catch (err) {
      console.error('Error checking missing reports:', err);
      return [];
    }
  }
}

export default new DistributionService();
