/**
 * Public API v1: the full reference rendered as a single Markdown document.
 * Served as text/markdown so a code agent (or a human) can fetch it directly as
 * context. Derived from the same OpenAPI document, so it cannot drift.
 */
import { corsHeaders, handleOptions, withApiError } from '@/lib/api/http';
import { openApiDocument } from '@/lib/api/openapi';
import { openApiToMarkdown } from '@/lib/api/openapi-markdown';
import { SITE_URL } from '@/lib/constants';

// The contract is static, so render the Markdown once at module load. The
// canonical site URL is baked in so every endpoint in the file is directly
// callable, even when the file is downloaded and read offline by an agent.
const OPENAPI_MD = openApiToMarkdown(openApiDocument, SITE_URL);
const OPENAPI_CACHE = 'public, s-maxage=3600';

export function OPTIONS(): Response {
  return handleOptions();
}

export const GET = withApiError(async (): Promise<Response> => {
  return new Response(OPENAPI_MD, {
    headers: {
      ...corsHeaders(),
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': OPENAPI_CACHE,
    },
  });
});
