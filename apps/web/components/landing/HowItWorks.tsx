"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CommandBox } from "@/components/CommandBox";
import { Reveal } from "./Reveal";

const STEPS = [
  {
    no: "01",
    title: "Pilih template",
    desc: "Jelajahi katalog template. Setiap kartu menampilkan framework, kategori, dan integrasi yang dibawa — data live dari database yang sama dengan CLI.",
    link: { href: "/templates", label: "Buka katalog →" },
  },
  {
    no: "02",
    title: "Salin command",
    desc: "Setiap template punya slug unik. CLI 100% API-driven — tidak ada template hardcode atau palsu. DB kosong berarti error eksplisit, bukan daftar fiktif.",
    link: { href: "/docs/cara-install", label: "Cara install →" },
  },
  {
    no: "03",
    title: "Generate & kembangkan",
    desc: "Jalankan satu baris di terminal. Dapat folder project siap jalan: UI jadi, .env.example, dan SETUP.md — langsung bisa dikembangkan.",
    link: { href: "/docs/env-dan-setup", label: "Setup environment →" },
  },
];

/** Cara kerja scroll-progress: panel sticky kiri + langkah kanan yang aktif mengikuti scroll. */
export function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const range = Math.max(rect.height - vh * 0.5, 1);
      const passed = Math.min(Math.max((vh * 0.6 - rect.top) / range, 0), 1);
      setProgress(passed);

      const nodes = el.querySelectorAll("[data-step]");
      let idx = 0;
      nodes.forEach((n, i) => {
        if (n.getBoundingClientRect().top <= vh * 0.65) idx = i;
      });
      setActive(idx);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const step = STEPS[active];

  return (
    <section ref={sectionRef} className="relative">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:py-20">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-widest text-[#8B5CF6]">
            ◆ Cara kerja
          </p>
          <h2 className="mt-2 max-w-xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Dari nol ke project jalan dalam 3 langkah.
          </h2>
        </Reveal>

        {/* Progress bar (mobile: di atas; desktop: di panel sticky) */}
        <div className="mt-6 h-1 overflow-hidden rounded-full bg-white/[0.06] lg:hidden" aria-hidden="true">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] transition-[width] duration-150"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>

        <div className="mt-6 grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
          {/* Panel sticky */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <div className="landing-spot relative overflow-hidden rounded-2xl border border-[#26262B] bg-[#131316] p-6 sm:p-8">
              <div className="flex items-baseline justify-between">
                <p key={step.no} className="font-mono text-5xl font-extrabold text-[#8B5CF6]">
                  {step.no}
                  <span className="text-xl text-zinc-600">/03</span>
                </p>
                <div className="flex gap-1.5" aria-hidden="true">
                  {STEPS.map((s, i) => (
                    <span
                      key={s.no}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        i === active ? "w-8 bg-[#8B5CF6]" : i < active ? "w-4 bg-[#8B5CF6]/50" : "w-4 bg-white/10"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <h3 key={`t-${step.no}`} className="mt-4 text-xl font-bold text-white">
                {step.title}
              </h3>
              <p key={`d-${step.no}`} className="mt-2 min-h-20 text-sm leading-relaxed text-zinc-400">
                {step.desc}
              </p>
              {/* Progress bar desktop */}
              <div className="mt-4 hidden h-1 overflow-hidden rounded-full bg-white/[0.06] lg:block" aria-hidden="true">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] transition-[width] duration-150"
                  style={{ width: `${Math.round(progress * 100)}%` }}
                />
              </div>
              <p className="mt-2 hidden font-mono text-[11px] text-zinc-500 lg:block" aria-live="polite">
                Scroll untuk langkah berikutnya — {Math.round(progress * 100)}%
              </p>
              <div className="mt-6">
                <CommandBox command="npx scaffdev@latest" />
              </div>
              <p className="mt-4 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-xs leading-relaxed text-zinc-500">
                <span className="font-semibold text-zinc-300">Disclaimer:</span> ini hanya
                panduan singkat. Untuk detail tiap langkah, baca{" "}
                <Link href="/docs" className="font-medium text-[#8B5CF6] hover:underline">
                  Dokumentasi →
                </Link>
              </p>
            </div>
          </div>

          {/* Langkah scroll */}
          <div className="flex flex-col gap-6 lg:gap-0">
            {STEPS.map((s, i) => {
              const isActive = i === active;
              const isDone = i < active;
              return (
                <div
                  key={s.no}
                  data-step={i}
                  className="flex items-center lg:min-h-[62vh] lg:first:min-h-[50vh]"
                >
                  <div
                    className={`w-full rounded-2xl border p-6 transition-all duration-500 sm:p-8 ${
                      isActive
                        ? "border-[#8B5CF6]/50 bg-[#131316] shadow-[0_16px_50px_rgba(139,92,246,0.15)]"
                        : isDone
                          ? "border-white/[0.08] bg-[#131316]/70 opacity-70"
                          : "border-white/[0.06] bg-[#131316]/40 opacity-50"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-mono text-sm font-bold transition-all duration-500 ${
                          isActive
                            ? "bg-[#8B5CF6] text-white shadow-[0_0_24px_rgba(139,92,246,0.5)]"
                            : isDone
                              ? "border border-[#8B5CF6]/40 bg-[#8B5CF6]/10 text-[#A78BFA]"
                              : "border border-white/10 bg-white/[0.03] text-zinc-500"
                        }`}
                      >
                        {isDone && !isActive ? "✓" : s.no}
                      </span>
                      <h3 className={`text-lg font-bold transition-colors ${isActive ? "text-white" : "text-zinc-400"}`}>
                        {s.title}
                      </h3>
                    </div>
                    <p className="mt-4 text-sm leading-relaxed text-zinc-400">{s.desc}</p>
                    <Link
                      href={s.link.href}
                      className={`mt-4 inline-block text-sm font-medium transition-colors ${
                        isActive ? "text-[#8B5CF6] hover:underline" : "text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      {s.link.label}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
