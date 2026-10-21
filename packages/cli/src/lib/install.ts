import fs from "fs";
import path from "path";
import { execa } from "execa";

export interface InstallStep {
  dir: string;
  run: string[];
  label: string;
}

export interface InstallPlanResult {
  steps: InstallStep[];
  fromManifest: boolean;
}

/**
 * Susun rencana install dari scaff.template.json base.
 * Format: "install": [{ "dir": ".", "run": ["npm","install"], "label": "..." }].
 * Tanpa field install → fallback default framework (template lama tetap jalan).
 * Manager BEBAS (npm/pnpm/yarn/bun/composer/...). CLI generik, tidak hardcode.
 */
export async function resolveInstallPlan(projectDir: string, framework: string, preferPnpm?: boolean): Promise<InstallPlanResult> {
  const manifestPath = path.join(projectDir, "scaff.template.json");
  if (fs.existsSync(manifestPath)) {
    try {
      const raw = JSON.parse(fs.readFileSync(manifestPath, "utf-8")) as {
        install?: { dir?: unknown; run?: unknown; label?: unknown }[];
      };
      if (Array.isArray(raw.install) && raw.install.length > 0) {
        const steps: InstallStep[] = [];
        for (const [i, item] of raw.install.entries()) {
          if (typeof item !== "object" || item === null) {
            throw new Error(`install[${i}] harus object {dir, run}.`);
          }
          const dir = typeof item.dir === "string" ? item.dir.trim() : "";
          const run = Array.isArray(item.run)
            ? item.run.filter((x): x is string => typeof x === "string").map((x) => x.trim()).filter(Boolean)
            : [];
          if (!dir || run.length === 0) {
            throw new Error(`install[${i}] wajib berisi "dir" dan "run" non-kosong.`);
          }
          if (dir.includes("..") || path.isAbsolute(dir)) {
            throw new Error(`install[${i}].dir tidak boleh keluar project ("${dir}").`);
          }
          const abs = path.join(projectDir, dir);
          if (!fs.existsSync(abs) || !fs.statSync(abs).isDirectory()) {
            throw new Error(`install[${i}].dir tidak ada di project: "${dir}".`);
          }
          steps.push({
            dir,
            run,
            label: typeof item.label === "string" && item.label.trim() ? item.label.trim() : run.join(" ") + ` (di ${dir})`,
          });
        }
        return { steps, fromManifest: true };
      }
    } catch (err) {
      throw new Error(`Gagal membaca install plan: ${(err as Error).message}`);
    }
  }

  // Fallback framework (template lama tanpa manifest/sebelumnya).
  const isLaravel = framework.toLowerCase() === "laravel";
  
  if (isLaravel) {
    return {
      fromManifest: false,
      steps: [
        {
          dir: ".",
          run: ["composer", "install"],
          label: "composer install",
        },
      ],
    };
  }
  
  // Default npm, kecuali user prefer pnpm
  if (preferPnpm) {
    return {
      fromManifest: false,
      steps: [
        {
          dir: ".",
          run: ["pnpm", "install"],
          label: "pnpm install (3-5x lebih cepat dari npm)",
        },
      ],
    };
  }
  
  return {
    fromManifest: false,
    steps: [
      {
        dir: ".",
        run: ["npm", "install"],
        label: "npm install",
      },
    ],
  };
}

async function binaryExists(bin: string): Promise<boolean> {
  try {
    const cmd = process.platform === "win32" ? "where" : "which";
    await execa(cmd, [bin]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Install pnpm globally jika belum ada.
 * Return true jika berhasil install/sudah ada, false jika gagal.
 */
export async function ensurePnpm(): Promise<{ ok: boolean; message: string }> {
  // Cek apakah pnpm sudah terinstall
  if (await binaryExists("pnpm")) {
    return { ok: true, message: "pnpm sudah terinstall" };
  }

  // Auto-install pnpm via npm
  try {
    console.log("\n📦 pnpm belum terinstall. Menginstall pnpm secara otomatis...\n");
    await execa("npm", ["install", "-g", "pnpm"], { stdio: "inherit" });
    
    // Verify install success
    if (await binaryExists("pnpm")) {
      return { ok: true, message: "pnpm berhasil diinstall" };
    } else {
      return { ok: false, message: "pnpm gagal diinstall (binary tidak ditemukan setelah install)" };
    }
  } catch (err) {
    return { 
      ok: false, 
      message: `Gagal menginstall pnpm: ${(err as Error).message}` 
    };
  }
}

export interface InstallOutcome {
  ran: { label: string; dir: string }[];
  skipped: { label: string; dir: string; reason: string }[];
  failed: { label: string; dir: string; error: string } | null;
}

/**
 * Jalankan install plan berurutan dengan output live.
 * Gagal satu langkah = BERHENTI tapi project tetap valid (user lanjut manual).
 */
export async function runInstallPlan(projectDir: string, steps: InstallStep[]): Promise<InstallOutcome> {
  const outcome: InstallOutcome = { ran: [], skipped: [], failed: null };
  for (const step of steps) {
    const [bin, ...args] = step.run;
    if (!bin) continue;
    if (!(await binaryExists(bin))) {
      outcome.skipped.push({
        label: step.label,
        dir: step.dir,
        reason:
          `"${bin}" tidak ditemukan di komputer ini.` +
          (bin === "pnpm" ? " Aktifkan via `corepack enable`, lalu jalankan manual." : " Jalankan manual."),
      });
      continue;
    }
    try {
      await execa(bin, args, { cwd: path.join(projectDir, step.dir), stdio: "inherit" });
      outcome.ran.push({ label: step.label, dir: step.dir });
    } catch (err) {
      outcome.failed = { label: step.label, dir: step.dir, error: (err as Error).message.split("\n")[0] ?? "unknown error" };
      break;
    }
  }
  return outcome;
}
