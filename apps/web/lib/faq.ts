export interface Faq {
  q: string;
  a: string;
}

/**
 * FAQ landing: satu sumber data untuk accordion (`FaqCta`) dan
 * FAQPage JSON-LD, supaya teks yang di-crawl selalu sama dengan yang dibaca user.
 */
export const FAQS: Faq[] = [
  {
    q: "Apa itu Scaffdev?",
    a: "Scaffolding generator: kamu dapat folder project siap jalan (UI jadi, struktur best-practice, .env.example, SETUP.md) hanya dengan satu baris command npx. Saat ini tersedia template Next.js dan Laravel.",
  },
  {
    q: "Apakah template-nya benar-benar siap pakai?",
    a: "Ya. Berbeda dengan boilerplate kosong, setiap template punya tampilan visual yang sudah jadi (e-commerce, landing page, portfolio) plus kurasi integrasi lokal seperti Supabase, Midtrans, Xendit, dan Duitku.",
  },
  {
    q: "Bagaimana CLI tahu template yang tersedia?",
    a: "CLI 100% API-driven: pilihan template = data is_published=true dari database yang sama dengan web ini. Kalau DB kosong, CLI menampilkan error eksplisit. Tidak ada template hardcode/palsu.",
  },
  {
    q: "Apakah gratis?",
    a: "Ya, source-available di bawah PolyForm Shield untuk developer Indonesia. Cukup Node.js v18+, Git, dan koneksi internet untuk mulai generate.",
  },
  {
    q: "Di mana saya bisa bertanya atau lapor bug?",
    a: "Gunakan asisten AI di website, baca dokumentasi berbahasa Indonesia, atau kirim laporan via halaman Lapor Bug. Bisa melampirkan gambar bukti.",
  },
];

/**
 * FAQPage JSON-LD untuk halaman landing. Wajib 100% sama dengan `FAQS` yang
 * dirender sebagai accordion (Google bisa menggugat markup yang tidak
 * konsisten dengan konten visible), makanya datanya diambil dari satu sumber.
 */
export function faqPageJsonLd(faqs: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}
