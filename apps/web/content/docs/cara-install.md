---
title: Cara Install & Penggunaan CLI
description: Panduan lengkap memulai project baru menggunakan Scaff CLI via npx atau instalasi global.
order: 2
section: Mulai
---

# Cara Install & Penggunaan CLI

Scaff menyediakan CLI modern dan cepat untuk men-generate starter kit project lengkap dengan tampilan visual siap pakai dalam hitungan detik. Panduan ini mencakup prasyarat, dua mode pemakaian (`npx` vs global), mode interaktif vs slug langsung, langkah pasca-generate per framework, dan apa yang terjadi di balik layar saat generate.

## Prasyarat Sistem

Sebelum menjalankan Scaff CLI, pastikan perangkatmu memenuhi prasyarat berikut:

### 1. Node.js v18.0.0 atau lebih baru (wajib untuk semua mode)

CLI Scaffdev sendiri berjalan di atas Node.js, jadi ini wajib walau kamu memilih template Laravel. Cek versimu:

```bash
node --version
```

Harus keluar `v18.x.x` atau lebih baru. Kalau belum ada atau terlalu lama, unduh di [nodejs.org](https://nodejs.org) (pilih LTS). Setelah install, tutup dan buka ulang terminal agar `PATH` ter-update.

### 2. Git (wajib)

Template di-clone via `git clone`, jadi `git` harus ada dan bisa diakses dari terminal:

```bash
git --version
```

### 3. Koneksi internet

Dibutuhkan untuk dua hal: mengunduh metadata template dari API Scaffdev dan meng-clone repository GitHub. Tidak ada mode offline — semua repo template diambil live dari GitHub.

### 4. Prasyarat per framework (sesuai template yang dipilih)

| Template | Tambahan yang dibutuhkan | Cek dengan |
|---|---|---|
| Next.js | Node.js v18+ (sudah mencakup prasyarat CLI) | `node --version` |
| Laravel | PHP 8.2+ dan Composer | `php --version` dan `composer --version` |

Unduh Composer di [getcomposer.org](https://getcomposer.org). CLI memeriksa prasyarat ini otomatis sebelum meng-clone dan akan memberi tahu lebih awal bila ada yang kurang — jadi kamu tidak perlu menebak-nebak.

> **Catatan penting:** Scaffdev saat ini masih dalam masa pengembangan dan baru mendukung 2 framework template yaitu **Next.js** dan **Laravel**. Dukungan framework lain akan terus ditambahkan seiring waktu.

> Tips Windows: gunakan terminal yang sama untuk semua langkah (CMD, PowerShell, atau Git Bash). Kalau `node` dikenali di satu terminal tapi tidak di terminal lain, biasanya masalah `PATH` — install ulang Node.js dengan opsi "Add to PATH" dicentang.

---

## 1. Mode Sekali Pakai via `npx` (Sangat Direkomendasikan)

Kamu tidak perlu menginstall Scaff secara permanen. Cukup gunakan `npx` — setiap eksekusi selalu memakai versi terbaru:

```bash
npx scaffdev@latest
```

Command di atas menampilkan terminal interaktif berisi pertanyaan berurutan:

1. **Kategori** — E-commerce, Landing Page, atau Portfolio.
2. **Framework** — Next.js atau Laravel.
3. **Varian integrasi** — Basic atau yang berintegrasi (mis. Supabase + Midtrans).
4. **Nama folder** — folder tujuan project (harus kosong atau belum ada).

Mode ini cocok kalau kamu belum memilih template di web atau ingin eksplorasi dulu. Kekurangannya: tiap eksekusi mengunduh ulang CLI terbaru (butuh internet dan sedikit waktu download pertama kali).

### Menggunakan Slug Langsung

Jika kamu sudah memilih template dari website [scaffdev.vercel.app/templates](/templates), salin command dengan parameter `--template` agar langsung ke template itu tanpa ditanya lagi:

```bash
npx scaffdev@latest --template=ecommerce-supabase-midtrans-nextjs
```

CLI akan memakai folder default dari slug (atau menanyakan nama folder bila tidak ditentukan).

Untuk menentukan nama folder sekaligus, tulis nama folder di depan flag:

```bash
npx scaffdev@latest toko-saya --template=ecommerce-supabase-midtrans-nextjs
```

Hasilnya: folder `toko-saya/` berisi hasil clone template `ecommerce-supabase-midtrans-nextjs`.

> Penting: flag-nya `--template=<slug>` (dengan tanda `=`). Tanpa flag ini CLI masuk mode interaktif. Salah tulis seperti `--template <slug>` (pakai spasi) tidak dikenali — selalu pakai `=`.

### Kapan memakai mode interaktif vs slug langsung?

- **Interaktif** (`npx scaffdev@latest` tanpa argumen) — untuk eksplorasi, belum tahu mau template apa, atau ingin melihat daftar varian yang tersedia.
- **Slug langsung** (`npx scaffdev@latest --template=<slug>`) — untuk eksekusi cepat dan repeatable: command dari web bisa di-share ke tim, ditempel ke dokumentasi, atau dipakai ulang tanpa salah pilih.

---

## Langkah Lanjutan per Framework

Setelah generate selesai, CLI menampilkan langkah yang sesuai framework. Jangan lewati — project belum bisa jalan sebelum langkah ini selesai.

### Next.js

```bash
cd nama-project
npm install
cp .env.example .env.local   # lalu isi API key
npm run dev
```

Penjelasan tiap baris:

1. `cd nama-project` — masuk ke folder hasil generate.
2. `npm install` — install dependency (butuh internet, bisa 1–5 menit tergantung template).
3. `cp .env.example .env.local` — salin kerangka env menjadi file aktif. Di Windows CMD yang tidak punya `cp`, gunakan `copy .env.example .env.local`. Lalu isi API key sesuai `SETUP.md`.
4. `npm run dev` — jalankan dev server, biasanya di `http://localhost:3000`.

### Laravel

```bash
cd nama-project
composer install
cp .env.example .env         # lalu isi API key
php artisan key:generate
php artisan serve
```

Penjelasan tiap baris:

1. `cd nama-project` — masuk ke folder hasil generate.
2. `composer install` — install dependency PHP.
3. `cp .env.example .env` — salin kerangka env menjadi file aktif, lalu isi API key.
4. `php artisan key:generate` — **wajib untuk Laravel**, men-generate `APP_KEY`. Tanpa ini aplikasi error.
5. `php artisan serve` — jalankan dev server, biasanya di `http://127.0.0.1:8000`.

Detail pengisian key ada di [Environment & SETUP.md](/docs/env-dan-setup). Kalau menemui error, lihat [Troubleshooting](/docs/troubleshooting).

---

## 2. Mode Instalasi Global

Bagi developer yang sering membuat project baru dan tidak ingin mengetik `npx` + download tiap kali, install CLI secara global sekali saja:

```bash
npm install -g scaffdev
```

Setelah terinstall, kamu bisa memanggilnya kapan saja tanpa `npx`:

```bash
# Membuat project baru lewat interactive prompt
scaffdev

# Membuat project dengan template spesifik
scaffdev nama-folder --template=landingpage-basic-nextjs
```

Perbandingan cepat:

| | `npx scaffdev@latest` | `npm install -g scaffdev` |
|---|---|---|
| Install permanen | Tidak | Ya, sekali |
| Versi yang dipakai | Selalu terbaru | Versi saat install (update manual via `npm update -g scaffdev`) |
| Cocok untuk | Pemakaian sesekali, selalu fresh | Pemakaian sering, offline-install cepat |

Untuk update versi global:

```bash
npm update -g scaffdev
```

Untuk uninstall global:

```bash
npm uninstall -g scaffdev
```

---

## Apa yang Terjadi Saat Generate?

Ketika kamu menjalankan Scaff CLI, urutan prosesnya selalu sama:

1. **Resolusi Slug** — CLI menghubungi API Scaffdev untuk mencari URL repository GitHub dan metadata integrasi dari slug yang kamu berikan. Kalau slug salah ketik atau template masih draft, proses berhenti di sini dengan pesan error yang jelas.
2. **Pengecekan Prasyarat** — CLI memverifikasi versi runtime di komputermu (Node.js, PHP/Composer bila template Laravel, dan `git`). Kalau ada yang kurang, kamu diberi tahu sebelum clone dimulai.
3. **Git Clone** — template di-clone langsung ke folder tujuan yang kamu tentukan. Folder harus kosong atau belum ada; CLI tidak akan menimpa diam-diam.
4. **Generate Dokumen Otomatis** — CLI membuat dua file dari metadata integrasi:
   - `.env.example` — berisi seluruh environment variable yang dibutuhkan (nama + komentar deskripsi, nilainya kosong).
   - `SETUP.md` — panduan langkah-demi-langkah cara setup dan konfigurasi API key setiap layanan pihak ketiga.
5. **Instruksi Pasca-Generate** — CLI mencetak langkah lanjutan sesuai framework (seperti blok Next.js / Laravel di atas).

Setelah proses selesai, cukup buka folder project-mu:

```bash
cd nama-project-anda
npm install
npm run dev
```

Lalu ikuti `SETUP.md` di folder itu untuk mengisi API key. Tanpa mengisi env, template berintegrasi tetap bisa di-install dan di-build, tapi fitur yang butuh layanan luar (login, payment, ongkir) belum berfungsi sampai key diisi — ini normal.
