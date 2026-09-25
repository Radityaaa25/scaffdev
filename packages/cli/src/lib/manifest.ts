/**
 * Parse & validasi manifest Scaffdev Builder.
 * - Modul integrasi : scaff.integration.json (di root repo modul)
 * - Template base  : scaff.template.json (di root repo template, opsional)
 *
 * Prinsip: TOLAK dengan pesan jelas bila ada yang meragukan.
 * Tidak ada tebakan, tidak ada fallback diam-diam.
 */

export interface IntegrationFileMap {
  src: string;
  dest: string;
  /**
   * Framework yang memakai entri ini (subset dari `frameworks` manifest).
   * Absen/kosong = berlaku untuk SEMUA framework yang didukung modul.
   * Wajib diisi bila satu repo memuat kode per framework yang berbeda
   * (mis. `nextjs/` berisi .ts, `laravel/` berisi .php).
   */
  frameworks?: string[];
}

export interface IntegrationManifest {
  kode: string;
  version: string;
  frameworks: string[];
  files: IntegrationFileMap[];
  dependencies?: { npm?: Record<string, string>; composer?: Record<string, string> };
  env?: string[];
  setup?: string;
  removal?: { files: string[]; env: string[]; stepsFile: string };
  conflicts?: string[];
}

export interface TemplateManifest {
  name: string;
  slug: string;
  framework: string;
  provides: Record<string, string[]>;
  removalGuides: Record<string, string>;
}

export interface ManifestError {
  field: string;
  message: string;
}

/** File bawaan yang DILARANG menjadi dest suntikan. */
const FORBIDDEN_DESTS = new Set([
  "package.json",
  "composer.json",
  ".env",
  ".env.local",
  ".env.example",
  "README.md",
  "SETUP.md",
  ".gitignore",
  "scaff.template.json",
  "scaff.integration.json",
]);

const KODE_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SEMVER_RE = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isSafeRelPath(p: string): boolean {
  if (typeof p !== "string" || p.trim() === "") return false;
  const norm = p.replace(/\\/g, "/").trim();
  if (norm === "" || norm.startsWith("/") || norm.startsWith("~")) return false;
  const parts = norm.split("/").filter((s) => s !== "" && s !== ".");
  if (parts.length === 0) return false;
  return !parts.includes("..");
}

