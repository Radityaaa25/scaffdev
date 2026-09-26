import { redirect } from "next/navigation";

/**
 * Sub-rute kategori bukan bagian alur Builder yang live
 * (alur: /builder → pilih base → centang → command).
 * Alihkan ke /builder agar tidak ada halaman buntu terindeks.
 */
export default async function BuilderKategoriPage() {
  redirect("/builder");
}
