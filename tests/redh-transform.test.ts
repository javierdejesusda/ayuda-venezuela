import { describe, expect, it } from 'vitest';

import {
  SOURCE_PREFIX,
  institutionSourceRef,
  mapInstitution,
  mapShelter,
  normalizeEstado,
  shelterNeedSourceRef,
  shelterSourceRef,
} from '../scripts/redh-transform.mjs';

describe('SOURCE_PREFIX', () => {
  it('is redh', () => {
    expect(SOURCE_PREFIX).toBe('redh');
  });
});

describe('source refs', () => {
  it('builds a stable institution ref', () => {
    expect(institutionSourceRef('abc-123')).toBe('redh:inst:abc-123');
  });

  it('builds a stable shelter ref', () => {
    expect(shelterSourceRef('abc-123')).toBe('redh:shelter:abc-123');
  });

  it('builds a stable shelter-need ref', () => {
    expect(shelterNeedSourceRef('abc-123')).toBe('redh:shelter-need:abc-123');
  });
});

describe('normalizeEstado', () => {
  it('passes through canonical Venezuelan states verbatim', () => {
    expect(normalizeEstado('Distrito Capital')).toBe('Distrito Capital');
    expect(normalizeEstado('La Guaira')).toBe('La Guaira');
    expect(normalizeEstado('Carabobo')).toBe('Carabobo');
    expect(normalizeEstado('Zulia')).toBe('Zulia');
    expect(normalizeEstado('Táchira')).toBe('Táchira');
  });

  it('repairs casing and missing accents', () => {
    expect(normalizeEstado('Merida')).toBe('Mérida');
    expect(normalizeEstado('merida')).toBe('Mérida');
    expect(normalizeEstado('MIRANDA')).toBe('Miranda');
    expect(normalizeEstado('bolivar')).toBe('Bolívar');
    expect(normalizeEstado('falcon')).toBe('Falcón');
  });

  it('maps the source abbreviation Dtto capital to Distrito Capital', () => {
    expect(normalizeEstado('Dtto capital')).toBe('Distrito Capital');
    expect(normalizeEstado('dtto capital')).toBe('Distrito Capital');
  });

  it('returns null for unmappable values so the caller skips the record', () => {
    expect(normalizeEstado(null)).toBeNull();
    expect(normalizeEstado(undefined)).toBeNull();
    expect(normalizeEstado('')).toBeNull();
    expect(normalizeEstado('Por confirmar')).toBeNull();
    expect(normalizeEstado('Unknown State')).toBeNull();
  });
});

const INSTITUTION_FIXTURE = {
  uuid: 'b1f24a2b-717f-11f1-91d9-960002b95f31',
  type: 'hospital',
  official_name: 'Ciudad Hospitalaria Dr. Enrique Tejera (CHET)',
  short_name: 'CHET',
  description: 'Fuente externa comunitaria.',
  state: 'Carabobo',
  municipality: null,
  city: 'Valencia',
  address: null,
  latitude: '10.1620000',
  longitude: '-68.0078000',
  public_phone: '0241-8675000',
  public_email: null,
  verification_status: 'pending',
  operational_status: 'limited',
  infrastructure_status: null,
  accepting_patients: 0,
  emergency_available: 1,
  last_verified_at: null,
  updated_at: '2026-06-26 23:49:15',
};

describe('mapInstitution', () => {
  it('maps a well-formed institution to a location payload', () => {
    const out = mapInstitution(INSTITUTION_FIXTURE);
    expect(out).not.toBeNull();
    expect(out!.location.nombre).toBe('Ciudad Hospitalaria Dr. Enrique Tejera (CHET)');
    expect(out!.location.estado).toBe('Carabobo');
    expect(out!.location.ciudad).toBe('Valencia');
    expect(out!.location.status).toBe('desconocido');
    expect(out!.sourceRef).toBe('redh:inst:b1f24a2b-717f-11f1-91d9-960002b95f31');
  });

  it('parses string latitude and longitude into floats', () => {
    const out = mapInstitution(INSTITUTION_FIXTURE);
    expect(out!.location.lat).toBeCloseTo(10.162);
    expect(out!.location.lng).toBeCloseTo(-68.0078);
  });

  it('includes type, operational_status, accepting_patients and emergency_available in descripcion', () => {
    const out = mapInstitution(INSTITUTION_FIXTURE);
    const desc = out!.location.descripcion ?? '';
    expect(desc.toLowerCase()).toContain('hospital');
    expect(desc.toLowerCase()).toContain('limited');
    expect(desc).toContain('AVAPRE');
  });

  it('keeps public_phone as contactoTelefono', () => {
    const out = mapInstitution(INSTITUTION_FIXTURE);
    expect(out!.location.contactoTelefono).toBe('0241-8675000');
  });

  it('strips unicode bidi control characters from phone numbers', () => {
    const row = { ...INSTITUTION_FIXTURE, public_phone: '‎0241-8675000‏' };
    const out = mapInstitution(row);
    expect(out!.location.contactoTelefono).toBe('0241-8675000');
  });

  it('sets contactoTelefono to undefined when phone is absent', () => {
    const row = { ...INSTITUTION_FIXTURE, public_phone: null };
    const out = mapInstitution(row);
    expect(out!.location.contactoTelefono).toBeUndefined();
  });

  it('returns null when the state cannot be mapped to a Venezuelan state', () => {
    expect(mapInstitution({ ...INSTITUTION_FIXTURE, state: null })).toBeNull();
    expect(mapInstitution({ ...INSTITUTION_FIXTURE, state: 'Por confirmar' })).toBeNull();
    expect(mapInstitution({ ...INSTITUTION_FIXTURE, state: '' })).toBeNull();
  });

  it('clamps the nombre to 120 chars max', () => {
    const row = { ...INSTITUTION_FIXTURE, official_name: 'X'.repeat(200) };
    const out = mapInstitution(row);
    expect(out!.location.nombre.length).toBeLessThanOrEqual(120);
  });

  it('uses a placeholder nombre when official_name is missing', () => {
    const row = { ...INSTITUTION_FIXTURE, official_name: null };
    const out = mapInstitution(row);
    expect(out!.location.nombre.length).toBeGreaterThanOrEqual(3);
  });

  it('uses a placeholder ciudad when city is missing', () => {
    const row = { ...INSTITUTION_FIXTURE, city: null };
    const out = mapInstitution(row);
    expect(out!.location.ciudad.length).toBeGreaterThanOrEqual(2);
  });

  it('sets lat/lng to null when coordinates are missing', () => {
    const row = { ...INSTITUTION_FIXTURE, latitude: null, longitude: null };
    const out = mapInstitution(row);
    expect(out!.location.lat).toBeNull();
    expect(out!.location.lng).toBeNull();
  });

  it('produces empty fotos array and no contactoNombre', () => {
    const out = mapInstitution(INSTITUTION_FIXTURE);
    expect(out!.location.fotos).toEqual([]);
    expect(out!.location.contactoNombre).toBeUndefined();
  });
});

