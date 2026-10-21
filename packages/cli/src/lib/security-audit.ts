/**
 * Audit keamanan CLI: re-export mesin audit dari @scaff/security-audit,
 * ditambah gate interaktif dan pemeriksaan .git setelah clone.
 *
 * Mesin remote tetap satu sumber (package bersama) agar aturan CLI dan admin
 * tidak berbeda. Tidak ada kode repository yang dieksekusi.
 */
import fs from "fs";
import os from "os";
import path from "path";
import * as p from "@clack/prompts";
import {
  auditRemoteRepo,
  highestSeverity,
  renderAuditReport,
  type AuditFinding,
  type RemoteAuditResult,
} from "@scaff/security-audit";

export * from "@scaff/security-audit";

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
        detail: "Alias diawali '!' menjalankan shell, tidak otomatis berjalan, tapi catat.",
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
        "Hook BERJALAN saat operasi git tertentu (commit, checkout, dll), bukan " +
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
