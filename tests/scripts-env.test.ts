import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { requireServiceKey } from '../scripts/lib/env.mjs';

const ENV_KEYS = ['SUPABASE_SECRET_KEY', 'SUPABASE_SERVICE_ROLE_KEY'] as const;
const savedEnv: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>> = {};

beforeEach(() => {
  for (const key of ENV_KEYS) savedEnv[key] = process.env[key];
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (savedEnv[key] === undefined) delete process.env[key];
    else process.env[key] = savedEnv[key];
  }
});

describe('requireServiceKey', () => {
  it('prefers SUPABASE_SECRET_KEY when set', () => {
    process.env.SUPABASE_SECRET_KEY = 'secret-key';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';

    expect(requireServiceKey()).toBe('secret-key');
  });

  it('falls back to SUPABASE_SERVICE_ROLE_KEY when SUPABASE_SECRET_KEY is unset', () => {
    delete process.env.SUPABASE_SECRET_KEY;
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';

    expect(requireServiceKey()).toBe('service-role-key');
  });

  it('falls back to SUPABASE_SERVICE_ROLE_KEY when SUPABASE_SECRET_KEY is an empty string', () => {
    process.env.SUPABASE_SECRET_KEY = '';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';

    expect(requireServiceKey()).toBe('service-role-key');
  });
});
