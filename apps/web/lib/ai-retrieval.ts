/**
 * Retrieval untuk asisten AI: query terms, sinonim, scoring, dan fakta stabil.
 *
 * SENGAJA tanpa dependensi (tidak import lib/docs agar bisa diuji langsung
 * via `node scripts/eval-ai/run.ts` tanpa bundler). Sintaks hanya yang
 * erasable (tanpa enum/namespace) demi type-stripping Node.
 */

export interface SearchDoc {
  slug: string;
  title: string;
  content: string;
}

export interface ScoredDoc {
  title: string;
  content: string;
  score: number;
}

const SHORT_TERMS = new Set([
  "cli",
  "env",
  "slug",
  "api",
  "sdk",
  "db",
  "ui",
  "pr",
]);

export function queryTerms(message: string): string[] {
  const words = message
    .toLowerCase()
    .split(/[^a-z0-9_]+/)
    .filter((w) => w.length > 3 || SHORT_TERMS.has(w));
  return [...new Set(words)];
}

/** Sinonim Indonesia/Inggris agar istilah user tetap kena dokumen yang tepat. */
const SYNONYMS: Record<string, string[]> = {
  bayar: ["harga", "biaya", "premium", "berbayar", "pricing"],
  harga: ["bayar", "biaya", "premium", "berbayar"],
  lisensi: ["license", "legal", "lisence"],
  license: ["lisensi", "legal"],
  hapus: ["copot", "remove", "uninstall", "buang", "uninstallasi"],
  copot: ["hapus", "remove", "uninstall"],
  pasang: ["install", "instal", "tambah", "add"],
  install: ["instal", "pasang", "tambah"],
  error: ["gagal", "rusak", "bug", "masalah", "troubleshoot"],
  gagal: ["error", "bug", "masalah"],
  template: ["starter", "boilerplate"],
  integrasi: ["integration", "modul", "plugin"],
  docs: ["dokumentasi", "panduan", "tutorial", "cara"],
  dokumentasi: ["docs", "panduan", "tutorial"],
  kunci: ["key", "api-key", "apikey", "token"],
};

export function expandTerms(terms: string[]): string[] {
  const out = new Set<string>(terms);
  for (const t of terms) {
    for (const s of SYNONYMS[t] ?? []) out.add(s);
  }
  return [...out];
}

/** Skor: judul +3, heading markdown +2 (maks 3), body maks 3 per istilah. */
export function scoreDocs(
  corpus: SearchDoc[],
  terms: string[],
  maxDocs = 3
): ScoredDoc[] {
  const scored: ScoredDoc[] = [];
  for (const d of corpus) {
    const hayTitle = d.title.toLowerCase();
    const hayBody = d.content.toLowerCase().slice(0, 4000);
    const hayHeadings = d.content
      .split("\n")
      .filter((ln) => ln.startsWith("#"))
      .join("\n")
      .toLowerCase();
    let score = 0;
    for (const t of terms) {
      if (hayTitle.includes(t)) score += 3;
      const headHits = hayHeadings.split(t).length - 1;
      score += Math.min(headHits, 3) * 2;
      // NOTED: hitung kemunculan di body maksimal 3 agar 1 doc berulang-ulang
      // tidak mengalahkan doc yang cocok banyak istilah berbeda.
      const hits = hayBody.split(t).length - 1;
      score += Math.min(hits, 3);
    }
    if (score > 0) scored.push({ title: d.title, content: d.content, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, maxDocs);
}

/** Potong di batas paragraf agar konteks tidak terpenggal tengah kalimat. */
export function truncateToParagraph(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  const cut = text.lastIndexOf("\n\n", maxChars);
  if (cut > maxChars - 600) return text.slice(0, cut);
  return text.slice(0, maxChars);
}

/** FAQ sebagai unit retrievable (judul = pertanyaan). */
export function faqCorpus(faqs: Array<{ q: string; a: string }>): SearchDoc[] {
  return faqs.map((f, i) => ({
    slug: `faq-${i}`,
    title: f.q,
    content: `${f.q}\n${f.a}`,
  }));
}

/**
 * Fakta stabil yang SELALU ada di konteks (tidak tergantung retrieval).
 * Di-import route chat ke dalam system prompt. Urutan = urutan prompt.
 */
export const SCAFFDEV_FACTS: string[] = [
  "- Command interaktif: npx scaffdev@latest. Langsung via slug: npx scaffdev@latest --template=<slug> (WAJIB pakai tanda =, tanpa spasi). Nama folder custom: npx scaffdev@latest nama-folder --template=<slug>. Instal global: npm install -g scaffdev.",
  "- Framework template yang didukung: Next.js (App Router, butuh Node.js v18+) dan Laravel (butuh PHP 8.2+ dan Composer). Selain itu BELUM didukung.",
  "- Kategori: ecommerce, landing-page, portfolio.",
  "- Alur: pilih template di web → generate via CLI (git clone template + generate .env.example & SETUP.md) → salin env (Next.js: cp .env.example .env.local; Laravel: cp .env.example .env + php artisan key:generate) → isi API key → npm run dev / php artisan serve.",
  "- Aturan env: nilai berprefix NEXT_PUBLIC_ terbaca di browser. Secret server (mis. Midtrans server key, Xendit secret) JANGAN pakai prefix itu. Jangan pernah commit .env/.env.local (sudah di .gitignore template).",
  "- Scaffdev TIDAK membuatkan akun pihak ketiga (Supabase/Midtrans/Xendit/RajaOngkir): user daftar sendiri. Scaffdev hanya menyiapkan kode + panduan di SETUP.md. Semua repo template publik, clone tanpa token/login.",
  "- 'Builder' adalah nama fitur rancang-sendiri di /builder (pilih template base + centang integrasi, maks 1 per kategori inti; kategori other boleh multi): SUDAH LIVE, butuh CLI 0.2.0+. Katalog Template juga live.",
  "- Aturan 'maks 1 per kategori' (1 payment, 1 database, dst.) berlaku di Builder (kategori inti). Template katalog tidak terpengaruh (isinya fix). Kalau user bertanya 'apakah bisa custom integrasi?', jawab: bisa, lewat Builder. Contoh: npx scaffdev@latest toko-saya --template=ecommerce-basic-nextjs --with=midtrans,supabase.",
  "- Saat menyebut command, gunakan format npx scaffdev@latest --template=<slug>.",
  "- Lisensi: Scaffdev source-available di bawah PolyForm Shield 1.0.0 (bukan MIT). Boleh lihat, pakai, ubah, bagikan, dan berkontribusi; dilarang dipakai untuk produk yang bersaing dengan Scaffdev.",
  "- Template premium memakai lisensi komersial terpisah; membeli = hak pakai, bukan hak edar ulang.",
  "- Hasil generate bebas dipakai; kredit ScaffDev level kode (README, SETUP.md, .scaff/meta.json) wajib dipertahankan, elemen visual bebas diubah.",
  "- Kontribusi diatur CLA; nama dan logo Scaffdev tidak dilisensikan.",
];
