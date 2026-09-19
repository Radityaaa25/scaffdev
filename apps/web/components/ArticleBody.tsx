"use client";

import { useEffect, useRef } from "react";

const CLIPBOARD_SVG = `<svg xml:space="preserve" viewBox="0 0 6.35 6.35" height="20" width="20" version="1.1" xmlns="http://www.w3.org/2000/svg" class="clipboard" aria-hidden="true"><g><path fill="currentColor" d="M2.43.265c-.3 0-.548.236-.573.53h-.328a.74.74 0 0 0-.735.734v3.822a.74.74 0 0 0 .735.734H4.82a.74.74 0 0 0 .735-.734V1.529a.74.74 0 0 0-.735-.735h-.328a.58.58 0 0 0-.573-.53zm0 .529h1.49c.032 0 .049.017.049.049v.431c0 .032-.017.049-.049.049H2.43c-.032 0-.05-.017-.05-.049V.843c0-.032.018-.05.05-.05zm-.901.53h.328c.026.292.274.528.573.528h1.49a.58.58 0 0 0 .573-.529h.328a.2.2 0 0 1 .206.206v3.822a.2.2 0 0 1-.206.205H1.53a.2.2 0 0 1-.206-.205V1.529a.2.2 0 0 1 .206-.206z"/></g></svg>`;
const CHECKMARK_SVG = `<svg xml:space="preserve" viewBox="0 0 24 24" height="18" width="18" version="1.1" xmlns="http://www.w3.org/2000/svg" class="checkmark" aria-hidden="true"><g><path fill="currentColor" d="M9.707 19.121a.997.997 0 0 1-1.414 0l-5.646-5.647a1.5 1.5 0 0 1 0-2.121l.707-.707a1.5 1.5 0 0 1 2.121 0L9 14.171l9.525-9.525a1.5 1.5 0 0 1 2.121 0l.707.707a1.5 1.5 0 0 1 0 2.121z"/></g></svg>`;

/**
 * Article body: bungkus tiap <pre> jadi terminal Card
 * (traffic lights + label bahasa + tombol copy tooltip).
 */
export function ArticleBody({ html }: { html: string }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const cleanups: (() => void)[] = [];

    // Bungkus tiap <table> agar bisa scroll horizontal di mobile
    const tables = Array.from(root.querySelectorAll("table"));
    tables.forEach((table) => {
      if (table.parentElement?.classList.contains("docs-table-wrapper")) return;
      const wrapper = document.createElement("div");
      wrapper.className = "docs-table-wrapper";
      const parent = table.parentNode;
      if (parent) {
        parent.insertBefore(wrapper, table);
        wrapper.appendChild(table);
      }
      cleanups.push(() => {
        const p = wrapper.parentNode;
        if (p) {
          p.insertBefore(table, wrapper);
          wrapper.remove();
        }
      });
    });

    const pres = Array.from(root.querySelectorAll("pre"));
    pres.forEach((pre) => {
      if (pre.dataset.terminalProcessed === "true") return;
      pre.dataset.terminalProcessed = "true";

      const codeEl = pre.querySelector("code");
      const className = codeEl?.className ?? "";
      const langMatch = className.match(/language-([\w+-]+)/);
      const lang = langMatch ? langMatch[1] : "code";

      // Wrapper terminal Card
      const card = document.createElement("div");
      card.className = "terminal-card";

      // Header: dots kiri, lang + copy kanan
      const header = document.createElement("div");
      header.className = "terminal-header";

      const dots = document.createElement("div");
      dots.className = "terminal-dots";
      dots.setAttribute("aria-hidden", "true");
      dots.innerHTML =
        '<span class="terminal-dot terminal-dot-red"></span>' +
        '<span class="terminal-dot terminal-dot-yellow"></span>' +
        '<span class="terminal-dot terminal-dot-green"></span>';

      const meta = document.createElement("div");
      meta.className = "terminal-meta";

      const langLabel = document.createElement("p");
      langLabel.className = "terminal-lang";
      langLabel.textContent = lang;

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "copy terminal-copy";
      btn.setAttribute("aria-label", "Copy to clipboard");
      btn.innerHTML =
        '<span data-text-initial="Copy to clipboard" data-text-end="Copied!" class="tooltip"></span>' +
        `<span class="terminal-copy-icons">${CLIPBOARD_SVG}${CHECKMARK_SVG}</span>`;

      const onClick = async () => {
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
        btn.setAttribute("aria-label", "Copied!");
        setTimeout(() => {
          btn.classList.remove("copied");
          btn.setAttribute("aria-label", "Copy to clipboard");
        }, 1600);
      };

      btn.addEventListener("click", onClick);
      cleanups.push(() => btn.removeEventListener("click", onClick));

      meta.appendChild(langLabel);
      meta.appendChild(btn);
      header.appendChild(dots);
      header.appendChild(meta);

      // Sisipkan card membungkus pre
      const parent = pre.parentNode;
      if (parent) {
        parent.insertBefore(card, pre);
        card.appendChild(header);
        card.appendChild(pre);
      }

      cleanups.push(() => {
        const p = card.parentNode;
        if (p) {
          p.insertBefore(pre, card);
          card.remove();
          delete pre.dataset.terminalProcessed;
        }
      });
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
