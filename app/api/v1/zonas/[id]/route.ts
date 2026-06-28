/**
 * Public API v1: fetch a single affected zone by id.
 */
import { handleOptions, jsonError, jsonOk, withApiError } from '@/lib/api/http';
import { parseUuid } from '@/lib/api/params';
import { toPublicZona } from '@/lib/api/public-shape';
import { getStore } from '@/lib/data/store';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export function OPTIONS(): Response {
  return handleOptions();
}

export const GET = withApiError(
  async (_request: Request, ctx: RouteContext): Promise<Response> => {
    const { id } = await ctx.params;
    // Reject malformed ids up front so a bad path is a clean 404, not a store 500.
    if (!parseUuid(id)) {
      return jsonError(404, 'not_found', 'Zona no encontrada.');
    }
    const location = await getStore().getLocation(id);
    if (!location) {
      return jsonError(404, 'not_found', 'Zona no encontrada.');
    }
    // Detail endpoint mirrors the web zona page: it includes reporter contacto.
    return jsonOk(toPublicZona(location, true));
  },
);
