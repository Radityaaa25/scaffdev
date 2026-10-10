import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { isRateLimited } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// Batas unduh premium: mahal (fetch GitHub server-side), diketatkan.
const PREMIUM_LIMIT = 10;
const PREMIUM_WINDOW_MS = 10 * 60 * 1000;
const GITHUB_TIMEOUT_MS = 30000;
const TARBALL_MAX_BYTES = 25 * 1024 * 1024;

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const KEY_RE = /^SCAFF-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/;

function parseRepo(repoUrl: string): { owner: string; repo: string } | null {
  const m = /^https:\/\/github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+?)(?:\.git)?\/?$/.exec(repoUrl.trim());
  if (!m || !m[1] || !m[2]) return null;
  return { owner: m[1], repo: m[2] };
}

async function fetchGithub(url: string, token: string): Promise<Response> {
  return fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "scaffdev-premium-download",
    },
    signal: AbortSignal.timeout(GITHUB_TIMEOUT_MS),
  });
}

/**
 * POST /api/premium/download { slug, key }
 * Verifikasi kunci lisensi lalu streaming tarball repo privat.
 * repo_url TIDAK PERNAH keluar ke client (tetap di server).
 */
export async function POST(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : (request.headers.get("x-real-ip") ?? "unknown");
  if (isRateLimited(`premium:${ip}`, PREMIUM_LIMIT, PREMIUM_WINDOW_MS)) {
    return NextResponse.json({ error: "Terlalu banyak percobaan. Tunggu ±10 menit." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body harus JSON valid." }, { status: 400 });
  }
  const slug = typeof (body as Record<string, unknown>)?.slug === "string"
    ? ((body as Record<string, string>).slug ?? "").trim().toLowerCase()
    : "";
  const key = typeof (body as Record<string, unknown>)?.key === "string"
    ? ((body as Record<string, string>).key ?? "").trim().toUpperCase()
    : "";
  if (!SLUG_RE.test(slug) || !KEY_RE.test(key)) {
    // Format salah = respons sama seperti kunci salah (tanpa oracle).
    return NextResponse.json({ error: "Kunci lisensi tidak valid untuk template ini." }, { status: 403 });
  }

  let supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return NextResponse.json({ error: "Konfigurasi server belum lengkap." }, { status: 500 });
  }

  // 1. Template harus premium (repo privat tidak dilayani untuk yang gratis).
  const { data: template } = await supabase
    .from("templates")
    .select("slug,repo_url,is_premium")
    .eq("slug", slug)
    .single();
  if (!template || template.is_premium !== true || !template.repo_url) {
    return NextResponse.json({ error: "Template premium tidak ditemukan." }, { status: 404 });
  }

  // 2. Verifikasi kunci via RPC (tanpa baca tabel langsung).
  const { data: check } = await supabase.rpc("verify_license", { p_slug: slug, p_key: key });
  const row = (Array.isArray(check) ? check[0] : check) as { valid?: boolean; email?: string } | undefined;
  if (!row?.valid) {
    return NextResponse.json({ error: "Kunci lisensi tidak valid untuk template ini." }, { status: 403 });
  }

  // 3. Ambil tarball dari repo privat (token server-side, tidak pernah ke client).
  const token = (process.env.GITHUB_TOKEN ?? "").trim();
  if (!token) {
    return NextResponse.json({ error: "Unduhan premium belum dikonfigurasi server." }, { status: 500 });
  }
  const parsed = parseRepo(template.repo_url as string);
  if (!parsed) {
    return NextResponse.json({ error: "Konfigurasi repo template rusak." }, { status: 500 });
  }
  try {
    const metaRes = await fetchGithub(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}`, token);
    if (!metaRes.ok) {
      return NextResponse.json({ error: "Gagal mengambil template (repo tak terjangkau)." }, { status: 502 });
    }
    const meta = (await metaRes.json()) as { default_branch?: string };
    const branch = typeof meta.default_branch === "string" && meta.default_branch ? meta.default_branch : "main";
    const tarRes = await fetchGithub(
      `https://codeload.github.com/${parsed.owner}/${parsed.repo}/tar.gz/${encodeURIComponent(branch)}`,
      token
    );
    if (!tarRes.ok || !tarRes.body) {
      return NextResponse.json({ error: "Gagal mengunduh template." }, { status: 502 });
    }
    const len = Number(tarRes.headers.get("content-length") ?? "0");
    if (len > TARBALL_MAX_BYTES) {
      return NextResponse.json({ error: "Template melebihi batas ukuran." }, { status: 502 });
    }
    return new NextResponse(tarRes.body, {
      status: 200,
      headers: {
        "Content-Type": "application/gzip",
        "Content-Disposition": `attachment; filename="${slug}.tar.gz"`,
        "Cache-Control": "no-store",
        "x-licensed-email": String(row.email ?? ""),
      },
    });
  } catch {
    return NextResponse.json({ error: "Gagal mengunduh template. Coba lagi." }, { status: 502 });
  }
}
