"use client";

import { useEffect, useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function DashboardPage() {
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!API_BASE_URL) {
      setStatus("error");
      setError("NEXT_PUBLIC_API_BASE_URL belum di-set di .env.local");
      return;
    }
    fetch(`${API_BASE_URL}/api/health`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(() => setStatus("ok"))
      .catch((e: unknown) => {
        setStatus("error");
        setError(String(e));
      });
  }, []);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-2xl font-semibold">Dashboard Admin</h1>

      <p className="text-foreground-muted">
        Daftar template — menyusul di fase berikutnya.
      </p>

      <div className="flex flex-col items-start gap-1 rounded-lg border border-border bg-background-secondary p-4 font-mono text-sm">
        <span className="text-foreground-muted">Koneksi ke apps/web:</span>
        <span className="break-all text-foreground">
          {API_BASE_URL ?? "(undefined)"} /api/health
        </span>
        <span
          className={
            status === "ok"
              ? "text-success"
              : status === "error"
                ? "text-error"
                : "text-foreground-muted"
          }
        >
          {status === "loading"
            ? "Mengecek…"
            : status === "ok"
              ? "Terhubung"
              : `Error: ${error}`}
        </span>
      </div>
    </main>
  );
}