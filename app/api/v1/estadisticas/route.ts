/**
 * Public API v1: aggregate counts across all zones and needs.
 */
import { handleOptions, jsonOk, withApiError } from '@/lib/api/http';
import { buildPublicStats } from '@/lib/api/public-shape';
import { getStore } from '@/lib/data/store';

export function OPTIONS(): Response {
  return handleOptions();
}

export const GET = withApiError(async (): Promise<Response> => {
  const locations = await getStore().listLocations();
  return jsonOk(buildPublicStats(locations));
});
