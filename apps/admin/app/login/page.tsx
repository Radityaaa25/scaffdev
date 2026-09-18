"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-client";

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
        setError("Email atau password salah.");
        return;
      }
      // Pastikan akun ini terdaftar sebagai admin — jika bukan, cabut session.
      const { data: isAdmin } = await supabase.rpc("is_admin");
      if (!isAdmin) {
        await supabase.auth.signOut();
        setError("Akun ini tidak terdaftar sebagai admin Scaffdev.");
        return;
      }
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
        <div className="mb-8 text-center">
          <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9] text-xl font-bold text-white shadow-lg shadow-[#8B5CF6]/30">
            S
          </span>
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
