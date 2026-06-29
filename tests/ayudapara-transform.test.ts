import { describe, expect, it } from 'vitest';

import {
  SOURCE_PREFIX,
  centerNeedSourceRef,
  centerSourceRef,
  cleanPhone,
  mapCenter,
  mapHelpPoint,
  mapSupplyToCategory,
  normalizeEstado,
  pointNeedSourceRef,
  pointSourceRef,
} from '../scripts/ayudapara-transform.mjs';

// ---------------------------------------------------------------------------
// Fixtures (subset from the source data, safe to commit)
// ---------------------------------------------------------------------------

const CENTER_VE = {
  id: 'cc552e80-6180-4f6a-a28b-123003808939',
  name: 'Centro de Acopio Naguanagua',
  organization: 'Operacion Todos con VZLA',
  address: 'Semaforo de la Av. Universidad c/c Av. 190.',
  state: 'Carabobo',
  city: 'Naguanagua',
  latitude: 10.2469,
  longitude: -68.0086,
  phone: '+58 424-4643901',
  schedule: 'Jueves 25 y viernes 26 de junio, 3:00 pm a 6:30 pm',
  supply_types: ['agua', 'alimentos', 'medicinas', 'ropa'],
  accepts_volunteers: false,
  notes: 'Verificado.',
  is_active: true,
  country: 'Venezuela',
};

const CENTER_VE_VOLUNTEERS = {
  id: 'de951174-82ab-4bdb-ae7f-01d3355ce32e',
  name: 'Iglesia Vivir en Fe',
  organization: 'Vivir en Fe Church',
  address: 'Iglesia Vivir en Fe, Valencia',
  state: 'Carabobo',
  city: 'Valencia',
  latitude: 10.162,
  longitude: -68.0077,
  phone: null,
  schedule: null,
  supply_types: ['alimentos', 'agua', 'higiene', 'ropa', 'medicinas'],
  accepts_volunteers: true,
  notes: null,
  is_active: true,
  country: 'Venezuela',
};

const CENTER_COLOMBIA = {
  id: '05dbc4c5-1a4f-4693-b9dd-310774c59b62',
  name: 'Fundacion Juntos Se Puede - Cedritos',
  organization: 'Juntos Se Puede',
  state: 'Bogota',
  city: 'Bogota',
  latitude: 4.7,
  longitude: -74.0,
  supply_types: ['agua', 'alimentos'],
  accepts_volunteers: false,
  country: 'Colombia',
};

const CENTER_MIXED_SUPPLY = {
  id: 'e6b60add-0a50-406e-bc0f-7700d607aea3',
  name: 'Plaza El Rectorado',
  organization: 'Estudiantes UCV',
  state: 'Distrito Capital',
  city: 'Caracas',
  latitude: 10.49,
  longitude: -66.89,
  phone: null,
  schedule: null,
  supply_types: ['agua', 'ropa', 'bebes', 'mascotas', 'higiene', 'alimentos', 'medicinas', 'herramientas', 'otros'],
  accepts_volunteers: false,
  notes: null,
  country: 'Venezuela',
};

const HELP_POINT_BASIC = {
  id: 'a9aed8e4-07f1-46d9-809c-07af8c4eb5c9',
  name: 'Iglesia San Bernardino de Siena',
  address: 'G37X+H86, Caracas 1011, Capital District, Venezuela',
  state: 'Distrito Capital',
  city: 'Caracas',
  latitude: 10.5139151,
  longitude: -66.9017189,
  needs: ['higiene', 'ropa'],
  status: 'urgent',
  people_affected: null,
  notes: null,
  reporter_name: 'Publicado por Cristian Onorato',
  reporter_contact: null,
  photo_url: null,
  visit_count: 0,
  last_visit_status: null,
  last_visit_at: null,
  is_active: true,
};

