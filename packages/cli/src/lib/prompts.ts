import * as p from "@clack/prompts";
import { Template } from "../types";
import type { IntegrasiRow } from "./modules";

export interface InteractivePromptResult {
  slug: string;
  targetFolder: string;
}

export type BuilderMode = "siap-pakai" | "builder" | "ambil";

/** Signal untuk navigasi kembali */
const BACK_SIGNAL = "__BACK__";

/** Kategori inti: maks 1 pilihan (cermin SINGLE_SELECT web Builder). */
const SINGLE_SELECT = new Set(["payment", "database", "auth", "shipping"]);

const KATEGORI_ORDER = ["payment", "database", "auth", "shipping", "other"];

const KATEGORI_LABELS: Record<string, { label: string; hint: string }> = {
  ecommerce: {
    label: "E-commerce",
    hint: "Toko online, katalog produk, keranjang belanja & payment gateway",
  },
  "landing-page": {
    label: "Landing Page",
    hint: "Halaman promosi produk, SaaS, marketing & lead generation",
  },
  portfolio: {
    label: "Portfolio",
    hint: "Showcase karya personal, developer profile, & riwayat proyek",
  },
};

const FRAMEWORK_LABELS: Record<string, string> = {
  nextjs: "Next.js (App Router)",
  laravel: "Laravel (PHP)",
};

export async function runModeSelect(): Promise<BuilderMode | null> {
  const mode = await p.select({
    message: "Mau cara apa?",
    options: [
      {
        value: "siap-pakai",
        label: "Siap pakai",
        hint: "Langsung generate varian template jadi",
      },
      {
        value: "builder",
        label: "Builder",
        hint: "Racik base + centang integrasi sendiri",
      },
      {
        value: "ambil",
        label: "Ambil integrasi",
        hint: "Suntik 1 modul ke project yang sedang dibuka",
      },
    ],
  });
  if (p.isCancel(mode)) {
    p.cancel("Operasi dibatalkan.");
    return null;
  }
  return mode as BuilderMode;
}

export async function pickKategori(
  templates: Template[],
  options?: { allowBack?: boolean }
): Promise<string | null> {
  // Extract unique categories available from real-time templates
  const availableCategories = Array.from(
    new Set(templates.map((t) => t.kategori))
  );

  const categoryOptions = availableCategories.map((cat) => ({
    value: cat,
    label: KATEGORI_LABELS[cat]?.label || cat,
    hint: KATEGORI_LABELS[cat]?.hint,
  }));

  // Tambahkan opsi Kembali di awal jika diizinkan
  if (options?.allowBack) {
    categoryOptions.unshift({
      value: BACK_SIGNAL,
      label: "← Kembali",
      hint: undefined,
    });
  }

  // Prompt 1: Pilih Kategori
  const kategori = await p.select({
    message: "Pilih jenis project yang ingin Anda bangun:",
    options: categoryOptions,
  });

  if (p.isCancel(kategori)) {
    p.cancel("Operasi dibatalkan.");
    return null;
  }
  return kategori as string;
}

export async function pickFramework(
  templatesForCategory: Template[],
  options?: { allowBack?: boolean }
): Promise<string | null> {
  // Extract frameworks available for that category
  const availableFrameworks = Array.from(
    new Set(templatesForCategory.map((t) => t.framework))
  );

  const frameworkOptions = [
    ...availableFrameworks.map((fw) => ({
      value: fw,
      label: FRAMEWORK_LABELS[fw] || fw,
      hint: "Rekomendasi resmi Scaffdev",
    })),
  ];

  // Jika belum ada template Laravel terdaftar, tampilkan opsi non-aktif sebagai info.
  // Opsi ini hilang otomatis begitu template Laravel pertama didaftarkan via admin.
  if (!availableFrameworks.includes("laravel")) {
    frameworkOptions.push({
      value: "laravel-disabled",
      label: "Laravel (PHP)",
      hint: "Belum ada template Laravel. Daftarkan via halaman admin",
    });
  }

  // Tambahkan opsi Kembali di awal jika diizinkan
  if (options?.allowBack) {
    frameworkOptions.unshift({
      value: BACK_SIGNAL,
      label: "← Kembali ke pilihan kategori",
      hint: undefined,
    });
  }

  // Prompt 2: Pilih Framework
  const framework = await p.select({
    message: "Pilih framework utama:",
    options: frameworkOptions,
  });

  if (p.isCancel(framework)) {
    p.cancel("Operasi dibatalkan.");
    return null;
  }

  if (framework === "laravel-disabled") {
    p.cancel("Belum ada template Laravel yang terdaftar. Daftarkan dulu lewat halaman admin.");
    return null;
  }
  return framework as string;
}

