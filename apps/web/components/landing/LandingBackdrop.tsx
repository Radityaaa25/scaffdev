"use client";

import Grainient from "./Grainient";

/**
 * Backdrop landing: gradient animasi Grainient (React Bits, ogl/WebGL)
 * full 1 halaman + grid tajam di atasnya. Satu layer kontinu — tidak
 * dipecah per-section. Grid di atas canvas agar garis tetap crisp.
 * Token: docs/16 (bg #0A0A0B, aksen #8B5CF6).
 */
export function LandingBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Base */}
      <div className="absolute inset-0 bg-[#0A0A0B]" />
      {/* Gradient animasi ungu — satu canvas penuh */}
      <div className="absolute inset-0">
        <Grainient
          color1="#8B5CF6"
          color2="#0a0a0b"
          color3="#0a0a0b"
          timeSpeed={1.4}
          colorBalance={-0.55}
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
          contrast={1.5}
          gamma={1.0}
          saturation={1.0}
          centerX={0.0}
          centerY={0.0}
          zoom={0.85}
        />
      </div>
      {/* Grid tegas di atas gradient, fade radial dari atas */}
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
