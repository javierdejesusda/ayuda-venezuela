import { describe, expect, it } from 'vitest';

import {
  ASSISTANT_ERROR_MESSAGE,
  assistantErrorMessage,
} from '@/lib/ai/error-message';

describe('assistantErrorMessage', () => {
  it('returns the fixed generic message for an Error', () => {
    const result = assistantErrorMessage(new Error('boom'));

    expect(result).toBe(ASSISTANT_ERROR_MESSAGE);
  });

  it('never leaks the raw error message to the client', () => {
    const secret = 'OPENAI_API_KEY sk-secret-leak';

    const result = assistantErrorMessage(new Error(secret));

    expect(result).not.toContain('sk-secret-leak');
    expect(result).not.toContain('OPENAI_API_KEY');
  });

  it('returns the generic message for a non-Error value', () => {
    expect(assistantErrorMessage('raw string failure')).toBe(ASSISTANT_ERROR_MESSAGE);
    expect(assistantErrorMessage(undefined)).toBe(ASSISTANT_ERROR_MESSAGE);
  });
});
