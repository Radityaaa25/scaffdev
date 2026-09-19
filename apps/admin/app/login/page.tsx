"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-client";
import { apiFetch } from "@/lib/api";

/** Catat upaya login untuk audit brute force — fire-and-forget, tanpa ubah UX. */
function auditLogin(email: string, success: boolean): void {
  void apiFetch("/api/auth/login-audit", {
    method: "POST",
    body: JSON.stringify({ email, success }),
  }).catch(() => {
    /* audit tidak boleh mengganggu login */
  });
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) {
        auditLogin(email.trim(), false);
        setError("Email atau password salah.");
        return;
      }
      // Pastikan akun ini terdaftar sebagai admin — jika bukan, cabut session.
      const { data: isAdmin } = await supabase.rpc("is_admin");
      if (!isAdmin) {
        auditLogin(email.trim(), false);
        await supabase.auth.signOut();
        setError("Akun ini tidak terdaftar sebagai admin Scaffdev.");
        return;
      }
      auditLogin(email.trim(), true);
      router.push("/");
      router.refresh();
    } catch {
      setError("Tidak dapat menghubungi server. Coba lagi.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      {/* Latar glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-[#8B5CF6]/20 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -left-20 h-80 w-80 rounded-full bg-[#22C55E]/10 blur-[100px]"
      />

      <div className="glass-panel relative w-full max-w-md rounded-2xl p-8">
        <div className="mb-8 flex flex-col items-center text-center">
          <img
            src="/logo-full.png"
            alt="Scaffdev"
            className="mb-4 hidden h-12 w-auto sm:block"
            loading="eager"
          />
          <img
            src="/logo-icon.png"
            alt="Scaffdev"
            className="mb-4 h-12 w-12 sm:hidden"
            loading="eager"
          />
          <h1 className="text-xl font-bold text-white">Admin Scaffdev</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Masuk dengan akun admin yang terdaftar
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-zinc-300">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              className="glass-input w-full rounded-lg px-4 py-2.5 text-sm"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-zinc-300">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="glass-input w-full rounded-lg px-4 py-2.5 text-sm"
            />
          </div>

          {error && (
            <p className="rounded-lg border border-[#EF4444]/30 bg-[#EF4444]/10 px-4 py-2.5 text-sm text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-[#8B5CF6] py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#8B5CF6]/25 transition-colors hover:bg-[#7C3AED] disabled:opacity-50"
          >
            {pending ? "Memeriksa…" : "Masuk"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-zinc-500">
          Akun admin dibuat manual lewat Supabase dashboard.
        </p>
      </div>
    </main>
  );
}
