import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { isRateLimited } from "@/lib/rate-limit";
import { validateSubmissionInput } from "@/lib/submission-validation";

const SUBMISSION_LIMIT = 3;
const SUBMISSION_WINDOW_MS = 60 * 60 * 1000; // 3 submission / jam / IP.

function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body harus berupa JSON yang valid." }, { status: 400 });
  }

  const validated = validateSubmissionInput(body);
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
