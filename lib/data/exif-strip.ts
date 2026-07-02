/**
 * Client-side photo metadata stripping. Phone cameras embed EXIF data in the
 * JPEGs they produce, and that data routinely includes the exact GPS
 * coordinates where the photo was taken. The fotos Storage bucket is public and
 * serves the original bytes, so leaving EXIF in place would publish the precise
 * location of whoever appears in a report photo - a real risk for vulnerable
 * people. Stripping runs in the browser before upload, on the picked file.
 *
 * Only JPEG is rewritten here. It is the format phone cameras (and iOS, which
 * hands the file input a JPEG) use for the geotagged photos that matter most.
 * PNG/WebP/HEIC are passed through untouched; see the Storage bucket audit for
 * the residual-risk discussion and the canvas re-encode recommendation.
 */

/** JPEG start-of-image marker (FF D8). */
const SOI_0 = 0xff;
const SOI_1 = 0xd8;

/** Start-of-scan: everything after it is entropy-coded image data. */
const SOS = 0xda;
/** End-of-image. */
const EOI = 0xd9;

/**
 * Markers that carry metadata rather than image data: every application segment
 * (APP0-APP15, FF E0-FF EF, which hold EXIF/GPS, XMP, IPTC, ICC, and the JFIF
 * header) plus the comment segment (COM, FF FE).
 */
function isMetadataMarker(marker: number): boolean {
  return (marker >= 0xe0 && marker <= 0xef) || marker === 0xfe;
}

/**
 * Markers that stand alone with no length field or payload: TEM (FF 01) and the
 * restart markers RST0-RST7 (FF D0-FF D7).
 */
function isStandaloneMarker(marker: number): boolean {
  return marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7);
}

/**
 * Removes every metadata segment from a JPEG byte stream, returning a new JPEG
 * whose compressed image data is identical. Input that is not a JPEG (missing
 * the SOI marker) is returned unchanged, and malformed framing is copied
 * through verbatim rather than throwing, so a report photo is never corrupted.
 *
 * @param bytes Raw file contents.
 * @returns The JPEG bytes with APPn and COM segments removed.
 */
export function stripJpegMetadata(bytes: Uint8Array): Uint8Array {
  if (bytes.length < 2 || bytes[0] !== SOI_0 || bytes[1] !== SOI_1) {
    return bytes;
  }

  const out: number[] = [SOI_0, SOI_1];
  let i = 2;

  while (i < bytes.length) {
    if (bytes[i] !== 0xff) {
      // Not on a marker boundary: bail out and keep the remainder intact.
      for (let j = i; j < bytes.length; j++) out.push(bytes[j]);
      break;
    }

    const marker = bytes[i + 1];

    if (marker === SOS || marker === EOI) {
      // Scan data has no length field and can contain 0xFF bytes, so copy the
      // rest of the file verbatim once we reach it.
      for (let j = i; j < bytes.length; j++) out.push(bytes[j]);
      break;
    }

    if (isStandaloneMarker(marker)) {
      out.push(bytes[i], bytes[i + 1]);
      i += 2;
      continue;
    }

    const segmentLength = (bytes[i + 2] << 8) | bytes[i + 3];
    const nextIndex = i + 2 + segmentLength;
    if (segmentLength < 2 || nextIndex > bytes.length) {
      // Truncated or nonsensical length: copy the remainder and stop.
      for (let j = i; j < bytes.length; j++) out.push(bytes[j]);
      break;
    }

    if (!isMetadataMarker(marker)) {
      for (let j = i; j < nextIndex; j++) out.push(bytes[j]);
    }
    i = nextIndex;
  }

  return new Uint8Array(out);
}

/** True when the file is a JPEG by MIME type or by its SOI magic bytes. */
function isJpeg(file: File, head: Uint8Array): boolean {
  if (file.type === 'image/jpeg' || file.type === 'image/jpg') return true;
  return head.length >= 2 && head[0] === SOI_0 && head[1] === SOI_1;
}

/**
 * Strips identifying metadata from a picked photo before upload. JPEGs are
 * rewritten via {@link stripJpegMetadata}; anything else is returned as-is. Any
 * failure falls back to the original file: publishing a report photo (even with
 * metadata) matters more in an emergency than blocking the upload.
 *
 * @param file The user-selected image file.
 * @returns A file safe to upload - metadata removed when it is a JPEG.
 */
export async function stripImageMetadata(file: File): Promise<File> {
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!isJpeg(file, bytes)) return file;
    const stripped = stripJpegMetadata(bytes);
    if (stripped === bytes) return file;
    // Re-wrap so the File is backed by a plain ArrayBuffer (BlobPart's type).
    return new File([new Uint8Array(stripped)], file.name, {
      type: file.type || 'image/jpeg',
      lastModified: file.lastModified,
    });
  } catch {
    return file;
  }
}
