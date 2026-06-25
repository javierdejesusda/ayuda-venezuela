'use client';

import { useState } from 'react';

import { transformedFotoUrl } from '@/lib/data/foto-url';

/**
 * A single zone photo from Supabase Storage with a layout-preserving fallback.
 * The src is rewritten to Supabase's image-transformation endpoint so photos are
 * resized and WebP-encoded at the edge (a large egress win) without pulling in
 * the Next image optimizer or a second remote host. On blocked or degraded
 * networks the *.supabase.co request fails; onError swaps in a neutral tile so
 * the photo grid never collapses.
 */
export function ZonePhoto({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  // The grid renders square thumbnails, so request a small cover-cropped square
  // instead of a full-height image the browser would only shrink and crop.
  const optimized = transformedFotoUrl(src, { width: 600, height: 600, resize: 'cover' });

  if (failed) {
    return (
      <div
        role="img"
        aria-label="Foto no disponible"
        className="img-outline flex aspect-square w-full items-center justify-center rounded-xl bg-surface-2 text-center text-xs text-ink-faint"
      >
        Foto no disponible
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={optimized}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className="img-outline aspect-square w-full rounded-xl object-cover"
    />
  );
}
