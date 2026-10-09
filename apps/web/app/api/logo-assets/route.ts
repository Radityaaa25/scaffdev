import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase-server";
import { isRateLimited, ADMIN_WRITE_LIMIT, ADMIN_WRITE_WINDOW_MS } from "@/lib/rate-limit";
import { logActivity } from "@/lib/activity";

const KEY_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const KINDS = new Set(["integration", "framework"]);

function bad(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

/** Daftar logo (khusus admin — web publik memakai helper server langsung). */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;
  const { data, error } = await auth.ctx.supabase
    .from("logo_assets")
    .select("key,label,url,kind")
    .order("label");
  if (error) {
    return NextResponse.json({ error: "Gagal mengambil data logo." }, { status: 500 });
  }
  return NextResponse.json({ logos: data ?? [] });
}

/**
 * Simpan/timpa satu logo (upsert by key). URL boleh file lokal (/logo-*.svg),
 * URL storage site-assets, atau URL resmi. Validasi diulang di server.
 */
export async function PUT(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;
  const { supabase, email } = auth.ctx;

  if (isRateLimited(`admin-write:${auth.ctx.userId}`, ADMIN_WRITE_LIMIT, ADMIN_WRITE_WINDOW_MS)) {
    return NextResponse.json(
      { error: "Terlalu banyak perubahan. Tunggu ±10 menit lalu coba lagi." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return bad("Body harus JSON.");
  }
  const b = body as Record<string, unknown>;
  const key = typeof b.key === "string" ? b.key.trim().toLowerCase() : "";
  const label = typeof b.label === "string" ? b.label.trim() : "";
  const url = typeof b.url === "string" ? b.url.trim() : "";
  const kind = typeof b.kind === "string" ? b.kind.trim().toLowerCase() : "integration";

  if (!key || !KEY_RE.test(key)) {
    return bad("Field 'key' wajib huruf kecil/angka/dash (contoh: midtrans).");
  }
  if (!label) return bad("Field 'label' wajib diisi.");
  if (!url || !(url.startsWith("/") || /^https:\/\//i.test(url))) {
    return bad("Field 'url' harus path lokal (/...) atau URL https.");
  }
  if (!KINDS.has(kind)) {
    return bad("Field 'kind' harus 'integration' atau 'framework'.");
  }

  const { error } = await supabase
    .from("logo_assets")
    .upsert({ key, label, url, kind, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) {
    const missing =
      /column|relation|does not exist|schema cache/i.test(error.message) &&
      /logo_assets|docs_url/i.test(error.message);
    return NextResponse.json(
      {
        error: missing
          ? "Tabel/kolom belum siap. Jalankan migrasi terbaru di Supabase SQL Editor."
          : "Gagal menyimpan logo.",
      },
      { status: 500 }
    );
  }
  await logActivity(supabase, email, "logo.upsert", "referensi", key);
  return NextResponse.json({ ok: true });
}

/** Hapus satu logo by key. Web otomatis fallback (bundled, lalu ikon generik). */
export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;
  const { supabase, email } = auth.ctx;

  if (isRateLimited(`admin-write:${auth.ctx.userId}`, ADMIN_WRITE_LIMIT, ADMIN_WRITE_WINDOW_MS)) {
    return NextResponse.json(
      { error: "Terlalu banyak perubahan. Tunggu ±10 menit lalu coba lagi." },
      { status: 429 }
    );
  }

  const key = request.nextUrl.searchParams.get("key")?.trim().toLowerCase() ?? "";
  if (!key || !KEY_RE.test(key)) {
    return bad("Parameter 'key' wajib huruf kecil/angka/dash.");
  }
  const { error } = await supabase.from("logo_assets").delete().eq("key", key);
  if (error) {
    return NextResponse.json({ error: "Gagal menghapus logo." }, { status: 500 });
  }
  await logActivity(supabase, email, "logo.delete", "referensi", key);
  return NextResponse.json({ ok: true });
}
