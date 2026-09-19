"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

interface IntegrasiItem {
  kode: string;
  nama_tampilan: string;
  kategori_integrasi?: string | null;
}

const KATEGORI_LABEL: Record<string, string> = {
  payment: "Payment Gateway",
  database: "Database",
  auth: "Autentikasi",
  shipping: "Ongkos Kirim",
  other: "Lainnya",
};

const KATEGORI_ORDER = ["payment", "database", "auth", "shipping", "other"];

/**
 * Picker kombinasi integrasi custom — COMING SOON.
 * Menampilkan opsi live dari /api/integrasi dalam keadaan disabled.
 * Tidak memengaruhi command generate yang aktif (tetap polosan).
 */
export function IntegrationPickerComingSoon() {
  const [items, setItems] = useState<IntegrasiItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/integrasi");
        if (!res.ok) throw new Error("gagal");
        const data = await res.json();
        setItems(data.integrasi ?? []);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const groups = React.useMemo(() => {
    const map = new Map<string, IntegrasiItem[]>();
    items.forEach((item) => {
      const kat = (item.kategori_integrasi || "other").toLowerCase();
      if (!map.has(kat)) map.set(kat, []);
      map.get(kat)!.push(item);
    });
    return KATEGORI_ORDER.filter((k) => map.has(k)).map((k) => ({
      kategori: k,
      label: KATEGORI_LABEL[k] ?? k,
      options: map.get(k)!,
    }));
  }, [items]);

  return (
    <section
      aria-label="Kombinasi integrasi custom (segera hadir)"
      className="relative mt-8 rounded-2xl border border-amber-500/25 bg-amber-500/[0.04] p-6 overflow-hidden"
    >
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <h2 className="text-base font-semibold text-[#FAFAFA]">
          Kombinasi Integrasi Custom
        </h2>
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
          Coming Soon
        </span>
      </div>
      <p className="text-sm text-zinc-400 leading-relaxed mb-5">
        Pilih template polosan di atas untuk generate sekarang. Nanti kamu bisa mencentang
        kombinasi favoritmu di sini — <span className="text-zinc-200 font-medium">maks 1 pilihan per kategori</span> (mis. payment: Midtrans <em>atau</em> Xendit).
      </p>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-pulse" aria-hidden="true">
          {[1, 2].map((n) => (
            <div key={n} className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-2">
              <div className="h-4 w-1/3 bg-zinc-800/80 rounded" />
              <div className="h-8 w-full bg-zinc-800/60 rounded-lg" />
              <div className="h-8 w-full bg-zinc-800/60 rounded-lg" />
            </div>
          ))}
        </div>
      ) : groups.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {groups.map((group) => (
            <fieldset
              key={group.kategori}
              disabled
              className="rounded-xl border border-white/10 bg-[#0A0A0B]/60 p-4 opacity-80"
            >
              <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-zinc-300">
                {group.label} <span className="text-zinc-500 normal-case font-normal">• max 1</span>
              </legend>
              <div className="space-y-2 mt-1">
                <label className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-zinc-300 cursor-not-allowed bg-white/[0.03] border border-[#8B5CF6]/40">
                  <input type="radio" name={`comingsoon-${group.kategori}`} defaultChecked disabled className="accent-[#8B5CF6]" />
                  <span>Polosan (tanpa {group.label.toLowerCase()})</span>
                </label>
                {group.options.map((opt) => (
                  <label
                    key={opt.kode}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-zinc-400 cursor-not-allowed bg-white/[0.02] border border-white/5"
                  >
                    <input type="radio" name={`comingsoon-${group.kategori}`} disabled className="accent-[#8B5CF6]" />
                    <span className="font-mono text-[13px]">{opt.nama_tampilan}</span>
                    <span className="ml-auto text-[10px] font-mono text-zinc-600">{opt.kode}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
        </div>
      ) : (
        <p className="text-xs text-zinc-500 italic">
          Daftar integrasi belum tersedia — katalog integrasi sedang disiapkan.
        </p>
      )}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[11px] text-zinc-500">
          Command generate aktif tetap versi polosan di atas — pilihan custom di sini belum memengaruhi hasil generate.
        </p>
        <Link
          href="/builder"
          className="shrink-0 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-300 transition-all hover:bg-amber-500/20 active:scale-95"
        >
          Rancang di Builder →
        </Link>
      </div>
    </section>
  );
}
