import { GoogleGenerativeAI } from "gemini"

// --- Professional Type Definitions ---
interface ChatMessage {
  role: 'user' | 'assistant' | 'model' | 'system';
  content: string;
}

interface ActionPayload {
  action: 'getMenuAnalysis' | 'getHelpResponse';
  payload: {
    day?: string;
    items?: string[];
    history?: ChatMessage[];
  };
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, payload } = await req.json() as ActionPayload;
    console.log(`Action: ${action}`, payload)

    const groqApiKey = Deno.env.get('GROQ_API_KEY')?.trim()
    const groqModel = Deno.env.get('GROQ_MODEL')?.trim() || 'llama-3.3-70b-versatile'

    const rawApiKeys = [
      Deno.env.get('GEMINI_API_KEY'),
      Deno.env.get('GEMINI_API_KEY_BACKUP'),
      ...(Deno.env.get('GEMINI_API_KEYS') || '').split(','),
    ]
      .map((key) => key?.trim())
      .filter((key): key is string => Boolean(key))

    const systemPrompt = `Anda adalah GiziBot, asisten pintar GiziKita. Tugas Anda adalah memberikan informasi akurat mengenai program Makan Bergizi Gratis (MBG) dengan nada ramah, profesional, dan yakin.

            KNOWLEDGE BASE (DATA NASIONAL):
            1. STATUS & CAKUPAN: Program MBG resmi berjalan secara nasional sejak 6 Januari 2025 di 38 PROVINSI dan menyasar seluruh 514 KOTA/KABUPATEN di Indonesia secara bertahap.
            2. TARGET MASIF: Pemerintah menargetkan total 82,9 juta penerima manfaat (Siswa, Santri, Ibu Hamil, & Balita) hingga tahun 2029.
            3. UNIT SPPG: Distribusi dilakukan melalui Satuan Pelayanan Pemenuhan Gizi (SPPG). Jika suatu kota belum ada di "Daftar Sekolah" aplikasi, jelaskan bahwa wilayah tersebut dalam tahap pembangunan/aktivasi SPPG sesuai Peta Jalan Strategis 2025-2029.
            4. CIREBON, JOGJA, KUPANG, MEDAN, SURABAYA: Merupakan wilayah pilot project awal yang kini sudah masuk operasional penuh.
            5. FLORES/PAPUA/DAERAH 3T: Mendapat prioritas khusus dalam pembangunan SPPG mulai tahun 2025 untuk pemerataan gizi.
            
            ATURAN KRUSIAL:
            1. YAKIN & PROFESIONAL: Jawablah dengan penuh keyakinan bahwa seluruh wilayah Indonesia akan tercover. Jangan pernah menjawab "tidak tahu", tapi gunakan logika "perluasan bertahap SPPG".
            2. DILARANG KERAS membahas anggaran keuangan/dana spesifik.
            3. JUJUR TENTANG APLIKASI: Bedakan data "Digital Dashboard" (yang sedang Anda lihat) dengan "Implementasi Fisik" di lapangan yang mungkin sudah berjalan lebih luas.
            
            Jawablah dengan singkat, padat, dan tidak menggunakan emoji.`;

    const buildMenuPrompt = (day: string, items: string[]) => ([
      {
        role: 'system',
        content: 'Anda adalah ahli gizi sekolah. Berikan analisis singkat dalam Bahasa Indonesia, fokus hanya pada manfaat gizi positif untuk pertumbuhan anak. Maksimal 3 kalimat. Jangan gunakan emoji.'
      },
      {
        role: 'user',
        content: `Analisa menu makan gratis hari ${day}: ${items.join(", ")}.`
      }
    ])

    const callGroq = async (action: string, payload: ActionPayload['payload']) => {
      if (!groqApiKey) throw new Error('GROQ_API_KEY not found in Secrets')

      let messages: Array<{ role: string; content: string }> = []

      if (action === 'getMenuAnalysis') {
        const day = payload.day || 'ini';
        const items = payload.items || [];
        messages = buildMenuPrompt(day, items)
      } else if (action === 'getHelpResponse') {
        const history = payload.history || [];
        messages = [
          {
            role: 'system',
            content: systemPrompt
          },
          ...history.map((msg) => ({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: msg.content
          }))
        ]
      } else {
        throw new Error(`Unsupported action: ${action}`)
      }

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: groqModel,
          messages,
          temperature: action === 'getMenuAnalysis' ? 0.4 : 0.7
        })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error?.message || `Groq request failed with status ${response.status}`)
      }

      const text = data?.choices?.[0]?.message?.content?.trim()
      if (!text) throw new Error('Groq returned empty response')
      return text
    }

    const callModel = async (apiKey: string, modelName: string, action: string, payload: ActionPayload['payload']) => {
      try {
        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ 
          model: modelName,
          systemInstruction: systemPrompt
        })
        if (action === 'getMenuAnalysis') {
          const day = payload.day || 'ini';
          const items = payload.items || [];
          const prompt = `Analisa menu makan gratis hari ${day}: ${items.join(", ")}. Fokus HANYA pada manfaat gizi positif untuk pertumbuhan anak. Maks 3 kalimat. JANGAN gunakan emoji sama sekali.`
          const result = await model.generateContent(prompt)
          const text = result.response.text()
          if (!text) throw new Error("AI returned empty response")
          return text
        } else if (action === 'getHelpResponse') {
          const history = payload.history || [];
          const chat = model.startChat({
            history: history.slice(0, -1).map((msg) => ({
              role: msg.role === 'user' ? 'user' : 'model',
              parts: [{ text: msg.content }],
            })),
          })
          const lastMsg = history[history.length - 1].content
          const result = await chat.sendMessage(lastMsg)
          return result.response.text()
        }
      } catch (err) {
        const error = err as Error;
        throw new Error(`[${modelName}] ${error.message}`)
      }
      return ""
    }

    let responseText = ""
    let lastError: Error | null = null

    if (groqApiKey) {
      try {
        // --- Security Hardening: Validate Payload ---
        if (action === 'getHelpResponse') {
          const history = payload.history || [];
          if (history.length > 0) {
            const lastMsg = history[history.length - 1].content;
            // Prevent massive payloads to save tokens/costs and mitigate DDoS
            if (lastMsg.length > 1000) {
              throw new Error("Pesan terlalu panjang (Maksimal 1000 karakter).");
            }
            // Basic Sanitization
            history[history.length - 1].content = lastMsg.replace(/[<>]/g, '');
          }
        }

        responseText = await callGroq(action, payload)
      } catch (groqError) {
        const error = groqError as Error
        console.error(`Groq attempt failed (${groqModel}):`, error.message)
        lastError = error
      }
    }

    const modelCandidates = ["gemini-1.5-flash", "gemini-2.0-flash"]

    if (!responseText && rawApiKeys.length > 0) {
      for (const apiKey of rawApiKeys) {
        for (const modelName of modelCandidates) {
          try {
            responseText = await callModel(apiKey, modelName, action, payload)
            lastError = null
            break
          } catch (modelError) {
            const error = modelError as Error
            console.error(`Gemini attempt failed (${modelName}):`, error.message)
            lastError = error
          }
        }

        if (responseText) {
          break
        }
      }
    }

    if (!responseText) {
      throw new Error(`All AI providers are currently unavailable: ${lastError?.message || 'Unknown error'}`)
    }

    return new Response(
      JSON.stringify({ text: responseText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    const err = error as Error;
    console.error("Function Error:", err.message)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
