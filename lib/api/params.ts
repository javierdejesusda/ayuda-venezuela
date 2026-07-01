/**
 * Query-parameter parsing helpers shared by the public API v1 routes.
 * Pure and framework-free: each takes URLSearchParams (or a raw id) and returns
 * a validated value, so the route handlers stay declarative.
 */
import { PAGE_SIZE } from '@/lib/data/types';

/** Default cap on page size when a route does not pass its own. */
const DEFAULT_MAX_LIMIT = 100;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Clamps a raw cursor/limit pair to safe bounds: `cursor` floors at 0; `limit`
 * defaults to PAGE_SIZE, must be positive, and is capped at `maxLimit`. Shared
 * by `parsePagination` (query strings) and any caller that already has numeric
 * values, e.g. the MCP tools in `app/api/mcp/route.ts`.
 */
export function clampPagination(
  cursor: number | undefined,
  limit: number | undefined,
  maxLimit: number = DEFAULT_MAX_LIMIT,
): { cursor: number; limit: number } {
  const safeCursor = Math.max(0, cursor && Number.isFinite(cursor) ? cursor : 0);
  const safeLimit =
    limit != null && Number.isFinite(limit) && limit > 0 ? Math.min(limit, maxLimit) : PAGE_SIZE;
  return { cursor: safeCursor, limit: safeLimit };
}

/**
 * Reads `cursor` and `limit` from the query string and clamps them via
 * `clampPagination`.
 */
export function parsePagination(
  searchParams: URLSearchParams,
  maxLimit: number = DEFAULT_MAX_LIMIT,
): { cursor: number; limit: number } {
  const cursor = parseInt(searchParams.get('cursor') ?? '0', 10);
  const limit = parseInt(searchParams.get('limit') ?? '', 10);
  return clampPagination(cursor, limit, maxLimit);
}

/** Returns the query value for `key` when it is in `allowlist`, else null. */
export function parseEnumParam<T extends string>(
  searchParams: URLSearchParams,
  key: string,
  allowlist: readonly T[],
): T | null {
  const value = searchParams.get(key);
  return value && (allowlist as readonly string[]).includes(value) ? (value as T) : null;
}

/** Returns `id` when it is a well-formed UUID, else null. */
export function parseUuid(id: string): string | null {
  return UUID_RE.test(id) ? id : null;
}
