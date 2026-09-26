"use client";

import { useEffect, useRef, useState } from "react";
import { Marked } from "marked";
import DOMPurify from "isomorphic-dompurify";
import { XIcon, ArrowUpIcon } from "./DocsIcons";

interface Msg {
  role: "user" | "assistant";
  content: string;
  /** HTML markdown final (diisi saat stream selesai). Selama streaming: tampilkan teks mentah. */
  html?: string;
}

const STORAGE_KEY = "scaffdev-askai-v1";
const RETENTION_MS = 7 * 24 * 60 * 60 * 1000; // 7 hari, sliding.
const MAX_STORED = 20;

const marked = new Marked({ breaks: true });

/**
 * Render markdown jawaban AI menjadi HTML aman.
 * NOTED: output AI = untrusted — WAJIB lewat DOMPurify (XSS via
 * <script>/<img onerror>/javascript: URL). Allowlist default sudah cukup
 * untuk teks + code + list + link (link asing tetap diklik user manual).
 */
async function renderMarkdown(md: string): Promise<string> {
  const raw = await marked.parse(md);
  return DOMPurify.sanitize(typeof raw === "string" ? raw : "");
}

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
  // True setelah token pertama tiba (indikator "berpikir" diganti teks mengalir).
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Typewriter: token AI ditampung di antrean, ditampilkan 1 huruf per tick
  // agar terlihat diketik (tidak tiba-tiba muncul segambreng).
  const TYPE_TICK_MS = 18;
  const TYPE_PER_TICK = 1;
  const queueRef = useRef("");
  const shownRef = useRef("");
  const streamDoneRef = useRef(false);
  const pumpTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function stopPump() {
    if (pumpTimerRef.current) {
      clearInterval(pumpTimerRef.current);
      pumpTimerRef.current = null;
    }
  }

  // Hentikan pompa bila komponen dilepas saat masih mengetik.
  useEffect(() => stopPump, []);

  // Persistensi browser: tiap ada pesan baru, simpan + perpanjang retensi 7 hari.
  // NOTED: pesan yang masih streaming (tanpa html) ikut tersimpan sebagai teks —
  // saat dibuka lagi ia tampil sebagai teks polos, aman.
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
  }, [messages, pending, open, streaming]);

  function toggleOpen() {
    if (open) {
      setShown(false);
      setOpen(false);
      return;
    }
    setOpen(true);
    requestAnimationFrame(() => setShown(true));
  }

  /** Set isi pesan assistant terakhir (buat bila belum ada). */
  function setLastAssistant(content: string) {
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.role === "assistant" && !last.html) {
        return [...prev.slice(0, -1), { ...last, content }];
      }
      return [...prev, { role: "assistant" as const, content }];
    });
  }

  /** Finalisasi pesan assistant terakhir: render markdown → html. */
  async function finalizeAssistant() {
    const htmlOf = async (content: string) => {
      try {
        return await renderMarkdown(content);
      } catch {
        return undefined;
      }
    };
    const lastContent = await new Promise<string>((resolve) => {
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        resolve(last && last.role === "assistant" ? last.content : "");
        return prev;
      });
    });
    if (!lastContent) return;
    const html = await htmlOf(lastContent);
    if (html) {
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.role === "assistant" && !last.html) {
          return [...prev.slice(0, -1), { ...last, html }];
        }
        return prev;
      });
    }
  }

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || pending) return;
    const next: Msg[] = [...messages, { role: "user" as const, content }].slice(-8);
    setMessages(next);
    setInput("");
    setPending(true);
    setStreaming(false);
    // Reset typewriter: antrean + tampilan mulai dari nol tiap pesan baru.
    stopPump();
    queueRef.current = "";
    shownRef.current = "";
    streamDoneRef.current = false;
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          history: next.slice(0, -1).slice(-4),
        }),
      });
      const ctype = res.headers.get("content-type") ?? "";
      if (!res.ok || !ctype.includes("text/event-stream")) {
        // Jalur JSON: jawaban instan (tolak-cepat) atau error terstruktur.
        let errText = "Asisten gagal menjawab.";
        try {
          const payload = (await res.json()) as { answer?: string; error?: string };
          if (res.ok && payload.answer) {
            const html = await renderMarkdown(payload.answer).catch(() => undefined);
            setMessages((prev) => [...prev, { role: "assistant" as const, content: payload.answer as string, html }]);
            return;
          }
          errText = payload.error || errText;
        } catch {
          /* body bukan JSON — pakai pesan default */
        }
      setMessages((prev) => [...prev, { role: "assistant", content: errText }]);
      setPending(false);
      setStreaming(false);
      return;
      }
      // Jalur SSE: token ditampung ke antrean, pompa typewriter yang
      // menampilkannya 1 huruf per tick (efek diketik).
      const reader = res.body?.getReader();
      if (!reader) throw new Error("no-stream");
      // Pompa: kuras antrean sedikit demi sedikit. Selesai (finalisasi
      // markdown + buka kunci tombol) hanya bila stream HABIS dan antrean KOSONG.
      stopPump();
      pumpTimerRef.current = setInterval(() => {
        const q = queueRef.current;
        if (!q) {
          if (streamDoneRef.current) {
            stopPump();
            void (async () => {
              await finalizeAssistant();
              setPending(false);
              setStreaming(false);
            })();
          }
          return;
        }
        shownRef.current += q.slice(0, TYPE_PER_TICK);
        queueRef.current = q.slice(TYPE_PER_TICK);
        setLastAssistant(shownRef.current);
      }, TYPE_TICK_MS);
      const decoder = new TextDecoder();
      let buf = "";
      let gotToken = false;
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const parts = buf.split("\n\n");
          buf = parts.pop() ?? "";
          for (const part of parts) {
            const line = part.trim().split("\n").find((l) => l.startsWith("data:"));
            if (!line) continue;
            const data = line.slice(5).trim();
            if (data === "[DONE]") continue;
            try {
              const json = JSON.parse(data) as {
                choices?: { delta?: { content?: string } }[];
              };
              const token = json.choices?.[0]?.delta?.content;
              if (token) {
                if (!gotToken) {
                  gotToken = true;
                  setStreaming(true);
                }
                queueRef.current += token;
              }
            } catch {
              /* chunk parsial — lewati */
            }
          }
        }
      } catch {
        // Stream terputus di tengah: antrekan yang sudah ada tetap diketik,
        // catatan ditambahkan di ekornya — lalu pompa menyelesaikan sisanya.
        if (gotToken) {
          queueRef.current += "\n\n_(Koneksi terputus — coba kirim ulang.)_";
        }
      }
      streamDoneRef.current = true;
      if (!gotToken) {
        // Stream kosong: tidak ada yang bisa diketik — tampilkan error langsung.
        stopPump();
        setMessages((prev) => [...prev, { role: "assistant", content: "AI tidak memberikan jawaban. Coba lagi." }]);
        setPending(false);
        setStreaming(false);
        return;
      }
    } catch {
      stopPump();
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        // Stream terputus sebelum token pertama: tampilkan error langsung.
        if (last && last.role === "assistant" && last.content && !last.html) {
          return [...prev.slice(0, -1), { ...last, content: `${last.content}\n\n_(Koneksi terputus — coba kirim ulang.)_` }];
        }
        return [...prev, { role: "assistant", content: "Tidak dapat menghubungi asisten. Coba lagi." }];
      });
      setPending(false);
      setStreaming(false);
    }
  }

  // Indikator "berpikir": tampil selama menunggu token pertama.
  const thinking = pending && !streaming;

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
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "whitespace-pre-wrap rounded-br-md bg-[#8B5CF6] text-white shadow-lg shadow-[#8B5CF6]/25"
                      : "rounded-bl-md border border-[#26262B] bg-white/[0.04] text-zinc-200"
                  }`}
                >
                  {m.role === "user" || !m.html ? (
                    <span className="whitespace-pre-wrap">{m.content}</span>
                  ) : (
                    // NOTED: html sudah lewat DOMPurify saat finalisasi — aman dirender.
                    <span className="chat-md" dangerouslySetInnerHTML={{ __html: m.html }} />
                  )}
                </div>
              </div>
            ))}
            {thinking && (
              <div className="flex justify-start">
                <div
                  className="flex items-center gap-2.5 rounded-2xl rounded-bl-md border border-[#26262B] bg-white/[0.04] px-4 py-3"
                  role="status"
                  aria-label="Scaffbot sedang berpikir"
                >
                  <span className="flex gap-1.5" aria-hidden="true">
                    {[0, 1, 2].map((d) => (
                      <span
                        key={d}
                        className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#8B5CF6]"
                        style={{ animationDelay: `${d * 0.15}s` }}
                      />
                    ))}
                  </span>
                  <span className="text-xs text-zinc-400">Scaffbot sedang berpikir…</span>
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
