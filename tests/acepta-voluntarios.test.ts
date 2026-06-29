/**
 * Tests for the acepta_voluntarios structured flag: schema validation and
 * store persistence. The flag marks a location as accepting volunteers so the
 * map/list can filter on it instead of relying on free text in the description.
 */
import { describe, expect, it } from 'vitest';

import { createLocationSchema } from '@/lib/data/schemas';
import { createMemoryStore } from '@/lib/data/memory-store';
import { applyFilters, withSummary } from '@/lib/data/selectors';
import type { LocationRecord } from '@/lib/data/types';

describe('createLocationSchema - acepta_voluntarios', () => {
  const base = {
    nombre: 'Centro de Acopio Prueba',
    estado: 'Aragua',
    ciudad: 'Maracay',
    status: 'estable' as const,
    personas_atrapadas: 'no_se' as const,
  };

  it('defaults acepta_voluntarios to false when absent', () => {
    const result = createLocationSchema.parse(base);
    expect(result.acepta_voluntarios).toBe(false);
  });

  it('accepts acepta_voluntarios true', () => {
    const result = createLocationSchema.parse({ ...base, acepta_voluntarios: true });
    expect(result.acepta_voluntarios).toBe(true);
  });

  it('rejects a non-boolean acepta_voluntarios', () => {
    expect(() =>
      createLocationSchema.parse({ ...base, acepta_voluntarios: 'si' }),
    ).toThrow();
  });
});

describe('memory store - acepta_voluntarios', () => {
  const baseInput = {
    nombre: 'Centro de Acopio Prueba',
    estado: 'Carabobo',
    ciudad: 'Valencia',
    status: 'estable' as const,
  };

  it('persists acepta_voluntarios when true', async () => {
    const store = createMemoryStore({ locations: [], needs: [] });
    const created = await store.createLocation({ ...baseInput, acepta_voluntarios: true });
    expect(created.acepta_voluntarios).toBe(true);
    const detail = await store.getLocation(created.id);
    expect(detail?.acepta_voluntarios).toBe(true);
  });

  it('defaults acepta_voluntarios to false when absent', async () => {
    const store = createMemoryStore({ locations: [], needs: [] });
    const created = await store.createLocation(baseInput);
    expect(created.acepta_voluntarios).toBe(false);
  });
});

describe('applyFilters - soloVoluntarios', () => {
  function make(id: string, acepta: boolean | undefined): LocationRecord {
    return {
      id,
      nombre: `Centro ${id}`,
      estado: 'Miranda',
      ciudad: 'Caracas',
      lat: null,
      lng: null,
      status: 'estable',
      acepta_voluntarios: acepta,
      createdAt: '2026-06-25T00:00:00.000Z',
      updatedAt: '2026-06-25T00:00:00.000Z',
    };
  }

  it('keeps only locations that accept volunteers when soloVoluntarios is set', () => {
    const locs = [make('a', true), make('b', false), make('c', undefined)].map((l) =>
      withSummary(l, []),
    );
    const result = applyFilters(locs, { soloVoluntarios: true });
    expect(result.map((l) => l.id)).toEqual(['a']);
  });

  it('returns all locations when soloVoluntarios is not set', () => {
    const locs = [make('a', true), make('b', false)].map((l) => withSummary(l, []));
    expect(applyFilters(locs, {})).toHaveLength(2);
  });
});
