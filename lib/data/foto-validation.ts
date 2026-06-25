/**
 * Client-side guard for user-selected photos before they are uploaded. Keeping
 * the file-type and size rules in a pure function (out of the form component)
 * makes them unit-testable and keeps them in sync with the Storage bucket limit
 * (see the fotos migrations), which is the real server-side enforcement.
 */
import { MAX_FOTO_BYTES, MAX_FOTO_MB } from './types';

/** The subset of `File` this guard inspects, so plain objects can be tested. */
export interface FotoCandidate {
  type: string;
  size: number;
}

/**
 * Validates a single picked photo against the type and size rules.
 *
 * @param file The selected file's MIME type and byte size.
 * @returns A Spanish error message when the file is rejected, or `null` when it
 *   is acceptable.
 */
export function validateFotoFile(file: FotoCandidate): string | null {
  if (!file.type.startsWith('image/')) {
    return 'Solo se permiten imágenes.';
  }
  if (file.size > MAX_FOTO_BYTES) {
    return `Cada imagen debe pesar ${MAX_FOTO_MB} MB o menos.`;
  }
  return null;
}
