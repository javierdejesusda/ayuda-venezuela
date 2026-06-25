// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { LocationCard } from '@/components/location-card';
import type { LocationWithNeeds } from '@/lib/data/types';

function makeLocation(overrides: Partial<LocationWithNeeds> = {}): LocationWithNeeds {
  const ts = '2026-06-25T00:00:00.000Z';
  return {
    id: 'loc_1',
    nombre: 'San Felipe centro',
    estado: 'Yaracuy',
    ciudad: 'San Felipe',
    zona: 'Centro',
    lat: null,
    lng: null,
    status: 'derrumbe',
    descripcion: 'Ciudad muy cercana al epicentro. Daños estructurales graves.',
    fotos: [],
    createdAt: ts,
    updatedAt: ts,
    needs: [],
    summary: { total: 4, pendientes: 4, enCamino: 0, cubiertos: 0, urgentes: 3 },
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
});

describe('LocationCard', () => {
  it('renders the zone name, place and needs summary', () => {
    render(<LocationCard location={makeLocation()} />);
    expect(screen.getByText('San Felipe centro')).toBeInTheDocument();
    expect(screen.getByText('Centro, San Felipe, Yaracuy')).toBeInTheDocument();
    expect(screen.getByText(/necesidades/)).toBeInTheDocument();
  });

  it('lets the card shrink inside its grid track so it never overflows on mobile', () => {
    // CSS grid items default to `min-width: auto`, which expands the card to its
    // min-content width and breaks the inner truncate/line-clamp. The root link
    // must carry `min-w-0` so it can shrink to the column instead of overflowing.
    render(<LocationCard location={makeLocation()} />);
    const link = screen.getByRole('link', { name: /San Felipe centro/i });
    expect(link.className).toContain('min-w-0');
  });
});
