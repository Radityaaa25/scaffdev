import type { Metadata } from "next";
import Link from "next/link";

/**
 * Halaman 404 global — dipakai setiap `notFound()` (mis. slug template/docs
 * tidak ada) dan URL nyasar. Render di dalam layout utama (navbar + footer
 * tetap tampil). Jangan tambahkan logika fetch di sini.
 */
export const metadata: Metadata = {
  title: "404 — Halaman tidak ditemukan",
  description: "Halaman yang kamu cari tidak ada atau sudah dipindah.",
  robots: { index: false, follow: true },
};

const SHORTCUTS = [
  { href: "/", label: "Beranda", desc: "Mulai dari awal" },
  { href: "/templates", label: "Katalog Template", desc: "Lihat semua template" },
  { href: "/builder", label: "Builder", desc: "Rancang sendiri" },
  { href: "/docs", label: "Dokumentasi", desc: "Panduan & troubleshooting" },
];

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center px-4 py-16 text-center sm:px-6 sm:py-24">
      <p className="font-mono text-xs font-bold tracking-[0.3em] text-[#8B5CF6]">
        ERROR 404
      </p>
      <h1 className="mt-3 bg-gradient-to-br from-white via-white to-[#8B5CF6] bg-clip-text text-7xl font-extrabold tracking-tight text-transparent sm:text-8xl">
        404
      </h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-zinc-400 sm:text-base">
        Halaman yang kamu cari tidak ada atau sudah dipindah. Mungkin salah
        ketik URL, atau template-nya sudah di-unpublish.
      </p>

      {/* Kartu terminal — motif khas Scaffdev, murni dekoratif */}
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
            <span className="text-[#8B5CF6]">$</span> scaffdev resolve ./halaman-ini
          </p>
          <p className="text-red-400">error: route not found (404)</p>
          <p className="text-zinc-500">
            <span className="text-[#8B5CF6]">$</span>{" "}
            <span className="text-zinc-300">scaffdev --help</span>{" "}
            <span className="text-zinc-600"># atau pilih jalan pintas ↓</span>
          </p>
        </div>
      </div>

      <nav aria-label="Jalan pintas" className="mt-8 grid w-full max-w-md grid-cols-1 gap-2.5 sm:grid-cols-2">
        {SHORTCUTS.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="group rounded-2xl border border-white/[0.07] bg-white/[0.02] px-4 py-3 text-left transition-all hover:-translate-y-0.5 hover:border-[#8B5CF6]/40 hover:bg-white/[0.04]"
          >
            <span className="block text-sm font-semibold text-white group-hover:text-[#C4B5FD]">
              {s.label}
            </span>
            <span className="mt-0.5 block text-xs text-zinc-500">{s.desc}</span>
          </Link>
        ))}
      </nav>

      <p className="mt-6 text-xs text-zinc-600">
        Tips: tekan{" "}
        <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[11px] text-zinc-400">
          Ctrl K
        </kbd>{" "}
        untuk cari halaman apa pun.
      </p>
    </main>
  );
}
