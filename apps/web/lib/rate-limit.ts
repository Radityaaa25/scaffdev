/**
 * Rate limit in-memory sederhana (per instance).
 * Untuk endpoint admin bervolume rendah — pola sama seperti route AI.
 * Bukan pengganti WAF/rate-limit edge untuk traffic besar.
 */

const buckets = new Map<string, { count: number; reset: number }>();

/** Entries kedaluwarsa di-sweep periodik agar Map tidak tumbuh tanpa batas. */
const SWEEP_INTERVAL_MS = 60 * 1000;
let lastSweep = 0;

function sweep(now: number): void {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [key, entry] of buckets) {
    if (now > entry.reset) buckets.delete(key);
  }
}

export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  sweep(now);
  const entry = buckets.get(key);
  if (!entry || now > entry.reset) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return false;
  }
  entry.count += 1;
  return entry.count > limit;
}

/** Batas tulis admin: 60 operasi / 10 menit / user. */
export const ADMIN_WRITE_LIMIT = 60;
export const ADMIN_WRITE_WINDOW_MS = 10 * 60 * 1000;

/** Batas increment statistik: 1 hitungan / menit / IP. */
export const STATS_LIMIT = 1;
export const STATS_WINDOW_MS = 60 * 1000;
