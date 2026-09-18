import { NextRequest, NextResponse } from "next/server";
import { getAllDocs, getDocBySlug } from "@/lib/docs";
import { getAllTemplates } from "@/lib/data";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const GROQ_MODEL = process.env.GROQ_MODEL || "qwen/qwen3.8-27b";
const MAX_MESSAGE = 500;
const HISTORY_LIMIT = 4;
const MAX_TOKENS = 600;

// Rate limit sederhana per IP (in-memory).
// Catatan: di serverless multi-instance (Vercel), hitungan bersifat per-instance.
// Cukup untuk MVP; naikkan ke KV/Upstash bila disalahgunakan.
const WINDOW_MS = 10 * 60 * 1000;
const LIMIT = 10;
const hits = new Map<string, { count: number; reset: number }>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now > entry.reset) {
    hits.set(ip, { count: 1, reset: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > LIMIT;
}

function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * Asisten AI publik (troubleshooting & panduan Scaffdev).
 * RAG: isi content/docs/*.md + snapshot katalog published + integrasi,
 * semuanya dibaca server-side. Tanpa auth — dilindungi rate limit ketat,
 * context di-trim, dan system prompt menolak topik di luar Scaffdev.
 */
export async function POST(request: NextRequest) {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json(
      { error: "Asisten AI belum dikonfigurasi. Coba lagi nanti." },
      { status: 503 }
    );
  }

  const ip = clientIp(request);
  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: "Terlalu banyak pertanyaan. Tunggu ±10 menit lalu coba lagi." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body harus JSON." }, { status: 400 });
  }
  const { message, history } = (body ?? {}) as { message?: unknown; history?: unknown };
  if (typeof message !== "string" || message.trim().length === 0) {
    return NextResponse.json({ error: "Pesan tidak boleh kosong." }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE) {
    return NextResponse.json({ error: `Pesan maksimal ${MAX_MESSAGE} karakter.` }, { status: 400 });
  }
  const cleanHistory: ChatMessage[] = Array.isArray(history)
    ? history
        .filter(
          (m): m is ChatMessage =>
            typeof m === "object" && m !== null &&
            ((m as ChatMessage).role === "user" || (m as ChatMessage).role === "assistant") &&
            typeof (m as ChatMessage).content === "string"
        )
        .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE) }))
        .slice(-HISTORY_LIMIT)
    : [];

  // Konteks: dokumentasi (trim) + katalog live (published saja).
  const docs = getAllDocs();
  const docParts: string[] = [];
  let budget = 9000;
  for (const d of docs) {
    if (budget <= 0) break;
    const full = await getDocBySlug(d.slug);
    if (!full) continue;
    const chunk = full.content.slice(0, 2200);
    docParts.push(`### ${full.title}\n${chunk}`);
    budget -= chunk.length;
  }

  const templates = await getAllTemplates();
  const catalog = templates.map((t) => ({
    slug: t.slug,
    nama: t.nama,
    framework: t.framework,
    kategori: t.kategori,
    deskripsi: (t.deskripsi ?? "").slice(0, 200),
    integrasi: t.opsi_integrasi,
  }));

  let integrasi: unknown[] = [];
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.from("integrasi").select("kode,nama_tampilan,kategori_integrasi");
    integrasi = data ?? [];
  } catch {
    /* katalog tetap bisa dijawab tanpa daftar integrasi */
  }

  const system = [
    "Kamu adalah Asisten Scaffdev di website publik. Jawab SELALU dalam Bahasa Indonesia yang ramah dan ringkas.",
    "Tugasmu HANYA membantu seputar: penggunaan CLI scaffdev, pemilihan template, setup environment (.env, SETUP.md), integrasi yang didukung, dan troubleshooting error. Di luar itu, tolak sopan dan arahkan kembali.",
    "Jangan pernah meminta, menebak, atau menampilkan API key/secret milik user. Jangan mengarang slug/template di luar data katalog.",
    "Saat menyebut command, gunakan format npx scaffdev@latest --template=<slug>. Saat merujuk panduan, sebut path-nya (mis. /docs/troubleshooting).",
    `DOKUMENTASI:\n${docParts.join("\n\n")}`,
    `KATALOG TEMPLATE (published): ${JSON.stringify(catalog)}`,
    `DAFTAR INTEGRASI: ${JSON.stringify(integrasi)}`,
  ].join("\n");

  let groqRes: Response;
  try {
    groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.3,
        max_tokens: MAX_TOKENS,
        messages: [
          { role: "system", content: system },
          ...cleanHistory,
          { role: "user", content: message.trim() },
        ],
      }),
      signal: AbortSignal.timeout(30000),
    });
  } catch {
    return NextResponse.json({ error: "Tidak dapat menghubungi AI. Coba lagi." }, { status: 502 });
  }

  if (!groqRes.ok) {
    const status = groqRes.status === 429 ? 429 : 502;
    return NextResponse.json(
      { error: groqRes.status === 429 ? "Asisten sedang sibuk. Coba lagi sebentar." : "Asisten gagal menjawab. Coba lagi nanti." },
      { status }
    );
  }

  const payload = (await groqRes.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const answer = payload.choices?.[0]?.message?.content?.trim();
  if (!answer) {
    return NextResponse.json({ error: "AI tidak memberikan jawaban. Coba lagi." }, { status: 502 });
  }

  return NextResponse.json({ answer });
}
