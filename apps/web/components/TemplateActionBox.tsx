"use client";

import React, { useState } from "react";
import { CommandBox } from "@/components/CommandBox";

interface TemplateActionBoxProps {
  slug: string;
  framework: string;
}

export function TemplateActionBox({ slug, framework }: TemplateActionBoxProps) {
  const [showCommand, setShowCommand] = useState(false);
  const [mode, setMode] = useState<"standar" | "folder">("standar");
  const [folder, setFolder] = useState("project-saya");

  const cleanFolder = folder.trim().replace(/\s+/g, "-") || "project-saya";
  const command =
    mode === "standar"
      ? `npx scaffdev@latest --template=${slug}`
      : `npx scaffdev@latest ${cleanFolder} --template=${slug}`;

  const isNextjs = framework.toLowerCase() === "nextjs";

  return (
    <div id="pakai-template" className="bg-[#131316] border border-[#26262B] rounded-2xl p-6 mt-8 scroll-mt-24">
      {!showCommand ? (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-[#FAFAFA]">
              Siap menggunakan template ini?
            </h3>
            <p className="text-sm text-zinc-400 mt-1">
              Dapatkan satu baris command terminal untuk men-generate project secara instan — tanpa install apa pun sebelumnya.
            </p>
          </div>
          <button
            onClick={() => setShowCommand(true)}
            type="button"
            className="w-full sm:w-auto px-6 py-3 rounded-xl font-medium text-sm text-white bg-[#8B5CF6] hover:bg-[#7C3AED] shadow-lg shadow-[#8B5CF6]/20 transition-all active:scale-[0.98] shrink-0"
          >
            ⚡ Pakai Template Ini
          </button>
        </div>
      ) : (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-sm font-semibold text-[#FAFAFA]">
              Jalankan command ini di terminal Anda:
            </span>
            <div className="flex items-center gap-1 bg-[#0A0A0B] border border-[#26262B] rounded-lg p-1 self-start">
              {(["standar", "folder"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  type="button"
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    mode === m
                      ? "bg-[#8B5CF6] text-white"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {m === "standar" ? "Standar" : "Folder kustom"}
                </button>
              ))}
            </div>
          </div>

          {mode === "folder" && (
            <div className="flex items-center gap-2">
              <label htmlFor="folder-name" className="text-xs text-zinc-400 shrink-0">
                Nama folder:
              </label>
              <input
                id="folder-name"
                value={folder}
                onChange={(e) => setFolder(e.target.value)}
                placeholder="project-saya"
                spellCheck={false}
                className="flex-1 bg-[#0A0A0B] border border-[#26262B] rounded-lg px-3 py-2 text-sm font-mono text-[#FAFAFA] placeholder:text-zinc-600 focus:outline-none focus:border-[#8B5CF6]/60 transition-colors"
                maxLength={60}
              />
            </div>
          )}

          <CommandBox command={command} />

          {/* Prerequisite Notice */}
          <div className="flex items-start gap-2 text-xs text-zinc-400 bg-[#0A0A0B] border border-[#26262B] rounded-xl p-3">
            <span className="text-emerald-400 font-bold shrink-0">✓</span>
            <div className="leading-relaxed">
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
