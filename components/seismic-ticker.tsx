'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { Activity } from 'lucide-react';

import { marqueeRepeatCount } from '@/lib/marquee';
import { formatPlaceEs, relativeTimeEs } from '@/lib/sismos/format';
import { magnitudeStyle } from '@/lib/sismos/magnitude';
import type { Sismo } from '@/lib/sismos/types';
import { useNow } from '@/lib/use-now';
import { usePrefersReducedMotion } from '@/lib/use-prefers-dark';

// Measure before paint on the client (no flash from the seed copy count) while
// staying a no-op on the server, where layout effects do not run.
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * A slim "último temblor" wire that loops the most recent earthquake across the
 * top of the home page. With reduced motion it stays still and truncates instead
 * of scrolling. Renders nothing when there is no recent quake to show.
 */
export function SeismicTicker({ sismos }: { sismos: Sismo[] }): React.JSX.Element | null {
  const reducedMotion = usePrefersReducedMotion();
  // Relative time arrives after mount (null on SSR/first paint) so the server
  // and client agree on the "hace X" suffix; refreshed each minute.
  const now = useNow();

  const containerRef = useRef<HTMLDivElement>(null);
  const unitRef = useRef<HTMLSpanElement>(null);
  // Seed with two copies (the old behaviour) so SSR and the first client render
  // agree; the layout effect tiles up to fill the real track width before paint.
  const [repeat, setRepeat] = useState(2);

  const latest = sismos[0];

  const color = latest ? magnitudeStyle(latest.magnitude).color : undefined;
  const place = latest ? formatPlaceEs(latest.place) : '';
  const when = latest && now !== null ? relativeTimeEs(latest.time, now) : '';

  // Tile one content unit enough times to overfill the visible track, so the
  // two-group marquee loops without a blank band. Re-measure on resize and when
  // the text widens (the "hace X" suffix lands after mount).
  useIsomorphicLayoutEffect(() => {
    if (reducedMotion) return;
    const container = containerRef.current;
    const unit = unitRef.current;
    if (!container || !unit) return;
    const measure = () => setRepeat(marqueeRepeatCount(container.clientWidth, unit.offsetWidth));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, [reducedMotion, place, when, color]);

  if (!latest) return null;

  const content = (
    <>
      <span className="tabular font-semibold" style={{ color }}>
        M{latest.magnitude.toFixed(1)}
      </span>{' '}
      <span className="text-ink-soft">{place}</span>
      {when && <span className="text-ink-faint"> · {when}</span>}
    </>
  );

  const group = (withMeasureRef: boolean) =>
    Array.from({ length: repeat }, (_, i) => (
      <span
        key={i}
        ref={withMeasureRef && i === 0 ? unitRef : undefined}
        className="whitespace-nowrap px-6"
      >
        {content}
      </span>
    ));

  return (
    <div
      role="status"
      aria-label={`Último temblor: magnitud ${latest.magnitude.toFixed(1)}, ${place}${
        when ? `, ${when}` : ''
      }`}
      className="flex items-stretch overflow-hidden rounded-xl border border-border bg-surface text-sm shadow-card"
    >
      <span className="eyebrow flex shrink-0 items-center gap-1.5 border-r border-border bg-surface-2 px-3 py-2 text-ink-faint">
        <Activity size={13} aria-hidden="true" style={{ color }} />
        Último temblor
      </span>
      <div ref={containerRef} className="relative flex-1 overflow-hidden py-2" aria-hidden="true">
        {reducedMotion ? (
          <div className="truncate px-6">{content}</div>
        ) : (
          <div className="animate-marquee flex w-max">
            <div className="flex shrink-0">{group(true)}</div>
            <div className="flex shrink-0">{group(false)}</div>
          </div>
        )}
      </div>
    </div>
  );
}
