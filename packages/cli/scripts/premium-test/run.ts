/**
 * Uji lisensi premium CLI (tanpa network, tanpa HOME asli tersentuh).
 * Cara jalan: `pnpm --filter scaffdev test:premium`.
 * Exit 0 = semua lolos; exit 1 = ada yang gagal.
 *
 * verifyAndDownload (network) + cache HOME TIDAK diuji di sini —
 * butuh server + API key asli (diuji manual). Yang diuji: format kunci,
 * ekstraksi tarball + penolakan traversal/arsip kosong.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  isLicenseKeyFormat,
  normalizeLicenseKey,
  extractPremiumTarball,
} from "../../src/lib/license";

let passed = 0;
const tests: Array<{ name: string; fn: () => void }> = [];
function ok(name: string, fn: () => void): void {
  tests.push({ name, fn });
}

ok("format kunci: valid diterima, mirip ditolak", () => {
  assert.equal(isLicenseKeyFormat("SCAFF-AB23-CD45-EF67"), true);
  assert.equal(isLicenseKeyFormat("scaff-ab23-cd45-ef67"), true);
  assert.equal(isLicenseKeyFormat("SCAFF-AB23-CD45"), false);
  assert.equal(isLicenseKeyFormat("SCAFF-AB23-CD45-EF6!"), false);
  assert.equal(isLicenseKeyFormat("SCAFF-AB1O-CD34-EF56"), false); // 1/O ambigu dilarang
  assert.equal(isLicenseKeyFormat("SCAFF-AB20-CD45-EF67"), false); // 0 ambigu dilarang
  assert.equal(isLicenseKeyFormat(""), false);
  assert.equal(normalizeLicenseKey("  scaff-ab23-cd45-ef67 "), "SCAFF-AB23-CD45-EF67");
});

/** Penulis tar minimal (2 file) untuk uji ekstraksi. */
function makeTar(files: Array<{ name: string; body: string }>): Buffer {
  const parts: Buffer[] = [];
  for (const f of files) {
    const head = Buffer.alloc(512, 0);
    head.write(f.name, 0, "utf8");
    head.write("0000777", 100, "utf8");
    head.write("0000000", 108, "utf8");
    head.write("0000000", 116, "utf8");
    head.write(f.body.length.toString(8).padStart(11, "0"), 124, "utf8");
    head.write("00000000000", 136, "utf8");
    head[156] = "0".charCodeAt(0);
    let chk = 0;
    for (let i = 0; i < 512; i++) chk += i >= 148 && i < 156 ? 32 : (head[i] ?? 0);
    head.write(chk.toString(8).padStart(6, "0") + "\0 ", 148, "utf8");
    parts.push(head, Buffer.from(f.body, "utf8"));
    const pad = (512 - (f.body.length % 512)) % 512;
    if (pad > 0) parts.push(Buffer.alloc(pad, 0));
  }
  parts.push(Buffer.alloc(1024, 0));
  return Buffer.concat(parts);
}

ok("ekstraksi: root arsip dikupas, file mendarat", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "scaff-prem-"));
  const tar = makeTar([
    { name: "owner-repo-abc123/package.json", body: "{}" },
    { name: "owner-repo-abc123/lib/a.ts", body: "export const a = 1;" },
  ]);
  const installed = extractPremiumTarball(tar, dir);
  assert.deepEqual(installed.sort(), ["lib/a.ts", "package.json"]);
  assert.equal(fs.readFileSync(path.join(dir, "lib", "a.ts"), "utf8"), "export const a = 1;");
  fs.rmSync(dir, { recursive: true, force: true });
});

ok("ekstraksi: traversal ditolak", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "scaff-prem-"));
  const tar = makeTar([{ name: "x/../../evil.sh", body: "x" }]);
  assert.throws(() => extractPremiumTarball(tar, dir), /tidak aman/);
  fs.rmSync(dir, { recursive: true, force: true });
});

ok("ekstraksi: arsip kosong ditolak", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "scaff-prem-"));
  assert.throws(() => extractPremiumTarball(Buffer.alloc(1024, 0), dir), /kosong/);
  fs.rmSync(dir, { recursive: true, force: true });
});

async function main(): Promise<void> {
  for (const t of tests) {
    t.fn();
    passed++;
    console.log(`✔ ${t.name}`);
  }
  console.log(`\nLOLOS: ${passed} uji premium.`);
}

main().catch((err) => {
  console.error(`GAGAL: ${(err as Error).message}`);
  process.exit(1);
});
