---
title: Panduan Builder (Coming Soon)
description: Memahami konsep Builder Scaffdev — rancang sendiri kombinasi template dan integrasi. Fitur dalam pengembangan.
order: 3
section: Mulai
---

# Panduan Builder (Coming Soon)

> **Status: Coming Soon.** Builder belum bisa dipakai saat ini. Halaman ini menjelaskan
> konsepnya agar kamu tahu apa yang sedang disiapkan — untuk generate project
> hari ini, gunakan [Katalog Template](/templates) yang sudah live.

## Builder vs Katalog Template — Jangan Tertukar

Scaffdev punya dua cara mendapatkan project. Pahami bedanya:

| | Katalog Template (`/templates`) | Builder (`/builder`) |
|---|---|---|
| Konsep | **Bundel fix** — apa yang terlihat di preview = apa yang di-generate | **Rancang-sendiri** — pilih template base + centang integrasi favoritmu |
| Status | **Live sekarang**, command langsung jalan | **Coming Soon**, belum bisa dipakai |
| Contoh hasil | `npx scaffdev@latest --template=ecommerce-supabase-midtrans-nextjs` | Nanti: base + `--with=midtrans,supabase` (format CLI-nya sudah final, menunggu launch katalog modul) |

Kalau kamu butuh project **sekarang**, tutup halaman ini dan buka [Katalog Template](/templates).
Kalau kamu penasaran Builder akan seperti apa, lanjut baca.

## Cara Kerja Builder (Saat Launch Nanti)

Alurnya selalu tiga langkah:

### Langkah 1 — Pilih Template Base

Pilih satu template sebagai fondasi (sama seperti memilih di katalog): kategori
(E-commerce, Landing Page, Portfolio) dan framework (Next.js atau Laravel).
Base menentukan struktur halaman, tampilan, dan prasyarat runtime.

### Langkah 2 — Centang Integrasi (Maks 1 per Kategori)

Inilah bedanya dengan katalog: kamu mencentang sendiri layanan yang dibutuhkan,
dikelompokkan per kategori — payment (Midtrans *atau* Xendit), database
(Supabase), autentikasi, ongkir (RajaOngkir). **Maksimal 1 pilihan per kategori**,
karena dua payment atau dua database dalam satu project bikin alur ambigu
(checkout pakai yang mana? data truth-nya di mana?).

Aturan maks-1 ini **hanya berlaku saat Builder launch** — bukan aturan yang
berlaku hari ini, karena Builder-nya sendiri belum ada.

### Langkah 3 — Dapat Command Custom & Generate

Builder meracik satu command custom dari pilihanmu. CLI kemudian meng-clone
repo template base, lalu **menyuntikkan modul integrasi** yang kamu centang
(setiap integrasi adalah repo modul ramping berisi file kodenya + panduan),
menggabungkan dependency, `.env.example`, dan `SETUP.md` secara otomatis.

## Yang Bisa Dilakukan Sekarang

1. **Pakai katalog** — pilih template yang bundel integrasinya paling dekat dengan
   kebutuhanmu (lihat daftar integrasi di halaman detail tiap template).
2. **Pelajari daftar integrasi** di [Daftar Integrasi](/docs/daftar-integrasi)
   agar saat Builder launch kamu sudah tahu mau mencentang apa.
3. **Pahami setup env** di [Environment & Setup](/docs/env-dan-setup) — alur isi
   API key-nya sama, baik via katalog maupun nanti via Builder.

## Pertanyaan Umum tentang Builder

**Apakah Builder sudah bisa dipakai?**
Belum. Masih Coming Soon. Semua command generate yang berfungsi hari ini
berasal dari katalog.

**Apakah aturan maks-1 sudah berlaku?**
Belum — aturan itu bagian dari Builder dan baru berlaku saat launch.
Template katalog tidak terpengaruh (isinya fix dari admin).

**Apakah saya perlu menyiapkan sesuatu?**
Tidak. Saat launch, Builder memakai akun dan alur yang sama — tidak ada
migrasi atau langkah khusus.
