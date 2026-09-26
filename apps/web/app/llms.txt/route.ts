import { getAllDocs } from "@/lib/docs";
import { getAllTemplates } from "@/lib/data";
import { SITE_URL, SITE_NAME, SITE_TAGLINE } from "@/lib/seo";

/** llms.txt — ringkasan machine-readable untuk AI search & agent. */
export async function GET() {
  let templates: { slug: string; nama: string; framework: string; kategori: string }[] = [];
  try {
    templates = await getAllTemplates();
  } catch {
    templates = [];
  }
  const docs = getAllDocs();

  const lines = [
    `# ${SITE_NAME}`,
    "",
    `> ${SITE_TAGLINE}`,
    "",
    "## Cara memakai",
    "",
    "Generate project via CLI (tanpa install permanen): `npx scaffdev@latest` (interaktif) atau `npx scaffdev@latest --template=<slug>` (langsung; wajib pakai tanda `=`). Framework template yang didukung: Next.js (butuh Node.js v18+) dan Laravel (butuh PHP 8.2+ dan Composer).",
    "",
    "## Templates",
    "",
    ...templates.map(
      (t) => `- [${t.nama} (${t.framework}, ${t.kategori})](${SITE_URL}/templates/${t.slug})`
    ),
    ...(templates.length === 0 ? ["- (katalog sedang disiapkan)"] : []),
    "",
    "## Dokumentasi",
    "",
    ...docs.map((d) => `- [${d.title}](${SITE_URL}/docs/${d.slug}): ${d.description}`),
    "",
    "## Aturan penting",
    "",
    "- Scaffdev tidak membuatkan akun pihak ketiga (Supabase/Midtrans/Xendit/RajaOngkir) — user daftar sendiri.",
    "- File env aktif (.env.local / .env) jangan pernah di-commit.",
    "- Fitur custom kombinasi integrasi (Builder, /builder) sudah live — butuh CLI 0.2.0+.",
    "",
    `Selengkapnya: ${SITE_URL}/llms-full.txt`,
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
