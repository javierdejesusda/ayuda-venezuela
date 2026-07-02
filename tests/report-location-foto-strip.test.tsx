// @vitest-environment jsdom
/**
 * The report form must strip photo metadata (EXIF/GPS) before a photo reaches
 * the public Storage bucket, so a reporter never leaks the precise location of
 * the people in the picture.
 */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/app/actions', () => ({ createLocationAction: vi.fn() }));
vi.mock('@/app/geocode-actions', () => ({ geocodeReverseAction: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@/components/location-picker', () => ({
  default: () => <div data-testid="location-picker" />,
}));

const uploadSpy = vi.fn();
vi.mock('@/lib/data/supabase-browser', () => ({
  getBrowserSupabase: () => ({
    storage: {
      from: () => ({
        upload: uploadSpy,
        getPublicUrl: () => ({ data: { publicUrl: 'https://cdn/x.jpg' } }),
      }),
    },
  }),
}));

import { createLocationAction } from '@/app/actions';
import ReportLocationForm from '@/components/report-location-form';

function ascii(text: string): number[] {
  return Array.from(text, (c) => c.charCodeAt(0));
}

function jpegWithGps() {
  const payload = ascii('Exif  GPSLatitude');
  const appLen = payload.length + 2;
  return new Uint8Array([
    0xff, 0xd8, // SOI
    0xff, 0xe1, (appLen >> 8) & 0xff, appLen & 0xff, ...payload, // APP1/EXIF
    0xff, 0xda, 0x00, 0x02, 0x11, 0x22, // SOS + scan
    0xff, 0xd9, // EOI
  ]);
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

beforeEach(() => {
  URL.createObjectURL = vi.fn(() => 'blob:preview');
  URL.revokeObjectURL = vi.fn();
  uploadSpy.mockResolvedValue({ error: null });
  vi.mocked(createLocationAction).mockResolvedValue({ ok: true, data: { id: 'z1' } });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('ReportLocationForm photo metadata stripping', () => {
  it('uploads a JPEG with its EXIF/GPS metadata removed', async () => {
    render(<ReportLocationForm />);

    fireEvent.change(document.querySelector('#nombre') as HTMLInputElement, {
      target: { value: 'Edificio Rita' },
    });
    fireEvent.change(document.querySelector('#estado') as HTMLSelectElement, {
      target: { value: 'Carabobo' },
    });
    fireEvent.change(document.querySelector('#ciudad') as HTMLInputElement, {
      target: { value: 'Valencia' },
    });

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File([jpegWithGps()], 'foto.jpg', { type: 'image/jpeg' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    fireEvent.click(screen.getByRole('button', { name: /Publicar reporte/i }));

    await waitFor(() => expect(uploadSpy).toHaveBeenCalledTimes(1));

    const uploaded = uploadSpy.mock.calls[0][1] as File;
    const bytes = new Uint8Array(await uploaded.arrayBuffer());
    expect(contains(bytes, ascii('GPSLatitude'))).toBe(false);
    expect(contains(bytes, ascii('Exif'))).toBe(false);
  });
});
