"use client";

import React, { useState } from "react";

interface CommandBoxProps {
  command: string;
  className?: string;
}

export function CommandBox({ command, className = "" }: CommandBoxProps) {
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
      className={`relative flex items-center justify-between gap-3 bg-[#131316] border border-[#26262B] rounded-lg px-4 py-3 font-mono text-sm shadow-inner group hover:border-[#8B5CF6]/50 transition-colors ${className}`}
    >
      <div className="flex items-center gap-2 overflow-x-auto select-all scrollbar-none">
        <span className="text-[#8B5CF6] select-none font-bold">$</span>
        <span className="text-[#FAFAFA] whitespace-nowrap">{command}</span>
      </div>

      <button
        onClick={handleCopy}
        type="button"
        className="shrink-0 text-xs font-medium px-2.5 py-1 rounded bg-[#26262B] hover:bg-[#8B5CF6] text-[#FAFAFA] transition-colors focus:outline-none focus:ring-1 focus:ring-[#8B5CF6]"
        title="Salin ke clipboard"
      >
        {copied ? "✓ Tersalin!" : "Salin"}
      </button>
    </div>
  );
}
