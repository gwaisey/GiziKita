import { supabase } from '../core/SupabaseClient';

interface AICacheEntry {
  value: string;
  timestamp: number;
  version: string | null;
  source: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface MenuAnalysisResult {
  text: string;
  source: 'ai' | 'fallback';
}


class AIService {
  private CACHE_KEY = 'gizikita_ai_cache';
  private CACHE_TTL_MS = 24 * 60 * 60 * 1000;
  private AI_REQUEST_TIMEOUT_MS = 15_000;
  private MENU_CACHE_VERSION = 'menu-analysis-v2';
  private HELP_HISTORY_KEY = 'gizikita_help_history';
  
  private cache: Record<string, AICacheEntry> = {};
  private inFlightRequests = new Map<string, Promise<string>>();
  
  public helpHistory: ChatMessage[] = [];
  public isHelpLoading: boolean = false;
  public helpLoadingStatus: string = "";
  public onHelpUpdate: (() => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.cache = this._loadCache();
      this._loadHelpHistory();
    }
  }

  private _loadCache(): Record<string, AICacheEntry> {
    try {
      const saved = localStorage.getItem(this.CACHE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  }

  private _saveCache(key: string, value: string, meta: { version?: string; source?: string } = {}) {
    this.cache[key] = {
      value,
      timestamp: Date.now(),
      version: meta.version || null,
      source: meta.source || 'unknown'
    };
    try {
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(this.cache));
    } catch (e) {
      console.warn("Gagal menyimpan cache:", e);
    }
  }

  private _getCache(key: string): string | null {
    const cached = this.cache[key];
    if (!cached || !cached.value || !cached.timestamp) return null;

    if (cached.version !== this.MENU_CACHE_VERSION || cached.source !== 'ai') {
      delete this.cache[key];
      this._persistCache();
      return null;
    }

    if ((Date.now() - cached.timestamp) > this.CACHE_TTL_MS) {
      delete this.cache[key];
      this._persistCache();
      return null;
    }

    return cached.value;
  }

  private _persistCache() {
    try {
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(this.cache));
    } catch (e) {}
  }

