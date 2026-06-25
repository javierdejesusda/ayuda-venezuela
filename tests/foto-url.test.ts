import { describe, expect, it } from 'vitest';

import { transformedFotoUrl } from '@/lib/data/foto-url';

const PUBLIC = 'https://rwz.supabase.co/storage/v1/object/public/fotos/abc.jpg';

describe('transformedFotoUrl', () => {
  it('rewrites a public Storage URL to the image render endpoint with sizing', () => {
    expect(transformedFotoUrl(PUBLIC, { width: 800, quality: 70 })).toBe(
      'https://rwz.supabase.co/storage/v1/render/image/public/fotos/abc.jpg?width=800&quality=70&resize=contain',
    );
  });

  it('always sends a resize mode so Supabase never crops to the original height', () => {
    // A width-only request returns an 800x4032 vertical strip (the source height
    // is kept), so the whole photo must be scaled with an explicit resize mode.
    expect(transformedFotoUrl(PUBLIC, { width: 800 })).toContain('resize=contain');
  });

  it('supports an explicit height with cover for square thumbnails', () => {
    expect(transformedFotoUrl(PUBLIC, { width: 600, height: 600, resize: 'cover' })).toBe(
      'https://rwz.supabase.co/storage/v1/render/image/public/fotos/abc.jpg?width=600&height=600&quality=70&resize=cover',
    );
  });

  it('applies sensible defaults when no options are given', () => {
    const out = transformedFotoUrl(PUBLIC);
    expect(out).toContain('/render/image/public/fotos/abc.jpg?width=');
    expect(out).toContain('quality=');
    expect(out).toContain('resize=contain');
  });

  it('leaves non-Supabase URLs unchanged', () => {
    expect(transformedFotoUrl('https://example.com/a.jpg')).toBe('https://example.com/a.jpg');
  });

  it('is idempotent for already-transformed URLs', () => {
    const rendered = transformedFotoUrl(PUBLIC);
    expect(transformedFotoUrl(rendered)).toBe(rendered);
  });

  it('appends params when the URL already carries a query string', () => {
    expect(transformedFotoUrl(`${PUBLIC}?token=1`, { width: 600, quality: 75 })).toBe(
      'https://rwz.supabase.co/storage/v1/render/image/public/fotos/abc.jpg?token=1&width=600&quality=75&resize=contain',
    );
  });
});
