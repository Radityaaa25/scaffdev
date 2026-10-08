"use client";

import React, { useState } from "react";
import { CheckIcon } from "@/components/DocsIcons";

/**
 * Varian CommandBox KHUSUS landing.
 *
 * Dipisah dari `components/CommandBox.tsx` supaya styling responsif yang
 * dipakai landing (padding/font mengecil di mobile, `w-full`, `flex-1` pada
 * konten) tidak ikut mengubah tampilan halaman docs/builder/templates —
 * komponen shared tetap persis seperti di `main`.
 */
interface LandingCommandBoxProps {
  command: string;
  className?: string;
}

export function LandingCommandBox({ command, className = "" }: LandingCommandBoxProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div
      className={`relative flex min-w-0 w-full max-w-full overflow-hidden items-center justify-between gap-2 bg-[#24242C] border border-[#3F3F4C] rounded-lg px-3 py-2.5 font-mono text-xs shadow-inner group hover:border-[#8B5CF6]/50 transition-colors sm:gap-3 sm:px-4 sm:py-3 sm:text-sm ${className}`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto select-all scrollbar-none">
        <span className="text-[#8B5CF6] select-none font-bold">$</span>
        <span className="text-[#FAFAFA] whitespace-nowrap">{command}</span>
      </div>

      <button
        onClick={handleCopy}
        type="button"
        className="flex shrink-0 items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium text-[#FAFAFA] transition-all bg-[#3F3F4C] hover:bg-[#8B5CF6] active:scale-95 focus:outline-none focus:ring-1 focus:ring-[#8B5CF6]"
        title="Salin ke clipboard"
      >
        {copied ? (
          <>
            <CheckIcon /> Tersalin!
          </>
        ) : (
          "Salin"
        )}
      </button>
    </div>
  );
}
