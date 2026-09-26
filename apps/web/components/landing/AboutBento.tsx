import Link from "next/link";
import { Reveal } from "./Reveal";

const GITHUB_URL = "https://github.com/Radityaaa25/scaffdev";

const LOCAL_LOGOS = [
  { label: "Supabase", src: "/logo-supabase.svg", wordmark: false },
  { label: "Midtrans", src: "/logo-midtrans.svg", wordmark: true },
  { label: "Xendit", src: "/logo-xendit.svg", wordmark: false },
  { label: "Duitku", src: "/logo-duitku.svg", wordmark: true },
];

/** Tentang Kami gaya bento: profil, stats live, open-source, kurasi lokal, kontak. */
export function AboutBento({ templateCount }: { templateCount: number }) {
  return (
    <section className="relative">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:py-20">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-widest text-[#8B5CF6]">
            ◆ Tentang kami
          </p>
          <h2 className="mt-2 max-w-xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Kenalan dengan Scaffdev.
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-400">
            Scaffolding generator untuk developer Indonesia — starter kit siap jalan,
            bukan folder kosong.
          </p>
        </Reveal>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Profil — kartu lebar */}
          <Reveal className="md:col-span-2" delay={0}>
            <div className="landing-spot relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-2xl border border-[#26262B] bg-[#131316] p-6 transition-colors hover:border-[#8B5CF6]/50 sm:p-8">
              <div>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 text-[#A78BFA]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                    <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
                  </svg>
                </span>
                <h3 className="mt-4 text-xl font-bold text-white">Apa itu Scaffdev?</h3>
                <p className="mt-2 max-w-lg text-sm leading-relaxed text-zinc-400">
                  Scaffdev membuatkan project baru siap jalan dalam hitungan detik lewat satu
                  baris command — lengkap dengan tampilan visual yang sudah jadi, struktur
                  folder best-practice, file <span className="font-mono text-zinc-200">.env.example</span>,
                  dan panduan <span className="font-mono text-zinc-200">SETUP.md</span> otomatis.
                  Saat ini tersedia template <span className="text-zinc-200">Next.js</span> dan{" "}
                  <span className="text-zinc-200">Laravel</span>, framework lain menyusul.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/docs/konsep-dasar"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#8B5CF6] px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-[#7C3AED] active:scale-[0.98]"
                >
                  Pelajari konsepnya <span aria-hidden="true">→</span>
                </Link>
                <Link
                  href="/templates"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-zinc-200 transition-all hover:border-white/20 hover:text-white"
                >
                  Lihat template
                </Link>
              </div>
            </div>
          </Reveal>

          {/* Stats live */}
          <Reveal delay={80}>
            <div className="landing-spot relative flex h-full flex-col justify-center overflow-hidden rounded-2xl border border-[#26262B] bg-[#131316] p-6 transition-colors hover:border-[#8B5CF6]/50 sm:p-8">
              <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">Live dari database</p>
              <p className="mt-2 text-5xl font-extrabold tracking-tight text-white">
                {templateCount}
                <span className="text-[#8B5CF6]">.</span>
              </p>
              <p className="mt-1 text-sm text-zinc-400">template siap generate</p>
              <div className="mt-4 flex gap-4 border-t border-white/[0.06] pt-4 font-mono text-xs text-zinc-500">
                <span><span className="font-bold text-zinc-200">2</span> framework</span>
                <span><span className="font-bold text-zinc-200">6</span> integrasi</span>
              </div>
            </div>
          </Reveal>

          {/* Open source */}
          <Reveal delay={0}>
            <div className="landing-spot relative flex h-full flex-col overflow-hidden rounded-2xl border border-[#26262B] bg-[#131316] p-6 transition-colors hover:border-[#8B5CF6]/50">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 text-[#A78BFA]">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
                  <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55v-2.17c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.75 2.69 1.25 3.34.95.1-.74.4-1.25.72-1.53-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 015.78 0c2.21-1.49 3.18-1.18 3.18-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.35.77 1.05.77 2.12v3.15c0 .3.21.67.8.55A11.51 11.51 0 0023.5 12C23.5 5.65 18.35.5 12 .5z" />
                </svg>
              </span>
              <h3 className="mt-4 text-base font-semibold text-white">Open-source (MIT)</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-400">
                Dibangun terbuka untuk developer Indonesia. Intip kode, laporkan bug, atau berkontribusi.
              </p>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex w-fit items-center gap-1.5 text-sm font-medium text-[#8B5CF6] hover:underline"
              >
                Buka GitHub <span aria-hidden="true">↗</span>
              </a>
            </div>
          </Reveal>

          {/* Kurasi lokal */}
          <Reveal delay={80}>
            <div className="landing-spot relative flex h-full flex-col overflow-hidden rounded-2xl border border-[#26262B] bg-[#131316] p-6 transition-colors hover:border-[#8B5CF6]/50">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 text-[#A78BFA]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                  <path d="M12 21s-7-4.5-7-11a7 7 0 0 1 14 0c0 6.5-7 11-7 11z" />
                  <circle cx="12" cy="10" r="2.5" />
                </svg>
              </span>
              <h3 className="mt-4 text-base font-semibold text-white">Kurasi lokal Indonesia</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                Payment & database yang benar-benar dipakai di sini.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {LOCAL_LOGOS.map((l) => (
                  <span key={l.label} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5" title={l.label}>
                    <img
                      src={l.src}
                      alt={`Logo ${l.label}`}
                      loading="lazy"
                      draggable={false}
                      className={l.wordmark ? "h-4 w-auto" : "h-4 w-4"}
                    />
                    {!l.wordmark && <span className="font-mono text-[11px] text-zinc-300">{l.label}</span>}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>

          {/* Kontak */}
          <Reveal delay={160}>
            <div className="landing-spot relative flex h-full flex-col overflow-hidden rounded-2xl border border-[#26262B] bg-[#131316] p-6 transition-colors hover:border-[#8B5CF6]/50">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 text-[#A78BFA]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                  <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
                  <path d="M22 6l-10 7L2 6" />
                </svg>
              </span>
              <h3 className="mt-4 text-base font-semibold text-white">Hubungi kami</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-400">
                Butuh bantuan, kerjasama, atau ingin berkontribusi?
              </p>
              <a
                href="mailto:scaffdev.support@gmail.com"
                className="mt-4 break-all text-sm font-medium text-zinc-200 transition-colors hover:text-white"
              >
                scaffdev.support@gmail.com
              </a>
              <Link href="/lapor" className="mt-2 inline-flex w-fit items-center gap-1.5 text-sm font-medium text-[#8B5CF6] hover:underline">
                Lapor bug / pengaduan <span aria-hidden="true">→</span>
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
