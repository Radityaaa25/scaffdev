"use client";

import { useMemo, useState } from "react";

export interface UsageRow {
  id: string;
  scope: string;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  latency_ms: number;
  status: string;
  error: string | null;
  session_ref: string;
  created_at: string;
}

type ScopeFilter = "all" | "admin" | "user";

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("id-ID", {
      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function formatLatency(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function MonitorClient({ initial }: { initial: UsageRow[] }) {
  const [scope, setScope] = useState<ScopeFilter>("all");

  const rows = useMemo(
    () => (scope === "all" ? initial : initial.filter((r) => r.scope === scope)),
    [initial, scope]
  );

  const totalReq = rows.length;
  const totalTokens = rows.reduce((s, r) => s + (r.total_tokens ?? 0), 0);
  const errors = rows.filter((r) => r.status === "error");
  const avgLatency = totalReq > 0 ? Math.round(rows.reduce((s, r) => s + (r.latency_ms ?? 0), 0) / totalReq) : 0;

  // Bar harian 14 hari (request + token).
  const days = useMemo(() => {
    const out: { label: string; full: string; req: number; tokens: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const day = rows.filter((r) => (r.created_at ?? "").slice(0, 10) === key);
      out.push({
        label: d.toLocaleDateString("id-ID", { day: "numeric" }),
        full: d.toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
        req: day.length,
        tokens: day.reduce((s, r) => s + (r.total_tokens ?? 0), 0),
      });
    }
    return out;
  }, [rows]);
  const maxDay = Math.max(1, ...days.map((d) => d.req));

  const recentErrors = useMemo(() => errors.slice(0, 10), [errors]);
  const recent = useMemo(() => rows.slice(0, 20), [rows]);

  return (
    <div className="animate-admin-enter space-y-4">
      {/* Filter scope — siap untuk pemisahan AI admin vs user */}
      <div className="glass-panel flex flex-wrap items-center gap-2 rounded-2xl p-4">
        <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">Sumber:</span>
        {(["all", "admin", "user"] as ScopeFilter[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setScope(s)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all duration-200 active:scale-95 ${
              scope === s
                ? "border-[#8B5CF6] bg-[#8B5CF6]/20 text-white"
                : "border-white/10 bg-white/5 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {s === "all" ? "Semua" : s === "admin" ? "AI Admin" : "AI User"}
          </button>
        ))}
        <span className="ml-auto font-mono text-xs tabular-nums text-zinc-500">
          {rows.length} request
        </span>
      </div>

      {/* Stat */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Total Request", value: totalReq.toLocaleString("id-ID"), accent: "text-white" },
          { label: "Total Token", value: totalTokens.toLocaleString("id-ID"), accent: "text-[#A78BFA]" },
          { label: "Error", value: `${errors.length} (${totalReq > 0 ? Math.round((errors.length / totalReq) * 100) : 0}%)`, accent: errors.length > 0 ? "text-red-400" : "text-emerald-400" },
          { label: "Rata-rata Latensi", value: formatLatency(avgLatency), accent: "text-white" },
        ].map((c, i) => (
          <div
            key={c.label}
            className="glass-panel animate-admin-enter rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:border-white/15"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{c.label}</p>
            <p className={`mt-2 text-2xl font-extrabold tabular-nums ${c.accent}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Grafik harian */}
      <div className="glass-panel animate-admin-enter rounded-2xl p-5" style={{ animationDelay: "120ms" }}>
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold text-white">Request AI · 14 hari</h2>
          <span className="font-mono text-xs text-zinc-500">hover untuk token</span>
        </div>
        <div className="mt-4 flex h-36 items-end gap-1.5">
          {days.map((d, i) => (
            <div key={i} className="group relative flex h-full flex-1 flex-col justify-end" title={`${d.full}: ${d.req} req · ${d.tokens.toLocaleString("id-ID")} token`}>
              <div
                className={`animate-admin-bar w-full rounded-t-md transition-all duration-200 group-hover:brightness-125 ${d.req > 0 ? "bg-gradient-to-t from-[#8B5CF6] to-[#A78BFA]" : "bg-white/5"}`}
                style={{ height: `${Math.max(d.req > 0 ? 12 : 6, Math.round((d.req / maxDay) * 100))}%`, animationDelay: `${i * 40}ms` }}
              />
              <span className="mt-1.5 text-center text-[10px] tabular-nums text-zinc-600">
                {i % 2 === 0 ? d.label : ""}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Error terbaru */}
      <div className="glass-panel animate-admin-enter rounded-2xl p-5" style={{ animationDelay: "160ms" }}>
        <h2 className="text-sm font-semibold text-white">Error Terbaru</h2>
        {recentErrors.length === 0 ? (
          <p className="mt-2 flex items-center gap-2 text-sm text-emerald-400">
            <span className="font-bold">✓</span> Bersih — tidak ada error tercatat.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {recentErrors.map((r) => (
              <li key={r.id} className="rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-red-500/15 px-2 py-0.5 font-mono text-[11px] text-red-300">{r.scope}</span>
                  <span className="font-mono text-[11px] text-zinc-500">{r.model}</span>
                  <span className="ml-auto font-mono text-[11px] tabular-nums text-zinc-500">{formatTime(r.created_at)}</span>
                </div>
                <p className="mt-1 font-mono text-xs text-red-200/90">{r.error || "(tanpa pesan)"}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Request terbaru */}
      <div className="glass-panel animate-admin-enter overflow-hidden rounded-2xl" style={{ animationDelay: "200ms" }}>
        <h2 className="px-5 pt-5 text-sm font-semibold text-white">Request Terbaru</h2>
        <div className="overflow-x-auto">
          <table className="mt-2 w-full min-w-[680px] text-left text-sm">
            <thead>
              <tr className="border-y border-white/5 text-xs uppercase tracking-wider text-zinc-500">
                <th className="px-5 py-2.5 font-medium">Waktu</th>
                <th className="px-5 py-2.5 font-medium">Sumber</th>
                <th className="px-5 py-2.5 font-medium">Model</th>
                <th className="px-5 py-2.5 text-right font-medium">Token</th>
                <th className="px-5 py-2.5 text-right font-medium">Latensi</th>
                <th className="px-5 py-2.5 text-right font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {recent.map((r) => (
                <tr key={r.id} className="transition-colors hover:bg-white/[0.03]">
                  <td className="whitespace-nowrap px-5 py-2.5 font-mono text-xs text-zinc-400">{formatTime(r.created_at)}</td>
                  <td className="px-5 py-2.5">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${r.scope === "admin" ? "bg-[#8B5CF6]/15 text-[#C4B5FD]" : "bg-sky-500/10 text-sky-400"}`}>
                      {r.scope}
                    </span>
                  </td>
                  <td className="max-w-[220px] truncate px-5 py-2.5 font-mono text-xs text-zinc-400" title={r.model}>{r.model}</td>
                  <td className="px-5 py-2.5 text-right font-mono text-xs tabular-nums text-zinc-300">{r.total_tokens.toLocaleString("id-ID")}</td>
                  <td className="px-5 py-2.5 text-right font-mono text-xs tabular-nums text-zinc-400">{formatLatency(r.latency_ms)}</td>
                  <td className="px-5 py-2.5 text-right">
                    <span className={`font-bold ${r.status === "ok" ? "text-emerald-400" : "text-red-400"}`}>
                      {r.status === "ok" ? "✓" : "✕"}
                    </span>
                  </td>
                </tr>
              ))}
              {recent.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-zinc-500">
                    Belum ada request tercatat. Data muncul setelah ada chat AI.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
