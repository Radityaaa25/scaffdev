import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminServerClient } from "@/lib/supabase-server";
import { resolveGroqModel } from "@/lib/ai-config";

export const dynamic = "force-dynamic";

const MAX_MESSAGE = 1000;
const HISTORY_LIMIT = 12;
const RETENTION_DAYS = 30;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface GroqUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
}

/** Catat pemakaian/error ke ai_usage_log — tidak boleh menggagalkan response. */
async function logUsage(
  supabase: Awaited<ReturnType<typeof createSupabaseAdminServerClient>>,
  row: {
    model: string;
    prompt: number;
    completion: number;
    total: number;
    latencyMs: number;
    status: "ok" | "error";
    error?: string;
    sessionRef: string;
  }
): Promise<void> {
  try {
    await supabase.from("ai_usage_log").insert([
      {
        scope: "admin",
        model: row.model,
        prompt_tokens: row.prompt,
        completion_tokens: row.completion,
        total_tokens: row.total,
        latency_ms: row.latencyMs,
        status: row.status,
        error: row.error ?? null,
        session_ref: row.sessionRef,
      },
    ]);
  } catch {
    /* monitoring tidak boleh merusak chat */
  }
}

/**
 * Asisten AI admin (RAG ringan): snapshot live templates + integrasi
 * disuntik ke system prompt Groq. Tanpa vector DB — skala katalog kecil,
 * data faktual selalu fresh dari database.
 *
 * Riwayat disimpan di ai_chat_sessions/messages (retensi sliding 30 hari).
 */
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseAdminServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json(
      { error: "GROQ_API_KEY belum di-set di apps/admin. Tambahkan di .env.local lalu restart." },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body harus JSON." }, { status: 400 });
  }
  const { message, sessionId } = (body ?? {}) as { message?: unknown; sessionId?: unknown };
  if (typeof message !== "string" || message.trim().length === 0) {
    return NextResponse.json({ error: "Pesan tidak boleh kosong." }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE) {
    return NextResponse.json({ error: `Pesan maksimal ${MAX_MESSAGE} karakter.` }, { status: 400 });
  }

  // Ambil atau buat sesi (tolak yang sudah kedaluwarsa).
  let activeSessionId: string;
  if (typeof sessionId === "string" && sessionId) {
    const { data: existing } = await supabase
      .from("ai_chat_sessions")
      .select("id,expires_at")
      .eq("id", sessionId)
      .single();
    if (!existing) {
      return NextResponse.json({ error: "Sesi tidak ditemukan." }, { status: 404 });
    }
    if (new Date(existing.expires_at as string).getTime() < Date.now()) {
      await supabase.from("ai_chat_sessions").delete().eq("id", sessionId);
      return NextResponse.json({ error: "Sesi sudah kedaluwarsa (30 hari). Mulai chat baru." }, { status: 410 });
    }
    activeSessionId = existing.id as string;
  } else {
    const { data: created, error } = await supabase
      .from("ai_chat_sessions")
      .insert([{ title: "Percakapan baru" }])
      .select("id")
      .single();
    if (error || !created) {
      return NextResponse.json({ error: "Gagal membuat sesi chat." }, { status: 500 });
    }
    activeSessionId = created.id as string;
  }

  const cleanMessage = message.trim();

  // Simpan pesan user + perpanjang retensi + judul otomatis dari pesan pertama.
  const { count: msgCount } = await supabase
    .from("ai_chat_messages")
    .select("id", { count: "exact", head: true })
    .eq("session_id", activeSessionId);
  await supabase.from("ai_chat_messages").insert([
    { session_id: activeSessionId, role: "user", content: cleanMessage },
  ]);
  await supabase
    .from("ai_chat_sessions")
    .update({
      updated_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString(),
      ...(msgCount === 0 ? { title: cleanMessage.slice(0, 48) } : {}),
    })
    .eq("id", activeSessionId);

  // History server-side (bukan dari client).
  const { data: historyRows } = await supabase
    .from("ai_chat_messages")
    .select("role,content")
    .eq("session_id", activeSessionId)
    .order("created_at", { ascending: true })
    .limit(HISTORY_LIMIT + 1);
  const history: ChatMessage[] = ((historyRows ?? []) as ChatMessage[])
    .filter((m) => m.role === "user" || m.role === "assistant")
    .slice(-HISTORY_LIMIT);

  // Snapshot live dari database.
  const [{ data: templates }, { data: integrasi }] = await Promise.all([
    supabase.from("templates").select("slug,nama,framework,kategori,downloads_count,is_published").order("downloads_count", { ascending: false }),
    supabase.from("integrasi").select("kode,nama_tampilan,kategori_integrasi"),
  ]);

  const system = [
    "Kamu adalah Asisten Admin Scaffdev. Jawab SELALU dalam Bahasa Indonesia yang ringkas.",
    "Kamu menjawab berdasarkan DATA KATALOG berikut (live dari database). Jangan mengarang template/integrasi di luar data ini. Jika pertanyaan di luar data, katakan terus terang.",
    `DATA TEMPLATE: ${JSON.stringify(templates ?? [])}`,
    `DATA INTEGRASI: ${JSON.stringify(integrasi ?? [])}`,
    "downloads_count = jumlah project yang di-generate via CLI. is_published=false berarti draft (belum tampil publik).",
  ].join("\n");

  const model = resolveGroqModel();
  const startedAt = Date.now();
  let groqRes: Response;
  try {
    groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        max_tokens: 800,
        messages: [{ role: "system", content: system }, ...history],
      }),
      signal: AbortSignal.timeout(30000),
    });
  } catch {
    await logUsage(supabase, {
      model, prompt: 0, completion: 0, total: 0,
      latencyMs: Date.now() - startedAt, status: "error",
      error: "network: tidak dapat menghubungi api.groq.com",
      sessionRef: activeSessionId,
    });
    return NextResponse.json({ error: "Tidak dapat menghubungi Groq. Coba lagi." }, { status: 502 });
  }

  if (!groqRes.ok) {
    let detail = "";
    try {
      const errBody = (await groqRes.json()) as { error?: { message?: string; code?: string } };
      detail = errBody.error?.message ?? errBody.error?.code ?? "";
    } catch {
      /* body bukan JSON */
    }
    // Log server-side (tanpa secret) agar penyebab asli terlihat di log Vercel/dev.
    console.error(`[assistant] Groq HTTP ${groqRes.status} model=${model} detail=${detail.slice(0, 300)}`);
    const latencyMs = Date.now() - startedAt;
    if (groqRes.status === 429) {
      await logUsage(supabase, {
        model, prompt: 0, completion: 0, total: 0, latencyMs,
        status: "error", error: "rate_limit: 429 dari Groq", sessionRef: activeSessionId,
      });
      return NextResponse.json({ error: "Batas request Groq tercapai. Tunggu sebentar lalu coba lagi." }, { status: 502 });
    }
    if (/model/i.test(detail)) {
      await logUsage(supabase, {
        model, prompt: 0, completion: 0, total: 0, latencyMs,
        status: "error", error: `model_not_found: ${detail.slice(0, 200)}`, sessionRef: activeSessionId,
      });
      return NextResponse.json(
        { error: `Model "${model}" ditolak Groq. Cek GROQ_MODEL di env (daftar model: console.groq.com/docs/models).` },
        { status: 502 }
      );
    }
    await logUsage(supabase, {
      model, prompt: 0, completion: 0, total: 0, latencyMs,
      status: "error", error: `groq_http_${groqRes.status}: ${detail.slice(0, 200)}`, sessionRef: activeSessionId,
    });
    return NextResponse.json({ error: "Groq mengembalikan error. Coba lagi nanti." }, { status: 502 });
  }

  const payload = (await groqRes.json()) as {
    choices?: { message?: { content?: string } }[];
    usage?: GroqUsage;
  };
  const answer = payload.choices?.[0]?.message?.content?.trim();
  if (!answer) {
    await logUsage(supabase, {
      model,
      prompt: payload.usage?.prompt_tokens ?? 0,
      completion: 0,
      total: payload.usage?.total_tokens ?? 0,
      latencyMs: Date.now() - startedAt, status: "error",
      error: "empty_answer: Groq tidak mengembalikan konten",
      sessionRef: activeSessionId,
    });
    return NextResponse.json({ error: "AI tidak memberikan jawaban. Coba lagi." }, { status: 502 });
  }

  await supabase.from("ai_chat_messages").insert([
    { session_id: activeSessionId, role: "assistant", content: answer },
  ]);
  await logUsage(supabase, {
    model,
    prompt: payload.usage?.prompt_tokens ?? 0,
    completion: payload.usage?.completion_tokens ?? 0,
    total: payload.usage?.total_tokens ?? 0,
    latencyMs: Date.now() - startedAt, status: "ok",
    sessionRef: activeSessionId,
  });

  return NextResponse.json({ answer, sessionId: activeSessionId });
}
