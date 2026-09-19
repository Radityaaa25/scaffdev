import Link from "next/link";

const GITHUB_URL = "https://github.com/Radityaaa25/scaffdev";

const PRODUCT_LINKS = [
  { href: "/templates", label: "Katalog Template" },
  { href: "/builder", label: "Builder Visual" },
  { href: "/docs", label: "Dokumentasi" },
];

const HELP_LINKS = [
  { href: "/docs/cara-install", label: "Cara Install" },
  { href: "/docs/env-dan-setup", label: "Environment & Setup" },
  { href: "/docs/troubleshooting", label: "Troubleshooting" },
  { href: "/docs/faq", label: "FAQ" },
  { href: "/lapor", label: "Lapor Bug / Pengaduan" },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-white/[0.06] bg-[#0A0A0B]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr]">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5">
              <img
                src="/logo-full.png"
                alt="Scaffdev"
                className="hidden h-11 w-auto sm:block"
                loading="lazy"
              />
              <img
                src="/logo-icon.png"
                alt="Scaffdev"
                className="h-11 w-11 sm:hidden"
                loading="lazy"
              />
            </div>
            <p className="mt-3 text-sm leading-relaxed text-zinc-500">
              Scaffolding generator: starter kit siap jalan dengan kurasi integrasi lokal Indonesia.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-zinc-500">
              Butuh bantuan atau ingin bekerjasama/berkontribusi? Hubungi kami:{" "}
              <a
                href="mailto:scaffdev.support@gmail.com"
                className="font-medium text-zinc-300 transition-colors hover:text-white"
              >
                scaffdev.support@gmail.com
              </a>
            </p>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-all hover:border-white/20 hover:bg-white/5 hover:text-white"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55v-2.17c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.75 2.69 1.25 3.34.95.1-.74.4-1.25.72-1.53-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 015.78 0c2.21-1.49 3.18-1.18 3.18-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.35.77 1.05.77 2.12v3.15c0 .3.21.67.8.55A11.51 11.51 0 0023.5 12C23.5 5.65 18.35.5 12 .5z" />
              </svg>
              GitHub
            </a>
          </div>

          {/* Product */}
          <nav aria-label="Produk" className="lg:justify-self-end">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Produk
            </h3>
            <ul className="mt-4 space-y-2.5">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-zinc-500 transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Bantuan */}
          <nav aria-label="Bantuan" className="lg:justify-self-end">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Bantuan
            </h3>
            <ul className="mt-4 space-y-2.5">
              {HELP_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-zinc-500 transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/[0.06] pt-6 sm:flex-row">
          <p className="text-xs text-zinc-600">
            © {new Date().getFullYear()} Scaffdev. Open-source untuk developer Indonesia.
          </p>
          <p className="font-mono text-xs text-zinc-600">
            npx <span className="text-[#8B5CF6]">scaffdev@latest</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
