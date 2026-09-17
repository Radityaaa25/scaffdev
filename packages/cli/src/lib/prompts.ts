import * as p from "@clack/prompts";
import { Template } from "../types";

export interface InteractivePromptResult {
  slug: string;
  targetFolder: string;
}

export async function runInteractivePrompt(
  templates: Template[]
): Promise<InteractivePromptResult | null> {
  // Extract unique categories available from real-time templates
  const availableCategories = Array.from(
    new Set(templates.map((t) => t.kategori))
  );

  const categoryLabels: Record<string, { label: string; hint: string }> = {
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

  const categoryOptions = availableCategories.map((cat) => ({
    value: cat,
    label: categoryLabels[cat]?.label || cat,
    hint: categoryLabels[cat]?.hint,
  }));

  // Prompt 1: Pilih Kategori
  const kategori = await p.select({
    message: "Pilih jenis project yang ingin Anda bangun:",
    options: categoryOptions,
  });

  if (p.isCancel(kategori)) {
    p.cancel("Operasi dibatalkan.");
    return null;
  }

  // Filter templates based on category
  const templatesForCategory = templates.filter((t) => t.kategori === kategori);

  // Extract frameworks available for that category
  const availableFrameworks = Array.from(
    new Set(templatesForCategory.map((t) => t.framework))
  );

  const frameworkOptions = [
    ...availableFrameworks.map((fw) => ({
      value: fw,
      label: fw === "nextjs" ? "Next.js (App Router)" : fw,
      hint: "Rekomendasi resmi Scaff",
    })),
  ];

  // If Laravel is not yet in templates, show disabled/hint option for clarity
  if (!availableFrameworks.includes("laravel")) {
    frameworkOptions.push({
      value: "laravel-disabled",
      label: "Laravel (PHP)",
      hint: "Segera Hadir di roadmap berikutnya",
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
    p.cancel("Dukungan Laravel sedang dalam tahap roadmap aktif. Silakan pilih Next.js untuk saat ini.");
    return null;
  }

  // Filter templates based on category & framework
  const availableVariants = templatesForCategory.filter(
    (t) => t.framework === framework
  );

  const variantOptions = availableVariants.map((v) => {
    const integrationsText =
      v.opsi_integrasi.length > 0
        ? `[Integrasi: ${v.opsi_integrasi.join(" + ")}]`
        : "[Basic — Tanpa Integrasi Tambahan]";

    return {
      value: v.slug,
      label: `${v.nama} ${integrationsText}`,
      hint: v.deskripsi || undefined,
    };
  });

  // Prompt 3: Pilih Varian / Kombinasi
  const selectedSlug = await p.select({
    message: "Pilih varian / kombinasi template:",
    options: variantOptions,
  });

  if (p.isCancel(selectedSlug)) {
    p.cancel("Operasi dibatalkan.");
    return null;
  }

  // Prompt 4: Nama Folder Project
  const defaultDir = selectedSlug.toString().split("-")[0] + "-app";
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

  return {
    slug: selectedSlug as string,
    targetFolder: (targetFolder as string).trim(),
  };
}
