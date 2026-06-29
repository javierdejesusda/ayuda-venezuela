/**
 * Pure transforms that map Red H (AVAPRE) relief data onto our schema.
 * Kept side-effect-free so they can be unit tested without any network or
 * database access.
 *
 * Two resource types are imported:
 *   - institutions (hospitals/clinics) -> `locations` rows
 *   - shelters (refugios) -> `locations` rows + `refugio` needs
 *
 * Persons and emergency hotlines are intentionally excluded:
 *   - Persons: living-crisis PII (cedula-searchable), non-negotiable exclusion
 *   - Hotlines: emergency phone lines, out of map scope
 *
 * State normalization: records whose state cannot be mapped to a Venezuelan
 * federal entity are SKIPPED (mapInstitution/mapShelter return null). The
 * importer must check for null and increment skippedNonVE.
 */

export const SOURCE_PREFIX = 'redh';

const ATTRIBUTION = 'Fuente: Red H (AVAPRE) - api-redh.avapre.com';
const MAX_DESCRIPCION = 1000;
const MAX_NOMBRE = 120;
const MAX_CIUDAD = 80;

/** Strip bidi and other unicode control characters from a phone string. */
function cleanPhone(raw) {
  return String(raw ?? '')
    .replace(/[‎‏‪-‮⁦-⁩​-‍﻿]/g, '')
    .trim();
}

function clampNombre(name) {
  let value = String(name ?? '').trim();
  if (value.length > MAX_NOMBRE) value = value.slice(0, MAX_NOMBRE);
  if (value.length < 3) value = 'Institución sin nombre';
  return value;
}

function clampCiudad(city) {
  const value = String(city ?? '').trim().slice(0, MAX_CIUDAD);
  return value.length >= 2 ? value : 'Desconocida';
}

function clampDescripcion(text) {
  const trimmed = text.trim();
  if (!trimmed) return undefined;
  return trimmed.length > MAX_DESCRIPCION ? trimmed.slice(0, MAX_DESCRIPCION) : trimmed;
}

function parseCoord(value) {
  if (value == null) return null;
  const n = parseFloat(String(value));
  return Number.isFinite(n) ? n : null;
}

