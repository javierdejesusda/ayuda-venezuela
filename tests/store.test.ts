import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const createSupabaseStore = vi.fn<(url: string, key: string) => { isDemo: boolean }>(
  () => ({ isDemo: false }),
);

vi.mock('@/lib/data/supabase-store', () => ({
  createSupabaseStore: (url: string, key: string) => createSupabaseStore(url, key),
}));

const ENV_KEYS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SECRET_KEY',
] as const;
const savedEnv: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>> = {};

beforeEach(() => {
  vi.resetModules();
  createSupabaseStore.mockClear();
  for (const key of ENV_KEYS) savedEnv[key] = process.env[key];
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (savedEnv[key] === undefined) delete process.env[key];
    else process.env[key] = savedEnv[key];
  }
});

describe('getStore', () => {
  it('throws instead of silently falling back to the anon key when SUPABASE_SECRET_KEY is not set', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
    delete process.env.SUPABASE_SECRET_KEY;

    const { getStore } = await import('@/lib/data/store');

    expect(() => getStore()).toThrow(/SUPABASE_SECRET_KEY/);
    expect(createSupabaseStore).not.toHaveBeenCalled();
  });

  it('uses SUPABASE_SECRET_KEY when set', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
    process.env.SUPABASE_SECRET_KEY = 'secret-key';

    const { getStore } = await import('@/lib/data/store');
    getStore();

    expect(createSupabaseStore).toHaveBeenCalledWith('https://example.supabase.co', 'secret-key');
  });

  it('stays in demo mode (no throw) when the anon URL/key are not configured at all', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.SUPABASE_SECRET_KEY;

    const { getStore, isDemoMode } = await import('@/lib/data/store');

    expect(() => getStore()).not.toThrow();
    expect(isDemoMode()).toBe(true);
    expect(createSupabaseStore).not.toHaveBeenCalled();
  });
});
