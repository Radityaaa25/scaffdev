"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { useUI } from "@/components/UIProvider";

export interface EnvVarRow {
  key: string;
  deskripsi: string;
}

export interface IntegrasiFormInitial {
  kode: string;
  nama_tampilan: string;
  kategori_integrasi: string;
  daftar_env_var: EnvVarRow[];
  instruksi_setup: string;
  repo_url: string;
  framework_compat: string[];
}

export interface FrameworkOption {
  kode: string;
  nama_tampilan: string;
}

const KATEGORI = ["database", "payment", "auth", "shipping", "other"];
const KODE_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ENV_KEY_RE = /^[A-Z][A-Z0-9_]{1,64}$/;

const inputCls = "glass-input w-full rounded-xl px-4 py-2.5 text-sm transition-all";
const labelCls = "mb-1.5 block text-sm font-medium text-zinc-300";

export function IntegrasiForm({
  mode,
  kode,
  initial,
  frameworkOptions,
}: {
  mode: "new" | "edit";
  kode?: string;
  initial?: IntegrasiFormInitial;
  frameworkOptions: FrameworkOption[];
}) {
  const router = useRouter();
  const { toast } = useUI();
  const [kodeInput, setKodeInput] = useState(initial?.kode ?? "");
  const [nama, setNama] = useState(initial?.nama_tampilan ?? "");
  const [kategori, setKategori] = useState(initial?.kategori_integrasi ?? "other");
  const [envVars, setEnvVars] = useState<EnvVarRow[]>(
    initial?.daftar_env_var?.length ? initial.daftar_env_var : [{ key: "", deskripsi: "" }]
  );
  const [instruksi, setInstruksi] = useState(initial?.instruksi_setup ?? "");
  const [repoUrl, setRepoUrl] = useState(initial?.repo_url ?? "");
  const [fwCompat, setFwCompat] = useState<string[]>(initial?.framework_compat ?? []);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function toggleFramework(kodeFw: string) {
    setFwCompat((prev) =>
      prev.includes(kodeFw) ? prev.filter((k) => k !== kodeFw) : [...prev, kodeFw]
    );
  }

  function fail(msg: string) {
    setError(msg);
    toast.error(msg);
  }

  function updateRow(i: number, patch: Partial<EnvVarRow>) {
    setEnvVars((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (mode === "new" && !KODE_RE.test(kodeInput.trim().toLowerCase())) {
      return fail("Kode hanya boleh huruf kecil, angka, dan dash (contoh: tripay).");
    }
    if (!nama.trim()) return fail("Nama tampilan wajib diisi.");

    const cleaned = envVars
      .map((r) => ({ key: r.key.trim(), deskripsi: r.deskripsi.trim() }))
      .filter((r) => r.key !== "" || r.deskripsi !== "");
    const seen = new Set<string>();
    for (const r of cleaned) {
      if (!ENV_KEY_RE.test(r.key)) {
        return fail(`Key "${r.key || "(kosong)"}" tidak valid — huruf kapital/angka/underscore (contoh: TRIPAY_API_KEY).`);
      }
      if (seen.has(r.key)) return fail(`Key duplikat: "${r.key}".`);
      seen.add(r.key);
    }

    setPending(true);
    const payload = {
      ...(mode === "new" ? { kode: kodeInput.trim().toLowerCase() } : {}),
      nama_tampilan: nama.trim(),
      kategori_integrasi: kategori,
      daftar_env_var: cleaned,
      instruksi_setup: instruksi.trim(),
      repo_url: repoUrl.trim(),
      framework_compat: fwCompat,
    };
    const res = await apiFetch(
      mode === "new" ? "/api/integrasi" : `/api/integrasi/${encodeURIComponent(kode ?? "")}`,
      { method: mode === "new" ? "POST" : "PUT", body: JSON.stringify(payload) }
    );
    setPending(false);
    if (!res.ok) {
      setError(res.error || "Gagal menyimpan integrasi.");
      toast.error(res.error || "Gagal menyimpan integrasi.");
      return;
    }
    toast.success(mode === "new" ? `Integrasi "${nama.trim()}" tersimpan.` : "Perubahan tersimpan.");
    router.push("/integrasi");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="animate-admin-enter space-y-4">
      <section className="glass-panel rounded-2xl p-5 sm:p-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Identitas</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="kode" className={labelCls}>Kode {mode === "edit" ? "(immutable)" : "*"}</label>
            <input
              id="kode"
              value={mode === "edit" ? (kode ?? "") : kodeInput}
              onChange={(e) => setKodeInput(e.target.value)}
              disabled={mode === "edit"}
              placeholder="tripay"
              className={`${inputCls} font-mono ${mode === "edit" ? "opacity-60" : ""}`}
            />
          </div>
          <div>
            <label htmlFor="nama" className={labelCls}>Nama Tampilan *</label>
            <input id="nama" value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Tripay" className={inputCls} maxLength={100} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="kategori" className={labelCls}>Kategori</label>
            <select id="kategori" value={kategori} onChange={(e) => setKategori(e.target.value)} className={`${inputCls} sm:max-w-xs [&>option]:bg-[#131316]`}>
              {KATEGORI.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="glass-panel rounded-2xl p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Environment Variables</h2>
            <p className="mt-1 text-xs text-zinc-500">Ditulis ke `.env.example` oleh CLI — persis apa adanya.</p>
          </div>
          <button
            type="button"
            onClick={() => setEnvVars((prev) => [...prev, { key: "", deskripsi: "" }])}
            className="rounded-lg border border-[#8B5CF6]/40 bg-[#8B5CF6]/10 px-3 py-1.5 text-xs font-medium text-[#A78BFA] transition-all hover:bg-[#8B5CF6]/20 active:scale-95"
          >
            + Baris
          </button>
        </div>
        <div className="mt-4 space-y-2.5">
          {envVars.map((row, i) => (
            <div key={i} className="animate-admin-enter flex flex-col gap-2 sm:flex-row">
              <input
                value={row.key}
                onChange={(e) => updateRow(i, { key: e.target.value })}
                placeholder="NAMA_KEY"
                spellCheck={false}
                className={`${inputCls} font-mono sm:max-w-[260px]`}
              />
              <input
                value={row.deskripsi}
                onChange={(e) => updateRow(i, { deskripsi: e.target.value })}
                placeholder="Deskripsi singkat key ini…"
                className={`${inputCls} flex-1`}
                maxLength={200}
              />
              <button
                type="button"
                onClick={() => setEnvVars((prev) => prev.filter((_, idx) => idx !== i))}
                disabled={envVars.length <= 1}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-400 transition-all hover:bg-red-500/15 hover:text-red-300 active:scale-95 disabled:opacity-30"
                aria-label={`Hapus baris ${i + 1}`}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="glass-panel rounded-2xl p-5 sm:p-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Instruksi Setup</h2>
        <p className="mt-1 text-xs text-zinc-500">Markdown — digabung ke `SETUP.md` oleh CLI.</p>
        <textarea
          value={instruksi}
          onChange={(e) => setInstruksi(e.target.value)}
          rows={6}
          placeholder={"## Setup Tripay\n1. Daftar di …\n2. Ambil API key …"}
          className={`${inputCls} mt-4 resize-y font-mono text-[13px]`}
          maxLength={8000}
        />
      </section>

      <section className="glass-panel rounded-2xl p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Modul Builder</h2>
          <span className="rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30 px-1.5 py-px">
            Coming Soon
          </span>
        </div>
        <p className="mt-1 text-xs text-zinc-500">
          Repo modul yang disuntik CLI saat Builder launch. Kosongkan bila belum ada — integrasi tetap jalan sebagai bundel bawaan template.
        </p>
        <div className="mt-4">
          <label htmlFor="repo_url" className={labelCls}>Link Repo Modul (opsional)</label>
          <input
            id="repo_url"
            type="url"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://github.com/username/scaff-modul-tripay.git"
            className={`${inputCls} font-mono`}
          />
        </div>
        <div className="mt-4">
          <span className={labelCls}>Kompatibel dengan framework</span>
          <p className="mb-2 text-xs text-zinc-500">Kosongkan = semua framework. Centang bila modul hanya jalan di framework tertentu.</p>
          <div className="flex flex-wrap gap-2">
            {frameworkOptions.map((opt) => {
              const active = fwCompat.includes(opt.kode);
              return (
                <button
                  key={opt.kode}
                  type="button"
                  onClick={() => toggleFramework(opt.kode)}
                  aria-pressed={active}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-medium font-mono transition-all duration-200 active:scale-95 ${
                    active
                      ? "border-[#8B5CF6] bg-[#8B5CF6]/20 text-white shadow-lg shadow-[#8B5CF6]/20"
                      : "border-white/10 bg-white/5 text-zinc-400 hover:border-white/25 hover:text-zinc-200"
                  }`}
                >
                  {active ? "✓ " : ""}{opt.nama_tampilan}
                </button>
              );
            })}
            {frameworkOptions.length === 0 && (
              <p className="text-xs text-zinc-500">Belum ada framework terdaftar — kelola di menu Framework & Kategori.</p>
            )}
          </div>
        </div>
      </section>

      {error && (
        <p className="animate-admin-popup rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 px-4 py-2.5 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="sticky bottom-4 z-10">
        <div className="glass-panel flex items-center justify-between gap-3 rounded-2xl p-3 pl-5">
          <p className="hidden font-mono text-xs text-zinc-500 sm:block">
            {envVars.filter((r) => r.key.trim()).length} env var
          </p>
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => router.push("/integrasi")}
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-zinc-300 transition-all hover:bg-white/10 active:scale-95"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-xl bg-[#8B5CF6] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#8B5CF6]/25 transition-all hover:bg-[#7C3AED] active:scale-95 disabled:opacity-60"
            >
              {pending ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Menyimpan…
                </span>
              ) : mode === "new" ? "Simpan Integrasi" : "Simpan Perubahan"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
