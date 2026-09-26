import fs from "fs";
import path from "path";
import { IntegrasiDetail } from "../types";

export function generateEnvExample(
  targetDir: string,
  integrasi: IntegrasiDetail[],
  framework: string
): void {
  const isLaravel = framework.toLowerCase() === "laravel";
  const envFileName = isLaravel ? ".env" : ".env.local";
  const lines: string[] = [
    "# ============================================================",
    "# Environment Variables — Di-generate otomatis oleh Scaffdev CLI",
    `# Salin file ini menjadi ${envFileName} lalu isi kredensial Anda:`,
    isLaravel
      ? "#   cp .env.example .env"
      : "#   cp .env.example .env.local",
    "# ============================================================",
    "",
  ];

  if (integrasi.length === 0) {
    lines.push("# Template Basic ini tidak memerlukan environment variable tambahan.");
  } else {
    for (const item of integrasi) {
      lines.push(`# --- ${item.nama_tampilan} ---`);
      for (const env of item.daftar_env_var) {
        lines.push(`# ${env.deskripsi}`);
        lines.push(`${env.key}=`);
      }
      lines.push("");
    }
  }

  const filePath = path.join(targetDir, ".env.example");
  fs.writeFileSync(filePath, lines.join("\n"), "utf-8");
}

export interface SetupExtra {
  /** Panduan copot per integrasi (dari manifest modul / template). */
  removalGuides?: { nama: string; body: string }[];
}

export function generateSetupDoc(
  targetDir: string,
  integrasi: IntegrasiDetail[],
  templateName: string,
  framework: string,
  extra?: SetupExtra
): void {
  const isLaravel = framework.toLowerCase() === "laravel";
  const quickSteps = isLaravel
    ? [
        "```bash",
        "# Masuk ke direktori project",
        "cd .",
        "",
        "# Install seluruh dependensi PHP",
        "composer install",
        "",
        "# Buat file .env dari contoh",
        "cp .env.example .env",
        "",
        "# Generate application key Laravel",
        "php artisan key:generate",
        "",
        "# Jalankan server development lokal",
        "php artisan serve",
        "```",
      ]
    : [
        "```bash",
        "# Masuk ke direktori project",
        "cd .",
        "",
        "# Install seluruh dependensi",
        "npm install",
        "",
        "# Buat file .env.local",
        "cp .env.example .env.local",
        "",
        "# Jalankan server development lokal",
        "npm run dev",
        "```",
      ];
  const lines: string[] = [
    `# Panduan Setup Project — ${templateName}`,
    "",
    "Selamat! Project Anda berhasil di-generate menggunakan **Scaffdev**.",
    "",
    "Ikuti langkah-langkah di bawah ini untuk mengonfigurasi environment variable dan menjalankan aplikasi:",
    "",
    "## 1. Langkah Cepat",
    ...quickSteps,
    "",
  ];

  if (integrasi.length > 0) {
    lines.push("## 2. Konfigurasi Layanan & API Keys");
    lines.push("");

    for (const item of integrasi) {
      if (item.instruksi_setup) {
        lines.push(item.instruksi_setup);
        lines.push("");
      } else {
        lines.push(`### Setup ${item.nama_tampilan}`);
        lines.push(
          `Daftarkan akun di layanan ${item.nama_tampilan} dan masukkan API key yang dibutuhkan ke file \`.env.local\`.`
        );
        lines.push("");
      }
    }
  }

  lines.push("---");
  lines.push("Dokumentasi resmi Scaff: [https://scaffdev.vercel.app/docs](https://scaffdev.vercel.app/docs)");
  lines.push("");

  const guides = extra?.removalGuides?.filter((g) => g.body.trim()) ?? [];
  if (guides.length > 0) {
    lines.push("## Mencopot Integrasi (bila berubah pikiran)");
    lines.push("");
    lines.push(
      "Bagian ini dibuat otomatis karena project ini memuat lebih dari satu integrasi se-kategori. " +
        "Ikuti panduan salah satu layanan di bawah untuk mencopot yang tidak dipakai."
    );
    lines.push("");
    for (const g of guides) {
      lines.push(`### Cara mencopot ${g.nama}`);
      lines.push("");
      lines.push(g.body.trim());
      lines.push("");
    }
  }

  const filePath = path.join(targetDir, "SETUP.md");
  fs.writeFileSync(filePath, lines.join("\n"), "utf-8");
}
