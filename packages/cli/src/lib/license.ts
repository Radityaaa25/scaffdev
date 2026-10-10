import fs from "fs";
import os from "os";
import path from "path";
import zlib from "zlib";
import * as p from "@clack/prompts";
import { apiBaseUrl } from "./api-client";
import { extractTarFiles } from "./security-audit";

/**
 * Lisensi template premium (tanpa login web - kunci = kredensial).
 * Alur: flag --license-key -> cache ~/.scaffdev/licenses.json -> prompt.
 * Cache ditulis HANYA setelah server memvalidasi kunci (tidak dipercaya buta).
 */

const KEY_RE = /^SCAFF-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/;

export function isLicenseKeyFormat(key: string): boolean {
  return KEY_RE.test(key.trim().toUpperCase());
}

export function normalizeLicenseKey(key: string): string {
  return key.trim().toUpperCase();
}

function cachePath(): string {
  return path.join(os.homedir(), ".scaffdev", "licenses.json");
}

function readCache(): Record<string, string> {
  try {
    const raw = fs.readFileSync(cachePath(), "utf8");
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const out: Record<string, string> = {};
      for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
        if (typeof v === "string" && isLicenseKeyFormat(v)) out[k.toLowerCase()] = normalizeLicenseKey(v);
      }
      return out;
    }
  } catch {
    // Abaikan: cache rusak = anggap kosong.
  }
  return {};
}

/** Simpan kunci tervalidasi ke cache lokal (0600 bila didukung platform). */
export function cacheLicenseKey(slug: string, key: string): void {
  const all = readCache();
  all[slug.toLowerCase()] = normalizeLicenseKey(key);
  fs.mkdirSync(path.dirname(cachePath()), { recursive: true });
  fs.writeFileSync(cachePath(), JSON.stringify(all, null, 2) + "\n", { mode: 0o600 });
}

export function cachedLicenseKey(slug: string): string | null {
  return readCache()[slug.toLowerCase()] ?? null;
}

export interface PremiumDownload {
  tar: Buffer;
  licensedEmail: string;
}

/**
 * Verifikasi kunci + unduh tarball template premium dari server.
 * Server mengambil dari repo privat (token server-side) - repo_url
 * TIDAK PERNAH dikirim ke CLI untuk template premium.
 */
export async function verifyAndDownload(
  slug: string,
  key: string
): Promise<{ ok: true; download: PremiumDownload } | { ok: false; error: string }> {
  let res: Response;
  try {
    res = await fetch(`${apiBaseUrl()}/api/premium/download`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, key: normalizeLicenseKey(key) }),
      signal: AbortSignal.timeout(20000),
    });
  } catch (err) {
    return { ok: false, error: `Gagal menghubungi server lisensi: ${(err as Error).message}` };
  }
  if (res.status === 401 || res.status === 403) {
    return { ok: false, error: "Kunci lisensi tidak valid untuk template ini." };
  }
  if (res.status === 404) {
    return { ok: false, error: "Template premium tidak ditemukan." };
  }
  if (res.status === 429) {
    return { ok: false, error: "Terlalu banyak percobaan. Tunggu ±10 menit." };
  }
  if (!res.ok) {
    return { ok: false, error: `Server lisensi error (${res.status}). Coba lagi.` };
  }
  const email = res.headers.get("x-licensed-email") ?? "";
  const gz = Buffer.from(await res.arrayBuffer());
  if (gz.length === 0) return { ok: false, error: "Tarball kosong dari server." };
  if (gz.length > 25 * 1024 * 1024) return { ok: false, error: "Tarball melebihi 25MB, dibatalkan demi keamanan." };
  let tar: Buffer;
  try {
    tar = zlib.gunzipSync(gz);
  } catch {
    return { ok: false, error: "Arsip server bukan gzip valid." };
  }
  return { ok: true, download: { tar, licensedEmail: email } };
}

/**
 * Resolve kunci lisensi: flag -> cache -> prompt interaktif.
 * Mengembalikan null bila user membatalkan.
 */export async function resolveLicenseKey(opts: {
  slug: string;
  templateName: string;
  flagKey?: string;
}): Promise<string | null> {
  if (opts.flagKey && isLicenseKeyFormat(opts.flagKey)) {
    return normalizeLicenseKey(opts.flagKey);
  }
  if (opts.flagKey) {
    p.log.warn("Format --license-key tidak dikenal (contoh: SCAFF-AB12-CD34-EF56).");
  }
  const cached = cachedLicenseKey(opts.slug);
  if (cached) {
    p.log.info("Memakai kunci lisensi tersimpan di ~/.scaffdev/licenses.json.");
    return cached;
  }
  const answer = await p.text({
    message: `Template "${opts.templateName}" premium dan butuh kunci lisensi. Masukkan kunci (atau Ctrl+C untuk batal):`,
    validate: (v) => (isLicenseKeyFormat(v) ? undefined : "Format kunci: SCAFF-XXXX-XXXX-XXXX."),
  });
  if (p.isCancel(answer)) return null;
  return normalizeLicenseKey(answer as string);
}

/**
 * Ekstrak tarball premium ke targetDir. Menolak entri traversal (..)
 * dan arsip kosong. Mengembalikan daftar path relatif terpasang.
 */
export function extractPremiumTarball(tar: Buffer, targetDir: string): string[] {
  const entries = extractTarFiles(tar, () => true, 5 * 1024 * 1024, 2000);
  const installed: string[] = [];
  for (const e of entries) {
    const norm = e.name.replace(/\\/g, "/");
    if (!norm || norm.startsWith("/") || norm.split("/").includes("..")) {
      throw new Error(`Arsip menolak entri tidak aman: "${e.name}".`);
    }
    const abs = path.join(targetDir, norm);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, e.data);
    installed.push(norm);
  }
  if (installed.length === 0) {
    throw new Error("Arsip premium kosong (tidak ada file).");
  }
  return installed;
}