async function pickVariant(
  availableVariants: Template[],
  options?: { allowBack?: boolean }
): Promise<string | null> {
  const variantOptions = availableVariants.map((v) => {
    const integrationsText =
      v.opsi_integrasi.length > 0
        ? `[Integrasi: ${v.opsi_integrasi.join(" + ")}]`
        : "[Basic: Tanpa Integrasi Tambahan]";

    return {
      value: v.slug,
      label: `${v.nama} ${integrationsText}`,
      hint: v.deskripsi || undefined,
    };
  });

  // Tambahkan opsi Kembali di awal jika diizinkan
  if (options?.allowBack) {
    variantOptions.unshift({
      value: BACK_SIGNAL,
      label: "← Kembali ke pilihan framework",
      hint: undefined,
    });
  }

  // Prompt 3: Pilih Varian / Kombinasi
  const selectedSlug = await p.select({
    message: "Pilih varian / kombinasi template:",
    options: variantOptions,
  });

  if (p.isCancel(selectedSlug)) {
    p.cancel("Operasi dibatalkan.");
    return null;
  }
  return selectedSlug as string;
}

export async function pickFolder(
  defaultDir: string,
  options?: { allowBack?: boolean }
): Promise<string | null> {
  // Jika allowBack enabled, gunakan select dengan opsi custom/kembali
  if (options?.allowBack) {
    const choice = await p.select({
      message: "Nama folder project tujuan:",
      options: [
        {
          value: BACK_SIGNAL,
          label: "← Kembali ke pilihan varian",
          hint: undefined,
        },
        {
          value: defaultDir,
          label: `Gunakan: ${defaultDir}`,
          hint: "Pakai nama folder default",
        },
        {
          value: "__CUSTOM__",
          label: "Masukkan nama folder custom",
          hint: "Ketik nama folder sendiri",
        },
      ],
    });

    if (p.isCancel(choice)) {
      p.cancel("Operasi dibatalkan.");
      return null;
    }

    if (choice === BACK_SIGNAL) {
      return BACK_SIGNAL;
    }

    if (choice === "__CUSTOM__") {
      const customFolder = await p.text({
        message: "Masukkan nama folder project tujuan:",
        placeholder: defaultDir,
        defaultValue: defaultDir,
        validate: (val) => {
          if (!val || val.trim().length === 0) {
            return "Nama folder tidak boleh kosong.";
          }
          if (/[<>:"/\\|?*]/.test(val)) {
            return "Nama folder mengandung karakter yang tidak valid.";
          }
        },
      });

      if (p.isCancel(customFolder)) {
        p.cancel("Operasi dibatalkan.");
        return null;
      }
      return (customFolder as string).trim();
    }

    return choice as string;
  }

  // Behavior lama: langsung text input tanpa back
  const targetFolder = await p.text({
    message: "Masukkan nama folder project tujuan:",
    placeholder: defaultDir,
    defaultValue: defaultDir,
    validate: (val) => {
      if (!val || val.trim().length === 0) {
        return "Nama folder tidak boleh kosong.";
      }
      if (/[<>:"/\\|?*]/.test(val)) {
        return "Nama folder mengandung karakter yang tidak valid.";
      }
    },
  });

  if (p.isCancel(targetFolder)) {
    p.cancel("Operasi dibatalkan.");
    return null;
  }
  return (targetFolder as string).trim();
}

export async function runInteractivePrompt(
  templates: Template[]
): Promise<InteractivePromptResult | null> {
  // State untuk tracking pilihan user
  type Step = "kategori" | "framework" | "variant" | "folder";
  let currentStep: Step = "kategori";
  
  let selectedKategori: string | null = null;
  let selectedFramework: string | null = null;
  let selectedSlug: string | null = null;
  let selectedFolder: string | null = null;

  // Loop utama untuk navigasi dengan back support
  while (true) {
    switch (currentStep) {
      case "kategori": {
        const kategori = await pickKategori(templates, { allowBack: false });
        if (!kategori) return null; // User cancel (Ctrl+C)
        
        selectedKategori = kategori;
        currentStep = "framework";
        break;
      }

      case "framework": {
        // Filter templates based on category
        const templatesForCategory = templates.filter(
          (t) => t.kategori === selectedKategori
        );

        const framework = await pickFramework(templatesForCategory, { allowBack: true });
        if (!framework) return null; // User cancel
        
        if (framework === BACK_SIGNAL) {
          currentStep = "kategori";
          break;
        }

        selectedFramework = framework;
        currentStep = "variant";
        break;
      }

      case "variant": {
        // Filter templates based on category & framework
        const availableVariants = templates.filter(
          (t) => t.kategori === selectedKategori && t.framework === selectedFramework
        );

        const slug = await pickVariant(availableVariants, { allowBack: true });
        if (!slug) return null; // User cancel
        
        if (slug === BACK_SIGNAL) {
          currentStep = "framework";
          break;
        }

        selectedSlug = slug;
        currentStep = "folder";
        break;
      }

      case "folder": {
        const defaultDir = (selectedSlug?.toString().split("-")[0] || "my") + "-app";
        const folder = await pickFolder(defaultDir, { allowBack: true });
        if (!folder) return null; // User cancel
        
        if (folder === BACK_SIGNAL) {
          currentStep = "variant";
          break;
        }

        selectedFolder = folder;
        
        // Semua step selesai, return hasil
        return {
          slug: selectedSlug as string,
          targetFolder: selectedFolder,
        };
      }
    }
  }
}

export interface BuilderBase {
  slug: string;
  nama: string;
}

/** Pilih base untuk mode Builder (template builder_hidden disembunyikan). */
export async function runBuilderBaseSelect(
  bases: Template[]
): Promise<BuilderBase | null> {
  const options = bases.map((b) => ({
    value: b.slug,
    label: b.nama,
    hint: b.deskripsi || undefined,
  }));
  const baseSlug = await p.select({
    message: "Pilih template base (polosan lebih lega dikombinasikan):",
    options,
  });
  if (p.isCancel(baseSlug)) {
    p.cancel("Operasi dibatalkan.");
    return null;
  }
  const base = bases.find((b) => b.slug === baseSlug);
  if (!base) return null;
  return { slug: base.slug, nama: base.nama };
}

export interface BuilderRacikanInput {
  baseName: string;
  framework: string;
  /** kode yang SUDAH baked di base: { kode, kategori } */
  baked: Array<{ kode: string; kategori: string }>;
  /** kategori yang disembunyikan pembuat base. */
  hiddenKategoris: string[];
  index: IntegrasiRow[];
}

/**
 * Centang integrasi ala web Builder: radio per kategori inti (maks 1),
 * multiselect untuk kategori other. Opsi tak-kompatibel disembunyikan
 * (alasan ditampilkan di ringkasan); validasi final tetap di engine.
 */
export async function runBuilderIntegrationSelect(
  input: BuilderRacikanInput
): Promise<string[] | null> {
  const fw = input.framework.trim().toLowerCase();
  const bakedKodes = new Set(input.baked.map((b) => b.kode.toLowerCase()));
  const hiddenKats = new Set(input.hiddenKategoris.map((k) => k.toLowerCase()));

  if (input.baked.length > 0) {
    p.note(
      `Bawaan base "${input.baseName}":\n` +
        input.baked.map((b) => `  • ${b.kode}`).join("\n"),
      "Sudah termasuk (terkunci)"
    );
  }

  const picked: string[] = [];
  const skipped: string[] = [];
  const byKategori = new Map<string, IntegrasiRow[]>();
  for (const row of input.index) {
    const kat = (row.kategori_integrasi ?? "other").toLowerCase() || "other";
    if (!byKategori.has(kat)) byKategori.set(kat, []);
    byKategori.get(kat)?.push(row);
  }

  const compatible = (row: IntegrasiRow): string | null => {
    if (!row.repo_url || !row.repo_url.trim()) return "modul belum tersedia";
    const compat = (row.framework_compat ?? []).map((f) => f.toLowerCase());
    if (compat.length > 0 && fw !== "" && !compat.includes(fw)) {
      return `tidak mendukung ${fw || "framework ini"}`;
    }
    if (bakedKodes.has(row.kode.toLowerCase())) return "sudah bawaan base";
    const kat = (row.kategori_integrasi ?? "other").toLowerCase() || "other";
    if (hiddenKats.has(kat)) return "disembunyikan pembuat base";
    return null;
  };

  const orderedKats = [
    ...KATEGORI_ORDER.filter((k) => byKategori.has(k)),
    ...[...byKategori.keys()].filter((k) => !KATEGORI_ORDER.includes(k)),
  ];

  for (const kat of orderedKats) {
    const rows = byKategori.get(kat) ?? [];
    const usable = rows.filter((r) => !compatible(r));
    for (const r of rows) {
      if (compatible(r)) skipped.push(`${r.kode} (${compatible(r) as string})`);
    }
    if (usable.length === 0) continue;
    if (SINGLE_SELECT.has(kat)) {
      const choice = await p.select({
        message: `Pilih ${kat} (maks 1, boleh lewati):`,
        options: [
          { value: "", label: "Lewati", hint: "Tidak tambah dari kategori ini" },
          ...usable.map((r) => ({
            value: r.kode,
            label: r.nama_tampilan,
            hint: r.kode,
          })),
        ],
      });
      if (p.isCancel(choice)) {
        p.cancel("Operasi dibatalkan.");
        return null;
      }
      if (choice) picked.push(choice as string);
    } else {
      const choices = await p.multiselect({
        message: `Centang ${kat} (boleh banyak, boleh kosong):`,
        options: usable.map((r) => ({
          value: r.kode,
          label: r.nama_tampilan,
          hint: r.kode,
        })),
        required: false,
      });
      if (p.isCancel(choices)) {
        p.cancel("Operasi dibatalkan.");
        return null;
      }
      picked.push(...((choices as string[]) ?? []));
    }
  }

  if (skipped.length > 0) {
    p.note(skipped.map((s) => `  • ${s}`).join("\n"), "Dilewati otomatis");
  }
  return picked;
}
