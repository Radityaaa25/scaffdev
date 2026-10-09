import { CopyIconButton } from "./CopyIconButton";

type Block =
  | { kind: "h"; text: string }
  | { kind: "p"; html: string }
  | { kind: "list"; ordered: boolean; items: string[] }
  | { kind: "code"; lang: string; code: string };

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Inline ringan: `code` dan **bold**. Input sudah di-escape dulu. */
function inline(html: string): string {
  return html
    .replace(/`([^`]+)`/g, '<code class="rounded border border-white/10 bg-white/5 px-1.5 py-px font-mono text-[12px] text-[#C4B5FD]">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong class=\"font-semibold text-zinc-100\">$1</strong>");
}

function isCodeLine(line: string): boolean {
  const t = line.trim();
  return (
    /^[A-Z][A-Z0-9_]+=/.test(t) ||
    /^\$ /.test(t) ||
    /^(npx|npm|composer|php artisan|git)\b/.test(t)
  );
}

function guessLang(lines: string[]): string {
  if (lines.length > 0 && lines.every((l) => /^[A-Z][A-Z0-9_]+=/.test(l.trim()))) return "env";
  return "bash";
}

/**
 * Parser mini untuk instruksi setup: heading ##, list bernomor/bullet,
 * fenced code, dan baris command/env telanjang. Selain itu jadi paragraf.
 */
function parseSetup(text: string): Block[] {
  const blocks: Block[] = [];
  const lines = text.split("\n");
  let i = 0;
  let para: string[] = [];
  const flushPara = () => {
    if (para.length > 0) {
      blocks.push({ kind: "p", html: inline(escapeHtml(para.join(" "))) });
      para = [];
    }
  };

  while (i < lines.length) {
    const line = lines[i] ?? "";
    const fence = line.trim().match(/^```(\w*)/);
    if (fence) {
      flushPara();
      const lang = fence[1] || "bash";
      const code: string[] = [];
      i++;
      while (i < lines.length && !(lines[i] ?? "").trim().startsWith("```")) {
        code.push(lines[i] ?? "");
        i++;
      }
      blocks.push({ kind: "code", lang, code: code.join("\n").replace(/\n+$/, "") });
      i++;
      continue;
    }
    const heading = line.match(/^#{1,3}\s+(.+)/);
    if (heading?.[1]) {
      flushPara();
      blocks.push({ kind: "h", text: heading[1].trim() });
      i++;
      continue;
    }
    const item = line.match(/^\s*(?:\d+[.)]|[-*])\s+(.+)/);
    if (item?.[1]) {
      flushPara();
      const ordered = /^\s*\d+[.)]/.test(line);
      const items: string[] = [item[1].trim()];
      i++;
      while (i < lines.length) {
        const next = (lines[i] ?? "").match(/^\s*(?:\d+[.)]|[-*])\s+(.+)/);
        if (!next?.[1]) break;
        items.push(next[1].trim());
        i++;
      }
      blocks.push({ kind: "list", ordered, items });
      continue;
    }
    if (line.trim() === "") {
      flushPara();
      i++;
      continue;
    }
    if (isCodeLine(line)) {
      flushPara();
      const code: string[] = [line.trim()];
      i++;
      while (i < lines.length && isCodeLine(lines[i] ?? "") && (lines[i] ?? "").trim() !== "") {
        code.push((lines[i] ?? "").trim());
        i++;
      }
      blocks.push({ kind: "code", lang: guessLang(code), code: code.join("\n") });
      continue;
    }
    para.push(line.trim());
    i++;
  }
  flushPara();
  return blocks;
}

function CodeCard({ code, lang }: { code: string; lang: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-black/40">
      <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] px-4 py-2">
        <div className="flex items-center gap-1.5" aria-hidden="true">
          <span className="terminal-dot terminal-dot-red" />
          <span className="terminal-dot terminal-dot-yellow" />
          <span className="terminal-dot terminal-dot-green" />
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-zinc-500">{lang}</span>
          <CopyIconButton text={code} />
        </div>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed text-zinc-200">
        <code>{code}</code>
      </pre>
    </div>
  );
}

/**
 * Render instruksi setup (teks markdown ringan dari database) jadi
 * section terbaca: heading, list, dan blok kode ala docs + tombol salin.
 */
export function SetupSteps({ text }: { text: string }) {
  const blocks = parseSetup(text);
  return (
    <div className="space-y-4">
      {blocks.map((b, i) => {
        if (b.kind === "h") {
          return (
            <h3 key={i} className="text-sm font-semibold text-white">
              {b.text}
            </h3>
          );
        }
        if (b.kind === "code") {
          return <CodeCard key={i} code={b.code} lang={b.lang} />;
        }
        if (b.kind === "list") {
          const Tag = b.ordered ? "ol" : "ul";
          return (
            <Tag
              key={i}
              className={
                b.ordered
                  ? "list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-zinc-400 marker:text-zinc-500"
                  : "list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-zinc-400 marker:text-zinc-600"
              }
            >
              {b.items.map((it, j) => (
                <li key={j} dangerouslySetInnerHTML={{ __html: inline(escapeHtml(it)) }} />
              ))}
            </Tag>
          );
        }
        return (
          <p
            key={i}
            className="text-sm leading-relaxed text-zinc-400"
            dangerouslySetInnerHTML={{ __html: b.html }}
          />
        );
      })}
    </div>
  );
}
