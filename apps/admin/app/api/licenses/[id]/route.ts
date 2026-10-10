import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** PATCH /api/licenses/[id] { status: "active" | "revoked" }: cabut/pulihkan kunci. */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createSupabaseAdminServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const { id } = await params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: "ID tidak valid." }, { status: 400 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body harus JSON valid." }, { status: 400 });
  }
  const status = (body as Record<string, unknown>)?.status;
  if (status !== "active" && status !== "revoked") {
    return NextResponse.json({ error: "status harus 'active' | 'revoked'." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("licenses")
    .update({ status })
    .eq("id", id)
    .select("id,key,template_slug,email,status,note,created_at")
    .single();
  if (error || !data) return NextResponse.json({ error: "Lisensi tidak ditemukan." }, { status: 404 });
  return NextResponse.json({ license: data });
}
