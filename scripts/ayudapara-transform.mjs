/**
 * Pure transforms that map ayudaparavenezuela.com data onto our schema.
 * Each collection_center becomes a `locations` row (centro de acopio) plus one
 * `needs` row per supply_type. Each help_point becomes a `locations` row plus
 * one `needs` row per item in its needs array.
 *
 * Side-effect free: no network or database calls.
 *
 * Privacy decisions:
 * - collection_centers: organization phone kept (voluntarily public); stored in
 *   contacto_telefono.
 * - help_points: reporter_name, reporter_contact and photo_url are DROPPED
 *   entirely. The source API already strips reporter_contact and photo_url
 *   from some responses, and we must not republish PII from field reporters.
 *
 * Venezuela filter: records whose country field is not Venezuela, or whose
 * state cannot be normalized to a canonical VE state, return null from
 * mapCenter / mapHelpPoint. Callers count these as skippedNonVE.
 */

export const SOURCE_PREFIX = 'ayudapara';
const MAX_DESCRIPCION = 1000;

/**
 * Build a global RegExp matching the given inclusive code-point ranges.
 * Ranges are pairs of numeric code points; the class is assembled at runtime so
 * the source file stays pure ASCII (no literal control or bidi bytes).
 */
function rangeRegExp(ranges) {
  let cls = '';
  for (const [start, end] of ranges) {
    cls += String.fromCharCode(start);
    if (end !== start) cls += '-' + String.fromCharCode(end);
  }
  return new RegExp('[' + cls + ']', 'g');
}

// Combining diacritical marks (U+0300-U+036F), stripped after NFD normalization.
const COMBINING_MARKS = rangeRegExp([[0x0300, 0x036f]]);

