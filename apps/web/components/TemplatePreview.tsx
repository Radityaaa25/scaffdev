"use client";

import { useState } from "react";

interface TemplatePreviewProps {
  name: string;
  slug: string;
  screenshotUrl?: string;
  previewUrl?: string;
}

/**
 * Preview template: screenshot sebagai poster, live demo dimuat hanya
 * setelah user memilih tab. Iframe diberi sandbox agar halaman demo tidak
 * bisa menavigasi tab induk.
 */
export function TemplatePreview({ name, slug, screenshotUrl, previewUrl }: TemplatePreviewProps) {
  const [mode, setMode] = useState<"screenshot" | "live">(screenshotUrl || !previewUrl ? "screenshot" : "live");
  const showLive = previewUrl && mode === "live";

  return (
    <div className="mb-2">
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-[#3F3F4C] bg-[#24242C] shadow-2xl">
        {showLive ? (
          <iframe
            src={previewUrl}
            title={`Preview live ${name}`}
            className="h-full w-full bg-white"
            sandbox="allow-scripts allow-same-origin allow-forms"
            referrerPolicy="no-referrer"
            loading="lazy"
          />
        ) : screenshotUrl ? (
          <img src={screenshotUrl} alt={`Screenshot ${name}`} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#24242C] to-[#1B1B21] font-mono text-sm text-zinc-600">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-10 w-10 opacity-50">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
            Preview Belum Tersedia
          </div>
        )}

        {previewUrl ? (
          <div className="absolute left-3 top-3 flex gap-1.5 rounded-xl border border-white/10 bg-black/65 p-1 backdrop-blur">
            {screenshotUrl ? (
              <button
                type="button"
                onClick={() => setMode("screenshot")}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  mode === "screenshot" ? "bg-white text-zinc-900" : "text-zinc-300 hover:text-white"
                }`}
              >
                Screenshot
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setMode("live")}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                mode === "live" ? "bg-[#8B5CF6] text-white" : "text-zinc-300 hover:text-white"
              }`}
            >
              Live Preview
            </button>
          </div>
        ) : null}

        {previewUrl ? (
          <a
            href={previewUrl}
            target="_blank"
            rel="noreferrer"
            className="absolute right-3 top-3 rounded-xl border border-white/10 bg-black/65 px-3 py-1.5 text-xs font-medium text-zinc-200 backdrop-blur transition-all hover:bg-black/85 hover:text-white"
          >
            Buka tab baru ↗
          </a>
        ) : null}
      </div>

      <p className="mt-2.5 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-3.5 py-2 text-xs leading-relaxed text-amber-200/90">
        <strong className="font-semibold">Preview tidak 100% mirip dengan hasil generate.</strong>{" "}
        Tampilan bisa berbeda karena data contoh, aset, dan integrasi yang dipilih.
        {previewUrl ? " Demo dibuka dari sumber eksternal." : ""}
      </p>

      <p className="sr-only">Slug template: {slug}</p>
    </div>
  );
}
