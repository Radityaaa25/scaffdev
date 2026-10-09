/**
 * Uji foreign-template (template ASING tanpa scaff.template.json).
 * Cara jalan: `pnpm --filter scaffdev test:foreign`.
 * Exit 0 = semua lolos; exit 1 = ada yang gagal.
 *
 * Hermetik: tanpa network (modul diambil dari path lokal), tanpa prompt
 * (hanya fungsi murni + injectModule non-interaktif).
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  hasTemplateManifest,
  detectExistingTraces,
  newDirsForPreview,
  slugifyName,
  sanitizeKode,
  buildAdoptManifest,
  writeAdoptedTemplate,
  checkResolvableImports,
} from "../../src/lib/foreign-template";
import { parseTemplateManifest } from "../../src/lib/manifest";
import { injectModule, cleanupModuleDir } from "../../src/lib/injector";

const MODUL_RESEND = "D:/PROJECT RADIT/TEMPLATE-INTEGRATION/scaff-modul-resend";

function mkTemplate(files: Record<string, string>): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "scaff-foreign-"));
  for (const [rel, body] of Object.entries(files)) {
    const abs = path.join(dir, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, body);
  }
  return dir;
}

let passed = 0;
const tests: Array<{ name: string; fn: () => void | Promise<void> }> = [];
function ok(name: string, fn: () => void | Promise<void>): void {
  tests.push({ name, fn });
}

// A. Heuristik: jejak env + dep + keyword konflik.
ok("heuristic: env + dep terdeteksi", () => {
  const dir = mkTemplate({
    "package.json": JSON.stringify({ dependencies: { resend: "^4.0.0" } }),
    ".env": "RESEND_API_KEY=re_xxx\n",
  });
  const traces = detectExistingTraces(
    dir,
    { kode: "resend", nama: "resend", env: ["RESEND_API_KEY", "RESEND_FROM_EMAIL"], npmDeps: ["resend"], composerDeps: [], conflicts: [] },
    "nextjs"
  );
  assert.equal(traces.length, 2);
  fs.rmSync(dir, { recursive: true, force: true });
});

ok("heuristic: keyword konflik terdeteksi", () => {
  const dir = mkTemplate({
    "package.json": JSON.stringify({ dependencies: { "midtrans-client": "^1.0.0" } }),
  });
  const traces = detectExistingTraces(
    dir,
    { kode: "duitku", nama: "duitku", env: ["DUITKU_MERCHANT_CODE"], npmDeps: [], composerDeps: [], conflicts: ["midtrans"] },
    "nextjs"
  );
  assert.ok(traces.some((t) => t.includes("midtrans")));
  fs.rmSync(dir, { recursive: true, force: true });
});

ok("heuristic: template bersih = nol jejak", () => {
  const dir = mkTemplate({ "package.json": JSON.stringify({ dependencies: { react: "^19.0.0" } }) });
  const traces = detectExistingTraces(
    dir,
    { kode: "resend", nama: "resend", env: ["RESEND_API_KEY"], npmDeps: ["resend"], composerDeps: [], conflicts: [] },
    "nextjs"
  );
  assert.equal(traces.length, 0);
  fs.rmSync(dir, { recursive: true, force: true });
});

// B. Preview folder baru.
ok("preview: folder hilang ditandai, yang ada tidak", () => {
  const dir = mkTemplate({ "package.json": "{}" });
  fs.mkdirSync(path.join(dir, "lib", "email"), { recursive: true });
  const flagged = newDirsForPreview(dir, ["lib/email/resend.ts", "app/api/email/send/route.ts"]);
  assert.deepEqual(flagged, ["app/api/email/send/"]);
  fs.rmSync(dir, { recursive: true, force: true });
});

// C. Util nama.
ok("slugify + sanitize", () => {
  assert.equal(slugifyName("Toko Saya 2024!"), "toko-saya-2024");
  assert.equal(slugifyName(""), "custom-template");
  assert.equal(sanitizeKode("Resend"), "resend");
});

// D. Adopsi manifest round-trip parser resmi.
ok("adopt: build + tulis + parse ulang valid", () => {
  const dir = mkTemplate({ "package.json": "{}" });
  assert.equal(hasTemplateManifest(dir), false);
  const built = buildAdoptManifest({
    name: "Toko Saya",
    framework: "nextjs",
    kode: "resend",
    files: ["lib/email/resend.ts", "app/api/email/send/route.ts"],
    guideRel: ".scaff/REMOVE-resend.md",
  });
  assert.equal(built.ok, true);
  if (!built.ok) throw new Error("unreachable");
  const written = writeAdoptedTemplate(dir, built.manifest, { resend: "# Copot\n" });
  assert.ok(fs.existsSync(path.join(dir, "scaff.template.json")));
  assert.deepEqual(written.guidePaths, [".scaff/REMOVE-resend.md"]);
  assert.equal(hasTemplateManifest(dir), true);
  const reparsed = parseTemplateManifest(JSON.parse(fs.readFileSync(path.join(dir, "scaff.template.json"), "utf8")));
  assert.equal(reparsed.ok, true);
  fs.rmSync(dir, { recursive: true, force: true });
});

// E. Import checker: 1 rusak tertangkap, yang benar lolos.
ok("import-checker: rusak tertangkap", () => {
  const dir = mkTemplate({
    "nextjs/lib/a.ts": `export const a = 1;\n`,
    "nextjs/app/api/x/route.ts": `import { a } from "../../../../lib/a";\n`,
    "nextjs/app/api/y/route.ts": `import { a } from "../../../lib/a";\n`,
  });
  const broken = checkResolvableImports(
    dir,
    [{ src: "app/api/x/route.ts" }, { src: "app/api/y/route.ts" }],
    ["nextjs"]
  );
  assert.equal(broken.length, 1);
  const b0 = broken[0];
  assert.ok(b0);
  assert.ok(b0.src.includes("route.ts") && b0.spec.includes("lib/a"));
  fs.rmSync(dir, { recursive: true, force: true });
});

/**
 * Stage repo modul (working tree, termasuk yang belum di-commit) ke repo git
 * SEMENTARA di tmp agar bisa di-clone injectModule. Repo asli tidak disentuh
 * (tanpa commit/push ke mana pun).
 */
