import { supabase } from '../core/SupabaseClient';

class AIService {
  constructor() {
    // Simple Client-side Rate Limiting (Cooldown)
    this.lastCallTime = 0;
    this.cooldownMs = 2000; 
    
    // Persistent Cache (localStorage) untuk menghemat kuota API
    this.CACHE_KEY = 'gizikita_ai_cache';
    this.CACHE_TTL_MS = 24 * 60 * 60 * 1000;
    this.MENU_CACHE_VERSION = 'menu-analysis-v2';
    this.cache = this._loadCache();
    this.inFlightRequests = new Map();

    // Persistent Chat Session for Help Page
    this.HELP_HISTORY_KEY = 'gizikita_help_history';
    this._loadHelpHistory();
    this.isHelpLoading = false;
    this.helpLoadingStatus = "";
    this.onHelpUpdate = null; // Callback for UI updates
  }

  prefetch() {
    console.log("AIService: Warming up chat history...");
    this._loadHelpHistory();
  }

  clearHelpHistory() {
    this.helpHistory = [];
    localStorage.removeItem(this.HELP_HISTORY_KEY);
    if (this.onHelpUpdate) this.onHelpUpdate();
  }

  _loadHelpHistory() {
    try {
      const saved = localStorage.getItem(this.HELP_HISTORY_KEY);
      this.helpHistory = saved ? JSON.parse(saved) : [
        { role: "assistant", content: "Halo! Saya asisten GiziKita. Tanyakan apa saja tentang program Makan Bergizi Gratis, cara mendaftar sekolah, atau informasi transparansi program." }
      ];
    } catch (e) {
      this.helpHistory = [{ role: "assistant", content: "Halo! Saya asisten GiziKita..." }];
    }
  }

  _saveHelpHistory() {
    try {
      localStorage.setItem(this.HELP_HISTORY_KEY, JSON.stringify(this.helpHistory));
    } catch (e) {
      console.warn("Gagal menyimpan riwayat chat:", e);
    }
  }

