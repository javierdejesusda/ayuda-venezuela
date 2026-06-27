/**
 * Pure transforms that map recolectavzla.com collection-center data onto our
 * schema: each center becomes a `locations` row and each capped tipo becomes a
 * `needs` row attached to that center's location. Kept side-effect free so
 * they can be unit tested without any network or database.
 *
 * PII decisions (locked by user):
 * - DROP `cedula` and `correo` entirely.
 * - KEEP `telefono` (stored in location contacto_telefono and in descripcion).
 * - KEEP `responsable` (included in descripcion).
 *
 * Tipos over-selection guard: if a center marks more than 4 tipos, cap to 4.
 * Prefer tipos whose keywords appear in the descripcion text; otherwise take
 * the first 4. The caller logs when capping occurs.
 */

const SOURCE_PREFIX = 'recolecta';
const DEFAULT_ESTADO = 'Distrito Capital';
const MAX_TIPOS = 4;
const MAX_DESCRIPCION = 1000;

/** Lowercase, strip accents, collapse whitespace - for tolerant matching. */
function normalize(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

// The 24 federal entities plus the legacy "Vargas" alias for La Guaira.
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
 * Parse the source `estado` field into a canonical estado + ciudad pair.
 * The source uses patterns like "Caracas (Distrito Capital)" where the city
 * precedes and the state is in parentheses, or a plain state string.
 */
export function parseEstadoCiudad(raw) {
  const str = String(raw ?? '').trim();

  // Pattern: "City (State)" - extract both parts.
  const paren = str.match(/^(.+?)\s*\((.+?)\)\s*$/);
  if (paren) {
    const ciudad = paren[1].trim();
    const estadoCanon = STATE_BY_NORM.get(normalize(paren[2]));
    if (estadoCanon) {
      return { estado: estadoCanon, ciudad: ciudad || 'Desconocida' };
    }
  }

  // Try to match the whole string as a plain state name.
  const plain = STATE_BY_NORM.get(normalize(str));
  if (plain) {
    return { estado: plain, ciudad: 'Desconocida' };
  }

  return { estado: DEFAULT_ESTADO, ciudad: 'Desconocida' };
}

/** Keep coordinates only when both are finite and in a valid range. */
export function sanitizeCoords(lat, lng) {
  const ok =
    lat != null &&
    lng != null &&
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180;
  return ok ? { lat, lng } : { lat: null, lng: null };
}

/**
 * Extract lat/lng from a Google Maps URL.
 * Handles:
 * - `?q=lat,lng` or `?query=lat,lng`
 * - `/@lat,lng,zoom` in the path
 */
export function parseCoordsFromMapsUrl(url) {
  const str = String(url ?? '').trim();
  if (!str) return null;

  // ?q=lat,lng or ?query=lat,lng
  const qParam = str.match(/[?&]q(?:uery)?=(-?\d+\.?\d*),(-?\d+\.?\d*)/i);
  if (qParam) {
    const lat = parseFloat(qParam[1]);
    const lng = parseFloat(qParam[2]);
    const c = sanitizeCoords(lat, lng);
    if (c.lat !== null) return c;
  }

  // /@lat,lng,zoom in the path (Google Maps embedded/share URLs)
  const atSign = str.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (atSign) {
    const lat = parseFloat(atSign[1]);
    const lng = parseFloat(atSign[2]);
    const c = sanitizeCoords(lat, lng);
    if (c.lat !== null) return c;
  }

  return null;
}

// Keyword stems per tipo - used for descripcion-based capping decisions.
const TIPO_KEYWORDS = new Map([
  ['alimentos', ['alimento', 'comida', 'vivere', 'viveres', 'despensa', 'cesta', 'harina']],
  ['agua', ['agua', 'hidratacion']],
  ['medicinas', ['medicin', 'medicament', 'pastilla', 'farmaci', 'botiquin']],
  ['ropa', ['ropa', 'vestiment', 'calzado', 'zapato']],
  ['higiene', ['higiene', 'jabon', 'desinfectant', 'toalla', 'panal', 'higienico']],
  ['panales', ['panal', 'bebe', 'lactante']],
  ['herramientas', ['herramienta', 'pala', 'pico', 'escombro']],
  ['dinero', ['dinero', 'monetari', 'economic', 'aporte', 'donacion economica']],
  ['otro', []],
]);

/** True if any keyword stem for `tipo` appears in the normalized description. */
function tipoMatchesDescripcion(tipo, normDesc) {
  const stems = TIPO_KEYWORDS.get(normalize(tipo)) ?? [];
  return stems.some((stem) => normDesc.includes(stem));
}

/**
 * Cap `tipos` to MAX_TIPOS entries. When there are more than 4:
 * - Prefer tipos whose keywords appear in the `descripcion` text.
 * - Fill remaining slots with the original order.
 * Returns `{ capped, wasCapped, original }`.
 */
export function capTipos(tipos, descripcion) {
  const arr = Array.isArray(tipos) ? tipos : [];
  if (arr.length <= MAX_TIPOS) {
    return { capped: arr.slice(), wasCapped: false, original: arr.slice() };
  }

  const normDesc = normalize(descripcion ?? '');
  const matched = arr.filter((t) => tipoMatchesDescripcion(t, normDesc));
  const unmatched = arr.filter((t) => !tipoMatchesDescripcion(t, normDesc));

  // Fill up to MAX_TIPOS: keyword matches first, then unmatched in original order.
  const capped = [...matched, ...unmatched].slice(0, MAX_TIPOS);
  return { capped, wasCapped: true, original: arr.slice() };
}

// Explicit tipo -> categoria mapping per user spec.
// Pañales and Dinero have no native schema category; everything else maps faithfully.
const TIPO_TO_CATEGORIA = new Map([
  ['alimentos', 'alimentos'],
  ['agua', 'agua'],
  ['medicinas', 'medicinas'],
  ['ropa', 'ropa'],
  ['higiene', 'higiene'],
  ['herramientas', 'herramientas'],
  ['panales', 'otro'],
  ['dinero', 'otro'],
  ['otro', 'otro'],
]);

/** Map a source tipo string onto our NeedCategory enum, defaulting to otro. */
export function mapTipoToCategoria(tipo) {
  return TIPO_TO_CATEGORIA.get(normalize(tipo ?? '')) ?? 'otro';
}

const URGENCIA_MAP = new Map([
  ['alta', 'alta'],
  ['media', 'media'],
  ['baja', 'baja'],
]);

/** Map the source urgencia onto our Urgency enum; defaults to media. */
export function mapUrgencia(urgencia) {
  return URGENCIA_MAP.get(normalize(urgencia ?? '')) ?? 'media';
}

function clampNombre(name) {
  let value = String(name ?? '').trim();
  if (value.length > 120) value = value.slice(0, 120);
  if (value.length < 3) value = 'Centro sin nombre';
  return value;
}

/**
 * Build the public description for a center from its own fields.
 * Includes: nombre, descripcion, Horario, Responsable, Telefono.
 * Drops cedula and correo entirely (PII).
 */
export function buildDescripcion(center) {
  const parts = [];

  const nombre = String(center?.nombre ?? '').trim();
  if (nombre) parts.push(nombre);

  const desc = String(center?.descripcion ?? '').trim();
  if (desc) parts.push(desc);

  const horario = String(center?.horario ?? '').trim();
  if (horario) parts.push(`Horario: ${horario}`);

  const responsable = String(center?.responsable ?? '').trim();
  if (responsable) parts.push(`Responsable: ${responsable}`);

  const telefono = String(center?.telefono ?? '').trim();
  if (telefono) parts.push(`Telefono: ${telefono}`);

  const text = parts.join('\n').trim();
  return text.length > MAX_DESCRIPCION ? text.slice(0, MAX_DESCRIPCION) : text;
}

/** Stable per-center source_ref used for idempotency. */
export function centerSourceRef(id) {
  return `${SOURCE_PREFIX}:${id}`;
}

/** Stable per-need source_ref: center id + tipo slug. */
export function needSourceRef(centerId, tipo) {
  return `${SOURCE_PREFIX}:${centerId}:${tipo}`;
}

/**
 * Transform a source center into a `locations` payload, a stable source_ref,
 * the source image_url to be re-hosted (or null), and a capTipos result for
 * the caller to use when inserting needs and logging.
 *
 * PII contract: cedula and correo are never present in the output.
 */
export function transformCenter(center) {
  const { estado, ciudad } = parseEstadoCiudad(center?.estado);

  // Coordinates: prefer record fields, fall back to maps_url.
  let coords = sanitizeCoords(center?.lat, center?.lng);
  if (coords.lat === null && center?.maps_url) {
    coords = parseCoordsFromMapsUrl(center.maps_url) ?? { lat: null, lng: null };
  }

  const tiposResult = capTipos(
    Array.isArray(center?.tipos) ? center.tipos : [],
    center?.descripcion ?? '',
  );

  const imageUrl = String(center?.image_url ?? '').trim() || null;

  return {
    location: {
      nombre: clampNombre(center?.nombre),
      estado,
      ciudad,
      zona: null,
      lat: coords.lat,
      lng: coords.lng,
      status: 'desconocido',
      descripcion: buildDescripcion(center) || null,
      contacto_nombre: String(center?.responsable ?? '').trim() || null,
      contacto_telefono: String(center?.telefono ?? '').trim() || null,
      fotos: [],
    },
    sourceRef: centerSourceRef(center?.id),
    sourceFotoUrl: imageUrl,
    tiposResult,
  };
}

/**
 * Transform a single (centerId, tipo) pair into a `needs` payload plus a
 * stable source_ref. The runner links it to the center's imported location.
 */
export function transformNeed(centerId, tipo, center) {
  const nombre = String(center?.nombre ?? '').trim();
  const descripcion = `${nombre ? nombre + ': ' : ''}${tipo}`.trim() || tipo;

  return {
    need: {
      categoria: mapTipoToCategoria(tipo),
      descripcion: descripcion.length > MAX_DESCRIPCION ? descripcion.slice(0, MAX_DESCRIPCION) : descripcion,
      urgencia: mapUrgencia(center?.urgencia),
      status: 'pendiente',
    },
    sourceRef: needSourceRef(centerId, tipo),
  };
}

export { SOURCE_PREFIX, MAX_TIPOS };
