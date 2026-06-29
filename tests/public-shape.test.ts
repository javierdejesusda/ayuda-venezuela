import { describe, expect, it } from 'vitest';

import {
  buildPublicStats,
  roundCoord,
  toPublicCampana,
  toPublicPedido,
  toPublicPedidoConZona,
  toPublicZona,
} from '@/lib/api/public-shape';
import type { Fundraiser, LocationWithNeeds, NeedRecord } from '@/lib/data/types';

function need(over: Partial<NeedRecord> = {}): NeedRecord {
  return {
    id: 'n1',
    locationId: 'l1',
    categoria: 'agua',
    descripcion: 'Agua potable',
    urgencia: 'media',
    status: 'pendiente',
    createdAt: '2026-06-25T00:00:00Z',
    updatedAt: '2026-06-25T01:00:00Z',
    ...over,
  };
}

function loc(over: Partial<LocationWithNeeds> = {}): LocationWithNeeds {
  return {
    id: 'l1',
    nombre: 'Edificio 5',
    estado: 'Carabobo',
    ciudad: 'Valencia',
    zona: 'El Centro',
    lat: 10.1234567,
    lng: -66.9876543,
    status: 'dano_grave',
    personas_atrapadas: 'si',
    fuente_reporte: 'vecino',
    tipo_construccion: 'Edificio residencial',
    descripcion: 'Daños en la fachada',
    contactoNombre: 'Ana Reportera',
    contactoTelefono: '+58 412 1234567',
    fotos: ['https://example.com/a.jpg'],
    createdAt: '2026-06-25T00:00:00Z',
    updatedAt: '2026-06-25T02:00:00Z',
    needs: [need()],
    summary: { total: 1, pendientes: 1, enCamino: 0, cubiertos: 0, urgentes: 0 },
    ...over,
  };
}

describe('roundCoord', () => {
  it('rounds to 3 decimals (~110m)', () => {
    expect(roundCoord(10.1234567)).toBe(10.123);
    expect(roundCoord(-66.9876543)).toBe(-66.988);
  });

  it('handles whole numbers and zero', () => {
    expect(roundCoord(0)).toBe(0);
    expect(roundCoord(10)).toBe(10);
  });
});

