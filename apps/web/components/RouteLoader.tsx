"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Bar progres navigasi: tampil saat user klik link internal, hilang saat
 * halaman baru commit. next/navigation tidak punya router events, jadi
 * memakai click listener global + pathname sebagai sinyal selesai.
 */
function LoaderInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  // Navigasi selesai (pathname/search berubah): sembunyikan.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset idempoten saat commit navigasi; nilai selalu false di sini sehingga tidak ada cascade.
    setLoading(false);
  }, [pathname, searchParams]);

  // Klik link internal: tampilkan langsung sebagai feedback instan.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      const el = e.target as HTMLElement | null;
      const a = el?.closest?.('a[href^="/"]') as HTMLAnchorElement | null;
      if (!a) return;
      if (a.target === "_blank" || a.hasAttribute("download")) return;
      const href = a.getAttribute("href") ?? "";
      if (href === "#" || href.startsWith("/#")) return;
      try {
        const url = new URL(a.href, window.location.origin);
        if (url.pathname === window.location.pathname && url.search === window.location.search) {
          return;
        }
      } catch {
        return;
      }
      setLoading(true);
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  // Pengaman: jangan nempel selamanya bila navigasi batal/gagal.
  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => setLoading(false), 8000);
    return () => clearTimeout(t);
  }, [loading]);

  if (!loading) return null;
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px]">
      <div className="route-loader-bar h-full w-full" />
    </div>
  );
}

export function RouteLoader() {
  return (
    <Suspense fallback={null}>
      <LoaderInner />
    </Suspense>
  );
}
