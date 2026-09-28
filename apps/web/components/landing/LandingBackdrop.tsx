"use client";

import Grainient from "./Grainient";

/**
 * Backdrop landing: SATU layer kontinu untuk seluruh halaman — grid + gradient
 * animasi yang sama di belakang semua section, sehingga tidak ada garis/batas
 * antar-section (tidak per-section = tidak ada sambungan yang bisa retak).
 * - Canvas dikunci viewport (sticky h-screen): buffer selalu seukuran layar
 *   (bukan setinggi dokumen) + animasi yang sama terlihat di semua section.
 * - Grid CSS murni (murah) full-height; mask radial lembut, tanpa garis.
 * - Intensitas diredupkan agar konten dominan. Gerakan tidak diubah.
 * Token: docs/16 (bg #0A0A0B).
 */
export function LandingBackdrop() {
  return (
    // NOTED: overflow-clip (bukan hidden) agar sticky canvas tetap jalan;
    // top -5rem menutupi strip spacer navbar. Tanpa ini: garis hitam (spacer)
    // atau canvas setinggi dokumen (berat) atau sambungan per-section (retak).
    <div
      className="pointer-events-none absolute inset-x-0 top-[-5rem] bottom-0 overflow-clip"
      aria-hidden="true"
    >
      {/* Base */}
      <div className="absolute inset-0 bg-[#0A0A0B]" />
      {/* Underlay statis: SANGAT redup, hanya anti-kedip ~1 dtk saat refresh
          (kanvas fade-in di atasnya). Bukan wash warna — ungu hanya boleh
          muncul dari animasi awan, sisanya gelap background. */}
      <div
        className="absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(40% 28% at 50% 0%, rgba(76,29,149,0.22) 0%, rgba(10,10,11,0) 100%)",
        }}
      />
      {/* Canvas viewport-locked: menempel saat scroll → mulus di semua section.
          colorBalance negatif besar = ungu hanya di gumpalan awan, bukan wash. */}
      <div className="sticky top-0 h-[100svh]">
        <div className="absolute inset-0 opacity-45">
          <Grainient
            color1="#5B21B6"
            color2="#0a0a0b"
            color3="#0a0a0b"
            timeSpeed={1.4}
            colorBalance={-0.95}
          warpStrength={1.0}
          warpFrequency={5.0}
          warpSpeed={4.0}
          warpAmplitude={50.0}
          blendAngle={50}
          blendSoftness={0}
          rotationAmount={500.0}
          noiseScale={1.5}
          grainAmount={0.1}
          grainScale={2.0}
          grainAnimated={false}
          contrast={1.2}
          gamma={1.0}
          saturation={0.9}
          centerX={0.0}
          centerY={0.0}
          zoom={0.85}
        />
        </div>
      </div>
      {/* Grid tegas di atas gradient, fade radial lembut dari atas (tanpa garis) */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(85% 70% at 50% 0%, black 25%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(85% 70% at 50% 0%, black 25%, transparent 100%)",
        }}
      />
    </div>
  );
}
