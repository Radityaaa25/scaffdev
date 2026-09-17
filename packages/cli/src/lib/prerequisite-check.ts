import { execa } from "execa";

export async function checkPrerequisites(framework: string): Promise<{ ok: boolean; error?: string }> {
  if (framework.toLowerCase() === "laravel") {
    try {
      await execa("composer", ["--version"]);
      return { ok: true };
    } catch {
      return {
        ok: false,
        error:
          "PHP dan/atau Composer tidak ditemukan di komputer Anda.\nSilakan install Composer di https://getcomposer.org sebelum melanjutkan.",
      };
    }
  }

  // Next.js runtime check
  try {
    const { stdout } = await execa("node", ["--version"]);
    const match = stdout.match(/^v(\d+)/);
    if (match && match[1] && parseInt(match[1], 10) < 18) {
      return {
        ok: false,
        error: `Versi Node.js Anda (${stdout}) terlalu lama. Minimal dibutuhkan Node.js v18.0.0+. Silakan update di https://nodejs.org`,
      };
    }
    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "Node.js tidak ditemukan. Silakan install Node.js di https://nodejs.org",
    };
  }
}
