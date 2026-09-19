---
title: Konsep Dasar Scaffdev
description: Memahami apa itu Scaffdev, alur kerja web ke CLI, dan istilah penting seperti slug, template, dan integrasi.
order: 1
section: Mulai
---

# Konsep Dasar Scaffdev

Scaffdev adalah **scaffolding generator**: tools yang membuatkan project baru siap jalan dalam hitungan detik — bukan folder kosong, melainkan starter kit lengkap dengan tampilan visual yang sudah jadi, struktur folder best-practice, dan panduan setup integrasi.

Bedanya dengan `create-next-app` atau `composer create-project` biasa: hasil generate Scaffdev langsung terlihat seperti aplikasi jadi (ada halaman, navigasi, komponen UI), bukan halaman selamat datang kosong. Kamu tinggal isi API key layanan yang dipakai, lalu lanjut ke logika bisnismu.

> **Catatan penting:** Scaffdev saat ini masih dalam masa pengembangan dan baru mendukung 2 framework template yaitu **Next.js** dan **Laravel**. Dukungan framework lain akan terus ditambahkan seiring waktu.

## Untuk Siapa Scaffdev?

- **Freelancer / indie hacker** — butuh demo cepat ke klien dalam hitungan jam, bukan hari.
- **Mahasiswa / peserta lomba** — butuh starter kit rapi dengan struktur yang bisa dijelaskan ke juri.
- **Tim kecil / agency** — butuh standar awal yang konsisten untuk tiap project baru (struktur folder, env, dokumentasi setup).
- **Backend / frontend pemula** — butuh contoh nyata integrasi lokal Indonesia (Midtrans, Xendit, RajaOngkir, Supabase) yang sudah dirangkai, bukan sekadar baca docs terpisah.

Kalau kamu hanya butuh folder kosong, Scaffdev berlebihan. Kalau kamu butuh project yang langsung bisa di-screenshot dan di-demo, Scaffdev menghemat 1–3 hari setup awal.

## Komponen Utama

Scaffdev terdiri dari tiga bagian yang saling terhubung:

1. **Web katalog (`scaffdev.vercel.app`)** — tempat browsing template secara visual: filter kategori, pilih framework, lihat screenshot, baca daftar integrasi dan env yang dibutuhkan, lalu copy satu baris command.
2. **CLI (`scaffdev`)** — tools terminal yang dieksekusi via `npx`. Tugasnya: resolve slug ke URL GitHub, cek prasyarat runtime, `git clone` template, lalu generate `.env.example` + `SETUP.md` yang digabungkan dari semua integrasi template itu.
3. **API katalog** — backend yang menyimpan metadata template (slug, repo URL, daftar integrasi, env var). CLI bertanya ke sini setiap kali generate, jadi daftar template selalu sinkron dengan yang tampil di web.

Alurnya satu arah: web untuk memilih, API untuk metadata, CLI untuk mengeksekusi di komputermu. Tidak ada proses build di server — semua file project hanya ada di komputermu setelah clone.

## Alur Kerja (3 Langkah Detail)

### 1. Pilih di web

Buka katalog di [templates](/templates), lalu:

- Pilih **kategori** sesuai jenis project: E-commerce (toko online, katalog, keranjang, payment), Landing Page (promosi produk / SaaS), atau Portfolio (showcase karya personal).
- Pilih **framework**: Next.js (JavaScript/TypeScript, App Router) atau Laravel (PHP).
- Buka halaman detail template: perhatikan screenshot besar, deskripsi, spesifikasi repo, dan yang paling penting — **daftar integrasi beserta environment variable** yang dibutuhkan. Dari sinilah kamu tahu API key apa saja yang nanti harus disiapkan (mis. Supabase URL + anon key, Midtrans server + client key).
- Klik **Pakai Template Ini** untuk memunculkan command siap copy, contoh:

```bash
npx scaffdev@latest --template=ecommerce-supabase-midtrans-nextjs
```

### 2. Generate di terminal

Paste command di terminal lalu tekan enter. Yang terjadi di balik layar (detail ada di [Cara Install](/docs/cara-install)):

1. CLI menghubungi API untuk mencari URL repository GitHub dari slug tersebut.
2. CLI memeriksa prasyarat (Node.js v18+ untuk Next.js, PHP 8.2+ dan Composer untuk Laravel, plus `git` dan koneksi internet).
3. CLI meng-clone template ke folder tujuan yang kamu tentukan.
4. CLI men-generate dua file: `.env.example` (kerangka semua env var yang dibutuhkan) dan `SETUP.md` (panduan langkah-demi-langkah cara mendapatkan tiap API key).

Tanpa flag `--template`, CLI masuk mode interaktif: pilih kategori → framework → varian integrasi → nama folder. Berguna kalau kamu belum memilih di web.

