"use client";

import { useEffect, useState } from "react";

export interface EmailNotificationPayload {
  status: "sent" | "failed" | "skipped";
  reason?: string;
  to: string;
  subject: string;
  text: string;
}

interface Props {
  notification: EmailNotificationPayload | null;
  onClose: () => void;
}

/**
 * Fallback saat Resend gagal/skipped: admin tetap bisa mengirim pesan manual
 * memakai subject dan body yang sama dengan template otomatis.
 */
export function ManualEmailDialog({ notification, onClose }: Props) {
  const [copied, setCopied] = useState<"subject" | "body" | null>(null);

  useEffect(() => {
    if (!notification) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [notification, onClose]);

  if (!notification || notification.status === "sent") return null;

  async function copy(kind: "subject" | "body") {
    try {
      await navigator.clipboard.writeText(
        kind === "subject" ? notification!.subject : notification!.text
      );
      setCopied(kind);
    } catch {
      setCopied(null);
    }
  }

  const mailto = `mailto:${notification.to}?subject=${encodeURIComponent(
    notification.subject
  )}&body=${encodeURIComponent(notification.text)}`;

  return (
    <div
      className="animate-admin-backdrop fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="animate-admin-popup glass-panel flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl p-6"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="manual-email-title"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 id="manual-email-title" className="text-base font-bold text-white">
              Email tidak terkirim otomatis
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">
              Status sudah tersimpan. Kirim pesan di bawah secara manual lewat email
              kantor atau aplikasi email kamu.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-sm text-zinc-400 transition-all hover:bg-white/10 hover:text-white"
          >
            ✕
          </button>
        </div>

        {notification.reason && (
          <p className="mt-4 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-2.5 text-xs leading-relaxed text-amber-200">
            {notification.reason}
          </p>
        )}

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Penerima
            </p>
            <p className="break-all rounded-lg border border-white/10 bg-black/20 px-3 py-2 font-mono text-xs text-zinc-200">
              {notification.to}
            </p>
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                Subject
              </p>
              <button
                type="button"
                onClick={() => copy("subject")}
                className="text-[11px] font-medium text-[#A78BFA] hover:underline"
              >
                {copied === "subject" ? "Tersalin" : "Copy"}
              </button>
            </div>
            <p className="break-words rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-zinc-200">
              {notification.subject}
            </p>
          </div>
        </div>

        <div className="mt-3 flex min-h-0 flex-1 flex-col">
          <div className="mb-1 flex items-center justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Isi pesan
            </p>
            <button
              type="button"
              onClick={() => copy("body")}
              className="text-[11px] font-medium text-[#A78BFA] hover:underline"
            >
              {copied === "body" ? "Tersalin" : "Copy"}
            </button>
          </div>
          <textarea
            readOnly
            value={notification.text}
            rows={12}
            className="glass-input min-h-[180px] w-full flex-1 resize-none rounded-xl px-3 py-2.5 font-mono text-xs leading-relaxed text-zinc-300"
          />
        </div>

        <div className="mt-5 flex flex-wrap justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-300 transition-all hover:bg-white/10 active:scale-95"
          >
            Tutup
          </button>
          <a
            href={mailto}
            className="rounded-lg bg-[#8B5CF6] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#8B5CF6]/25 transition-all hover:bg-[#7C3AED] active:scale-95"
          >
            Buka di aplikasi email
          </a>
        </div>
      </div>
    </div>
  );
}
