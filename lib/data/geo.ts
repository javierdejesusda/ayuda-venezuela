/**
 * Geographic helpers for mapping Venezuelan states to capital coordinates.
 *
 * Used by the map view to place approximate pins for zones that were reported
 * without explicit lat/lng coordinates.
 */

/** Centroid (state capital) coordinates for each Venezuelan federal entity. */
export const STATE_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  Amazonas: { lat: 5.6631, lng: -67.6256 },
  'Anzoátegui': { lat: 10.134, lng: -64.6836 },
  Apure: { lat: 7.889, lng: -67.4647 },
  Aragua: { lat: 10.2469, lng: -67.5958 },
  Barinas: { lat: 8.6231, lng: -70.2075 },
  'Bolívar': { lat: 8.1222, lng: -63.5497 },
  Carabobo: { lat: 10.162, lng: -68.0077 },
  Cojedes: { lat: 9.6611, lng: -68.5879 },
  'Delta Amacuro': { lat: 9.0606, lng: -62.0453 },
  'Distrito Capital': { lat: 10.4806, lng: -66.9036 },
  'Falcón': { lat: 11.4022, lng: -69.6736 },
  'Guárico': { lat: 9.9097, lng: -67.3539 },
  'La Guaira': { lat: 10.6019, lng: -66.9336 },
  Lara: { lat: 10.0647, lng: -69.3206 },
  'Mérida': { lat: 8.5897, lng: -71.1561 },
  Miranda: { lat: 10.3411, lng: -67.0406 },
  Monagas: { lat: 9.7457, lng: -63.1832 },
  'Nueva Esparta': { lat: 11.0339, lng: -63.8614 },
  Portuguesa: { lat: 9.0417, lng: -69.7333 },
  Sucre: { lat: 10.4537, lng: -64.1739 },
  'Táchira': { lat: 7.7669, lng: -72.225 },
  Trujillo: { lat: 9.3667, lng: -70.4333 },
  Yaracuy: { lat: 10.34, lng: -68.7425 },
  Zulia: { lat: 10.6427, lng: -71.6125 },
};

/**
 * Returns the centroid coordinates for a Venezuelan state, or null if unknown.
 */
export function stateCentroid(
  estado: string,
): { lat: number; lng: number } | null {
  return STATE_CENTROIDS[estado] ?? null;
}

/**
 * Resolves the best available map coordinates for a location.
 *
 * - If exact lat/lng are present, returns them with approximate=false.
 * - If either is null, falls back to the estado centroid with approximate=true.
 * - If neither exact coords nor a known estado centroid exist, returns null.
 */
export function resolveMapCoords(loc: {
  lat: number | null;
  lng: number | null;
  estado: string;
}): { lat: number; lng: number; approximate: boolean } | null {
  if (loc.lat !== null && loc.lng !== null) {
    return { lat: loc.lat, lng: loc.lng, approximate: false };
  }
  const centroid = stateCentroid(loc.estado);
  if (centroid !== null) {
    return { ...centroid, approximate: true };
  }
  return null;
}
