import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { isRateLimited } from "@/lib/rate-limit";
import { validateSubmissionInput } from "@/lib/submission-validation";

const SUBMISSION_LIMIT = 3;
const SUBMISSION_WINDOW_MS = 60 * 60 * 1000; // 3 submission / jam / IP.
const MAX_BODY_BYTES = 32 * 1024;

function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

function supabaseOrigin(): string | null {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) return null;
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
}

/** Kirim template komunitas: publik, tanpa login. */
export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  if (isRateLimited(`submission:${ip}`, SUBMISSION_LIMIT, SUBMISSION_WINDOW_MS)) {
    return NextResponse.json(
      { error: "Terlalu banyak submission. Coba lagi dalam 1 jam." },
      { status: 429 }
    );
  }

  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.startsWith("application/json")) {
    return NextResponse.json(
      { error: "Content-Type harus application/json." },
      { status: 415 }
    );
  }

  const declaredLength = request.headers.get("content-length");
  if (declaredLength) {
    const bytes = Number(declaredLength);
    if (!Number.isFinite(bytes) || bytes < 0) {
      return NextResponse.json({ error: "Content-Length tidak valid." }, { status: 400 });
    }
    if (bytes > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Body terlalu besar." }, { status: 413 });
    }
  }

  let body: unknown;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Body terlalu besar." }, { status: 413 });
    }
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Body harus berupa JSON yang valid." }, { status: 400 });
  }

  const validated = validateSubmissionInput(body, {
    allowedScreenshotOrigin: supabaseOrigin(),
  });
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }
  if (validated.honeypot) {
    return NextResponse.json({ success: true }, { status: 201 });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("submissions").insert([validated.data]);
    if (error) {
      const migrationMissing = /does not exist|schema cache/i.test(error.message);
      return NextResponse.json(
        {
          error: migrationMissing
            ? "Tabel submissions belum dibuat. Jalankan migrasi 017+018 di Supabase SQL Editor."
            : "Gagal menyimpan submission.",
        },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Konfigurasi Supabase belum lengkap." }, { status: 500 });
  }
}
