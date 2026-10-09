"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, getApiBaseUrl, getAccessToken } from "@/lib/api";
import { useUI } from "@/components/UIProvider";

export interface LogoRow {
  key: string;
  label: string;
  url: string;
  kind: string;
}

const inputCls = "glass-input w-full rounded-xl px-3 py-2 text-sm transition-all";
const KIND_OPTIONS = ["integration", "framework"];

/**
 * Kelola logo_assets: tambah (URL manual / upload), ubah URL, hapus baris.
 * Menghapus baris TIDAK menghapus file bundled — web otomatis fallback.
 */
export function LogoManager({ initial }: { initial: LogoRow[] }) {
  const router = useRouter();
  const { toast } = useUI();
  const [rows, setRows] = useState<LogoRow[]>(initial);
  const [keyInput, setKeyInput] = useState("");
  const [labelInput, setLabelInput] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [kindInput, setKindInput] = useState("integration");
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadFor, setUploadFor] = useState("");

  function fail(msg: string) {
    setError(msg);
    toast.error(msg);
  }

  async function save(row: LogoRow) {
    setPending(true);
    const res = await apiFetch("/api/logo-assets", {
      method: "PUT",
      body: JSON.stringify(row),
    });
    setPending(false);
    if (!res.ok) {
      fail(res.error || "Gagal menyimpan logo.");
      return;
    }
    setRows((prev) => {
      const next = prev.filter((r) => r.key !== row.key);
      return [...next, row].sort((a, b) => a.label.localeCompare(b.label));
    });
    toast.success(`Logo "${row.key}" tersimpan.`);
    router.refresh();
  }

  async function addNew() {
    const key = keyInput.trim().toLowerCase();
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(key)) {
      fail("Key wajib huruf kecil/angka/dash (contoh: midtrans).");
      return;
    }
    if (!urlInput.trim()) {
      fail("URL wajib diisi (atau upload file dulu).");
      return;
    }
    await save({
      key,
      label: labelInput.trim() || key,
      url: urlInput.trim(),
      kind: kindInput,
    });
    setKeyInput("");
    setLabelInput("");
    setUrlInput("");
  }

  async function remove(key: string) {
    if (!confirm(`Hapus logo "${key}"? Web akan fallback ke file bundled.`)) return;
    setPending(true);
    const res = await apiFetch(`/api/logo-assets?key=${encodeURIComponent(key)}`, {
      method: "DELETE",
    });
    setPending(false);
    if (!res.ok) {
      fail(res.error || "Gagal menghapus logo.");
      return;
    }
    setRows((prev) => prev.filter((r) => r.key !== key));
    toast.success(`Logo "${key}" dihapus.`);
    router.refresh();
  }

  async function upload(file: File, forKey: string) {
    const base = getApiBaseUrl();
    if (!base) {
      fail("NEXT_PUBLIC_API_BASE_URL belum di-set di apps/admin.");
      return;
    }
    setUploadingKey(forKey || "new");
    try {
      const token = await getAccessToken();
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${base}/api/logo-assets/upload`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
      const payload = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;
      if (!res.ok || !payload?.url) {
        fail(payload?.error || `Upload gagal (HTTP ${res.status}).`);
        return;
      }
      if (forKey) {
        const row = rows.find((r) => r.key === forKey);
        if (row) await save({ ...row, url: payload.url });
      } else {
        setUrlInput(payload.url);
        toast.success("Upload berhasil — URL terisi otomatis.");
      }
    } finally {
      setUploadingKey(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
          {error}
        </p>
      )}

      <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <h2 className="text-sm font-semibold text-white">Tambah logo</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="logo-key" className="mb-1.5 block text-xs font-medium text-zinc-400">Key</label>
            <input
              id="logo-key"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="midtrans"
              className={`${inputCls} font-mono`}
            />
          </div>
          <div>
            <label htmlFor="logo-label" className="mb-1.5 block text-xs font-medium text-zinc-400">Label</label>
            <input
              id="logo-label"
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              placeholder="Midtrans"
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="logo-kind" className="mb-1.5 block text-xs font-medium text-zinc-400">Jenis</label>
            <select
              id="logo-kind"
              value={kindInput}
              onChange={(e) => setKindInput(e.target.value)}
              className={`${inputCls} bg-[#131316]`}
            >
              {KIND_OPTIONS.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>
          <div>
            <span className="mb-1.5 block text-xs font-medium text-zinc-400">Upload file (opsional)</span>
            <input
              ref={fileRef}
              type="file"
              accept=".png,.jpg,.jpeg,.webp,.svg"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void upload(f, "");
              }}
              className="block w-full text-xs text-zinc-400 file:mr-3 file:rounded-lg file:border file:border-white/10 file:bg-white/5 file:px-3 file:py-1.5 file:text-xs file:text-zinc-200 hover:file:bg-white/10"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="logo-url" className="mb-1.5 block text-xs font-medium text-zinc-400">URL</label>
            <input
              id="logo-url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="/logo-midtrans.svg atau https://..."
              className={`${inputCls} font-mono`}
            />
          </div>
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={() => void addNew()}
          className="mt-3 rounded-xl bg-[#8B5CF6] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#8B5CF6]/25 transition-all hover:bg-[#7C3AED] active:scale-95 disabled:opacity-60"
        >
          {pending ? "Menyimpan…" : "Simpan Logo"}
        </button>
      </section>

      <section className="overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.02] text-xs uppercase tracking-wider text-zinc-500">
              <th className="px-4 py-3 font-medium">Preview</th>
              <th className="px-4 py-3 font-medium">Key / Label</th>
              <th className="hidden px-4 py-3 font-medium md:table-cell">URL</th>
              <th className="px-4 py-3 text-right font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-zinc-500">
                  Belum ada logo. Jalankan Migrasi 014 bila tabel kosong karena DB belum siap.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <RowEditor
                key={r.key}
                row={r}
                uploading={uploadingKey === r.key}
                pending={pending}
                onSave={save}
                onDelete={remove}
                onUpload={(f) => void upload(f, r.key)}
              />
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function RowEditor({
  row,
  uploading,
  pending,
  onSave,
  onDelete,
  onUpload,
}: {
  row: LogoRow;
  uploading: boolean;
  pending: boolean;
  onSave: (row: LogoRow) => Promise<void>;
  onDelete: (key: string) => Promise<void>;
  onUpload: (file: File) => void;
}) {
  const [url, setUrl] = useState(row.url);
  const [dirty, setDirty] = useState(false);
  return (
    <tr className="border-b border-white/[0.06] last:border-0">
      <td className="px-4 py-3">
        <span className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={dirty ? url : row.url} alt={`Logo ${row.label}`} className="h-6 w-6 object-contain" loading="lazy" />
        </span>
      </td>
      <td className="px-4 py-3">
        <p className="font-medium text-zinc-100">{row.label}</p>
        <p className="font-mono text-[11px] text-zinc-500">{row.key} · {row.kind}</p>
      </td>
      <td className="hidden px-4 py-3 md:table-cell">
        <input
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setDirty(true);
          }}
          spellCheck={false}
          className="glass-input w-full rounded-lg px-2.5 py-1.5 font-mono text-xs"
        />
      </td>
      <td className="px-4 py-3">
        <div className="flex justify-end gap-2">
          <label className="cursor-pointer rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-300 transition-all hover:bg-white/10">
            {uploading ? "…" : "Upload"}
            <input
              type="file"
              accept=".png,.jpg,.jpeg,.webp,.svg"
              className="hidden"
              disabled={uploading || pending}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onUpload(f);
                e.target.value = "";
              }}
            />
          </label>
          <button
            type="button"
            disabled={!dirty || pending}
            onClick={() => void onSave({ ...row, url: url.trim() })}
            className="rounded-lg border border-[#8B5CF6]/40 bg-[#8B5CF6]/15 px-3 py-1.5 text-xs font-medium text-[#C4B5FD] transition-all hover:bg-[#8B5CF6]/25 disabled:opacity-40"
          >
            Simpan
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => void onDelete(row.key)}
            className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs text-red-300 transition-all hover:bg-red-500/20 disabled:opacity-40"
          >
            Hapus
          </button>
        </div>
      </td>
    </tr>
  );
}
