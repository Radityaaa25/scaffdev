import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, createSupabaseServerClient } from "@/lib/supabase-server";
import { validateLaporanInput } from "@/lib/laporan-validation";
import { isRateLimited } from "@/lib/rate-limit";

const LAPOR_LIMIT = 5;
const LAPOR_WINDOW_MS = 60 * 60 * 1000; // 5 laporan / jam / IP.

function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

/** Daftar laporan — khusus admin. */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;
  try {
    const { data, error } = await auth.ctx.supabase
      .from("laporan")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) {
      return NextResponse.json({ error: "Gagal mengambil data laporan." }, { status: 500 });
    }
    return NextResponse.json({ laporan: data ?? [] });
  } catch {
    return NextResponse.json({ error: "Konfigurasi Supabase belum lengkap." }, { status: 500 });
  }
}

/** Kirim laporan/pengaduan — publik, tanpa login. */
export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  if (isRateLimited(`lapor:${ip}`, LAPOR_LIMIT, LAPOR_WINDOW_MS)) {
    return NextResponse.json(
      { error: "Terlalu banyak laporan. Coba lagi dalam 1 jam." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body harus berupa JSON yang valid." }, { status: 400 });
  }

  const validated = validateLaporanInput(body);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }
  // Honeypot: bot dikira berhasil, tapi tidak disimpan.
  if (validated.honeypot) {
    return NextResponse.json({ success: true }, { status: 201 });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("laporan").insert([validated.data]);
    if (error) {
      return NextResponse.json({ error: "Gagal menyimpan laporan." }, { status: 500 });
    }
    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Konfigurasi Supabase belum lengkap." }, { status: 500 });
  }
}
