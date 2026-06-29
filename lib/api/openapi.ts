/**
 * OpenAPI 3.1 contract for the public REST API (v1).
 *
 * Hand-authored and served verbatim at /api/v1/openapi.json. It is the formal,
 * versionable description of the public surface and the source the /api-docs
 * page renders. Enum lists reuse the domain constants so the contract cannot
 * drift from the values the app actually accepts.
 */
import {
  EMERGENCY_STATUSES,
  NEED_CATEGORIES,
  NEED_STATUSES,
  PERSONAS_ATRAPADAS,
  URGENCIES,
} from '@/lib/data/types';

const ubicacionSchema = {
  type: 'object',
  nullable: true,
  description: 'Coordenadas con precision reducida (~110m) para proteger la ubicacion exacta.',
  properties: {
    lat: { type: 'number' },
    lng: { type: 'number' },
    precisionAprox: { type: 'string', example: '~110m' },
  },
  required: ['lat', 'lng', 'precisionAprox'],
};

const contactoSchema = {
  type: 'object',
  nullable: true,
  description:
    'Contacto declarado por quien publico el reporte. Aparece UNICAMENTE en el endpoint de ' +
    'detalle GET /api/v1/zonas/{id}; la lista GET /api/v1/zonas nunca incluye este campo. ' +
    'Puede ser null cuando no se declaro contacto.',
  properties: {
    nombre: { type: 'string' },
    telefono: { type: 'string' },
  },
};

const resumenSchema = {
  type: 'object',
  properties: {
    totalPedidos: { type: 'integer' },
    pendientes: { type: 'integer' },
    enCamino: { type: 'integer' },
    cubiertos: { type: 'integer' },
    urgentes: { type: 'integer' },
  },
  required: ['totalPedidos', 'pendientes', 'enCamino', 'cubiertos', 'urgentes'],
};

const pedidoSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    categoria: { type: 'string', enum: [...NEED_CATEGORIES] },
    descripcion: { type: 'string' },
    cantidad: { type: 'string' },
    urgencia: { type: 'string', enum: [...URGENCIES] },
    status: { type: 'string', enum: [...NEED_STATUSES] },
    creadoEn: { type: 'string', format: 'date-time' },
    actualizadoEn: { type: 'string', format: 'date-time' },
  },
  required: ['id', 'categoria', 'descripcion', 'urgencia', 'status', 'creadoEn', 'actualizadoEn'],
};

const pedidoConZonaSchema = {
  allOf: [
    { $ref: '#/components/schemas/Pedido' },
    {
      type: 'object',
      properties: {
        zonaId: { type: 'string', format: 'uuid' },
        zonaNombre: { type: 'string' },
        ciudad: { type: 'string' },
        estado: { type: 'string' },
      },
      required: ['zonaId', 'zonaNombre', 'ciudad', 'estado'],
    },
  ],
};

const zonaSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    nombre: { type: 'string' },
    estado: { type: 'string' },
    ciudad: { type: 'string' },
    zona: { type: 'string' },
    ubicacion: { $ref: '#/components/schemas/Ubicacion' },
    status: { type: 'string', enum: [...EMERGENCY_STATUSES] },
    personasAtrapadas: { type: 'string', enum: [...PERSONAS_ATRAPADAS] },
    aceptaVoluntarios: { type: 'boolean' },
    fuenteReporte: { type: 'string', nullable: true },
    tipoConstruccion: { type: 'string', nullable: true },
    descripcion: { type: 'string' },
    contacto: {
      allOf: [{ $ref: '#/components/schemas/Contacto' }],
      description: 'Solo presente en el detalle GET /api/v1/zonas/{id}; ausente en la lista.',
    },
    fotos: { type: 'array', items: { type: 'string', format: 'uri' } },
    resumen: { $ref: '#/components/schemas/Resumen' },
    pedidos: { type: 'array', items: { $ref: '#/components/schemas/Pedido' } },
    creadoEn: { type: 'string', format: 'date-time' },
    actualizadoEn: { type: 'string', format: 'date-time' },
  },
  required: [
    'id',
    'nombre',
    'estado',
    'ciudad',
    'ubicacion',
    'status',
    'personasAtrapadas',
    'aceptaVoluntarios',
    'fuenteReporte',
    'tipoConstruccion',
    'fotos',
    'resumen',
    'pedidos',
    'creadoEn',
    'actualizadoEn',
  ],
};

const campanaSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    titulo: { type: 'string' },
    descripcion: { type: 'string' },
    url: { type: 'string', format: 'uri' },
    organizador: { type: 'string' },
    creadoEn: { type: 'string', format: 'date-time' },
    actualizadoEn: { type: 'string', format: 'date-time' },
  },
  required: ['id', 'titulo', 'descripcion', 'url', 'creadoEn', 'actualizadoEn'],
};

const statsSchema = {
  type: 'object',
  properties: {
    zonas: { type: 'integer' },
    zonasPorStatus: { type: 'object', additionalProperties: { type: 'integer' } },
    pedidosTotales: { type: 'integer' },
    pedidosAbiertos: { type: 'integer' },
    pedidosPorCategoria: { type: 'object', additionalProperties: { type: 'integer' } },
    pedidosPorUrgencia: { type: 'object', additionalProperties: { type: 'integer' } },
  },
  required: [
    'zonas',
    'zonasPorStatus',
    'pedidosTotales',
    'pedidosAbiertos',
    'pedidosPorCategoria',
    'pedidosPorUrgencia',
  ],
};

