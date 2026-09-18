---
title: Cara Install & Penggunaan CLI
description: Panduan lengkap memulai project baru menggunakan Scaff CLI via npx atau instalasi global.
order: 2
section: Mulai
---

# Cara Install & Penggunaan CLI

Scaff menyediakan CLI modern dan cepat untuk men-generate starter kit project lengkap dengan tampilan visual siap pakai dalam hitungan detik.

---

## Prasyarat Sistem

Sebelum menjalankan Scaff CLI, pastikan perangkat Anda telah memenuhi prasyarat berikut:

1. **Node.js**: Versi 18.0.0 atau lebih baru ([Unduh Node.js](https://nodejs.org))
2. **Git**: Terpasang di komputer dan dapat diakses dari terminal (`git --version`)
3. **Koneksi Internet**: Untuk mengunduh metadata template dan meng-clone repository GitHub

Jika Anda memilih template berbasis **Laravel**, pastikan **PHP 8.2+** dan **Composer** sudah terinstall.

---

## 1. Mode Sekali Pakai via `npx` (Sangat Direkomendasikan)

Anda tidak perlu menginstall Scaff secara permanen di komputer Anda. Cukup gunakan `npx`:

```bash
npx scaffdev@latest
```

Command di atas akan langsung menampilkan terminal interaktif dengan pertanyaan pemilihan kategori, framework, dan varian integrasi.

### Menggunakan Slug Langsung

Jika Anda sudah memilih template dari website [scaff.dev/templates](/templates), Anda bisa langsung menyalin dan menjalankan command dengan parameter `--template`:

```bash
npx scaffdev@latest --template=ecommerce-supabase-midtrans-nextjs
```

Untuk menentukan nama folder sekaligus:

```bash
npx scaffdev@latest toko-saya --template=ecommerce-supabase-midtrans-nextjs
```

> Penting: flag-nya `--template=<slug>` (dengan tanda `=`). Tanpa flag ini CLI masuk mode interaktif.

### Langkah Lanjutan per Framework

Setelah generate selesai, CLI menampilkan langkah yang sesuai framework:

**Next.js:**
```bash
cd nama-project
npm install
cp .env.example .env.local   # lalu isi API key
npm run dev
```

**Laravel:**
```bash
cd nama-project
composer install
cp .env.example .env         # lalu isi API key
php artisan key:generate
php artisan serve
```

Detail pengisian key ada di [Environment & SETUP.md](/docs/env-dan-setup). Kalau menemui error, lihat [Troubleshooting](/docs/troubleshooting).

---

## 2. Mode Instalasi Global

Bagi developer yang sering membuat project baru, Scaff CLI dapat diinstall secara global di sistem:

```bash
npm install -g scaffdev
```

Setelah terinstall secara global, Anda dapat memanggilnya kapan saja:

```bash
# Membuat project baru lewat interactive prompt
scaffdev

# Membuat project dengan template spesifik
scaffdev nama-folder --template=landingpage-basic-nextjs
```

---

## Apa yang Terjadi Saat Generate?

Ketika Anda menjalankan Scaff CLI:

1. **Resolusi Slug**: CLI menghubungi API Scaff untuk mencari URL repository GitHub dan metadata integrasi.
2. **Pengecekan Prasyarat**: CLI memverifikasi versi runtime di komputer Anda.
3. **Git Clone**: Template di-clone langsung ke folder tujuan yang Anda tentukan.
4. **Generate Dokumen Otomatis**:
   - `.env.example`: Berisi seluruh environment variable yang dibutuhkan oleh integrasi terpilih.
   - `SETUP.md`: Panduan langkah-demi-langkah cara setup dan konfigurasi API key setiap layanan pihak ketiga.

Setelah proses selesai, cukup buka folder project Anda:

```bash
cd nama-project-anda
npm install
npm run dev
```
