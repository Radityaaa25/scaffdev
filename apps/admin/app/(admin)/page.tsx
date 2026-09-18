import Link from "next/link";
import type { Template } from "@scaff/database";
import { createSupabaseAdminServerClient } from "@/lib/supabase-server";
import { CountUp } from "@/components/CountUp";

export const dynamic = "force-dynamic";

function StatCard({
  label,
  value,
  sub,
  accent,
  delay,
}: {
  label: string;
  value: number;
  sub?: string;
  accent?: string;
  delay?: number;
}) {
  return (
    <div
      className="glass-panel animate-admin-enter group h-full rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:border-white/15 hover:shadow-[0_12px_40px_rgb(0_0_0/0.45)]"
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{label}</p>
      <p className={`mt-2 text-3xl font-extrabold tabular-nums ${accent ?? "text-white"}`}>
        <CountUp value={value} />
      </p>
      <p className="mt-1 min-h-4 font-mono text-xs text-zinc-500">{sub ?? " "}</p>
    </div>
  );
}

export default async function DashboardPage() {
  const supabase = await createSupabaseAdminServerClient();

  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="glass-panel animate-admin-popup max-w-md rounded-2xl p-8 text-center">
          <h1 className="text-lg font-bold text-white">Akses Ditolak</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Akun ini tidak terdaftar sebagai admin. Minta admin lain menambahkan
            email Anda ke tabel <span className="font-mono">admin_users</span>.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block rounded-lg bg-[#8B5CF6] px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-[#7C3AED] active:scale-95"
          >
            Kembali ke Login
          </Link>
        </div>
      </main>
    );
  }

  const { data } = await supabase
    .from("templates")
    .select("*")
    .order("created_at", { ascending: false });
  const templates = (data ?? []) as Template[];

  const total = templates.length;
  const published = templates.filter((t) => t.is_published).length;
  const drafts = total - published;
  const totalDownloads = templates.reduce((s, t) => s + (t.downloads_count ?? 0), 0);
  // Split per framework mengikuti data (nilai baru dari form otomatis muncul).
  const fwCounts = new Map<string, number>();
  for (const t of templates) {
    fwCounts.set(t.framework, (fwCounts.get(t.framework) ?? 0) + 1);
  }
  const fwEntries = [...fwCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const FW_BAR_COLORS = ["bg-white", "bg-[#8B5CF6]", "bg-emerald-400", "bg-sky-400", "bg-amber-400"];
  const top = [...templates]
    .sort((a, b) => (b.downloads_count ?? 0) - (a.downloads_count ?? 0))
    .slice(0, 5);
  const recent = templates.slice(0, 5);
  const maxDownloads = Math.max(1, ...templates.map((t) => t.downloads_count ?? 0));

  // Aktivitas 14 hari terakhir (dari created_at — tanpa kolom baru).
  const days: { label: string; full: string; count: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push({
      label: d.toLocaleDateString("id-ID", { day: "numeric" }),
      full: d.toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
      count: templates.filter((t) => (t.created_at ?? "").slice(0, 10) === key).length,
    });
  }
  const maxDay = Math.max(1, ...days.map((d) => d.count));

  return (
    <main className="mx-auto max-w-6xl space-y-5 px-4 py-8 sm:px-6">
      <div className="animate-admin-enter flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Pantau katalog template & jumlah project yang di-generate via CLI.
          </p>
        </div>
        <Link
          href="/templates/new"
          className="rounded-xl bg-[#8B5CF6] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#8B5CF6]/25 transition-all hover:bg-[#7C3AED] hover:shadow-[#8B5CF6]/40 active:scale-95"
        >
          + Daftarkan Template
        </Link>
      </div>

      {/* Bento baris 1: hero + stat */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-12">
        <div
          className="animate-admin-enter glass-panel relative col-span-2 overflow-hidden rounded-2xl border-[#8B5CF6]/25 bg-gradient-to-br from-[#8B5CF6]/20 via-transparent to-transparent p-6 transition-all duration-300 hover:-translate-y-1 lg:col-span-5"
        >
          <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#8B5CF6]/25 blur-[80px]" />
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
            Di-generate via CLI
          </p>
          <p className="mt-2 text-5xl font-extrabold tabular-nums text-white">
            <CountUp value={totalDownloads} duration={1200} />
          </p>
          <p className="mt-2 font-mono text-xs text-zinc-500">∑ downloads_count · live dari database</p>
        </div>
        <div className="lg:col-span-7 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="col-span-2 h-full sm:col-span-1">
            <StatCard label="Total Template" value={total} sub={`${published} published · ${drafts} draft`} delay={80} />
          </div>
          <StatCard label="Published" value={published} sub="live di web + CLI" accent="text-emerald-400" delay={140} />
          <StatCard label="Draft" value={drafts} sub="belum tampil publik" accent="text-amber-400" delay={200} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Aktivitas 14 hari */}
        <div className="animate-admin-enter glass-panel rounded-2xl p-5 lg:col-span-7" style={{ animationDelay: "120ms" }}>
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold text-white">Template ditambahkan · 14 hari</h2>
            <span className="font-mono text-xs text-zinc-500">per hari</span>
          </div>
          <div className="mt-4 flex h-36 items-end gap-1.5">
            {days.map((d, i) => (
              <div key={i} className="group relative flex h-full flex-1 flex-col justify-end" title={`${d.full}: ${d.count} template`}>
                <div
                  className={`animate-admin-bar w-full rounded-t-md transition-all duration-200 group-hover:brightness-125 ${d.count > 0 ? "bg-gradient-to-t from-[#8B5CF6] to-[#A78BFA]" : "bg-white/5"}`}
                  style={{ height: `${Math.max(d.count > 0 ? 12 : 6, Math.round((d.count / maxDay) * 100))}%`, animationDelay: `${i * 40}ms` }}
                />
                <span className="mt-1.5 text-center text-[10px] tabular-nums text-zinc-600">
                  {i % 2 === 0 ? d.label : ""}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Split framework */}
        <div className="animate-admin-enter glass-panel rounded-2xl p-5 lg:col-span-5" style={{ animationDelay: "180ms" }}>
          <h2 className="text-sm font-semibold text-white">Template per Framework</h2>
          <div className="mt-4 space-y-4">
            {fwEntries.map(([name, count], i) => (
              <div key={name}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-mono text-zinc-300">{name}</span>
                  <span className="font-mono tabular-nums text-zinc-400"><CountUp value={count} /></span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-white/5">
                  <div
                    className={`animate-admin-bar h-full rounded-full ${FW_BAR_COLORS[i % FW_BAR_COLORS.length]}`}
                    style={{ width: `${total > 0 ? Math.round((count / total) * 100) : 0}%`, animationDelay: `${i * 120}ms` }}
                  />
                </div>
              </div>
            ))}
            {fwEntries.length === 0 && (
              <p className="text-sm text-zinc-500">Belum ada template. Daftarkan yang pertama.</p>
            )}
          </div>
          <Link href="/templates/new" className="mt-5 inline-block text-xs font-medium text-[#A78BFA] transition-colors hover:text-white">
            + Tambah template →
          </Link>
        </div>

        {/* Top */}
        <div className="animate-admin-enter glass-panel rounded-2xl p-5 lg:col-span-6" style={{ animationDelay: "220ms" }}>
          <h2 className="text-sm font-semibold text-white">Paling Sering Di-generate</h2>
          <ul className="mt-3 space-y-2.5">
            {top.map((t, i) => (
              <li
                key={t.id}
                className="animate-admin-enter flex items-center gap-3 rounded-xl p-1.5 transition-colors hover:bg-white/[0.03]"
                style={{ animationDelay: `${260 + i * 60}ms` }}
              >
                <span className="w-5 shrink-0 font-mono text-xs tabular-nums text-zinc-500">{i + 1}.</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-zinc-200">{t.nama}</p>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="animate-admin-bar h-full rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#22C55E]"
                      style={{ width: `${Math.round(((t.downloads_count ?? 0) / maxDownloads) * 100)}%`, animationDelay: `${300 + i * 60}ms` }}
                    />
                  </div>
                </div>
                <span className="shrink-0 font-mono text-xs tabular-nums text-zinc-400">{t.downloads_count ?? 0}×</span>
              </li>
            ))}
            {top.length === 0 && <p className="text-sm text-zinc-500">Belum ada data generate.</p>}
          </ul>
        </div>

        {/* Terbaru */}
        <div className="animate-admin-enter glass-panel rounded-2xl p-5 lg:col-span-6" style={{ animationDelay: "260ms" }}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Baru Ditambahkan</h2>
            <Link href="/templates" className="text-xs font-medium text-[#A78BFA] transition-colors hover:text-white">
              Kelola semua →
            </Link>
          </div>
          <ul className="mt-2 divide-y divide-white/5">
            {recent.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 py-2.5 transition-colors hover:bg-white/[0.02]">
                <div className="min-w-0">
                  <p className="truncate text-sm text-zinc-200">{t.nama}</p>
                  <p className="font-mono text-xs text-zinc-500">{t.slug} · {t.framework}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="font-mono text-xs tabular-nums text-zinc-500">{t.downloads_count ?? 0}×</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${t.is_published ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
                    {t.is_published ? "Published" : "Draft"}
                  </span>
                </div>
              </li>
            ))}
            {recent.length === 0 && <p className="py-2 text-sm text-zinc-500">Belum ada template.</p>}
          </ul>
        </div>
      </div>
    </main>
  );
}