### 3. Setup dan jalan

Masuk ke folder project dan ikuti `SETUP.md` yang baru dibuat:

- Salin `.env.example` menjadi file env aktif (`cp .env.example .env.local` untuk Next.js, `cp .env.example .env` untuk Laravel).
- Daftar akun layanan yang dibutuhkan (Supabase, Midtrans, dll), ambil key-nya, tempel ke file env.
- Jalankan dev server (`npm run dev` atau `php artisan serve`).

Detail pengisian env ada di [Environment & Setup](/docs/env-dan-setup). Kalau mentok, lihat [Troubleshooting](/docs/troubleshooting) atau tanya asisten AI di pojok kanan bawah.

## Istilah Penting

- **Template** — satu starter kit lengkap (kode + tampilan + struktur). Contoh: E-commerce Basic, SaaS Landing Page. Setiap template hidup sebagai repository GitHub publik.
- **Slug** — kode pendek unik tiap template, contoh `ecommerce-basic-nextjs`. Slug inilah yang kamu pakai di command CLI (`--template=ecommerce-basic-nextjs`). Tidak perlu hafal URL GitHub — CLI yang me-resolve slug ke URL via API.
- **Framework** — teknologi utama template: Next.js (JavaScript/TypeScript, App Router) atau Laravel (PHP). Saat ini baru dua framework ini yang didukung, dan daftarnya akan terus bertambah seiring waktu.
- **Kategori** — jenis project: `ecommerce`, `landing-page`, `portfolio` (bisa bertambah). Kategori menentukan struktur halaman bawaan (mis. e-commerce punya katalog, keranjang, checkout).
- **Integrasi** — layanan pihak ketiga yang sudah disiapkan kode + panduannya, mis. Supabase (database + auth), Midtrans / Xendit (payment), RajaOngkir (ongkir). Daftar lengkap ada di [Daftar Integrasi](/docs/daftar-integrasi).
- **Basic vs Berintegrasi** — template Basic tanpa layanan tambahan (data masih di memory / state lokal, cocok untuk prototipe UI); template berintegrasi menyertakan SDK + panduan setup layanan tertentu (siap transaksi nyata setelah env diisi).
- **`.env.example`** — kerangka env var yang di-generate CLI dari metadata integrasi. Berisi nama variable + komentar deskripsi, nilainya kosong untuk kamu isi.
- **`SETUP.md`** — panduan setup yang di-generate CLI di folder project. Strukturnya selalu sama: Langkah Cepat (install → env → run), lalu satu section per integrasi (daftar akun di mana, key apa yang diambil, ditempel ke variable apa).

## Kenapa Tidak Clone Manual Saja?

Bisa saja clone repo GitHub-nya langsung — semua repo template bersifat publik. Tapi lewat CLI kamu dapat tiga hal ekstra:

| | Clone manual | Via CLI Scaffdev |
|---|---|---|
| Cari URL repo | Cari manual di GitHub | Cukup pakai slug (`--template=<slug>`) |
| `.env.example` | Apa adanya dari repo | Digabungkan dari semua integrasi template itu |
| `SETUP.md` | Apa adanya dari repo | Dibuatkan per project berisi langkah tiap layanan |
| Cek prasyarat | Manual | Otomatis (Node / PHP / git dicek sebelum clone) |
| Langkah pasca-generate | Baca README sendiri | Ditampilkan otomatis sesuai framework |

Singkatnya: satu command, project langsung siap dikonfigurasi. Clone manual cocok kalau kamu sudah tahu persis URL repo dan hafal setup tiap layanan; CLI cocok kalau kamu ingin semuanya disiapkan.

## Batasan yang Perlu Diketahui

- Scaffdev **tidak membuatkan akun** Supabase / Midtrans / dll untukmu. Akun tetap kamu buat sendiri, Scaffdev hanya menyiapkan kode dan panduannya.
- Scaffdev **tidak menyimpan** API key-mu di server. Semua key hanya ada di file env di komputermu.
- Template adalah titik awal, bukan aplikasi final. Struktur dan UI sudah jadi, tapi logika bisnis spesifik (aturan diskon, alur approval, dsb.) tetap kamu kembangkan sendiri.

## Langkah Selanjutnya

1. Baca [Cara Install & Penggunaan CLI](/docs/cara-install) untuk prasyarat dan mode `npx` vs global.
2. Buka [Katalog Template](/templates) untuk memilih template pertama (lihat preview, lalu copy command-nya). Detail konsep Builder ada di [Panduan Builder](/docs/panduan-builder).
3. Pahami [Environment & Setup](/docs/env-dan-setup) sebelum mengisi API key pertama.
