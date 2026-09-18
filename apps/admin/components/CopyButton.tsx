"use client";

import { useState } from "react";

export function CopyButton({ text, label = "Salin" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-all duration-200 active:scale-90 ${
        copied
          ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
          : "border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white"
      }`}
    >
      {copied ? "✓ Tersalin" : label}
    </button>
  );
}
