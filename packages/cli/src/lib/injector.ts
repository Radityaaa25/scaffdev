import fs from "fs";
import path from "path";
import { cloneRepository } from "./git";
import { parseIntegrationManifest, filesForFramework, type IntegrationManifest } from "./manifest";
import { recordModule, sha256File } from "./receipt";

export interface InjectedModule {
  kode: string;
  version: string;
  dir: string;
  manifest: IntegrationManifest;
  installedFiles: string[];
  skippedFiles: string[];
  overwrittenFiles: string[];
  /** Isi fragmen setup bila manifest menyediakannya (relatif root repo). */
  setupBody?: string;
  /** Isi panduan copot bila manifest menyediakannya (untuk adopsi template asing). */
  removalBody?: string;
  /** Lokasi backup bila mode overwrite (untuk restore manual). */
  backedUpTo?: string;
}

/** Mode konflik file: abort = gagal eksplisit (default, perilaku lama). */
export interface InjectOptions {
  onConflict?: "abort" | "skip" | "overwrite";
}

/**
 * Suntik satu modul integrasi ke folder project.
 * Aturan keras:
 * - src harus ada di hasil clone modul,
 * - framework base harus didukung manifest,
 * - tabrakan dest mengikuti mode: abort (gagal eksplisit),
 *   skip (lewati yang ada), overwrite (backup ke .scaff/trash lalu timpa).
 */

export async function injectModule(
  projectDir: string,
  moduleRepoUrl: string,
  framework: string,
  workRoot: string,
  opts: InjectOptions = {}
): Promise<InjectedModule> {
  const fw = framework.trim().toLowerCase();
  const onConflict = opts.onConflict ?? "abort";
  const tmpDir = fs.mkdtempSync(path.join(workRoot, "scaff-mod-"));
  try {
    await cloneRepository(moduleRepoUrl, tmpDir);

    const manifestPath = path.join(tmpDir, "scaff.integration.json");
    if (!fs.existsSync(manifestPath)) {
      throw new Error(
        `Repo modul tidak memuat scaff.integration.json di root.\nRepo: ${moduleRepoUrl}`
      );
    }
    let raw: unknown;
    try {
      raw = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
    } catch {
      throw new Error(`scaff.integration.json bukan JSON valid.\nRepo: ${moduleRepoUrl}`);
    }
    const parsed = parseIntegrationManifest(raw);
    if (!parsed.ok) {
      const list = parsed.errors.map((e) => `  - [${e.field || "root"}] ${e.message}`).join("\n");
      throw new Error(`Manifest modul tidak valid:\n${list}\nRepo: ${moduleRepoUrl}`);
    }
    const manifest = parsed.manifest;

    if (manifest.frameworks.length > 0 && !manifest.frameworks.includes(fw)) {
      throw new Error(
        `Modul "${manifest.kode}" v${manifest.version} tidak mendukung framework "${fw}".\nDidukung: ${manifest.frameworks.join(", ") || "(tidak ada)"}.`
      );
    }

    // Basis sumber: {repo}/{framework}/ bila ada, else root repo.
    // Hanya entri yang berlaku untuk framework ini yang disuntik, supaya
    // file PHP tidak akan nyasar ke project Next.js dan sebaliknya.
    const fwDir = path.join(tmpDir, fw);
    const srcBase = fs.existsSync(fwDir) && fs.statSync(fwDir).isDirectory() ? fwDir : tmpDir;
    const entries = filesForFramework(manifest, fw);
    if (entries.length === 0) {
      throw new Error(
        `Modul "${manifest.kode}" v${manifest.version} tidak memuat file untuk framework "${fw}".\nRepo: ${moduleRepoUrl}`
      );
    }

    // Pra-validasi SEMUA file sebelum menyalin satu pun (atomisitas).
    // Mode skip/overwrite: kumpulkan tabrakan dulu, putuskan per mode.
    const colliding: typeof entries = [];
    for (const f of entries) {
      const srcAbs = path.join(srcBase, f.src);
      if (!fs.existsSync(srcAbs) || !fs.statSync(srcAbs).isFile()) {
        throw new Error(
          `File modul tidak ditemukan: "${f.src}" (basis: ${srcBase === tmpDir ? "root repo" : `folder ${fw}/`}).\nRepo: ${moduleRepoUrl}`
        );
      }
      const destAbs = path.join(projectDir, f.dest);
      if (fs.existsSync(destAbs)) colliding.push(f);
    }
    if (colliding.length > 0 && onConflict === "abort") {
      throw new Error(
        `TABRAKAN: ${colliding.map((f) => `"${f.dest}"`).join(", ")} sudah ada di template base.\nPilih base lain atau hubungi pembuat template. Tidak ada file yang ditimpa.`
      );
    }
    const active = onConflict === "skip" ? entries.filter((f) => !colliding.includes(f)) : entries;
    const skippedFiles = onConflict === "skip" ? colliding.map((f) => f.dest) : [];
    // Overwrite: backup dulu ke .scaff/trash agar bisa dikembalikan manual.
    let backedUpTo: string | undefined;
    const overwrittenFiles: string[] = [];
    if (onConflict === "overwrite" && colliding.length > 0) {
      backedUpTo = path.join(projectDir, ".scaff", "trash", `${manifest.kode}-${Date.now()}`);
      for (const f of colliding) {
        const destAbs = path.join(projectDir, f.dest);
        const bakAbs = path.join(backedUpTo, f.dest);
        fs.mkdirSync(path.dirname(bakAbs), { recursive: true });
        fs.copyFileSync(destAbs, bakAbs);
        overwrittenFiles.push(f.dest);
      }
    }

    const installedFiles: string[] = [];
    for (const f of active) {
      const srcAbs = path.join(srcBase, f.src);
      const destAbs = path.join(projectDir, f.dest);
      fs.mkdirSync(path.dirname(destAbs), { recursive: true });
      fs.copyFileSync(srcAbs, destAbs);
      installedFiles.push(f.dest);
    }

    recordModule(projectDir, {
      kode: manifest.kode,
      version: manifest.version,
      files: installedFiles.map((rel) => ({
        path: rel,
        sha256: sha256File(path.join(projectDir, rel)),
      })),
    });

    // Fragmen setup (relatif root repo) untuk ditampilkan ke user.
    let setupBody: string | undefined;
    if (manifest.setup) {
      const setupAbs = path.join(tmpDir, manifest.setup);
      try {
        if (fs.existsSync(setupAbs) && fs.statSync(setupAbs).isFile()) {
          const raw = fs.readFileSync(setupAbs, "utf8");
          if (raw.trim()) setupBody = raw.slice(0, 4000);
        }
      } catch {
        // Abaikan: setup fragment opsional.
      }
    }

    // Panduan copot (relatif root repo) untuk adopsi template asing.
    let removalBody: string | undefined;
    if (manifest.removal?.stepsFile) {
      const stepsAbs = path.join(tmpDir, manifest.removal.stepsFile);
      try {
        if (fs.existsSync(stepsAbs) && fs.statSync(stepsAbs).isFile()) {
          const raw = fs.readFileSync(stepsAbs, "utf8");
          if (raw.trim()) removalBody = raw;
        }
      } catch {
        // Abaikan: panduan copot opsional di titik ini.
      }
    }

    return {
      kode: manifest.kode,
      version: manifest.version,
      dir: tmpDir,
      manifest,
      installedFiles,
      skippedFiles,
      overwrittenFiles,
      setupBody,
      removalBody,
      backedUpTo,
    };
  } catch (err) {
    // Bersihkan temp; project base TIDAK disentuh kecuali file yang sudah
    // tervalidasi penuh (validasi atomis di atas menjamin all-or-nothing).
    fs.rmSync(tmpDir, { recursive: true, force: true });
    throw err;
  }
}

