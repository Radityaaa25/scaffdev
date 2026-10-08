import { execa } from "execa";
import fs from "fs";
import path from "path";

export async function cloneRepository(
  repoUrl: string,
  targetDir: string,
  keepGit = false
): Promise<void> {
  // Run git clone via execa
  await execa("git", ["clone", "--depth", "1", repoUrl, targetDir]);

  // Remove cloned .git so the user can start their own git repository cleanly.
  // keepGit = true menunda penghapusan untuk audit lokal post-clone;
  // pemanggil WAJIB menghapus setelah audit (lihat security-audit).
  if (keepGit) return;
  const gitFolder = path.join(targetDir, ".git");
  if (fs.existsSync(gitFolder)) {
    try {
      fs.rmSync(gitFolder, { recursive: true, force: true });
    } catch {
      // Ignore if windows locked
    }
  }
}
