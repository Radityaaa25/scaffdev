"use client";

import { useState } from "react";

const CLIPBOARD_SVG = (
  <svg viewBox="0 0 6.35 6.35" height="20" width="20" aria-hidden="true" className="clipboard">
    <g>
      <path
        fill="currentColor"
        d="M2.43.265c-.3 0-.548.236-.573.53h-.328a.74.74 0 0 0-.735.734v3.822a.74.74 0 0 0 .735.734H4.82a.74.74 0 0 0 .735-.734V1.529a.74.74 0 0 0-.735-.735h-.328a.58.58 0 0 0-.573-.53zm0 .529h1.49c.032 0 .049.017.049.049v.431c0 .032-.017.049-.049.049H2.43c-.032 0-.05-.017-.05-.049V.843c0-.032.018-.05.05-.05zm-.901.53h.328c.026.292.274.528.573.528h1.49a.58.58 0 0 0 .573-.529h.328a.2.2 0 0 1 .206.206v3.822a.2.2 0 0 1-.206.205H1.53a.2.2 0 0 1-.206-.205V1.529a.2.2 0 0 1 .206-.206z"
      />
    </g>
  </svg>
);

const CHECKMARK_SVG = (
  <svg viewBox="0 0 24 24" height="18" width="18" aria-hidden="true" className="checkmark">
    <g>
      <path
        fill="currentColor"
        d="M9.707 19.121a.997.997 0 0 1-1.414 0l-5.646-5.647a1.5 1.5 0 0 1 0-2.121l.707-.707a1.5 1.5 0 0 1 2.121 0L9 14.171l9.525-9.525a1.5 1.5 0 0 1 2.121 0l.707.707a1.5 1.5 0 0 1 0 2.121z"
      />
    </g>
  </svg>
);

/**
 * Tombol salin gaya docs: ikon + tooltip bubble ("Tersalin!").
 * Memakai CSS global `.terminal-copy` (lihat globals.css).
 */
export function CopyIconButton({
  text,
  label = "Salin ke clipboard",
}: {
  text: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* abaikan: clipboard API tidak tersedia */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? "Tersalin!" : label}
      title={copied ? "Tersalin!" : label}
      className={`copy terminal-copy${copied ? " copied" : ""}`}
    >
      <span data-text-initial={label} data-text-end="Tersalin!" className="tooltip" />
      <span className="terminal-copy-icons">
        {CLIPBOARD_SVG}
        {CHECKMARK_SVG}
      </span>
    </button>
  );
}