function stageModuleRepo(srcDir: string): string {
  const stage = fs.mkdtempSync(path.join(os.tmpdir(), "scaff-stage-"));
  fs.cpSync(srcDir, stage, { recursive: true, filter: (s) => !s.includes(".git") });
  const git = (args: string[]) =>
    execFileSync("git", ["-c", "user.email=test@scaffdev.local", "-c", "user.name=scaffdev-test", ...args], { cwd: stage, stdio: "pipe" });
  git(["init", "-q"]);
  git(["add", "-A"]);
  git(["commit", "-qm", "stage uji"]);
  return stage;
}

// F. E2E inject ke template asing (modul resend asli, working tree terkini).
ok("e2e: inject resend ke template asing mendarat + import resolve", async () => {
  const stagedModul = stageModuleRepo(MODUL_RESEND);
  const dir = mkTemplate({
    "package.json": JSON.stringify({ name: "toko-asing", dependencies: { next: "^16.0.0" } }),
    ".env.example": "NEXT_PUBLIC_X=\n",
  });
  assert.equal(hasTemplateManifest(dir), false);
  const workRoot = fs.mkdtempSync(path.join(os.tmpdir(), "scaff-work-"));
  const injected = await injectModule(dir, stagedModul, "nextjs", workRoot, { onConflict: "abort" });
  assert.ok(injected.installedFiles.length >= 2);
  for (const f of injected.installedFiles) {
    assert.ok(fs.existsSync(path.join(dir, f)), `hilang: ${f}`);
  }
  const broken = checkResolvableImports(
    dir,
    injected.installedFiles.map((dest) => ({ src: dest })),
    ["."]
  );
  assert.equal(broken.length, 0);
  assert.ok((injected.removalBody ?? "").length > 0);
  // Adopsi penuh lalu re-validasi setara validate-module template.
  const kode = sanitizeKode(injected.kode);
  const built = buildAdoptManifest({
    name: path.basename(dir),
    framework: "nextjs",
    kode,
    files: injected.installedFiles,
    guideRel: `.scaff/REMOVE-${kode}.md`,
  });
  assert.equal(built.ok, true);
  if (!built.ok) throw new Error("unreachable");
  writeAdoptedTemplate(dir, built.manifest, { [kode]: injected.removalBody ?? "" });
  cleanupModuleDir(injected.dir);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.rmSync(workRoot, { recursive: true, force: true });
  fs.rmSync(stagedModul, { recursive: true, force: true });
});

async function main(): Promise<void> {
  for (const t of tests) {
    await t.fn();
    passed++;
    console.log(`✔ ${t.name}`);
  }
  console.log(`\nLOLOS: ${passed} uji foreign-add.`);
}

main().catch((err) => {
  console.error(`GAGAL: ${(err as Error).message}`);
  process.exit(1);
});
