import Link from "next/link";
import { LandingCommandBox } from "./LandingCommandBox";
import { Reveal } from "./Reveal";

const MINI_STEPS = [
  {
    no: "01",
    title: "Pilih base",
    desc: "Satu template sebagai fondasi: Next.js atau Laravel.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    no: "02",
    title: "Centang integrasi",
    desc: "Maks 1 per kategori inti: payment, database, auth, shipping.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    no: "03",
    title: "Salin command",
    desc: "Execute di terminal: file tersuntik, SETUP.md kebentuk.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l3 3-3 3M12 15h8M4 21h16a1 1 0 001-1V4a1 1 0 00-1-1H4a1 1 0 00-1 1v16a1 1 0 001 1z" />
      </svg>
    ),
  },
];

/** Teaser Builder: jembatan dari alur katalog ke rancang-sendiri. */
export function BuilderTeaser() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto w-full max-w-7xl min-w-0 px-4 py-14 sm:px-6 lg:py-20">
        <Reveal className="w-full min-w-0">
          <p className="font-mono text-xs uppercase tracking-widest text-[#8B5CF6]">
            ◆ Builder
          </p>
          <h2 className="mt-2 max-w-xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Butuh lebih dari template mentah? Racik sendiri.
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-400">
            Pilih base favoritmu, centang payment / database / auth, generate
              command custom: tanpa tulis boilerplate dari nol.
          </p>
        </Reveal>

        <div className="mt-8 flex w-full min-w-0 flex-col gap-4">
          {/* Langkah mini: full width, 3 kolom */}
          <div className="grid w-full min-w-0 grid-cols-1 gap-4 sm:grid-cols-3">
            {MINI_STEPS.map((s, i) => (
              <Reveal key={s.no} delay={i * 80} className="w-full min-w-0">
                <div className="landing-spot group relative h-full w-full min-w-0 overflow-hidden rounded-2xl border border-[#3F3F4C] bg-[#24242C] p-5 transition-colors hover:border-[#8B5CF6]/50 sm:p-6">
                  <span className="pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full bg-[#8B5CF6]/10 blur-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" aria-hidden="true" />
                  <div className="flex items-center justify-between">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 text-[#A78BFA]">
                      {s.icon}
                    </span>
                    <span className="font-mono text-sm font-bold text-zinc-600">{s.no}</span>
                  </div>
                  <h3 className="mt-3 text-sm font-bold text-white">{s.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-400">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Terminal command custom: full width, lega */}
          <Reveal delay={120} className="w-full min-w-0">
            <div className="landing-spot relative w-full min-w-0 overflow-hidden rounded-2xl border border-[#8B5CF6]/30 bg-gradient-to-b from-[#8B5CF6]/[0.1] to-[#24242C]">
              <div className="hero-term-head w-full min-w-0">
                <div className="hero-term-dots" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
                <p className="hero-term-title">Builder</p>
                <span className="ml-auto hidden font-mono text-[11px] text-zinc-600 sm:block">live preview</span>
              </div>
              <div className="w-full min-w-0 p-3.5 sm:p-6">
                <LandingCommandBox command="npx scaffdev@latest toko-saya --template=ecommerce-basic-nextjs --with=midtrans,supabase" />
                <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Isi racikan">
                  {["laravel", "midtrans", "supabase"].map((c) => (
                    <span
                      key={c}
                      className="rounded-md border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 px-2 py-0.5 font-mono text-[11px] text-[#C4B5FD]"
                    >
                      + {c}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-xs leading-relaxed text-zinc-500">
                  Base + 2 modul tersuntik otomatis: file, dependency,{" "}
                  <span className="font-mono text-zinc-300">.env.example</span>, dan{" "}
                  <span className="font-mono text-zinc-300">SETUP.md</span>.
                </p>
              </div>
              <div className="flex w-full min-w-0 flex-col gap-3 p-3.5 pt-0 sm:flex-row sm:p-6 sm:pt-0">
                <Link
                  href="/builder"
                  className="btn-gooey group w-full text-center sm:w-auto sm:flex-1"
                >
                  Coba Builder
                  <span className="ml-1.5 inline-block transition-transform group-hover:translate-x-0.5">→</span>
                  <span className="btn-gooey__blobs" aria-hidden="true">
                    <div />
                    <div />
                    <div />
                  </span>
                </Link>
                <Link
                  href="/docs/panduan-builder"
                  className="btn-bubbles w-full text-center sm:w-auto sm:flex-1"
                >
                  <span className="text">Cara pakai</span>
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
