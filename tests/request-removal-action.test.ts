import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { REMOVAL_REASON_LABELS } from '@/lib/data/types';

const { createRemovalRequest, checkReportQuota, getHeader } = vi.hoisted(() => ({
  createRemovalRequest: vi.fn(),
  checkReportQuota: vi.fn(),
  getHeader: vi.fn(),
}));

vi.mock('@/lib/data/store', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/data/store')>();
  return {
    ...actual,
    getStore: () => ({ createRemovalRequest, checkReportQuota }),
  };
});
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/headers', () => ({ headers: () => ({ get: getHeader }) }));

import { requestRemovalAction } from '@/app/actions';

const VALID = { locationId: 'zona_1', motivo: 'resuelto' as const };

beforeEach(() => {
  createRemovalRequest.mockReset();
  checkReportQuota.mockReset();
  createRemovalRequest.mockResolvedValue(undefined);
  checkReportQuota.mockResolvedValue(true);
  getHeader.mockImplementation((name: string) =>
    name === 'x-forwarded-for' ? '1.2.3.4' : null,
  );
  process.env.THROTTLE_SALT = 'test-salt';
});

afterEach(() => {
  vi.clearAllMocks();
  delete process.env.THROTTLE_SALT;
});

describe('requestRemovalAction', () => {
  it('rejects an invalid reason with field errors and does not write', async () => {
    const result = await requestRemovalAction({ locationId: 'zona_1', motivo: 'spam' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors?.motivo).toBeTruthy();
    }
    expect(createRemovalRequest).not.toHaveBeenCalled();
  });

  it('queues a valid request with the composed motivo', async () => {
    const result = await requestRemovalAction({
      ...VALID,
      detalle: 'El edificio ya fue evacuado y demolido.',
    });
    expect(result.ok).toBe(true);
    expect(createRemovalRequest).toHaveBeenCalledWith({
      locationId: 'zona_1',
      motivo: `${REMOVAL_REASON_LABELS.resuelto}: El edificio ya fue evacuado y demolido.`,
      contacto: undefined,
    });
  });

  it('blocks when the rate-limit quota is exceeded and does not write', async () => {
    checkReportQuota.mockResolvedValue(false);
    const result = await requestRemovalAction(VALID);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/r[aá]pido/i);
      expect(result.fieldErrors).toBeUndefined();
    }
    expect(createRemovalRequest).not.toHaveBeenCalled();
  });

  it('skips the rate-limit gate when THROTTLE_SALT is unset', async () => {
    delete process.env.THROTTLE_SALT;
    checkReportQuota.mockResolvedValue(false);
    const result = await requestRemovalAction(VALID);
    expect(result.ok).toBe(true);
    expect(checkReportQuota).not.toHaveBeenCalled();
    expect(createRemovalRequest).toHaveBeenCalled();
  });

  it('returns a generic error when the store throws', async () => {
    createRemovalRequest.mockRejectedValueOnce(new Error('db down'));
    const result = await requestRemovalAction(VALID);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeTruthy();
    }
  });
});
