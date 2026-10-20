/**
 * Validasi file gambar di level server: dipakai semua endpoint upload.
 * Prinsip: JANGAN percaya ekstensi nama file / header Content-Type dari client.
 * Hanya PNG/JPEG/WEBP asli (dicek via magic bytes + struktur file). SVG/GIF/APNG
 * ditolak karena SVG bisa membawa JavaScript (XSS via <script>/<foreignObject>)
 * dan format animasi lain memperluas permukaan serangan tanpa manfaat.
 */

export type RasterImageKind = "png" | "jpg" | "webp";

const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPG_MAGIC = [0xff, 0xd8, 0xff];
const WEBP_RIFF = [0x52, 0x49, 0x46, 0x46];
const WEBP_WEBP = [0x57, 0x45, 0x42, 0x50];

const MAX_DIMENSION = 10_000;
const MAX_PIXELS = 40_000_000;

const JPEG_SOF = new Set([
  0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7,
  0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf,
]);

function startsWith(buf: Uint8Array, magic: number[], offset = 0): boolean {
  if (buf.length < offset + magic.length) return false;
  return magic.every((b, i) => buf[offset + i] === b);
}

function ascii(buf: Uint8Array, off: number, len: number): string {
  return String.fromCharCode(...buf.subarray(off, off + len));
}

function u16be(buf: Uint8Array, off: number): number {
  return (buf[off] << 8) | buf[off + 1];
}

function u16le(buf: Uint8Array, off: number): number {
  return buf[off] | (buf[off + 1] << 8);
}

function u24le(buf: Uint8Array, off: number): number {
  return buf[off] | (buf[off + 1] << 8) | (buf[off + 2] << 16);
}

function u32be(buf: Uint8Array, off: number): number {
  return (
    (buf[off] * 0x1000000) +
    ((buf[off + 1] << 16) | (buf[off + 2] << 8) | buf[off + 3])
  );
}

function u32le(buf: Uint8Array, off: number): number {
  return (
    buf[off] |
    (buf[off + 1] << 8) |
    (buf[off + 2] << 16) |
    (buf[off + 3] * 0x1000000)
  );
}

interface Dimensions {
  width: number;
  height: number;
}

function validDimensions(d: Dimensions | null): boolean {
  if (!d) return false;
  if (d.width <= 0 || d.height <= 0) return false;
  if (d.width > MAX_DIMENSION || d.height > MAX_DIMENSION) return false;
  return d.width * d.height <= MAX_PIXELS;
}

/**
 * PNG: signature + chunk IHDR, wajib diakhiri chunk IEND tepat di akhir file.
 * Ini menolak file polyglot yang menempelkan HTML/JS setelah gambar.
 */
function pngDimensions(buf: Uint8Array): Dimensions | null {
  if (buf.length < 33) return null;
  let off = 8;
  let dims: Dimensions | null = null;

  while (off + 12 <= buf.length) {
    const len = u32be(buf, off);
    if (len > buf.length - off - 12) return null;
    const type = ascii(buf, off + 4, 4);
    const data = off + 8;

    if (type === "IHDR") {
      if (len < 13) return null;
      dims = { width: u32be(buf, data), height: u32be(buf, data + 4) };
    }

    const next = data + len + 4; // data + CRC
    if (next > buf.length) return null;
    if (type === "IEND") {
      return next === buf.length ? dims : null;
    }
    off = next;
  }
  return null;
}

/** JPEG: SOI + SOFn + EOI tepat di akhir file. */
function jpegDimensions(buf: Uint8Array): Dimensions | null {
  if (buf.length < 4) return null;
  if (buf[0] !== 0xff || buf[1] !== 0xd8 || buf[2] !== 0xff) return null;
  if (buf[buf.length - 2] !== 0xff || buf[buf.length - 1] !== 0xd9) return null;

  let off = 2;
  let dims: Dimensions | null = null;

  while (off + 2 <= buf.length) {
    if (buf[off] !== 0xff) return null;
    let marker = buf[off + 1];
    while (marker === 0xff) {
      off += 1;
      if (off + 1 >= buf.length) return null;
      marker = buf[off + 1];
    }

    if (marker === 0xd9) break;
    if (marker === 0xda) break; // mulai scan; SOF sudah lewat
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      off += 2;
      continue;
    }

    if (off + 4 > buf.length) return null;
    const len = u16be(buf, off + 2);
    if (len < 2 || off + 2 + len > buf.length) return null;

    if (JPEG_SOF.has(marker)) {
      if (len < 7) return null;
      dims = { width: u16be(buf, off + 7), height: u16be(buf, off + 5) };
    }
    off += 2 + len;
  }

  return dims;
}

/** WebP: RIFF size harus cocok + dimensi dari VP8X/VP8/VP8L. */
function webpDimensions(buf: Uint8Array): Dimensions | null {
  if (buf.length < 30) return null;
  if (u32le(buf, 4) + 8 !== buf.length) return null;

  let off = 12;
  while (off + 8 <= buf.length) {
    const type = ascii(buf, off, 4);
    const size = u32le(buf, off + 4);
    const data = off + 8;
    if (data + size > buf.length) return null;

    if (type === "VP8X") {
      if (size < 10) return null;
      return {
        width: 1 + u24le(buf, data + 4),
        height: 1 + u24le(buf, data + 7),
      };
    }
    if (type === "VP8 ") {
      if (size < 10) return null;
      if (buf[data + 3] !== 0x9d || buf[data + 4] !== 0x01 || buf[data + 5] !== 0x2a) {
        return null;
      }
      return {
        width: u16le(buf, data + 6) & 0x3fff,
        height: u16le(buf, data + 8) & 0x3fff,
      };
    }
    if (type === "VP8L") {
      if (size < 5 || buf[data] !== 0x2f) return null;
      const bits = u32le(buf, data + 1);
      return {
        width: (bits & 0x3fff) + 1,
        height: ((bits >> 14) & 0x3fff) + 1,
      };
    }

    off = data + size + (size % 2); // chunk padding ke kelipatan 2
  }
  return null;
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
 * Validasi penuh: ukuran + magic bytes + struktur file + dimensi wajar.
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

  const dims =
    kind === "png" ? pngDimensions(buf) :
    kind === "jpg" ? jpegDimensions(buf) :
    webpDimensions(buf);

  if (!validDimensions(dims)) {
    return {
      ok: false,
      error: "Struktur atau dimensi gambar tidak valid (maks 10000×10000, 40MP).",
    };
  }

  return { ok: true, kind, contentType: contentTypeFor(kind) };
}