  _loadCache() {
    try {
      const saved = localStorage.getItem(this.CACHE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  }

  _saveCache(key, value, meta = {}) {
    this.cache[key] = {
      value,
      timestamp: Date.now(),
      version: meta.version || null,
      source: meta.source || 'unknown'
    };
    try {
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(this.cache));
    } catch (e) {
      console.warn("Gagal menyimpan cache ke localStorage:", e);
    }
  }

  _getCache(key) {
    const cached = this.cache[key];
    if (!cached || !cached.value || !cached.timestamp) return null;

    // Abaikan cache lama yang dibuat sebelum format metadata baru
    if (cached.version !== this.MENU_CACHE_VERSION || cached.source !== 'ai') {
      delete this.cache[key];
      try {
        localStorage.setItem(this.CACHE_KEY, JSON.stringify(this.cache));
      } catch (e) {
        console.warn("Gagal membersihkan cache legacy:", e);
      }
      return null;
    }

    if ((Date.now() - cached.timestamp) > this.CACHE_TTL_MS) {
      delete this.cache[key];
      try {
        localStorage.setItem(this.CACHE_KEY, JSON.stringify(this.cache));
      } catch (e) {
        console.warn("Gagal membersihkan cache lama:", e);
      }
      return null;
    }

    return cached.value;
  }

  _buildMenuCacheKey(day, items) {
    return `menu_${day}_${items.join('_')}`.toLowerCase().replace(/\s+/g, '');
  }

  async _getOrCreateInFlight(key, factory) {
    if (this.inFlightRequests.has(key)) {
      return this.inFlightRequests.get(key);
    }

    const request = (async () => {
      try {
        return await factory();
      } finally {
        this.inFlightRequests.delete(key);
      }
    })();

    this.inFlightRequests.set(key, request);
    return request;
  }

  _checkRateLimit() {
    const now = Date.now();
    if (now - this.lastCallTime < this.cooldownMs) {
      throw new Error(`Mohon tunggu sebentar (${Math.ceil((this.cooldownMs - (now - this.lastCallTime))/1000)} detik).`);
    }
    this.lastCallTime = now;
  }

  shouldUseAppContext(message) {
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

  buildGroundingNote(question) {
    return `Sumber kebenaran utama: data aplikasi GiziKita. Untuk pertanyaan tentang sekolah, wilayah, atau daftar penerima, gunakan data terdaftar di aplikasi sebagai referensi utama; jika data tidak ditemukan di aplikasi, sebutkan bahwa data belum tersedia dan jangan menebak. Pertanyaan user: "${question}"`;
  }

  async getAppGroundingContext(question) {
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

      const sample = data.slice(0, 10).map((school) => {
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

  /**
   * Memanggil Supabase Edge Function sebagai Proxy Aman dengan Retries Agresif
   */
  async _callAIProxy(action, payload, attempt = 1) {
    const MAX_ATTEMPTS = 3; 
    this._checkRateLimit();

    try {
      const { data, error } = await supabase.functions.invoke('ai-gateway', {
        body: { action, payload }
      });

      if (error) throw error;
      if (data.error) throw new Error(typeof data.error === 'object' ? JSON.stringify(data.error) : data.error);

      return data.text;
    } catch (e) {
      console.error(`AI Proxy Error (Attempt ${attempt}):`, e);
      
      const msg = e.message || "";
      const delayMatch = msg.match(/retryDelay":"(\d+)s"/);

      // Jika ada delay, atau error 503/429, kita tunggu dan coba lagi secara SILENT
      if ((delayMatch || msg.includes('503') || msg.includes('429')) && attempt < MAX_ATTEMPTS) {
        const waitSecs = delayMatch ? parseInt(delayMatch[1]) + 1 : (attempt * 3); 
        console.log(`[AIService] Menunggu ${waitSecs} detik secara silent...`);
        
        await new Promise(resolve => setTimeout(resolve, waitSecs * 1000));
        return this._callAIProxy(action, payload, attempt + 1);
      }

      throw new Error(msg);
    }
  }

  async getMenuAnalysis(day, items) {
    const dayKey = day.toLowerCase();
    const cacheKey = this._buildMenuCacheKey(day, items);
    const cachedResult = this._getCache(cacheKey);
    
    // Konten fallback statis agar fitur tetap hidup saat AI sibuk
    const verifiedLibrary = {
      'senin': 'Menu Senin kaya akan protein dari ayam dan telur yang penting untuk pembentukan jaringan tubuh anak. Nasi tim dan capcay menyediakan serat serta energi yang mudah dicerna untuk memulai minggu dengan semangat.',
      'selasa': 'Hidangan Selasa menawarkan variasi protein hewani berkualitas dari rendang dan ayam katsu untuk mendukung pertumbuhan otot. Zuppa soup dan brokoli memberikan asupan kalsium serta vitamin yang krusial bagi kesehatan tulang.',
      'rabu': 'Gado-gado dan sop ayam pada hari Rabu menyediakan kombinasi protein nabati dan hewani yang seimbang. Serat tinggi dari sayuran membantu pencernaan, sementara mineral dari rawon mendukung daya konsentrasi yang tajam.',
      'kamis': 'Sayur asem dan nasi rames hari Kamis kaya akan vitamin serta antioksidan alami untuk menjaga imunitas tubuh. Sate ayam menyediakan protein tinggi untuk energi yang stabil sepanjang hari sekolah.',
      'jumat': 'Menu Jumat seperti bakso kuah dan siomay ikan memberikan asupan protein laut yang kaya Omega-3 untuk perkembangan otak. Mie ayam jamur menyediakan energi yang lezat namun tetap bernutrisi untuk menutup minggu.',
      'sabtu': 'Sabtu yang ceria dengan kailan cah bawang putih yang sangat tinggi serat dan vitamin K. Udang serta ayam bakar menyediakan zinc serta zat besi untuk mencegah stunting dan memperkuat imun.'
    };

    // 1. Pakai cache lebih dulu agar hemat kuota dan respons tetap cepat
    if (cachedResult) {
      return cachedResult;
    }

    // 2. Jika belum ada cache, coba AI asli satu kali per kombinasi menu
    try {
      const result = await this._getOrCreateInFlight(cacheKey, async () => {
        const freshResult = await this._callAIProxy('getMenuAnalysis', { day, items });
        this._saveCache(cacheKey, freshResult, {
          version: this.MENU_CACHE_VERSION,
          source: 'ai'
        });
        return freshResult;
      });
      return result;
    } catch (e) {
      // 3. Jika AI sibuk / gagal, baru turun ke fallback lokal
      if (verifiedLibrary[dayKey]) {
        return verifiedLibrary[dayKey];
      }
      return this._constructLocalAnalysis(items);
    }
  }

  /**
   * Konstruktor nutrisi pintar untuk menu yang tidak ada di library
   */
  _constructLocalAnalysis(items) {
    const facts = {
      'nasi': 'karbohidrat untuk energi',
      'ayam': 'protein untuk otot',
      'telur': 'nutrisi otak',
      'sayur': 'vitamin harian',
      'ikan': 'omega-3',
      'daging': 'zat besi cegah stunting'
    };
    
    let parts = [];
    items.forEach(item => {
      for (let key in facts) {
        if (item.toLowerCase().includes(key)) {
          parts.push(facts[key]);
          break;
        }
      }
    });

    if (parts.length > 0) {
      return `Menu ini mengandung ${parts.slice(0,2).join(" dan ")} yang dirancang khusus untuk mendukung pertumbuhan optimal dan kecerdasan anak sekolah.`;
    }
    return "Menu hari ini telah disesuaikan dengan standar gizi nasional untuk memastikan anak mendapatkan asupan protein dan vitamin yang cukup setiap harinya.";
  }
  async askHelp(msg) {
    if (this.isHelpLoading) return;

    const sanitizedMsg = msg.trim()
      .substring(0, 800)
      .replace(/[<>]/g, '');

    const groundingNote = this.buildGroundingNote(sanitizedMsg);
    const appContext = await this.getAppGroundingContext(sanitizedMsg);
    const promptWithContext = this.shouldUseAppContext(sanitizedMsg)
      ? `${sanitizedMsg}\n\n${groundingNote}\n\n${appContext}`
      : sanitizedMsg;

    this.helpHistory.push({ role: "user", content: sanitizedMsg });
    this._saveHelpHistory();
    this.isHelpLoading = true;
    this.helpLoadingStatus = "Memahami pertanyaan Anda...";

    if (this.onHelpUpdate) this.onHelpUpdate();

    let statuses = ["Menyusun jawaban terbaik...", "Hampir selesai...", "Menghubungkan ke pusat data..."];
    const lowerMsg = sanitizedMsg.toLowerCase();
    if (lowerMsg.includes('sekolah') || lowerMsg.includes('daftar') || lowerMsg.includes('wilayah') || lowerMsg.includes('flores') || lowerMsg.includes('kota')) {
      statuses = ["Mencari data sekolah...", "Mengecek wilayah pilot project...", "Memverifikasi cakupan lokasi...", "Menyiapkan informasi pendaftaran..."];
    } else if (lowerMsg.includes('makan') || lowerMsg.includes('menu') || lowerMsg.includes('gizi') || lowerMsg.includes('protein') || lowerMsg.includes('sehat') || lowerMsg.includes('lapar')) {
      statuses = ["Menganalisis profil nutrisi...", "Mengecek standar gizi nasional...", "Menghitung komposisi menu...", "Mengkonsultasikan manfaat gizi..."];
    } else if (lowerMsg.includes('siapa') || lowerMsg.includes('apa') || lowerMsg.includes('gizibot')) {
      statuses = ["Mengingat identitas saya...", "Menyusun perkenalan...", "Mencari profil GiziKita..."];
    }

    let statusIndex = 0;
    const statusInterval = setInterval(() => {
      if (!this.isHelpLoading) {
        clearInterval(statusInterval);
        return;
      }
      this.helpLoadingStatus = statuses[statusIndex];
      statusIndex = (statusIndex + 1) % statuses.length;
      if (this.onHelpUpdate) this.onHelpUpdate();
    }, 2800);

    try {
      const cacheKey = `help_${sanitizedMsg.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
      const cachedResponse = this._getCache(cacheKey);

      if (cachedResponse) {
        this.helpHistory.push({ role: "assistant", content: cachedResponse });
        this._saveHelpHistory();
        this.isHelpLoading = false;
        if (this.onHelpUpdate) this.onHelpUpdate();
        return;
      }

      const reply = await this._callAIProxy('getHelpResponse', {
        history: this.helpHistory,
        groundingContext: appContext,
        promptWithContext
      });

      this.helpHistory.push({ role: "assistant", content: reply });
      this._saveHelpHistory();
      this._saveCache(cacheKey, reply, { version: this.MENU_CACHE_VERSION, source: 'ai' });
    } catch (e) {
      console.error("AI Help Error:", e);
      this.helpHistory.push({
        role: "assistant",
        content: this._getFriendlyErrorMessage(e)
      });
      this._saveHelpHistory();
    } finally {
      this.isHelpLoading = false;
      clearInterval(statusInterval);
      if (this.onHelpUpdate) this.onHelpUpdate();
    }
  }

  async getHelpResponse(history) {
    return this._callAIProxy('getHelpResponse', { history });
  }

  async analyzeSentiment(text, rating) {
    try {
      // Untuk sentimen, kita bisa tetap pakai logic lokal sederhana 
      // agar dashboard tetap cepat tanpa menunggu network call extra
      const raw = text.toLowerCase();
      const goodWords = ['enak', 'baik', 'bagus', 'terima kasih', 'suka', 'mantap', 'keren'];
      const isPositive = goodWords.some(word => raw.includes(word)) || rating >= 4;
      return isPositive ? 'good' : 'bad';
    } catch (e) {
      return rating >= 3 ? 'good' : 'bad';
    }
  }

  _getFriendlyErrorMessage(error) {
    const msg = typeof error === 'string' ? error : (error.message || "");
    const lowerMsg = msg.toLowerCase();
    
    // 1. Deteksi retryDelay khas Gemini
    const delayMatch = msg.match(/retryDelay":"(\d+)s"/);
    if (delayMatch) {
      return `Model sedang sibuk. Silakan tunggu ${delayMatch[1]} detik lagi.`;
    }

    // 2. Deteksi Rate Limit / Kuota (Groq & Gemini)
    if (
      lowerMsg.includes('429') || 
      lowerMsg.includes('503') || 
      lowerMsg.includes('quota') || 
      lowerMsg.includes('rate limit') ||
      lowerMsg.includes('too many requests')
    ) {
      return "Layanan AI sedang padat atau kuota habis. Mohon coba lagi beberapa saat lagi.";
    }
    
    // 3. Masalah Koneksi
    if (lowerMsg.includes('timeout') || lowerMsg.includes('fetch')) {
      return "Koneksi lambat atau terputus. Silakan periksa jaringan Anda.";
    }

    return "Terjadi masalah pada asisten AI. Silakan coba lagi nanti.";
  }
}

export default new AIService();
