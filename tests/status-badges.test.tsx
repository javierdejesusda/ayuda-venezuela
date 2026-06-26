// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { PersonasAtrapadasBadge, StatusBadge } from '@/components/status-badges';
import type { EmergencyStatus } from '@/lib/data/types';

afterEach(() => {
  cleanup();
});

describe('StatusBadge', () => {
  it('renders label "Daño grave" for dano_grave', () => {
    render(<StatusBadge status="dano_grave" />);
    expect(screen.getByText('Daño grave')).toBeTruthy();
  });

  it('renders label "Daño parcial" for dano_parcial', () => {
    render(<StatusBadge status="dano_parcial" />);
    expect(screen.getByText('Daño parcial')).toBeTruthy();
  });

  it('renders for derrumbe', () => {
    render(<StatusBadge status="derrumbe" />);
    expect(screen.getByText('Derrumbe')).toBeTruthy();
  });

  it('falls back to "Sin confirmar" for an unknown legacy status instead of throwing', () => {
    // A pre-severity-migration row can still carry the legacy 'danado' status,
    // which is no longer a key in statusMeta. The badge must degrade gracefully.
    const legacy = 'danado' as EmergencyStatus;
    expect(() => render(<StatusBadge status={legacy} />)).not.toThrow();
    expect(screen.getByText('Sin confirmar')).toBeTruthy();
  });
});

describe('PersonasAtrapadasBadge', () => {
  it('renders a life-safety indicator with caveat for "si"', () => {
    const { container } = render(<PersonasAtrapadasBadge value="si" />);
    expect(screen.getByText(/Personas atrapadas/i)).toBeTruthy();
    expect(container.textContent).toContain('Reporte ciudadano sin verificar');
    const link = screen.getByRole('link');
    expect(link.getAttribute('href')).toBe('/telefonos');
  });

  it('renders nothing for "no"', () => {
    const { container } = render(<PersonasAtrapadasBadge value="no" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing for "no_se"', () => {
    const { container } = render(<PersonasAtrapadasBadge value="no_se" />);
    expect(container.firstChild).toBeNull();
  });
});
