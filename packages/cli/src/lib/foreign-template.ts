import fs from "fs";
import path from "path";
import {
  parseTemplateManifest,
  type IntegrationManifest,
  type TemplateManifest,
} from "./manifest";

/**
 * Dukungan template ASING (tanpa scaff.template.json).
 *
 * Prinsip: SEMUA fungsi di file ini hanya dipanggil bila manifest template
 * TIDAK ada. Bila manifest ada, jalur lama berjalan tanpa menyentuh kode ini.
 */

export function hasTemplateManifest(projectDir: string): boolean {
  try {
    return fs.existsSync(path.join(projectDir, "scaff.template.json"));
  } catch {
    return false;
  }
}

export interface HeuristicModule {
  kode: string;
  nama: string;
  env: string[];
  npmDeps: string[];
  composerDeps: string[];
  conflicts: string[];
}

function readText(abs: string): string | null {
  try {
    if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) return null;
    return fs.readFileSync(abs, "utf8");
  } catch {
    return null;
  }
}

function envKeysPresent(projectDir: string): Set<string> {
  const found = new Set<string>();
  for (const f of [".env", ".env.local", ".env.example"]) {
    const text = readText(path.join(projectDir, f));
    if (!text) continue;
    for (const line of text.split("\n")) {
      const key = line.split("=")[0]?.trim();
      if (key && !key.startsWith("#")) found.add(key);
    }
  }
  return found;
}

function depKeysPresent(projectDir: string): { npm: Set<string>; composer: Set<string>; raw: string } {
  const npm = new Set<string>();
  const composer = new Set<string>();
  let raw = "";
  const pkg = readText(path.join(projectDir, "package.json"));
  if (pkg) {
    raw += "\n" + pkg.toLowerCase();
    try {
      const j = JSON.parse(pkg) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
      for (const k of Object.keys(j.dependencies ?? {})) npm.add(k.toLowerCase());
      for (const k of Object.keys(j.devDependencies ?? {})) npm.add(k.toLowerCase());
    } catch {
      // Abaikan: heuristik tetap jalan via pencarian teks.
    }
  }
  const comp = readText(path.join(projectDir, "composer.json"));
  if (comp) {
    raw += "\n" + comp.toLowerCase();
    try {
      const j = JSON.parse(comp) as { require?: Record<string, string>; "require-dev"?: Record<string, string> };
      for (const k of Object.keys(j.require ?? {})) composer.add(k.toLowerCase());
      for (const k of Object.keys(j["require-dev"] ?? {})) composer.add(k.toLowerCase());
    } catch {
      // Abaikan: heuristik tetap jalan via pencarian teks.
    }
  }
  return { npm, composer, raw };
}

/**
 * Heuristik best-effort: jejak bahwa modul (atau musuhnya) MUNGKIN sudah ada
 * di template asing. Mengembalikan baris peringatan (kosong = bersih).
 * BUKAN verdict - user yang memutuskan lanjut/batal.
 */
export function detectExistingTraces(
  projectDir: string,
  mod: HeuristicModule,
  fw: string
): string[] {
  const traces: string[] = [];
  const haveEnv = envKeysPresent(projectDir);
  for (const key of mod.env) {
    if (haveEnv.has(key)) {
      traces.push(`env ${key} sudah ada di .env*/.env.example (mungkin ${mod.nama} sudah terpasang manual)`);
    }
  }
  const deps = depKeysPresent(projectDir);
  const wantNpm = fw === "laravel" ? [] : mod.npmDeps.map((d) => d.toLowerCase());
  const wantComposer = fw === "laravel" ? mod.composerDeps.map((d) => d.toLowerCase()) : [];
  for (const d of wantNpm) {
    if (deps.npm.has(d)) traces.push(`dependency npm ${d} sudah terpasang`);
  }
  for (const d of wantComposer) {
    if (deps.composer.has(d)) traces.push(`dependency composer ${d} sudah terpasang`);
  }
  // Konflik: tanpa provides, satu-satunya sinyal adalah kemunculan nama kode
  // di file dependency/env. Dilabeli jelas sebagai dugaan.
  const haystack = deps.raw + "\n" + [...haveEnv].join("\n").toLowerCase();
  for (const c of mod.conflicts.map((x) => x.toLowerCase())) {
    if (c && haystack.includes(c)) {
      traces.push(`terdeteksi kata "${c}" di package.json/composer.json/env (dugaan: ${c} sudah ada, bentrok dengan ${mod.kode})`);
    }
  }
  return traces;
}

