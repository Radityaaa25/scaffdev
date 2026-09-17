import fs from "fs";
import path from "path";
import { marked } from "marked";

export interface DocMeta {
  slug: string;
  title: string;
  description: string;
  order: number;
}

export interface DocItem extends DocMeta {
  content: string;
  html: string;
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

  // Custom renderer or marked options for clean styling
  const html = await marked.parse(body);

  return {
    slug,
    title: meta.title || fallbackTitle || slug,
    description: meta.description || "",
    order: meta.order ? parseInt(meta.order, 10) : 99,
    content: body,
    html,
  };
}
