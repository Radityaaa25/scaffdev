---
title: Panduan Builder
description: Memahami dan memakai Builder Scaffdev — rancang sendiri kombinasi template dan integrasi, langkah demi langkah sampai generate.
order: 3
section: Mulai
---

# Panduan Builder

> **Status: Live.** Builder sudah bisa dipakai di [/builder](/builder) dengan CLI
> `0.2.0+`. Halaman ini menjelaskan konsep + tata cara lengkapnya — untuk generate
> project kilat tanpa racikan, gunakan [Katalog Template](/templates).

## Builder vs Katalog Template — Jangan Tertukar

Scaffdev punya dua cara mendapatkan project. Pahami bedanya:

| | Katalog Template (`/templates`) | Builder (`/builder`) |
|---|---|---|
| Konsep | **Bundel fix** — apa yang terlihat di preview = apa yang di-generate | **Rancang-sendiri** — pilih template base + centang integrasi favoritmu |
| Status | **Live** | **Live (New)** — butuh CLI `0.2.0+` |
| Contoh hasil | `npx scaffdev@latest --template=ecommerce-supabase-midtrans-nextjs` | `npx scaffdev@latest toko-saya --template=ecommerce-basic-nextjs --with=midtrans,supabase` |

## Tata Cara Memakai Builder (3 Langkah)

### Langkah 1 — Pilih Template Base

Di [/builder](/builder), pilih satu template sebagai fondasi: kategori
(E-commerce, Landing Page, Portfolio) dan framework (Next.js atau Laravel).
Base menentukan struktur halaman, tampilan, dan prasyarat runtime
(Node.js v18+ untuk Next.js; PHP 8.2+ dan Composer untuk Laravel).

Tips: dari halaman detail template mana pun, klik **"Rancang template ini
di Builder"** — template itu langsung terpilih sebagai base
(via link `/builder?base=<slug>`).

### Langkah 2 — Centang Integrasi (Maks 1 per Kategori Inti)

Centang layanan yang dibutuhkan, dikelompokkan per kategori — payment
(Midtrans *atau* Xendit *atau* Duitku), database (Supabase), autentikasi,
ongkir (RajaOngkir), dan lainnya (Fonnte, Cloudinary, Resend).
**Maksimal 1 pilihan per kategori inti** (payment/database/auth/shipping),
karena dua payment atau dua database dalam satu project bikin alur ambigu
(checkout pakai yang mana? data truth-nya di mana?). Kategori `other`
boleh lebih dari satu.

Aturan maks-1 ini **hanya berlaku di Builder**. Template katalog tidak
terpengaruh (isinya fix dari admin).

Kalau base-mu polosan (tanpa integrasi bawaan) dan kamu tidak mencentang
apa-apa, bisa lewati langkah ini — hasilnya command polosan.

### Langkah 3 — Salin Command & Generate

Builder meracik satu command custom, contoh:

```bash
npx scaffdev@latest toko-saya --template=ecommerce-basic-nextjs --with=midtrans,supabase
```

Tempel di terminal dan execute. CLI kemudian:
1. Meng-clone repo template base.
2. **Menyuntikkan modul integrasi** yang kamu centang (setiap integrasi
   adalah repo modul ramping berisi file kodenya) — tabrakan file = gagal
   eksplisit, tidak ada timpa diam-diam.
3. Menggabungkan dependency (`npm`/`composer`), `.env.example`, dan `SETUP.md`.

Lanjutannya sama seperti katalog: salin env (`cp .env.example .env.local`
untuk Next.js; `cp .env.example .env` + `php artisan key:generate` untuk
Laravel) → isi API key mengikuti `SETUP.md` → `npm run dev` /
`php artisan serve`. Detailnya di [Environment & Setup](/docs/env-dan-setup).

## Alur Kerja Lengkap (Ringkas)

```
Pilih base → centang integrasi → salin command → execute di terminal
→ isi .env mengikuti SETUP.md → npm run dev / php artisan serve → jadi
```

Yang terjadi di balik layar saat execute: clone base → validasi manifest
modul → cek tabrakan → salin file → merge dependency → generate
`.env.example` + `SETUP.md` (+ panduan copot bila double se-kategori).
Semua deterministik — tidak ada tebakan struktur repo.

## Pertanyaan Umum tentang Builder

**Apakah Builder sudah bisa dipakai?**
Sudah — live di [/builder](/builder), membutuhkan CLI `0.2.0+`.
Update dulu: `npm install -g scaffdev@latest` atau pakai `npx scaffdev@latest`
(yang otomatis mengambil versi terbaru).

**Apakah aturan maks-1 sudah berlaku?**
Ya, di Builder (kategori inti: payment/database/auth/shipping).
Template katalog tidak terpengaruh.

**Base polosan + tanpa centang, hasilnya apa?**
Command polosan (tanpa `--with`) — sama seperti generate dari katalog
untuk template tersebut.

**Apakah saya perlu menyiapkan sesuatu?**
Tidak. Builder memakai akun dan alur yang sama — tidak ada migrasi atau
langkah khusus. Pastikan CLI-mu versi `0.2.0+` (`npx scaffdev@latest --version`).
