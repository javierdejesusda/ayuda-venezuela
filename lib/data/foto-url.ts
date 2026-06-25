/**
 * Rewrite a Supabase public Storage URL to its image-transformation endpoint so
 * photos are resized and re-encoded (WebP when the browser supports it) at the
 * edge instead of served raw, a large egress win. Non-Supabase or
 * already-transformed URLs pass through unchanged. Image transformations require
 * a Supabase paid plan.
 *
 * A resize mode is always sent. The render endpoint keeps the source height when
 * only `width` is given (an 800-wide request on a 3024x4032 photo returns an
 * 800x4032 vertical strip), so the default `contain` scales the whole photo
 * down without cropping. Square thumbnails opt into `cover` with an explicit
 * width and height.
 */
const OBJECT_MARKER = '/storage/v1/object/public/';
const RENDER_MARKER = '/storage/v1/render/image/public/';

export interface FotoTransform {
  width?: number;
  height?: number;
  quality?: number;
  resize?: 'contain' | 'cover' | 'fill';
}

export function transformedFotoUrl(
  url: string,
  { width = 800, height, quality = 70, resize = 'contain' }: FotoTransform = {},
): string {
  if (!url.includes(OBJECT_MARKER)) return url;
  const rendered = url.replace(OBJECT_MARKER, RENDER_MARKER);
  const separator = rendered.includes('?') ? '&' : '?';
  const dimensions = height ? `width=${width}&height=${height}` : `width=${width}`;
  return `${rendered}${separator}${dimensions}&quality=${quality}&resize=${resize}`;
}
