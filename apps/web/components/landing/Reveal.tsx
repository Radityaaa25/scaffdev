"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

let spotlightInstalled = false;

/** Spotlight mengikuti mouse untuk kartu .landing-spot (sekali pasang global). */
function useLandingSpotlight() {
  useEffect(() => {
    if (spotlightInstalled) return;
    spotlightInstalled = true;
    function onMove(e: MouseEvent) {
      const target = (e.target as HTMLElement | null)?.closest?.(".landing-spot") as HTMLElement | null;
      if (!target) return;
      const rect = target.getBoundingClientRect();
      target.style.setProperty("--spot-x", `${e.clientX - rect.left}px`);
      target.style.setProperty("--spot-y", `${e.clientY - rect.top}px`);
    }
    document.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      document.removeEventListener("mousemove", onMove);
      spotlightInstalled = false;
    };
  }, []);
}

/** Reveal-on-scroll ringan (IntersectionObserver, sekali tampil). Hormat prefers-reduced-motion via CSS. */
export function Reveal({ children, delay = 0, className = "" }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  useLandingSpotlight();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("is-visible");
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className={`reveal ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}
