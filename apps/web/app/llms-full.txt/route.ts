import { getAllDocs, getDocBySlug } from "@/lib/docs";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/seo";

/** llms-full.txt — seluruh isi dokumentasi mentah untuk AI search & agent. */
export async function GET() {
  const docs = getAllDocs();
  const parts: string[] = [
    `# ${SITE_NAME} — Dokumentasi Lengkap`,
    "",
    `> ${SITE_TAGLINE}`,
    "",
  ];

  for (const d of docs) {
    try {
      const full = await getDocBySlug(d.slug);
      if (!full) continue;
      parts.push(`---\n\n# ${full.title}\n\n${full.description}\n\n${full.content}\n`);
    } catch {
      continue;
    }
  }

  return new Response(parts.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
