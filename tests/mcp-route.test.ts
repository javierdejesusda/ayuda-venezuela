import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Fundraiser, LocationWithNeeds, NeedRecord } from '@/lib/data/types';

const mockListLocationsPage = vi.fn();
const mockListLocations = vi.fn();
const mockGetLocation = vi.fn();
const mockListFundraisers = vi.fn();

vi.mock('@/lib/data/store', () => ({
  getStore: () => ({
    isDemo: false,
    listLocations: mockListLocations,
    listLocationsPage: mockListLocationsPage,
    getLocation: mockGetLocation,
    createLocation: vi.fn(),
    updateLocationStatus: vi.fn(),
    createNeed: vi.fn(),
    updateNeedStatus: vi.fn(),
    listFundraisers: mockListFundraisers,
    createFundraiser: vi.fn(),
    checkReportQuota: vi.fn(),
    getClusterForLocation: vi.fn(),
  }),
  PAGE_SIZE: 20,
}));

import {
  getEstadisticasTool,
  getZonaTool,
  listCampanasTool,
  listPedidosTool,
  listZonasTool,
} from '@/app/api/mcp/route';

function need(over: Partial<NeedRecord> = {}): NeedRecord {
  return {
    id: 'n1',
    locationId: 'l1',
    categoria: 'agua',
    descripcion: 'Agua potable',
    urgencia: 'media',
    status: 'pendiente',
    createdAt: '2026-06-25T00:00:00Z',
    updatedAt: '2026-06-25T00:00:00Z',
    ...over,
  };
}

function loc(id: string, over: Partial<LocationWithNeeds> = {}): LocationWithNeeds {
  return {
    id,
    nombre: `Zona ${id}`,
    estado: 'Carabobo',
    ciudad: 'Valencia',
    lat: 10.123456,
    lng: -66.987654,
    status: 'dano_parcial',
    contactoNombre: 'Ana',
    contactoTelefono: '+58 412 1112233',
    fotos: [],
    createdAt: '2026-06-25T00:00:00Z',
    updatedAt: '2026-06-25T00:00:00Z',
    needs: [],
    summary: { total: 0, pendientes: 0, enCamino: 0, cubiertos: 0, urgentes: 0 },
    ...over,
  };
}

function textOf(result: { content: Array<{ text: string }> }): unknown {
  return JSON.parse(result.content[0].text);
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe('list_zonas tool', () => {
  it('returns a data envelope of public zonas with pagination', async () => {
    mockListLocationsPage.mockResolvedValue({ items: [loc('l1')], total: 1 });
    const result = await listZonasTool({});
    const body = textOf(result) as { data: Array<{ id: string }>; pagination: unknown };
    expect(body.data).toHaveLength(1);
    expect(body.data[0].id).toBe('l1');
    expect(body.pagination).toEqual({ total: 1, nextCursor: null });
  });

  it('never carries contacto PII on the bulk list', async () => {
    mockListLocationsPage.mockResolvedValue({ items: [loc('l1')], total: 1 });
    const result = await listZonasTool({});
    const body = textOf(result) as { data: Array<Record<string, unknown>> };
    expect(body.data[0]).not.toHaveProperty('contacto');
    expect(body.data[0]).not.toHaveProperty('contactoTelefono');
  });

  it('forwards filters and clamped pagination to the store', async () => {
    mockListLocationsPage.mockResolvedValue({ items: [], total: 0 });
    await listZonasTool({ estado: 'Carabobo', urgencia: 'alta', cursor: -5, limit: 500 });
    expect(mockListLocationsPage).toHaveBeenCalledWith(
      { estado: 'Carabobo', urgencia: 'alta' },
      0,
      100,
    );
  });

  it('returns a safe error result when the store throws', async () => {
    mockListLocationsPage.mockRejectedValue(new Error('supabase down'));
    const result = await listZonasTool({});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).not.toContain('supabase');
  });
});

describe('get_zona tool', () => {
  const id = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';

  it('returns a single public zona including contacto', async () => {
    mockGetLocation.mockResolvedValue(loc('l1', { needs: [need()] }));
    const result = await getZonaTool({ id });
    const body = textOf(result) as { data: { id: string; contacto: unknown } };
    expect(body.data.id).toBe('l1');
    expect(body.data.contacto).toEqual({ nombre: 'Ana', telefono: '+58 412 1112233' });
  });

  it('returns an error result for a malformed id without hitting the store', async () => {
    const result = await getZonaTool({ id: 'nope' });
    expect(result.isError).toBe(true);
    expect(mockGetLocation).not.toHaveBeenCalled();
  });

  it('returns an error result when the zona is missing', async () => {
    mockGetLocation.mockResolvedValue(null);
    const result = await getZonaTool({ id });
    expect(result.isError).toBe(true);
  });
});

describe('list_pedidos tool', () => {
  it('flattens needs across zonas with parent context', async () => {
    mockListLocations.mockResolvedValue([
      loc('l1', { needs: [need({ id: 'n1', categoria: 'agua' })] }),
      loc('l2', { needs: [need({ id: 'n2', categoria: 'medicinas' })] }),
    ]);
    const result = await listPedidosTool({});
    const body = textOf(result) as { data: Array<Record<string, unknown>>; pagination: { total: number } };
    expect(body.data).toHaveLength(2);
    expect(body.data[0]).toMatchObject({ id: 'n1', zonaId: 'l1', ciudad: 'Valencia' });
    expect(body.pagination.total).toBe(2);
  });

  it('filters by categoria at the need level', async () => {
    mockListLocations.mockResolvedValue([
      loc('l1', {
        needs: [need({ id: 'n1', categoria: 'agua' }), need({ id: 'n2', categoria: 'medicinas' })],
      }),
    ]);
    const result = await listPedidosTool({ categoria: 'medicinas' });
    const body = textOf(result) as { data: Array<{ id: string }> };
    expect(body.data).toHaveLength(1);
    expect(body.data[0].id).toBe('n2');
  });
});

describe('list_campanas tool', () => {
  it('returns public campanas', async () => {
    const f: Fundraiser = {
      id: 'f1',
      titulo: 'Ayuda',
      descripcion: 'Fondos',
      url: 'https://www.gofundme.com/f/x',
      createdAt: '2026-06-25T00:00:00Z',
      updatedAt: '2026-06-25T00:00:00Z',
    };
    mockListFundraisers.mockResolvedValue([f]);
    const result = await listCampanasTool();
    const body = textOf(result) as { data: Array<{ id: string }> };
    expect(body.data[0]).toMatchObject({ id: 'f1', url: 'https://www.gofundme.com/f/x' });
  });
});

describe('get_estadisticas tool', () => {
  it('returns aggregate counts', async () => {
    mockListLocations.mockResolvedValue([
      loc('l1', { status: 'derrumbe', needs: [need({ urgencia: 'alta' })] }),
    ]);
    const result = await getEstadisticasTool();
    const body = textOf(result) as { data: { zonas: number; pedidosTotales: number } };
    expect(body.data.zonas).toBe(1);
    expect(body.data.pedidosTotales).toBe(1);
  });
});
