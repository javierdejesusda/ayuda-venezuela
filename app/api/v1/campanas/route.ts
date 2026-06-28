/**
 * Public API v1: list fundraising campaigns.
 */
import { handleOptions, jsonOk, withApiError } from '@/lib/api/http';
import { toPublicCampana } from '@/lib/api/public-shape';
import { getStore } from '@/lib/data/store';

export function OPTIONS(): Response {
  return handleOptions();
}

export const GET = withApiError(async (): Promise<Response> => {
  const campanas = (await getStore().listFundraisers()).map(toPublicCampana);
  return jsonOk(campanas, { pagination: { total: campanas.length, nextCursor: null } });
});
