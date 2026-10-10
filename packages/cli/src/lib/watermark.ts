import fs from "fs";
import path from "path";

/**
 * Watermark level kode untuk project hasil generate.
 * Spesifikasi (lihat docs/lisensi.md "Atribusi / watermark"):
 *   1. baris kredit di README.md,
 *   2. section atribusi di SETUP.md,
 *   3. stempel generator di .scaff/meta.json.
 * Visual (badge/logo/footer) TIDAK disentuh - bebas diubah user.
 * Idempoten: aman dipanggil ulang (penanda marker dicek dulu).
 */

export const WATERMARK_MARKER = "<!-- scaffdev:watermark -->";

export interface WatermarkInfo {
  cliVersion: string;
  templateSlug: string;
  templateName: string;
  framework: string;
  generatedAt?: string;
}

function stamp(info: WatermarkInfo): string {
  return info.generatedAt ?? new Date().toISOString();
}

export function readmeCreditBlock(info: WatermarkInfo): string {
  return [
    "",
    "---",
    "",
    WATERMARK_MARKER,
    `> Project ini di-generate dengan **Scaffdev CLI v${info.cliVersion}** (template \`${info.templateSlug}\`, ${stamp(info).slice(0, 10)}).`,
    ">",
    "> Kredit level kode wajib dipertahankan: baris ini (README.md), section Atribusi (SETUP.md), dan `.scaff/meta.json`.",
    "> Elemen visual (badge, logo, footer) bebas diubah atau dihapus. Ketentuan penuh: https://scaffdev.vercel.app/docs/lisensi",
    "",
  ].join("\n");
}

export function setupAttributionBlock(info: WatermarkInfo): string {
  return [
    "",
    "## Atribusi",
    "",
    WATERMARK_MARKER,
    `Project ini di-generate dengan **Scaffdev CLI v${info.cliVersion}** (template \`${info.templateSlug}\`, ${stamp(info).slice(0, 10)}).`,
    "",
    "Kredit level kode wajib dipertahankan: baris kredit (README.md), section ini (SETUP.md), dan `.scaff/meta.json`. " +
      "Elemen visual bebas diubah atau dihapus. Ketentuan penuh: https://scaffdev.vercel.app/docs/lisensi",
    "",
  ].join("\n");
}

export interface MetaJson {
  generator: string;
  version: string;
  template: { slug: string; name: string; framework: string };
  generatedAt: string;
  [k: string]: unknown;
}

export function buildMetaJson(info: WatermarkInfo, existing?: Record<string, unknown>): MetaJson {
  return {
    ...(existing ?? {}),
    generator: "scaffdev",
    version: info.cliVersion,
    template: { slug: info.templateSlug, name: info.templateName, framework: info.framework },
    generatedAt: (existing?.generatedAt as string | undefined) ?? stamp(info),
  };
}

function readText(abs: string): string | null {
  try {
    if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) return null;
    return fs.readFileSync(abs, "utf8");
  } catch {
    return null;
  }
}

export interface WatermarkResult {
  readme: "created" | "appended" | "skipped";
  setup: "appended" | "skipped";
  meta: "written";
}

/** Terapkan 3 watermark. Hanya dipanggil dari alur generate (bukan `add`). */
export function applyWatermark(targetDir: string, info: WatermarkInfo): WatermarkResult {
  // 1. README.md: tambah di akhir (atau buat bila tidak ada).
  let readme: WatermarkResult["readme"];
  const readmeAbs = path.join(targetDir, "README.md");
  const readmeBody = readText(readmeAbs);
  if (readmeBody !== null && readmeBody.includes(WATERMARK_MARKER)) {
    readme = "skipped";
  } else if (readmeBody === null) {
    fs.writeFileSync(readmeAbs, `# ${info.templateName}\n` + readmeCreditBlock(info), "utf8");
    readme = "created";
  } else {
    const sep = readmeBody.endsWith("\n") ? "" : "\n";
    fs.writeFileSync(readmeAbs, readmeBody + sep + readmeCreditBlock(info), "utf8");
    readme = "appended";
  }

  // 2. SETUP.md: tambah section di akhir (file selalu dibuat generateSetupDoc dulu).
  let setup: WatermarkResult["setup"];
  const setupAbs = path.join(targetDir, "SETUP.md");
  const setupBody = readText(setupAbs);
  if (setupBody !== null && setupBody.includes(WATERMARK_MARKER)) {
    setup = "skipped";
  } else if (setupBody === null) {
    fs.writeFileSync(setupAbs, `# Panduan Setup Project: ${info.templateName}\n` + setupAttributionBlock(info), "utf8");
    setup = "appended";
  } else {
    const sep = setupBody.endsWith("\n") ? "" : "\n";
    fs.writeFileSync(setupAbs, setupBody + sep + setupAttributionBlock(info), "utf8");
    setup = "appended";
  }

  // 3. .scaff/meta.json: tulis/gabung (file mesin, milik Scaffdev).
  const metaAbs = path.join(targetDir, ".scaff", "meta.json");
  let existing: Record<string, unknown> | undefined;
  try {
    const raw = readText(metaAbs);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        existing = parsed as Record<string, unknown>;
      }
    }
  } catch {
    existing = undefined;
  }
  fs.mkdirSync(path.dirname(metaAbs), { recursive: true });
  fs.writeFileSync(metaAbs, JSON.stringify(buildMetaJson(info, existing), null, 2) + "\n", "utf8");

  return { readme, setup, meta: "written" };
}