describe('toPublicZona', () => {
  it('maps the core public fields with camelCase names', () => {
    const z = toPublicZona(loc());
    expect(z.id).toBe('l1');
    expect(z.nombre).toBe('Edificio 5');
    expect(z.estado).toBe('Carabobo');
    expect(z.ciudad).toBe('Valencia');
    expect(z.zona).toBe('El Centro');
    expect(z.status).toBe('dano_grave');
    expect(z.personasAtrapadas).toBe('si');
    expect(z.fuenteReporte).toBe('vecino');
    expect(z.tipoConstruccion).toBe('Edificio residencial');
    expect(z.descripcion).toBe('Daños en la fachada');
    expect(z.fotos).toEqual(['https://example.com/a.jpg']);
    expect(z.creadoEn).toBe('2026-06-25T00:00:00Z');
    expect(z.actualizadoEn).toBe('2026-06-25T02:00:00Z');
  });

  it('reduces coordinate precision to 3 decimals in ubicacion', () => {
    const z = toPublicZona(loc());
    expect(z.ubicacion).toEqual({ lat: 10.123, lng: -66.988, precisionAprox: '~110m' });
  });

  it('returns null ubicacion when coordinates are absent', () => {
    const z = toPublicZona(loc({ lat: null, lng: null }));
    expect(z.ubicacion).toBeNull();
  });

  it('omits the contacto key entirely by default (bulk surfaces never carry PII)', () => {
    const z = toPublicZona(loc());
    expect(z).not.toHaveProperty('contacto');
  });

  it('includes contacto only when includeContacto is true (detail endpoint)', () => {
    const z = toPublicZona(loc(), true);
    expect(z.contacto).toEqual({ nombre: 'Ana Reportera', telefono: '+58 412 1234567' });
  });

  it('returns null contacto when includeContacto is true and neither name nor phone exist', () => {
    const z = toPublicZona(loc({ contactoNombre: undefined, contactoTelefono: undefined }), true);
    expect(z.contacto).toBeNull();
  });

  it('omits the phone key when only a name exists and includeContacto is true', () => {
    const z = toPublicZona(loc({ contactoTelefono: undefined }), true);
    expect(z.contacto).toEqual({ nombre: 'Ana Reportera' });
  });

  it('maps the summary into resumen', () => {
    const z = toPublicZona(
      loc({ summary: { total: 4, pendientes: 2, enCamino: 1, cubiertos: 1, urgentes: 3 } }),
    );
    expect(z.resumen).toEqual({
      totalPedidos: 4,
      pendientes: 2,
      enCamino: 1,
      cubiertos: 1,
      urgentes: 3,
    });
  });

  it('maps needs into pedidos', () => {
    const z = toPublicZona(loc({ needs: [need({ id: 'n9', categoria: 'medicinas' })] }));
    expect(z.pedidos).toHaveLength(1);
    expect(z.pedidos[0].id).toBe('n9');
    expect(z.pedidos[0].categoria).toBe('medicinas');
  });

  it('defaults personasAtrapadas to no_se when absent', () => {
    const z = toPublicZona(loc({ personas_atrapadas: undefined }));
    expect(z.personasAtrapadas).toBe('no_se');
  });

  it('maps acepta_voluntarios to aceptaVoluntarios', () => {
    const z = toPublicZona(loc({ acepta_voluntarios: true }));
    expect(z.aceptaVoluntarios).toBe(true);
  });

  it('defaults aceptaVoluntarios to false when absent', () => {
    const z = toPublicZona(loc({ acepta_voluntarios: undefined }));
    expect(z.aceptaVoluntarios).toBe(false);
  });

  it('NEVER leaks source_ref or any field outside the allowlist', () => {
    const dirty = loc() as LocationWithNeeds & Record<string, unknown>;
    dirty.source_ref = 'https://terremotovenezuela.com/api/buildings/42';
    dirty.internal_note = 'cluster uuid 1234';
    dirty.key_hash = 'sha256...';
    const z = toPublicZona(dirty) as unknown as Record<string, unknown>;
    expect(z).not.toHaveProperty('source_ref');
    expect(z).not.toHaveProperty('internal_note');
    expect(z).not.toHaveProperty('key_hash');
    expect(z).not.toHaveProperty('accuracyM');
    expect(z).not.toHaveProperty('contactoTelefono');
    expect(z).not.toHaveProperty('contactoNombre');
  });

  it('omits optional zona and descripcion keys when absent', () => {
    const z = toPublicZona(loc({ zona: undefined, descripcion: undefined }));
    expect(z).not.toHaveProperty('zona');
    expect(z).not.toHaveProperty('descripcion');
  });
});

describe('toPublicPedido', () => {
  it('maps a need to the public pedido shape', () => {
    const p = toPublicPedido(need({ cantidad: '20 litros' }));
    expect(p).toEqual({
      id: 'n1',
      categoria: 'agua',
      descripcion: 'Agua potable',
      cantidad: '20 litros',
      urgencia: 'media',
      status: 'pendiente',
      creadoEn: '2026-06-25T00:00:00Z',
      actualizadoEn: '2026-06-25T01:00:00Z',
    });
  });

  it('omits cantidad when absent', () => {
    const p = toPublicPedido(need({ cantidad: undefined }));
    expect(p).not.toHaveProperty('cantidad');
  });

  it('does not leak locationId', () => {
    const p = toPublicPedido(need()) as unknown as Record<string, unknown>;
    expect(p).not.toHaveProperty('locationId');
  });
});