function checkDest(dest: string, errors: ManifestError[]): void {
  const norm = dest.replace(/\\/g, "/").replace(/^\.\//, "");
  if (FORBIDDEN_DESTS.has(norm) || FORBIDDEN_DESTS.has(norm.toLowerCase())) {
    errors.push({ field: "files.dest", message: `Dest dilarang (file bawaan base): "${dest}".` });
  }
}

function filesForFrameworkEntries(files: IntegrationFileMap[], fw: string): IntegrationFileMap[] {
  const f = fw.trim().toLowerCase();
  return files.filter((e) => !e.frameworks || e.frameworks.length === 0 || e.frameworks.includes(f));
}

/**
 * Entri files[] yang berlaku untuk framework `fw`.
 * Dipakai validator (cek src per framework) dan injector (salin per framework).
 */
export function filesForFramework(manifest: IntegrationManifest, fw: string): IntegrationFileMap[] {
  return filesForFrameworkEntries(manifest.files, fw);
}

export function parseIntegrationManifest(raw: unknown):
  | { ok: true; manifest: IntegrationManifest }
  | { ok: false; errors: ManifestError[] } {
  const errors: ManifestError[] = [];
  if (!isPlainObject(raw)) {
    return { ok: false, errors: [{ field: "", message: "Manifest bukan JSON object." }] };
  }

  const kode = typeof raw.kode === "string" ? raw.kode.trim().toLowerCase() : "";
  if (!kode || !KODE_RE.test(kode)) {
    errors.push({ field: "kode", message: "Field 'kode' wajib huruf kecil/dash (contoh: midtrans)." });
  }
  const version = typeof raw.version === "string" ? raw.version.trim() : "";
  if (!version || !SEMVER_RE.test(version)) {
    errors.push({ field: "version", message: "Field 'version' wajib semver (contoh: 1.0.0)." });
  }

  let frameworks: string[] = [];
  if (raw.frameworks !== undefined) {
    if (!Array.isArray(raw.frameworks)) {
      errors.push({ field: "frameworks", message: "Field 'frameworks' harus array of string." });
    } else {
      frameworks = [...new Set(
        raw.frameworks.filter((x): x is string => typeof x === "string").map((x) => x.trim().toLowerCase()).filter(Boolean)
      )];
      for (const f of frameworks) {
        if (!KODE_RE.test(f)) errors.push({ field: "frameworks", message: `Kode framework tidak valid: "${f}".` });
      }
    }
  }

  const files: IntegrationFileMap[] = [];
  if (!Array.isArray(raw.files) || raw.files.length === 0) {
    errors.push({ field: "files", message: "Field 'files' wajib array non-kosong {src, dest}." });
  } else {
    const seenDest = new Set<string>();
    for (const [i, item] of raw.files.entries()) {
      if (!isPlainObject(item) || typeof item.src !== "string" || typeof item.dest !== "string") {
        errors.push({ field: `files[${i}]`, message: "Setiap entri harus {src, dest} string." });
        continue;
      }
      const src = item.src.replace(/\\/g, "/").trim();
      const dest = item.dest.replace(/\\/g, "/").trim();
      if (!isSafeRelPath(src)) {
        errors.push({ field: `files[${i}].src`, message: `Path src tidak aman: "${item.src}". Dilarang keluar root (..) / absolut.` });
        continue;
      }
      if (!isSafeRelPath(dest)) {
        errors.push({ field: `files[${i}].dest`, message: `Path dest tidak aman: "${item.dest}".` });
        continue;
      }
      const normDest = dest.replace(/^\.\//, "").toLowerCase();
      if (seenDest.has(normDest)) {
        errors.push({ field: `files[${i}].dest`, message: `Dest duplikat: "${item.dest}".` });
        continue;
      }
      seenDest.add(normDest);
      checkDest(dest, errors);
      // Filter frameworks per entri (opsional).
      let entryFw: string[] | undefined;
      if (item.frameworks !== undefined) {
        if (!Array.isArray(item.frameworks) || item.frameworks.length === 0) {
          errors.push({ field: `files[${i}].frameworks`, message: "Field 'frameworks' entri harus array non-kosong bila diisi; hapus field-nya untuk semua framework." });
          continue;
        }
        const clean = [...new Set(
          item.frameworks.filter((x): x is string => typeof x === "string").map((x) => x.trim().toLowerCase()).filter(Boolean)
        )];
        for (const f of clean) {
          if (!KODE_RE.test(f)) {
            errors.push({ field: `files[${i}].frameworks`, message: `Kode framework tidak valid: "${f}".` });
          } else if (frameworks.length > 0 && !frameworks.includes(f)) {
            errors.push({ field: `files[${i}].frameworks`, message: `"${f}" tidak ada di daftar frameworks modul (${frameworks.join(", ") || "(kosong)"}).` });
          }
        }
        entryFw = clean;
      }
      files.push(entryFw ? { src, dest, frameworks: entryFw } : { src, dest });
    }
    // Tiap framework yang didukung wajib punya ≥1 entri yang berlaku.
    // Tanpa ini, modul "mendukung" framework yang tidak bisa disuntik apa pun.
    for (const fw of frameworks) {
      if (filesForFrameworkEntries(files, fw).length === 0) {
        errors.push({ field: "files", message: `Tidak ada file untuk framework "${fw}". Tandai entri dengan frameworks: ["${fw}"] atau hapus "${fw}" dari frameworks modul.` });
      }
    }
  }

  let dependencies: IntegrationManifest["dependencies"];
  if (raw.dependencies !== undefined) {
    if (!isPlainObject(raw.dependencies)) {
      errors.push({ field: "dependencies", message: "Field 'dependencies' harus object {npm?, composer?}." });
    } else {
      dependencies = {};
      for (const key of ["npm", "composer"] as const) {
        const section = raw.dependencies[key];
        if (section === undefined) continue;
        if (!isPlainObject(section)) {
          errors.push({ field: `dependencies.${key}`, message: `dependencies.${key} harus map nama → range versi.` });
          continue;
        }
        const clean: Record<string, string> = {};
        for (const [name, range] of Object.entries(section)) {
          if (typeof range !== "string" || range.trim() === "") {
            errors.push({ field: `dependencies.${key}.${name}`, message: "Range versi harus string non-kosong." });
            continue;
          }
          clean[name] = range.trim();
        }
        dependencies[key] = clean;
      }
    }
  }

  let removal: IntegrationManifest["removal"];
  if (raw.removal !== undefined) {
    if (!isPlainObject(raw.removal)) {
      errors.push({ field: "removal", message: "Field 'removal' harus object {files, env, stepsFile}." });
    } else {
      const rFiles = Array.isArray(raw.removal.files)
        ? raw.removal.files.filter((x): x is string => typeof x === "string").map((x) => x.trim()).filter(Boolean)
        : null;
      const rEnv = Array.isArray(raw.removal.env)
        ? raw.removal.env.filter((x): x is string => typeof x === "string").map((x) => x.trim()).filter(Boolean)
        : null;
      const stepsFile = typeof raw.removal.stepsFile === "string" ? raw.removal.stepsFile.trim() : "";
      if (!rFiles || !rEnv || !stepsFile) {
        errors.push({ field: "removal", message: "Field 'removal' wajib {files[], env[], stepsFile}." });
      } else {
        for (const f of rFiles) {
          if (!isSafeRelPath(f)) errors.push({ field: "removal.files", message: `Path tidak aman: "${f}".` });
        }
        // Jaminan copot: removal.files harus TEPAT mencakup semua dest yang
        // dipasang modul (tidak kurang agar tak ada file yatim, tidak lebih
        // agar CLI tak menghapus file yang bukan milik modul).
        const destByNorm = new Map(files.map((e) => [e.dest.replace(/^\.\//, "").toLowerCase(), e.dest]));
        const removalSet = new Set(rFiles.map((f) => f.replace(/\\/g, "/").replace(/^\.\//, "").toLowerCase()));
        for (const f of rFiles) {
          const norm = f.replace(/\\/g, "/").replace(/^\.\//, "").toLowerCase();
          if (!destByNorm.has(norm)) {
            errors.push({ field: "removal.files", message: `"${f}" bukan dest yang dipasang modul ini.` });
          }
        }
        for (const [norm, orig] of destByNorm) {
          if (!removalSet.has(norm)) {
            errors.push({ field: "removal.files", message: `Dest "${orig}" belum tercakup removal.files.` });
          }
        }
        if (!isSafeRelPath(stepsFile)) {
          errors.push({ field: "removal.stepsFile", message: `Path tidak aman: "${stepsFile}".` });
        } else {
          removal = { files: rFiles, env: rEnv, stepsFile };
        }
      }
    }
  }

  if (errors.length > 0) return { ok: false, errors };
  const manifest: IntegrationManifest = { kode, version, frameworks, files };
  if (dependencies) manifest.dependencies = dependencies;
  if (Array.isArray(raw.env)) {
    manifest.env = raw.env.filter((x): x is string => typeof x === "string").map((x) => x.trim()).filter(Boolean);
  }
  if (typeof raw.setup === "string" && raw.setup.trim()) manifest.setup = raw.setup.trim();
  if (removal) manifest.removal = removal;
  if (Array.isArray(raw.conflicts)) {
    manifest.conflicts = [...new Set(
      raw.conflicts.filter((x): x is string => typeof x === "string").map((x) => x.trim().toLowerCase()).filter(Boolean)
    )];
  }
  return { ok: true, manifest };
}

export function parseTemplateManifest(raw: unknown):
  | { ok: true; manifest: TemplateManifest }
  | { ok: false; errors: ManifestError[] } {
  const errors: ManifestError[] = [];
  if (!isPlainObject(raw)) {
    return { ok: false, errors: [{ field: "", message: "Manifest bukan JSON object." }] };
  }
  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  const slug = typeof raw.slug === "string" ? raw.slug.trim().toLowerCase() : "";
  const framework = typeof raw.framework === "string" ? raw.framework.trim().toLowerCase() : "";
  if (!name) errors.push({ field: "name", message: "Field 'name' wajib diisi." });
  if (!slug || !KODE_RE.test(slug)) errors.push({ field: "slug", message: "Field 'slug' wajib huruf kecil/dash." });
  if (!framework || !KODE_RE.test(framework)) {
    errors.push({ field: "framework", message: "Field 'framework' wajib kode valid (contoh: nextjs)." });
  }

  const provides: Record<string, string[]> = {};
  if (raw.provides !== undefined) {
    if (!isPlainObject(raw.provides)) {
      errors.push({ field: "provides", message: "Field 'provides' harus map kode → array path." });
    } else {
      for (const [kode, files] of Object.entries(raw.provides)) {
        if (!KODE_RE.test(kode)) {
          errors.push({ field: "provides", message: `Kode integrasi tidak valid: "${kode}".` });
          continue;
        }
        if (!Array.isArray(files) || files.length === 0) {
          errors.push({ field: `provides.${kode}`, message: "Harus array path non-kosong." });
          continue;
        }
        const clean: string[] = [];
        for (const f of files) {
          if (typeof f !== "string" || !isSafeRelPath(f)) {
            errors.push({ field: `provides.${kode}`, message: `Path tidak aman: "${String(f)}".` });
            continue;
          }
          clean.push(f.replace(/\\/g, "/").trim());
        }
        provides[kode] = clean;
      }
    }
  }

  const removalGuides: Record<string, string> = {};
  if (raw.removalGuides !== undefined) {
    if (!isPlainObject(raw.removalGuides)) {
      errors.push({ field: "removalGuides", message: "Field 'removalGuides' harus map kode → file." });
    } else {
      for (const [kode, file] of Object.entries(raw.removalGuides)) {
        if (typeof file !== "string" || !isSafeRelPath(file)) {
          errors.push({ field: `removalGuides.${kode}`, message: `Path tidak aman: "${String(file)}".` });
          continue;
        }
        removalGuides[kode] = file.replace(/\\/g, "/").trim();
      }
    }
  }
  // Konsistensi: setiap provides HARUS punya panduan copot.
  for (const kode of Object.keys(provides)) {
    if (!removalGuides[kode]) {
      errors.push({ field: "removalGuides", message: `Integrasi "${kode}" ada di provides tapi tanpa panduan di removalGuides.` });
    }
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, manifest: { name, slug, framework, provides, removalGuides } };
}
