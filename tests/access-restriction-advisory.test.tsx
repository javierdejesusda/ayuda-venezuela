// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { AccessRestrictionAdvisory } from '@/components/access-restriction-advisory';

afterEach(() => {
  cleanup();
});

describe('AccessRestrictionAdvisory', () => {
  it('mentions La Guaira and permiso especial or salvoconducto', () => {
    render(<AccessRestrictionAdvisory />);
    const text = document.body.textContent ?? '';
    expect(text.toLowerCase()).toContain('la guaira');
    expect(text.toLowerCase()).toMatch(/permiso especial|salvoconducto/);
  });

  it('mentions registering at the Poliedro de Caracas', () => {
    render(<AccessRestrictionAdvisory />);
    const text = document.body.textContent ?? '';
    expect(text.toLowerCase()).toContain('poliedro de caracas');
  });

  it('includes the attribution date 26 de junio de 2026 or 26 jun 2026', () => {
    render(<AccessRestrictionAdvisory />);
    const text = document.body.textContent ?? '';
    expect(text.toLowerCase()).toMatch(/26 de junio de 2026|26 jun 2026/);
  });

  it('has no close, dismiss or hide button', () => {
    render(<AccessRestrictionAdvisory />);
    const buttons = screen.queryAllByRole('button');
    for (const btn of buttons) {
      const label = (btn.textContent ?? '').toLowerCase();
      expect(label).not.toMatch(/cerrar|dismiss|ocultar|close/);
    }
  });

  it('renders inside a complementary or region landmark', () => {
    render(<AccessRestrictionAdvisory />);
    const aside = screen.queryByRole('complementary');
    const region = screen.queryByRole('region');
    expect(aside ?? region).not.toBeNull();
  });

  it('has an aria-label distinct from SafetyBanner and RescueAdvisory', () => {
    render(<AccessRestrictionAdvisory />);
    const landmark =
      screen.queryByRole('complementary') ?? screen.queryByRole('region');
    const label = landmark?.getAttribute('aria-label') ?? '';
    expect(label).not.toBe('Aviso de seguridad');
    expect(label).not.toBe('Consejo de seguridad ciudadana');
    expect(label.length).toBeGreaterThan(0);
  });
});
