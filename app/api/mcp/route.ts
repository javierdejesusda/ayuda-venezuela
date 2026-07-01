/**
 * MCP server exposing the same read-only public data as the REST API v1
 * (`/app/api/v1/**`). Tools call the same store queries and DTO builders the
 * REST routes use, so the two surfaces can never drift apart. Streamable HTTP
 * only (no SSE, per the current MCP spec) at a single fixed path.
 *
 * Each tool's handler is exported as a plain async function (not inlined into
 * `registerTool`) so it can be unit-tested directly, the same way the REST
 * route handlers in `app/api/v1/**` are tested without going through the HTTP
 * transport.
 */
import { createMcpHandler } from 'mcp-handler';
import { z } from 'zod';

import { clampPagination, parseUuid } from '@/lib/api/params';
import { listPublicPedidos } from '@/lib/api/pedidos';
import { buildPublicStats, toPublicCampana, toPublicZona } from '@/lib/api/public-shape';
import { getStore } from '@/lib/data/store';
import {
  EMERGENCY_STATUSES,
  NEED_CATEGORIES,
  NEED_STATUSES,
  URGENCIES,
} from '@/lib/data/types';
import type { LocationFilters } from '@/lib/data/types';

interface ToolResult {
  [key: string]: unknown;
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

/** A single `{ type: 'text' }` tool result carrying a JSON-encoded payload. */
function jsonResult(payload: unknown): ToolResult {
  return { content: [{ type: 'text', text: JSON.stringify(payload) }] };
}

/** Same non-leaking contract as `withApiError`: never surface the raw error. */
function errorResult(message: string): ToolResult {
  return { content: [{ type: 'text', text: message }], isError: true };
}

/** Wraps a tool handler so a store/Supabase failure becomes a safe error result. */
function withToolError<A extends unknown[]>(
  handler: (...args: A) => Promise<ToolResult>,
) {
  return async (...args: A) => {
    try {
      return await handler(...args);
    } catch {
      return errorResult('Error interno.');
    }
  };
}

const paginationShape = {
  cursor: z.number().int().min(0).optional().describe('Desplazamiento para paginar.'),
  limit: z.number().int().min(1).max(100).optional().describe('Tamano de pagina (maximo 100).'),
};

interface PaginationArgs {
  cursor?: number;
  limit?: number;
}

interface ListZonasArgs extends PaginationArgs {
  estado?: string;
  ciudad?: string;
  status?: (typeof EMERGENCY_STATUSES)[number];
  categoria?: (typeof NEED_CATEGORIES)[number];
  urgencia?: (typeof URGENCIES)[number];
  texto?: string;
  soloConPedidos?: boolean;
}

export const listZonasTool = withToolError(
  async ({ estado, ciudad, status, categoria, urgencia, texto, soloConPedidos, cursor, limit }: ListZonasArgs) => {
    const filters: LocationFilters = {};
    if (estado) filters.estado = estado;
    if (ciudad) filters.ciudad = ciudad;
    if (status) filters.status = status;
    if (categoria) filters.categoria = categoria;
    if (urgencia) filters.urgencia = urgencia;
    if (texto) filters.texto = texto;
    if (soloConPedidos) filters.soloConPedidos = true;

    const { cursor: safeCursor, limit: safeLimit } = clampPagination(cursor, limit);
    const { items, total } = await getStore().listLocationsPage(filters, safeCursor, safeLimit);
    const data = items.map((loc) => toPublicZona(loc));
    const nextCursor = safeCursor + items.length < total ? safeCursor + items.length : null;
    return jsonResult({ data, pagination: { total, nextCursor } });
  },
);

export const getZonaTool = withToolError(async ({ id }: { id: string }) => {
  const uuid = parseUuid(id);
  if (!uuid) return errorResult('Zona no encontrada.');
  const location = await getStore().getLocation(uuid);
  if (!location) return errorResult('Zona no encontrada.');
  return jsonResult({ data: toPublicZona(location, true) });
});

interface ListPedidosArgs extends PaginationArgs {
  estado?: string;
  categoria?: (typeof NEED_CATEGORIES)[number];
  urgencia?: (typeof URGENCIES)[number];
  status?: (typeof NEED_STATUSES)[number];
}

export const listPedidosTool = withToolError(
  async ({ estado, categoria, urgencia, status, cursor, limit }: ListPedidosArgs) => {
    const { cursor: safeCursor, limit: safeLimit } = clampPagination(cursor, limit);
    const { data, total } = await listPublicPedidos({ estado, categoria, urgencia, status }, safeCursor, safeLimit);
    const nextCursor = safeCursor + data.length < total ? safeCursor + data.length : null;
    return jsonResult({ data, pagination: { total, nextCursor } });
  },
);

export const listCampanasTool = withToolError(async () => {
  const campanas = (await getStore().listFundraisers()).map(toPublicCampana);
  return jsonResult({ data: campanas, pagination: { total: campanas.length, nextCursor: null } });
});

export const getEstadisticasTool = withToolError(async () => {
  const locations = await getStore().listLocations();
  return jsonResult({ data: buildPublicStats(locations) });
});

const handler = createMcpHandler(
  (server) => {
    server.registerTool(
      'list_zonas',
      {
        title: 'Listar zonas afectadas',
        description:
          'Lista zonas afectadas por el terremoto en Venezuela, con estado estructural, ' +
          'ubicacion aproximada y sus pedidos de ayuda. Equivalente a GET /api/v1/zonas.',
        inputSchema: {
          estado: z.string().optional().describe('Filtra por estado de Venezuela.'),
          ciudad: z.string().optional().describe('Filtra por ciudad.'),
          status: z.enum(EMERGENCY_STATUSES).optional().describe('Filtra por estado estructural.'),
          categoria: z.enum(NEED_CATEGORIES).optional().describe('Filtra zonas con un pedido de esta categoria.'),
          urgencia: z.enum(URGENCIES).optional().describe('Filtra zonas con un pedido de esta urgencia.'),
          texto: z.string().optional().describe('Busca por texto libre en nombre/descripcion.'),
          soloConPedidos: z.boolean().optional().describe('Si es true, excluye zonas sin pedidos abiertos.'),
          ...paginationShape,
        },
      },
      listZonasTool,
    );

    server.registerTool(
      'get_zona',
      {
        title: 'Obtener zona por id',
        description:
          'Obtiene el detalle de una zona afectada por su id, incluyendo el contacto del ' +
          'reportero. Equivalente a GET /api/v1/zonas/{id}.',
        inputSchema: {
          id: z.string().describe('UUID de la zona.'),
        },
      },
      getZonaTool,
    );

    server.registerTool(
      'list_pedidos',
      {
        title: 'Listar pedidos de ayuda',
        description:
          'Lista, en formato plano, los pedidos de ayuda (agua, alimentos, medicinas, etc.) de ' +
          'todas las zonas, con el contexto minimo de su zona. Equivalente a GET /api/v1/pedidos.',
        inputSchema: {
          estado: z.string().optional().describe('Filtra por estado de Venezuela.'),
          categoria: z.enum(NEED_CATEGORIES).optional(),
          urgencia: z.enum(URGENCIES).optional(),
          status: z.enum(NEED_STATUSES).optional(),
          ...paginationShape,
        },
      },
      listPedidosTool,
    );

    server.registerTool(
      'list_campanas',
      {
        title: 'Listar campanas de recaudacion',
        description:
          'Lista las campanas de recaudacion de fondos (GoFundMe) registradas. Equivalente a ' +
          'GET /api/v1/campanas.',
        inputSchema: {},
      },
      listCampanasTool,
    );

    server.registerTool(
      'get_estadisticas',
      {
        title: 'Obtener estadisticas agregadas',
        description:
          'Devuelve conteos agregados de zonas y pedidos (por estado estructural, categoria y ' +
          'urgencia). Equivalente a GET /api/v1/estadisticas.',
        inputSchema: {},
      },
      getEstadisticasTool,
    );
  },
  {},
  { basePath: '/api', disableSse: true },
);

export { handler as GET, handler as POST };
