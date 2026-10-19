import { describe, it, expect } from 'vitest';
import AIService from '@/js/services/AIService';
import { supabase } from '@/js/core/SupabaseClient';
import { vi } from 'vitest';

describe('AIService Sentiment Analysis', () => {
  it('should categorize feedback as "good" for positive keywords', async () => {
    const text = 'Makanannya enak sekali dan sangat bergizi, terima kasih!';
    const rating = 5;
    const result = await AIService.analyzeSentiment(text, rating);
    expect(result).toBe('good');
  });

  it('should categorize feedback as "good" for high ratings even with neutral text', async () => {
    const text = 'Biasa saja.';
    const rating = 4;
    const result = await AIService.analyzeSentiment(text, rating);
    expect(result).toBe('good');
  });

  it('should categorize feedback as "bad" for low ratings', async () => {
    const text = 'Porsinya sedikit.';
    const rating = 2;
    const result = await AIService.analyzeSentiment(text, rating);
    expect(result).toBe('bad');
  });

  it('should use fallback logic on error', async () => {
    const result = await AIService.analyzeSentiment('', 1);
    expect(result).toBe('bad');
  });
});

describe('AIService App Grounding', () => {
  it('should detect school-related questions that need app data', () => {
    const text = 'Ada sekolah penerima MBG di Jakarta Selatan?';
    expect((AIService as any).shouldUseAppContext(text)).toBe(true);
  });

  it('should keep general MBG questions outside app-only context', () => {
    const text = 'Apa tujuan program MBG untuk siswa sekolah?';
    expect((AIService as any).shouldUseAppContext(text)).toBe(false);
  });

  it('should build a concise source-of-truth note for app data usage', () => {
    const note = (AIService as any).buildGroundingNote('Ada sekolah penerima MBG di Jakarta');
    expect(note).toContain('Sumber kebenaran utama');
    expect(note).toContain('GiziKita');
  });
});

describe('AIService menu analysis', () => {
  it('returns a local fallback when the AI gateway returns an error', async () => {
    vi.spyOn(supabase.functions, 'invoke').mockResolvedValue({ data: null, error: new Error('Gateway unavailable') } as any);

    const result = await AIService.getMenuAnalysisResult('Senin', ['Nasi', 'Ayam']);

    expect(result.source).toBe('fallback');
    expect(result.text.length).toBeGreaterThan(0);
    vi.restoreAllMocks();
  });
});
