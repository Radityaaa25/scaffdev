/**
 * Validasi file gambar nivels server — dipakai semua endpoint upload.
 * Prinsip: JANGAN percaya ekstensi nama file / header Content-Type dari client.
 * Hanya PNG/JPEG/WEBP asli (dicek via magic bytes). SVG/GIF/APNG ditolak
 * karena SVG bisa membawa JavaScript (XSS via <script>/<foreignObject>)
 * dan format animasi lain memperluas permukaan serangan tanpa manfaat.
 */

export type RasterImageKind = "png" | "jpg" | "webp";

const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPG_MAGIC = [0xff, 0xd8, 0xff];
const WEBP_RIFF = [0x52, 0x49, 0x46, 0x46];
const WEBP_WEBP = [0x57, 0x45, 0x42, 0x50];

function startsWith(buf: Uint8Array, magic: number[], offset = 0): boolean {
  if (buf.length < offset + magic.length) return false;
  return magic.every((b, i) => buf[offset + i] === b);
}

/** Deteksi tipe gambar raster dari magic bytes. Null = bukan png/jpg/webp valid. */
export function detectRasterImage(buf: Uint8Array): RasterImageKind | null {
  if (startsWith(buf, PNG_MAGIC)) return "png";
  if (startsWith(buf, JPG_MAGIC)) return "jpg";
  if (startsWith(buf, WEBP_RIFF) && startsWith(buf, WEBP_WEBP, 8)) return "webp";
  return null;
}

export function contentTypeFor(kind: RasterImageKind): string {
  return kind === "png" ? "image/png" : kind === "jpg" ? "image/jpeg" : "image/webp";
}

/**
 * Validasi penuh: ukuran + magic bytes.
 * Mengembalikan kind + contentType yang AMAN dipakai (bukan dari client).
 */
export function validateImageBytes(
  buf: Uint8Array,
  maxBytes: number
): { ok: true; kind: RasterImageKind; contentType: string } | { ok: false; error: string } {
  if (buf.length <= 0) return { ok: false, error: "File kosong." };
  if (buf.length > maxBytes) {
    const mb = (maxBytes / (1024 * 1024)).toString().replace(/\.0$/, "");
    return { ok: false, error: `Ukuran file maksimal ${mb}MB.` };
  }
  const kind = detectRasterImage(buf);
  if (!kind) {
    return { ok: false, error: "File bukan gambar png/jpg/webp yang valid. SVG, GIF, dan format lain ditolak demi keamanan." };
  }
  return { ok: true, kind, contentType: contentTypeFor(kind) };
}