  public clearHelpHistory() {
    this.helpHistory = [
      { role: "assistant", content: "Halo! Saya asisten GiziKita. Tanyakan apa saja tentang program Makan Bergizi Gratis, cara mendaftar sekolah, atau informasi transparansi program." }
    ];
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.HELP_HISTORY_KEY);
    }
    if (this.onHelpUpdate) this.onHelpUpdate();
  }

  private _loadHelpHistory() {
    try {
      const saved = localStorage.getItem(this.HELP_HISTORY_KEY);
      this.helpHistory = saved ? JSON.parse(saved) : [
        { role: "assistant", content: "Halo! Saya asisten GiziKita. Tanyakan apa saja tentang program Makan Bergizi Gratis, cara mendaftar sekolah, atau informasi transparansi program." }
      ];
    } catch (e) {
      this.helpHistory = [{ role: "assistant", content: "Halo! Saya asisten GiziKita..." }];
    }
  }

  private _saveHelpHistory() {
    try {
      localStorage.setItem(this.HELP_HISTORY_KEY, JSON.stringify(this.helpHistory));
    } catch (e) {}
  }

  private async _callAIProxy(action: string, payload: any): Promise<string> {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    try {
      const request = Promise.resolve().then(() =>
        supabase.functions.invoke('ai-gateway', { body: { action, payload } })
      );
      const timeout = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('AI_TIMEOUT')), this.AI_REQUEST_TIMEOUT_MS);
      });
      const { data, error } = await Promise.race([request, timeout]);

      if (error) throw error;
      if (data?.error) throw new Error(typeof data.error === 'object' ? JSON.stringify(data.error) : data.error);
      if (typeof data?.text !== 'string' || !data.text.trim()) throw new Error('AI returned an empty response');
      return data.text.trim();
    } catch (error: any) {
      console.warn('AI analysis unavailable; using local fallback:', error?.message || error);
      throw error instanceof Error ? error : new Error(String(error));
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  public async getMenuAnalysisResult(day: string, items: string[]): Promise<MenuAnalysisResult> {
    const dayKey = day.toLowerCase();
    const cacheKey = `menu_${day}_${items.join('_')}`.toLowerCase().replace(/\s+/g, '');
    const cachedResult = this._getCache(cacheKey);

    if (cachedResult) return { text: cachedResult, source: 'ai' };

    const verifiedLibrary: Record<string, string> = {
      'senin': 'Menu Senin kaya akan protein dari ayam dan telur yang penting untuk pembentukan jaringan tubuh anak.',
      'selasa': 'Hidangan Selasa menawarkan variasi protein hewani berkualitas dari rendang dan ayam katsu.',
      'rabu': 'Gado-gado dan sop ayam pada hari Rabu menyediakan kombinasi protein nabati dan hewani yang seimbang.',
      'kamis': 'Sayur asem dan nasi rames hari Kamis kaya akan vitamin serta antioksidan alami.',
      'jumat': 'Menu Jumat seperti bakso kuah dan siomay ikan memberikan asupan protein laut yang kaya Omega-3.',
      'sabtu': 'Sabtu yang ceria dengan kailan cah bawang putih yang sangat tinggi serat dan vitamin K.'
    };

    try {
      if (this.inFlightRequests.has(cacheKey)) {
        return { text: await this.inFlightRequests.get(cacheKey)!, source: 'ai' };
      }

      const promise = this._callAIProxy('getMenuAnalysis', { day, items });
      this.inFlightRequests.set(cacheKey, promise);
      
      const result = await promise;
      this._saveCache(cacheKey, result, { version: this.MENU_CACHE_VERSION, source: 'ai' });
      this.inFlightRequests.delete(cacheKey);
      return { text: result, source: 'ai' };
    } catch (e) {
      this.inFlightRequests.delete(cacheKey);
      return { text: verifiedLibrary[dayKey] || this._constructLocalAnalysis(items), source: 'fallback' };
    }
  }

  public async getMenuAnalysis(day: string, items: string[]): Promise<string> {
    const result = await this.getMenuAnalysisResult(day, items);
    return result.text;
  }

  private _constructLocalAnalysis(items: string[]): string {
    const facts: Record<string, string> = {
      'nasi': 'karbohidrat untuk energi',
      'ayam': 'protein untuk otot',
      'telur': 'nutrisi otak',
      'sayur': 'vitamin harian',
      'ikan': 'omega-3'
    };
    
    const parts: string[] = [];
    items.forEach(item => {
      for (const key in facts) {
        if (item.toLowerCase().includes(key)) {
          parts.push(facts[key]);
          break;
        }
      }
    });

    if (parts.length > 0) {
      return `Menu ini mengandung ${parts.slice(0, 2).join(" dan ")} yang dirancang khusus untuk mendukung pertumbuhan optimal anak.`;
    }
    return "Menu hari ini telah disesuaikan dengan standar gizi nasional untuk memastikan asupan nutrisi yang cukup.";
  }

  public async askHelp(msg: string) {
    if (this.isHelpLoading) return;

    const sanitizedMsg = msg.trim().substring(0, 800).replace(/[<>]/g, '');
    
    this.helpHistory.push({ role: "user", content: sanitizedMsg });
    this._saveHelpHistory();
    this.isHelpLoading = true;
    if (this.onHelpUpdate) this.onHelpUpdate();

    try {
      const groundingNote = this.buildGroundingNote(sanitizedMsg);
      const appContext = await this.getAppGroundingContext(sanitizedMsg);
      const promptWithContext = this.shouldUseAppContext(sanitizedMsg)
        ? `${sanitizedMsg}\n\n${groundingNote}\n\n${appContext}`
        : sanitizedMsg;

      const cacheKey = `help_${sanitizedMsg.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
      const cachedResponse = this._getCache(cacheKey);

      if (cachedResponse) {
        this.helpHistory.push({ role: "assistant", content: cachedResponse });
      } else {
        const reply = await this._callAIProxy('getHelpResponse', {
          history: this.helpHistory,
          groundingContext: appContext,
          promptWithContext
        });
        this.helpHistory.push({ role: "assistant", content: reply });
        this._saveCache(cacheKey, reply, { version: this.MENU_CACHE_VERSION, source: 'ai' });
      }
      this._saveHelpHistory();
    } catch (e: any) {
      this.helpHistory.push({ role: "assistant", content: this._getFriendlyErrorMessage(e) });
    } finally {
      this.isHelpLoading = false;
      if (this.onHelpUpdate) this.onHelpUpdate();
    }
  }

  public shouldUseAppContext(message: string): boolean {
    const text = message.toLowerCase();
    const explicitSchoolDataPatterns = [
      'daftar sekolah',
      'sekolah penerima',
      'daftar penerima',
      'sekolah di',
      'daftar sekolah di',
      'penerima mbg',
      'sekolah mbg',
      'terdaftar',
      'tercatat',
      'data aplikasi',
      'masuk aplikasi',
      'gizikita'
    ];
    const locationPatterns = /(jakarta|bandung|surabaya|bogor|depok|bekasi|medan|yogyakarta|banten|aceh|sumatra|papua|kalimantan|sulawesi|maluku|ntt|ntb|kota|kabupaten|provinsi|wilayah)/;
    const listIntent = explicitSchoolDataPatterns.some(pattern => text.includes(pattern));
    return listIntent || (locationPatterns.test(text) && /sekolah|penerima|daftar/.test(text));
  }

  public buildGroundingNote(question: string): string {
    return `Sumber kebenaran utama: data aplikasi GiziKita. Untuk pertanyaan tentang sekolah, wilayah, atau daftar penerima, gunakan data terdaftar di aplikasi sebagai referensi utama; jika data tidak ditemukan di aplikasi, sebutkan bahwa data belum tersedia dan jangan menebak. Pertanyaan user: "${question}"`;
  }

  private async getAppGroundingContext(question: string): Promise<string> {
    if (!this.shouldUseAppContext(question)) {
      return '';
    }

    try {
      let query = supabase.from('schools').select('name, province, city, pupils, status').order('name', { ascending: true }).limit(20);

      const lower = question.toLowerCase();
      if (/(jakarta|dki)/.test(lower)) {
        query = query.ilike('province', '%jakarta%');
      } else if (/(bandung)/.test(lower)) {
        query = query.ilike('city', '%bandung%');
      } else if (/(surabaya)/.test(lower)) {
        query = query.ilike('city', '%surabaya%');
      }

      const { data, error } = await query;
      if (error || !data || data.length === 0) {
        return 'Tidak ada data sekolah yang cocok di aplikasi GiziKita untuk pertanyaan ini.';
      }

      const sample = data.slice(0, 10).map((school: any) => {
        const city = school.city || 'Kota belum diisi';
        const province = school.province || 'Provinsi belum diisi';
        return `${school.name} | ${city} | ${province} | Siswa: ${school.pupils ?? 0} | Status: ${school.status ?? 'Belum ada'}`;
      }).join('; ');

      return `DATA GIZIKITA TERKAIT:\n${sample}`;
    } catch (err) {
      console.warn('Grounding context fetch failed:', err);
      return 'Data aplikasi GiziKita tidak dapat diambil saat ini. Jawaban harus tetap mengikuti aturan aplikasi dan tidak menebak.';
    }
  }

  private _getFriendlyErrorMessage(error: any): string {
    const msg = (error.message || "").toLowerCase();
    if (msg.includes('429') || msg.includes('503') || msg.includes('quota')) {
      return "Layanan AI sedang padat. Mohon coba lagi beberapa saat lagi.";
    }
    return "Terjadi masalah pada asisten AI. Silakan coba lagi nanti.";
  }

  public async analyzeSentiment(text: string, rating: number): Promise<'good' | 'bad'> {
    try {
      const raw = text.toLowerCase();
      const goodWords = ['enak', 'baik', 'bagus', 'terima kasih', 'suka', 'mantap', 'keren'];
      const isPositive = goodWords.some(word => raw.includes(word)) || rating >= 4;
      return isPositive ? 'good' : 'bad';
    } catch (e) {
      return rating >= 3 ? 'good' : 'bad';
    }
  }
}

export default new AIService();
