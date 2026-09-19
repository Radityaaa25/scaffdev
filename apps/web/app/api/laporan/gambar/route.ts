import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { isRateLimited } from "@/lib/rate-limit";
import { validateImageBytes } from "@/lib/upload-validation";

// Bukti visual laporan user: kecil dan ketat — maks 1MB, hanya png/jpg/webp
// asli (magic bytes). SVG/GIF ditolak (risiko XSS via SVG).
const MAX_BYTES = 1 * 1024 * 1024;
const BUCKET = "template-screenshots";
const UPLOAD_LIMIT = 5;
const UPLOAD_WINDOW_MS = 60 * 60 * 1000; // 5 upload / jam / IP.

function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Upload gambar bukti untuk laporan — publik tanpa login.
 * File yang diupload tapi laporannya tidak jadi dikirim akan yatim di Storage;
 * itu tradeoff yang diterima (ukuran kecil + rate limit ketat).
 */
export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  if (isRateLimited(`lapor-gambar:${ip}`, UPLOAD_LIMIT, UPLOAD_WINDOW_MS)) {
    return NextResponse.json(
      { error: "Terlalu banyak upload. Coba lagi dalam 1 jam." },
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

  const bytes = new Uint8Array(await file.arrayBuffer());
  const checked = validateImageBytes(bytes, MAX_BYTES);
  if (!checked.ok) {
    return NextResponse.json({ error: checked.error }, { status: 400 });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const path = `laporan/${crypto.randomUUID()}.${checked.kind}`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, bytes, { contentType: checked.contentType, upsert: false });
    if (error) {
      return NextResponse.json({ error: "Gagal mengupload gambar." }, { status: 500 });
    }
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Konfigurasi Supabase belum lengkap." }, { status: 500 });
  }
}
