/**
 * How many times to repeat one content unit so a marquee group is at least as
 * wide as its visible container. A seamless two-group marquee that translates by
 * one group width only loops without a blank gap when a single group already
 * fills (or overfills) the viewport; with too few copies the tail of the strip
 * scrolls past the edge and a blank band shows before the loop restarts.
 *
 * Returns 1 for degenerate measurements (zero/negative/NaN widths, e.g. before
 * the first layout pass) so the strip still renders something. Otherwise it
 * tiles `ceil(container / unit)` copies plus one spare to absorb sub-pixel
 * rounding in the measured widths.
 */
export function marqueeRepeatCount(containerWidth: number, unitWidth: number): number {
  if (
    !Number.isFinite(containerWidth) ||
    !Number.isFinite(unitWidth) ||
    containerWidth <= 0 ||
    unitWidth <= 0
  ) {
    return 1;
  }
  return Math.ceil(containerWidth / unitWidth) + 1;
}
