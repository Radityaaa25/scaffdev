/**
 * Uji watermark level kode (README + SETUP + .scaff/meta.json).
 * Cara jalan: `pnpm --filter scaffdev test:watermark`.
 * Exit 0 = semua lolos; exit 1 = ada yang gagal.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  applyWatermark,
  WATERMARK_MARKER,
  type WatermarkInfo,
} from "../../src/lib/watermark";

const INFO: WatermarkInfo = {
  cliVersion: "0.7.0-test",
  templateSlug: "tes-watermark",
  templateName: "Tes Watermark",
  framework: "nextjs",
  generatedAt: "2026-01-01T00:00:00.000Z",
};

function mkDir(files: Record<string, string> = {}): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "scaff-wm-"));
  for (const [rel, body] of Object.entries(files)) {
    const abs = path.join(dir, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, body);
  }
  return dir;
}

function countMarker(s: string): number {
  return s.split(WATERMARK_MARKER).length - 1;
}

let passed = 0;
const tests: Array<{ name: string; fn: () => void }> = [];
function ok(name: string, fn: () => void): void {
  tests.push({ name, fn });
}

ok("fresh: README dibuat, SETUP ditambah, meta ditulis", () => {
  const dir = mkDir();
  const r = applyWatermark(dir, INFO);
  assert.equal(r.readme, "created");
  assert.equal(r.setup, "appended");
  assert.equal(r.meta, "written");
  const readme = fs.readFileSync(path.join(dir, "README.md"), "utf8");
  assert.ok(readme.includes(WATERMARK_MARKER) && readme.includes("Scaffdev CLI v0.7.0-test"));
  const setup = fs.readFileSync(path.join(dir, "SETUP.md"), "utf8");
  assert.ok(setup.includes("## Atribusi") && setup.includes(WATERMARK_MARKER));
  const meta = JSON.parse(fs.readFileSync(path.join(dir, ".scaff", "meta.json"), "utf8")) as Record<string, unknown>;
  assert.equal(meta.generator, "scaffdev");
  assert.equal((meta.template as Record<string, string>).slug, "tes-watermark");
  fs.rmSync(dir, { recursive: true, force: true });
});

ok("README lama dipertahankan + marker tepat 1", () => {
  const dir = mkDir({ "README.md": "# punyaku\nisi asli\n", "SETUP.md": "# setup\n" });
  const r = applyWatermark(dir, INFO);
  assert.equal(r.readme, "appended");
  const readme = fs.readFileSync(path.join(dir, "README.md"), "utf8");
  assert.ok(readme.startsWith("# punyaku\nisi asli\n"));
  assert.equal(countMarker(readme), 1);
  fs.rmSync(dir, { recursive: true, force: true });
});

ok("idempoten: jalan 2x tidak dobel", () => {
  const dir = mkDir();
  const r1 = applyWatermark(dir, INFO);
  const r2 = applyWatermark(dir, INFO);
  assert.equal(r1.readme, "created");
  assert.equal(r2.readme, "skipped");
  assert.equal(r2.setup, "skipped");
  const readme = fs.readFileSync(path.join(dir, "README.md"), "utf8");
  const setup = fs.readFileSync(path.join(dir, "SETUP.md"), "utf8");
  assert.equal(countMarker(readme), 1);
  assert.equal(countMarker(setup), 1);
  const meta = JSON.parse(fs.readFileSync(path.join(dir, ".scaff", "meta.json"), "utf8")) as Record<string, unknown>;
  assert.equal(meta.generatedAt, "2026-01-01T00:00:00.000Z");
  fs.rmSync(dir, { recursive: true, force: true });
});

ok("meta.json lama: field asing awet, generatedAt stabil", () => {
  const dir = mkDir({
    ".scaff/meta.json": JSON.stringify({ generator: "scaffdev", version: "0.0.1", custom: "jangan-hilang", generatedAt: "2020-01-01T00:00:00.000Z" }),
  });
  applyWatermark(dir, INFO);
  const meta = JSON.parse(fs.readFileSync(path.join(dir, ".scaff", "meta.json"), "utf8")) as Record<string, unknown>;
  assert.equal(meta.custom, "jangan-hilang");
  assert.equal(meta.version, "0.7.0-test");
  assert.equal(meta.generatedAt, "2020-01-01T00:00:00.000Z");
  fs.rmSync(dir, { recursive: true, force: true });
});

ok("meta.json rusak: ditulis ulang tanpa crash", () => {
  const dir = mkDir({ ".scaff/meta.json": "{bukan json" });
  const r = applyWatermark(dir, INFO);
  assert.equal(r.meta, "written");
  const meta = JSON.parse(fs.readFileSync(path.join(dir, ".scaff", "meta.json"), "utf8")) as Record<string, unknown>;
  assert.equal(meta.generator, "scaffdev");
  fs.rmSync(dir, { recursive: true, force: true });
});

async function main(): Promise<void> {
  for (const t of tests) {
    t.fn();
    passed++;
    console.log(`✔ ${t.name}`);
  }
  console.log(`\nLOLOS: ${passed} uji watermark.`);
}

main().catch((err) => {
  console.error(`GAGAL: ${(err as Error).message}`);
  process.exit(1);
});
