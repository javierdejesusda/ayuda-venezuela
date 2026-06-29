import { describe, expect, it } from 'vitest';

import { PAGE_SIZE, fetchAll } from '../scripts/import-redh.mjs';

/**
 * Build a fake fetch over `total` rows that mimics the live API: every response
 * carries an empty `meta` object (no pagination flag), so termination must be
 * driven off the returned page size, not meta.has_more.
 */
function makeFakeFetch(key: string, total: number) {
  const calls: string[] = [];
  const fetchImpl = async (path: string) => {
    calls.push(path);
    const url = new URL(`https://example.test${path}`);
    const limit = Number(url.searchParams.get('limit'));
    const offset = Number(url.searchParams.get('offset'));
    const slice = [];
    for (let i = offset; i < Math.min(offset + limit, total); i += 1) {
      slice.push({ uuid: `id-${i}` });
    }
    return { success: true, data: { [key]: slice }, meta: {} };
  };
  return { fetchImpl, calls };
}

describe('fetchAll pagination', () => {
  it('collects every row across multiple full pages even when meta is empty', async () => {
    const total = PAGE_SIZE * 2 + 50;
    const { fetchImpl, calls } = makeFakeFetch('institutions', total);

    const rows = await fetchAll('institutions', 'institutions', fetchImpl);

    expect(rows.length).toBe(total);
    expect(calls.length).toBe(3);
    expect(rows[0].uuid).toBe('id-0');
    expect(rows[total - 1].uuid).toBe(`id-${total - 1}`);
  });

  it('stops after a single short page', async () => {
    const { fetchImpl, calls } = makeFakeFetch('shelters', 6);

    const rows = await fetchAll('shelters', 'shelters', fetchImpl);

    expect(rows.length).toBe(6);
    expect(calls.length).toBe(1);
  });

  it('honors an explicit has_more === false as an early stop', async () => {
    const calls: string[] = [];
    const fetchImpl = async (path: string) => {
      calls.push(path);
      const page = Array.from({ length: PAGE_SIZE }, (_, i) => ({ uuid: `id-${i}` }));
      return { data: { institutions: page }, meta: { pagination: { has_more: false } } };
    };

    const rows = await fetchAll('institutions', 'institutions', fetchImpl);

    expect(rows.length).toBe(PAGE_SIZE);
    expect(calls.length).toBe(1);
  });
});
