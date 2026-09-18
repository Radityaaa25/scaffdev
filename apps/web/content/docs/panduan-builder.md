---
title: Panduan Builder Visual
description: Memilih template lewat web — dari kategori, framework, preview, sampai mendapatkan command generate.
order: 3
section: Mulai
---

# Panduan Builder Visual

Builder adalah cara visual memilih template tanpa harus menebak-nebak slug. Alurnya selalu sama, empat langkah.

## Langkah 1 — Pilih Kategori

Buka halaman builder dan pilih jenis project: **E-commerce** (toko online, katalog, keranjang, payment), **Landing Page** (promosi produk/SaaS), atau **Portfolio** (showcase karya personal).

## Langkah 2 — Pilih Framework

Dua framework didukung penuh:

- **Next.js (App Router)** — butuh **Node.js v18+** di komputermu ([nodejs.org](https://nodejs.org)).
- **Laravel (PHP)** — butuh **PHP 8.2+ dan Composer** ([getcomposer.org](https://getcomposer.org)).

CLI memeriksa prasyarat ini otomatis sebelum meng-clone, jadi kamu diberi tahu lebih awal bila ada yang kurang.

## Langkah 3 — Lihat Preview & Detail

Setiap template punya halaman detail berisi: screenshot besar, deskripsi, spesifikasi repo, dan daftar integrasi beserta environment variable yang dibutuhkan. Baca bagian integrasi dulu — di sanalah kamu tahu API key apa saja yang nanti harus disiapkan.

## Langkah 4 — Copy Command & Generate

Klik **Pakai Template Ini** untuk memunculkan command, contoh:

```bash
npx scaffdev@latest --template=ecommerce-supabase-midtrans-nextjs
```

Jalankan di terminal. Untuk menentukan nama folder sendiri, tambahkan di depan slug:

```bash
npx scaffdev@latest toko-saya --template=ecommerce-supabase-midtrans-nextjs
```

Tanpa flag `--template`, CLI menampilkan interactive prompt (pilih kategori → framework → varian → nama folder) — berguna kalau kamu belum memilih di web.

## Setelah Generate

Masuk ke folder project dan ikuti `SETUP.md` yang baru dibuat CLI. Detail pengisian environment variable ada di panduan [Environment & Setup](/docs/env-dan-setup).
