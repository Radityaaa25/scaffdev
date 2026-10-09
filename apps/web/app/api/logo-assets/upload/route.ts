import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase-server";
import { isRateLimited, ADMIN_WRITE_LIMIT, ADMIN_WRITE_WINDOW_MS } from "@/lib/rate-limit";
import { validateImageBytes } from "@/lib/upload-validation";

const MAX_BYTES = 1 * 1024 * 1024;
const BUCKET = "site-assets";

/**
 * Upload logo (integrasi/framework) ke bucket site-assets.
 * Maks 1MB; hanya png/jpg/webp/svg asli. SVG dicek ringan (tanpa script).
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;
  const { supabase } = auth.ctx;

  if (isRateLimited(`admin-write:${auth.ctx.userId}`, ADMIN_WRITE_LIMIT, ADMIN_WRITE_WINDOW_MS)) {
    return NextResponse.json(
      { error: "Terlalu banyak perubahan. Tunggu ±10 menit lalu coba lagi." },
      { status: 429 }
    );
  }

  let file: File | null = null;
  try {
    const form = await request.formData();
    const entry = form.get("file");
    if (entry instanceof File) file = entry;
  } catch {
    return NextResponse.json({ error: "Body harus form-data dengan field 'file'." }, { status: 400 });
  }
  if (!file) {
    return NextResponse.json({ error: "Field 'file' wajib diisi." }, { status: 400 });
  }
  if (file.size <= 0 || file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Ukuran file maksimal 1MB." }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const name = (file.name || "").toLowerCase();
  // SVG: validasi ringan di sini (tolak script/event-handler); raster via helper.
  if (name.endsWith(".svg")) {
    const text = new TextDecoder().decode(bytes.slice(0, 65536));
    if (/<script|on\w+\s*=|javascript:/i.test(text)) {
      return NextResponse.json({ error: "SVG mengandung script/event-handler." }, { status: 400 });
    }
  } else {
    const checked = validateImageBytes(bytes, MAX_BYTES);
    if (!checked.ok) {
      return NextResponse.json({ error: checked.error }, { status: 400 });
    }
  }

  const ext = name.endsWith(".svg") ? "svg" : name.endsWith(".png") ? "png" : name.endsWith(".webp") ? "webp" : "jpg";
  const path = `logos/${crypto.randomUUID()}.${ext}`;
  const contentType =
    ext === "svg" ? "image/svg+xml" : ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType, upsert: false });
  if (error) {
    const msg = /bucket|not found|row-level|policy|permission/i.test(error.message)
      ? "Bucket 'site-assets' belum siap. Jalankan Migrasi 014 di Supabase SQL Editor."
      : "Gagal mengupload logo.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl }, { status: 201 });
}
