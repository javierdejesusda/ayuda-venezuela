import { describe, expect, it } from 'vitest';

import {
  buildDescripcion,
  capTipos,
  centerSourceRef,
  mapTipoToCategoria,
  mapUrgencia,
  needSourceRef,
  parseCoordsFromMapsUrl,
  parseEstadoCiudad,
  sanitizeCoords,
  transformCenter,
  transformNeed,
} from '../scripts/recolectavzla-transform.mjs';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const CENTER_FIXTURE = {
  id: 'c_1782abc',
  nombre: 'Centro de Acopio Las Mercedes',
  estado: 'Caracas (Distrito Capital)',
  direccion: 'Av. Las Mercedes, frente al CC City Market',
  maps_url: 'https://maps.google.com/?q=10.4806,-66.8587',
  lat: 10.4806,
  lng: -66.8587,
  tipos: ['Alimentos', 'Agua', 'Medicinas'],
  urgencia: 'alta',
  descripcion: 'Centro de acopio activo para damnificados del terremoto.',
  horario: 'Lunes a Viernes 8am - 5pm',
  image_url:
    'https://rdctrywbuibpdaqrdfqa.supabase.co/storage/v1/object/public/Imagenes/centros/abc123_image.jpg',
  fecha_publicacion: '2026-06-20T12:00:00Z',
  responsable: 'Ana Martínez',
  telefono: '04241234567',
  correo: 'ana@example.com',
  cedula: 'V-12345678',
};

// ---------------------------------------------------------------------------
// centerSourceRef
// ---------------------------------------------------------------------------

describe('centerSourceRef', () => {
  it('builds a stable ref with the recolecta prefix', () => {
    expect(centerSourceRef('c_1782abc')).toBe('recolecta:c_1782abc');
  });

  it('produces different refs for different ids', () => {
    expect(centerSourceRef('c_001')).not.toBe(centerSourceRef('c_002'));
  });
});

// ---------------------------------------------------------------------------
// needSourceRef
// ---------------------------------------------------------------------------

describe('needSourceRef', () => {
  it('builds a stable ref combining center id and tipo', () => {
    expect(needSourceRef('c_1782abc', 'Alimentos')).toBe('recolecta:c_1782abc:Alimentos');
  });

  it('produces different refs for different tipos of the same center', () => {
    expect(needSourceRef('c_001', 'Agua')).not.toBe(needSourceRef('c_001', 'Medicinas'));
  });
});

// ---------------------------------------------------------------------------
// parseCoordsFromMapsUrl
// ---------------------------------------------------------------------------

