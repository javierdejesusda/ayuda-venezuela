import { describe, expect, it } from 'vitest';

import {
  availableCiudadesForEstado,
  ciudadesByEstado,
  matchesFilters,
  withSummary,
} from '@/lib/data/selectors';
import type { LocationRecord, NeedRecord } from '@/lib/data/types';

const baseLocation = (over: Partial<LocationRecord>): LocationRecord => ({
  id: 'l1',
  nombre: 'Zona',
  estado: 'Carabobo',
  ciudad: 'Valencia',
  lat: 10,
  lng: -68,
  status: 'dano_parcial',
  createdAt: '2026-06-25T00:00:00Z',
  updatedAt: '2026-06-25T00:00:00Z',
  ...over,
});

const noNeeds: NeedRecord[] = [];

describe('availableCiudadesForEstado', () => {
  const locations: LocationRecord[] = [
    baseLocation({ id: 'a', estado: 'Carabobo', ciudad: 'Valencia' }),
    baseLocation({ id: 'b', estado: 'Carabobo', ciudad: 'Guacara' }),
    baseLocation({ id: 'c', estado: 'Carabobo', ciudad: 'Valencia' }), // duplicate
    baseLocation({ id: 'd', estado: 'Aragua', ciudad: 'Maracay' }),
  ];

  it('returns distinct sorted ciudades for a matching estado', () => {
    const result = availableCiudadesForEstado(locations, 'Carabobo');
    expect(result).toEqual(['Guacara', 'Valencia']);
  });

  it('returns an empty array for a non-matching estado', () => {
    expect(availableCiudadesForEstado(locations, 'Zulia')).toEqual([]);
  });

  it('returns an empty array when estado is an empty string', () => {
    expect(availableCiudadesForEstado(locations, '')).toEqual([]);
  });

  it('excludes locations with an empty ciudad', () => {
    const withEmpty: LocationRecord[] = [
      ...locations,
      baseLocation({ id: 'e', estado: 'Carabobo', ciudad: '' }),
    ];
    const result = availableCiudadesForEstado(withEmpty, 'Carabobo');
    expect(result).not.toContain('');
    expect(result).toEqual(['Guacara', 'Valencia']);
  });
});

describe('ciudadesByEstado', () => {
  it('groups distinct sorted ciudades by estado', () => {
    const locations: LocationRecord[] = [
      baseLocation({ id: 'a', estado: 'Carabobo', ciudad: 'Valencia' }),
      baseLocation({ id: 'b', estado: 'Carabobo', ciudad: 'Guacara' }),
      baseLocation({ id: 'c', estado: 'Aragua', ciudad: 'Maracay' }),
      baseLocation({ id: 'd', estado: 'Aragua', ciudad: 'Maracay' }), // duplicate
    ];

    const result = ciudadesByEstado(locations);
    expect(result['Carabobo']).toEqual(['Guacara', 'Valencia']);
    expect(result['Aragua']).toEqual(['Maracay']);
  });

  it('returns an empty object for no locations', () => {
    expect(ciudadesByEstado([])).toEqual({});
  });

  it('omits estados that only have empty ciudades', () => {
    const locations: LocationRecord[] = [
      baseLocation({ id: 'a', estado: 'Carabobo', ciudad: '' }),
    ];
    const result = ciudadesByEstado(locations);
    expect(result['Carabobo']).toBeUndefined();
  });
});

describe('matchesFilters ciudad', () => {
  const locValencia = withSummary(
    baseLocation({ id: 'v', estado: 'Carabobo', ciudad: 'Valencia' }),
    noNeeds,
  );
  const locGuacara = withSummary(
    baseLocation({ id: 'g', estado: 'Carabobo', ciudad: 'Guacara' }),
    noNeeds,
  );
  const locNoCiudad = withSummary(
    baseLocation({ id: 'n', estado: 'Carabobo', ciudad: '' }),
    noNeeds,
  );

  it('filters to the specified ciudad when both estado and ciudad are set', () => {
    expect(matchesFilters(locValencia, { estado: 'Carabobo', ciudad: 'Valencia' })).toBe(true);
    expect(matchesFilters(locGuacara, { estado: 'Carabobo', ciudad: 'Valencia' })).toBe(false);
  });

  it('estado-only filter includes a location with an empty ciudad', () => {
    expect(matchesFilters(locNoCiudad, { estado: 'Carabobo' })).toBe(true);
  });

  it('estado+ciudad filter excludes a location with an empty ciudad', () => {
    expect(matchesFilters(locNoCiudad, { estado: 'Carabobo', ciudad: 'Valencia' })).toBe(false);
  });

  it('ciudad-only filter (no estado) matches by ciudad alone', () => {
    expect(matchesFilters(locValencia, { ciudad: 'Valencia' })).toBe(true);
    expect(matchesFilters(locGuacara, { ciudad: 'Valencia' })).toBe(false);
  });

  it('no filter includes all locations', () => {
    expect(matchesFilters(locValencia, {})).toBe(true);
    expect(matchesFilters(locNoCiudad, {})).toBe(true);
  });
});
