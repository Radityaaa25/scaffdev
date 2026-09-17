/**
 * Fungsi terpusat untuk pemanggilan API dari apps/admin ke apps/web.
 * Semua data (list, create, update, delete template) dipanggil lewat HTTP
 * ke apps/web/app/api/*, BUKAN punya API sendiri di admin.
 */

export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
}