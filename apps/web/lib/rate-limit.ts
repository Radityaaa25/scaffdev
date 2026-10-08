/**
 * Rate limit in-memory sederhana (per instance).
 * Untuk endpoint admin bervolume rendah: pola sama seperti route AI.
 * Bukan pengganti WAF/rate-limit edge untuk traffic besar.
 *
 * Endpoint AI chat memakai limiter KV (Upstash) di bawah bila env tersedia —
 * hitungan dishare antar instance serverless. Tanpa env, fallback ke
 * in-memory agar dev lokal tetap jalan.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const buckets = new Map<string, { count: number; reset: number }>();

export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = buckets.get(key);
  if (!entry || now > entry.reset) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return false;
  }
  entry.count += 1;
  return entry.count > limit;
}

/** Batas chat AI: 10 pertanyaan / 10 menit / IP. */
export const CHAT_LIMIT = 10;
export const CHAT_WINDOW_MS = 10 * 60 * 1000;

const hasKv = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

let chatLimiter: Ratelimit | null = null;
if (hasKv) {
  chatLimiter = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(CHAT_LIMIT, "10 m"),
    analytics: true,
    prefix: "scaff:ai",
  });
}

/**
 * Cek rate limit chat AI. Async karena menyentuh KV bila tersedia.
 * Bila KV error/tidak ada: fail-open ke in-memory (chat tetap hidup,
 * proteksi per-instance; lebih baik daripada mati total).
 */
export async function isChatRateLimited(ip: string): Promise<boolean> {
  if (chatLimiter) {
    try {
      const { success } = await chatLimiter.limit(`chat:${ip}`);
      return !success;
    } catch {
      return isRateLimited(`chat:${ip}`, CHAT_LIMIT, CHAT_WINDOW_MS);
    }
  }
  return isRateLimited(`chat:${ip}`, CHAT_LIMIT, CHAT_WINDOW_MS);
}

/** Batas tulis admin: 60 operasi / 10 menit / user. */
export const ADMIN_WRITE_LIMIT = 60;
export const ADMIN_WRITE_WINDOW_MS = 10 * 60 * 1000;

/** Batas increment statistik: 1 hitungan / menit / IP. */
export const STATS_LIMIT = 1;
export const STATS_WINDOW_MS = 60 * 1000;