const errorSchema = {
  type: 'object',
  properties: {
    error: {
      type: 'object',
      properties: {
        code: { type: 'string' },
        message: { type: 'string' },
      },
      required: ['code', 'message'],
    },
  },
  required: ['error'],
};

const paginationSchema = {
  type: 'object',
  properties: {
    total: { type: 'integer' },
    nextCursor: { type: 'integer', nullable: true },
  },
  required: ['total', 'nextCursor'],
};

const estadoParam = {
  name: 'estado',
  in: 'query',
  required: false,
  schema: { type: 'string' },
  description: 'Filtra por estado de Venezuela.',
};

const limitParam = {
  name: 'limit',
  in: 'query',
  required: false,
  schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
  description: 'Tamano de pagina (maximo 100).',
};

const cursorParam = {
  name: 'cursor',
  in: 'query',
  required: false,
  schema: { type: 'integer', minimum: 0, default: 0 },
  description: 'Desplazamiento para paginar; usa el nextCursor de la respuesta anterior.',
};

export const openApiDocument = {
  openapi: '3.1.0',
  info: {
    title: 'Ayuda Venezuela API',
    version: '1.0.0',
    description:
      'API publica de solo lectura sobre zonas afectadas, pedidos de ayuda y campanas de ' +
      'recaudacion. Datos abiertos para mapas, dashboards e integraciones de coordinacion de ayuda.',
    license: { name: 'Datos abiertos' },
  },
  servers: [{ url: '/', description: 'Mismo host que la aplicacion' }],
  tags: [
    { name: 'Zonas', description: 'Zonas afectadas y sus pedidos de ayuda.' },
    { name: 'Pedidos', description: 'Necesidades de ayuda en lista plana.' },
    { name: 'Campanas', description: 'Campanas de recaudacion (GoFundMe).' },
    { name: 'Estadisticas', description: 'Conteos agregados.' },
  ],
  paths: {
    '/api/v1/zonas': {
      get: {
        tags: ['Zonas'],
        summary: 'Lista zonas afectadas',
        parameters: [
          estadoParam,
          { name: 'ciudad', in: 'query', required: false, schema: { type: 'string' } },
          {
            name: 'status',
            in: 'query',
            required: false,
            schema: { type: 'string', enum: [...EMERGENCY_STATUSES] },
          },
          {
            name: 'categoria',
            in: 'query',
            required: false,
            schema: { type: 'string', enum: [...NEED_CATEGORIES] },
          },
          {
            name: 'urgencia',
            in: 'query',
            required: false,
            schema: { type: 'string', enum: [...URGENCIES] },
          },
          { name: 'texto', in: 'query', required: false, schema: { type: 'string' } },
          {
            name: 'soloConPedidos',
            in: 'query',
            required: false,
            schema: { type: 'boolean' },
            description: 'Si es true, excluye zonas sin pedidos abiertos.',
          },
          limitParam,
          cursorParam,
        ],
        responses: {
          '200': {
            description: 'Pagina de zonas.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/Zona' } },
                    pagination: { $ref: '#/components/schemas/Pagination' },
                  },
                  required: ['data', 'pagination'],
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/zonas/{id}': {
      get: {
        tags: ['Zonas'],
        summary: 'Obtiene una zona por id',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': {
            description: 'La zona solicitada.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { data: { $ref: '#/components/schemas/Zona' } },
                  required: ['data'],
                },
              },
            },
          },
          '404': {
            description: 'Zona no encontrada.',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Error' } },
            },
          },
        },
      },
    },
    '/api/v1/pedidos': {
      get: {
        tags: ['Pedidos'],
        summary: 'Lista pedidos de ayuda (plano)',
        parameters: [
          estadoParam,
          {
            name: 'categoria',
            in: 'query',
            required: false,
            schema: { type: 'string', enum: [...NEED_CATEGORIES] },
          },
          {
            name: 'urgencia',
            in: 'query',
            required: false,
            schema: { type: 'string', enum: [...URGENCIES] },
          },
          {
            name: 'status',
            in: 'query',
            required: false,
            schema: { type: 'string', enum: [...NEED_STATUSES] },
          },
          limitParam,
          cursorParam,
        ],
        responses: {
          '200': {
            description: 'Pagina de pedidos con contexto de su zona.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/PedidoConZona' } },
                    pagination: { $ref: '#/components/schemas/Pagination' },
                  },
                  required: ['data', 'pagination'],
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/campanas': {
      get: {
        tags: ['Campanas'],
        summary: 'Lista campanas de recaudacion',
        responses: {
          '200': {
            description: 'Campanas activas.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/Campana' } },
                    pagination: { $ref: '#/components/schemas/Pagination' },
                  },
                  required: ['data', 'pagination'],
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/estadisticas': {
      get: {
        tags: ['Estadisticas'],
        summary: 'Conteos agregados',
        responses: {
          '200': {
            description: 'Estadisticas globales.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { data: { $ref: '#/components/schemas/Stats' } },
                  required: ['data'],
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      Ubicacion: ubicacionSchema,
      Contacto: contactoSchema,
      Resumen: resumenSchema,
      Pedido: pedidoSchema,
      PedidoConZona: pedidoConZonaSchema,
      Zona: zonaSchema,
      Campana: campanaSchema,
      Stats: statsSchema,
      Pagination: paginationSchema,
      Error: errorSchema,
    },
  },
} as const;

export type OpenApiDocument = typeof openApiDocument;
