/**
 * Konfigurasi AI terpusat (dipakai endpoint asisten admin & halaman Pengaturan).
 * Override lewat env: GROQ_MODEL. Nilai default sesuai keputusan produk.
 */
export const DEFAULT_GROQ_MODEL = "qwen/qwen3.8-27b";

export function resolveGroqModel(): string {
  return process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL;
}