const HELP_POINT_FULL = {
  id: '7dabc9d0-f796-41b5-8db9-ee0e3b89c42b',
  name: 'La Mar Suites, Tucacas, Carabobo',
  address: 'Residencias la mar suites, QM8G+G45, Tucacas 2055, Falcon, Venezuela',
  state: 'Falcón',
  city: 'Tucacas',
  latitude: 10.7662519,
  longitude: -68.3246265,
  needs: ['evacuacion', 'herramientas', 'otros'],
  status: 'urgent',
  people_affected: 12,
  notes: 'Se necesitan equipos de rescate',
  reporter_name: 'Ricardo Osio',
  reporter_contact: '04241111111',
  photo_url: 'help-xyz.jpg',
  visit_count: 0,
  last_visit_status: null,
  last_visit_at: null,
  is_active: true,
};

// ---------------------------------------------------------------------------
// SOURCE_PREFIX
// ---------------------------------------------------------------------------

describe('SOURCE_PREFIX', () => {
  it('is "ayudapara"', () => {
    expect(SOURCE_PREFIX).toBe('ayudapara');
  });
});

// ---------------------------------------------------------------------------
// Source ref helpers
// ---------------------------------------------------------------------------

describe('centerSourceRef', () => {
  it('builds ayudapara:center:<id>', () => {
    expect(centerSourceRef('abc-123')).toBe('ayudapara:center:abc-123');
  });
});

describe('pointSourceRef', () => {
  it('builds ayudapara:point:<id>', () => {
    expect(pointSourceRef('xyz-456')).toBe('ayudapara:point:xyz-456');
  });
});

describe('centerNeedSourceRef', () => {
  it('builds ayudapara:center:<id>:need:<categoria>', () => {
    expect(centerNeedSourceRef('abc-123', 'agua')).toBe('ayudapara:center:abc-123:need:agua');
  });
});

describe('pointNeedSourceRef', () => {
  it('builds ayudapara:point:<id>:need:<categoria>', () => {
    expect(pointNeedSourceRef('xyz-456', 'medicinas')).toBe('ayudapara:point:xyz-456:need:medicinas');
  });
});

// ---------------------------------------------------------------------------
// normalizeEstado
// ---------------------------------------------------------------------------

