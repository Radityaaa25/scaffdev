import { Template, TemplateDetailResponse } from "../types";

const DEFAULT_API_URL = process.env.SCAFF_API_BASE_URL || "http://localhost:3000";

// Fallback seed data in case API server is unreachable during offline/CLI dev
const FALLBACK_TEMPLATES: Template[] = [
  {
    id: "tpl-1",
    slug: "ecommerce-basic-nextjs",
    nama: "E-commerce Basic",
    framework: "nextjs",
    kategori: "ecommerce",
    repo_url: "https://github.com/scaff/ecommerce-basic-nextjs.git",
    deskripsi: "Starter kit toko online modern dengan Next.js App Router, keranjang belanja, dan UI responsif.",
    opsi_integrasi: [],
    is_published: true,
  },
  {
    id: "tpl-2",
    slug: "ecommerce-supabase-midtrans-nextjs",
    nama: "E-commerce Fullstack (Supabase + Midtrans)",
    framework: "nextjs",
    kategori: "ecommerce",
    repo_url: "https://github.com/scaff/ecommerce-supabase-midtrans-nextjs.git",
    deskripsi: "Toko online lengkap terintegrasi database Supabase dan payment gateway Midtrans Snap.",
    opsi_integrasi: ["supabase", "midtrans"],
    is_published: true,
  },
  {
    id: "tpl-3",
    slug: "landingpage-basic-nextjs",
    nama: "SaaS Landing Page",
    framework: "nextjs",
    kategori: "landing-page",
    repo_url: "https://github.com/scaff/landingpage-basic-nextjs.git",
    deskripsi: "Landing page modern dengan hero section, fitur, pricing table, dan form kontak.",
    opsi_integrasi: [],
    is_published: true,
  },
  {
    id: "tpl-4",
    slug: "portfolio-basic-nextjs",
    nama: "Developer Portfolio Minimalist",
    framework: "nextjs",
    kategori: "portfolio",
    repo_url: "https://github.com/scaff/portfolio-basic-nextjs.git",
    deskripsi: "Portfolio developer elegan dengan showcase proyek, riwayat pengalaman, dan blog.",
    opsi_integrasi: [],
    is_published: true,
  },
];

export async function fetchTemplatesFromApi(): Promise<Template[]> {
  try {
    const res = await fetch(`${DEFAULT_API_URL}/api/templates`, {
      signal: AbortSignal.timeout(3500),
    });
    if (!res.ok) {
      throw new Error(`HTTP error: ${res.status}`);
    }
    const data = await res.json();
    if (Array.isArray(data.templates) && data.templates.length > 0) {
      return data.templates;
    }
    return FALLBACK_TEMPLATES;
  } catch (_err) {
    // Graceful fallback to offline seed templates
    return FALLBACK_TEMPLATES;
  }
}

export async function fetchTemplateDetailFromApi(
  slug: string
): Promise<TemplateDetailResponse> {
  try {
    const res = await fetch(`${DEFAULT_API_URL}/api/templates/${slug}`, {
      signal: AbortSignal.timeout(3500),
    });
    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }
    return await res.json();
  } catch (_err) {
    const found = FALLBACK_TEMPLATES.find((t) => t.slug === slug);
    if (!found) {
      throw new Error(`Template dengan slug "${slug}" tidak ditemukan.`);
    }

    return {
      slug: found.slug,
      nama: found.nama,
      repo_url: found.repo_url,
      framework: found.framework,
      kategori: found.kategori,
      deskripsi: found.deskripsi ?? undefined,
      integrasi: found.opsi_integrasi.map((code) => ({
        kode: code,
        nama_tampilan: code.toUpperCase(),
        daftar_env_var: [
          { key: `NEXT_PUBLIC_${code.toUpperCase()}_KEY`, deskripsi: `API Key untuk ${code}` },
        ],
        instruksi_setup: `## Panduan Setup ${code}\nSilakan daftarkan akun di layanan ${code} dan isi environment variable.`,
      })),
    };
  }
}
