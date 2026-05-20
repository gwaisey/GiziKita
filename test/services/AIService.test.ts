import { describe, it, expect } from 'vitest';
import AIService from '@/js/services/AIService';

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
    // Force an error by passing null where string is expected (if not caught by TS)
    // Here we just verify the internal logic of the function
    const result = await AIService.analyzeSentiment('', 1);
    expect(result).toBe('bad');
  });
});
