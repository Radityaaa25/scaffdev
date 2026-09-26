"use client";

import { useState } from "react";
import Link from "next/link";
import { CommandBox } from "@/components/CommandBox";
import { Reveal } from "./Reveal";

const FAQS = [
  {
    q: "Apa itu Scaffdev?",
    a: "Scaffolding generator: kamu dapat folder project siap jalan (UI jadi, struktur best-practice, .env.example, SETUP.md) hanya dengan satu baris command npx. Saat ini tersedia template Next.js dan Laravel.",
  },
  {
    q: "Apakah template-nya benar-benar siap pakai?",
    a: "Ya. Berbeda dengan boilerplate kosong, setiap template punya tampilan visual yang sudah jadi — e-commerce, landing page, portfolio — plus kurasi integrasi lokal seperti Supabase, Midtrans, Xendit, dan Duitku.",
  },
  {
    q: "Bagaimana CLI tahu template yang tersedia?",
    a: "CLI 100% API-driven: pilihan template = data is_published=true dari database yang sama dengan web ini. Kalau DB kosong, CLI menampilkan error eksplisit — tidak ada template hardcode/palsu.",
  },
  {
    q: "Apakah gratis?",
    a: "Ya, open-source untuk developer Indonesia (MIT). Cukup Node.js v18+, Git, dan koneksi internet untuk mulai generate.",
  },
  {
    q: "Di mana saya bisa bertanya atau lapor bug?",
    a: "Gunakan asisten AI di website, baca dokumentasi berbahasa Indonesia, atau kirim laporan via halaman Lapor Bug — bisa melampirkan gambar bukti.",
  },
];

function FaqItem({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  return (
    <div className={`overflow-hidden rounded-xl border transition-colors ${open ? "border-[#8B5CF6]/40 bg-[#131316]" : "border-[#26262B] bg-[#131316]/60 hover:border-white/15"}`}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="text-sm font-medium text-zinc-100">{q}</span>
        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs transition-all ${open ? "rotate-45 border-[#8B5CF6]/50 bg-[#8B5CF6]/15 text-[#A78BFA]" : "border-white/10 text-zinc-500"}`} aria-hidden="true">
          +
        </span>
      </button>
      <div className={`grid transition-all duration-300 ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
        <div className="overflow-hidden">
          <p className="px-5 pb-5 text-sm leading-relaxed text-zinc-400">{a}</p>
        </div>
      </div>
    </div>
  );
}

/** FAQ accordion + CTA final dengan CommandBox. */
export function FaqCta() {
  const [openIdx, setOpenIdx] = useState(0);

  return (
    <section className="relative">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
          <Reveal>
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-[#8B5CF6]">◆ FAQ</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Sering ditanyakan.
              </h2>
              <div className="mt-6 flex flex-col gap-3">
                {FAQS.map((f, i) => (
                  <FaqItem
                    key={f.q}
                    q={f.q}
                    a={f.a}
                    open={openIdx === i}
                    onToggle={() => setOpenIdx(openIdx === i ? -1 : i)}
                  />
                ))}
              </div>
              <Link href="/docs/faq" className="mt-4 inline-block text-sm font-medium text-[#8B5CF6] hover:underline">
                Lihat FAQ lengkap →
              </Link>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="landing-spot relative flex h-full flex-col justify-center overflow-hidden rounded-2xl border border-[#8B5CF6]/30 bg-gradient-to-b from-[#8B5CF6]/[0.12] to-[#131316] p-8 sm:p-10">
              <p className="font-mono text-xs uppercase tracking-widest text-[#A78BFA]">
                ◆ Mulai sekarang
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Ship project hari ini, bukan minggu depan.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                Tanpa install apa pun — cukup Node.js v18+, Git, dan koneksi internet.
              </p>
              <div className="mt-6">
                <CommandBox command="npx scaffdev@latest" />
              </div>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/templates"
                  className="inline-flex flex-1 items-center justify-center rounded-xl bg-[#8B5CF6] px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_30px_rgba(139,92,246,0.35)] transition-all hover:bg-[#7C3AED] active:scale-[0.98]"
                >
                  Jelajahi Template
                </Link>
                <Link
                  href="/builder"
                  className="inline-flex flex-1 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-zinc-200 transition-all hover:border-white/20 hover:text-white active:scale-[0.98]"
                >
                  Coba Builder
                </Link>
              </div>
              <p className="mt-4 text-center font-mono text-[11px] text-zinc-500">
                MIT License · Open-source untuk developer Indonesia 🇮🇩
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
