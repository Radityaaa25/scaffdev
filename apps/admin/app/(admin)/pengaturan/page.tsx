import { createSupabaseAdminServerClient } from "@/lib/supabase-server";
import { CopyButton } from "@/components/CopyButton";
import { resolveGroqModel } from "@/lib/ai-config";

export const dynamic = "force-dynamic";

function envStatus(value: string | undefined): { ok: boolean; label: string } {
  return value ? { ok: true, label: "Terisi" } : { ok: false, label: "Kosong" };
}

export default async function PengaturanPage() {
  const supabase = await createSupabaseAdminServerClient();
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <p className="text-sm text-zinc-400">Akses ditolak. Akun ini bukan admin.</p>
      </main>
    );
  }

  // Hanya status terisi/tidak — NILAI TIDAK PERNAH ditampilkan.
  const envs = [
    { name: "NEXT_PUBLIC_SUPABASE_URL", ...envStatus(process.env.NEXT_PUBLIC_SUPABASE_URL) },
    { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", ...envStatus(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) },
    { name: "NEXT_PUBLIC_API_BASE_URL", ...envStatus(process.env.NEXT_PUBLIC_API_BASE_URL) },
    { name: "GROQ_API_KEY", ...envStatus(process.env.GROQ_API_KEY), optional: true },
  ];
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "(belum di-set)";
  const groqModel = resolveGroqModel();
  const groqKeySet = Boolean(process.env.GROQ_API_KEY);

  const commands = [
    { label: "Generate dari slug", cmd: "npx scaffdev@latest --template=ecommerce-basic-nextjs" },
    { label: "Mode interaktif", cmd: "npx scaffdev@latest" },
    { label: "Tes lokal ke API dev", cmd: "SCAFF_API_BASE_URL=http://localhost:3000 node packages/cli/dist/index.js --template=<slug>" },
  ];

  return (
    <main className="mx-auto max-w-3xl space-y-4 px-4 py-8 sm:px-6">
      <div className="animate-admin-enter">
        <h1 className="text-2xl font-extrabold tracking-tight text-white">Pengaturan</h1>
        <p className="mt-1 text-sm text-zinc-400">Kesehatan konfigurasi & referensi cepat CLI.</p>
      </div>

      <section className="glass-panel animate-admin-enter rounded-2xl p-5 sm:p-6" style={{ animationDelay: "80ms" }}>
        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Environment</h2>
        <p className="mt-1 text-xs text-zinc-500">Hanya status — nilai secret tidak pernah ditampilkan di sini.</p>
        <ul className="mt-4 space-y-2.5">
          {envs.map((e) => (
            <li key={e.name} className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-2.5">
              <span className="font-mono text-xs text-zinc-300">{e.name}{"optional" in e && e.optional ? <span className="ml-2 text-zinc-600">(opsional, untuk AI)</span> : null}</span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${e.ok ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-300"}`}>
                {e.ok ? "✓ Terisi" : "✕ Kosong"}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 font-mono text-xs text-zinc-500">API web: <span className="text-zinc-300">{apiBase}</span></p>
        <div className="mt-2 flex flex-wrap items-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-2.5">
          <span className="text-xs text-zinc-500">Model AI admin:</span>
          <code className="font-mono text-xs text-zinc-200">{groqModel}</code>
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${groqKeySet ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-300"}`}>
            {groqKeySet ? "✓ key terisi" : "✕ key kosong"}
          </span>
          <span className="w-full text-[11px] text-zinc-600">Ubah via env GROQ_MODEL (opsional). Restart setelah mengganti env.</span>
        </div>
      </section>

      <section className="glass-panel animate-admin-enter rounded-2xl p-5 sm:p-6" style={{ animationDelay: "140ms" }}>
        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Command CLI</h2>
        <div className="mt-4 space-y-3">
          {commands.map((c) => (
            <div key={c.cmd} className="rounded-xl border border-white/5 bg-black/30 p-3">
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <span className="text-xs text-zinc-500">{c.label}</span>
                <CopyButton text={c.cmd} />
              </div>
              <code className="block overflow-x-auto font-mono text-xs text-zinc-200">{c.cmd}</code>
            </div>
          ))}
        </div>
      </section>

      <section className="glass-panel animate-admin-enter rounded-2xl p-5 sm:p-6" style={{ animationDelay: "200ms" }}>
        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Tautan</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            { label: "Katalog web ↗", href: apiBase.startsWith("http") ? `${apiBase.replace(/\/+$/, "")}/templates` : "/templates" },
            { label: "Supabase dashboard ↗", href: "https://supabase.com/dashboard" },
          ].map((l) => (
            <a
              key={l.label}
              href={l.href}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300 transition-all hover:bg-white/10 hover:text-white active:scale-95"
            >
              {l.label}
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
