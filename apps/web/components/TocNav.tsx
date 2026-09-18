"use client";

import { useEffect, useState } from "react";
import type { TocEntry } from "@/lib/docs";

/** Table of Contents navigation dengan scrollspy untuk active state detection */
export function TocNav({ toc }: { toc: TocEntry[] }) {
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    if (toc.length === 0) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(e.target.id);
        }
      },
      { rootMargin: "-80px 0px -70% 0px" }
    );
    
    const els: Element[] = [];
    for (const t of toc) {
      const el = document.getElementById(t.id);
      if (el) {
        observer.observe(el);
        els.push(el);
      }
    }
    
    return () => els.forEach((el) => observer.unobserve(el));
  }, [toc]);

  if (toc.length === 0) return null;

  return (
    <nav aria-label="Di halaman ini" className="space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
        Di Halaman Ini
      </h3>
      
      <ul className="space-y-2 border-l-2 border-white/10">
        {toc.map((t) => {
          const isActive = active === t.id;
          const isH3 = t.level === 3;
          
          return (
            <li key={t.id}>
              <a
                href={`#${t.id}`}
                onClick={() => setActive(t.id)}
                className={`-ml-0.5 block border-l-2 py-2 text-sm leading-snug transition-all ${
                  isH3 ? "pl-6" : "pl-4"
                } ${
                  isActive
                    ? "border-[#8B5CF6] font-medium text-[#FAFAFA]"
                    : "border-transparent text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
                }`}
              >
                {t.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
