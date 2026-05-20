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

class AIService {
  private lastCallTime: number = 0;
  private cooldownMs: number = 2000;
  private CACHE_KEY = 'gizikita_ai_cache';
  private CACHE_TTL_MS = 24 * 60 * 60 * 1000;
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

  private _checkRateLimit() {
    const now = Date.now();
    if (now - this.lastCallTime < this.cooldownMs) {
      throw new Error(`Mohon tunggu sebentar (${Math.ceil((this.cooldownMs - (now - this.lastCallTime)) / 1000)} detik).`);
    }
    this.lastCallTime = now;
  }

  private async _callAIProxy(action: string, payload: any, attempt: number = 1): Promise<string> {
    const MAX_ATTEMPTS = 3;
    this._checkRateLimit();

    try {
      const { data, error } = await supabase.functions.invoke('ai-gateway', {
        body: { action, payload }
      });

      if (error) throw error;
      if (data.error) throw new Error(typeof data.error === 'object' ? JSON.stringify(data.error) : data.error);

      return data.text;
    } catch (e: any) {
      console.error(`AI Proxy Error (Attempt ${attempt}):`, e);
      const msg = e.message || "";
      const delayMatch = msg.match(/retryDelay":"(\d+)s"/);

      if ((delayMatch || msg.includes('503') || msg.includes('429')) && attempt < MAX_ATTEMPTS) {
        const waitSecs = delayMatch ? parseInt(delayMatch[1]) + 1 : (attempt * 3);
        await new Promise(resolve => setTimeout(resolve, waitSecs * 1000));
        return this._callAIProxy(action, payload, attempt + 1);
      }
      throw new Error(msg);
    }
  }

  public async getMenuAnalysis(day: string, items: string[]): Promise<string> {
    const dayKey = day.toLowerCase();
    const cacheKey = `menu_${day}_${items.join('_')}`.toLowerCase().replace(/\s+/g, '');
    const cachedResult = this._getCache(cacheKey);

    if (cachedResult) return cachedResult;

    const verifiedLibrary: Record<string, string> = {
      'senin': 'Menu Senin kaya akan protein dari ayam dan telur yang penting untuk pembentukan jaringan tubuh anak.',
      'selasa': 'Hidangan Selasa menawarkan variasi protein hewani berkualitas dari rendang dan ayam katsu.',
      'rabu': 'Gado-gado dan sop ayam pada hari Rabu menyediakan kombinasi protein nabati dan hewani yang seimbang.',
      'kamis': 'Sayur asem dan nasi rames hari Kamis kaya akan vitamin serta antioksidan alami.',
      'jumat': 'Menu Jumat seperti bakso kuah dan siomay ikan memberikan asupan protein laut yang kaya Omega-3.',
      'sabtu': 'Sabtu yang ceria dengan kailan cah bawang putih yang sangat tinggi serat dan vitamin K.'
    };

    try {
      if (this.inFlightRequests.has(cacheKey)) return this.inFlightRequests.get(cacheKey)!;

      const promise = this._callAIProxy('getMenuAnalysis', { day, items });
      this.inFlightRequests.set(cacheKey, promise);
      
      const result = await promise;
      this._saveCache(cacheKey, result, { version: this.MENU_CACHE_VERSION, source: 'ai' });
      this.inFlightRequests.delete(cacheKey);
      return result;
    } catch (e) {
      this.inFlightRequests.delete(cacheKey);
      return verifiedLibrary[dayKey] || this._constructLocalAnalysis(items);
    }
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
      const cacheKey = `help_${sanitizedMsg.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
      const cachedResponse = this._getCache(cacheKey);
      
      if (cachedResponse) {
        this.helpHistory.push({ role: "assistant", content: cachedResponse });
      } else {
        const reply = await this._callAIProxy('getHelpResponse', { history: this.helpHistory });
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
