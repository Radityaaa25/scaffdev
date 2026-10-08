/**
 * Eval emas asisten AI (retrieval-level, tanpa LLM).
 *
 * Menjalankan FUNGSI ASLI (lib/ai-retrieval) di atas KORPUS ASLI
 * (content/docs/*.md via fs + FAQ) lalu menegaskan:
 *  - slug yang diharapkan masuk top-3 retrieval, dan
 *  - fakta yang diharapkan hadir di konteks rakitan (docs + FAKTA_KUNCI).
 *
 * Cara jalan: `pnpm --filter @scaff/web eval-ai` (compile + run).
 * Exit 0 = semua lolos; exit 1 = ada yang gagal (nama kasus dicetak).
 */
import * as fs from "fs";
import * as path from "path";
import {
  expandTerms,
  faqCorpus,
  queryTerms,
  scoreDocs,
  truncateToParagraph,
  SCAFFDEV_FACTS,
} from "../../lib/ai-retrieval";
import { FAQS } from "../../lib/faq";

interface GoldenCase {
  name: string;
  question: string;
  expectSlugInTop3: string[];
  expectFactInContext: string[];
}

interface DocRow {
  slug: string;
  title: string;
  content: string;
}

function parseTitle(raw: string, fallback: string): { title: string; body: string } {
  let title = fallback;
  let body = raw;
  if (raw.startsWith("---")) {
    const end = raw.indexOf("---", 3);
    if (end !== -1) {
      const header = raw.slice(3, end);
      body = raw.slice(end + 3).trim();
      for (const line of header.split("\n")) {
        const colon = line.indexOf(":");
        if (colon !== -1 && line.slice(0, colon).trim() === "title") {
          title = line.slice(colon + 1).trim();
        }
      }
    }
  }
  return { title, body };
}

function loadCorpus(): DocRow[] {
  const dir = path.join(process.cwd(), "content", "docs");
  const rows: DocRow[] = [];
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".md"))) {
    const raw = fs.readFileSync(path.join(dir, f), "utf8");
    const slug = f.replace(/\.md$/, "");
    const { title, body } = parseTitle(raw, slug);
    rows.push({ slug, title, content: body });
  }
  for (const f of faqCorpus(FAQS)) rows.push(f);
  return rows;
}

function buildContext(corpus: DocRow[], question: string): { top: string[]; context: string } {
  const terms = expandTerms(queryTerms(question));
  const top = scoreDocs(corpus, terms, 3);
  const parts = top.map((s) => `### ${s.title}\n${truncateToParagraph(s.content, 1500)}`);
  const context = [...parts, ...SCAFFDEV_FACTS].join("\n\n");
  return { top: top.map((s) => {
    const hit = corpus.find((c) => c.title === s.title && c.content === s.content);
    return hit ? hit.slug : s.title;
  }), context };
}

function main(): void {
  // golden.json dibaca dari source (tidak ikut ter-emit ke dist).
  const goldenPath = path.join(process.cwd(), "scripts", "eval-ai", "golden.json");
  const cases = JSON.parse(fs.readFileSync(goldenPath, "utf8")) as GoldenCase[];
  const corpus = loadCorpus();
  let failed = 0;
  for (const c of cases) {
    const problems: string[] = [];
    const { top, context } = buildContext(corpus, c.question);
    for (const slug of c.expectSlugInTop3) {
      if (!top.includes(slug)) {
        problems.push(`slug "${slug}" tidak masuk top3 (dapat: ${top.join(", ") || "-"})`);
      }
    }
    for (const fact of c.expectFactInContext) {
      if (!context.includes(fact)) {
        problems.push(`fakta "${fact}" tidak ada di konteks`);
      }
    }
    if (problems.length > 0) {
      failed += 1;
      console.log(`FAIL ${c.name}: ${problems.join(" | ")}`);
    } else {
      console.log(`PASS ${c.name}`);
    }
  }
  console.log(failed === 0 ? `OK: ${cases.length}/${cases.length}` : `GAGAL: ${failed}/${cases.length}`);
  process.exit(failed === 0 ? 0 : 1);
}

main();