describe('toPublicPedidoConZona', () => {
  it('adds minimal parent zona context', () => {
    const p = toPublicPedidoConZona(loc(), need({ id: 'n3' }));
    expect(p.id).toBe('n3');
    expect(p.zonaId).toBe('l1');
    expect(p.zonaNombre).toBe('Edificio 5');
    expect(p.ciudad).toBe('Valencia');
    expect(p.estado).toBe('Carabobo');
  });

  it('does not leak contact PII from the parent zona', () => {
    const p = toPublicPedidoConZona(loc(), need()) as unknown as Record<string, unknown>;
    expect(p).not.toHaveProperty('contactoTelefono');
    expect(p).not.toHaveProperty('contactoNombre');
  });
});

describe('toPublicCampana', () => {
  function fundraiser(over: Partial<Fundraiser> = {}): Fundraiser {
    return {
      id: 'f1',
      titulo: 'Ayuda para Valencia',
      descripcion: 'Recaudación de fondos',
      url: 'https://www.gofundme.com/f/ayuda',
      organizador: 'Vecinos Unidos',
      createdAt: '2026-06-25T00:00:00Z',
      updatedAt: '2026-06-25T00:00:00Z',
      ...over,
    };
  }

  it('maps a fundraiser to the public campana shape', () => {
    const c = toPublicCampana(fundraiser());
    expect(c).toEqual({
      id: 'f1',
      titulo: 'Ayuda para Valencia',
      descripcion: 'Recaudación de fondos',
      url: 'https://www.gofundme.com/f/ayuda',
      organizador: 'Vecinos Unidos',
      creadoEn: '2026-06-25T00:00:00Z',
      actualizadoEn: '2026-06-25T00:00:00Z',
    });
  });

  it('omits organizador when absent', () => {
    const c = toPublicCampana(fundraiser({ organizador: undefined }));
    expect(c).not.toHaveProperty('organizador');
  });
});

describe('buildPublicStats', () => {
  it('aggregates zone status counts and need breakdowns', () => {
    const locations: LocationWithNeeds[] = [
      loc({
        id: 'a',
        status: 'derrumbe',
        needs: [
          need({ id: 'n1', categoria: 'rescate', urgencia: 'alta', status: 'pendiente' }),
          need({ id: 'n2', categoria: 'agua', urgencia: 'media', status: 'cubierto' }),
        ],
        summary: { total: 2, pendientes: 1, enCamino: 0, cubiertos: 1, urgentes: 1 },
      }),
      loc({
        id: 'b',
        status: 'estable',
        needs: [need({ id: 'n3', categoria: 'agua', urgencia: 'baja', status: 'en_camino' })],
        summary: { total: 1, pendientes: 0, enCamino: 1, cubiertos: 0, urgentes: 0 },
      }),
    ];
    const stats = buildPublicStats(locations);
    expect(stats.zonas).toBe(2);
    expect(stats.zonasPorStatus.derrumbe).toBe(1);
    expect(stats.zonasPorStatus.estable).toBe(1);
    expect(stats.pedidosTotales).toBe(3);
    expect(stats.pedidosAbiertos).toBe(2); // total - cubiertos
    expect(stats.pedidosPorCategoria.agua).toBe(2);
    expect(stats.pedidosPorCategoria.rescate).toBe(1);
    expect(stats.pedidosPorUrgencia.alta).toBe(1);
    expect(stats.pedidosPorUrgencia.media).toBe(1);
    expect(stats.pedidosPorUrgencia.baja).toBe(1);
  });

  it('returns zeroed counts for an empty list', () => {
    const stats = buildPublicStats([]);
    expect(stats.zonas).toBe(0);
    expect(stats.pedidosTotales).toBe(0);
    expect(stats.zonasPorStatus.derrumbe).toBe(0);
    expect(stats.pedidosPorCategoria.agua).toBe(0);
    expect(stats.pedidosPorUrgencia.alta).toBe(0);
  });
});
