import { describe, expect, it } from 'vitest';

import { marqueeRepeatCount } from '@/lib/marquee';

describe('marqueeRepeatCount', () => {
  it('repeats enough times to overfill a container wider than one unit', () => {
    // 1000 / 200 = 5, plus one spare copy to absorb sub-pixel seams.
    expect(marqueeRepeatCount(1000, 200)).toBe(6);
    // 1000 / 250 = 4 -> 5.
    expect(marqueeRepeatCount(1000, 250)).toBe(5);
    // 1000 / 300 = 3.33 -> ceil 4 -> 5.
    expect(marqueeRepeatCount(1000, 300)).toBe(5);
  });

  it('still returns at least two copies when one unit already overflows', () => {
    // Unit wider than the container: ceil(0.33)=1, +1 spare = 2.
    expect(marqueeRepeatCount(100, 300)).toBe(2);
    expect(marqueeRepeatCount(300, 300)).toBe(2);
  });

  it('falls back to a single copy for degenerate measurements', () => {
    // Before layout (zero/unknown widths) there is nothing to tile against.
    expect(marqueeRepeatCount(0, 200)).toBe(1);
    expect(marqueeRepeatCount(1000, 0)).toBe(1);
    expect(marqueeRepeatCount(1000, -5)).toBe(1);
    expect(marqueeRepeatCount(-5, 200)).toBe(1);
    expect(marqueeRepeatCount(Number.NaN, 200)).toBe(1);
  });
});
