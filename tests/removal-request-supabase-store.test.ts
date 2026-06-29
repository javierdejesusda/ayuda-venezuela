import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const select = vi.fn();
const insert = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({ from: () => ({ insert }) }),
}));

import { createSupabaseStore } from '@/lib/data/supabase-store';

/**
 * Thenable that also exposes a `.select` spy. removal_requests has no anon
 * SELECT policy, so the store must NOT request a representation after insert
 * (doing so makes PostgREST return 0 rows and .single() throws even though the
 * row was stored). The spy lets the tests assert select is never called.
 */
function insertResult(value: { error: unknown }) {
  return {
    select,
    then: (resolve: (v: { error: unknown }) => unknown) => Promise.resolve(value).then(resolve),
  };
}

beforeEach(() => {
  insert.mockReset();
  select.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('supabase store createRemovalRequest', () => {
  it('inserts snake_case columns without requesting a representation', async () => {
    insert.mockReturnValue(insertResult({ error: null }));
    const store = createSupabaseStore('https://example.supabase.co', 'anon-key');

    await expect(
      store.createRemovalRequest({
        locationId: 'loc-1',
        motivo: 'Es un duplicado de otro reporte',
      }),
    ).resolves.toBeUndefined();

    expect(insert).toHaveBeenCalledWith({
      location_id: 'loc-1',
      motivo: 'Es un duplicado de otro reporte',
      contacto: null,
    });
    expect(select).not.toHaveBeenCalled();
  });

  it('passes a provided contacto through to the insert', async () => {
    insert.mockReturnValue(insertResult({ error: null }));
    const store = createSupabaseStore('https://example.supabase.co', 'anon-key');

    await store.createRemovalRequest({
      locationId: 'loc-2',
      motivo: 'Otro motivo',
      contacto: 'ana@example.com',
    });

    expect(insert).toHaveBeenCalledWith({
      location_id: 'loc-2',
      motivo: 'Otro motivo',
      contacto: 'ana@example.com',
    });
  });

  it('throws when the insert errors', async () => {
    const dbError = { code: '23514', message: 'check violation' };
    insert.mockReturnValue(insertResult({ error: dbError }));
    const store = createSupabaseStore('https://example.supabase.co', 'anon-key');

    await expect(
      store.createRemovalRequest({ locationId: 'loc-3', motivo: 'Otro motivo' }),
    ).rejects.toBe(dbError);
  });
});
