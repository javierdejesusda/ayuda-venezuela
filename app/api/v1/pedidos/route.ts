/**
 * Public API v1: flat list of relief needs across all zones.
 * Each item carries minimal parent-zone context so a consumer can show a need
 * without a second request. Need-level filters are applied after flattening.
 */
import { handleOptions, jsonOk, withApiError } from '@/lib/api/http';
import { parseEnumParam, parsePagination } from '@/lib/api/params';
import { listPublicPedidos } from '@/lib/api/pedidos';
import { NEED_CATEGORIES, NEED_STATUSES, URGENCIES } from '@/lib/data/types';

export function OPTIONS(): Response {
  return handleOptions();
}

export const GET = withApiError(async (request: Request): Promise<Response> => {
  const { searchParams } = new URL(request.url);

  const estado = searchParams.get('estado');
  const categoria = parseEnumParam(searchParams, 'categoria', NEED_CATEGORIES);
  const urgencia = parseEnumParam(searchParams, 'urgencia', URGENCIES);
  const status = parseEnumParam(searchParams, 'status', NEED_STATUSES);

  const { cursor, limit } = parsePagination(searchParams);

  const { data, total } = await listPublicPedidos(
    { estado: estado ?? undefined, categoria: categoria ?? undefined, urgencia: urgencia ?? undefined, status: status ?? undefined },
    cursor,
    limit,
  );
  const nextCursor = cursor + data.length < total ? cursor + data.length : null;

  return jsonOk(data, { pagination: { total, nextCursor } });
});
