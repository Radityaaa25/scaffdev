"use client";

import { useId, useState } from "react";
import { resolveLogoUrl, uploadLogoFile } from "@/lib/logo";

const inputCls = "glass-input w-full rounded-xl px-3 py-2 font-mono text-sm transition-all";

/**
 * Input logo bersama (form Integrasi + tabel Framework): preview, URL manual,
 * upload file, dan tombol kosongkan. Menyimpan/menghapus dilakukan pemanggil.
 */
export function LogoInput({
  url,
  onChange,
  onError,
}: {
  url: string;
  onChange: (url: string) => void;
  onError: (msg: string) => void;
}) {
  const id = useId();
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    const res = await uploadLogoFile(file);
    setUploading(false);
    if (!res.ok || !res.url) {
      onError(res.error || "Upload gagal.");
      return;
    }
    onChange(res.url);
  }

  return (
    <div>
      <div className="flex items-center gap-4">
        <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
          {url.trim() ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resolveLogoUrl(url)}
              alt="Preview logo"
              className="h-8 w-8 object-contain"
              loading="lazy"
            />
          ) : (
            <span className="text-[10px] text-zinc-600">kosong</span>
          )}
        </span>
        <div className="min-w-0 flex-1">
          <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-zinc-400">
            URL logo (opsional)
          </label>
          <input
            id={id}
            value={url}
            onChange={(e) => onChange(e.target.value)}
            placeholder="/logo-namamu.svg atau https://..."
            spellCheck={false}
            className={inputCls}
          />
        </div>
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <label className="cursor-pointer rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-300 transition-all hover:bg-white/10">
          {uploading ? "Mengunggah…" : "Upload file"}
          <input
            type="file"
            accept=".png,.jpg,.jpeg,.webp,.svg"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
              e.target.value = "";
            }}
          />
        </label>
        {url.trim() !== "" && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-400 transition-all hover:bg-red-500/15 hover:text-red-300"
          >
            Kosongkan
          </button>
        )}
        <span className="text-[11px] text-zinc-500">
          Maks 1MB (png/jpg/webp/svg). Kosongkan + simpan = hapus logo (web fallback ke bawaan).
        </span>
      </div>
    </div>
  );
}
