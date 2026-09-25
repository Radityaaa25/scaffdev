"use client";

import { useEffect } from "react";

/**
 * Fallback TERAKHIR — dipakai hanya bila root layout sendiri crash.
 * WAJIB definisikan <html><body> sendiri dan TIDAK boleh import layout,
 * komponen navbar/footer, font, atau CSS global (semua itu mungkin sumber
 * crash-nya). Sengaja dibuat minimal + inline style agar selalu bisa render.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[scaffdev] global error:", error);
  }, [error]);

  return (
    <html lang="id">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#09090B",
          color: "#FAFAFA",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: 24,
        }}
      >
        <main style={{ maxWidth: 480 }}>
          <p style={{ fontSize: 12, letterSpacing: "0.3em", color: "#8B5CF6", fontWeight: 700 }}>
            ERROR KRITIS
          </p>
          <h1 style={{ fontSize: 32, margin: "12px 0" }}>Aplikasi gagal dimuat</h1>
          <p style={{ fontSize: 14, color: "#A1A1AA", lineHeight: 1.6 }}>
            Terjadi kesalahan fatal di layout utama. Coba muat ulang — bila
            masih gagal, kembali lagi nanti atau hubungi kami.
          </p>
          <div style={{ marginTop: 24, display: "flex", gap: 12, justifyContent: "center" }}>
            <button
              type="button"
              onClick={reset}
              style={{
                padding: "10px 24px",
                borderRadius: 12,
                border: "none",
                background: "#8B5CF6",
                color: "#fff",
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Muat ulang
            </button>
            {/* NOTED: <a> mentah disengaja — global-error tidak boleh
                import next/link (router context mungkin ikut crash). */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              style={{
                padding: "10px 24px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.15)",
                color: "#D4D4D8",
                fontSize: 14,
                textDecoration: "none",
              }}
            >
              Beranda
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
