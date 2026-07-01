/**
 * Illustrative seed data for demo mode. These are realistic zones from the
 * areas hit by the June 24, 2026 earthquake, used only to make the UI usable
 * before a shared Supabase backend is connected. They are clearly example data.
 */
import type { Fundraiser, LocationRecord, NeedRecord } from './types';

const QUAKE = '2026-06-24T22:10:00Z';
const recent = '2026-06-25T11:30:00Z';

/**
 * Zone ids are real UUIDs (not `seed-*` slugs) so `GET /api/v1/zonas/{id}`
 * and the `get_zona` MCP tool -- which both reject non-UUID ids via
 * `parseUuid` before ever hitting the store -- can resolve seeded zones the
 * same way they resolve production (Supabase-generated) rows.
 */
const ZONE_IDS = {
  sanbernardino: '005eb5b3-99f0-4b69-bcde-8c55812912aa',
  altamira: 'd64d1287-01fb-4f4a-bb15-cabc59b5ff26',
  puertocabello: '6c109ab2-acd7-42dd-8ce5-fb3e0cfd4043',
  moron: '2746d7b1-7023-4ed6-9ba0-ba16ddc6770a',
  sanfelipe: '68dbbf71-8eb2-4edd-84dc-fd07e9db023a',
  yumare: 'ab1d2847-c8b9-4908-b49e-4ba028812fe7',
  maracay: 'b0df31a8-c841-4f2c-973a-6964849c6aa7',
  catialamar: 'e145708a-a067-4d5f-bfe7-49cc6e291678',
  losteques: '78eefc37-0903-4a15-84b3-1af042479396',
} as const;

const locations: LocationRecord[] = [
  {
    id: ZONE_IDS.sanbernardino,
    nombre: 'Edificio residencial San Bernardino',
    estado: 'Distrito Capital',
    ciudad: 'Caracas',
    zona: 'San Bernardino',
    lat: 10.5065,
    lng: -66.895,
    status: 'derrumbe',
    descripcion:
      'Colapso parcial de un edificio de 8 pisos. Vecinos reportan personas posiblemente atrapadas. Se necesita apoyo de rescate y maquinaria.',
    contactoNombre: 'Comité de vecinos',
    contactoTelefono: '0212-545-45-45',
    createdAt: QUAKE,
    updatedAt: recent,
  },
  {
    id: ZONE_IDS.altamira,
    nombre: 'Plaza Altamira - punto de acopio',
    estado: 'Miranda',
    ciudad: 'Caracas',
    zona: 'Altamira',
    lat: 10.4969,
    lng: -66.8443,
    status: 'dano_parcial',
    descripcion:
      'Punto de acopio comunitario activo. Reciben agua, alimentos no perecederos y artículos de higiene para distribuir a las zonas más afectadas.',
    createdAt: QUAKE,
    updatedAt: recent,
  },
  {
    id: ZONE_IDS.puertocabello,
    nombre: 'Casco central de Puerto Cabello',
    estado: 'Carabobo',
    ciudad: 'Puerto Cabello',
    zona: 'Casco histórico',
    lat: 10.4658,
    lng: -68.0125,
    status: 'derrumbe',
    descripcion:
      'Varias viviendas antiguas colapsadas cerca de la costa. Familias damnificadas necesitan refugio temporal y agua potable.',
    createdAt: QUAKE,
    updatedAt: recent,
  },
  {
    id: ZONE_IDS.moron,
    nombre: 'Sector La Cabrera, Morón',
    estado: 'Carabobo',
    ciudad: 'Morón',
    zona: 'La Cabrera',
    lat: 10.4865,
    lng: -68.1936,
    status: 'dano_grave',
    descripcion:
      'Zona cercana al epicentro. Cortes de electricidad y agua. Se requiere apoyo médico y baterías/energía.',
    createdAt: QUAKE,
    updatedAt: recent,
  },
  {
    id: ZONE_IDS.sanfelipe,
    nombre: 'San Felipe centro',
    estado: 'Yaracuy',
    ciudad: 'San Felipe',
    zona: 'Centro',
    lat: 10.3399,
    lng: -68.7428,
    status: 'derrumbe',
    descripcion:
      'Ciudad muy cercana al epicentro. Daños estructurales graves. Hospital saturado. Urgente apoyo de rescate, medicinas y agua.',
    contactoNombre: 'Protección Civil Yaracuy',
    contactoTelefono: '0254-7992628',
    createdAt: QUAKE,
    updatedAt: recent,
  },
  {
    id: ZONE_IDS.yumare,
    nombre: 'Yumare',
    estado: 'Yaracuy',
    ciudad: 'Yumare',
    zona: 'Casco central',
    lat: 10.6177,
    lng: -68.692,
    status: 'dano_grave',
    descripcion:
      'Localidad junto al epicentro del sismo principal. Viviendas agrietadas. Familias durmiendo a la intemperie.',
    createdAt: QUAKE,
    updatedAt: recent,
  },
  {
    id: ZONE_IDS.maracay,
    nombre: 'Maracay - Hospital Central',
    estado: 'Aragua',
    ciudad: 'Maracay',
    zona: 'Centro',
    lat: 10.2353,
    lng: -67.5911,
    status: 'dano_parcial',
    descripcion:
      'Hospital operativo recibiendo heridos de varias zonas. Necesitan insumos médicos y donantes de sangre.',
    contactoNombre: 'Cruz Roja Maracay',
    contactoTelefono: '0243-553-2629',
    createdAt: QUAKE,
    updatedAt: recent,
  },
  {
    id: ZONE_IDS.catialamar,
    nombre: 'Catia La Mar',
    estado: 'La Guaira',
    ciudad: 'Catia La Mar',
    zona: 'Atlántida',
    lat: 10.5996,
    lng: -67.0258,
    status: 'desconocido',
    descripcion:
      'Daños en viviendas de la zona costera. Se organiza acopio de ropa, mantas y alimentos.',
    createdAt: QUAKE,
    updatedAt: recent,
  },
  {
    id: ZONE_IDS.losteques,
    nombre: 'Los Teques - albergue municipal',
    estado: 'Miranda',
    ciudad: 'Los Teques',
    zona: 'Centro',
    lat: 10.3411,
    lng: -67.0406,
    status: 'estable',
    descripcion:
      'Albergue habilitado para familias desplazadas. Estable y con capacidad. Reciben voluntarios y alimentos.',
    createdAt: QUAKE,
    updatedAt: recent,
  },
];