/** Lowercase, strip combining diacritics, collapse whitespace - for tolerant matching. */
function normalize(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

const STATE_BY_NORM = new Map(
  Object.entries({
    amazonas: 'Amazonas',
    anzoategui: 'Anzoátegui',
    apure: 'Apure',
    aragua: 'Aragua',
    barinas: 'Barinas',
    bolivar: 'Bolívar',
    carabobo: 'Carabobo',
    cojedes: 'Cojedes',
    'delta amacuro': 'Delta Amacuro',
    'distrito capital': 'Distrito Capital',
    'dtto capital': 'Distrito Capital',
    falcon: 'Falcón',
    guarico: 'Guárico',
    'la guaira': 'La Guaira',
    vargas: 'La Guaira',
    lara: 'Lara',
    merida: 'Mérida',
    miranda: 'Miranda',
    monagas: 'Monagas',
    'nueva esparta': 'Nueva Esparta',
    portuguesa: 'Portuguesa',
    sucre: 'Sucre',
    tachira: 'Táchira',
    trujillo: 'Trujillo',
    yaracuy: 'Yaracuy',
    zulia: 'Zulia',
  }),
);

/**
 * Map a source state string to a canonical Venezuelan federal entity name.
 * Returns null when no mapping exists so the importer can skip the record.
 * Records with null/empty/unrecognized state strings are not Venezuela-scoped.
 */
export function normalizeEstado(estado) {
  const key = normalize(estado);
  if (!key) return null;
  return STATE_BY_NORM.get(key) ?? null;
}

const INSTITUTION_TYPE_LABEL = {
  hospital: 'Hospital',
  clinic: 'Clínica',
  other: 'Centro de salud',
};

function institutionTypeLabel(type) {
  return INSTITUTION_TYPE_LABEL[String(type ?? '').toLowerCase()] ?? 'Centro de salud';
}

function buildInstitutionDescripcion(row) {
  const lines = [institutionTypeLabel(row?.type)];

  const opStatus = String(row?.operational_status ?? '').trim();
  if (opStatus && opStatus !== 'unknown') lines.push(`Estado operativo: ${opStatus}`);

  const accepting = row?.accepting_patients;
  lines.push(`Recibe pacientes: ${accepting ? 'sí' : 'no'}`);

  const emergency = row?.emergency_available;
  lines.push(`Emergencias disponibles: ${emergency ? 'sí' : 'no'}`);

  lines.push(ATTRIBUTION);

  return clampDescripcion(lines.join('\n'));
}

function buildShelterNeedDescripcion(row) {
  const lines = ['Refugio de emergencia'];

  const capacity = row?.capacity;
  const available = row?.available_capacity;

  if (capacity != null) lines.push(`Capacidad total: ${capacity}`);
  if (available != null) lines.push(`Capacidad disponible: ${available}`);

  const families = row?.accepts_families;
  lines.push(`Acepta familias: ${families ? 'sí' : 'no'}`);

  const children = row?.accepts_children;
  lines.push(`Acepta niños: ${children ? 'sí' : 'no'}`);

  lines.push(ATTRIBUTION);

  const text = lines.join('\n');
  return text.length > MAX_DESCRIPCION ? text.slice(0, MAX_DESCRIPCION) : text;
}

/** Stable per-institution source_ref for idempotency. */
export function institutionSourceRef(uuid) {
  return `${SOURCE_PREFIX}:inst:${uuid}`;
}

/** Stable per-shelter source_ref for idempotency. */
export function shelterSourceRef(uuid) {
  return `${SOURCE_PREFIX}:shelter:${uuid}`;
}

/** Stable per-shelter need source_ref for idempotency. */
export function shelterNeedSourceRef(uuid) {
  return `${SOURCE_PREFIX}:shelter-need:${uuid}`;
}

/**
 * Transform a source institution row into a `locations` payload.
 * Returns null when the state cannot be mapped to a Venezuelan entity (skip).
 */
export function mapInstitution(row) {
  const estado = normalizeEstado(row?.state);
  if (!estado) return null;

  const rawPhone = cleanPhone(row?.public_phone);
  const contactoTelefono = rawPhone || undefined;

  return {
    location: {
      nombre: clampNombre(row?.official_name),
      estado,
      ciudad: clampCiudad(row?.city),
      zona: undefined,
      status: 'desconocido',
      descripcion: buildInstitutionDescripcion(row),
      contactoNombre: undefined,
      contactoTelefono,
      lat: parseCoord(row?.latitude),
      lng: parseCoord(row?.longitude),
      fotos: [],
    },
    sourceRef: institutionSourceRef(row?.uuid),
  };
}

/**
 * Transform a source shelter row into a `locations` payload and a `refugio`
 * need. Returns null when the state cannot be mapped (skip).
 */
export function mapShelter(row) {
  const estado = normalizeEstado(row?.state);
  if (!estado) return null;

  return {
    location: {
      nombre: clampNombre(row?.name),
      estado,
      ciudad: clampCiudad(row?.city),
      zona: undefined,
      status: 'desconocido',
      descripcion: undefined,
      contactoNombre: undefined,
      contactoTelefono: undefined,
      lat: parseCoord(row?.latitude),
      lng: parseCoord(row?.longitude),
      fotos: [],
    },
    need: {
      categoria: 'refugio',
      urgencia: 'media',
      status: 'pendiente',
      descripcion: buildShelterNeedDescripcion(row),
    },
    sourceRef: shelterSourceRef(row?.uuid),
    needSourceRef: shelterNeedSourceRef(row?.uuid),
  };
}