/** Dest yang parent folder-nya BELUM ada (akan dibuatkan saat install). */
export function newDirsForPreview(projectDir: string, dests: string[]): string[] {
  const dirs = new Set<string>();
  for (const d of dests) {
    const parent = path.posix.dirname(d.replace(/\\/g, "/"));
    if (parent && parent !== "." && !fs.existsSync(path.join(projectDir, parent))) {
      dirs.add(parent + "/");
    }
  }
  return [...dirs].sort();
}

export function slugifyName(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "custom-template";
}

export function sanitizeKode(kode: string): string {
  return kode.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/^-+|-+$/g, "") || "custom";
}

/**
 * Susun manifest adopsi minimal + validasi mandiri via parser resmi.
 * provides = file yang BARU dipasang (dari removal.files modul).
 */
export function buildAdoptManifest(opts: {
  name: string;
  framework: string;
  kode: string;
  files: string[];
  guideRel: string;
}): { ok: true; manifest: TemplateManifest } | { ok: false; errors: string[] } {
  const kode = sanitizeKode(opts.kode);
  const candidate = {
    name: opts.name.trim() || "Custom Template",
    slug: slugifyName(opts.name),
    framework: opts.framework.trim().toLowerCase(),
    provides: { [kode]: [...opts.files] },
    removalGuides: { [kode]: opts.guideRel },
  };
  const parsed = parseTemplateManifest(candidate);
  if (!parsed.ok) {
    return { ok: false, errors: parsed.errors.map((e) => `[${e.field || "root"}] ${e.message}`) };
  }
  return { ok: true, manifest: parsed.manifest };
}

/** Tulis scaff.template.json + salinan panduan copot ke .scaff/. */
export function writeAdoptedTemplate(
  projectDir: string,
  manifest: TemplateManifest,
  guides: Record<string, string>
): { manifestPath: string; guidePaths: string[] } {
  const manifestPath = path.join(projectDir, "scaff.template.json");
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  const guidePaths: string[] = [];
  for (const [kode, body] of Object.entries(guides)) {
    const rel = manifest.removalGuides[sanitizeKode(kode)];
    if (!rel) continue;
    const abs = path.join(projectDir, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, body.endsWith("\n") ? body : body + "\n");
    guidePaths.push(rel);
  }
  return { manifestPath, guidePaths };
}

const REL_IMPORT_RE = /(?:import\s+(?:[^'"]*from\s+)?['"]([^'"]+)['"]|export\s+[^'"]*from\s+['"]([^'"]+)['"]|require\(\s*['"]([^'"]+)['"]\s*\))/g;
const CODE_EXT = [".ts", ".tsx", ".js", ".jsx", ".mts", ".cts", ".mjs", ".cjs"];

export interface BrokenImport {
  src: string;
  spec: string;
  resolved: string;
}

/**
 * Cek resolvabilitas import relatif di file modul (TS/JS).
 * Menangkap kelas bug "path ../ kelebihan/kurang" yang lolos cek lain.
 * PHP dilewati (resolusi butuh peta autoload composer).
 */
export function checkResolvableImports(
  moduleDir: string,
  files: Array<{ src: string }>,
  bases: string[]
): BrokenImport[] {
  const broken: BrokenImport[] = [];
  for (const base of bases) {
    const baseDir = base === "." ? moduleDir : path.join(moduleDir, base);
    for (const f of files) {
      const ext = path.extname(f.src).toLowerCase();
      if (!CODE_EXT.includes(ext)) continue;
      const abs = path.join(baseDir, f.src);
      let content: string;
      try {
        content = fs.readFileSync(abs, "utf8");
      } catch {
        continue;
      }
      REL_IMPORT_RE.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = REL_IMPORT_RE.exec(content)) !== null) {
        const spec = m[1] ?? m[2] ?? m[3] ?? "";
        if (!spec.startsWith(".")) continue;
        const resolvedBase = path.normalize(path.join(path.dirname(abs), spec));
        const candidates = [
          resolvedBase,
          ...CODE_EXT.map((e) => resolvedBase + e),
          ...CODE_EXT.map((e) => path.join(resolvedBase, "index" + e)),
        ];
        if (!candidates.some((c) => fs.existsSync(c))) {
          broken.push({ src: path.relative(moduleDir, abs), spec, resolved: path.relative(moduleDir, resolvedBase) });
        }
      }
    }
  }
  return broken;
}

/** Bentuk input heuristik dari manifest integrasi resmi. */
export function heuristicFromManifest(m: IntegrationManifest, fw: string): HeuristicModule {
  return {
    kode: m.kode,
    nama: m.kode,
    env: m.env ?? [],
    npmDeps: fw === "laravel" ? [] : Object.keys(m.dependencies?.npm ?? {}),
    composerDeps: fw === "laravel" ? Object.keys(m.dependencies?.composer ?? {}) : [],
    conflicts: m.conflicts ?? [],
  };
}
