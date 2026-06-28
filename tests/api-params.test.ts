import { describe, expect, it } from 'vitest';

import { parseEnumParam, parsePagination, parseUuid } from '@/lib/api/params';
import { EMERGENCY_STATUSES } from '@/lib/data/types';

function params(qs: string): URLSearchParams {
  return new URL(`http://localhost/x${qs}`).searchParams;
}

describe('parsePagination', () => {
  it('defaults to cursor 0 and page size 20 when params are absent', () => {
    expect(parsePagination(params(''))).toEqual({ cursor: 0, limit: 20 });
  });

  it('reads the cursor and clamps negatives to 0', () => {
    expect(parsePagination(params('?cursor=40')).cursor).toBe(40);
    expect(parsePagination(params('?cursor=-5')).cursor).toBe(0);
  });

  it('honors a custom limit but caps it at maxLimit', () => {
    expect(parsePagination(params('?limit=10'), 100).limit).toBe(10);
    expect(parsePagination(params('?limit=500'), 100).limit).toBe(100);
  });

  it('falls back to the default page size for non-positive or invalid limits', () => {
    expect(parsePagination(params('?limit=0')).limit).toBe(20);
    expect(parsePagination(params('?limit=abc')).limit).toBe(20);
  });
});

describe('parseEnumParam', () => {
  it('returns the value when it is in the allowlist', () => {
    expect(parseEnumParam(params('?status=derrumbe'), 'status', EMERGENCY_STATUSES)).toBe('derrumbe');
  });

  it('returns null for a value outside the allowlist', () => {
    expect(parseEnumParam(params('?status=bogus'), 'status', EMERGENCY_STATUSES)).toBeNull();
  });

  it('returns null when the param is absent', () => {
    expect(parseEnumParam(params(''), 'status', EMERGENCY_STATUSES)).toBeNull();
  });
});

describe('parseUuid', () => {
  it('returns the id when it is a valid UUID', () => {
    const id = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';
    expect(parseUuid(id)).toBe(id);
  });

  it('returns null for a malformed id', () => {
    expect(parseUuid('not-a-uuid')).toBeNull();
    expect(parseUuid('123')).toBeNull();
    expect(parseUuid('')).toBeNull();
  });
});
