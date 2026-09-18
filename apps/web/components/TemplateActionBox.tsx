"use client";

import React, { useState } from "react";
import { CommandBox } from "@/components/CommandBox";

interface TemplateActionBoxProps {
  slug: string;
  framework: string;
}

export function TemplateActionBox({ slug, framework }: TemplateActionBoxProps) {
  const [showCommand, setShowCommand] = useState(false);
  const command = `npx scaffdev@latest --template=${slug}`;

  const isNextjs = framework.toLowerCase() === "nextjs";

  return (
    <div className="bg-[#131316] border border-[#26262B] rounded-xl p-6 mt-8">
      {!showCommand ? (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-[#FAFAFA]">
              Siap menggunakan template ini?
            </h3>
            <p className="text-sm text-zinc-400">
              Dapatkan satu baris command terminal untuk men-generate project secara instan.
            </p>
          </div>
          <button
            onClick={() => setShowCommand(true)}
            type="button"
            className="w-full sm:w-auto px-6 py-3 rounded-lg font-medium text-sm text-white bg-[#8B5CF6] hover:bg-[#7C3AED] shadow-lg shadow-[#8B5CF6]/20 transition-all shrink-0"
          >
            ⚡ Pakai Template Ini
          </button>
        </div>
      ) : (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-[#FAFAFA]">
              Jalankan command ini di terminal Anda:
            </span>
            <span className="text-xs text-zinc-500 font-mono">
              Tanpa perlu install apa pun sebelumnya
            </span>
          </div>

          <CommandBox command={command} />

          {/* Prerequisite Notice */}
          <div className="flex items-start gap-2 text-xs text-zinc-400 bg-[#0A0A0B] border border-[#26262B] rounded-lg p-3">
            <span className="text-emerald-400 font-bold shrink-0">✓</span>
            <div>
              {isNextjs ? (
                <>
                  <span className="font-semibold text-zinc-200">Prasyarat:</span> Pastikan Node.js v18+ sudah terinstall di komputer Anda (
                  <a
                    href="https://nodejs.org"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#8B5CF6] hover:underline"
                  >
                    download nodejs.org
                  </a>
                  ).
                </>
              ) : (
                <>
                  <span className="font-semibold text-zinc-200">Prasyarat:</span> Pastikan PHP 8.2+ dan Composer sudah terinstall di komputer Anda (
                  <a
                    href="https://getcomposer.org"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#8B5CF6] hover:underline"
                  >
                    download getcomposer.org
                  </a>
                  ).
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
