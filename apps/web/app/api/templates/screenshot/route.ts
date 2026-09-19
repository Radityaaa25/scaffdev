import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase-server";
import { isRateLimited, ADMIN_WRITE_LIMIT, ADMIN_WRITE_WINDOW_MS } from "@/lib/rate-limit";
import { validateImageBytes } from "@/lib/upload-validation";

const MAX_BYTES = 2 * 1024 * 1024;
const BUCKET = "template-screenshots";

/**
 * Upload screenshot template.
 * Validasi diulang di server karena cek client-side (tipe + 2MB) mudah dilewati
 * dengan memanggil Storage API langsung: hanya png/jpg/webp asli yang lolos.
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
    return NextResponse.json({ error: "Ukuran file maksimal 2MB." }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const checked = validateImageBytes(bytes, MAX_BYTES);
  if (!checked.ok) {
    return NextResponse.json({ error: checked.error }, { status: 400 });
  }

  const path = `${crypto.randomUUID()}.${checked.kind}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: checked.contentType, upsert: false });
  if (error) {
    const msg = /bucket|not found|row-level|policy|permission/i.test(error.message)
      ? "Bucket 'template-screenshots' belum siap — jalankan Migrasi 005 di Supabase SQL Editor."
      : "Gagal mengupload screenshot.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl }, { status: 201 });
}
