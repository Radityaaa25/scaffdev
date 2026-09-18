"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-client";
import { useUI } from "@/components/UIProvider";

export interface AdminRow {
  id: string;
  email: string;
  role: string;
}

async function logAdminAction(action: string, ref: string, detail?: string) {
  try {
    const supabase = createSupabaseBrowserClient();
    await supabase.rpc("log_activity", {
      p_actor_email: (await supabase.auth.getUser()).data.user?.email ?? "unknown",
      p_action: action,
      p_entity: "admin",
      p_entity_ref: ref,
      p_detail: detail ?? null,
    });
  } catch {
    /* log tidak boleh menggagalkan aksi */
  }
}

export function AdminUsersManager({ initial, selfId }: { initial: AdminRow[]; selfId: string }) {
  const router = useRouter();
  const { toast, confirm } = useUI();
  const [rows, setRows] = useState<AdminRow[]>(initial);
  const [email, setEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  async function refresh() {
    try {
      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase.rpc("admin_list");
      if (Array.isArray(data)) setRows(data as AdminRow[]);
    } catch {
      router.refresh();
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const clean = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      toast.error("Format email tidak valid.");
      return;
    }
    setAdding(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.rpc("admin_add_by_email", { p_email: clean });
      if (error) {
        toast.error(friendlyRpcError(error.message));
        return;
      }
      await logAdminAction("admin.add", clean);
      setEmail("");
      toast.success(`${clean} sekarang admin.`);
      await refresh();
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(row: AdminRow) {
    if (row.id === selfId) {
      toast.error("Tidak bisa menghapus akun sendiri.");
      return;
    }
    const ok = await confirm({
      title: "Cabut akses admin?",
      message: `"${row.email}" tidak bisa lagi login ke panel ini (akun Auth-nya tetap ada).`,
      confirmLabel: "Ya, cabut",
      danger: true,
    });
    if (!ok) return;
    setRemoving(row.id);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.rpc("admin_remove", { p_user_id: row.id });
      if (error) {
        toast.error(friendlyRpcError(error.message));
        return;
      }
      await logAdminAction("admin.remove", row.email);
      setRows((prev) => prev.filter((r) => r.id !== row.id));
      toast.success(`Akses admin ${row.email} dicabut.`);
    } finally {
      setRemoving(null);
    }
  }

  return (
    <div className="animate-admin-enter space-y-4">
      <section className="glass-panel rounded-2xl p-5 sm:p-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Tambah Admin</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Email harus sudah punya akun di Authentication (buat dulu di Supabase dashboard).
        </p>
        <form onSubmit={handleAdd} className="mt-4 flex flex-col gap-2.5 sm:flex-row">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@example.com"
            className="glass-input flex-1 rounded-xl px-4 py-2.5 text-sm"
          />
          <button
            type="submit"
            disabled={adding}
            className="rounded-xl bg-[#8B5CF6] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#8B5CF6]/25 transition-all hover:bg-[#7C3AED] active:scale-95 disabled:opacity-60"
          >
            {adding ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Menambah…
              </span>
            ) : "Jadikan Admin"}
          </button>
        </form>
      </section>

      <section className="glass-panel overflow-hidden rounded-2xl">
        <ul className="divide-y divide-white/5">
          {rows.map((r, i) => (
            <li
              key={r.id}
              className="animate-admin-enter flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-white/[0.02]"
              style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#8B5CF6]/40 to-[#6D28D9]/40 text-sm font-bold text-white">
                {r.email.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-zinc-100">
                  {r.email}
                  {r.id === selfId && (
                    <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-zinc-300">kamu</span>
                  )}
                </p>
                <p className="font-mono text-xs text-zinc-500">{r.role}</p>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(r)}
                disabled={removing !== null || r.id === selfId}
                className="rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-300 transition-all hover:bg-red-500/20 active:scale-95 disabled:opacity-40"
              >
                {removing === r.id ? "…" : "Cabut"}
              </button>
            </li>
          ))}
          {rows.length === 0 && (
            <li className="px-5 py-10 text-center text-sm text-zinc-500">Belum ada admin terdaftar.</li>
          )}
        </ul>
      </section>
    </div>
  );
}

function friendlyRpcError(message: string): string {
  if (message.includes("belum terdaftar di Authentication")) {
    return "Email belum punya akun Auth — buat dulu di Supabase dashboard → Authentication.";
  }
  if (message.includes("tidak bisa menghapus akun sendiri")) {
    return "Tidak bisa menghapus akun sendiri.";
  }
  if (message.includes("admin terakhir")) {
    return "Tidak bisa menghapus satu-satunya admin yang tersisa.";
  }
  if (message.includes("forbidden")) {
    return "Aksi ditolak oleh database.";
  }
  return "Operasi gagal. Coba lagi.";
}
