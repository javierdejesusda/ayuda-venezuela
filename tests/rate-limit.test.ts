import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createMemoryStore } from '@/lib/data/memory-store';

const { createLocation, checkReportQuota, getHeader } = vi.hoisted(() => ({
  createLocation: vi.fn(),
  checkReportQuota: vi.fn(),
  getHeader: vi.fn(),
}));

vi.mock('@/lib/data/store', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/data/store')>();
  return {
    ...actual,
    getStore: () => ({ createLocation, checkReportQuota }),
  };
});
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/headers', () => ({
  headers: () => ({ get: getHeader }),
}));

import { REPORT_QUOTA_LIMIT, REPORT_QUOTA_WINDOW_MS } from '@/lib/data/store';
import { createLocationAction } from '@/app/actions';

const VALID_LOCATION = {
  nombre: 'Edificio San Bernardino',
  estado: 'Distrito Capital',
  ciudad: 'Caracas',
  status: 'derrumbe' as const,
};

describe('memory store checkReportQuota', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('allows the first REPORT_QUOTA_LIMIT calls then blocks the next within window', async () => {
    const store = createMemoryStore({ locations: [], needs: [] });
    const key = 'test-key-hash-abc123';
    for (let i = 0; i < REPORT_QUOTA_LIMIT; i++) {
      expect(await store.checkReportQuota(key)).toBe(true);
    }
    expect(await store.checkReportQuota(key)).toBe(false);
  });

  it('allows again after the quota window expires', async () => {
    const store = createMemoryStore({ locations: [], needs: [] });
    const key = 'test-key-hash-abc123';
    for (let i = 0; i < REPORT_QUOTA_LIMIT; i++) {
      await store.checkReportQuota(key);
    }
    vi.advanceTimersByTime(REPORT_QUOTA_WINDOW_MS + 1);
    expect(await store.checkReportQuota(key)).toBe(true);
  });

  it('two distinct keys do not interfere with each other', async () => {
    const store = createMemoryStore({ locations: [], needs: [] });
    for (let i = 0; i < REPORT_QUOTA_LIMIT; i++) {
      await store.checkReportQuota('key-a');
    }
    expect(await store.checkReportQuota('key-b')).toBe(true);
  });
});

describe('createLocationAction rate-limit gate', () => {
  beforeEach(() => {
    createLocation.mockReset();
    checkReportQuota.mockReset();
    createLocation.mockResolvedValue({ id: 'zona_1' });
    getHeader.mockImplementation((name: string) =>
      name === 'x-forwarded-for' ? '1.2.3.4' : null,
    );
    process.env.THROTTLE_SALT = 'test-salt';
  });

  afterEach(() => {
    vi.clearAllMocks();
    delete process.env.THROTTLE_SALT;
  });

  it('blocks when quota is exceeded and does not call createLocation', async () => {
    checkReportQuota.mockResolvedValue(false);
    const result = await createLocationAction(VALID_LOCATION);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/r[aá]pido/);
      expect(result.error).toMatch(/est[aá]s/i);
    }
    expect(createLocation).not.toHaveBeenCalled();
  });

  it('allows when quota is available and calls createLocation', async () => {
    checkReportQuota.mockResolvedValue(true);
    const result = await createLocationAction(VALID_LOCATION);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.id).toBe('zona_1');
    }
    expect(createLocation).toHaveBeenCalled();
  });

  it('throttle response has no fieldErrors', async () => {
    checkReportQuota.mockResolvedValue(false);
    const result = await createLocationAction(VALID_LOCATION);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors).toBeUndefined();
    }
  });

  it('skips gate and allows report when THROTTLE_SALT is not set', async () => {
    delete process.env.THROTTLE_SALT;
    checkReportQuota.mockResolvedValue(false);
    const result = await createLocationAction(VALID_LOCATION);
    expect(result.ok).toBe(true);
    expect(checkReportQuota).not.toHaveBeenCalled();
    expect(createLocation).toHaveBeenCalled();
  });

  it('skips gate and allows report when x-forwarded-for is absent', async () => {
    getHeader.mockReturnValue(null);
    checkReportQuota.mockResolvedValue(false);
    const result = await createLocationAction(VALID_LOCATION);
    expect(result.ok).toBe(true);
    expect(checkReportQuota).not.toHaveBeenCalled();
    expect(createLocation).toHaveBeenCalled();
  });
});
