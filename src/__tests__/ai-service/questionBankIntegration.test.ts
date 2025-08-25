import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

vi.mock('../../services/questionBankIntegration', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    createInterviewContextWithQuestionBank: vi.fn(async (field: string, level: string, topic?: string, questionCount?: number) => ({
      questions: [],
      contextPrompt: `Context for ${field} ${level} ${topic || ''} (${questionCount})`.trim(),
      usedQuestionIds: []
    }))
  };
});

describe('questionBankIntegration', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (global.fetch as any) = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('createSystemMessageWithQuestionBank builds correct system message with language', async () => {
    // Ensure any internal fetch usage resolves cleanly
    (global.fetch as any).mockResolvedValue({ ok: true, json: async () => ({ contextPrompt: 'Context for Frontend Junior React (4)' }) });

    const { createSystemMessageWithQuestionBank } = await import('../../services/questionBankIntegration');

    const msg = await createSystemMessageWithQuestionBank('Frontend', 'Junior', 'React', 'vi-VN', 4);

    expect(msg.role).toBe('system');
    expect(msg.content).toContain('Context for Frontend Junior React (4)');
    expect(msg.content).toContain('ONLY respond in Vietnamese');
    expect(msg.content).toContain('RESPONSE FORMAT:');
  });

  it('getQuestionBankStats returns defaults on error', async () => {
    (global.fetch as any).mockRejectedValue(new Error('Network error'));

    const { getQuestionBankStats } = await import('../../services/questionBankIntegration');
    const stats = await getQuestionBankStats();

    expect(stats.totalQuestions).toBe(0);
    expect(stats.fields).toEqual([]);
  });
});