const needs: NeedRecord[] = [
  // San Bernardino (derrumbe)
  { id: 'sn-1', locationId: ZONE_IDS.sanbernardino, categoria: 'rescate', descripcion: 'Equipos y voluntarios para remoción de escombros', cantidad: 'Urgente', urgencia: 'alta', status: 'pendiente', createdAt: QUAKE, updatedAt: recent },
  { id: 'sn-2', locationId: ZONE_IDS.sanbernardino, categoria: 'agua', descripcion: 'Agua potable para familias evacuadas', cantidad: '200 litros', urgencia: 'alta', status: 'en_camino', createdAt: QUAKE, updatedAt: recent },
  { id: 'sn-3', locationId: ZONE_IDS.sanbernardino, categoria: 'medicinas', descripcion: 'Botiquines y analgésicos', urgencia: 'media', status: 'pendiente', createdAt: QUAKE, updatedAt: recent },

  // Altamira (acopio)
  { id: 'al-1', locationId: ZONE_IDS.altamira, categoria: 'alimentos', descripcion: 'Alimentos no perecederos', cantidad: 'Lo que puedas', urgencia: 'media', status: 'pendiente', createdAt: QUAKE, updatedAt: recent },
  { id: 'al-2', locationId: ZONE_IDS.altamira, categoria: 'higiene', descripcion: 'Kits de higiene personal', urgencia: 'baja', status: 'pendiente', createdAt: QUAKE, updatedAt: recent },

  // Puerto Cabello (derrumbe)
  { id: 'pc-1', locationId: ZONE_IDS.puertocabello, categoria: 'refugio', descripcion: 'Carpas y espacios de refugio temporal', cantidad: '15 familias', urgencia: 'alta', status: 'pendiente', createdAt: QUAKE, updatedAt: recent },
  { id: 'pc-2', locationId: ZONE_IDS.puertocabello, categoria: 'agua', descripcion: 'Agua potable', urgencia: 'alta', status: 'pendiente', createdAt: QUAKE, updatedAt: recent },
  { id: 'pc-3', locationId: ZONE_IDS.puertocabello, categoria: 'ropa', descripcion: 'Ropa y calzado para niños y adultos', urgencia: 'media', status: 'en_camino', createdAt: QUAKE, updatedAt: recent },

  // Morón (dañado)
  { id: 'mo-1', locationId: ZONE_IDS.moron, categoria: 'energia', descripcion: 'Plantas eléctricas, baterías y linternas', urgencia: 'media', status: 'pendiente', createdAt: QUAKE, updatedAt: recent },
  { id: 'mo-2', locationId: ZONE_IDS.moron, categoria: 'medicinas', descripcion: 'Medicinas para crónicos (hipertensión, diabetes)', urgencia: 'alta', status: 'pendiente', createdAt: QUAKE, updatedAt: recent },

  // San Felipe (derrumbe, crítico)
  { id: 'sf-1', locationId: ZONE_IDS.sanfelipe, categoria: 'rescate', descripcion: 'Brigadas de rescate y perros entrenados', urgencia: 'alta', status: 'pendiente', createdAt: QUAKE, updatedAt: recent },
  { id: 'sf-2', locationId: ZONE_IDS.sanfelipe, categoria: 'medicinas', descripcion: 'Insumos médicos y material de curación', cantidad: 'Hospital saturado', urgencia: 'alta', status: 'pendiente', createdAt: QUAKE, updatedAt: recent },
  { id: 'sf-3', locationId: ZONE_IDS.sanfelipe, categoria: 'agua', descripcion: 'Agua potable y bidones', urgencia: 'alta', status: 'en_camino', createdAt: QUAKE, updatedAt: recent },
  { id: 'sf-4', locationId: ZONE_IDS.sanfelipe, categoria: 'alimentos', descripcion: 'Comida para albergues', urgencia: 'media', status: 'pendiente', createdAt: QUAKE, updatedAt: recent },

  // Yumare (dañado)
  { id: 'yu-1', locationId: ZONE_IDS.yumare, categoria: 'refugio', descripcion: 'Carpas y mantas, familias a la intemperie', urgencia: 'alta', status: 'pendiente', createdAt: QUAKE, updatedAt: recent },
  { id: 'yu-2', locationId: ZONE_IDS.yumare, categoria: 'alimentos', descripcion: 'Agua y alimentos', urgencia: 'media', status: 'pendiente', createdAt: QUAKE, updatedAt: recent },

  // Maracay (hospital)
  { id: 'ma-1', locationId: ZONE_IDS.maracay, categoria: 'medicinas', descripcion: 'Insumos médicos y donantes de sangre', urgencia: 'alta', status: 'en_camino', createdAt: QUAKE, updatedAt: recent },
  { id: 'ma-2', locationId: ZONE_IDS.maracay, categoria: 'transporte', descripcion: 'Vehículos para traslado de heridos', urgencia: 'media', status: 'pendiente', createdAt: QUAKE, updatedAt: recent },

  // Catia La Mar (dañado)
  { id: 'cl-1', locationId: ZONE_IDS.catialamar, categoria: 'ropa', descripcion: 'Ropa, mantas y cobijas', urgencia: 'media', status: 'pendiente', createdAt: QUAKE, updatedAt: recent },
  { id: 'cl-2', locationId: ZONE_IDS.catialamar, categoria: 'alimentos', descripcion: 'Alimentos no perecederos', urgencia: 'baja', status: 'pendiente', createdAt: QUAKE, updatedAt: recent },

  // Los Teques (albergue estable)
  { id: 'lt-1', locationId: ZONE_IDS.losteques, categoria: 'alimentos', descripcion: 'Comida preparada para 80 personas', urgencia: 'media', status: 'cubierto', createdAt: QUAKE, updatedAt: recent },
  { id: 'lt-2', locationId: ZONE_IDS.losteques, categoria: 'otro', descripcion: 'Voluntarios para organizar el albergue', urgencia: 'baja', status: 'en_camino', createdAt: QUAKE, updatedAt: recent },
];

const fundraisers: Fundraiser[] = [
  {
    id: 'seed-recaudacion-terremoto',
    titulo: 'Ayuda de emergencia para víctimas del terremoto en Venezuela',
    descripcion:
      'Campaña en GoFundMe para apoyar a las familias afectadas por el terremoto en Venezuela. Los aportes ayudan a cubrir alimentos, refugio temporal y atención médica.',
    url: 'https://gofundme.com/f/emergency-relief-for-venezuela-earthquake-victims',
    createdAt: QUAKE,
    updatedAt: recent,
  },
];

export const SEED: {
  locations: LocationRecord[];
  needs: NeedRecord[];
  fundraisers: Fundraiser[];
} = {
  locations,
  needs,
  fundraisers,
};
