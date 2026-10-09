/**
 * Standalone integration: `scaffdev add <kode>`: suntik SATU modul integrasi
 * ke project yang sedang dibuka (tanpa membuat folder baru).
 *
 * Memakai engine yang SAMA dengan Builder (injectModule + manifest +
 * security-audit): tidak ada implementasi ganda. Prinsip: DISCOVER → AUDIT
 * → VALIDATE → PREVIEW → CONFIRM → INSTALL → VERIFY.
 */
import fs from "fs";
import os from "os";
import path from "path";
import * as p from "@clack/prompts";
import { execa } from "execa";
import { fetchIntegrasiIndex, type IntegrasiRow } from "./modules";
import {
  injectModule,
  cleanupModuleDir,
  mergeNpmDependencies,
  mergeComposerDependencies,
} from "./injector";
import { parseIntegrationManifest, parseTemplateManifest, filesForFramework, type IntegrationManifest } from "./manifest";
import {
  hasTemplateManifest,
  detectExistingTraces,
  heuristicFromManifest,
  newDirsForPreview,
  sanitizeKode,
  buildAdoptManifest,
  writeAdoptedTemplate,
} from "./foreign-template";
import { runSecurityGate } from "./security-audit";
import { cloneRepository } from "./git";

export interface AddResult {
  completed: boolean;
}

function fwLabel(fw: string): string {
  const f = fw.trim().toLowerCase();
  if (f === "nextjs") return "Next.js";
  if (f === "laravel") return "Laravel";
  return fw || "(tidak terdeteksi)";
}

type DetectedFw = "nextjs" | "laravel" | "both" | "none";

function detectProjectFramework(projectDir: string): DetectedFw {
  const hasPkg = fs.existsSync(path.join(projectDir, "package.json"));
  const hasComposer = fs.existsSync(path.join(projectDir, "composer.json"));
  if (hasPkg && hasComposer) return "both";
  if (hasPkg) return "nextjs";
  if (hasComposer) return "laravel";
  return "none";
}

/** Kode yang sudah baked bila project ini punya scaff.template.json. */
function bakedKodes(projectDir: string): Set<string> {
  try {
    const tplPath = path.join(projectDir, "scaff.template.json");
    if (!fs.existsSync(tplPath)) return new Set();
    const parsed = parseTemplateManifest(JSON.parse(fs.readFileSync(tplPath, "utf8")));
    if (!parsed.ok) return new Set();
    return new Set(Object.keys(parsed.manifest.provides).map((k) => k.toLowerCase()));
  } catch {
    return new Set();
  }
}

async function pickKodeInteractively(index: IntegrasiRow[]): Promise<string | null> {
  const choice = await p.select({
    message: "Pilih integrasi yang mau dipasang:",
    options: index.map((r) => ({
      value: r.kode,
      label: r.nama_tampilan,
      hint: `${r.kode}${r.kategori_integrasi ? ` · ${r.kategori_integrasi}` : ""}`,
    })),
  });
  if (p.isCancel(choice)) {
    p.cancel("Operasi dibatalkan.");
    return null;
  }
  return choice as string;
}

async function pickFramework(detected: DetectedFw): Promise<string | null> {
  if (detected === "nextjs" || detected === "laravel") return detected;
  const choice = await p.select({
    message:
      detected === "both"
        ? "Project ini punya package.json DAN composer.json. Pasang untuk framework apa?"
        : "Framework project tidak terdeteksi (tanpa package.json/composer.json). Pilih manual:",
    options: [
      { value: "nextjs", label: "Next.js", hint: "App Router" },
      { value: "laravel", label: "Laravel", hint: "PHP" },
      { value: "", label: "Batal", hint: "Keluar tanpa mengubah apa pun" },
    ],
  });
  if (p.isCancel(choice) || !choice) {
    p.cancel("Operasi dibatalkan.");
    return null;
  }
  return choice as string;
}

/** Tambahkan key yang belum ada ke .env.example (JANGAN sentuh .env). */
function ensureEnvExample(
  projectDir: string,
  keys: string[]
): { added: string[]; created: boolean } {
  const envPath = path.join(projectDir, ".env.example");
  let existing = "";
  let created = false;
  if (fs.existsSync(envPath)) {
    existing = fs.readFileSync(envPath, "utf8");
  } else {
    created = true;
  }
  const have = new Set(
    existing
      .split("\n")
      .map((l) => l.split("=")[0]?.trim())
      .filter(Boolean)
  );
  const missing = keys.filter((k) => !have.has(k));
  if (missing.length === 0) return { added: [], created: false };
  const append = missing.map((k) => `${k}=`).join("\n") + "\n";
  fs.writeFileSync(
    envPath,
    existing + (existing === "" || existing.endsWith("\n") ? "" : "\n") + append
  );
  return { added: missing, created };
}

