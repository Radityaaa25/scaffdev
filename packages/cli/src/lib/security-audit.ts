/**
 * Security audit statis untuk repository template/modul SEBELUM clone & install.
 *
 * Prinsip: AUDIT DULU, EKSEKUSI BELAKANGAN. Modul ini TIDAK PERNAH menjalankan
 * kode repository — hanya membaca bytes (tarball remote atau folder lokal).
 *
 * Dipakai oleh SEMUA entry point via runSecurityGate() agar tidak ada jalur
 * yang bisa bypass (interaktif, --template direct, tiap modul --with).
 * validate-module memakai bagian report-only (tanpa prompt).
 */
import fs from "fs";
import os from "os";
import path from "path";
import zlib from "zlib";
import * as p from "@clack/prompts";

export type Severity = "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface AuditFinding {
  severity: Severity;
  /** Path relatif di repo, mis. package.json */
  file: string;
  title: string;
  detail: string;
  /** Cuplikan bukti (dipotong, tanpa secret values — values tidak pernah ada di repo). */
  evidence: string;
}

export interface AuditReport {
  /** "owner/repo" atau URL bila bukan GitHub. */
  repo: string;
  /** File yang benar-benar diinspeksi. */
  inspected: string[];
  /** Bagian yang TIDAK bisa diinspeksi + alasannya (jujur, bukan dianggap aman). */
  notInspectable: string[];
  findings: AuditFinding[];
}

// ---------------------------------------------------------------------------
// Murni: parsing repo GitHub (tanpa network, unit-testable).
// ---------------------------------------------------------------------------

export function parseGitHubRepo(repoUrl: string): { owner: string; repo: string } | null {
  const m = repoUrl
    .trim()
    .replace(/\.git$/, "")
    .match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/?$/i);
  if (!m) return null;
  const [, owner = "", repo = ""] = m;
  return { owner, repo };
}

// ---------------------------------------------------------------------------
// Murni: pembaca tar minimal (list + ekstrak selektif, tanpa eksekusi).
// Format ustar: header 512 byte, nama @0 (100), ukuran oktal @124 (12),
// typeflag @156, prefix @345. Direktori dilewati, symlink tidak diikuti.
// ---------------------------------------------------------------------------

export interface TarEntry {
  name: string;
  data: Buffer;
}

function parseOctal(buf: Buffer, offset: number, length: number): number {
  const raw = buf
    .subarray(offset, offset + length)
    .toString("ascii")
    .replace(/\0/g, "")
    .trim();
  if (!/^[0-7]+$/.test(raw)) return NaN;
  return parseInt(raw, 8);
}

function readCString(buf: Buffer, offset: number, length: number): string {
  const end = buf.indexOf(0, offset);
  const stop = end === -1 || end > offset + length ? offset + length : end;
  return buf.subarray(offset, stop).toString("utf8");
}

/**
 * Ekstrak file yang cocok `want()` dari tarball. Batasan pengaman:
 * tiap file maks `maxFileBytes`, total file maks `maxFiles`. Direktori,
 * symlink, dan entri non-reguler dilewati. Prefix root tarball
 * ("owner-repo-sha/") dikupas agar path relatif terhadap root repo.
 */
