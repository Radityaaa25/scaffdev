"use client";

const SUPPORTED = [
  { name: "nextjs", label: "Next.js", logo: "/logo-nextjs.svg", wordmark: false },
  { name: "laravel", label: "Laravel", logo: "/logo-laravel.svg", wordmark: false },
  { name: "supabase", label: "Supabase", logo: "/logo-supabase.svg", wordmark: false },
  { name: "midtrans", label: "Midtrans", logo: "/logo-midtrans.svg", wordmark: true },
  { name: "xendit", label: "Xendit", logo: "/logo-xendit.svg", wordmark: false },
  { name: "duitku", label: "Duitku", logo: "/logo-duitku.svg", wordmark: true },
];

// Tiap paruh loop berisi 2x daftar agar aliran selalu padat tanpa celah.
const MARQUEE_HALF = [...SUPPORTED, ...SUPPORTED];

/** Marquee "Terintegrasi dengan" — hanya dipakai halaman /templates. */
export function IntegrationMarquee() {
  return (
    <div className="relative mt-10 sm:mt-12 mb-10 w-full">
      <div className="mb-5 flex justify-center">
        <p className="inline-flex items-center rounded-full border border-[#8B5CF6]/50 bg-[#8B5CF6]/10 px-5 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-[#C4B5FD] shadow-[0_0_24px_rgba(139,92,246,0.35)]">
          Terintegrasi dengan
        </p>
      </div>
      <div className="hero-marquee" aria-label="Terintegrasi dengan Next.js, Laravel, Supabase, Midtrans, Xendit, Duitku">
        <div className="hero-marquee-track">
          {[0, 1].map((copy) => (
            <div key={copy} className="hero-marquee-group" aria-hidden={copy === 1}>
              {MARQUEE_HALF.map((s, i) => (
                <span
                  key={`${s.name}-${i}`}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-6 py-3 whitespace-nowrap"
                >
                  <img
                    src={s.logo}
                    alt={`Logo ${s.label}`}
                    loading="lazy"
                    draggable={false}
                    className={s.wordmark ? "h-6 w-auto shrink-0" : "h-6 w-6 shrink-0"}
                  />
                  {!s.wordmark && (
                    <span className="font-mono text-base text-zinc-200">{s.label}</span>
                  )}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
