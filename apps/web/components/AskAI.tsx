"use client";

import { useEffect, useRef, useState } from "react";
import { XIcon, ArrowUpIcon } from "./DocsIcons";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const STORAGE_KEY = "scaffdev-askai-v1";
const RETENTION_MS = 7 * 24 * 60 * 60 * 1000; // 7 hari, sliding.
const MAX_STORED = 20;

/** Muat riwayat dari browser bila masih dalam masa retensi 7 hari. */
function loadStoredMessages(): Msg[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { savedAt?: unknown; messages?: unknown };
    if (typeof parsed.savedAt !== "number" || Date.now() - parsed.savedAt > RETENTION_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return [];
    }
    if (!Array.isArray(parsed.messages)) return [];
    return parsed.messages
      .filter(
        (m): m is Msg =>
          typeof m === "object" && m !== null &&
          ((m as Msg).role === "user" || (m as Msg).role === "assistant") &&
          typeof (m as Msg).content === "string" &&
          (m as Msg).content.length > 0
      )
      .slice(-MAX_STORED);
  } catch {
    return [];
  }
}

const SUGGESTIONS = [
  "Bagaimana cara install template?",
  "Apakah ada template Laravel?",
  "Error slug tidak ditemukan, kenapa?",
];

export function AskAI() {
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false);
  const [messages, setMessages] = useState<Msg[]>(() => loadStoredMessages());
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Persistensi browser: tiap ada pesan baru, simpan + perpanjang retensi 7 hari.
  useEffect(() => {
    try {
      if (messages.length === 0) {
        localStorage.removeItem(STORAGE_KEY);
        return;
      }
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ savedAt: Date.now(), messages: messages.slice(-MAX_STORED) })
      );
    } catch {
      /* storage penuh/diblokir — chat tetap jalan tanpa persistensi */
    }
  }, [messages]);

  function clearHistory() {
    setMessages([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* abaikan */
    }
  }

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending, open ]);

  function toggleOpen() {
    if (open) {
      setShown(false);
      setOpen(false);
      return;
    }
    setOpen(true);
    requestAnimationFrame(() => setShown(true));
  }

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || pending) return;
    const next: Msg[] = [...messages, { role: "user" as const, content }].slice(-8);
    setMessages(next);
    setInput("");
    setPending(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          history: next.slice(0, -1).slice(-4),
        }),
      });
      const payload = (await res.json()) as { answer?: string; error?: string };
      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: payload.error || "Asisten gagal menjawab." },
        ]);
        return;
      }
      setMessages((prev) => [...prev, { role: "assistant" as const, content: payload.answer ?? "" }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Tidak dapat menghubungi asisten. Coba lagi." },
      ]);
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      {open && (
        <div
          className={`fixed bottom-24 right-5 z-[80] flex h-[min(520px,calc(100dvh-8rem))] w-[min(92vw,380px)] origin-bottom-right flex-col overflow-hidden rounded-2xl border border-[#26262B] bg-[#101014]/95 shadow-2xl shadow-black/50 backdrop-blur-2xl transition-all duration-200 ${
            shown ? "scale-100 opacity-100" : "scale-95 opacity-0"
          }`}
        >
          <div className="border-b border-[#26262B] bg-gradient-to-r from-[#8B5CF6]/20 to-transparent px-4 py-3">
              <div className="flex items-center gap-2.5">
                <img
                  src="/logo-icon.png"
                  alt="Asisten Scaffdev"
                  className="h-8 w-8 drop-shadow-[0_0_10px_rgba(139,92,246,0.55)]"
                  loading="lazy"
                />
              <div className="flex-1">
                <p className="text-sm font-semibold text-[#FAFAFA]">Tanya Scaffdev</p>
                <p className="text-[11px] text-zinc-500">Jawaban dari dokumentasi & katalog</p>
              </div>
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={clearHistory}
                  className="rounded-lg px-2 py-1.5 text-[11px] font-medium text-zinc-500 transition-all hover:bg-white/10 hover:text-zinc-200 active:scale-90"
                  title="Hapus riwayat chat di browser ini"
                >
                  Hapus
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-zinc-400 transition-all hover:bg-white/10 hover:text-white active:scale-90"
                aria-label="Tutup asisten"
              >
                <XIcon />
              </button>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.length === 0 && (
              <div className="space-y-2">
                <p className="text-sm text-zinc-400">
                  Halo! Tanya apa saja soal CLI, template, setup, atau error yang kamu temui.
                </p>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="block w-full rounded-xl border border-[#26262B] bg-white/[0.03] px-3 py-2 text-left text-xs text-zinc-300 transition-all hover:border-[#8B5CF6]/40 hover:bg-[#8B5CF6]/10 active:scale-[0.98]"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "rounded-br-md bg-[#8B5CF6] text-white shadow-lg shadow-[#8B5CF6]/25"
                      : "rounded-bl-md border border-[#26262B] bg-white/[0.04] text-zinc-200"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {pending && (
              <div className="flex justify-start">
                <div className="flex gap-1.5 rounded-2xl rounded-bl-md border border-[#26262B] bg-white/[0.04] px-4 py-3">
                  {[0, 1, 2].map((d) => (
                    <span
                      key={d}
                      className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400"
                      style={{ animationDelay: `${d * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); send(); }}
            className="flex gap-2 border-t border-[#26262B] p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tulis pertanyaan…"
              maxLength={500}
              className="flex-1 rounded-xl border border-[#26262B] bg-[#0A0A0B] px-3.5 py-2 text-sm text-[#FAFAFA] placeholder:text-zinc-600 focus:border-[#8B5CF6]/60 focus:outline-none"
            />
            <button
              type="submit"
              disabled={pending || !input.trim()}
              className="rounded-xl bg-[#8B5CF6] px-4 text-sm font-semibold text-white shadow-lg shadow-[#8B5CF6]/25 transition-all hover:bg-[#7C3AED] active:scale-90 disabled:opacity-50"
              aria-label="Kirim pesan"
            >
              <ArrowUpIcon />
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={toggleOpen}
        aria-label={open ? "Tutup asisten AI" : "Buka asisten AI"}
        className={`fixed bottom-6 right-6 z-[80] flex h-14 w-14 items-center justify-center rounded-full border border-[#8B5CF6]/50 bg-[#0A0A0B]/90 text-white shadow-xl shadow-[#8B5CF6]/40 backdrop-blur transition-all duration-300 hover:scale-110 hover:shadow-[#8B5CF6]/60 hover:border-[#8B5CF6] active:scale-90 ${open ? "rotate-90" : ""}`}
      >
        {open ? (
          <XIcon className="h-5 w-5" />
        ) : (
          <img
            src="/logo-icon.png"
            alt=""
            aria-hidden="true"
            className="h-9 w-9 drop-shadow-[0_0_12px_rgba(139,92,246,0.65)]"
            loading="lazy"
          />
        )}
      </button>
    </>
  );
}
