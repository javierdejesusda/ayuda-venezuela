/**
 * Shared query logic for the flat "pedidos" (needs) listing, used by both the
 * public REST route (`app/api/v1/pedidos/route.ts`) and the equivalent MCP
 * tool (`app/api/mcp/route.ts`), so the two surfaces can never drift.
 */
import { toPublicPedidoConZona } from '@/lib/api/public-shape';
import type { PublicPedidoConZona } from '@/lib/api/public-shape';
import { getStore } from '@/lib/data/store';
import type { LocationWithNeeds, NeedCategory, NeedRecord, NeedStatus, Urgency } from '@/lib/data/types';

export interface PedidoFilters {
  estado?: string;
  categoria?: NeedCategory;
  urgencia?: Urgency;
  status?: NeedStatus;
}

/**
 * Flattens needs across all zones matching `filters.estado`, applies the
 * need-level filters, then returns the requested page plus the total match
 * count (before slicing).
 */
export async function listPublicPedidos(
  filters: PedidoFilters,
  cursor: number,
  limit: number,
): Promise<{ data: PublicPedidoConZona[]; total: number }> {
  const locations = await getStore().listLocations(filters.estado ? { estado: filters.estado } : {});

  const matches: Array<{ loc: LocationWithNeeds; need: NeedRecord }> = [];
  for (const loc of locations) {
    for (const need of loc.needs) {
      if (filters.categoria && need.categoria !== filters.categoria) continue;
      if (filters.urgencia && need.urgencia !== filters.urgencia) continue;
      if (filters.status && need.status !== filters.status) continue;
      matches.push({ loc, need });
    }
  }

  const total = matches.length;
  const data = matches.slice(cursor, cursor + limit).map(({ loc, need }) => toPublicPedidoConZona(loc, need));
  return { data, total };
}
