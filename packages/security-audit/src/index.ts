/**
 * Mesin audit keamanan statis repository (remote) SEBELUM clone & install.
 *
 * Prinsip: AUDIT DULU, EKSEKUSI BELAKANGAN. Modul ini TIDAK PERNAH menjalankan
 * kode repository: hanya membaca bytes tarball GitHub.
 *
 * Dipakai bersama oleh CLI (gate sebelum clone) dan admin (review submission).
 * Audit lokal .git dan prompt interaktif tetap berada di package CLI.
 */
import zlib from "zlib";

export type Severity = "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface AuditFinding {
  severity: Severity;
  /** Path relatif di repo, mis. package.json */
  file: string;
  title: string;
  detail: string;
  /** Cuplikan bukti (dipotong; values tidak pernah ada di repo). */
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
 * ("owner-repo-sha/", "./", dsb: bentuknya beda antar hosting)
 * dihitung dari direktori awalan bersama SEMUA entri, bukan dari
 * entri pertama (rapuh bila arsip diawali header pax/metadata).
 */
export function extractTarFiles(
  tar: Buffer,
  want: (relPath: string) => boolean,
  maxFileBytes = 512 * 1024,
  maxFiles = 100
): TarEntry[] {
  interface RawEntry {
    name: string;
    size: number;
    dataStart: number;
    isFile: boolean;
  }
  const raws: RawEntry[] = [];
  let offset = 0;
  while (offset + 512 <= tar.length) {
    // Blok nol ganda = akhir arsip.
    if (tar.subarray(offset, offset + 512).every((b) => b === 0)) break;
    const name = readCString(tar, offset, 100);
    const size = parseOctal(tar, offset + 124, 12);
    const typeflag = String.fromCharCode(tar[offset + 156] || 0);
    const prefix = readCString(tar, offset + 345, 155);
    if (!name || Number.isNaN(size) || size < 0) break;
    const fullName = prefix ? `${prefix}/${name}` : name;
    const dataStart = offset + 512;
    const dataEnd = dataStart + size;
    if (dataEnd > tar.length) break;
    const isFile = typeflag === "0" || typeflag === "\0";
    if (!name) break;
    // Entri non-reguler (direktori, symlink/hardlink, pax/metadata) DILEWATI,
    // BUKAN menghentikan scan: satu symlink biasa tak boleh mematikan audit dan
    // membuat file setelahnya (mis. package.json) lolos tanpa diperiksa.
    raws.push({ name: fullName, size, dataStart, isFile });
    // Maju ke header berikutnya (data dibulatkan ke kelipatan 512).
    offset = dataStart + Math.ceil(size / 512) * 512;
  }
  // Normalisasi "./x" -> "x", lalu kupas direktori awalan bersama.
  // Hanya entri ber-slash yang dihitung (header pax_global_header diabaikan).
  const norm = raws.map((r) => (r.name.startsWith("./") ? r.name.slice(2) : r.name));
  const slashed = norm.filter((n) => n.includes("/"));
  let common = "";
  if (slashed.length > 0) {
    const first = slashed[0] ?? "";
    const candidate = first.slice(0, first.indexOf("/") + 1);
    if (candidate && slashed.every((n) => n.startsWith(candidate))) common = candidate;
  }
  const out: TarEntry[] = [];
  for (let i = 0; i < raws.length && out.length < maxFiles; i++) {
    const r = raws[i];
    if (!r || !r.isFile) continue;
    const rawName = norm[i] ?? "";
    const rel = common && rawName.startsWith(common) ? rawName.slice(common.length) : rawName;
    if (!rel || !want(rel)) continue;
    if (r.size <= maxFileBytes) {
      out.push({ name: rel, data: tar.subarray(r.dataStart, r.dataStart + r.size) });
    }
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
 * Unduh tarball branch/ref repo. Tanpa ref: pakai default branch (1 call API).
 * Dengan ref: langsung ke codeload (tanpa call API). Dipakai QA fixture
 * per-branch dan kasus ref eksplisit lainnya.
 */
export async function downloadRepoTarball(
  owner: string,
  repo: string,
  ref?: string
): Promise<{ tar: Buffer; ref: string }> {
  const token = process.env.GITHUB_TOKEN?.trim();
  // Ref eksplisit (mis. branch fixture): langsung ke codeload tanpa call API.
  if (ref) {
    return { tar: await fetchTarball(owner, repo, ref, token), ref };
  }
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
  const resolvedRef = info.default_branch || "main";
  return { tar: await fetchTarball(owner, repo, resolvedRef, token), ref: resolvedRef };
}

/** Unduh + gunzip arsip codeload untuk ref tertentu (tanpa API call). */
async function fetchTarball(
  owner: string,
  repo: string,
  ref: string,
  token?: string
): Promise<Buffer> {
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
        `(${(TARBALL_MAX_BYTES / 1048576).toFixed(0)} MB). Audit dibatalkan. Periksa manual.`
    );
  }
  let tar: Buffer;
  try {
    tar = zlib.gunzipSync(gz);
  } catch {
    throw new Error("Arsip bukan gzip valid. Audit dibatalkan.");
  }
  return tar;
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
  // Event composer yang JUGA berjalan saat `composer install`:
  // `post-autoload-dump` ada di composer.json Laravel default, sisanya wajar dipakai.
  "pre-autoload-dump",
  "post-autoload-dump",
  "post-root-package-install",
  "post-create-project-cmd",
  "pre-package-install",
  "post-package-install",
  "pre-package-update",
  "post-package-update",
];
const DOWNLOAD_RE =
  /\b(curl|wget|Invoke-WebRequest|\biwr\b|Start-BitsTransfer|certutil|bitsadmin)\b/i;
