/**
 * Klien Groq bersama untuk AI chat WEB (dipakai /api/ai/chat).
 *
 * Multi-key: GROQ_API_KEY=kunci1,kunci2,kunci3 (pisah koma). Key dicoba
 * berurutan; pindah ke key berikutnya bila 429 / 5xx / timeout / 401.
 * 1 key pun tetap jalan (kompatibel mundur).
 *
 * Route ADMIN (/api/assistant) SENGAJA tidak memakai helper ini —
 * admin tetap 1 key, tidak diubah.
 *
 * Aturan keamanan: key tidak pernah masuk respons/log/error message.
 */

export interface GroqMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export type GroqFailure = "NO_KEY" | "RATE_LIMIT" | "FAILED" | "EMPTY";

export class GroqError extends Error {
  readonly kind: GroqFailure;
  constructor(kind: GroqFailure, message: string) {
    super(message);
    this.name = "GroqError";
    this.kind = kind;
  }
}

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

/** Baca daftar key dari env (split koma, trim, buang kosong). */
export function getGroqKeys(): string[] {
  return (process.env.GROQ_API_KEY ?? "")
    .split(",")
    .map((k) => k.trim())
    .filter((k) => k.length > 0);
}

export interface GroqCallOptions {
  model: string;
  temperature: number;
  maxTokens: number;
  /** Timeout per key (bukan total). Rekomendasi 15 dtk. */
  timeoutMs: number;
  messages: GroqMessage[];
  stream?: boolean;
}

function buildBody(o: GroqCallOptions): string {
  return JSON.stringify({
    model: o.model,
    temperature: o.temperature,
    max_tokens: o.maxTokens,
    stream: o.stream ?? false,
    messages: o.messages,
  });
}

async function tryOnce(key: string, o: GroqCallOptions): Promise<Response> {
  return fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // NOTED: key hanya di header Authorization server-ke-server.
      // Jangan pernah memasukkannya ke body/log/respons.
      Authorization: `Bearer ${key}`,
    },
    body: buildBody(o),
    signal: AbortSignal.timeout(o.timeoutMs),
  });
}

/** Tutup body respons gagal agar socket tidak bocor sebelum coba key berikutnya. */
async function drain(res: Response): Promise<void> {
  try {
    await res.arrayBuffer();
  } catch {
    /* abaikan */
  }
}

/**
 * Non-streaming: kembalikan teks jawaban memakai key pertama yang berhasil.
 * Melempar GroqError berkode (NO_KEY/RATE_LIMIT/FAILED/EMPTY).
 */
export async function groqChatCompletion(o: GroqCallOptions): Promise<string> {
  const keys = getGroqKeys();
  if (keys.length === 0) {
    throw new GroqError("NO_KEY", "GROQ_API_KEY belum di-set.");
  }
  let sawRateLimit = false;
  for (const key of keys) {
    let res: Response;
    try {
      res = await tryOnce(key, { ...o, stream: false });
    } catch {
      // Timeout / network — key berikutnya.
      continue;
    }
    if (res.ok) {
      const payload = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const answer = payload.choices?.[0]?.message?.content?.trim();
      if (!answer) throw new GroqError("EMPTY", "AI tidak memberikan jawaban.");
      return answer;
    }
    if (res.status === 400) {
      // Payload salah (model tidak dikenal, dsb.) — rotasi tidak membantu.
      await drain(res);
      throw new GroqError("FAILED", "Request ditolak Groq (400). Cek GROQ_MODEL di env.");
    }
    // 401/429/5xx → key berikutnya (401: key ini mati, key lain mungkin hidup).
    if (res.status === 429) sawRateLimit = true;
    await drain(res);
  }
  if (sawRateLimit) {
    throw new GroqError("RATE_LIMIT", "Semua key Groq kena rate limit.");
  }
  throw new GroqError("FAILED", "Semua key Groq gagal.");
}

/**
 * Streaming: kembalikan Response upstream PERTAMA yang OK agar bisa di-pipe
 * langsung sebagai SSE ke browser. Pemanggil bertanggung jawab meneruskan
 * body-nya. Melempar GroqError bila semua key gagal (belum ada byte terkirim).
 */
export async function groqChatStreamFirstOk(
  o: GroqCallOptions
): Promise<{ upstream: Response; keyIndex: number }> {
  const keys = getGroqKeys();
  if (keys.length === 0) {
    throw new GroqError("NO_KEY", "GROQ_API_KEY belum di-set.");
  }
  let sawRateLimit = false;
  for (let i = 0; i < keys.length; i++) {
    let res: Response;
    try {
      res = await tryOnce(keys[i], { ...o, stream: true });
    } catch {
      continue;
    }
    if (res.ok && res.body) return { upstream: res, keyIndex: i };
    if (res.status === 400) {
      await drain(res);
      throw new GroqError("FAILED", "Request ditolak Groq (400). Cek GROQ_MODEL di env.");
    }
    if (res.status === 429) sawRateLimit = true;
    await drain(res);
  }
  if (sawRateLimit) {
    throw new GroqError("RATE_LIMIT", "Semua key Groq kena rate limit.");
  }
  throw new GroqError("FAILED", "Semua key Groq gagal.");
}