/** Hapus direktori temp modul (dipanggil setelah selesai). */
export function cleanupModuleDir(dir: string): void {
  fs.rmSync(dir, { recursive: true, force: true });
}

interface PkgJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

/**
 * Merge dependency composer modul ke composer.json base.
 * Konflik range (nama sama, range beda) = GAGAL eksplisit.
 */
export function mergeComposerDependencies(
  projectDir: string,
  deps: Record<string, string>
): string[] {
  const composerPath = path.join(projectDir, "composer.json");
  if (!fs.existsSync(composerPath)) {
    throw new Error("Template base tidak memiliki composer.json sehingga tidak bisa merge dependency composer.");
  }
  const composer = JSON.parse(fs.readFileSync(composerPath, "utf-8")) as {
    require?: Record<string, string>;
    [key: string]: unknown;
  };
  composer.require = composer.require ?? {};
  const added: string[] = [];
  for (const [name, range] of Object.entries(deps)) {
    const existing = composer.require[name];
    if (existing !== undefined && existing !== range) {
      throw new Error(
        `KONFLIK dependency composer: "${name}" base memakai "${existing}", modul meminta "${range}".\nPilih base lain atau hubungi pembuat template/modul.`
      );
    }
    if (existing === undefined) {
      composer.require[name] = range;
      added.push(`${name}@${range}`);
    }
  }
  fs.writeFileSync(composerPath, JSON.stringify(composer, null, 2) + "\n", "utf-8");
  return added;
}

/**
 * Merge dependency modul ke package.json base.
 * Konflik range (nama sama, range beda) = GAGAL eksplisit.
 * Mengembalikan daftar package yang ditambahkan.
 */
export function mergeNpmDependencies(
  projectDir: string,
  deps: Record<string, string>
): string[] {
  const pkgPath = path.join(projectDir, "package.json");
  if (!fs.existsSync(pkgPath)) {
    throw new Error("Template base tidak memiliki package.json sehingga tidak bisa merge dependency npm.");
  }
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8")) as PkgJson;
  pkg.dependencies = pkg.dependencies ?? {};
  const added: string[] = [];
  for (const [name, range] of Object.entries(deps)) {
    const existing = pkg.dependencies[name] ?? pkg.devDependencies?.[name];
    if (existing !== undefined && existing !== range) {
      throw new Error(
        `KONFLIK dependency npm: "${name}" base memakai "${existing}", modul meminta "${range}".\nPilih base lain atau hubungi pembuat template/modul.`
      );
    }
    if (existing === undefined) {
      pkg.dependencies[name] = range;
      added.push(`${name}@${range}`);
    }
  }
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf-8");
  return added;
}
