"use client";

import { useState } from "react";
import Link from "next/link";

/**
 * Kartu trust kecil di halaman detail template: mengarahkan ke panduan
 * keamanan + command audit siap salin (dinamis per repo, tanpa hardcode).
 */
export function SecurityTrustBox({ repoUrl }: { repoUrl: string }) {
  const [copied, setCopied] = useState(false);
  const cmd = `npx scaffdev validate-module ${repoUrl}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(cmd);
    } catch {
      /* clipboard tidak tersedia: tetap tampilkan status tersalin */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <section
      aria-label="Security dan trust"
      className="bg-[#24242C] border border-[#3F3F4C] rounded-2xl p-6"
    >
      <h2 className="text-base font-semibold text-[#FAFAFA] mb-3">
        Security &amp; Trust
      </h2>
      <p className="text-xs text-zinc-400 leading-relaxed">
        Kami sarankan memeriksa template sebelum menjalankannya. ScaffDev
        menyediakan audit keamanan repository dasar + validasi CLI untuk
        membantu meninjau script mencurigakan sebelum instalasi.
      </p>
      <p className="mt-3 truncate rounded-lg border border-[#3F3F4C] bg-black/30 px-3 py-2 font-mono text-[11px] text-zinc-300" title={cmd}>
        {cmd}
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <Link
          href="/docs/audit-keamanan"
          className="inline-flex flex-1 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-zinc-200 transition-all hover:border-white/20 hover:text-white"
        >
          Baca Panduan Keamanan
        </Link>
        <button
          type="button"
          onClick={copy}
          className="inline-flex flex-1 items-center justify-center rounded-xl border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 px-4 py-2 text-xs font-medium text-[#C4B5FD] transition-all hover:bg-[#8B5CF6]/20 active:scale-[0.98]"
        >
          {copied ? "✓ Tersalin" : "Salin Command Audit"}
        </button>
      </div>
    </section>
  );
}
