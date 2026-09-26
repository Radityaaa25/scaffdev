import fs from "fs";
import path from "path";
import { Marked } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js";
// NOTED: SENGAJA tidak memakai isomorphic-dompurify di server — ia menarik
// jsdom yang gagal di-load di serverless Vercel ("Failed to load external
// module jsdom" → 500 kosong di semua route pengimpor lib ini). Sebagai ganti,
// sanitasi ringan khusus di bawah (cukup karena docs/*.md adalah konten
// first-party terpercaya, bukan input user/AI).

export interface DocMeta {
  slug: string;
  title: string;
  description: string;
  order: number;
  section: string;
}

export interface TocEntry {
  level: number;
  text: string;
  id: string;
}

export interface DocItem extends DocMeta {
  content: string;
  html: string;
  toc: TocEntry[];
}

const DOCS_DIR = path.join(process.cwd(), "content", "docs");

function parseFrontmatter(raw: string): { meta: Record<string, string>; body: string } {
  const meta: Record<string, string> = {};
  let body = raw;

  if (raw.startsWith("---")) {
    const end = raw.indexOf("---", 3);
    if (end !== -1) {
      const header = raw.slice(3, end).trim();
      body = raw.slice(end + 3).trim();

      header.split("\n").forEach((line) => {
        const colon = line.indexOf(":");
        if (colon !== -1) {
          const key = line.slice(0, colon).trim();
          const value = line.slice(colon + 1).trim();
          meta[key] = value;
        }
      });
    }
  }

  return { meta, body };
}

function slugifyHeading(text: string): string {
  return text
    .replace(/&[a-zA-Z0-9#]+;/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\u00C0-\u024F\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

/**
 * Sanitasi ringan khusus HTML hasil render docs — tanpa jsdom/DOMPurify
 * (tidak bisa jalan di serverless Vercel).
 * Menghapus: blok <script>, atribut event-handler (on*), dan javascript: URL.
 * BUKAN sanitizer general-purpose — jangan pakai untuk konten user/AI.
 */
function sanitizeDocsHtml(html: string): string {
  return (
    html
      // Blok script (termasuk multiline, case-insensitive).
      .replace(/<script[\s\S]*?<\/script\s*>/gi, "")
      // Event handler: onload="...", onclick='...', onerror=... (quoted/unquoted).
      .replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
      // javascript: di href/src/action (dengan/tanpa quotes, case-insensitive).
      .replace(/\s(href|src|action)\s*=\s*("javascript:[^"]*"|'javascript:[^']*'|javascript:[^\s>]+)/gi, ' $1="#"')
  );
}

export function getAllDocs(): DocMeta[] {
  if (!fs.existsSync(DOCS_DIR)) {
    return [];
  }

  const files = fs.readdirSync(DOCS_DIR).filter((f) => f.endsWith(".md"));

  const docs: DocMeta[] = files.map((file) => {
    const slug = file.replace(/\.md$/, "");
    const fullPath = path.join(DOCS_DIR, file);
    const content = fs.readFileSync(fullPath, "utf-8");
    const { meta, body } = parseFrontmatter(content);

    const firstHeadingMatch = body.match(/^#\s+(.+)$/m);
    const fallbackTitle = firstHeadingMatch ? firstHeadingMatch[1] : slug;

    return {
      slug,
      title: meta.title || fallbackTitle || slug,
      description: meta.description || "Panduan penggunaan dan dokumentasi Scaff.",
      order: meta.order ? parseInt(meta.order, 10) : 99,
      section: meta.section || "Lainnya",
    };
  });

  return docs.sort((a, b) => a.order - b.order);
}

export async function getDocBySlug(slug: string): Promise<DocItem | null> {
  const fullPath = path.join(DOCS_DIR, `${slug}.md`);

  if (!fs.existsSync(fullPath)) {
    return null;
  }

  const content = fs.readFileSync(fullPath, "utf-8");
  const { meta, body } = parseFrontmatter(content);

  const firstHeadingMatch = body.match(/^#\s+(.+)$/m);
  const fallbackTitle = firstHeadingMatch ? firstHeadingMatch[1] : slug;

  // Setup marked dengan syntax highlighting
  const toc: TocEntry[] = [];
  const seen = new Map<string, number>();
  
  const marked = new Marked(
    markedHighlight({
      langPrefix: "hljs language-",
      highlight(code, lang) {
        const language = hljs.getLanguage(lang) ? lang : "plaintext";
        return hljs.highlight(code, { language }).value;
      },
    })
  );

  marked.use({
    gfm: true,
    breaks: true,
    renderer: {
      heading(
        this: { parser: { parseInline(tokens: unknown[]): string } },
        { tokens, depth }: { tokens: unknown[]; depth: number }
      ) {
        const html = this.parser.parseInline(tokens);
        const plain = html.replace(/<[^>]*>/g, "");
        const base = slugifyHeading(plain) || "bagian";
        const n = (seen.get(base) ?? 0) + 1;
        seen.set(base, n);
        const id = n > 1 ? `${base}-${n}` : base;
        
        if (depth >= 2 && depth <= 3) {
          toc.push({ level: depth, text: plain, id });
        }
        
        return `<h${depth} id="${id}" class="scroll-mt-24 group">${html}<a href="#${id}" aria-label="Link ke bagian ini" class="ml-2 opacity-0 transition-opacity group-hover:opacity-100 text-[#8B5CF6] no-underline">#</a></h${depth}>\n`;
      },
      link({ href, title, tokens }) {
        const text = this.parser.parseInline(tokens);
        const titleAttr = title ? ` title="${title}"` : "";
        const isExternal = href?.startsWith("http");
        const rel = isExternal ? ' rel="noopener noreferrer" target="_blank"' : "";
        return `<a href="${href}"${titleAttr}${rel}>${text}</a>`;
      },
      // NOTE: blok kode sengaja TIDAK di-override di sini.
      // marked-highlight di atas sudah melakukan hljs.highlight sekali
      // via walkTokens. Override ganda menyebabkan HTML <span class="hljs-*">
      // ke-escape dan tampil sebagai teks mentah di halaman docs.
    },
  });

  const html = await marked.parse(body);

  // W2: marked meneruskan raw HTML apa adanya → strip pola aktif berbahaya
  // (<script>, event-handler, javascript: URL) agar tidak tereksekusi di
  // browser pembaca docs. Cukup untuk konten first-party; output AI/bubble
  // chat (untrusted) tetap lewat DOMPurify penuh di sisi client (AskAI).
  const cleanHtml = sanitizeDocsHtml(typeof html === "string" ? html : "");

  return {
    slug,
    title: meta.title || fallbackTitle || slug,
    description: meta.description || "",
    order: meta.order ? parseInt(meta.order, 10) : 99,
    section: meta.section || "Lainnya",
    content: body,
    html: cleanHtml,
    toc,
  };
}
