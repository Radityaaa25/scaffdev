/**
 * Transport email transaksional lewat Resend.
 *
 * Sengaja memakai fetch (tanpa SDK) agar tidak menambah dependency.
 * Fungsi ini tidak pernah melempar error: kegagalan Resend dikembalikan
 * sebagai status agar alur utama (update status submission) tetap jalan.
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const REQUEST_TIMEOUT_MS = 8_000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEFAULT_FROM_NAME = "Scaffdev";

export type EmailDeliveryStatus = "sent" | "failed" | "skipped";

export interface EmailDelivery {
  status: EmailDeliveryStatus;
  /** Alasan singkat untuk admin; tidak pernah berisi API key atau isi email. */
  reason?: string;
}

interface EmailAttachmentInput {
  filename: string;
  path: string;
  contentId?: string;
}

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  attachments?: EmailAttachmentInput[];
}

/** Bersihkan header dari CR/LF agar tidak bisa dipakai untuk header injection. */
function singleLine(value: string): string {
  return value.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
}

function normalizeFrom(raw: string): string | null {
  let value = singleLine(raw);
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1).trim();
  }
  if (!value) return null;

  const named = value.match(/^(.+?)\s*<\s*([^<>]+)\s*>$/);
  if (named) {
    const name = singleLine(named[1]).replace(/["<>]/g, "").slice(0, 80);
    const email = named[2].trim().toLowerCase();
    if (!EMAIL_RE.test(email)) return null;
    return `${name || DEFAULT_FROM_NAME} <${email}>`;
  }

  const email = value.toLowerCase();
  if (!EMAIL_RE.test(email)) return null;
  return `${DEFAULT_FROM_NAME} <${email}>`;
}

export async function sendEmail(input: SendEmailInput): Promise<EmailDelivery> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { status: "skipped", reason: "RESEND_API_KEY belum di-set." };
  }

  const from = normalizeFrom(process.env.RESEND_FROM_EMAIL ?? "");
  if (!from) {
    return {
      status: "skipped",
      reason: "RESEND_FROM_EMAIL belum di-set atau formatnya tidak valid.",
    };
  }

  const to = singleLine(input.to).toLowerCase();
  if (!EMAIL_RE.test(to) || to.length > 254) {
    return { status: "skipped", reason: "Email penerima tidak valid." };
  }

  const subject = singleLine(input.subject).slice(0, 180);
  if (!subject) {
    return { status: "skipped", reason: "Subject email kosong." };
  }

  const replyTo = input.replyTo?.trim();
  const payload: Record<string, unknown> = {
    from,
    to: [to],
    subject,
    html: input.html,
    text: input.text,
  };
  if (replyTo && EMAIL_RE.test(replyTo)) payload.reply_to = [replyTo];
  if (input.attachments?.length) {
    payload.attachments = input.attachments.map((attachment) => ({
      filename: attachment.filename,
      path: attachment.path,
      ...(attachment.contentId ? { content_id: attachment.contentId } : {}),
    }));
  }

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!res.ok) {
      let detail = `HTTP ${res.status}`;
      try {
        const body = (await res.json()) as { message?: unknown };
        if (typeof body.message === "string" && body.message.trim()) {
          detail = `${detail}: ${body.message.trim().slice(0, 200)}`;
        }
      } catch {
        /* body bukan JSON; pakai status saja */
      }
      console.error(`[email] Resend menolak pengiriman (${detail}).`);
      return { status: "failed", reason: "Resend menolak pengiriman email." };
    }

    return { status: "sent" };
  } catch (err) {
    const aborted = err instanceof Error && err.name === "TimeoutError";
    console.error(`[email] Gagal menghubungi Resend (${aborted ? "timeout" : "network"}).`);
    return {
      status: "failed",
      reason: aborted ? "Koneksi ke Resend timeout." : "Tidak dapat menghubungi Resend.",
    };
  }
}
