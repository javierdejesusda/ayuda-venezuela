import { describe, expect, it } from 'vitest';

import { epicenterStyleForSismo, magnitudeStyle, recencyOpacity } from '@/lib/sismos/magnitude';

const HOUR_MS = 3_600_000;

describe('magnitudeStyle', () => {
  it('grows the epicenter radius with magnitude', () => {
    const small = magnitudeStyle(3);
    const medium = magnitudeStyle(4.5);
    const large = magnitudeStyle(6);
    expect(small.radiusPx).toBeLessThan(medium.radiusPx);
    expect(medium.radiusPx).toBeLessThan(large.radiusPx);
  });

  it('keeps the radius within sane bounds across the magnitude range', () => {
    expect(magnitudeStyle(0).radiusPx).toBeGreaterThanOrEqual(8);
    expect(magnitudeStyle(9).radiusPx).toBeLessThanOrEqual(36);
  });

  it('assigns hotter colors to stronger quakes', () => {
    expect(magnitudeStyle(3).color).not.toBe(magnitudeStyle(5.5).color);
  });

  it('only pulses strong quakes (M4.5+)', () => {
    expect(magnitudeStyle(4.4).pulse).toBe(false);
    expect(magnitudeStyle(4.5).pulse).toBe(true);
    expect(magnitudeStyle(6).pulse).toBe(true);
  });
});

describe('recencyOpacity', () => {
  it('returns 1 for quakes under 12 hours old', () => {
    expect(recencyOpacity(0)).toBe(1);
    expect(recencyOpacity(11 * HOUR_MS)).toBe(1);
    expect(recencyOpacity(11.9 * HOUR_MS)).toBe(1);
  });

  it('returns 0.7 for quakes between 12h and 72h old', () => {
    expect(recencyOpacity(12 * HOUR_MS)).toBe(0.7);
    expect(recencyOpacity(36 * HOUR_MS)).toBe(0.7);
    expect(recencyOpacity(71.9 * HOUR_MS)).toBe(0.7);
  });

  it('returns 0.45 for quakes older than 72h', () => {
    expect(recencyOpacity(72 * HOUR_MS)).toBe(0.45);
    expect(recencyOpacity(200 * HOUR_MS)).toBe(0.45);
  });

  it('treats zero age as fully opaque', () => {
    expect(recencyOpacity(0)).toBe(1);
  });
});

describe('epicenterStyleForSismo', () => {
  const NOW = 1_750_000_000_000;

  it('includes magnitude-based fields', () => {
    const result = epicenterStyleForSismo({ magnitude: 5, time: NOW - HOUR_MS }, NOW, false);
    expect(result.radiusPx).toBeGreaterThan(8);
    expect(result.color).toBeTruthy();
    expect(typeof result.pulse).toBe('boolean');
  });

  it('marks isMostRecent true when passed true', () => {
    const result = epicenterStyleForSismo({ magnitude: 3, time: NOW - HOUR_MS }, NOW, true);
    expect(result.isMostRecent).toBe(true);
  });

  it('marks isMostRecent false when passed false', () => {
    const result = epicenterStyleForSismo({ magnitude: 3, time: NOW - HOUR_MS }, NOW, false);
    expect(result.isMostRecent).toBe(false);
  });

  it('returns full opacity for a very recent quake', () => {
    const result = epicenterStyleForSismo({ magnitude: 4, time: NOW - HOUR_MS }, NOW, false);
    expect(result.opacity).toBe(1);
  });

  it('reduces opacity for older quakes', () => {
    const fresh = epicenterStyleForSismo({ magnitude: 4, time: NOW - HOUR_MS }, NOW, false);
    const aged = epicenterStyleForSismo({ magnitude: 4, time: NOW - 48 * HOUR_MS }, NOW, false);
    const stale = epicenterStyleForSismo({ magnitude: 4, time: NOW - 100 * HOUR_MS }, NOW, false);
    expect(fresh.opacity).toBeGreaterThan(aged.opacity);
    expect(aged.opacity).toBeGreaterThan(stale.opacity);
  });

  it('pulses strong quakes regardless of recency', () => {
    const old = epicenterStyleForSismo({ magnitude: 5, time: NOW - 200 * HOUR_MS }, NOW, false);
    expect(old.pulse).toBe(true);
  });

  it('clamps negative age (future timestamp) to zero', () => {
    const future = epicenterStyleForSismo({ magnitude: 3, time: NOW + HOUR_MS }, NOW, false);
    expect(future.opacity).toBe(1);
  });
});
