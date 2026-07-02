// @vitest-environment jsdom
/**
 * The privacy and legal page must explain, in plain es_VE, how this no-login
 * tool handles data: reports are public, contact info you post is visible to
 * anyone, coordinates are coarsened in the public API, photo metadata is
 * stripped, analytics is cookieless, and how to request that a report be taken
 * down. It must also be reachable from the site footer.
 */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ usePathname: () => '/privacidad' }));

import PrivacidadPage from '@/app/privacidad/page';
import { SiteFooter } from '@/components/site-footer';

afterEach(() => {
  cleanup();
});

function bodyText(): string {
  return (document.body.textContent ?? '').toLowerCase();
}

describe('PrivacidadPage', () => {
  it('renders a level-1 heading about privacy', () => {
    render(<PrivacidadPage />);
    expect(screen.getByRole('heading', { level: 1, name: /privacidad/i })).toBeTruthy();
  });

  it('explains that reports and posted info are public', () => {
    render(<PrivacidadPage />);
    const text = bodyText();
    expect(text).toMatch(/p[úu]blic/);
    expect(text).toContain('cualquier');
  });

  it('explains there is no login or account', () => {
    render(<PrivacidadPage />);
    expect(bodyText()).toMatch(/sin cuenta|sin registro|no requiere.*cuenta|sin iniciar sesi/);
  });

  it('states public coordinates (map, list, API) are rounded and precise location stays server-side', () => {
    render(<PrivacidadPage />);
    const text = bodyText();
    expect(text).toContain('110');
    expect(text).toMatch(/del lado del servidor|no se expone/);
    expect(text).toMatch(/listado|lista/);
  });

  it('mentions that photo metadata (EXIF/GPS) is removed', () => {
    render(<PrivacidadPage />);
    expect(bodyText()).toMatch(/metadato|exif/);
  });

  it('mentions the cookieless analytics', () => {
    render(<PrivacidadPage />);
    expect(bodyText()).toMatch(/sin cookies|cloudflare/);
  });

  it('explains how to request removal of a report', () => {
    render(<PrivacidadPage />);
    expect(bodyText()).toMatch(/solicitar que se quite|retiro|quitar/);
  });

  it('links to the emergency numbers surface', () => {
    render(<PrivacidadPage />);
    const links = screen.getAllByRole('link');
    expect(links.some((l) => l.getAttribute('href') === '/telefonos')).toBe(true);
  });
});

describe('SiteFooter privacy link', () => {
  it('links to the privacy page', () => {
    render(<SiteFooter />);
    const links = screen.getAllByRole('link');
    expect(links.some((l) => l.getAttribute('href') === '/privacidad')).toBe(true);
  });
});
