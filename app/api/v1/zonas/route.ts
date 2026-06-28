/**
 * Public API v1: list affected zones.
 * Read-only, CORS-open, edge-cached. Reuses the same paginated store query as
 * the internal /api/zonas handler but returns the stable public DTO.
 */
import { handleOptions, jsonOk, withApiError } from '@/lib/api/http';
import { parseEnumParam, parsePagination } from '@/lib/api/params';
import { toPublicZona } from '@/lib/api/public-shape';
import { getStore } from '@/lib/data/store';
import { EMERGENCY_STATUSES, NEED_CATEGORIES, URGENCIES } from '@/lib/data/types';
import type { LocationFilters } from '@/lib/data/types';

export function OPTIONS(): Response {
  return handleOptions();
}

export const GET = withApiError(async (request: Request): Promise<Response> => {
  const { searchParams } = new URL(request.url);

  const filters: LocationFilters = {};
  const estado = searchParams.get('estado');
  const ciudad = searchParams.get('ciudad');
  const texto = searchParams.get('texto');
  const status = parseEnumParam(searchParams, 'status', EMERGENCY_STATUSES);
  const categoria = parseEnumParam(searchParams, 'categoria', NEED_CATEGORIES);
  const urgencia = parseEnumParam(searchParams, 'urgencia', URGENCIES);

  if (estado) filters.estado = estado;
  if (ciudad) filters.ciudad = ciudad;
  if (status) filters.status = status;
  if (categoria) filters.categoria = categoria;
  if (urgencia) filters.urgencia = urgencia;
  if (texto) filters.texto = texto;
  if (searchParams.get('soloConPedidos') === 'true') filters.soloConPedidos = true;

  const { cursor, limit } = parsePagination(searchParams);

  const { items, total } = await getStore().listLocationsPage(filters, cursor, limit);
  // Explicit arrow (not `.map(toPublicZona)`): map would pass the index as the
  // includeContacto flag and leak contact on indices > 0. The bulk list never
  // carries reporter contact PII, so this defensive form is intentional.
  const data = items.map((loc) => toPublicZona(loc));
  const nextCursor = cursor + items.length < total ? cursor + items.length : null;

  return jsonOk(data, { pagination: { total, nextCursor } });
});
