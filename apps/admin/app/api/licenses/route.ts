import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createSupabaseAdminServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

async function mustAdmin() {
  const supabase = await createSupabaseAdminServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, response: NextResponse.json({ error: "Unauthorized." }, { status: 401 }) };
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) return { ok: false as const, response: NextResponse.json({ error: "Forbidden." }, { status: 403 }) };
  return { ok: true as const, supabase };
}

// Format kunci: SCAFF-XXXX-XXXX-XXXX (alfabet tanpa 0/O/1/I agar mudah dibaca).
const KEY_ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function generateLicenseKey(): string {
  const buf = randomBytes(12);
  const groups: string[] = [];
  for (let g = 0; g < 3; g++) {
    let part = "";
    for (let i = 0; i < 4; i++) {
      part += KEY_ALPHA[(buf[g * 4 + i] ?? 0) % KEY_ALPHA.length];
    }
    groups.push(part);
  }
  return `SCAFF-${groups.join("-")}`;
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** GET: daftar lisensi (terbaru dulu). */
export async function GET() {
  const auth = await mustAdmin();
  if (!auth.ok) return auth.response;
  const { data, error } = await auth.supabase
    .from("licenses")
    .select("id,key,template_slug,email,status,note,created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) return NextResponse.json({ error: "Gagal memuat lisensi." }, { status: 500 });
  return NextResponse.json({ licenses: data ?? [] });
}

/** POST { template_slug, email, note? }: terbitkan 1 kunci. */
export async function POST(request: NextRequest) {
  const auth = await mustAdmin();
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body harus JSON valid." }, { status: 400 });
  }
  const b = (body ?? {}) as Record<string, unknown>;
  const slug = typeof b.template_slug === "string" ? b.template_slug.trim().toLowerCase() : "";
  const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
  const note = typeof b.note === "string" ? b.note.trim().slice(0, 200) : "";
  if (!SLUG_RE.test(slug)) return NextResponse.json({ error: "template_slug tidak valid." }, { status: 400 });
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: "email tidak valid." }, { status: 400 });

  // Template harus ada (premium atau bukan — kunci untuk non-premium diabaikan CLI).
  const { data: template } = await auth.supabase
    .from("templates")
    .select("slug,nama,is_premium")
    .eq("slug", slug)
    .single();
  if (!template) return NextResponse.json({ error: "Template tidak ditemukan." }, { status: 404 });

  for (let attempt = 0; attempt < 3; attempt++) {
    const key = generateLicenseKey();
    const { data, error } = await auth.supabase
      .from("licenses")
      .insert([{ key, template_slug: slug, email, note }])
      .select("id,key,template_slug,email,status,note,created_at")
      .single();
    if (!error && data) return NextResponse.json({ license: data }, { status: 201 });
    // Kemungkinan tabrakan kunci (sangat jarang): coba lagi. Error lain: berhenti.
    if (!String(error?.message ?? "").toLowerCase().includes("duplicate")) {
      return NextResponse.json({ error: "Gagal menerbitkan lisensi." }, { status: 500 });
    }
  }
  return NextResponse.json({ error: "Gagal membuat kunci unik. Coba lagi." }, { status: 500 });
}
