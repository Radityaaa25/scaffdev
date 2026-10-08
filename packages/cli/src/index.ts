#!/usr/bin/env node

import path from "path";
import fs from "fs";
import os from "os";
import * as p from "@clack/prompts";
import { fetchTemplatesFromApi, fetchTemplateDetailFromApi } from "./lib/api-client";
import { checkPrerequisites } from "./lib/prerequisite-check";
import { cloneRepository } from "./lib/git";
import { generateEnvExample, generateSetupDoc } from "./lib/env-generator";
import { runInteractivePrompt, runModeSelect, pickKategori, pickFramework, pickFolder, runBuilderBaseSelect, runBuilderIntegrationSelect } from "./lib/prompts";
import { fetchIntegrasiIndex } from "./lib/modules";
import { injectModule, cleanupModuleDir, mergeNpmDependencies, mergeComposerDependencies } from "./lib/injector";
import { resolveInstallPlan, runInstallPlan, type InstallOutcome } from "./lib/install";
import { validateModuleTarget } from "./lib/validate";
import { startProgress, shortRepo } from "./lib/ui-progress";
import {
  runSecurityGate,
  auditLocalGitDir,
  renderAuditReport,
  highestSeverity,
} from "./lib/security-audit";
import { TemplateDetailResponse, IntegrasiDetail } from "./types";

/**
 * Versi dibaca dari package.json saat runtime (bukan hardcode) agar
 * --version tidak pernah basi lagi setelah bump versi. package.json selalu
 * ikut ter-publish (sejajar dist/), baik via npx temp-install maupun global.
 */
function cliVersion(): string {
  try {
    const pkgPath = path.join(__dirname, "..", "package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8")) as { version?: unknown };
    if (typeof pkg.version === "string" && pkg.version.trim()) return pkg.version.trim();
  } catch {
    /* fallback di bawah */
  }
  return "0.0.0-unknown";
}

