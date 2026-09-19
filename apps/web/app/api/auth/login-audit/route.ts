import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { isRateLimited } from "@/lib/rate-limit";

const EMAIL_RE = /^[^\s@]{1,200}@[^\s@]{1,200}\.[^\s@]{2,}$/;
const LIMIT = 30;
const WINDOW_MS = 60 * 1000; // 30 pencatatan / menit / IP.

function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Catat upaya login admin (sukses maupun gagal) untuk deteksi brute force.
 * Publik tanpa auth (dipanggil SEBELUM login berhasil) — penulisan lewat
 * SECURITY DEFINER log_login_attempt() yang punya guard anti-spam internal.
 * Kegagalan pencatatan tidak boleh mengganggu alur login.
 */
export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  if (isRateLimited(`login-audit:${ip}`, LIMIT, WINDOW_MS)) {
    return NextResponse.json({ success: true });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: true });
  }
  const b = (body ?? {}) as Record<string, unknown>;
  const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
  const success = b.success === true;
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ success: true });
  }

  try {
    const supabase = await createSupabaseServerClient();
    await supabase.rpc("log_login_attempt", { p_email: email, p_success: success });
  } catch {
    /* abaikan — audit tidak boleh merusak login */
  }
  return NextResponse.json({ success: true });
}
