"use client";

import { useEffect, useRef, useState } from "react";
import { useUI } from "./UIProvider";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

interface SessionItem {
  id: string;
  title: string;
  updated_at: string;
}

const SUGGESTIONS = [
  "Template apa yang paling sering di-generate?",
  "Template Laravel apa saja yang sudah publish?",
  "Integrasi apa saja yang tersedia?",
];

const STORAGE_KEY = "scaffdev-admin-ai-session";

function readStoredSession(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStoredSession(id: string | null) {
  try {
    if (id) localStorage.setItem(STORAGE_KEY, id);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* abaikan — mode privat dsb. */
  }
}

function relativeTime(iso: string): string {  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "baru saja";
  if (m < 60) return `${m} mnt lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} hari lalu`;
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

export function AIAssistant() {
  const { toast, confirm } = useUI();
  const [open, setOpen] = useState(false);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending, open]);

  async function fetchSessions() {
    setLoadingList(true);
    try {
      const res = await fetch("/api/assistant/sessions");
      const payload = (await res.json()) as { sessions?: SessionItem[] };
      if (res.ok) setSessions(payload.sessions ?? []);
    } catch {
      /* abaikan — bubble tetap bisa dipakai */
    } finally {
      setLoadingList(false);
    }
  }

  function toggleOpen() {
    const next = !open;
    setOpen(next);
    if (next) {
      void fetchSessions();
      // Pulihkan sesi terakhir setelah refresh (ID tersimpan lokal).
      if (!activeId) {
        const stored = readStoredSession();
        if (stored) void selectSession(stored, true);
      }
    }
  }

  const activeTitle = sessions.find((s) => s.id === activeId)?.title ?? "Chat baru";

  async function selectSession(id: string, quiet = false) {
    setMenuOpen(false);
    if (id === activeId) return;
    setLoadingMsgs(true);
    try {
      const res = await fetch(`/api/assistant/sessions/${encodeURIComponent(id)}`);
      const payload = (await res.json()) as { messages?: Msg[]; error?: string };
      if (!res.ok) {
        // Sesi tersimpan tapi sudah tidak ada (dihapus/kedaluwarsa) → mulai baru diam-diam.
        if (res.status === 404 || res.status === 410) {
          writeStoredSession(null);
          setActiveId(null);
          setMessages([]);
          if (!quiet) toast.error(payload.error || "Sesi tidak tersedia.");
          await fetchSessions();
          return;
        }
        if (!quiet) toast.error(payload.error || "Gagal memuat sesi.");
        return;
      }
      setActiveId(id);
      writeStoredSession(id);
      setMessages((payload.messages ?? []).filter((m) => m.role === "user" || m.role === "assistant"));
    } catch {
      if (!quiet) toast.error("Tidak dapat memuat sesi.");
    } finally {
      setLoadingMsgs(false);
    }
  }

  function newChat() {
    setMenuOpen(false);
    setActiveId(null);
    writeStoredSession(null);
    setMessages([]);
  }

  async function deleteSession(id: string, title: string) {
    const ok = await confirm({
      title: "Hapus sesi chat?",
      message: `Riwayat "${title}" dihapus permanen dan tidak bisa dikembalikan.`,
      confirmLabel: "Ya, hapus",
      danger: true,
    });
    if (!ok) return;
    try {
      const res = await fetch(`/api/assistant/sessions/${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Gagal menghapus sesi.");
        return;
      }
      toast.success("Sesi dihapus.");
      if (id === activeId) {
        setActiveId(null);
        writeStoredSession(null);
        setMessages([]);
      }
      setMenuOpen(false);
      await fetchSessions();
    } catch {
      toast.error("Tidak dapat menghapus sesi.");
    }
  }

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || pending) return;
    setMessages((prev) => [...prev, { role: "user" as const, content }]);
    setInput("");
    setPending(true);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content, sessionId: activeId }),
      });
      const payload = (await res.json()) as { answer?: string; sessionId?: string; error?: string };
      if (!res.ok) {
        if (res.status === 410) {
          toast.info(payload.error || "Sesi kedaluwarsa. Mulai chat baru.");
          newChat();
          await fetchSessions();
        } else {
          toast.error(payload.error || "Asisten gagal menjawab.");
        }
        setMessages((prev) => prev.slice(0, -1));
        return;
      }
      if (payload.sessionId && payload.sessionId !== activeId) {
        setActiveId(payload.sessionId);
        writeStoredSession(payload.sessionId);
        await fetchSessions();
      }
      setMessages((prev) => [...prev, { role: "assistant" as const, content: payload.answer ?? "" }]);
    } catch {
      toast.error("Tidak dapat menghubungi asisten.");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      {/* Panel chat */}
      {open && (
        <div className="animate-admin-popup fixed bottom-24 right-5 z-[80] flex h-[min(560px,calc(100dvh-8rem))] w-[min(92vw,390px)] origin-bottom-right flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#101014]/95 shadow-2xl shadow-black/50 backdrop-blur-2xl">
          {/* Header + pemilih sesi */}
          <div className="relative border-b border-white/5 bg-gradient-to-r from-[#8B5CF6]/20 to-transparent px-4 py-3">
            <div className="flex items-center gap-2.5">
              <img
                src="/logo-icon.png"
                alt="Asisten Scaffdev"
                className="h-8 w-8 shrink-0 rounded-lg"
                loading="lazy"
              />
              <button
                type="button"
                onClick={() => { setMenuOpen((v) => !v); if (!menuOpen) void fetchSessions(); }}
                className="flex min-w-0 flex-1 items-center gap-1.5 rounded-lg px-1 py-0.5 text-left transition-colors hover:bg-white/5"
                aria-label="Pilih sesi chat"
              >
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-white">
                  {activeTitle}
                </span>
                <span className={`shrink-0 text-xs text-zinc-400 transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`}>▾</span>
              </button>
              <button
                type="button"
                onClick={newChat}
                title="Chat baru"
                className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-zinc-300 transition-all hover:bg-white/10 hover:text-white active:scale-90"
              >
                ＋ Baru
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="shrink-0 rounded-lg p-1.5 text-zinc-400 transition-all hover:bg-white/10 hover:text-white active:scale-90"
                aria-label="Tutup asisten"
              >
                ✕
              </button>
            </div>
            <p className="mt-0.5 pl-[42px] text-[11px] text-zinc-500">Riwayat tersimpan 30 hari · terhubung live ke DB</p>

            {/* Dropdown sesi */}
            {menuOpen && (
              <div className="animate-admin-popup absolute left-3 right-3 top-full z-10 mt-1 max-h-64 overflow-y-auto rounded-xl border border-white/10 bg-[#141419]/95 p-1.5 shadow-2xl backdrop-blur-2xl">
                {loadingList ? (
                  <div className="space-y-2 p-2">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="skeleton-shimmer h-11 rounded-lg" />
                    ))}
                  </div>
                ) : sessions.length === 0 ? (
                  <p className="px-3 py-4 text-center text-xs text-zinc-500">Belum ada riwayat chat.</p>
                ) : (
                  sessions.map((s) => (
                    <div
                      key={s.id}
                      className={`group flex items-center gap-1 rounded-lg transition-colors ${s.id === activeId ? "bg-[#8B5CF6]/15" : "hover:bg-white/5"}`}
                    >
                      <button
                        type="button"
                        onClick={() => selectSession(s.id)}
                        className="min-w-0 flex-1 px-3 py-2.5 text-left"
                      >
                        <p className="truncate text-xs font-medium text-zinc-200">{s.title}</p>
                        <p className="font-mono text-[10px] text-zinc-500">{relativeTime(s.updated_at)}</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteSession(s.id, s.title)}
                        title="Hapus sesi"
                        aria-label={`Hapus sesi ${s.title}`}
                        className="mr-1 shrink-0 rounded-md p-1.5 text-zinc-600 transition-all hover:bg-red-500/15 hover:text-red-300 active:scale-90 sm:opacity-0 sm:group-hover:opacity-100"
                      >
                        ✕
                      </button>
                    </div>
                  ))
                )}
                <p className="px-3 pb-1.5 pt-2 text-center text-[10px] text-zinc-600">
                  Otomatis terhapus permanen 30 hari setelah aktivitas terakhir
                </p>
              </div>
            )}
          </div>

          {/* Pesan */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {loadingMsgs ? (
              <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="skeleton-shimmer h-12 rounded-2xl" />
                ))}
              </div>
            ) : (
              <>
                {messages.length === 0 && (
                  <div className="animate-admin-enter space-y-2">
                    <p className="text-sm text-zinc-400">
                      Tanya apa saja soal katalog — mis. template terlaris atau status publish.
                    </p>
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => send(s)}
                        className="block w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-left text-xs text-zinc-300 transition-all hover:border-[#8B5CF6]/40 hover:bg-[#8B5CF6]/10 active:scale-[0.98]"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`animate-admin-enter flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                        m.role === "user"
                          ? "rounded-br-md bg-[#8B5CF6] text-white shadow-lg shadow-[#8B5CF6]/25"
                          : "rounded-bl-md border border-white/10 bg-white/[0.04] text-zinc-200"
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                ))}
                {pending && (
                  <div className="flex justify-start">
                    <div className="flex gap-1.5 rounded-2xl rounded-bl-md border border-white/10 bg-white/[0.04] px-4 py-3">
                      {[0, 1, 2].map((d) => (
                        <span key={d} className="typing-dot h-1.5 w-1.5 rounded-full bg-zinc-400" />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); send(); }}
            className="flex gap-2 border-t border-white/5 p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tanya soal katalog…"
              maxLength={1000}
              className="glass-input flex-1 rounded-xl px-3.5 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={pending || !input.trim()}
              className="rounded-xl bg-[#8B5CF6] px-4 text-sm font-semibold text-white shadow-lg shadow-[#8B5CF6]/25 transition-all hover:bg-[#7C3AED] active:scale-90 disabled:opacity-50"
              aria-label="Kirim pesan"
            >
              ↑
            </button>
          </form>
        </div>
      )}

      {/* Bubble */}
      <button
        type="button"
        onClick={toggleOpen}
        aria-label={open ? "Tutup asisten AI" : "Buka asisten AI"}
        className={`fixed bottom-6 right-6 z-[80] flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9] text-xl text-white shadow-xl shadow-[#8B5CF6]/40 transition-all duration-300 hover:scale-110 hover:shadow-[#8B5CF6]/60 active:scale-90 ${open ? "rotate-90" : ""}`}
      >
        {open ? "✕" : "✦"}
        {!open && (
          <span className="absolute inset-0 animate-ping rounded-full bg-[#8B5CF6]/30 [animation-duration:2.5s]" />
        )}
      </button>
    </>
  );
}
