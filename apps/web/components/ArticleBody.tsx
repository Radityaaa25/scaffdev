"use client";

import { useEffect, useRef } from "react";

/**
 * Article body dengan SPACING EKSTREM untuk readability maksimal
 */
export function ArticleBody({ html }: { html: string }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const pres = Array.from(root.querySelectorAll("pre"));
    const cleanups: (() => void)[] = [];

    pres.forEach((pre) => {
      if (pre.querySelector("[data-copy-btn]")) return;
      
      const htmlPre = pre as HTMLElement;
      htmlPre.style.position = "relative";
      
      // Set padding untuk code block yang pas dengan tombol copy
      const codeEl = htmlPre.querySelector("code");
      if (codeEl) {
        const htmlCode = codeEl as HTMLElement;
        htmlCode.style.display = "block";
        htmlCode.style.padding = "56px 24px 24px 24px"; // Top padding untuk tombol copy
        htmlCode.style.overflowX = "auto";
      }

      const btn = document.createElement("button");
      btn.setAttribute("data-copy-btn", "true");
      btn.setAttribute("aria-label", "Salin kode");
      btn.className = "docs-copy-btn";
      btn.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="15" height="15" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg><span>Copy</span>';
      
      btn.addEventListener("click", async () => {
        const code = pre.querySelector("code");
        const text = code ? code.innerText : pre.innerText;
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          const ta = document.createElement("textarea");
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          document.body.removeChild(ta);
        }
        btn.classList.add("copied");
        const label = btn.querySelector("span");
        if (label) label.textContent = "Copied!";
        setTimeout(() => {
          btn.classList.remove("copied");
          const l = btn.querySelector("span");
          if (l) l.textContent = "Copy";
        }, 1600);
      });
      
      htmlPre.appendChild(btn);
      cleanups.push(() => btn.remove());
    });

    return () => cleanups.forEach((fn) => fn());
  }, [html]);

  return (
    <article
      ref={ref}
      className="docs-article"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
