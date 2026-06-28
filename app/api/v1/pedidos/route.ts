/**
 * Public API v1: flat list of relief needs across all zones.
 * Each item carries minimal parent-zone context so a consumer can show a need
 * without a second request. Need-level filters are applied after flattening.
 */
import { handleOptions, jsonOk, withApiError } from '@/lib/api/http';
import { parseEnumParam, parsePagination } from '@/lib/api/params';
import { toPublicPedidoConZona } from '@/lib/api/public-shape';
import { getStore } from '@/lib/data/store';
import { NEED_CATEGORIES, NEED_STATUSES, URGENCIES } from '@/lib/data/types';
import type { LocationFilters, LocationWithNeeds, NeedRecord } from '@/lib/data/types';

export function OPTIONS(): Response {
  return handleOptions();
}

export const GET = withApiError(async (request: Request): Promise<Response> => {
  const { searchParams } = new URL(request.url);

  const filters: LocationFilters = {};
  const estado = searchParams.get('estado');
  if (estado) filters.estado = estado;

  const categoria = parseEnumParam(searchParams, 'categoria', NEED_CATEGORIES);
  const urgencia = parseEnumParam(searchParams, 'urgencia', URGENCIES);
  const status = parseEnumParam(searchParams, 'status', NEED_STATUSES);

  const { cursor, limit } = parsePagination(searchParams);

  const locations = await getStore().listLocations(filters);
  // Collect raw matches first so the DTO is built only for the sliced page.
  const matches: Array<{ loc: LocationWithNeeds; need: NeedRecord }> = [];
  for (const loc of locations) {
    for (const need of loc.needs) {
      if (categoria && need.categoria !== categoria) continue;
      if (urgencia && need.urgencia !== urgencia) continue;
      if (status && need.status !== status) continue;
      matches.push({ loc, need });
    }
  }

  const total = matches.length;
  const page = matches
    .slice(cursor, cursor + limit)
    .map(({ loc, need }) => toPublicPedidoConZona(loc, need));
  const nextCursor = cursor + page.length < total ? cursor + page.length : null;

  return jsonOk(page, { pagination: { total, nextCursor } });
});
