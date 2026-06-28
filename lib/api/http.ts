/**
 * Shared HTTP helpers for the public REST API (v1).
 *
 * Centralizes the CORS policy, the success/error envelopes and the edge-cache
 * header so every route handler stays thin and consistent. The API is public
 * and read-only, so any origin may call it but only GET/OPTIONS are allowed.
 */

const ALLOW_ORIGIN = '*';
const ALLOW_METHODS = 'GET, OPTIONS';
const ALLOW_HEADERS = 'Content-Type';

/**
 * Edge cache directive for successful reads. Vercel's CDN serves cached copies
 * for 30s and revalidates in the background for another 60s, so scraping and
 * traffic spikes hit the CDN instead of Supabase.
 */
const CACHE_CONTROL = 'public, s-maxage=30, stale-while-revalidate=60';

/** Returns a fresh copy of the CORS headers so callers never mutate shared state. */
export function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': ALLOW_ORIGIN,
    'Access-Control-Allow-Methods': ALLOW_METHODS,
    'Access-Control-Allow-Headers': ALLOW_HEADERS,
  };
}

/** Successful read: `{ data, ...extra }` with CORS and edge-cache headers. */
export function jsonOk(data: unknown, extra?: Record<string, unknown>): Response {
  return Response.json(
    { data, ...extra },
    { headers: { ...corsHeaders(), 'Cache-Control': CACHE_CONTROL } },
  );
}

/** Error: `{ error: { code, message } }`. Never cached, never leaks internals. */
export function jsonError(status: number, code: string, message: string): Response {
  return Response.json({ error: { code, message } }, { status, headers: corsHeaders() });
}

/** Answers a CORS preflight request. */
export function handleOptions(): Response {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

/**
 * Wraps a route handler so any thrown error (e.g. a Supabase outage) becomes a
 * 500 response that still carries the CORS headers and the documented error
 * envelope. The raw error is never exposed to the client; it is swallowed here
 * and should be observed through platform logs instead.
 */
export function withApiError<A extends unknown[]>(
  handler: (...args: A) => Promise<Response>,
): (...args: A) => Promise<Response> {
  return async (...args: A): Promise<Response> => {
    try {
      return await handler(...args);
    } catch {
      return jsonError(500, 'internal_error', 'Error interno.');
    }
  };
}