describe('parseCoordsFromMapsUrl', () => {
  it('parses lat/lng from a ?q=lat,lng style URL', () => {
    const result = parseCoordsFromMapsUrl('https://maps.google.com/?q=10.4806,-66.8587');
    expect(result).toEqual({ lat: 10.4806, lng: -66.8587 });
  });

  it('parses coordinates from a @lat,lng Google Maps URL', () => {
    const result = parseCoordsFromMapsUrl(
      'https://www.google.com/maps/place/Centro/@10.5034,-66.9136,17z',
    );
    expect(result).not.toBeNull();
    expect(result!.lat).toBeCloseTo(10.5034);
    expect(result!.lng).toBeCloseTo(-66.9136);
  });

  it('returns null for a URL with no recognizable coordinates', () => {
    expect(parseCoordsFromMapsUrl('https://maps.google.com/')).toBeNull();
    expect(parseCoordsFromMapsUrl('')).toBeNull();
    expect(parseCoordsFromMapsUrl(null)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// sanitizeCoords
// ---------------------------------------------------------------------------

describe('sanitizeCoords', () => {
  it('keeps valid lat/lng from record fields', () => {
    expect(sanitizeCoords(10.5, -66.9)).toEqual({ lat: 10.5, lng: -66.9 });
  });

  it('nulls out missing or out-of-range coordinates', () => {
    expect(sanitizeCoords(null, null)).toEqual({ lat: null, lng: null });
    expect(sanitizeCoords(999, -66.9)).toEqual({ lat: null, lng: null });
    expect(sanitizeCoords(10.5, undefined)).toEqual({ lat: null, lng: null });
  });
});

// ---------------------------------------------------------------------------
// parseEstadoCiudad
// ---------------------------------------------------------------------------

describe('parseEstadoCiudad', () => {
  it('splits "City (State)" format into ciudad and estado', () => {
    expect(parseEstadoCiudad('Caracas (Distrito Capital)')).toEqual({
      estado: 'Distrito Capital',
      ciudad: 'Caracas',
    });
  });

  it('resolves a plain state name directly', () => {
    const out = parseEstadoCiudad('Miranda');
    expect(out.estado).toBe('Miranda');
    expect(out.ciudad).toBeTruthy();
  });

  it('handles other parenthesized state patterns', () => {
    const out = parseEstadoCiudad('Maracay (Aragua)');
    expect(out.estado).toBe('Aragua');
    expect(out.ciudad).toBe('Maracay');
  });

  it('maps legacy Vargas alias to La Guaira', () => {
    const out = parseEstadoCiudad('Vargas');
    expect(out.estado).toBe('La Guaira');
  });

  it('falls back to Distrito Capital when nothing resolves', () => {
    const out = parseEstadoCiudad('');
    expect(out.estado).toBe('Distrito Capital');
    const out2 = parseEstadoCiudad(null);
    expect(out2.estado).toBe('Distrito Capital');
  });

  it('handles mixed casing and missing accents', () => {
    const out = parseEstadoCiudad('Valencia (CARABOBO)');
    expect(out.estado).toBe('Carabobo');
    expect(out.ciudad).toBe('Valencia');
  });
});

// ---------------------------------------------------------------------------
// mapTipoToCategoria
// ---------------------------------------------------------------------------

describe('mapTipoToCategoria', () => {
  it('maps the main supply types to matching schema categories', () => {
    expect(mapTipoToCategoria('Alimentos')).toBe('alimentos');
    expect(mapTipoToCategoria('Agua')).toBe('agua');
    expect(mapTipoToCategoria('Medicinas')).toBe('medicinas');
    expect(mapTipoToCategoria('Ropa')).toBe('ropa');
    expect(mapTipoToCategoria('Higiene')).toBe('higiene');
    expect(mapTipoToCategoria('Herramientas')).toBe('herramientas');
  });

  it('maps Pañales, Dinero and Otro to otro (no native category for these)', () => {
    expect(mapTipoToCategoria('Pañales')).toBe('otro');
    expect(mapTipoToCategoria('Dinero')).toBe('otro');
    expect(mapTipoToCategoria('Otro')).toBe('otro');
  });

  it('falls back to otro for unrecognized tipos', () => {
    expect(mapTipoToCategoria('Gasolina')).toBe('otro');
    expect(mapTipoToCategoria(null)).toBe('otro');
  });

  it('is case-insensitive', () => {
    expect(mapTipoToCategoria('ALIMENTOS')).toBe('alimentos');
    expect(mapTipoToCategoria('alimentos')).toBe('alimentos');
  });
});

// ---------------------------------------------------------------------------
// mapUrgencia
// ---------------------------------------------------------------------------

describe('mapUrgencia', () => {
  it('passes through the three valid urgencia values', () => {
    expect(mapUrgencia('alta')).toBe('alta');
    expect(mapUrgencia('media')).toBe('media');
    expect(mapUrgencia('baja')).toBe('baja');
  });

  it('defaults to media for unknown or missing values', () => {
    expect(mapUrgencia('')).toBe('media');
    expect(mapUrgencia(null)).toBe('media');
    expect(mapUrgencia('urgente')).toBe('media');
  });

  it('is case-insensitive', () => {
    expect(mapUrgencia('Alta')).toBe('alta');
    expect(mapUrgencia('MEDIA')).toBe('media');
  });
});

// ---------------------------------------------------------------------------
// capTipos
// ---------------------------------------------------------------------------

describe('capTipos', () => {
  it('returns all tipos when there are 4 or fewer', () => {
    const { capped } = capTipos(['Alimentos', 'Agua', 'Ropa', 'Medicinas'], '');
    expect(capped).toHaveLength(4);
    expect(capped).toContain('Alimentos');
  });

  it('caps to 4 when there are more than 4 tipos', () => {
    const { capped } = capTipos(
      ['Alimentos', 'Agua', 'Ropa', 'Medicinas', 'Higiene', 'Pañales'],
      '',
    );
    expect(capped).toHaveLength(4);
  });

  it('prefers tipos whose keywords appear in the descripcion when capping', () => {
    const { capped } = capTipos(
      ['Alimentos', 'Agua', 'Ropa', 'Medicinas', 'Higiene', 'Pañales'],
      'Necesitamos medicinas urgentes y productos de higiene personal.',
    );
    expect(capped).toContain('Medicinas');
    expect(capped).toContain('Higiene');
  });

  it('reports that capping occurred via a wasCapped flag', () => {
    const { wasCapped } = capTipos(
      ['Alimentos', 'Agua', 'Ropa', 'Medicinas', 'Higiene'],
      '',
    );
    expect(wasCapped).toBe(true);
  });

  it('reports wasCapped false when no capping was needed', () => {
    const { wasCapped } = capTipos(['Alimentos', 'Agua'], '');
    expect(wasCapped).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// buildDescripcion
// ---------------------------------------------------------------------------

describe('buildDescripcion', () => {
  it('includes the center name, description, horario, responsable and telefono', () => {
    const d = buildDescripcion(CENTER_FIXTURE);
    expect(d).toContain('Centro de Acopio Las Mercedes');
    expect(d).toContain('Centro de acopio activo');
    expect(d).toContain('Horario: Lunes a Viernes 8am - 5pm');
    expect(d).toContain('Responsable: Ana Martínez');
    expect(d).toContain('Telefono: 04241234567');
  });

  it('does NOT include correo or cedula (PII drop)', () => {
    const d = buildDescripcion(CENTER_FIXTURE);
    expect(d).not.toContain('ana@example.com');
    expect(d).not.toContain('V-12345678');
  });

  it('omits a section when that field is null or empty', () => {
    const d = buildDescripcion({ ...CENTER_FIXTURE, horario: null, telefono: '' });
    expect(d).not.toContain('Horario:');
    expect(d).not.toContain('Telefono:');
  });

  it('truncates to 1000 chars max', () => {
    const d = buildDescripcion({ ...CENTER_FIXTURE, descripcion: 'x'.repeat(2000) });
    expect(d.length).toBeLessThanOrEqual(1000);
  });
});

// ---------------------------------------------------------------------------
// PII contract
// ---------------------------------------------------------------------------

describe('PII contract', () => {
  it('drops cedula entirely from the transformed output', () => {
    const out = transformCenter(CENTER_FIXTURE);
    const json = JSON.stringify(out);
    expect(json).not.toContain('cedula');
    expect(json).not.toContain('V-12345678');
  });

  it('drops correo entirely from the transformed output', () => {
    const out = transformCenter(CENTER_FIXTURE);
    const json = JSON.stringify(out);
    expect(json).not.toContain('correo');
    expect(json).not.toContain('ana@example.com');
  });

  it('keeps telefono in the transformed output', () => {
    const out = transformCenter(CENTER_FIXTURE);
    const json = JSON.stringify(out);
    expect(json).toContain('04241234567');
  });

  it('keeps responsable in the transformed output', () => {
    const out = transformCenter(CENTER_FIXTURE);
    const json = JSON.stringify(out);
    expect(json).toContain('Ana Martínez');
  });
});

// ---------------------------------------------------------------------------
// transformCenter
// ---------------------------------------------------------------------------

describe('transformCenter', () => {
  it('produces a location payload with the expected shape', () => {
    const { location } = transformCenter(CENTER_FIXTURE);
    expect(location.nombre).toBe('Centro de Acopio Las Mercedes');
    expect(location.estado).toBe('Distrito Capital');
    expect(location.ciudad).toBe('Caracas');
    expect(location.lat).toBeCloseTo(10.4806);
    expect(location.lng).toBeCloseTo(-66.8587);
    expect(location.status).toBe('desconocido');
    expect(Array.isArray(location.fotos)).toBe(true);
  });

  it('sets a stable source_ref for idempotency', () => {
    const { sourceRef } = transformCenter(CENTER_FIXTURE);
    expect(sourceRef).toBe('recolecta:c_1782abc');
  });

  it('falls back to parsing lat/lng from maps_url when the record fields are null', () => {
    const center = { ...CENTER_FIXTURE, lat: null, lng: null };
    const { location } = transformCenter(center);
    expect(location.lat).toBeCloseTo(10.4806);
    expect(location.lng).toBeCloseTo(-66.8587);
  });

  it('surfaces the source image_url for re-hosting', () => {
    const { sourceFotoUrl } = transformCenter(CENTER_FIXTURE);
    expect(sourceFotoUrl).toBe(CENTER_FIXTURE.image_url);
  });

  it('returns null sourceFotoUrl when image_url is absent', () => {
    const center = { ...CENTER_FIXTURE, image_url: null };
    const { sourceFotoUrl } = transformCenter(center);
    expect(sourceFotoUrl).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// transformNeed
// ---------------------------------------------------------------------------

describe('transformNeed', () => {
  it('produces a need payload for a given tipo and links it to the center', () => {
    const { need, sourceRef } = transformNeed('c_1782abc', 'Alimentos', CENTER_FIXTURE);
    expect(need.categoria).toBe('alimentos');
    expect(need.urgencia).toBe('alta');
    expect(need.status).toBe('pendiente');
    expect(typeof need.descripcion).toBe('string');
    expect(need.descripcion.length).toBeGreaterThan(0);
    expect(sourceRef).toBe('recolecta:c_1782abc:Alimentos');
  });

  it('maps every tipo to a valid categoria', () => {
    const tipos = ['Alimentos', 'Agua', 'Medicinas', 'Ropa', 'Higiene', 'Pañales', 'Otro'];
    for (const tipo of tipos) {
      const { need } = transformNeed('c_001', tipo, CENTER_FIXTURE);
      expect(typeof need.categoria).toBe('string');
      expect(need.categoria.length).toBeGreaterThan(0);
    }
  });
});