const SHELTER_FIXTURE = {
  uuid: 'e67c1856-722c-11f1-91d9-960002b95f31',
  name: 'Complejo Cultural, Deportivo y Recreativo Guayana Esequiba',
  organization: 'Alcaldía de Caracas',
  address: 'Avenida Los Próceres, parroquia San Bernardino',
  state: 'Distrito Capital',
  city: 'Caracas',
  latitude: '10.5146988',
  longitude: '-66.8963917',
  capacity: 500,
  available_capacity: 120,
  accepts_families: true,
  accepts_children: true,
  contact: null,
  schedule: null,
  status: 'active',
  verification_status: 'pending',
  notes: 'Centro de resguardo temporal.',
  source_label: 'El Diario',
  source_url: 'https://eldiario.com/2026/06/25/refugios/',
  updated_at: '2026-06-27 13:34:23',
};

describe('mapShelter', () => {
  it('maps a well-formed shelter to a location + refugio need', () => {
    const out = mapShelter(SHELTER_FIXTURE);
    expect(out).not.toBeNull();
    expect(out!.location.nombre).toBe(
      'Complejo Cultural, Deportivo y Recreativo Guayana Esequiba',
    );
    expect(out!.location.estado).toBe('Distrito Capital');
    expect(out!.location.ciudad).toBe('Caracas');
    expect(out!.location.status).toBe('desconocido');
    expect(out!.sourceRef).toBe('redh:shelter:e67c1856-722c-11f1-91d9-960002b95f31');
    expect(out!.needSourceRef).toBe(
      'redh:shelter-need:e67c1856-722c-11f1-91d9-960002b95f31',
    );
  });

  it('produces a refugio need with media urgencia and pendiente status', () => {
    const out = mapShelter(SHELTER_FIXTURE);
    expect(out!.need.categoria).toBe('refugio');
    expect(out!.need.urgencia).toBe('media');
    expect(out!.need.status).toBe('pendiente');
  });

  it('includes capacity, available_capacity, accepts_families and accepts_children in need descripcion', () => {
    const out = mapShelter(SHELTER_FIXTURE);
    const desc = out!.need.descripcion;
    expect(desc).toContain('500');
    expect(desc).toContain('120');
    expect(desc).toContain('AVAPRE');
  });

  it('parses coordinates into floats', () => {
    const out = mapShelter(SHELTER_FIXTURE);
    expect(out!.location.lat).toBeCloseTo(10.5146988);
    expect(out!.location.lng).toBeCloseTo(-66.8963917);
  });

  it('returns null when the state cannot be mapped', () => {
    expect(mapShelter({ ...SHELTER_FIXTURE, state: null })).toBeNull();
    expect(mapShelter({ ...SHELTER_FIXTURE, state: 'Por confirmar' })).toBeNull();
  });

  it('handles null capacity values without error', () => {
    const row = { ...SHELTER_FIXTURE, capacity: null, available_capacity: null };
    const out = mapShelter(row);
    expect(out).not.toBeNull();
    expect(typeof out!.need.descripcion).toBe('string');
    expect(out!.need.descripcion.length).toBeGreaterThan(0);
  });

  it('includes accepts_families and accepts_children flags when false', () => {
    const row = { ...SHELTER_FIXTURE, accepts_families: false, accepts_children: false };
    const out = mapShelter(row);
    expect(out!.need.descripcion.toLowerCase()).toContain('familia');
  });
});