async function main() {
  const args: string[] = process.argv.slice(2);

  // Help & Version flags
  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
Scaffdev CLI: Modern Full-Stack Starter Kit Generator

Penggunaan:
  npx scaffdev@latest                                     Jalankan interactive terminal prompt
  npx scaffdev@latest --template=<slug>                    Generate langsung dari slug template
  npx scaffdev@latest <folder> --template=<slug>
  npx scaffdev@latest <folder> --template=<slug> --with=<kode1,kode2>
                                                          Tambah modul integrasi (Builder)
  npx scaffdev add <kode>                                 Suntik 1 modul ke project yang sedang dibuka
  scaffdev validate-module <path-atau-repo>                Validasi manifest modul/template
  scaffdev validate-module <repo-url> --ref=<branch>     Validasi + audit branch tertentu

Opsi:
  --template=<slug>  Template yang dipakai (wajib pakai tanda =)
  --with=<k1,k2>     Modul integrasi tambahan (maks 1 per kategori inti)
  --install          Langsung install dependency tanpa bertanya
  --no-install       Lewati install dependency
  -h, --help         Tampilkan bantuan ini
  -v, --version      Tampilkan versi CLI

Mode interaktif menanyakan dulu: Siap pakai, Builder (racik base + integrasi),
atau Ambil integrasi (suntik ke project yang sedang dibuka).
Setiap clone didahului security audit (jawab No bila ingin lewati, butuh CLI 0.3.0+).
    `);
    process.exit(0);
  }

  if (args.includes("--version") || args.includes("-v")) {
    console.log(`scaffdev v${cliVersion()}`);
    process.exit(0);
  }

  // Subcommand validasi manifest (tidak butuh API/template)
  if (args[0] === "validate-module") {
    const target = args[1];
    if (!target) {
      console.error("Penggunaan: scaffdev validate-module <path-folder-atau-repo-url> [--ref=<branch>]");
      process.exit(1);
    }
    const refArg = args.find((a) => a.startsWith("--ref="));
    const refIdx = args.indexOf("--ref");
    const ref =
      refArg?.slice("--ref=".length) ||
      (refIdx !== -1 && args[refIdx + 1] ? args[refIdx + 1] : undefined);
    const result = await validateModuleTarget(target, ref ? { ref } : undefined);
    for (const line of result.report) console.log(line);
    process.exit(result.ok ? 0 : 1);
    return;
  }

  // Subcommand standalone: suntik 1 modul ke project yang sedang dibuka.
  if (args[0] === "add") {
    const kodeArg = args[1] && !args[1].startsWith("-") ? args[1] : undefined;
    const { runAddFlow } = await import("./lib/add-flow");
    const done = await runAddFlow({ projectDir: process.cwd(), kodeArg });
    process.exit(done.completed ? 0 : 1);
    return;
  }

  // Visual Banner Intro
  p.intro("⚡ Scaffdev: Modern Full-Stack Starter Kit Generator");

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

  // Flag --with=<kode1,kode2> (modul integrasi Builder, boleh koma/spasi)
  const withArg = args.find((a: string) => a.startsWith("--with="));
  const withIdx = args.indexOf("--with");
  const withRaw: string =
    withArg ? withArg.slice("--with=".length) :
    withIdx !== -1 && args[withIdx + 1] ? (args[withIdx + 1] as string) : "";
  let withCodes: string[] = [...new Set(
    withRaw.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)
  )];

  const forceInstall = args.includes("--install");
  const skipInstall = args.includes("--no-install");

  // Check if target folder passed as positional argument
  // (abaikan nilai milik flag: slug, isi --with, dan flag itu sendiri)
  const consumed = new Set<string>([slug ?? "", withRaw, "--template", "--with"]);
  const templateValue = templateIdx !== -1 ? args[templateIdx + 1] : undefined;
  if (templateValue) consumed.add(templateValue);
  const withValue = withIdx !== -1 ? args[withIdx + 1] : undefined;
  if (withValue) consumed.add(withValue);
  const positionalArg = args.find((a: string) => !a.startsWith("-") && !consumed.has(a));
  if (positionalArg) {
    targetFolder = positionalArg;
  }

  if (!slug) {
    // Pilih mode dulu: varian siap-pakai atau racik Builder sendiri.
    const mode = await runModeSelect();
    if (!mode) {
      process.exit(0);
      return;
    }
    if (mode === "ambil") {
      // Mode ambil: suntik modul ke project yang sedang dibuka (tanpa buat folder).
      const { runAddFlow } = await import("./lib/add-flow");
      const done = await runAddFlow({ projectDir: process.cwd() });
      process.exit(done.completed ? 0 : 1);
      return;
    }
    // Mode Interactive Prompt (tanpa flag --template)
    // Progress 1-baris via helper (animasi di terminal normal, statis di Git Bash/pipe).
    const listProgress = startProgress("Mengambil daftar template aktif...");
    const templates = await fetchTemplatesFromApi();
    listProgress.stop(`Berhasil memuat ${templates.length} template aktif.`);

    if (mode === "builder") {
      // Mode Builder: pilih base (hidden disembunyikan) + centang integrasi.
      // Validasi final tetap di engine downstream (sama seperti --with).
      const kategori = await pickKategori(templates);
      if (!kategori) {
        process.exit(0);
        return;
      }
      const templatesForCategory = templates.filter((t) => t.kategori === kategori);
      const framework = await pickFramework(templatesForCategory);
      if (!framework) {
        process.exit(0);
        return;
      }
      const bases = templatesForCategory.filter(
        (t) => t.framework === framework && t.builder_hidden !== true
      );
      if (bases.length === 0) {
        p.cancel("Tidak ada template base untuk kombinasi ini.");
        process.exit(0);
        return;
      }
      const base = await runBuilderBaseSelect(bases);
      if (!base) {
        process.exit(0);
        return;
      }
      let baseDetail;
      try {
        baseDetail = await fetchTemplateDetailFromApi(base.slug);
      } catch (err) {
        p.cancel(`Gagal mengambil detail base:\n${(err as Error).message}`);
        process.exit(1);
        return;
      }
      let builderIndex;
      try {
        builderIndex = await fetchIntegrasiIndex();
      } catch (err) {
        p.cancel(`Gagal mengambil katalog integrasi:\n${(err as Error).message}`);
        process.exit(1);
        return;
      }
      const baked = (baseDetail.integrasi ?? []).map((item) => ({
        kode: item.kode,
        kategori: (item as { kategori_integrasi?: string }).kategori_integrasi ?? "other",
      }));
      const picked = await runBuilderIntegrationSelect({
        baseName: baseDetail.nama || base.slug,
        framework: baseDetail.framework,
        baked,
        hiddenKategoris: baseDetail.builder_hidden_kategoris ?? [],
        index: builderIndex,
      });
      if (!picked) {
        process.exit(0);
        return;
      }
      const defaultDir = base.slug.split("-")[0] + "-app";
      const folder = await pickFolder(defaultDir);
      if (!folder) {
        process.exit(0);
        return;
      }
      slug = base.slug;
      targetFolder = folder;
      withCodes = [...new Set([...withCodes, ...picked])];
    } else {
      const result = await runInteractivePrompt(templates);
      if (!result) {
        process.exit(0);
        return;
      }

      slug = result.slug;
      targetFolder = result.targetFolder;
    }
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
  const detailProgress = startProgress("Mengambil detail konfigurasi template...");
  let templateDetail: TemplateDetailResponse;
  try {
    templateDetail = await fetchTemplateDetailFromApi(slug);
    detailProgress.stop("Detail template berhasil didapatkan.");
  } catch (err: unknown) {
    const error = err as Error;
    detailProgress.stop("Gagal mengambil detail template.");
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
    (withCodes.length > 0 ? `Modul (+)  : ${withCodes.join(", ")}\n` : "") +
    `Direktori  : ${targetFolder}`,
    "Ringkasan Pilihan Project"
  );

  // Security gate: audit remote SEBELUM clone (satu-satunya jalan ke clone).
  const baseGate = await runSecurityGate({
    repoUrl: templateDetail.repo_url,
    kindLabel: "template",
  });
  if (!baseGate.proceed) {
    process.exit(0);
    return;
  }

  // Clone repository. Teks progress memakai nama pendek repo (tanpa URL
  // panjang) agar 1 baris tetap rapi. URL penuh hanya muncul bila gagal.
  const cloneProgress = startProgress(`Mengkloning template "${templateDetail.nama || templateDetail.slug}"...`);

  try {
    await cloneRepository(templateDetail.repo_url, targetDir, true);
    cloneProgress.stop(`Template "${templateDetail.nama || templateDetail.slug}" terkloning.`);
  } catch (err: unknown) {
    const error = err as Error;
    cloneProgress.stop("Gagal melakukan git clone.");
    p.cancel(
      `Terjadi kesalahan saat meng-clone template (${shortRepo(templateDetail.repo_url)}):\n${error.message}`
    );
    process.exit(1);
    return;
  }

  // Post-clone audit lokal (.git/config + hooks). WAJIB sebelum install.
  // .git dihapus tepat setelah audit (perilaku lama: direktori bersih).
  const localFindings = auditLocalGitDir(targetDir);
  if (localFindings.length > 0) {
    for (
      const line of renderAuditReport({
        repo: `${shortRepo(templateDetail.repo_url)} (lokal)`,
        inspected: [".git/config", ".git/hooks"],
        notInspectable: [],
        findings: localFindings,
      })
    ) {
      console.log(line);
    }
    const top = highestSeverity(localFindings);
    const goLocal = await p.confirm({
      message:
        top === "HIGH" || top === "CRITICAL"
          ? "Temuan lokal berisiko tinggi. Tetap lanjutkan instalasi?"
          : "Lanjutkan instalasi?",
      initialValue: !(top === "HIGH" || top === "CRITICAL"),
    });
    try {
      fs.rmSync(path.join(targetDir, ".git"), { recursive: true, force: true });
    } catch {
      // Abaikan bila terkunci Windows.
    }
    if (p.isCancel(goLocal) || !goLocal) {
      p.cancel("Operasi dibatalkan setelah audit lokal.");
      process.exit(0);
      return;
    }
  } else {
    try {
      fs.rmSync(path.join(targetDir, ".git"), { recursive: true, force: true });
    } catch {
      // Abaikan bila terkunci Windows.
    }
  }

  // ---- Fase Builder: suntik modul --with (dilewati bila kosong) ----
  const extraIntegrasi: IntegrasiDetail[] = [];
  const removalGuides: { nama: string; body: string }[] = [];
  const addedNpmPackages: string[] = [];

  if (withCodes.length > 0) {
    const fw = templateDetail.framework.trim().toLowerCase();
    const bakedKodes = new Set(templateDetail.integrasi.map((i) => i.kode?.toLowerCase()).filter(Boolean));
    const bakedKats = new Map<string, string>();
    for (const item of templateDetail.integrasi) {
      const k = (item as { kategori_integrasi?: string }).kategori_integrasi;
      if (item.kode && k) bakedKats.set(k.toLowerCase(), item.kode.toLowerCase());
    }

    let index;
    try {
      index = await fetchIntegrasiIndex();
    } catch (err) {
      p.cancel(`Gagal mengambil katalog integrasi:\n${(err as Error).message}`);
      process.exit(1);
      return;
    }
    const byKode = new Map(index.map((r) => [r.kode.toLowerCase(), r]));
    const workRoot = fs.mkdtempSync(path.join(os.tmpdir(), "scaffdev-"));

    for (const kode of withCodes) {
      const row = byKode.get(kode);
      if (!row) {
        p.cancel(`Integrasi "${kode}" tidak dikenal. Jalankan tanpa --with untuk melihat varian template yang tersedia.`);
        process.exit(1);
        return;
      }
      if (bakedKodes.has(kode)) {
        p.cancel(
          `Integrasi "${row.nama_tampilan}" SUDAH termasuk di template ini.\nTidak perlu --with. Hapus "${kode}" dari flag dan ulangi.`
        );
        process.exit(1);
        return;
      }
      if (!row.repo_url || !row.repo_url.trim()) {
        p.cancel(
          `Integrasi "${row.nama_tampilan}" belum punya repo modul.\nPilih integrasi lain atau pakai template yang sudah menyertakannya.`
        );
        process.exit(1);
        return;
      }
      const compat = (row.framework_compat ?? []).map((f) => f.toLowerCase());
      if (compat.length > 0 && !compat.includes(fw)) {
        p.cancel(
          `Modul "${row.nama_tampilan}" tidak mendukung framework "${fw}".\nDidukung: ${compat.join(", ")}.`
        );
        process.exit(1);
        return;
      }
      const kat = (row.kategori_integrasi ?? "").toLowerCase();
      const hiddenKats = new Set(
        (templateDetail.builder_hidden_kategoris ?? []).map((k) => k.toLowerCase())
      );
      if (kat && hiddenKats.has(kat)) {
        const proceedHidden = await p.confirm({
          message:
            `Kategori "${kat}" disembunyikan pembuat template ini untuk Builder\n` +
            `(dianggap tidak relevan, mis. payment untuk landing page).\n` +
            `Tetap pasang "${row.nama_tampilan}"?`,
          initialValue: false,
        });
        if (p.isCancel(proceedHidden) || !proceedHidden) {
          p.cancel("Operasi dibatalkan oleh pengguna.");
          process.exit(0);
          return;
        }
      }
      const incumbent = kat ? bakedKats.get(kat) : undefined;
      if (incumbent) {
        const proceed = await p.confirm({
          message:
            `Template ini SUDAH memakai integrasi se-kategori ("${incumbent}") untuk "${kat}".\n` +
            `Tambah "${kode}" juga? Kalau ya hasilnya double karena SETUP.md akan berisi panduan mencopot salah satunya.`,
          initialValue: false,
        });
        if (p.isCancel(proceed) || !proceed) {
          p.cancel("Operasi dibatalkan oleh pengguna.");
          process.exit(0);
          return;
        }
      }

      const modGate = await runSecurityGate({
        repoUrl: row.repo_url.trim(),
        kindLabel: `modul integrasi "${row.nama_tampilan}"`,
      });
      if (!modGate.proceed) {
        process.exit(0);
        return;
      }

      const modProgress = startProgress(`Menyuntik modul ${row.nama_tampilan}...`);
      try {
        const injected = await injectModule(targetDir, row.repo_url.trim(), fw, workRoot);
        modProgress.stop(
          `Modul ${row.nama_tampilan} v${injected.version} tersuntik (${injected.installedFiles.length} file ${fw}).`
        );

        if (injected.manifest.dependencies?.npm && fw !== "laravel") {
          try {
            const added = mergeNpmDependencies(targetDir, injected.manifest.dependencies.npm);
            addedNpmPackages.push(...added);
          } catch (err) {
            modProgress.stop("Gagal merge dependency.");
            p.cancel((err as Error).message);
            process.exit(1);
            return;
          }
        }

        if (injected.manifest.dependencies?.composer && fw === "laravel") {
          try {
            const added = mergeComposerDependencies(targetDir, injected.manifest.dependencies.composer);
            addedNpmPackages.push(...added);
          } catch (err) {
            modProgress.stop("Gagal merge dependency.");
            p.cancel((err as Error).message);
            process.exit(1);
            return;
          }
        }

        extraIntegrasi.push({
          kode: row.kode,
          nama_tampilan: row.nama_tampilan,
          daftar_env_var: row.daftar_env_var ?? [],
          instruksi_setup: row.instruksi_setup ?? null,
        });

        if (injected.manifest.removal) {
          try {
            const guideAbs = path.join(injected.dir, injected.manifest.removal.stepsFile);
            if (fs.existsSync(guideAbs)) {
              removalGuides.push({ nama: row.nama_tampilan, body: fs.readFileSync(guideAbs, "utf-8") });
            }
          } catch {
            /* panduan opsional, lewati bila tak terbaca */
          }
        }
        cleanupModuleDir(injected.dir);
      } catch (err) {
        modProgress.stop("Gagal menyuntik modul.");
        p.cancel((err as Error).message);
        process.exit(1);
        return;
      }
    }

    try {
      fs.rmSync(workRoot, { recursive: true, force: true });
    } catch {
      /* abaikan */
    }
  }

  const allIntegrasi: IntegrasiDetail[] = [...templateDetail.integrasi, ...extraIntegrasi];

  // ---- Install dependency (prompt default Ya) ----
  let installPlan;
  try {
    installPlan = resolveInstallPlan(targetDir, templateDetail.framework);
  } catch (err) {
    p.cancel((err as Error).message);
    process.exit(1);
    return;
  }

  let installOutcome: InstallOutcome | null = null;
  if (!skipInstall) {
    let doInstall = forceInstall;
    if (!forceInstall) {
      const summary = installPlan.steps.map((s) => `  • ${s.label}`).join("\n");
      const answer = await p.confirm({
        message: `Install dependency sekarang?\n${summary}`,
        initialValue: true,
      });
      if (p.isCancel(answer)) {
        p.cancel("Operasi dibatalkan oleh pengguna.");
        process.exit(0);
        return;
      }
      doInstall = answer;
    }
    if (doInstall) {
      p.log.info("Menjalankan install (output live di bawah)...");
      installOutcome = await runInstallPlan(targetDir, installPlan.steps);
      for (const s of installOutcome.skipped) {
        p.log.warn(`Dilewati [${s.dir}]: ${s.reason}`);
      }
      if (installOutcome.failed) {
        p.log.warn(
          `Install gagal di "${installOutcome.failed.label}". Project tetap valid, lanjutkan manual:\n  ${installOutcome.failed.error}`
        );
      } else {
        p.log.success("Install dependency selesai.");
      }
    } else {
      p.log.info("Install dilewati. Ikuti langkah manual di bawah.");
    }
  } else {
    p.log.info("Install dilewati (--no-install).");
  }

  // Generate .env.example & SETUP.md
  const genProgress = startProgress("Men-generate .env.example dan SETUP.md...");

  try {
    generateEnvExample(targetDir, allIntegrasi, templateDetail.framework);
    generateSetupDoc(
      targetDir,
      allIntegrasi,
      templateDetail.nama || templateDetail.slug,
      templateDetail.framework,
      { removalGuides }
    );
    genProgress.stop("Dokumentasi setup & environment variables siap.");
  } catch (err: unknown) {
    const error = err as Error;
    genProgress.stop("Gagal men-generate file konfigurasi.");
    p.log.warn(`Peringatan: ${error.message}`);
  }

  // Langkah lanjutan adaptif: install yang sudah jalan tidak ditampilkan lagi.
  const isLaravel = templateDetail.framework.toLowerCase() === "laravel";
  const installedOk =
    installOutcome !== null && installOutcome.failed === null && installOutcome.ran.length > 0;
  const envFile = isLaravel ? ".env" : ".env.local";
  const stepLines = [`  1. cd ${targetFolder}`];
  if (!installedOk) {
    if (isLaravel) {
      stepLines.push("  2. composer install");
    } else if (installPlan.steps.length === 1 && installPlan.steps[0]?.dir === ".") {
      stepLines.push("  2. npm install");
    } else {
      installPlan.steps.forEach((s, i) => stepLines.push(`  2.${i + 1} ${s.label} (di ${s.dir})`));
    }
  } else {
    stepLines.push("  2. Dependency sudah terinstall otomatis ✓");
  }
  if (isLaravel) {
    stepLines.push(`  3. cp .env.example .env && php artisan key:generate`);
    stepLines.push(`  4. Buka SETUP.md untuk panduan pengisian .env`);
    stepLines.push(`  5. php artisan serve`);
  } else {
    stepLines.push(`  3. Buka SETUP.md untuk panduan pengisian ${envFile}`);
    stepLines.push(`  4. npm run dev`);
  }
  if (addedNpmPackages.length > 0) {
    stepLines.push(`\n  (Modul menambah: ${addedNpmPackages.join(", ")})`);
  }
  const nextSteps = stepLines.join("\n");

  // Outro Success Box
  p.outro(
    `🎉 Project "${targetFolder}" berhasil dibuat!\n\n` +
    "Langkah selanjutnya:\n" +
    `${nextSteps}\n\n` +
    "Dokumentasi lengkap: https://scaffdev.vercel.app/docs"
  );
}

main().catch((err) => {
  p.cancel(`Fatal Error: ${err.message}`);
  process.exit(1);
});