function normalize(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

const STATE_BY_NORM = new Map([
  ['amazonas', 'Amazonas'],
  ['anzoategui', 'Anzoátegui'],
  ['apure', 'Apure'],
  ['aragua', 'Aragua'],
  ['barinas', 'Barinas'],
  ['bolivar', 'Bolívar'],
  ['carabobo', 'Carabobo'],
  ['cojedes', 'Cojedes'],
  ['delta amacuro', 'Delta Amacuro'],
  ['distrito capital', 'Distrito Capital'],
  ['falcon', 'Falcón'],
  ['guarico', 'Guárico'],
  ['la guaira', 'La Guaira'],
  ['vargas', 'La Guaira'],
  ['lara', 'Lara'],
  ['merida', 'Mérida'],
  ['miranda', 'Miranda'],
  ['monagas', 'Monagas'],
  ['nueva esparta', 'Nueva Esparta'],
  ['portuguesa', 'Portuguesa'],
  ['sucre', 'Sucre'],
  ['tachira', 'Táchira'],
  ['trujillo', 'Trujillo'],
  ['yaracuy', 'Yaracuy'],
  ['zulia', 'Zulia'],
]);

/** Resolve a source state string to a canonical VE state name, or null. */
export function normalizeEstado(estado) {
  return STATE_BY_NORM.get(normalize(estado)) ?? null;
}

const SUPPLY_TO_CATEGORY = new Map([
  ['agua', 'agua'],
  ['water', 'agua'],
  ['alimentos', 'alimentos'],
  ['food', 'alimentos'],
  ['medicinas', 'medicinas'],
  ['medicine', 'medicinas'],
  ['ropa', 'ropa'],
  ['clothing', 'ropa'],
  ['higiene', 'higiene'],
  ['bebes', 'otro'],
  ['mascotas', 'otro'],
  ['herramientas', 'herramientas'],
  ['otros', 'otro'],
  ['other', 'otro'],
  ['evacuacion', 'transporte'],
  ['refugio', 'refugio'],
  ['rescate', 'rescate'],
  ['busqueda y rescate', 'rescate'],
  ['equipos especializados', 'herramientas'],
  ['personal de emergencia', 'rescate'],
  ['victimas multiples', 'rescate'],
]);

/** Map a source supply string onto our NeedCategory enum; unknown -> otro. */
export function mapSupplyToCategory(supply) {
  return SUPPLY_TO_CATEGORY.get(normalize(supply ?? '')) ?? 'otro';
}

// Unicode control and bidi formatting code points to strip from phone numbers:
// C0 controls, arabic letter mark, zero-width and directional marks, bidi
// embeddings/overrides, word joiner, bidi isolates, and the BOM.
const PHONE_STRIP = rangeRegExp([
  [0x0000, 0x001f],
  [0x061c, 0x061c],
  [0x200b, 0x200f],
  [0x202a, 0x202e],
  [0x2060, 0x2060],
  [0x2066, 0x2069],
  [0xfeff, 0xfeff],
]);

/** Strip unicode control and bidi formatting characters from a phone string. */
export function cleanPhone(phone) {
  if (phone == null) return null;
  const cleaned = String(phone).replace(PHONE_STRIP, '').trim();
  return cleaned || null;
}

export function centerSourceRef(id) {
  return `${SOURCE_PREFIX}:center:${id}`;
}

export function pointSourceRef(id) {
  return `${SOURCE_PREFIX}:point:${id}`;
}

export function centerNeedSourceRef(id, categoria) {
  return `${SOURCE_PREFIX}:center:${id}:need:${categoria}`;
}

export function pointNeedSourceRef(id, categoria) {
  return `${SOURCE_PREFIX}:point:${id}:need:${categoria}`;
}

function clampNombre(name) {
  let value = String(name ?? '').trim();
  if (value.length > 120) value = value.slice(0, 120);
  if (value.length < 3) value = 'Centro sin nombre';
  return value;
}

function clampCiudad(city) {
  const value = String(city ?? '').trim().slice(0, 80);
  return value.length >= 2 ? value : 'Desconocida';
}

function clampDescripcion(text) {
  const t = String(text ?? '').trim();
  if (!t) return null;
  return t.length > MAX_DESCRIPCION ? t.slice(0, MAX_DESCRIPCION) : t;
}

function sanitizeCoords(lat, lng) {
  if (lat == null || lng == null) return { lat: null, lng: null };
  if (typeof lat !== 'number' || typeof lng !== 'number') return { lat: null, lng: null };
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return { lat: null, lng: null };
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return { lat: null, lng: null };
  return { lat, lng };
}

function buildNeedsFromArray(items, sourceRefFn, id) {
  const seenCategories = new Set();
  const needs = [];
  const needSourceRefs = [];
  for (const item of items) {
    const categoria = mapSupplyToCategory(item);
    if (seenCategories.has(categoria)) continue;
    seenCategories.add(categoria);
    const ref = sourceRefFn(id, categoria);
    needs.push({
      categoria,
      descripcion: String(item || categoria).trim() || categoria,
      urgencia: 'media',
      status: 'pendiente',
    });
    needSourceRefs.push(ref);
  }
  return { needs, needSourceRefs };
}

/**
 * Map a collection_centers row to a location + needs payload.
 * Returns null when the record should be skipped (non-Venezuela or unmappable
 * state); callers count these as skippedNonVE.
 */
export function mapCenter(row) {
  const country = String(row?.country ?? '').trim();
  if (country && normalize(country) !== 'venezuela') return null;

  const estado = normalizeEstado(row?.state);
  if (!estado) return null;

  const { lat, lng } = sanitizeCoords(row?.latitude, row?.longitude);
  const org = String(row?.organization ?? '').trim() || null;
  const schedule = String(row?.schedule ?? '').trim();
  const notes = String(row?.notes ?? '').trim();
  const acceptsVolunteers = row?.accepts_volunteers === true;

  const descParts = [];
  if (org) descParts.push(org);
  if (schedule) descParts.push(`Horario: ${schedule}`);
  if (acceptsVolunteers) descParts.push('Acepta voluntarios.');
  if (notes) descParts.push(notes);
  descParts.push('Fuente: ayudaparavenezuela.com');

  const location = {
    nombre: clampNombre(row?.name),
    estado,
    ciudad: clampCiudad(row?.city),
    lat,
    lng,
    status: 'desconocido',
    acepta_voluntarios: acceptsVolunteers,
    descripcion: clampDescripcion(descParts.join('\n')),
    contactoNombre: org,
    contactoTelefono: cleanPhone(row?.phone),
    fotos: [],
  };

  const supplyTypes = Array.isArray(row?.supply_types) ? row.supply_types : [];
  const { needs, needSourceRefs } = buildNeedsFromArray(supplyTypes, centerNeedSourceRef, row?.id);

  return {
    location,
    needs,
    sourceRef: centerSourceRef(row?.id),
    needSourceRefs,
  };
}

/**
 * Map a help_points row to a location + needs payload.
 * Returns null when the state cannot be mapped to a VE state.
 * Reporter PII (reporter_name, reporter_contact, photo_url) is dropped entirely.
 */
export function mapHelpPoint(row) {
  const estado = normalizeEstado(row?.state);
  if (!estado) return null;

  const { lat, lng } = sanitizeCoords(row?.latitude, row?.longitude);

  const peopleAffected = row?.people_affected;
  const status = String(row?.status ?? '').trim();
  const lastVisitStatus = String(row?.last_visit_status ?? '').trim();
  const notes = String(row?.notes ?? '').trim();

  const descParts = [];
  if (peopleAffected != null && Number.isFinite(Number(peopleAffected))) {
    descParts.push(`Personas afectadas: ${peopleAffected}`);
  }
  if (status) descParts.push(`Situacion: ${status}`);
  if (lastVisitStatus) descParts.push(`Ultima visita: ${lastVisitStatus}`);
  if (notes) descParts.push(notes);
  descParts.push('Fuente: ayudaparavenezuela.com');

  const location = {
    nombre: clampNombre(row?.name),
    estado,
    ciudad: clampCiudad(row?.city),
    lat,
    lng,
    status: 'desconocido',
    acepta_voluntarios: false,
    descripcion: clampDescripcion(descParts.join('\n')),
    contactoNombre: null,
    contactoTelefono: null,
    fotos: [],
  };

  const needsArr = Array.isArray(row?.needs) ? row.needs : [];
  const { needs, needSourceRefs } = buildNeedsFromArray(needsArr, pointNeedSourceRef, row?.id);

  return {
    location,
    needs,
    sourceRef: pointSourceRef(row?.id),
    needSourceRefs,
  };
}
