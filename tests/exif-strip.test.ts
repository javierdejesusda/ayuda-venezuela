// @vitest-environment jsdom
/**
 * Tests for the client-side photo metadata stripper. Phone cameras embed EXIF
 * data - including GPS coordinates - in JPEG files. Because the fotos Storage
 * bucket is public and serves the original bytes, that metadata would leak the
 * precise location of whoever is in the photo. `stripJpegMetadata` removes every
 * metadata segment while preserving the compressed image data byte-for-byte.
 */
import { describe, expect, it } from 'vitest';

import { stripImageMetadata, stripJpegMetadata } from '@/lib/data/exif-strip';

const SOI = [0xff, 0xd8];
const EOI = [0xff, 0xd9];

/** Builds a marker segment: FF, marker, 2-byte length, then payload. */
function segment(marker: number, payload: number[]): number[] {
  const length = payload.length + 2;
  return [0xff, marker, (length >> 8) & 0xff, length & 0xff, ...payload];
}

/** ASCII bytes, used to plant a recognizable GPS marker inside EXIF. */
function ascii(text: string): number[] {
  return Array.from(text, (c) => c.charCodeAt(0));
}

function contains(haystack: Uint8Array, needle: number[]): boolean {
  outer: for (let i = 0; i <= haystack.length - needle.length; i++) {
    for (let j = 0; j < needle.length; j++) {
      if (haystack[i + j] !== needle[j]) continue outer;
    }
    return true;
  }
  return false;
}

describe('stripJpegMetadata', () => {
  it('returns the input unchanged when the bytes are not a JPEG', () => {
    const notJpeg = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x01, 0x02]);
    expect(Array.from(stripJpegMetadata(notJpeg))).toEqual(Array.from(notJpeg));
  });

  it('removes an EXIF (APP1) segment and its GPS payload', () => {
    const exif = segment(0xe1, ascii('Exif  GPSLatitude'));
    const dqt = segment(0xdb, [0x00, 0x01, 0x02]);
    const scan = [0xff, 0xda, 0x00, 0x03, 0x11, 0xaa, 0xbb, ...EOI];
    const input = new Uint8Array([...SOI, ...exif, ...dqt, ...scan]);

    const out = stripJpegMetadata(input);

    expect(contains(out, ascii('GPSLatitude'))).toBe(false);
    expect(contains(out, ascii('Exif'))).toBe(false);
    // The quantization table and scan data must survive untouched.
    expect(Array.from(out)).toEqual([...SOI, ...dqt, ...scan]);
  });

  it('removes every APPn segment, including a benign APP0/JFIF header', () => {
    const jfif = segment(0xe0, ascii('JFIF '));
    const exif = segment(0xe1, ascii('Exif  camera'));
    const scan = [0xff, 0xda, 0x00, 0x02, ...EOI];
    const input = new Uint8Array([...SOI, ...jfif, ...exif, ...scan]);

    const out = stripJpegMetadata(input);

    expect(contains(out, ascii('JFIF'))).toBe(false);
    expect(contains(out, ascii('Exif'))).toBe(false);
    expect(Array.from(out)).toEqual([...SOI, ...scan]);
  });

  it('removes a COM comment segment', () => {
    const comment = segment(0xfe, ascii('Shot on a phone at home'));
    const scan = [0xff, 0xda, 0x00, 0x02, ...EOI];
    const input = new Uint8Array([...SOI, ...comment, ...scan]);

    expect(contains(stripJpegMetadata(input), ascii('phone'))).toBe(false);
  });

  it('leaves a JPEG without metadata byte-for-byte identical', () => {
    const dqt = segment(0xdb, [0x00, 0x01]);
    const scan = [0xff, 0xda, 0x00, 0x02, 0x33, 0x44, ...EOI];
    const input = new Uint8Array([...SOI, ...dqt, ...scan]);

    expect(Array.from(stripJpegMetadata(input))).toEqual(Array.from(input));
  });

  it('copies scan data verbatim even when it contains marker-like bytes', () => {
    // After SOS the entropy-coded data can contain 0xFF bytes; they must not be
    // parsed as segment markers.
    const scan = [0xff, 0xda, 0x00, 0x02, 0xff, 0x00, 0xff, 0xe1, 0x12, ...EOI];
    const input = new Uint8Array([...SOI, ...scan]);

    expect(Array.from(stripJpegMetadata(input))).toEqual([...SOI, ...scan]);
  });

  it('does not throw or read past the end on a truncated segment length', () => {
    // APP1 claims a 300-byte length but the buffer ends early.
    const input = new Uint8Array([...SOI, 0xff, 0xe1, 0x01, 0x2c, 0x01, 0x02]);
    expect(() => stripJpegMetadata(input)).not.toThrow();
    const out = stripJpegMetadata(input);
    expect(out[0]).toBe(0xff);
    expect(out[1]).toBe(0xd8);
  });
});

describe('stripImageMetadata', () => {
  it('strips metadata from a JPEG File and keeps its name and type', async () => {
    const exif = segment(0xe1, ascii('Exif  GPSLatitude'));
    const scan = [0xff, 0xda, 0x00, 0x02, ...EOI];
    const bytes = new Uint8Array([...SOI, ...exif, ...scan]);
    const file = new File([bytes], 'photo.jpg', { type: 'image/jpeg' });

    const result = await stripImageMetadata(file);

    expect(result.name).toBe('photo.jpg');
    expect(result.type).toBe('image/jpeg');
    const outBytes = new Uint8Array(await result.arrayBuffer());
    expect(contains(outBytes, ascii('GPSLatitude'))).toBe(false);
  });

  it('returns non-JPEG files untouched', async () => {
    const png = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], 'x.png', {
      type: 'image/png',
    });
    const result = await stripImageMetadata(png);
    expect(result).toBe(png);
  });
});
