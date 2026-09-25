import fs from "fs";
import path from "path";
import { parseIntegrationManifest, parseTemplateManifest, filesForFramework } from "./manifest";

/**
 * `scaffdev validate-module <path-atau-repo>`
 * Validasi statis manifest + konsistensi file. Dipakai pembuat modul/template
 * SEBELUM mendaftarkan repo ke admin. Keluar non-nol bila ada masalah.
 */
export async function validateModuleTarget(target: string): Promise<{ ok: boolean; report: string[] }> {
  const report: string[] = [];
  let dir = target;
  let isTemp = false;

  if (/^https?:\/\//.test(target)) {
    const { cloneRepository } = await import("./git");
    dir = fs.mkdtempSync(path.join(process.cwd(), ".scaff-validate-"));
    isTemp = true;
    try {
      await cloneRepository(target, dir);
    } catch (err) {
      return { ok: false, report: [`Gagal clone repo: ${(err as Error).message}`] };
    }
  } else {
    dir = path.resolve(process.cwd(), target);
    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
      return { ok: false, report: [`Folder tidak ditemukan: ${target}`] };
    }
  }

  try {
    const intPath = path.join(dir, "scaff.integration.json");
    const tplPath = path.join(dir, "scaff.template.json");
    let checked = 0;

    if (fs.existsSync(intPath)) {
      checked++;
      let raw: unknown;
      try {
        raw = JSON.parse(fs.readFileSync(intPath, "utf-8"));
      } catch {
        return { ok: false, report: ["scaff.integration.json bukan JSON valid."] };
      }
      const parsed = parseIntegrationManifest(raw);
      if (!parsed.ok) {
        return {
          ok: false,
          report: parsed.errors.map((e) => `[${e.field || "root"}] ${e.message}`),
        };
      }
      const m = parsed.manifest;
      report.push(`✔ Manifest modul "${m.kode}" v${m.version} valid.`);
      // Cek keberadaan src untuk tiap framework yang dideklarasikan (atau root).
      // Modul multi-framework: hanya entri yang berlaku untuk fw itu yang dicek.
      const bases = m.frameworks.length > 0 ? m.frameworks : ["."];
      for (const fw of bases) {
        const base = fw === "." ? dir : path.join(dir, fw);
        if (!fs.existsSync(base)) {
          report.push(`✘ Folder framework "${fw}/" tidak ada di repo.`);
          return { ok: false, report };
        }
        const applicable = fw === "." ? m.files : filesForFramework(m, fw);
        if (fw !== "." && applicable.length === 0) {
          report.push(`✘ Tidak ada entri files[] untuk framework "${fw}".`);
          return { ok: false, report };
        }
        for (const f of applicable) {
          if (!fs.existsSync(path.join(base, f.src))) {
            report.push(`✘ src tidak ada untuk [${fw}]: ${f.src}`);
            return { ok: false, report };
          }
        }
        report.push(`✔ ${applicable.length} file sumber ada untuk [${fw}].`);
      }
      if (m.removal) {
        const stepsAbs = path.join(dir, m.removal.stepsFile);
        report.push(
          fs.existsSync(stepsAbs)
            ? `✔ Panduan copot ada: ${m.removal.stepsFile}.`
            : `✘ stepsFile tidak ada: ${m.removal.stepsFile}.`
        );
        if (!fs.existsSync(stepsAbs)) return { ok: false, report };
      }
      report.push(...checkSharedImports(dir, m.files.map((f) => f.src), bases));
    }

    if (fs.existsSync(tplPath)) {
      checked++;
      let raw: unknown;
      try {
        raw = JSON.parse(fs.readFileSync(tplPath, "utf-8"));
      } catch {
        return { ok: false, report: ["scaff.template.json bukan JSON valid."] };
      }
      const parsed = parseTemplateManifest(raw);
      if (!parsed.ok) {
        return {
          ok: false,
          report: parsed.errors.map((e) => `[${e.field || "root"}] ${e.message}`),
        };
      }
      const t = parsed.manifest;
      report.push(`✔ Manifest template "${t.slug}" (${t.framework}) valid.`);
      for (const [kode, files] of Object.entries(t.provides)) {
        for (const f of files) {
          if (!fs.existsSync(path.join(dir, f))) {
            report.push(`✘ provides[${kode}] tidak ada di repo: ${f}`);
            return { ok: false, report };
          }
        }
        const guide = t.removalGuides[kode];
        if (!guide || !fs.existsSync(path.join(dir, guide))) {
          report.push(`✘ removalGuides[${kode}] tidak ada: ${guide ?? "(kosong)"}.`);
          return { ok: false, report };
        }
        report.push(`✔ provides[${kode}]: ${files.length} file + panduan ${guide}.`);
      }
      if (Object.keys(t.provides).length === 0) {
        report.push("ℹ Template polosan (provides kosong) — valid.");
      }
    }

    if (checked === 0) {
      return { ok: false, report: ["Tidak ada scaff.integration.json maupun scaff.template.json di target."] };
    }
    return { ok: true, report };
  } finally {
    if (isTemp) fs.rmSync(dir, { recursive: true, force: true });
  }
}

const IMPORT_RE = /(?:import\s+(?:[^'"]*from\s+)?['"]([^'"]+)['"]|require\(\s*['"]([^'"]+)['"]\s*\))|(?:use\s+([A-Za-z0-9_\\]+)\s*;)/g;

/**
 * Cek graf import sederhana: file di luar daftar yang mengimpor file di dalam
 * daftar DITANDAI sebagai peringatan (indikasi file shared salah klaim).
 * Mengembalikan baris laporan (kosong bila bersih).
 */
function checkSharedImports(repoDir: string, ownedRelPaths: string[], bases: string[]): string[] {
  const notes: string[] = [];
  const owned = new Set<string>();
  for (const base of bases) {
    const baseDir = base === "." ? repoDir : path.join(repoDir, base);
    for (const rel of ownedRelPaths) {
      owned.add(path.normalize(path.join(baseDir, rel)));
    }
  }

  const candidates: string[] = [];
  const walk = (dir: string) => {
    let entries: fs.Dirent[] = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (e.name === "node_modules" || e.name === ".git" || e.name === "vendor") continue;
      const abs = path.join(dir, e.name);
      if (e.isDirectory()) walk(abs);
      else if (/\.(ts|tsx|js|jsx|php)$/.test(e.name)) candidates.push(abs);
    }
  };
  walk(repoDir);

  for (const file of candidates) {
    if (owned.has(path.normalize(file))) continue;
    let content: string;
    try {
      content = fs.readFileSync(file, "utf-8");
    } catch {
      continue;
    }
    IMPORT_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = IMPORT_RE.exec(content)) !== null) {
      const spec = m[1] ?? m[2] ?? null;
      if (!spec || !spec.startsWith(".")) continue;
      const resolved = path.normalize(path.join(path.dirname(file), spec));
      const withExt = [resolved, resolved + ".ts", resolved + ".tsx", resolved + ".js", resolved + ".php", path.join(resolved, "index.ts")];
      if (withExt.some((p) => owned.has(p))) {
        notes.push(
          `⚠ File di luar daftar mengimpor file terdaftar: ${path.relative(repoDir, file)} → ${path.relative(repoDir, resolved)} (kemungkinan file shared salah klaim).`
        );
        break;
      }
    }
  }
  if (notes.length === 0) notes.push("✔ Tidak ada import silang mencurigakan.");
  return notes;
}
