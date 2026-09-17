# 09 — Multi-Framework Support

## Status untuk MVP
Hanya **Next.js** yang aktif/tersedia untuk digunakan user di MVP. Laravel didokumentasikan di sini sebagai desain arsitektur yang SUDAH DIPUTUSKAN caranya, untuk diimplementasikan setelah MVP Next.js selesai dan stabil.

## Keputusan Arsitektur: Satu CLI untuk Semua Framework (Opsi A)
CLI tetap berupa SATU package Node.js/npm untuk semua framework yang didukung. TIDAK dibuat CLI terpisah per framework (misalnya tidak ada package Composer/PHP terpisah).

**Alasan:** Satu titik masuk lebih sederhana untuk user — mereka tidak perlu install tool berbeda-beda tergantung framework yang dipilih.

## Cara Kerja untuk Laravel
Ketika `repo_url` yang di-resolve dari API menunjukkan template dengan `framework: "laravel"`, CLI (yang berjalan di Node.js) menjalankan command Composer sebagai **child process**, menggunakan library `execa`:

```ts
// Contoh konsep, bukan kode final
if (template.framework === 'laravel') {
  await execa('composer', ['create-project', '--prefer-dist', repoAsPackage, folderName]);
} else {
  await execa('git', ['clone', template.repo_url, folderName]);
}
```

Catatan: Untuk template Laravel yang disimpan sebagai template kustom (bukan `laravel/laravel` resmi), pendekatan yang lebih sesuai adalah tetap `git clone` dari repo GitHub yang sudah berisi struktur Laravel siap pakai (sama seperti Next.js), BUKAN `composer create-project` dari packagist. Composer baru dipanggil setelah clone, untuk `composer install` (memasang dependency PHP dari `composer.json` yang sudah ada di dalam repo template).

Alur untuk Laravel:
1. `git clone [repo_url] [folder]` — sama seperti Next.js
2. `cd [folder] && composer install` — dijalankan sebagai child process oleh CLI untuk memasang dependency PHP

## Pengecekan Prasyarat (WAJIB Sebelum Generate)
CLI HARUS memeriksa apakah tool yang dibutuhkan sudah terinstall di komputer user SEBELUM memulai proses clone, agar user tidak mendapat error di tengah proses.

| Framework | Command Pengecekan | Pesan Jika Tidak Ditemukan |
|---|---|---|
| Next.js | `node --version` | "Node.js tidak ditemukan. Install dulu di https://nodejs.org (minimal versi 18) sebelum melanjutkan." |
| Laravel | `composer --version` dan `php --version` | "PHP dan/atau Composer tidak ditemukan. Install Composer di https://getcomposer.org sebelum melanjutkan." |

Implementasi ada di `packages/cli/src/lib/prerequisite-check.ts` (lihat `02-cli-architecture.md`).

## Catatan UX di Web (Builder)
Halaman builder (`apps/web/app/builder/[kategori]/[framework]/page.tsx`) HARUS menampilkan badge/catatan prasyarat sesuai framework yang dipilih, sebelum user melihat command final. Contoh teks yang harus ditampilkan:
- Next.js dipilih: "✅ Pastikan Node.js v18+ sudah terinstall ([link download](https://nodejs.org))"
- Laravel dipilih: "✅ Pastikan PHP & Composer sudah terinstall ([link download Composer](https://getcomposer.org))"

## Registry Package — Tidak Perlu Packagist
Karena menggunakan Opsi A (satu CLI Node.js yang "menitipkan" perintah ke Composer), proyek ini TIDAK PERLU mendaftarkan apapun ke Packagist (registry Composer). Hanya perlu publish CLI ke npm registry (lihat `11-npm-publishing-guide.md`).

## Menambah Framework Baru di Masa Depan
Jika ingin menambah framework lain (mis. Vue, SvelteKit) di masa depan:
1. Tidak perlu membuat CLI baru — cukup tambahkan logic percabangan di `packages/cli/src/commands/create.ts` untuk command spesifik framework tersebut (jika ada tooling khusus selain `git clone`).
2. Tambahkan validasi prasyarat baru di `prerequisite-check.ts`.
3. Update dokumen ini dengan cara kerja framework baru tersebut.

## Referensi Silang
- Implementasi child process di CLI: `02-cli-architecture.md`
- Tampilan catatan prasyarat di web: `05-web-frontend-architecture.md`
