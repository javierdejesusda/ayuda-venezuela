// @vitest-environment jsdom
/**
 * The emergency liability disclaimer must make clear, calmly, that this is a
 * community tool and not an official emergency service, that information may be
 * unverified, and that a real emergency calls for the official numbers. It is
 * static safety information, so it must not be dismissible.
 */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { EmergencyDisclaimer } from '@/components/emergency-disclaimer';

afterEach(() => {
  cleanup();
});

describe('EmergencyDisclaimer', () => {
  it('renders inside a labelled complementary or region landmark', () => {
    render(<EmergencyDisclaimer />);
    const landmark = screen.queryByRole('complementary') ?? screen.queryByRole('region');
    expect(landmark).not.toBeNull();
    expect((landmark?.getAttribute('aria-label') ?? '').length).toBeGreaterThan(0);
  });

  it('states it is not an official emergency service', () => {
    render(<EmergencyDisclaimer />);
    const text = (document.body.textContent ?? '').toLowerCase();
    expect(text).toMatch(/no.*servicio oficial de emergencia/);
  });

  it('advises verifying information before acting', () => {
    render(<EmergencyDisclaimer />);
    expect((document.body.textContent ?? '').toLowerCase()).toMatch(/verif/);
  });

  it('links to the emergency numbers surface', () => {
    render(<EmergencyDisclaimer />);
    const links = screen.getAllByRole('link');
    expect(links.some((l) => l.getAttribute('href') === '/telefonos')).toBe(true);
  });

  it('offers a direct call link to 911', () => {
    render(<EmergencyDisclaimer />);
    const links = screen.getAllByRole('link');
    expect(
      links.some((l) => (l.getAttribute('href') ?? '').startsWith('tel:') &&
        (l.getAttribute('href') ?? '').includes('911')),
    ).toBe(true);
  });

  it('is static: no dismiss or close control', () => {
    render(<EmergencyDisclaimer />);
    for (const btn of screen.queryAllByRole('button')) {
      expect((btn.textContent ?? '').toLowerCase()).not.toMatch(/cerrar|ocultar|dismiss|close/);
    }
  });
});