const PIPE_EXEC_RE = /(curl|wget)[^\n]{0,200}\|\s*(bash|sh)\b/i;
const PS_ENCODED_RE = /powershell[^\n]{0,200}-(EncodedCommand|enc)\b/i;
const OBFUSC_RE = /\b(base64|atob|Buffer\.from|fromCharCode|EncodedCommand|eval\s*\(|Function\s*\()/;
const EVAL_EXEC_RE = /\b(eval\s*\(|exec\s*\(|Function\s*\()/;
// Lifecycle script yang menyembunyikan payload di file repo terpisah:
// `node scripts/setup.js`, `php artisan ...` (tak ber-ekstensi diabaikan),
// `sh ./x.sh`, dst. Bukan otomatis jahat, tapi file itu WAJIB dibaca.
const LOCAL_SCRIPT_REF_RE =
  /\b(node|php|python3?|sh|bash|zsh|tsx|ts-node|deno)\b[^\n]*?([\w./-]*\/)?[\w.-]+\.(js|mjs|cjs|ts|tsx|php|sh|bash|py|rb)\b/i;

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
        detail: "File tidak bisa dibaca: audit script dilewati untuk file ini.",
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
    } else if (LOCAL_SCRIPT_REF_RE.test(body)) {
      out.push({
        severity: "MEDIUM",
        file: relPath,
        title: `Lifecycle script "${name}" menjalankan file di dalam repo`,
        detail:
          "Script ini berjalan OTOMATIS saat npm install lalu memanggil file terpisah " +
          "di repo (bukan isinya langsung terlihat di sini). Baca file tersebut sebelum lanjut.",
        evidence: `${name}: ${body}`.slice(0, 300),
      });
    } else {
      out.push({
        severity: "MEDIUM",
        file: relPath,
        title: `Lifecycle script "${name}" terdeteksi`,
        detail:
          "Script ini berjalan otomatis saat npm install dan BISA menjalankan " +
          "perintah apa pun. Bukan otomatis jahat , tapi wajib dibaca isinya.",
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
          detail: `Spesifikasi "${spec}" mengambil kode dari luar npm: periksa sumbernya.`,
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
        detail: "File tidak bisa dibaca: audit script dilewati untuk file ini.",
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
    } else if (LOCAL_SCRIPT_REF_RE.test(body)) {
      out.push({
        severity: "MEDIUM",
        file: relPath,
        title: `Composer script "${name}" menjalankan file di dalam repo`,
        detail:
          "Script ini berjalan OTOMATIS saat composer install/update lalu memanggil file " +
          "terpisah di repo. Baca file tersebut sebelum lanjut.",
        evidence: `${name}: ${body}`.slice(0, 300),
      });
    } else {
      out.push({
        severity: "MEDIUM",
        file: relPath,
        title: `Composer script "${name}" terdeteksi`,
        detail:
          "Script ini berjalan otomatis saat composer install/update dan BISA " +
          "menjalankan perintah apa pun. Bukan otomatis jahat , tapi wajib dibaca.",
        evidence: `${name}: ${body}`.slice(0, 300),
      });
    }
  }
  return out;
}

export function auditWorkflow(relPath: string, text: string): AuditFinding[] {
  const out: AuditFinding[] = [];
  // Bentuk blok (run: | atau folded run: >) maupun sebaris (run: <command>).
  const bodies: Array<{ body: string; at: number }> = [];
  const runBlocks = [...text.matchAll(/run:\s*[|>]-?\s*\n((?:[ \t]+[^\n]*\n?)+)/g)];
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
          "Secret GitHub Actions diteruskan ke curl/wget: pola eksfiltrasi kredensial. " +
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
      detail: "Workflow CI normal: hanya berjalan di CI, bukan saat install.",
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
      detail: "Normal untuk image aplikasi: catat bila dikombinasikan dengan temuan lain.",
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
  /** Branch/ref yang benar-benar diunduh; null untuk non-GitHub. */
  ref: string | null;
}

export async function auditRemoteRepo(repoUrl: string, opts?: { ref?: string }): Promise<RemoteAuditResult> {
  const parsed = parseGitHubRepo(repoUrl);
  const label = parsed ? `${parsed.owner}/${parsed.repo}` : repoUrl;
  if (!parsed) {
    return {
      remoteInspectable: false,
      ref: null,
      report: {
        repo: label,
        inspected: [],
        notInspectable: [
          "Bukan repository GitHub https: audit remote hanya mendukung GitHub. Lanjutkan dengan pemeriksaan manual.",
        ],
        findings: [],
      },
    };
  }
  const { tar, ref } = await downloadRepoTarball(parsed.owner, parsed.repo, opts?.ref);
  const entries = extractTarFiles(tar, wantAuditFile);
  const findings = auditExtractedFiles(entries);
  const report: AuditReport = {
    repo: `${label} (ref: ${ref})`,
    inspected: entries.map((e) => e.name),
    notInspectable: [
      "Metadata .git (config/hooks) tidak tersedia sebelum clone. Diperiksa di audit lokal tahap 2.",
    ],
    findings,
  };
  return { remoteInspectable: true, ref, report };
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
// Resolusi commit SHA (untuk menyimpan audit pada commit tertentu).
// ---------------------------------------------------------------------------

/** Ambil SHA commit dari ref/branch GitHub. Null bila tidak tersedia. */
export async function fetchCommitSha(
  owner: string,
  repo: string,
  ref: string,
  token = process.env.GITHUB_TOKEN?.trim()
): Promise<string | null> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "scaffdev-security-audit",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  try {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/commits/${ref
        .split("/")
        .map((part) => encodeURIComponent(part))
        .join("/")}`,
      { headers, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { sha?: unknown };
    return typeof data.sha === "string" && /^[a-f0-9]{40}$/i.test(data.sha)
      ? data.sha.toLowerCase()
      : null;
  } catch {
    return null;
  }
}
