import fs from "fs";
import path from "path";
import { parseTemplateManifest } from "./manifest";
import { readReceipt, trashDir, sha256File, unrecordModule } from "./receipt";

export interface RemovalPlan {
  kode: string;
  files: string[];
  envKeys: string[];
  guidePath: string | null;
}

export interface RemovalResult {
  removedFiles: string[];
  skippedChanged: string[];
  missing: string[];
  envKeys: string[];
  guideBody: string | null;
}

/**
 * Susun rencana copot integrasi bawaan base dari scaff.template.json.
 * Hanya file yang terdaftar di provides[kode] yang boleh disentuh.
 */
export function planBaseRemoval(projectDir: string, kode: string): RemovalPlan {
  const manifestPath = path.join(projectDir, "scaff.template.json");
  if (!fs.existsSync(manifestPath)) {
    throw new Error(
      `Template ini tidak memuat scaff.template.json — CLI tidak bisa memastikan file milik "${kode}".\n` +
        `Opsi: (1) pakai varian Basic template ini + modul ${kode}, atau (2) copot manual mengikuti dokumentasi pembuat template.`
    );
  }
  let raw: unknown;
  try {
    raw = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  } catch {
    throw new Error("scaff.template.json bukan JSON valid.");
  }
  const parsed = parseTemplateManifest(raw);
  if (!parsed.ok) {
    throw new Error(
      `scaff.template.json tidak valid:\n${parsed.errors.map((e) => `  - [${e.field || "root"}] ${e.message}`).join("\n")}`
    );
  }
  const files = parsed.manifest.provides[kode];
  if (!files) {
    const known = Object.keys(parsed.manifest.provides);
    throw new Error(
      `Template ini tidak mendeklarasikan integrasi bawaan "${kode}".\n` +
        (known.length > 0 ? `Yang terdaftar: ${known.join(", ")}.` : "Template ini polosan (tanpa bawaan).")
    );
  }
  // Cek konsistensi runtime: semua path harus ada di project.
  const missing = files.filter((f) => {
    const abs = path.join(projectDir, f);
    return !fs.existsSync(abs);
  });
  if (missing.length > 0) {
    throw new Error(
      `Manifest tidak cocok dengan project (file hilang, repo mungkin berubah):\n` +
        missing.map((f) => `  - ${f}`).join("\n") +
        `\nBatal demi keamanan — tidak ada file yang dihapus.`
    );
  }
  const guideRel = parsed.manifest.removalGuides[kode] ?? null;
  return { kode, files, envKeys: [], guidePath: guideRel };
}

/**
 * Eksekusi copot: backup → hapus → verifikasi grep.
 * File yang isinya BERUBAH dari kondisi tercatat dilewati (kemungkinan
 * sudah diedit user) dan dilaporkan sebagai kerja manual.
 * referensiHash: map path → sha256 saat file "dikenal baik" (dari receipt
 * untuk file modul; untuk file base, hash dibaca SEKARANG sebagai baseline
 * hanya untuk deteksi — file base selalu dibackup dulu).
 */
export function executeRemoval(
  projectDir: string,
  plan: RemovalPlan,
  knownHashes: Map<string, string>
): RemovalResult {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.join(trashDir(projectDir), `${plan.kode}-${stamp}`);
  fs.mkdirSync(backupDir, { recursive: true });

  const removedFiles: string[] = [];
  const skippedChanged: string[] = [];
  const missing: string[] = [];

  try {
    for (const rel of plan.files) {
      const abs = path.join(projectDir, rel);
      if (!fs.existsSync(abs)) {
        missing.push(rel);
        continue;
      }
      const expected = knownHashes.get(rel);
      if (expected !== undefined) {
        let current: string;
        try {
          current = sha256File(abs);
        } catch {
          missing.push(rel);
          continue;
        }
        if (current !== expected) {
          skippedChanged.push(rel);
          continue;
        }
      }
      const backupAbs = path.join(backupDir, rel);
      fs.mkdirSync(path.dirname(backupAbs), { recursive: true });
      fs.copyFileSync(abs, backupAbs);
      fs.rmSync(abs, { recursive: true, force: true });
      removedFiles.push(rel);
    }
  } catch (err) {
    // RESTORE OTOMATIS: kembalikan semua yang sudah terhapus.
    for (const rel of removedFiles) {
      try {
        const backupAbs = path.join(backupDir, rel);
        const destAbs = path.join(projectDir, rel);
        fs.mkdirSync(path.dirname(destAbs), { recursive: true });
        fs.copyFileSync(backupAbs, destAbs);
      } catch {
        /* best effort */
      }
    }
    throw new Error(
      `Gagal di tengah pencopotan — semua file yang terhapus DIKEMBALIKAN.\nPenyebab: ${(err as Error).message}`
    );
  }

  // Hapus baris env yang terdaftar (hanya baris KEY=... yang persis).
  const envKeys = plan.envKeys;
  if (envKeys.length > 0) {
    for (const envFile of [".env.local", ".env", ".env.example"]) {
      const abs = path.join(projectDir, envFile);
      if (!fs.existsSync(abs)) continue;
      const lines = fs.readFileSync(abs, "utf-8").split("\n");
      const kept = lines.filter((line) => {
        const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=/);
        return !(m?.[1] && envKeys.includes(m[1]));
      });
      if (kept.length !== lines.length) {
        fs.copyFileSync(abs, path.join(backupDir, `${envFile}.bak`));
        fs.writeFileSync(abs, kept.join("\n"), "utf-8");
      }
    }
  }

  let guideBody: string | null = null;
  if (plan.guidePath) {
    const guideAbs = path.join(projectDir, plan.guidePath);
    if (fs.existsSync(guideAbs)) {
      guideBody = fs.readFileSync(guideAbs, "utf-8");
    }
  }

  unrecordModule(projectDir, plan.kode);
  return { removedFiles, skippedChanged, missing, envKeys, guideBody };
}

/** Bangun peta hash file modul dari receipt (untuk verifikasi "tak berubah"). */
export function moduleFileHashes(projectDir: string, kode: string): Map<string, string> {
  const receipt = readReceipt(projectDir);
  const map = new Map<string, string>();
  const mod = receipt?.modules.find((m) => m.kode === kode);
  for (const f of mod?.files ?? []) {
    map.set(f.path, f.sha256);
  }
  return map;
}
