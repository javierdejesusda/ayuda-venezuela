// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { HomeExplorer } from '@/components/home-explorer';
import { PAGE_SIZE } from '@/lib/data/store';
import type { LocationWithNeeds } from '@/lib/data/types';

// Replace the heavy Leaflet map with a stub that simply reports how many pins
// it received, so we can assert the map gets the full server-loaded set.
vi.mock('@/components/map-view', () => ({
  default: ({ locations }: { locations: LocationWithNeeds[] }) => (
    <div data-testid="map-pin-count">{locations.length}</div>
  ),
}));

// Zones default to having one open need so they pass the ayuda soloConPedidos
// filter that seeded state applies on mount.
function loc(id: string, over: Partial<LocationWithNeeds> = {}): LocationWithNeeds {
  return {
    id,
    nombre: `Zona ${id}`,
    estado: 'Carabobo',
    ciudad: 'Valencia',
    lat: 10.2,
    lng: -67.6,
    status: 'dano_parcial',
    fotos: [],
    createdAt: '2026-06-24T22:10:00Z',
    updatedAt: '2026-06-24T22:10:00Z',
    needs: [],
    summary: { total: 1, pendientes: 1, enCamino: 0, cubiertos: 0, urgentes: 0 },
    ...over,
  };
}

function makeLocations(n: number): LocationWithNeeds[] {
  return Array.from({ length: n }, (_, i) => loc(`l${i + 1}`));
}

describe('HomeExplorer default list load', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    cleanup();
  });

  it('mounts the default list from embedded data without an uncached per-visitor fetch, and the embedded set still feeds the map', async () => {
    const full = makeLocations(PAGE_SIZE + 5); // 25 zones, more than one page

    render(
      <HomeExplorer
        initialLocations={full.slice(0, PAGE_SIZE)}
        initialMapLocations={full}
        initialTotal={full.length}
        states={['Carabobo']}
      />,
    );

    // The list (default view) paints from the embedded first page with no mount fetch.
    await act(async () => {});
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.queryByTestId('map-pin-count')).toBeNull();

    // Opening the map refreshes the full matching set; it shows every pin.
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ items: full, total: full.length, nextCursor: null }),
    });
    fireEvent.click(screen.getByRole('tab', { name: 'Mapa' }));

    const pinCount = await screen.findByTestId('map-pin-count');
    expect(pinCount.textContent).toBe(String(PAGE_SIZE + 5));
  });
});
