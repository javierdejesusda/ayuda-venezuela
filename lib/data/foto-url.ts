/**
 * Rewrite a Supabase public Storage URL to its image-transformation endpoint so
 * photos are resized and re-encoded (WebP when the browser supports it) at the
 * edge instead of served raw. Non-Supabase or already-transformed URLs pass
 * through unchanged. Image transformations require a Supabase paid plan.
 */
const OBJECT_MARKER = '/storage/v1/object/public/';
const RENDER_MARKER = '/storage/v1/render/image/public/';

export interface FotoTransform {
  width?: number;
  quality?: number;
}

export function transformedFotoUrl(
  url: string,
  { width = 800, quality = 70 }: FotoTransform = {},
): string {
  if (!url.includes(OBJECT_MARKER)) return url;
  const rendered = url.replace(OBJECT_MARKER, RENDER_MARKER);
  const separator = rendered.includes('?') ? '&' : '?';
  return `${rendered}${separator}width=${width}&quality=${quality}`;
}