export function extractTarFiles(
  tar: Buffer,
  want: (relPath: string) => boolean,
  maxFileBytes = 512 * 1024,
  maxFiles = 100
): TarEntry[] {
  const out: TarEntry[] = [];
  let offset = 0;
  let rootPrefix: string | null = null;
  while (offset + 512 <= tar.length && out.length < maxFiles) {
    // Blok nol ganda = akhir arsip.
    if (tar.subarray(offset, offset + 512).every((b) => b === 0)) break;
    const name = readCString(tar, offset, 100);
    const size = parseOctal(tar, offset + 124, 12);
    const typeflag = String.fromCharCode(tar[offset + 156] || 0);
    const prefix = readCString(tar, offset + 345, 155);
    if (!name || Number.isNaN(size) || size < 0) break;
    const fullName = prefix ? `${prefix}/${name}` : name;
    // Tentukan prefix root dari entri pertama, kupas untuk semua entri.
    if (rootPrefix === null) {
      const slash = fullName.indexOf("/");
      rootPrefix = slash === -1 ? "" : fullName.slice(0, slash + 1);
    }
    const rel = rootPrefix && fullName.startsWith(rootPrefix)
      ? fullName.slice(rootPrefix.length)
      : fullName;
    const dataStart = offset + 512;
    const dataEnd = dataStart + size;
    if (dataEnd > tar.length) break;
    const isFile = typeflag === "0" || typeflag === "\0";
    if (isFile && rel && want(rel)) {
      if (size <= maxFileBytes) {
        out.push({ name: rel, data: tar.subarray(dataStart, dataEnd) });
      }
    }
    // Maju ke header berikutnya (data dibulatkan ke kelipatan 512).
    offset = dataStart + Math.ceil(size / 512) * 512;
  }
  return out;
}

function isTextLike(data: Buffer): boolean {
  // Heuristik murah: tolak bila ada byte NUL di 8KB pertama (binari).
  const head = data.subarray(0, Math.min(8192, data.length));
  return !head.includes(0);
}

// ---------------------------------------------------------------------------
// IO: unduh tarball remote (tanpa clone, tanpa eksekusi).
// ---------------------------------------------------------------------------

const TARBALL_MAX_BYTES = 25 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 30000;

/**
 * Unduh tarball branch default repo. Urutan:
 * 1. Info repo via GitHub API (1 call, dapat default_branch) — pakai token
 *    bila GITHUB_TOKEN ada (kuota lebih besar + siap untuk repo privat).
 * 2. Arsip via codeload (tidak memakan kuota REST API).
 */
