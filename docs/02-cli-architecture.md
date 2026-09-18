# 02 — CLI Architecture

## Tujuan File Ini
Menjelaskan struktur, alur kerja, dan aturan pengembangan untuk `packages/cli` — package yang dipublish ke npm dan dijalankan di komputer user.

## Struktur Folder
```
packages/cli/
├── src/
│   ├── index.ts              → entry point utama, parsing argumen & orchestration
│   ├── commands/
│   │   ├── create.ts         → logic untuk command generate project
│   │   └── list.ts           → logic untuk menampilkan daftar template tersedia
│   ├── lib/
│   │   ├── api-client.ts     → fungsi fetch ke API backend (resolve slug → repo_url)
│   │   ├── git.ts            → wrapper untuk git clone (pakai execa)
│   │   ├── prerequisite-check.ts → cek Node.js/Composer terinstall sebelum proses
│   │   └── prompts.ts        → definisi interactive prompt (pakai @clack/prompts)
│   └── types.ts              → TypeScript types (Template, ApiResponse, dll)
├── dist/                      → HASIL COMPILE OTOMATIS, jangan edit manual, jangan commit ke git (masuk .gitignore)
├── package.json
├── tsconfig.json
└── .npmignore
```

## Dua Mode Akses (WAJIB DIDUKUNG KEDUANYA)

### Mode 1 — Sekali Pakai (`npx`)
```bash
npx scaffdev@latest --template=ecommerce-basic-nextjs
```
Tidak perlu instalasi permanen. `npx` mengunduh versi terbaru dari npm registry setiap kali dipanggil.

### Mode 2 — Install Permanen (Global)
```bash
npm install -g scaffdev
scaffdev                                    # interactive prompt
scaffdev my-app --template=ecommerce-basic-nextjs
```
Setelah instalasi, command `scaffdev` bisa dipanggil kapan saja. Tanpa argumen, CLI menampilkan interactive prompt; dengan flag `--template=<slug>` (dan opsional nama folder), project langsung di-generate.

## Alur Kerja `index.ts` (Logic Utama)

1. **Parsing argumen** — baca `process.argv`, cek apakah ada flag `--template=slug`. Jika ada, langsung lanjut ke step 3. Jika tidak ada, lanjut ke step 2.
2. **Interactive prompt** (jika tidak ada flag):
   - Tampilkan visual banner menggunakan `intro()`.
   - Gunakan `spinner()` saat memanggil `GET /api/templates` (endpoint publik yang sama dipakai web builder, lihat `04-api-backend-architecture.md`) untuk mengambil daftar template aktif secara real-time. TIDAK BOLEH hardcode daftar template di kode CLI (konsisten dengan `07-template-slug-system.md`).
   - Prompt 1 (`select()`): Pilih kategori (`ecommerce`, `landing-page`, `portfolio`) dengan label dan hint deskripsi singkat.
    - Prompt 2 (`select()`): Pilih framework yang tersedia untuk kategori tersebut berdasarkan data API (Next.js dan/atau Laravel — opsi Laravel hanya muncul jika sudah ada template Laravel terdaftar).
   - Prompt 3 (`select()`): Pilih varian/kombinasi template (menampilkan badge integrasi pada label).
   - Prompt 4 (`text()`): Masukkan nama folder target project dengan validasi input.
   - Pada setiap prompt, gunakan `isCancel()` dan `cancel()` untuk menangani pembatalan (Ctrl+C) secara anggun.
   - Tampilkan ringkasan konfigurasi pilihan sebelum eksekusi menggunakan `note()`.
   - Hasil akhir dari alur ini berupa satu `slug` dan nama folder tujuan.
3. **Pengecekan prasyarat** — jika framework yang dipilih Laravel, jalankan `composer --version` via `execa` untuk memastikan Composer terinstall. Jika framework Next.js, cek `node --version`. Jika tidak ditemukan, tampilkan pesan error jelas dengan link download, lalu hentikan proses (jangan lanjut ke step berikutnya).
4. **Resolve slug ke data lengkap template** — panggil `GET /api/templates/:slug` ke API backend (lihat `04-api-backend-architecture.md`). Response ini SUDAH menyertakan `repo_url` DAN detail lengkap tiap integrasi (`daftar_env_var`, `instruksi_setup`) dalam satu kali request — CLI TIDAK PERLU memanggil endpoint integrasi secara terpisah per item.
5. **Clone repository** — jalankan `git clone [repo_url] [nama-folder]` via `execa` dengan animasi `spinner()`.
6. **Generate `.env.example`** — gabungkan `daftar_env_var` dari seluruh objek `integrasi` yang sudah didapat di step 4, tulis ke file `.env.example` di dalam folder project yang baru di-clone.
7. **Generate `SETUP.md`** — sama seperti step 6, gabungkan `instruksi_setup` dari seluruh objek `integrasi` ke satu file panduan.
8. **Tampilkan pesan sukses** — tampilkan kotak ucapan sukses menggunakan `outro()`, berisi langkah selanjutnya bagi user ("cd ke folder, npm install, baca SETUP.md, npm run dev").

## Command yang Dijalankan Sebagai Child Process (via `execa`)
- `git clone [url] [folder]`
- `composer create-project ...` (khusus jika framework Laravel — lihat `09-multi-framework-support.md`)
- Perintah lain TIDAK boleh dieksekusi tanpa dicatat di file ini terlebih dahulu — semua child process yang dijalankan CLI harus terdokumentasi eksplisit di sini agar prosesnya transparan dan bisa diaudit.

## Aturan Wajib untuk Developer/AI Agent yang Mengerjakan CLI
- **TIDAK BOLEH** menyimpan daftar template secara hardcoded di dalam kode CLI. Semua data template HARUS diambil dari API secara real-time. Ini prinsip inti supaya penambahan template baru tidak memerlukan republish CLI (lihat `07-template-slug-system.md`).
- **TIDAK BOLEH** menyimpan credential/API key apapun di dalam kode CLI.
- Semua pesan yang ditampilkan ke user harus dalam Bahasa Indonesia yang jelas, termasuk pesan error.
- Setiap perubahan pada `src/` WAJIB diikuti `pnpm build` (dari dalam `packages/cli/`) sebelum publish (lihat `11-npm-publishing-guide.md`).

## Dependency Utama
- `execa` — menjalankan child process
- `@clack/prompts` — interactive CLI prompt
- `tsup` — compile TypeScript ke JavaScript untuk `dist/`

## Referensi Silang
- Cara build & publish: `11-npm-publishing-guide.md`
- Cara kerja resolve slug secara detail: `07-template-slug-system.md`
- Format `.env.example` dan `SETUP.md`: `12-env-and-setup-doc-generation.md`
- Handling Laravel/Composer: `09-multi-framework-support.md`