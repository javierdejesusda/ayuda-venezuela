import { describe, expect, it } from 'vitest';

import { requestRemovalSchema } from '@/lib/data/schemas';
import { REMOVAL_REASONS, REMOVAL_REASON_LABELS } from '@/lib/data/types';

const VALID_ID = '11111111-1111-4111-8111-111111111111';

describe('REMOVAL_REASONS constant', () => {
  it('contains the four expected reason categories', () => {
    expect(REMOVAL_REASONS).toEqual(['resuelto', 'duplicado', 'incorrecto', 'otro']);
  });

  it('has a non-empty label for every reason', () => {
    for (const reason of REMOVAL_REASONS) {
      expect(REMOVAL_REASON_LABELS[reason].length).toBeGreaterThanOrEqual(5);
    }
  });
});

describe('requestRemovalSchema', () => {
  it('accepts a minimal request and stores the reason label as motivo', () => {
    const result = requestRemovalSchema.parse({
      locationId: VALID_ID,
      motivo: 'resuelto',
    });
    expect(result.locationId).toBe(VALID_ID);
    expect(result.motivo).toBe(REMOVAL_REASON_LABELS.resuelto);
    expect(result.contacto).toBeUndefined();
  });

  it('appends the optional detail to the stored motivo', () => {
    const result = requestRemovalSchema.parse({
      locationId: VALID_ID,
      motivo: 'duplicado',
      detalle: 'Ya existe el mismo edificio reportado mas arriba.',
    });
    expect(result.motivo).toBe(
      `${REMOVAL_REASON_LABELS.duplicado}: Ya existe el mismo edificio reportado mas arriba.`,
    );
  });

  it('keeps the label alone for otro when no detail is given', () => {
    const result = requestRemovalSchema.parse({
      locationId: VALID_ID,
      motivo: 'otro',
    });
    expect(result.motivo).toBe(REMOVAL_REASON_LABELS.otro);
    expect(result.motivo.length).toBeGreaterThanOrEqual(5);
  });

  it('trims and keeps a provided contacto', () => {
    const result = requestRemovalSchema.parse({
      locationId: VALID_ID,
      motivo: 'incorrecto',
      contacto: '  +58 412 555 0000  ',
    });
    expect(result.contacto).toBe('+58 412 555 0000');
  });

  it('maps empty detalle and contacto to undefined', () => {
    const result = requestRemovalSchema.parse({
      locationId: VALID_ID,
      motivo: 'resuelto',
      detalle: '',
      contacto: '',
    });
    expect(result.motivo).toBe(REMOVAL_REASON_LABELS.resuelto);
    expect(result.contacto).toBeUndefined();
  });

  it('rejects an unknown reason', () => {
    const result = requestRemovalSchema.safeParse({
      locationId: VALID_ID,
      motivo: 'spam',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an empty locationId', () => {
    const result = requestRemovalSchema.safeParse({ locationId: '', motivo: 'resuelto' });
    expect(result.success).toBe(false);
  });

  it('rejects detalle over 400 characters', () => {
    const result = requestRemovalSchema.safeParse({
      locationId: VALID_ID,
      motivo: 'otro',
      detalle: 'a'.repeat(401),
    });
    expect(result.success).toBe(false);
  });

  it('rejects contacto over 120 characters', () => {
    const result = requestRemovalSchema.safeParse({
      locationId: VALID_ID,
      motivo: 'otro',
      contacto: 'a'.repeat(121),
    });
    expect(result.success).toBe(false);
  });

  it('accepts a demo-mode style locationId (not a uuid)', () => {
    const result = requestRemovalSchema.safeParse({
      locationId: 'zona_demo_1',
      motivo: 'resuelto',
    });
    expect(result.success).toBe(true);
  });
});