export async function downloadRepoTarball(
  owner: string,
  repo: string
): Promise<{ tar: Buffer; ref: string }> {
  const token = process.env.GITHUB_TOKEN?.trim();
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "scaffdev-cli",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  let infoRes: Response;
  try {
    infoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers,
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch {
    throw new Error(
      `Tidak dapat menghubungi GitHub API (timeout ${FETCH_TIMEOUT_MS / 1000} dtk).\n` +
        `Periksa koneksi, atau isi GITHUB_TOKEN bila kena rate limit.`
    );
  }
  if (infoRes.status === 404) {
    throw new Error(`Repository ${owner}/${repo} tidak ditemukan (404).`);
  }
  if (infoRes.status === 403) {
    throw new Error(
      `GitHub API menolak (403, kemungkinan rate limit).\nIsi env GITHUB_TOKEN lalu ulangi.`
    );
  }
  if (!infoRes.ok) {
    throw new Error(`GitHub API mengembalikan HTTP ${infoRes.status}. Coba lagi nanti.`);
  }
  const info = (await infoRes.json()) as { default_branch?: string };
  const ref = info.default_branch || "main";
  const archiveUrl = `https://codeload.github.com/${owner}/${repo}/tar.gz/${ref}`;
  let arcRes: Response;
  try {
    arcRes = await fetch(archiveUrl, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch {
    throw new Error(
      `Gagal mengunduh arsip repository (timeout ${FETCH_TIMEOUT_MS / 1000} dtk).`
    );
  }
  if (!arcRes.ok) {
    throw new Error(`Gagal mengunduh arsip repository (HTTP ${arcRes.status}).`);
  }
  const gz = Buffer.from(await arcRes.arrayBuffer());
  if (gz.length > TARBALL_MAX_BYTES) {
    throw new Error(
      `Arsip repository ${(gz.length / 1048576).toFixed(1)} MB melebihi batas audit ` +
        `(${(TARBALL_MAX_BYTES / 1048576).toFixed(0)} MB). Audit dibatalkan — periksa manual.`
    );
  }
  let tar: Buffer;
  try {
    tar = zlib.gunzipSync(gz);
  } catch {
    throw new Error("Arsip bukan gzip valid. Audit dibatalkan.");
  }
  return { tar, ref };
}

// ---------------------------------------------------------------------------
// Murni: rule engine pola + konteks. Severity TIDAK PERNAH hanya dari keyword:
// keyword tunggal tanpa konteks eksekusi/download = maksimal LOW.
// ---------------------------------------------------------------------------

const NPM_LIFECYCLE = [
  "preinstall",
  "install",
  "postinstall",
  "prepare",
  "prepublish",
  "prepublishOnly",
];
const COMPOSER_LIFECYCLE = [
  "pre-install-cmd",
  "post-install-cmd",
  "pre-update-cmd",
  "post-update-cmd",
];
const DOWNLOAD_RE =
  /\b(curl|wget|Invoke-WebRequest|\biwr\b|Start-BitsTransfer|certutil|bitsadmin)\b/i;
const PIPE_EXEC_RE = /(curl|wget)[^\n]{0,200}\|\s*(bash|sh)\b/i;
const PS_ENCODED_RE = /powershell[^\n]{0,200}-(EncodedCommand|enc)\b/i;
const OBFUSC_RE = /\b(base64|atob|Buffer\.from|fromCharCode|EncodedCommand|eval\s*\(|Function\s*\()/;
const EVAL_EXEC_RE = /\b(eval\s*\(|exec\s*\(|Function\s*\()/;

function evidenceOf(text: string, at: number, radius = 150): string {
  const start = Math.max(0, at - radius);
  const end = Math.min(text.length, at + radius);
  return text.slice(start, end).replace(/\s+/g, " ").trim().slice(0, 300);
}

function downloadExecSeverity(scriptBody: string): Severity | null {
  if (PIPE_EXEC_RE.test(scriptBody) || PS_ENCODED_RE.test(scriptBody)) return "CRITICAL";
  if (DOWNLOAD_RE.test(scriptBody) && /(\|\s*(bash|sh|powershell|pwsh)\b|&&\s*(bash|sh)\b|\beval\b|\bexec\b)/i.test(scriptBody)) {
    return "HIGH";
  }
  if (OBFUSC_RE.test(scriptBody) && EVAL_EXEC_RE.test(scriptBody)) return "HIGH";
  if (OBFUSC_RE.test(scriptBody) || DOWNLOAD_RE.test(scriptBody)) return "LOW";
  return null;
}

export function auditPackageJson(relPath: string, text: string): AuditFinding[] {
  const out: AuditFinding[] = [];
  let pkg: { scripts?: Record<string, string>; dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
  try {
    pkg = JSON.parse(text) as typeof pkg;
  } catch {
    return [
      {
        severity: "LOW",
        file: relPath,
        title: "package.json bukan JSON valid",
        detail: "File tidak bisa dibaca — audit script dilewati untuk file ini.",
        evidence: text.slice(0, 200),
      },
    ];
  }
  const scripts = pkg.scripts ?? {};
  for (const name of NPM_LIFECYCLE) {
    const body = scripts[name];
    if (typeof body !== "string" || body.trim() === "") continue;
    const combo = downloadExecSeverity(body);
    if (combo === "CRITICAL" || combo === "HIGH") {
      out.push({
        severity: combo,
        file: relPath,
        title: `Lifecycle script "${name}" mengunduh + mengeksekusi konten remote`,
        detail:
          "Script ini berjalan OTOMATIS saat npm install. Kombinasi download + eksekusi " +
          "adalah pola instalasi malware klasik. Periksa URL dan perintahnya sebelum lanjut.",
        evidence: `${name}: ${body}`.slice(0, 300),
      });
    } else {
      out.push({
        severity: "MEDIUM",
        file: relPath,
        title: `Lifecycle script "${name}" terdeteksi`,
        detail:
          "Script ini berjalan otomatis saat npm install dan BISA menjalankan " +
          "perintah apa pun. Bukan otomatis jahat — tapi wajib dibaca isinya.",
        evidence: `${name}: ${body}`.slice(0, 300),
      });
    }
  }
  // Dependensi non-registry (URL/git) = kode dari luar npm.
  for (const group of ["dependencies", "devDependencies"] as const) {
    const deps = pkg[group] ?? {};
    for (const [depName, spec] of Object.entries(deps)) {
      if (typeof spec === "string" && /^(https?:|git\+|github:|ssh:)/i.test(spec)) {
        out.push({
          severity: "LOW",
          file: relPath,
          title: `Dependensi "${depName}" menunjuk keluar registry npm`,
          detail: `Spesifikasi "${spec}" mengambil kode dari luar npm — periksa sumbernya.`,
          evidence: `${depName}: ${spec}`.slice(0, 300),
        });
      }
    }
  }
  return out;
}

export function auditComposerJson(relPath: string, text: string): AuditFinding[] {
  const out: AuditFinding[] = [];
  let composer: { scripts?: Record<string, string | string[]> };
  try {
    composer = JSON.parse(text) as typeof composer;
  } catch {
    return [
      {
        severity: "LOW",
        file: relPath,
        title: "composer.json bukan JSON valid",
        detail: "File tidak bisa dibaca — audit script dilewati untuk file ini.",
        evidence: text.slice(0, 200),
      },
    ];
  }
  const scripts = composer.scripts ?? {};
  for (const name of COMPOSER_LIFECYCLE) {
    const raw = scripts[name];
    const body = Array.isArray(raw) ? raw.join(" && ") : raw;
    if (typeof body !== "string" || body.trim() === "") continue;
    const combo = downloadExecSeverity(body);
    if (combo === "CRITICAL" || combo === "HIGH") {
      out.push({
        severity: combo,
        file: relPath,
        title: `Composer script "${name}" mengunduh + mengeksekusi konten remote`,
        detail:
          "Script ini berjalan OTOMATIS saat composer install/update. Periksa perintahnya.",
        evidence: `${name}: ${body}`.slice(0, 300),
      });
    } else {
      out.push({
        severity: "MEDIUM",
        file: relPath,
        title: `Composer script "${name}" terdeteksi`,
        detail:
          "Script ini berjalan otomatis saat composer install/update dan BISA " +
          "menjalankan perintah apa pun. Bukan otomatis jahat — tapi wajib dibaca.",
        evidence: `${name}: ${body}`.slice(0, 300),
      });
    }
  }
  return out;
}

export function auditWorkflow(relPath: string, text: string): AuditFinding[] {
  const out: AuditFinding[] = [];
  // Bentuk blok (run: |) maupun sebaris (run: <command>).
  const bodies: Array<{ body: string; at: number }> = [];
  const runBlocks = [...text.matchAll(/run:\s*\|?-?\s*\n((?:[ \t]+[^\n]*\n?)+)/g)];
  for (const m of runBlocks) bodies.push({ body: m[1] ?? "", at: m.index ?? 0 });
  const inlineRuns = [...text.matchAll(/^[ \t]*-\s*run:\s*(?!\||>)([^\n]+)/gm)];
  for (const m of inlineRuns) bodies.push({ body: m[1] ?? "", at: m.index ?? 0 });
  // Workflow hanya berjalan di CI (tidak di mesin user saat install):
  // yang dicari adalah pola dropper/eksfiltrasi, bukan npm test biasa.
  let checked = 0;
  for (const { body, at } of bodies) {
    checked++;
    if (/(curl|wget)[^\n]{0,200}\$\{\{\s*secrets\./i.test(body)) {
      out.push({
        severity: "HIGH",
        file: relPath,
        title: "Workflow mengirim secret ke perintah download",
        detail:
          "Secret GitHub Actions diteruskan ke curl/wget — pola eksfiltrasi kredensial. " +
          "Periksa URL tujuannya sebelum lanjut.",
        evidence: evidenceOf(text, at),
      });
      continue;
    }
    const combo = downloadExecSeverity(body);
    if (combo === "CRITICAL" || combo === "HIGH") {
      out.push({
        severity: combo,
        file: relPath,
        title: "Workflow berisi pola download + eksekusi",
        detail:
          "Hanya berjalan di CI (tidak di komputermu saat install), tapi pola " +
          "dropper tetap layak ditinjau. Baca blok run-nya.",
        evidence: evidenceOf(text, at),
      });
    }
  }
  if (out.length === 0 && checked > 0) {
    out.push({
      severity: "INFO",
      file: relPath,
      title: `Blok run diperiksa (${checked}), tidak ada pola berbahaya`,
      detail: "Workflow CI normal — hanya berjalan di CI, bukan saat install.",
      evidence: "",
    });
  }
  return out;
}

export function auditVscode(relPath: string, text: string): AuditFinding[] {
  if (!/(command|process|shell|program)\s*["']?\s*:/i.test(text)) return [];
  return [
    {
      severity: "LOW",
      file: relPath,
      title: "VS Code task/launch mendefinisikan command",
      detail:
        "Task VS Code TIDAK berjalan otomatis (hanya bila user menjalankannya), " +
        "tapi catat command apa yang didefinisikan.",
      evidence: text.slice(0, 300).replace(/\s+/g, " ").trim(),
    },
  ];
}

export function auditDockerfile(relPath: string, text: string): AuditFinding[] {
  const out: AuditFinding[] = [];
  if (DOWNLOAD_RE.test(text)) {
    out.push({
      severity: "LOW",
      file: relPath,
      title: "Dockerfile mengunduh konten remote",
      detail:
        "Download terjadi saat docker build (bukan saat npm/composer install). " +
        "Catat URL-nya bila kamu me-build image ini.",
      evidence: evidenceOf(text, text.search(DOWNLOAD_RE)),
    });
  }
  if (/\b(ENTRYPOINT|CMD)\b.*\b(sh|bash|powershell)\b/i.test(text)) {
    out.push({
      severity: "LOW",
      file: relPath,
      title: "Entrypoint/container menjalankan shell",
      detail: "Normal untuk image aplikasi — catat bila dikombinasikan dengan temuan lain.",
      evidence: evidenceOf(text, text.search(/ENTRYPOINT|CMD/i)),
    });
  }
  return out;
}

/** Aturan file mana yang diambil dari arsip untuk diaudit. */
export function wantAuditFile(relPath: string): boolean {
  const p = relPath.toLowerCase();
  if (p === "package.json" || p.endsWith("/package.json")) return true;
  if (p === "composer.json" || p.endsWith("/composer.json")) return true;
  if (p.startsWith(".github/workflows/") && (p.endsWith(".yml") || p.endsWith(".yaml"))) return true;
  if (p === ".vscode/tasks.json" || p === ".vscode/launch.json") return true;
  if (/(^|\/)dockerfile[^/]*$/.test(p)) return true;
  const base = p.split("/").pop() ?? "";
  if (base === "docker-compose.yml" || base === "compose.yml" || base === "compose.yaml") return true;
  return false;
}

/** Jalankan semua rule ke file hasil ekstrak. File binari dilewati diam-diam. */
export function auditExtractedFiles(files: TarEntry[]): AuditFinding[] {
  const out: AuditFinding[] = [];
  for (const f of files) {
    if (!isTextLike(f.data)) continue;
    const text = f.data.toString("utf8");
    const lower = f.name.toLowerCase();
    const base = lower.split("/").pop() ?? "";
    if (base === "package.json") out.push(...auditPackageJson(f.name, text));
    else if (base === "composer.json") out.push(...auditComposerJson(f.name, text));
    else if (lower.startsWith(".github/workflows/")) out.push(...auditWorkflow(f.name, text));
    else if (lower === ".vscode/tasks.json" || lower === ".vscode/launch.json") {
      out.push(...auditVscode(f.name, text));
    } else out.push(...auditDockerfile(f.name, text));
  }
  return out;
}

// ---------------------------------------------------------------------------
// Audit penuh satu repo remote: unduh → ekstrak subset → rule.
// ---------------------------------------------------------------------------

export interface RemoteAuditResult {
  report: AuditReport;
  /** false bila repo bukan GitHub / arsip gagal diakses (lapor jujur). */
  remoteInspectable: boolean;
}

export async function auditRemoteRepo(repoUrl: string): Promise<RemoteAuditResult> {
  const parsed = parseGitHubRepo(repoUrl);
  const label = parsed ? `${parsed.owner}/${parsed.repo}` : repoUrl;
  if (!parsed) {
    return {
      remoteInspectable: false,
      report: {
        repo: label,
        inspected: [],
        notInspectable: [
          "Bukan repository GitHub https — audit remote hanya mendukung GitHub. Lanjutkan dengan pemeriksaan manual.",
        ],
        findings: [],
      },
    };
  }
  const { tar, ref } = await downloadRepoTarball(parsed.owner, parsed.repo);
  const entries = extractTarFiles(tar, wantAuditFile);
  const findings = auditExtractedFiles(entries);
  const report: AuditReport = {
    repo: `${label} (ref: ${ref})`,
    inspected: entries.map((e) => e.name),
    notInspectable: [
      "Metadata .git (config/hooks) tidak tersedia sebelum clone — diperiksa di audit lokal tahap 2.",
    ],
    findings,
  };
  return { remoteInspectable: true, report };
}

// ---------------------------------------------------------------------------
// Render laporan (Bahasa Indonesia). Tanpa klaim absolut ("100% aman" DILARANG).
// ---------------------------------------------------------------------------

const SEV_ORDER: Severity[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"];
const SEV_ICON: Record<Severity, string> = {
  CRITICAL: "⛔",
  HIGH: "⚠",
  MEDIUM: "•",
  LOW: "•",
  INFO: "•",
};

export function highestSeverity(findings: AuditFinding[]): Severity | null {
  let top: Severity | null = null;
  for (const f of findings) {
    if (!top || SEV_ORDER.indexOf(f.severity) < SEV_ORDER.indexOf(top)) top = f.severity;
  }
  return top;
}

export function renderAuditReport(report: AuditReport): string[] {
  const lines: string[] = [];
  lines.push("ScaffDev Security Audit");
  lines.push("");
  lines.push(`Repository: ${report.repo}`);
  lines.push("");
  if (report.inspected.length === 0) {
    lines.push("Tidak ada file yang bisa diinspeksi remote.");
  } else {
    lines.push(`Diperiksa (${report.inspected.length} file): ${report.inspected.join(", ")}`);
  }
  for (const note of report.notInspectable) lines.push(`Catatan: ${note}`);
  lines.push("");
  const top = highestSeverity(report.findings);
  if (!top) {
    lines.push("✓ Tidak ada temuan berisiko terdeteksi.");
  } else {
    const counts = new Map<Severity, number>();
    for (const f of report.findings) counts.set(f.severity, (counts.get(f.severity) ?? 0) + 1);
    lines.push(
      `Hasil: ${SEV_ORDER.filter((s) => counts.has(s))
        .map((s) => `${s}: ${counts.get(s)}`)
        .join(" | ")}`
    );
    lines.push("");
    const ordered = [...report.findings].sort(
      (a, b) => SEV_ORDER.indexOf(a.severity) - SEV_ORDER.indexOf(b.severity)
    );
    for (const f of ordered) {
      lines.push(`${SEV_ICON[f.severity]} [${f.severity}] ${f.title}`);
      lines.push(`  File: ${f.file}`);
      lines.push(`  Risiko: ${f.detail}`);
      if (f.evidence) lines.push(`  Bukti: ${f.evidence}`);
      lines.push("");
    }
  }
  lines.push("Audit ini adalah static analysis dan TIDAK menjamin repository 100% aman.");
  return lines;
}

// ---------------------------------------------------------------------------
// Gate interaktif: dipakai SEMUA entry point sebelum git clone.
// Return { proceed }: true = lanjut clone; false = berhenti.
// Cancel (Ctrl+C) = berhenti (tidak clone).
// ---------------------------------------------------------------------------

export async function runSecurityGate(opts: {
  repoUrl: string;
  /** Label untuk prompt, mis. 'template' atau 'modul integrasi'. */
  kindLabel: string;
}): Promise<{ proceed: boolean; audited: boolean }> {
  const ask = await p.confirm({
    message:
      `Sebelum meng-clone ${opts.kindLabel} ini, ScaffDev dapat melakukan audit\n` +
      `keamanan dasar (script install, download remote, eksekusi command,\n` +
      `payload ter-obfuscate). Ini cek statis, bukan jaminan 100% aman.\n\n` +
      `Jalankan security audit sebelum cloning?`,
    initialValue: true,
  });
  if (p.isCancel(ask)) {
    p.cancel("Operasi dibatalkan.");
    return { proceed: false, audited: false };
  }
  if (!ask) {
    p.note(
      "Security audit dilewati.\nScaffdev tidak dapat memeriksa repository ini sebelum cloning.",
      "Peringatan"
    );
    const go = await p.confirm({
      message: "Lanjut tanpa security audit?",
      initialValue: false,
    });
    if (p.isCancel(go) || !go) {
      p.cancel("Operasi dibatalkan.");
      return { proceed: false, audited: false };
    }
    p.log.info("Melanjutkan tanpa security audit...");
    return { proceed: true, audited: false };
  }

  const spin = p.spinner();
  spin.start("Mengunduh arsip repository untuk audit statis...");
  let result: RemoteAuditResult;
  try {
    result = await auditRemoteRepo(opts.repoUrl);
  } catch (err) {
    spin.stop("Audit gagal.");
    p.log.error((err as Error).message ?? "Audit gagal.");
    const go = await p.confirm({
      message: "Audit tidak bisa berjalan. Lanjut tanpa hasil audit?",
      initialValue: false,
    });
    if (p.isCancel(go) || !go) {
      p.cancel("Operasi dibatalkan.");
      return { proceed: false, audited: false };
    }
    return { proceed: true, audited: false };
  }
  spin.stop("Audit selesai.");
  for (const line of renderAuditReport(result.report)) console.log(line);

  const top = highestSeverity(result.report.findings);
  const risky = top === "HIGH" || top === "CRITICAL";
  const go = await p.confirm({
    message: risky
      ? "Ditemukan temuan berisiko tinggi. Tetap lanjutkan cloning?"
      : "Lanjutkan cloning?",
    initialValue: !risky,
  });
  if (p.isCancel(go) || !go) {
    p.cancel("Operasi dibatalkan.");
    return { proceed: false, audited: false };
  }
  return { proceed: true, audited: true };
}

// ---------------------------------------------------------------------------
// Post-clone: audit lokal .git/config + hooks (file SUDAH tersedia lokal).
// Tidak mengeksekusi hook apa pun. Return findings (kosong = bersih).
// ---------------------------------------------------------------------------

const RISKY_GIT_KEYS = [
  "core.hookspath",
  "core.fsmonitor",
  "core.pager",
  "core.sshcommand",
  "credential.helper",
  "core.editor",
];

export function auditGitConfig(configText: string): AuditFinding[] {
  const out: AuditFinding[] = [];
  const lines = configText.split("\n");
  let section = "";
  for (const raw of lines) {
    const line = raw.trim();
    const sec = line.match(/^\[(.+)\]$/);
    if (sec) {
      section = (sec[1] ?? "").toLowerCase();
      continue;
    }
    const kv = line.match(/^([A-Za-z0-9_.-]+)\s*=\s*(.+)$/);
    if (!kv || line.startsWith("#") || line.startsWith(";")) continue;
    const key = `${section} ${kv[1] ?? ""}`.trim().toLowerCase();
    const value = (kv[2] ?? "").trim();
    if (RISKY_GIT_KEYS.some((rk) => key === rk || key.endsWith(` ${rk.split(".").pop()}`))) {
      out.push({
        severity: "MEDIUM",
        file: ".git/config",
        title: `Konfigurasi git tidak standar: ${kv[1]}`,
        detail:
          `Nilai "${value}" mengubah perilaku git (hook path, pager, SSH, atau ` +
          `credential). Bisa sah, tapi wajib dibaca sebelum install dependency.`,
        evidence: `${section} / ${kv[1]} = ${value}`.slice(0, 300),
      });
    }
    if (section === "alias" && /!/.test(value)) {
      out.push({
        severity: "MEDIUM",
        file: ".git/config",
        title: `Git alias mengeksekusi shell: ${kv[1]}`,
        detail: "Alias diawali '!' menjalankan shell — tidak otomatis berjalan, tapi catat.",
        evidence: `${kv[1]} = ${value}`.slice(0, 300),
      });
    }
    if (/diff.*external|merge.*driver|filter.*(clean|smudge|process)/i.test(`${section} ${line}`)) {
      out.push({
        severity: "MEDIUM",
        file: ".git/config",
        title: "Git memakai driver/filter eksternal",
        detail: "Driver diff/merge atau clean/smudge filter menjalankan program eksternal saat git beroperasi.",
        evidence: line.slice(0, 300),
      });
    }
  }
  return out;
}

export function auditGitHooksDir(gitDir: string): AuditFinding[] {
  const out: AuditFinding[] = [];
  const hooksDir = path.join(gitDir, "hooks");
  let entries: string[] = [];
  try {
    entries = fs.readdirSync(hooksDir);
  } catch {
    return out;
  }
  for (const name of entries) {
    if (name.endsWith(".sample")) continue;
    const full = path.join(hooksDir, name);
    let stat: fs.Stats;
    try {
      stat = fs.statSync(full);
    } catch {
      continue;
    }
    if (!stat.isFile()) continue;
    out.push({
      severity: "MEDIUM",
      file: `.git/hooks/${name}`,
      title: `Git hook aktif: ${name}`,
      detail:
        "Hook BERJALAN saat operasi git tertentu (commit, checkout, dll) — bukan " +
        "saat install. Jangan jalankan manual untuk memeriksanya; baca isinya.",
      evidence: `ukuran ${(stat.size / 1024).toFixed(1)} KB`,
    });
  }
  return out;
}

/** Audit lokal penuh direktori .git hasil clone. */
export function auditLocalGitDir(projectDir: string): AuditFinding[] {
  const out: AuditFinding[] = [];
  const gitDir = path.join(projectDir, ".git");
  const cfgPath = path.join(gitDir, "config");
  if (fs.existsSync(cfgPath)) {
    try {
      out.push(...auditGitConfig(fs.readFileSync(cfgPath, "utf8")));
    } catch {
      // Tidak terbaca = lewati, jangan gagalkan flow.
    }
  }
  out.push(...auditGitHooksDir(gitDir));
  return out;
}

/** Simpan sementara folder .git hasil clone ke trash agar bisa di-restore. */
export function parkGitDir(projectDir: string): string | null {
  const gitDir = path.join(projectDir, ".git");
  if (!fs.existsSync(gitDir)) return null;
  const parked = fs.mkdtempSync(path.join(os.tmpdir(), "scaff-git-"));
  const dest = path.join(parked, ".git");
  fs.cpSync(gitDir, dest, { recursive: true });
  fs.rmSync(gitDir, { recursive: true, force: true });
  return dest;
}

/** Kembalikan folder .git yang di-parkir (dipakai bila user membatalkan). */
export function restoreGitDir(projectDir: string, parkedGitDir: string | null): void {
  if (!parkedGitDir || !fs.existsSync(parkedGitDir)) return;
  const gitDir = path.join(projectDir, ".git");
  if (!fs.existsSync(gitDir)) {
    fs.cpSync(parkedGitDir, gitDir, { recursive: true });
  }
}
