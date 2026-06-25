import { describe, expect, it } from 'vitest';

import { validateFotoFile } from '@/lib/data/foto-validation';
import { MAX_FOTO_BYTES, MAX_FOTO_MB } from '@/lib/data/types';

describe('validateFotoFile', () => {
  it('accepts an image at exactly the size limit', () => {
    expect(validateFotoFile({ type: 'image/jpeg', size: MAX_FOTO_BYTES })).toBeNull();
  });

  it('accepts a small image', () => {
    expect(validateFotoFile({ type: 'image/png', size: 1024 })).toBeNull();
  });

  it('rejects an image one byte over the limit', () => {
    expect(validateFotoFile({ type: 'image/jpeg', size: MAX_FOTO_BYTES + 1 })).toBe(
      `Cada imagen debe pesar ${MAX_FOTO_MB} MB o menos.`,
    );
  });

  it('rejects a non-image file regardless of size', () => {
    expect(validateFotoFile({ type: 'application/pdf', size: 1024 })).toBe(
      'Solo se permiten imágenes.',
    );
  });
});

describe('foto size limit', () => {
  it('caps each photo at 10 MB', () => {
    expect(MAX_FOTO_MB).toBe(10);
    expect(MAX_FOTO_BYTES).toBe(10 * 1024 * 1024);
  });
});
