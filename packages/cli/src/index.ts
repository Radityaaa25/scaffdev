#!/usr/bin/env node

import path from "path";
import fs from "fs";
import * as p from "@clack/prompts";
import { fetchTemplatesFromApi, fetchTemplateDetailFromApi } from "./lib/api-client";
import { checkPrerequisites } from "./lib/prerequisite-check";
import { cloneRepository } from "./lib/git";
import { generateEnvExample, generateSetupDoc } from "./lib/env-generator";
import { runInteractivePrompt } from "./lib/prompts";
import { TemplateDetailResponse } from "./types";

async function main() {
  const args: string[] = process.argv.slice(2);

  // Help & Version flags
  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
Scaffdev CLI — Modern Full-Stack Starter Kit Generator

Penggunaan:
  npx scaffdev@latest                       Jalankan interactive terminal prompt
  npx scaffdev@latest --template=<slug>      Generate langsung dari slug template
  npx scaffdev@latest <folder> --template=<slug>

Opsi:
  -h, --help       Tampilkan bantuan ini
  -v, --version    Tampilkan versi CLI
    `);
    process.exit(0);
  }

  if (args.includes("--version") || args.includes("-v")) {
    console.log("scaffdev v0.1.0");
    process.exit(0);
  }

  // Visual Banner Intro
  p.intro("⚡ Scaffdev — Modern Full-Stack Starter Kit Generator");

  let slug: string | null = null;
  let targetFolder = "my-scaff-app";

  // Check flag --template=...
  const templateArg = args.find((a: string) => a.startsWith("--template="));
  const templateIdx = args.indexOf("--template");

  if (templateArg) {
    slug = templateArg.split("=")[1] || null;
  } else if (templateIdx !== -1 && args[templateIdx + 1]) {
    slug = args[templateIdx + 1] || null;
  }

  // Check if target folder passed as positional argument
  const positionalArg = args.find((a: string) => !a.startsWith("-") && a !== slug);
  if (positionalArg) {
    targetFolder = positionalArg;
  }

  if (!slug) {
    // Mode Interactive Prompt (tanpa flag --template)
    const spinner = p.spinner();
    spinner.start("Mengambil daftar template aktif dari API...");

    const templates = await fetchTemplatesFromApi();
    spinner.stop(`Berhasil memuat ${templates.length} template aktif.`);

    const result = await runInteractivePrompt(templates);
    if (!result) {
      process.exit(0);
      return;
    }

    slug = result.slug;
    targetFolder = result.targetFolder;
  } else {
    // Mode langsung dengan slug
    p.log.info(`Menggunakan template slug: ${slug}`);
  }

  // Resolve target directory
  const targetDir = path.resolve(process.cwd(), targetFolder);

  // Check if directory already exists and not empty
  if (fs.existsSync(targetDir) && fs.readdirSync(targetDir).length > 0) {
    const shouldOverwrite = await p.confirm({
      message: `Folder "${targetFolder}" sudah ada dan tidak kosong. Lanjutkan dan timpa file di dalamnya?`,
      initialValue: false,
    });

    if (p.isCancel(shouldOverwrite) || !shouldOverwrite) {
      p.cancel("Operasi dibatalkan oleh pengguna.");
      process.exit(0);
      return;
    }
  }

  // Fetch full template details (termasuk integrasi lengkap)
  const detailSpinner = p.spinner();
  detailSpinner.start("Mengambil detail konfigurasi template...");

  let templateDetail: TemplateDetailResponse;
  try {
    templateDetail = await fetchTemplateDetailFromApi(slug);
    detailSpinner.stop("Detail template berhasil didapatkan.");
  } catch (err: unknown) {
    const error = err as Error;
    detailSpinner.stop("Gagal mengambil detail template.");
    p.cancel(error.message || "Terjadi kesalahan saat menghubungi API Scaff.");
    process.exit(1);
    return;
  }

  // Check Prasyarat (Node.js / Composer)
  const prereq = await checkPrerequisites(templateDetail.framework);
  if (!prereq.ok) {
    p.cancel(`Pengecekan prasyarat gagal:\n${prereq.error}`);
    process.exit(1);
    return;
  }

  // Summary Note
  const integrationsList =
    templateDetail.integrasi.length > 0
      ? templateDetail.integrasi.map((i) => i.nama_tampilan).join(", ")
      : "Basic (Tanpa Integrasi)";

  p.note(
    `Template   : ${templateDetail.nama || templateDetail.slug}\n` +
    `Framework  : ${templateDetail.framework}\n` +
    `Integrasi  : ${integrationsList}\n` +
    `Direktori  : ${targetFolder}`,
    "Ringkasan Pilihan Project"
  );

  // Clone repository
  const cloneSpinner = p.spinner();
  cloneSpinner.start(`Mengkloning template dari GitHub (${templateDetail.repo_url})...`);

  try {
    await cloneRepository(templateDetail.repo_url, targetDir);
    cloneSpinner.stop("Repository template berhasil dikloning.");
  } catch (err: unknown) {
    const error = err as Error;
    cloneSpinner.stop("Gagal melakukan git clone.");
    p.cancel(`Terjadi kesalahan saat meng-clone template:\n${error.message}`);
    process.exit(1);
    return;
  }

  // Generate .env.example & SETUP.md
  const genSpinner = p.spinner();
  genSpinner.start("Men-generate .env.example dan SETUP.md...");

  try {
    generateEnvExample(targetDir, templateDetail.integrasi);
    generateSetupDoc(
      targetDir,
      templateDetail.integrasi,
      templateDetail.nama || templateDetail.slug
    );
    genSpinner.stop("Dokumentasi setup & environment variables siap.");
  } catch (err: unknown) {
    const error = err as Error;
    genSpinner.stop("Gagal men-generate file konfigurasi.");
    p.log.warn(`Peringatan: ${error.message}`);
  }

  // Outro Success Box
  p.outro(
    `🎉 Project "${targetFolder}" berhasil dibuat!\n\n` +
    "Langkah selanjutnya:\n" +
    `  1. cd ${targetFolder}\n` +
    "  2. npm install\n" +
    "  3. Buka SETUP.md untuk panduan pengisian .env.local\n" +
    "  4. npm run dev\n\n" +
    "Dokumentasi lengkap: https://scaff.dev/docs"
  );
}

main().catch((err) => {
  p.cancel(`Fatal Error: ${err.message}`);
  process.exit(1);
});