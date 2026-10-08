"use client";

import React, { useState } from "react";
import Link from "next/link";

const HERO_COMMAND = "npx scaffdev@latest";

const HIGHLIGHTS = [
  "UI siap pakai, bukan folder kosong",
  "Integrasi lokal Indonesia",
  "Generate via 1 baris CLI",
];

/** Hero modern halaman katalog: copy + kartu terminal animasi ketik. */
export function TemplatesHero() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(HERO_COMMAND);
    } catch {
      /* clipboard tidak tersedia: tetap tampilkan status tersalin */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <section className="relative mb-10 overflow-hidden">
      <div className="relative grid items-center gap-10 py-8 sm:py-10 lg:grid-cols-[1.05fr_0.95fr] lg:py-14">
        {/* Kolom teks */}
        <div className="min-w-0">
          <p className="hero-enter hero-enter-1 inline-flex max-w-full items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1 pl-1.5 pr-3 text-xs text-zinc-400 backdrop-blur">
            <span className="shrink-0 rounded-full bg-[#8B5CF6] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
              Baru
            </span>
            <span className="truncate">Kombinasi integrasi custom sudah live di Builder</span>
          </p>
          <h1 className="hero-enter hero-enter-2 mt-5 text-[2rem] sm:text-5xl lg:text-[3.4rem] font-extrabold text-[#FAFAFA] tracking-tight leading-[1.08]">
            Hemat token <span className="text-[#8B5CF6]">AI-mu,</span>{" "}
            cukup setup dengan <span className="text-[#8B5CF6]">Scaffdev.</span>
          </h1>
          <p className="hero-enter hero-enter-3 mt-4 sm:mt-5 max-w-xl text-sm sm:text-base text-zinc-400 leading-relaxed">
            Starter kit <span className="text-zinc-200 font-medium">Next.js & Laravel</span> dengan
            tampilan visual yang sudah jadi dan struktur folder best-practice.
            Pilih template, salin command, generate. Langsung bisa dikembangkan.
          </p>

          <ul className="hero-enter hero-enter-3 mt-5 grid gap-2 sm:grid-cols-2 sm:gap-x-6 lg:grid-cols-1 xl:grid-cols-2">
            {HIGHLIGHTS.map((h) => (
              <li key={h} className="flex items-center gap-2.5 text-sm text-zinc-300">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="h-3 w-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 6L9 17l-5-5" />
                  </svg>
                </span>
                <span className="truncate sm:whitespace-normal">{h}</span>
              </li>
            ))}
          </ul>

          <div className="hero-enter hero-enter-4 mt-6 sm:mt-7 flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Link
              href="/templates"
              className="btn-gooey group"
            >
              Jelajahi Template
              <span className="ml-1.5 inline-block transition-transform group-hover:translate-y-0.5">↓</span>
              <span className="btn-gooey__blobs" aria-hidden="true">
                <div />
                <div />
                <div />
              </span>
            </Link>
            <svg xmlns="http://www.w3.org/2000/svg" version="1.1" aria-hidden="true" style={{ display: "block", height: 0, width: 0, position: "absolute" }}>
              <defs>
                <filter id="btn-gooey-filter">
                  <feGaussianBlur in="SourceGraphic" stdDeviation={10} result="blur" />
                  <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
                  <feBlend in="SourceGraphic" in2="goo" />
                </filter>
              </defs>
            </svg>
            <Link
              href="/docs"
              className="btn-bubbles w-full text-center sm:w-auto"
            >
              <span className="text">Baca Dokumentasi</span>
            </Link>
          </div>
        </div>

        {/* Kolom terminal animasi */}
        <div className="hero-enter hero-enter-4 relative mx-auto w-full max-w-md lg:mx-0 lg:justify-self-end">
          <div className="hero-term-float hero-term-float-1">
            <span className="dot bg-emerald-400" />
            Supabase connected
          </div>
          <div className="hero-term-float hero-term-float-2">
            <span className="dot bg-[#8B5CF6]" />
            Midtrans ready
          </div>

          <div className="hero-term-card">
            <div className="hero-term-glow" aria-hidden="true" />
            <div className="hero-term-wrap">
              <div className="hero-term-terminal">
                <div className="hero-term-head">
                  <div className="hero-term-dots" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </div>
                  <p className="hero-term-title">
                    <svg width="16px" height="16px" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeLinejoin="round" strokeLinecap="round" strokeWidth={2} stroke="currentColor" fill="none">
                      <path d="M7 15L10 12L7 9M13 15H17M7.8 21H16.2C17.8802 21 18.7202 21 19.362 20.673C19.9265 20.3854 20.3854 19.9265 20.673 19.362C21 18.7202 21 17.8802 21 16.2V7.8C21 6.11984 21 5.27976 20.673 4.63803C20.3854 4.07354 19.9265 3.6146 19.362 3.32698C18.7202 3 17.8802 3 16.2 3H7.8C6.11984 3 5.27976 3 4.63803 3.32698C4.07354 3.6146 3.6146 4.07354 3.32698 4.63803C3 5.27976 3 6.11984 3 7.8V16.2C3 17.8802 3 18.7202 3.32698 19.362C3.6146 19.9265 4.07354 20.3854 4.63803 20.673C5.27976 21 6.11984 21 7.8 21Z" />
                    </svg>
                    terminal · bash
                  </p>
                  <button
                    className={`hero-term-copy${copied ? " copied" : ""}`}
                    onClick={handleCopy}
                    type="button"
                    aria-label={copied ? "Tersalin!" : "Salin command"}
                    title={copied ? "Tersalin!" : "Salin command"}
                  >
                    {copied ? (
                      <svg width="16px" height="16px" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeLinejoin="round" strokeLinecap="round" strokeWidth={2} stroke="currentColor" fill="none">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    ) : (
                      <svg width="16px" height="16px" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeLinejoin="round" strokeLinecap="round" strokeWidth={2} stroke="currentColor" fill="none">
                        <path d="M9 5h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2h-2" />
                        <path d="M9 3m0 2a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v0a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2z" />
                      </svg>
                    )}
                  </button>
                </div>
                <div className="hero-term-body">
                  <pre className="hero-term-pre"><code>$&nbsp;</code><code>npx&nbsp;</code><code className="hero-term-cmd" data-cmd="scaffdev@latest" /></pre>
                  <p className="hero-term-out">
                    <span>✓</span>
                     <span className="dim">Project berhasil dibuat, happy coding!</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
          <p className="mt-3 pl-1 text-left font-mono text-[11px] text-zinc-500">
            {copied ? "✓ Command tersalin. Tempel di terminal" : "Satu baris command untuk generate project"}
          </p>
        </div>
      </div>
    </section>
  );
}
