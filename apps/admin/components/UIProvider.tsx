"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

interface ToastItem {
  id: number;
  kind: "success" | "error" | "info";
  message: string;
  leaving: boolean;
}

interface ConfirmOpts {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}

interface PendingConfirm extends ConfirmOpts {
  resolve: (value: boolean) => void;
}

interface UIContextValue {
  toast: {
    success(message: string): void;
    error(message: string): void;
    info(message: string): void;
  };
  confirm(opts: ConfirmOpts): Promise<boolean>;
}

const UIContext = createContext<UIContextValue | null>(null);

export function useUI(): UIContextValue {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI harus dipakai di dalam <UIProvider>.");
  return ctx;
}

let toastId = 0;

type ToastKind = ToastItem["kind"];

const toastTones: Record<
  ToastKind,
  { label: string; panel: string; glow: string; bar: string; badge: string; progress: string }
> = {
  success: {
    label: "Berhasil",
    panel: "border-emerald-500/25 bg-emerald-500/[0.07]",
    glow: "shadow-[0_8px_32px_rgb(0_0_0/0.35),0_0_24px_rgb(34_197_94/0.12)]",
    bar: "bg-emerald-400",
    badge: "bg-emerald-500/15 text-emerald-300",
    progress: "bg-emerald-400",
  },
  error: {
    label: "Gagal",
    panel: "border-red-500/30 bg-red-500/[0.08]",
    glow: "shadow-[0_8px_32px_rgb(0_0_0/0.35),0_0_24px_rgb(239_68_68/0.15)]",
    bar: "bg-red-400",
    badge: "bg-red-500/15 text-red-300",
    progress: "bg-red-400",
  },
  info: {
    label: "Info",
    panel: "border-[#8B5CF6]/30 bg-[#8B5CF6]/[0.08]",
    glow: "shadow-[0_8px_32px_rgb(0_0_0/0.35),0_0_24px_rgb(139_92_246/0.15)]",
    bar: "bg-[#8B5CF6]",
    badge: "bg-[#8B5CF6]/15 text-[#C4B5FD]",
    progress: "bg-[#8B5CF6]",
  },
};

function ToastIcon({ kind }: { kind: ToastKind }) {
  if (kind === "success") {
    return (
      <span className="animate-toast-icon-pop flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="#34D399" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" className="toast-check-circle" opacity={0.45} />
          <path d="M8 12.5l2.7 2.7L16 9.5" className="toast-check-mark" />
        </svg>
      </span>
    );
  }
  if (kind === "error") {
    return (
      <span className="animate-toast-icon-shake flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500/15">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="#F87171" strokeWidth={2.4} strokeLinecap="round">
          <circle cx="12" cy="12" r="10" opacity={0.45} />
          <path d="M9 9l6 6M15 9l-6 6" />
        </svg>
      </span>
    );
  }
  return (
    <span className="animate-toast-icon-pop flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#8B5CF6]/15">
      <svg viewBox="0 0 24 24" className="animate-toast-icon-pulse h-5 w-5 rounded-full" fill="none" stroke="#A78BFA" strokeWidth={2.2} strokeLinecap="round">
        <circle cx="12" cy="12" r="10" opacity={0.45} />
        <path d="M12 11v5" />
        <circle cx="12" cy="7.8" r="0.4" fill="#A78BFA" stroke="none" />
      </svg>
    </span>
  );
}

export function UIProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      timers.current.delete(id);
    }, 250);
    timers.current.set(id, timer);
  }, []);

  const pushToast = useCallback(
    (kind: ToastItem["kind"], message: string) => {
      const id = ++toastId;
      setToasts((prev) => [...prev.slice(-3), { id, kind, message, leaving: false }]);
      const timer = setTimeout(() => dismissToast(id), 4000);
      timers.current.set(id, timer);
    },
    [dismissToast]
  );

  useEffect(() => {
    const all = timers.current;
    return () => all.forEach((t) => clearTimeout(t));
  }, []);

  const confirm = useCallback((opts: ConfirmOpts) => {
    return new Promise<boolean>((resolve) => {
      setPendingConfirm({ ...opts, resolve });
    });
  }, []);

  function finishConfirm(value: boolean) {
    setPendingConfirm((prev) => {
      prev?.resolve(value);
      return null;
    });
  }

  useEffect(() => {
    if (!pendingConfirm) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") finishConfirm(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pendingConfirm]);

  const value: UIContextValue = {
    toast: {
      success: (m) => pushToast("success", m),
      error: (m) => pushToast("error", m),
      info: (m) => pushToast("info", m),
    },
    confirm,
  };

  return (
    <UIContext.Provider value={value}>
      {children}

      {/* Toast stack kanan atas (di bawah topbar mobile) */}
      <div className="pointer-events-none fixed right-5 top-[72px] z-[90] flex w-[calc(100vw-2.5rem)] max-w-sm flex-col gap-2 sm:top-6">
        {toasts.map((t) => {
          const tone = toastTones[t.kind];
          return (
            <div
              key={t.id}
              role={t.kind === "error" ? "alert" : "status"}
              className={`glass-panel pointer-events-auto relative flex items-start gap-3 overflow-hidden rounded-xl px-4 pb-4 pt-3 text-sm text-zinc-100 ${
                t.leaving ? "animate-admin-toast-leaving" : "animate-admin-toast"
              } ${tone.panel} ${tone.glow}`}
            >
              <span className={`absolute left-0 top-0 h-full w-1 ${tone.bar}`} />
              <ToastIcon kind={t.kind} />
              <div className="min-w-0 flex-1">
                <p className={`text-[11px] font-bold uppercase tracking-wider ${tone.badge} inline-block rounded-md px-1.5 py-0.5`}>
                  {tone.label}
                </p>
                <p className="mt-1 leading-relaxed">{t.message}</p>
              </div>
              <button
                type="button"
                onClick={() => dismissToast(t.id)}
                className="shrink-0 rounded-md p-1 text-zinc-500 transition-all hover:bg-white/10 hover:text-white active:scale-90"
                aria-label="Tutup notifikasi"
              >
                ✕
              </button>
              {!t.leaving && (
                <span className={`animate-toast-progress absolute bottom-0 left-0 h-0.5 ${tone.progress}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Modal konfirmasi */}
      {pendingConfirm && (
        <div
          className="animate-admin-backdrop fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => finishConfirm(false)}
        >
          <div
            className="animate-admin-popup glass-panel w-full max-w-sm rounded-2xl p-6"
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
          >
            <h3 className="text-base font-bold text-white">{pendingConfirm.title}</h3>
            <p className="mt-2 text-sm text-zinc-400">{pendingConfirm.message}</p>
            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => finishConfirm(false)}
                className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-300 transition-all hover:bg-white/10 active:scale-95"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => finishConfirm(true)}
                autoFocus
                className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all active:scale-95 ${
                  pendingConfirm.danger
                    ? "bg-[#EF4444] shadow-lg shadow-red-500/25 hover:bg-[#DC2626]"
                    : "bg-[#8B5CF6] shadow-lg shadow-[#8B5CF6]/25 hover:bg-[#7C3AED]"
                }`}
              >
                {pendingConfirm.confirmLabel ?? "Ya, lanjutkan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </UIContext.Provider>
  );
}
