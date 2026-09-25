"use client";

import Link from "next/link";
import { useEffect } from "react";

/**
 * Error boundary segmen root — menangkap error runtime saat render
 * (mis. fetch API gagal total). WAJIB client component ("use client") + terima
 * props { error, reset } dari Next.js. Tidak boleh melempar error lagi.
 */
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Dicatat ke console agar bisa dilaporkan (tanpa mengirim ke mana pun).
    console.error("[scaffdev] page error:", error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center px-4 py-16 text-center sm:px-6 sm:py-24">
      <p className="font-mono text-xs font-bold tracking-[0.3em] text-red-400">
        ERROR 500
      </p>
      <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
        Ada yang rusak di sini
      </h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-zinc-400 sm:text-base">
        Halaman gagal dimuat — biasanya karena koneksi ke API terputus atau
        server sedang restart. Datamu aman, tidak ada yang hilang.
      </p>

      <div
        aria-hidden="true"
        className="mt-8 w-full max-w-md overflow-hidden rounded-2xl border border-[#26262B] bg-[#0A0A0B] text-left shadow-2xl shadow-black/50"
      >
        <div className="flex items-center gap-1.5 border-b border-white/[0.06] px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
          <span className="ml-2 font-mono text-[11px] text-zinc-600">scaffdev — zsh</span>
        </div>
        <div className="space-y-1.5 px-4 py-3.5 font-mono text-xs leading-relaxed sm:text-[13px]">
          <p className="text-zinc-500">
            <span className="text-[#8B5CF6]">$</span> scaffdev render ./halaman-ini
          </p>
          <p className="truncate text-red-400">
            error: {error.message || "unexpected render failure"}
          </p>
          {error.digest && (
            <p className="text-zinc-600">digest: {error.digest}</p>
          )}
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-2.5 sm:flex-row">
        <button
          type="button"
          onClick={reset}
          className="rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-[#8B5CF6]/30 transition-all hover:brightness-110 active:scale-[0.98]"
        >
          Coba lagi
        </button>
        <Link
          href="/"
          className="rounded-xl border border-white/10 bg-white/5 px-6 py-2.5 text-center text-sm font-medium text-zinc-300 transition-all hover:bg-white/10 hover:text-white active:scale-[0.98]"
        >
          Kembali ke Beranda
        </Link>
      </div>

      <p className="mt-6 text-xs text-zinc-600">
        Masih gagal?{" "}
        <Link href="/lapor" className="text-[#8B5CF6] hover:underline">
          Laporkan bug →
        </Link>
      </p>
    </main>
  );
}
