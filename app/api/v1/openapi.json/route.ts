/**
 * Public API v1: the OpenAPI 3.1 contract document.
 * Served raw (not wrapped in a data envelope) so OpenAPI tooling and the
 * /api-docs page can consume it directly.
 */
import { corsHeaders, handleOptions, withApiError } from '@/lib/api/http';
import { openApiDocument } from '@/lib/api/openapi';

// The contract is static, so serialize it once at module load, not per request.
const OPENAPI_JSON = JSON.stringify(openApiDocument);
const OPENAPI_CACHE = 'public, s-maxage=3600';

export function OPTIONS(): Response {
  return handleOptions();
}

export const GET = withApiError(async (): Promise<Response> => {
  return new Response(OPENAPI_JSON, {
    headers: {
      ...corsHeaders(),
      'Content-Type': 'application/json',
      'Cache-Control': OPENAPI_CACHE,
    },
  });
});