describe('normalizeEstado', () => {
  it('resolves canonical state names', () => {
    expect(normalizeEstado('Carabobo')).toBe('Carabobo');
    expect(normalizeEstado('Distrito Capital')).toBe('Distrito Capital');
    expect(normalizeEstado('Zulia')).toBe('Zulia');
  });

  it('handles accented source strings', () => {
    expect(normalizeEstado('Falcón')).toBe('Falcón');
    expect(normalizeEstado('Mérida')).toBe('Mérida');
    expect(normalizeEstado('Táchira')).toBe('Táchira');
    expect(normalizeEstado('Bolívar')).toBe('Bolívar');
    expect(normalizeEstado('Anzoátegui')).toBe('Anzoátegui');
    expect(normalizeEstado('La Guaira')).toBe('La Guaira');
  });

  it('maps the legacy Vargas alias to La Guaira', () => {
    expect(normalizeEstado('Vargas')).toBe('La Guaira');
  });

  it('is case-insensitive and accent-tolerant', () => {
    expect(normalizeEstado('CARABOBO')).toBe('Carabobo');
    expect(normalizeEstado('miranda')).toBe('Miranda');
  });

  it('returns null for unmappable strings (non-VE states)', () => {
    expect(normalizeEstado('Bogota')).toBeNull();
    expect(normalizeEstado('Madrid')).toBeNull();
    expect(normalizeEstado('')).toBeNull();
    expect(normalizeEstado(null)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// mapSupplyToCategory
// ---------------------------------------------------------------------------

describe('mapSupplyToCategory', () => {
  it('maps Spanish supply strings to the correct NeedCategory', () => {
    expect(mapSupplyToCategory('agua')).toBe('agua');
    expect(mapSupplyToCategory('alimentos')).toBe('alimentos');
    expect(mapSupplyToCategory('medicinas')).toBe('medicinas');
    expect(mapSupplyToCategory('ropa')).toBe('ropa');
    expect(mapSupplyToCategory('higiene')).toBe('higiene');
    expect(mapSupplyToCategory('herramientas')).toBe('herramientas');
    expect(mapSupplyToCategory('refugio')).toBe('refugio');
  });

  it('maps English supply strings (some centers use English)', () => {
    expect(mapSupplyToCategory('water')).toBe('agua');
    expect(mapSupplyToCategory('food')).toBe('alimentos');
    expect(mapSupplyToCategory('medicine')).toBe('medicinas');
    expect(mapSupplyToCategory('clothing')).toBe('ropa');
    expect(mapSupplyToCategory('other')).toBe('otro');
  });

  it('maps bebes and mascotas to otro (no dedicated category)', () => {
    expect(mapSupplyToCategory('bebes')).toBe('otro');
    expect(mapSupplyToCategory('mascotas')).toBe('otro');
  });

  it('maps otros to otro', () => {
    expect(mapSupplyToCategory('otros')).toBe('otro');
  });

  it('maps emergency/rescue needs', () => {
    expect(mapSupplyToCategory('evacuacion')).toBe('transporte');
    expect(mapSupplyToCategory('Búsqueda y rescate')).toBe('rescate');
    expect(mapSupplyToCategory('Equipos especializados')).toBe('herramientas');
    expect(mapSupplyToCategory('Personal de emergencia')).toBe('rescate');
  });

  it('falls back to otro for unrecognized strings', () => {
    expect(mapSupplyToCategory('gasolina')).toBe('otro');
    expect(mapSupplyToCategory('')).toBe('otro');
    expect(mapSupplyToCategory(null)).toBe('otro');
  });

  it('is case-insensitive', () => {
    expect(mapSupplyToCategory('AGUA')).toBe('agua');
    expect(mapSupplyToCategory('Alimentos')).toBe('alimentos');
  });
});

// ---------------------------------------------------------------------------
// cleanPhone
// ---------------------------------------------------------------------------

describe('cleanPhone', () => {
  it('returns a visible phone string unchanged', () => {
    expect(cleanPhone('+58 424-4643901')).toBe('+58 424-4643901');
    expect(cleanPhone('0251-7130500')).toBe('0251-7130500');
  });

  it('strips unicode bidi and control characters', () => {
    const rlm = String.fromCodePoint(0x200f);
    const lre = String.fromCodePoint(0x202a);
    const withBidi = `+58${rlm}424-1234567${lre}`;
    expect(cleanPhone(withBidi)).toBe('+58424-1234567');
  });

  it('strips the arabic letter mark (U+061C)', () => {
    const alm = String.fromCodePoint(0x061c);
    expect(cleanPhone(`+58${alm}424-1234567`)).toBe('+58424-1234567');
  });

  it('strips bidi isolates (U+2066-U+2069)', () => {
    const lri = String.fromCodePoint(0x2066);
    const rli = String.fromCodePoint(0x2067);
    const fsi = String.fromCodePoint(0x2068);
    const pdi = String.fromCodePoint(0x2069);
    expect(cleanPhone(`${lri}+58${rli}424${fsi}-1234567${pdi}`)).toBe('+58424-1234567');
  });

  it('strips a NUL byte and other C0 controls', () => {
    const nul = String.fromCodePoint(0x0000);
    const bom = String.fromCodePoint(0xfeff);
    expect(cleanPhone(`+58${nul}424${bom}-1234567`)).toBe('+58424-1234567');
  });

  it('returns null when phone is null', () => {
    expect(cleanPhone(null)).toBeNull();
  });

  it('returns null for an empty or whitespace-only string', () => {
    expect(cleanPhone('')).toBeNull();
    expect(cleanPhone('   ')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// mapCenter - Venezuela skip logic
// ---------------------------------------------------------------------------

describe('mapCenter - non-Venezuela skip', () => {
  it('returns null for a Colombia center', () => {
    expect(mapCenter(CENTER_COLOMBIA)).toBeNull();
  });

  it('returns null when country is set but not Venezuela', () => {
    expect(mapCenter({ ...CENTER_VE, country: 'Espana' })).toBeNull();
  });

  it('returns null when state cannot be normalized to a VE state', () => {
    expect(mapCenter({ ...CENTER_VE, country: 'Venezuela', state: 'Bogota' })).toBeNull();
  });

  it('returns a result for a Venezuela center', () => {
    expect(mapCenter(CENTER_VE)).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// mapCenter - location shape
// ---------------------------------------------------------------------------

describe('mapCenter - location shape', () => {
  it('maps the core fields correctly', () => {
    const result = mapCenter(CENTER_VE);
    expect(result).not.toBeNull();
    const { location } = result!;
    expect(location.nombre).toBe('Centro de Acopio Naguanagua');
    expect(location.estado).toBe('Carabobo');
    expect(location.ciudad).toBe('Naguanagua');
    expect(location.lat).toBeCloseTo(10.2469);
    expect(location.lng).toBeCloseTo(-68.0086);
    expect(location.status).toBe('desconocido');
  });

  it('sets contactoNombre from organization and contactoTelefono from phone', () => {
    const result = mapCenter(CENTER_VE)!;
    expect(result.location.contactoNombre).toBe('Operacion Todos con VZLA');
    expect(result.location.contactoTelefono).toBe('+58 424-4643901');
  });

  it('sets fotos to an empty array', () => {
    expect(mapCenter(CENTER_VE)!.location.fotos).toEqual([]);
  });

  it('sets contactoNombre to null when organization is absent', () => {
    const result = mapCenter({ ...CENTER_VE, organization: null })!;
    expect(result.location.contactoNombre).toBeNull();
  });

  it('sets contactoTelefono to null when phone is absent', () => {
    const result = mapCenter({ ...CENTER_VE, phone: null })!;
    expect(result.location.contactoTelefono).toBeNull();
  });

  it('includes organization, schedule and attribution in descripcion', () => {
    const result = mapCenter(CENTER_VE)!;
    const { descripcion } = result.location;
    expect(descripcion).toContain('Operacion Todos con VZLA');
    expect(descripcion).toContain('Jueves 25 y viernes 26');
    expect(descripcion).toContain('Fuente: ayudaparavenezuela.com');
  });

  it('includes "Acepta voluntarios." in descripcion when accepts_volunteers is true', () => {
    const result = mapCenter(CENTER_VE_VOLUNTEERS)!;
    expect(result.location.descripcion).toContain('Acepta voluntarios.');
  });

  it('does not include volunteer text when accepts_volunteers is false', () => {
    const result = mapCenter(CENTER_VE)!;
    expect(result.location.descripcion).not.toContain('Acepta voluntarios.');
  });

  it('sets acepta_voluntarios true when source accepts_volunteers is true', () => {
    const result = mapCenter(CENTER_VE_VOLUNTEERS)!;
    expect(result.location.acepta_voluntarios).toBe(true);
  });

  it('sets acepta_voluntarios false when source accepts_volunteers is false', () => {
    const result = mapCenter(CENTER_VE)!;
    expect(result.location.acepta_voluntarios).toBe(false);
  });

  it('sets acepta_voluntarios false when accepts_volunteers is absent', () => {
    const result = mapCenter({ ...CENTER_VE, accepts_volunteers: undefined })!;
    expect(result.location.acepta_voluntarios).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// mapCenter - source_ref
// ---------------------------------------------------------------------------

describe('mapCenter - source refs', () => {
  it('sets sourceRef as ayudapara:center:<id>', () => {
    const result = mapCenter(CENTER_VE)!;
    expect(result.sourceRef).toBe('ayudapara:center:cc552e80-6180-4f6a-a28b-123003808939');
  });

  it('generates one need per unique supply category', () => {
    const result = mapCenter(CENTER_VE)!;
    expect(result.needs).toHaveLength(4);
    const cats = result.needs.map((n) => n.categoria);
    expect(cats).toContain('agua');
    expect(cats).toContain('alimentos');
    expect(cats).toContain('medicinas');
    expect(cats).toContain('ropa');
  });

  it('deduplicates needs when multiple supply_types map to the same categoria', () => {
    const result = mapCenter(CENTER_MIXED_SUPPLY)!;
    const cats = result.needs.map((n) => n.categoria);
    const unique = new Set(cats);
    expect(cats.length).toBe(unique.size);
  });

  it('sets correct need source_refs', () => {
    const result = mapCenter(CENTER_VE)!;
    const id = CENTER_VE.id;
    expect(result.needSourceRefs).toContain(`ayudapara:center:${id}:need:agua`);
    expect(result.needSourceRefs).toContain(`ayudapara:center:${id}:need:alimentos`);
  });

  it('sets urgencia media and status pendiente on each need', () => {
    const result = mapCenter(CENTER_VE)!;
    for (const need of result.needs) {
      expect(need.urgencia).toBe('media');
      expect(need.status).toBe('pendiente');
    }
  });
});

// ---------------------------------------------------------------------------
// mapHelpPoint - PII drop (CRITICAL)
// ---------------------------------------------------------------------------

describe('mapHelpPoint - PII drop', () => {
  it('sets contactoNombre to null (reporter_name is PII)', () => {
    const result = mapHelpPoint(HELP_POINT_FULL)!;
    expect(result.location.contactoNombre).toBeNull();
  });

  it('sets contactoTelefono to null (reporter_contact is PII)', () => {
    const result = mapHelpPoint(HELP_POINT_FULL)!;
    expect(result.location.contactoTelefono).toBeNull();
  });

  it('sets fotos to empty array (photo_url is PII-adjacent)', () => {
    const result = mapHelpPoint(HELP_POINT_FULL)!;
    expect(result.location.fotos).toEqual([]);
  });

  it('does not include reporter_name in descripcion or any field', () => {
    const result = mapHelpPoint(HELP_POINT_FULL)!;
    const json = JSON.stringify(result);
    expect(json).not.toContain('Ricardo Osio');
    expect(json).not.toContain('reporter_name');
  });

  it('does not include reporter_contact anywhere', () => {
    const result = mapHelpPoint(HELP_POINT_FULL)!;
    const json = JSON.stringify(result);
    expect(json).not.toContain('04241111111');
    expect(json).not.toContain('reporter_contact');
  });

  it('does not include photo_url anywhere', () => {
    const result = mapHelpPoint(HELP_POINT_FULL)!;
    const json = JSON.stringify(result);
    expect(json).not.toContain('help-xyz.jpg');
    expect(json).not.toContain('photo_url');
  });
});

// ---------------------------------------------------------------------------
// mapHelpPoint - location shape
// ---------------------------------------------------------------------------

describe('mapHelpPoint - location shape', () => {
  it('maps core fields correctly', () => {
    const result = mapHelpPoint(HELP_POINT_BASIC)!;
    expect(result.location.nombre).toBe('Iglesia San Bernardino de Siena');
    expect(result.location.estado).toBe('Distrito Capital');
    expect(result.location.ciudad).toBe('Caracas');
    expect(result.location.lat).toBeCloseTo(10.5139151);
    expect(result.location.lng).toBeCloseTo(-66.9017189);
    expect(result.location.status).toBe('desconocido');
  });

  it('includes people_affected in descripcion when set', () => {
    const result = mapHelpPoint(HELP_POINT_FULL)!;
    expect(result.location.descripcion).toContain('Personas afectadas: 12');
  });

  it('includes source attribution', () => {
    const result = mapHelpPoint(HELP_POINT_BASIC)!;
    expect(result.location.descripcion).toContain('Fuente: ayudaparavenezuela.com');
  });

  it('sets sourceRef as ayudapara:point:<id>', () => {
    const result = mapHelpPoint(HELP_POINT_BASIC)!;
    expect(result.sourceRef).toBe('ayudapara:point:a9aed8e4-07f1-46d9-809c-07af8c4eb5c9');
  });

  it('maps needs array to NeedCategory and generates correct source refs', () => {
    const result = mapHelpPoint(HELP_POINT_BASIC)!;
    const id = HELP_POINT_BASIC.id;
    const cats = result.needs.map((n) => n.categoria);
    expect(cats).toContain('higiene');
    expect(cats).toContain('ropa');
    expect(result.needSourceRefs).toContain(`ayudapara:point:${id}:need:higiene`);
    expect(result.needSourceRefs).toContain(`ayudapara:point:${id}:need:ropa`);
  });

  it('returns null when state cannot be mapped to a VE state', () => {
    expect(mapHelpPoint({ ...HELP_POINT_BASIC, state: 'UnknownState' })).toBeNull();
  });

  it('sets acepta_voluntarios false (help points have no volunteer flag)', () => {
    const result = mapHelpPoint(HELP_POINT_FULL)!;
    expect(result.location.acepta_voluntarios).toBe(false);
  });
});
