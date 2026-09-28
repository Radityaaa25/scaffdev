import type { NextRequest } from "next/server";

/**
 * Ekstraksi IP client untuk rate limit — SATU implementasi untuk semua route.
 *
 * Kenapa bukan `x-forwarded-for` entry pertama (pola lama):
 * entry pertama XFF berasal dari CLIENT dan bisa dispoof bebas
 * (`curl -H "X-Forwarded-For: 1.2.3.4"`). Rate limit yang di-key di situ
 * bisa dilewati cuma dengan mengganti header → brute force / spam tak terbatas.
 *
 * Urutan sekarang:
 * 1. `x-real-ip` — ditulis ulang oleh proxy tepercaya (Vercel/Cloudflare),
 *    klien tidak bisa menyuntikkan nilainya.
 * 2. entry TERAKHIR `x-forwarded-for` — entry yang dibangun proxy terdekat
 *    ke kita (yang tepercaya), bukan yang paling kiri (milik klien).
 * 3. `x-real-ip`/`x-forwarded-for` sebagai fallback cepat.
 * 4. `"unknown"` — semua request anonim berbagi SATU bucket, jadi tetap
 *    terkena rate limit (fail-safe), bukan lolos.
 */
export function clientIp(request: NextRequest): string {
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const entries = forwarded
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const last = entries[entries.length - 1];
    if (last) return last;
  }

  return "unknown";
}
