import * as p from "@clack/prompts";

/**
 * Progress 1-baris: animasi spinner di terminal normal, baris statis di
 * terminal yang tidak mendukung animasi (Git Bash/MINGW, pipe, CI).
 *
 * Latar: spinner clack menimpa baris yang sama via carriage return.
 * Git Bash (mintty/MSYSTEM) tidak menanganinya → tiap frame jadi baris baru
 * (ratusan baris `•/o/0` saat clone lama). Mode statis hanya mencetak 1 baris
 * saat selesai (+ pesan error lengkap bila gagal), sehingga output selalu rapi.
 * Override paksa: SCAFF_NO_ANIM=1 (statis) — berguna untuk log file/CI.
 */
export interface Progress {
  /** Perbarui teks berjalan. No-op di mode statis (anti-spam). */
  message(text: string): void;
  /** Selesai: 1 baris final. Di mode statis ini SATU-SATUNYA baris yang dicetak. */
  stop(text: string): void;
}

function useAnimation(): boolean {
  if (process.env.SCAFF_NO_ANIM === "1") return false;
  if (!process.stdout.isTTY) return false;
  // Git Bash = pty (isTTY true) tapi \r-nya bocor jadi baris baru.
  if (typeof process.env.MSYSTEM === "string" && process.env.MSYSTEM !== "") return false;
  return true;
}

export function startProgress(text: string): Progress {
  if (useAnimation()) {
    const s = p.spinner();
    s.start(text);
    return {
      message: (t: string) => s.message(t),
      stop: (t: string) => s.stop(t),
    };
  }
  let done = false;
  return {
    message: () => {
      /* mode statis: diam sampai selesai */
    },
    stop: (t: string) => {
      if (done) return;
      done = true;
      p.log.success(t);
    },
  };
}

/**
 * Nama pendek repo untuk teks progress (tanpa URL panjang).
 * "https://github.com/scaffdev/scaff-modul-midtrans.git"
 * → "scaffdev/scaff-modul-midtrans". URL asing dikembalikan apa adanya.
 */
export function shortRepo(url: string): string {
  const clean = url.trim().replace(/\.git$/, "");
  const m = clean.match(/github\.com\/([^/]+\/[^/]+)\/?$/i);
  return m?.[1] ? m[1] : url.trim();
}