export async function runAddFlow(opts: {
  projectDir: string;
  kodeArg?: string;
}): Promise<AddResult> {
  const projectDir = path.resolve(opts.projectDir);
  // Template asing (tanpa manifest) → jalur heuristik + tawaran adopsi.
  // Template bermanifest → perilaku lama, tanpa cabang baru.
  const hadManifest = hasTemplateManifest(projectDir);

  // 1. DISCOVER: cari integrasi di indeks.
  let index: IntegrasiRow[];
  try {
    index = await fetchIntegrasiIndex();
  } catch (err) {
    p.cancel(`Gagal mengambil katalog integrasi:\n${(err as Error).message}`);
    return { completed: false };
  }
  const byKode = new Map(index.map((r) => [r.kode.toLowerCase(), r]));
  let kode = (opts.kodeArg ?? "").trim().toLowerCase();
  if (!kode) {
    const picked = await pickKodeInteractively(index);
    if (!picked) return { completed: false };
    kode = picked.toLowerCase();
  }
  const row = byKode.get(kode);
  if (!row) {
    p.cancel(
      `Integrasi "${opts.kodeArg}" tidak ditemukan.\n\nIntegrasi tersedia:\n` +
        index.map((r) => `  • ${r.kode}: ${r.nama_tampilan}`).join("\n")
    );
    return { completed: false };
  }

  // Baked? (project hasil generate Scaffdev yang sudah memuat kode ini)
  if (bakedKodes(projectDir).has(row.kode.toLowerCase())) {
    p.cancel(
      `Integrasi "${row.nama_tampilan}" SUDAH termasuk di project ini.\nTidak perlu dipasang ulang.`
    );
    return { completed: false };
  }
  if (!row.repo_url || !row.repo_url.trim()) {
    p.cancel(
      `Integrasi "${row.nama_tampilan}" belum punya repo modul.\nPilih integrasi lain.`
    );
    return { completed: false };
  }

  // 2. AUDIT: gate sebelum clone apa pun.
  const gate = await runSecurityGate({
    repoUrl: row.repo_url.trim(),
    kindLabel: `modul integrasi "${row.nama_tampilan}"`,
  });
  if (!gate.proceed) return { completed: false };

  // 3. VALIDATE: framework project + compat modul.
  const detected = detectProjectFramework(projectDir);
  p.log.info(`Framework project terdeteksi: ${fwLabel(detected === "both" || detected === "none" ? "" : detected)}${detected === "both" || detected === "none" ? " (perlu pilih manual)" : ""}.`);
  const fw = await pickFramework(detected);
  if (!fw) return { completed: false };
  const compat = (row.framework_compat ?? []).map((f) => f.toLowerCase());
  if (compat.length > 0 && !compat.includes(fw)) {
    p.cancel(
      `Integrasi "${row.nama_tampilan}" tidak mendukung framework ini.\nDidukung: ${compat.join(", ")}.`
    );
    return { completed: false };
  }

  // Rencana file: clone temp ringan khusus perencanaan (dibuang setelahnya;
  // instalasi final lewat injectModule agar tetap atomis).
  const planRoot = fs.mkdtempSync(path.join(os.tmpdir(), "scaff-add-"));
  let planManifest: { version: string; files: Array<{ dest: string }>; dependencies?: { npm?: Record<string, string>; composer?: Record<string, string> }; env?: string[] } | null = null;
  let planFull: IntegrationManifest | null = null;
  let planColliding: string[] = [];
  try {
    await cloneRepository(row.repo_url.trim(), planRoot);
    const raw = JSON.parse(fs.readFileSync(path.join(planRoot, "scaff.integration.json"), "utf8"));
    const parsed = parseIntegrationManifest(raw);
    if (!parsed.ok) {
      p.cancel(
        `Manifest modul tidak valid:\n` +
          parsed.errors.map((e) => `  - [${e.field || "root"}] ${e.message}`).join("\n")
      );
      return { completed: false };
    }
    planManifest = {
      version: parsed.manifest.version,
      files: filesForFramework(parsed.manifest, fw).map((f) => ({ dest: f.dest })),
      dependencies: parsed.manifest.dependencies,
      env: parsed.manifest.env,
    };
    planFull = parsed.manifest;
    planColliding = planManifest.files
      .map((f) => f.dest)
      .filter((d) => fs.existsSync(path.join(projectDir, d)));
  } catch (err) {
    p.cancel(`Gagal menyiapkan rencana instalasi:\n${(err as Error).message}`);
    return { completed: false };
  } finally {
    cleanupModuleDir(planRoot);
  }
  if (!planManifest || planManifest.files.length === 0) {
    p.cancel(`Modul "${row.nama_tampilan}" tidak memuat file untuk framework "${fw}".`);
    return { completed: false };
  }

  // Heuristik template asing: modul/musuhnya MUNGKIN sudah ada manual.
  // Hanya jalan bila tanpa scaff.template.json (bermanifest = bakedKodes eksak).
  if (!hadManifest && planFull) {
    const traces = detectExistingTraces(projectDir, heuristicFromManifest(planFull, fw), fw);
    if (traces.length > 0) {
      p.log.warn(
        `Template ini tanpa scaff.template.json, terdeteksi jejak yang MUNGKIN bentrok:\n${traces.map((t) => `  • ${t}`).join("\n")}\n(CLI tidak bisa memastikan 100% - periksa manual bila ragu.)`
      );
      const lanjut = await p.confirm({ message: "Tetap lanjutkan instalasi?", initialValue: true });
      if (p.isCancel(lanjut) || !lanjut) {
        p.cancel("Operasi dibatalkan. Tidak ada file yang diubah.");
        return { completed: false };
      }
    }
  }

  // Konflik: default aman = Batal.
  let onConflict: "abort" | "skip" | "overwrite" = "abort";
  if (planColliding.length > 0) {
    p.log.warn(
      `File sudah ada:\n${planColliding.map((d) => `  • ${d}`).join("\n")}`
    );
    const how = await p.select({
      message: "Bagaimana ScaffDev harus bersikap?",
      options: [
        { value: "cancel", label: "Batal", hint: "Aman, tidak ada yang diubah" },
        { value: "overwrite", label: "Timpa", hint: "Backup dulu ke .scaff/trash/" },
        { value: "skip", label: "Lewati file yang ada", hint: "Hanya pasang yang baru" },
      ],
    });
    if (p.isCancel(how) || how === "cancel") {
      p.cancel("Operasi dibatalkan. Tidak ada file yang diubah.");
      return { completed: false };
    }
    onConflict = how as "skip" | "overwrite";
  }

  // 4. PREVIEW + 5. CONFIRM.
  const depList =
    fw === "laravel"
      ? Object.keys(planManifest.dependencies?.composer ?? {})
      : Object.keys(planManifest.dependencies?.npm ?? {});
  const envList = planManifest.env ?? [];
  // Tandai folder yang BELUM ada (layout non-standar langsung kelihatan di sini).
  const newDirs = newDirsForPreview(projectDir, planManifest.files.map((f) => f.dest));
  p.note(
    `Integrasi : ${row.nama_tampilan} v${planManifest.version}\n` +
      `Framework : ${fwLabel(fw)}\n` +
      `File      : ${planManifest.files.length} baru` +
      (planColliding.length > 0 ? ` (${onConflict === "skip" ? "lewati" : "timpa"} ${planColliding.length} yang ada)` : "") +
      (newDirs.length > 0 ? `\nFolder baru: ${newDirs.join(", ")} (akan dibuatkan)` : "") +
      `\nDependencies: ${depList.length > 0 ? depList.join(", ") : "-"}\n` +
      `Environment : ${envList.length > 0 ? `${envList.length} variable wajib diisi` : "-"}\n` +
      `Security  : ✓ Audit lolos`,
    "Rencana Instalasi"
  );
  const go = await p.confirm({ message: "Lanjutkan instalasi?", initialValue: true });
  if (p.isCancel(go) || !go) {
    p.cancel("Operasi dibatalkan. Tidak ada file yang diubah.");
    return { completed: false };
  }

  // 6. INSTALL.
  const workRoot = fs.mkdtempSync(path.join(os.tmpdir(), "scaff-add-"));
  let installed: string[] = [];
  let skipped: string[] = [];
  let overwritten: string[] = [];
  let backedUpTo: string | undefined;
  let setupBody: string | undefined;
  let removalBody: string | undefined;
  let installedKode = "";
  try {
    const injected = await injectModule(projectDir, row.repo_url.trim(), fw, workRoot, {
      onConflict,
    });
    installed = injected.installedFiles;
    skipped = injected.skippedFiles;
    overwritten = injected.overwrittenFiles;
    backedUpTo = injected.backedUpTo;
    setupBody = injected.setupBody;
    removalBody = injected.removalBody;
    installedKode = injected.kode;
    cleanupModuleDir(injected.dir);
    // Merge dependency.
    if (fw === "laravel" && injected.manifest.dependencies?.composer) {
      mergeComposerDependencies(projectDir, injected.manifest.dependencies.composer);
    } else if (fw !== "laravel" && injected.manifest.dependencies?.npm) {
      mergeNpmDependencies(projectDir, injected.manifest.dependencies.npm);
    }
  } catch (err) {
    p.cancel(`Instalasi gagal:\n${(err as Error).message}\nTidak ada langkah lanjutan yang dijalankan otomatis.`);
    try {
      cleanupModuleDir(workRoot);
    } catch {
      // Abaikan.
    }
    return { completed: false };
  }
  try {
    cleanupModuleDir(workRoot);
  } catch {
    // Abaikan.
  }

  // Env: tambah key yang belum ada ke .env.example (JANGAN sentuh .env).
  let envAdded: string[] = [];
  if (envList.length > 0) {
    const r = ensureEnvExample(projectDir, envList);
    envAdded = r.added;
  }

  // Install dependency sekarang?
  let depsInstalled: string | null = null;
  if (depList.length > 0) {
    const doInstall = await p.confirm({
      message: `Install dependency sekarang (${fw === "laravel" ? "composer install" : "npm install"})?`,
      initialValue: true,
    });
    if (!p.isCancel(doInstall) && doInstall) {
      try {
        await execa(fw === "laravel" ? "composer" : "npm", ["install"], {
          cwd: projectDir,
          stdio: "inherit",
        });
        depsInstalled = "terpasang";
      } catch {
        depsInstalled = "GAGAL, jalankan manual";
      }
    } else {
      depsInstalled = "dilewati user";
    }
  }

  // 7. VERIFY + final.
  const missing = installed.filter((f) => !fs.existsSync(path.join(projectDir, f)));
  if (missing.length > 0) {
    p.cancel(
      `Instalasi TIDAK lengkap. File hilang:\n${missing.map((f) => `  • ${f}`).join("\n")}\nTidak ada langkah lanjutan yang dijalankan otomatis.`
    );
    return { completed: false };
  }
  p.note(
    `✓ Integrasi ${row.nama_tampilan} terpasang.\n\nFramework:\n  ${fwLabel(fw)}\n\nFiles:\n  ${installed.length} ditambah` +
      (skipped.length > 0 ? `\n  ${skipped.length} dilewati (sudah ada)` : "") +
      (overwritten.length > 0
        ? `\n  ${overwritten.length} ditimpa (backup: ${backedUpTo ?? ".scaff/trash/"})`
        : "") +
      `\n\nDependencies:\n  ${depList.length > 0 ? `${depList.join(", ")} (${depsInstalled ?? "-"})` : "-"}` +
      `\n\nEnvironment variables:\n  ${envList.length > 0 ? `${envList.length} wajib (${envAdded.length > 0 ? `baru ditambah ke .env.example: ${envAdded.join(", ")}` : "sudah ada di .env.example"})` : "-"}` +
      `\n\nSecurity:\n  ✓ Validasi lolos` +
      (setupBody ? `\n\nLihat panduan setup modul di output di bawah.` : ""),
    "Selesai"
  );
  if (setupBody) {
    console.log(setupBody.slice(0, 2000));
  }

  // Adopsi template asing: catat yang BARU dipasang agar add berikutnya eksak.
  // Hanya bila manifest tetap tidak ada (user tidak membuatnya di tengah jalan).
  if (!hadManifest && !hasTemplateManifest(projectDir) && installed.length > 0) {
    const adopt = await p.confirm({
      message: "Template ini tanpa scaff.template.json. Buatkan manifest adopsi (add berikutnya jadi eksak)?",
      initialValue: true,
    });
    if (!p.isCancel(adopt) && adopt) {
      const kode = sanitizeKode(installedKode || row.kode);
      const guideRel = `.scaff/REMOVE-${kode}.md`;
      const built = buildAdoptManifest({
        name: path.basename(projectDir),
        framework: fw,
        kode,
        files: installed,
        guideRel,
      });
      if (!built.ok) {
        p.log.warn(`Manifest adopsi dilewati (tidak valid):\n${built.errors.join("\n")}`);
      } else {
        const guideBody =
          removalBody ?? `# Copot ${kode}\n\nHapus file:\n${installed.map((f) => `- ${f}`).join("\n")}\n`;
        const written = writeAdoptedTemplate(projectDir, built.manifest, { [kode]: guideBody });
        p.log.success(
          `Manifest adopsi ditulis: scaff.template.json (slug: ${built.manifest.slug}) + ${written.guidePaths.join(", ")}`
        );
      }
    }
  }
  return { completed: true };
}
