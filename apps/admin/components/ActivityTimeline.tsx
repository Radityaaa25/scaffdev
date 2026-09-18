"use client";

import { useMemo, useState } from "react";

export interface ActivityRow {
  id: string;
  actor_email: string;
  action: string;
  entity: string;
  entity_ref: string;
  detail: string | null;
  created_at: string;
}

const ACTION_COLORS: Record<string, string> = {
  create: "bg-emerald-500/10 text-emerald-400",
  update: "bg-sky-500/10 text-sky-400",
  delete: "bg-red-500/10 text-red-400",
};

function actionKind(action: string): string {
  const a = action.toLowerCase();
  if (a.includes("delete")) return "delete";
  if (a.includes("create")) return "create";
  return "update";
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function ActivityTimeline({ initial }: { initial: ActivityRow[] }) {
  const [q, setQ] = useState("");
  const [entity, setEntity] = useState("all");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return initial.filter((r) => {
      if (entity !== "all" && r.entity !== entity) return false;
      if (needle && !`${r.actor_email} ${r.action} ${r.entity_ref} ${r.detail ?? ""}`.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [initial, q, entity]);

  return (
    <div className="animate-admin-enter">
      <div className="glass-panel mt-6 flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari aktor, aksi, atau slug…"
          className="glass-input flex-1 rounded-xl px-4 py-2 text-sm"
        />
        <div className="flex flex-wrap gap-2">
          {["all", "template", "integrasi", "admin"].map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setEntity(e)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200 active:scale-95 ${
                entity === e
                  ? "border-[#8B5CF6] bg-[#8B5CF6]/20 text-white"
                  : "border-white/10 bg-white/5 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {e === "all" ? "Semua" : e}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-panel mt-4 rounded-2xl p-5">
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-500">
            {initial.length === 0 ? "Belum ada aktivitas tercatat." : "Tidak cocok dengan filter."}
          </p>
        ) : (
          <ol className="relative space-y-1 border-l border-white/10 pl-0">
            {filtered.map((r, i) => {
              const kind = actionKind(r.action);
              return (
                <li
                  key={r.id}
                  className="animate-admin-enter relative rounded-r-xl py-3 pl-6 pr-2 transition-colors hover:bg-white/[0.02]"
                  style={{ animationDelay: `${Math.min(i, 15) * 40}ms` }}
                >
                  <span className="absolute -left-[5px] top-4 h-2.5 w-2.5 rounded-full border-2 border-[#0A0A0B] bg-[#8B5CF6]" />
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 font-mono text-xs ${ACTION_COLORS[kind]}`}>
                      {r.action}
                    </span>
                    <span className="font-mono text-xs text-zinc-400">{r.entity_ref}</span>
                    <span className="ml-auto font-mono text-[11px] tabular-nums text-zinc-600">
                      {formatTime(r.created_at)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-zinc-300">
                    <span className="font-medium text-zinc-100">{r.actor_email}</span>
                    {r.detail ? <span className="text-zinc-500"> — {r.detail}</span> : null}
                  </p>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
