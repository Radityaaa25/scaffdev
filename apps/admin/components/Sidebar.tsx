"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-client";

const NAV_ITEMS = [
  {
    href: "/",
    label: "Dashboard",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
        <rect x="3" y="3" width="7" height="9" rx="1.5" />
        <rect x="14" y="3" width="7" height="5" rx="1.5" />
        <rect x="14" y="12" width="7" height="9" rx="1.5" />
        <rect x="3" y="16" width="7" height="5" rx="1.5" />
      </svg>
    ),
  },
  {
    href: "/templates",
    label: "Template",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a2 2 0 012-2h4l2 3h6a2 2 0 012 2v9a2 2 0 01-2 2H6a2 2 0 01-2-2V5z" />
      </svg>
    ),
  },
  // Menu Integrasi DITUNDA (fitur berbayar: repo per integrasi + code injection).
  // Halaman + API tetap ada, hanya disembunyikan dari navigasi.
  // {
  //   href: "/integrasi",
  //   label: "Integrasi",
  //   icon: (...),
  // },
  {
    href: "/aktivitas",
    label: "Aktivitas",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l2.5 2.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    href: "/monitor-ai",
    label: "Monitor AI",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 17l5-6 4 4 6-8 3 3" />
        <path strokeLinecap="round" d="M3 21h18" />
      </svg>
    ),
  },
  {
    href: "/pengguna",
    label: "Admin",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM5 21a7 7 0 0114 0" />
      </svg>
    ),
  },
  {
    href: "/pengaturan",
    label: "Pengaturan",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h10M18 8h2M4 16h2M10 16h10" />
        <circle cx="16" cy="8" r="2.5" />
        <circle cx="8" cy="16" r="2.5" />
      </svg>
    ),
  },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({ email }: { email: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
    } catch {
      /* tetap keluar */
    }
    router.push("/login");
    router.refresh();
  }

  const nav = (
    <div className="flex h-full flex-col">
      <Link href="/" className="flex items-center gap-2.5 px-2 py-1" onClick={() => setMobileOpen(false)}>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9] text-base font-bold text-white shadow-lg shadow-[#8B5CF6]/30">
          S
        </span>
        <span className="text-sm font-semibold text-white">
          Scaffdev <span className="font-normal text-zinc-500">Admin</span>
        </span>
      </Link>

      <nav className="mt-6 flex-1 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 active:scale-[0.98] ${
                active
                  ? "bg-[#8B5CF6]/15 text-white shadow-[inset_0_0_0_1px_rgb(139_92_246/0.35)]"
                  : "text-zinc-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className={active ? "text-[#A78BFA]" : "text-zinc-500 transition-colors group-hover:text-zinc-300"}>
                {item.icon}
              </span>
              {item.label}
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#8B5CF6]" />}
            </Link>
          );
        })}
      </nav>

      <div className="glass-panel mt-4 rounded-xl p-3.5">
        <p className="max-w-full truncate font-mono text-xs text-zinc-300">{email || "…"}</p>
        <p className="mt-0.5 text-[11px] text-zinc-500">Administrator</p>
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="mt-3 w-full rounded-lg border border-white/10 bg-white/5 py-1.5 text-xs font-medium text-zinc-300 transition-all hover:bg-white/10 hover:text-white active:scale-[0.98] disabled:opacity-50"
        >
          {loggingOut ? "Keluar…" : "Logout"}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Topbar mobile */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-white/5 bg-[#0A0A0B]/85 px-4 py-3 backdrop-blur-xl lg:hidden">
        <span className="flex items-center gap-2 text-sm font-semibold text-white">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9] text-xs font-bold">
            S
          </span>
          Scaffdev Admin
        </span>
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="rounded-lg border border-white/10 bg-white/5 p-2 text-zinc-300 transition-all hover:bg-white/10 active:scale-95"
          aria-label="Buka/tutup navigasi"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
            {mobileOpen ? (
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Drawer mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="animate-admin-backdrop absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 border-r border-white/10 bg-[#0D0D10] p-4 transition-transform duration-300">
            {nav}
          </aside>
        </div>
      )}

      {/* Sidebar desktop */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-white/5 bg-[#0D0D10]/60 p-4 lg:block">
        {nav}
      </aside>
    </>
  );
}
