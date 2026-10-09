"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Tab navigasi katalog: Siap Pakai (/templates) | Integrasi Saja (/integrasi).
 * Active state dari pathname. Dipasang di atas kedua halaman agar langsung
 * terlihat tanpa scroll.
 */
export function CatalogTabs() {
  const pathname = usePathname() ?? "";
  const onTemplates = pathname.startsWith("/templates");
  const onIntegrasi = pathname.startsWith("/integrasi");

  const item = (active: boolean) =>
    `flex-1 sm:flex-none rounded-xl px-5 py-2.5 text-sm font-semibold text-center transition-all ${
      active
        ? "bg-[#8B5CF6] text-white shadow-lg shadow-[#8B5CF6]/20"
        : "text-zinc-400 hover:bg-white/5 hover:text-white"
    }`;

  return (
    <nav
      aria-label="Pindah katalog"
      className="inline-flex w-full sm:w-auto gap-1 rounded-2xl border border-white/10 bg-white/[0.02] p-1"
    >
      <Link href="/templates" aria-current={onTemplates ? "page" : undefined} className={item(onTemplates)}>
        Siap Pakai
      </Link>
      <Link href="/integrasi" aria-current={onIntegrasi ? "page" : undefined} className={item(onIntegrasi)}>
        Integrasi Saja
      </Link>
    </nav>
  );
}
