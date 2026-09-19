---
title: Panduan Kontribusi Template
description: Standar kualitas, struktur folder, dan panduan bagi developer eksternal yang ingin berkontribusi membuat template baru untuk Scaff.
order: 8
section: Referensi
---

# Panduan Kontribusi Template

Kami menyambut kontribusi dari komunitas developer untuk memperkaya variasi template di katalog Scaff. Agar setiap template yang dirilis memiliki standar kualitas yang konsisten, aman, dan mudah dipelajari, ikuti panduan berikut dari awal sampai pengajuan. Estimasi usaha untuk template pertama: 1–3 hari (termasuk testing dan dokumentasi).

> **Catatan penting:** Scaffdev saat ini masih dalam masa pengembangan dan baru mendukung 2 framework template yaitu **Next.js** dan **Laravel**. Dukungan framework lain akan terus ditambahkan seiring waktu.

---

## Prinsip Dasar Template Scaff

1. **UI Siap Pakai** — template bukan sekadar folder kosong hasil `create-next-app`. Template harus sudah memiliki tampilan visual yang bisa di-screenshot dan di-demo: komponen UI terstruktur, navigasi yang berfungsi, dan minimal 3–5 halaman (atau satu landing page yang kaya section untuk kategori landing-page). Juri / klien harus bisa menilai tanpa membaca kode.
2. **Best Practice Modern** — untuk Next.js: App Router (bukan Pages Router), TypeScript, dan Tailwind CSS. Untuk Laravel: struktur MVC standar, Blade + migrasi database yang rapi. Jangan memakai stack yang sudah deprecated.
3. **Bebas Kredensial Rahasia** — tidak boleh ada API key asli, token, secret webhook, atau kredensial apa pun yang ter-commit ke repository. Semua konfigurasi sensitif wajib dibaca dari environment variable dengan contoh kosong di `.env.example`.
4. **Bisa Dijelaskan** — struktur folder, penamaan file, dan alur data harus bisa dijelaskan dalam 5 menit. Hindari abstraksi berlebihan (factory-of-factory) yang hanya dimengerti pembuatnya.
5. **Bisa Dijalankan Orang Lain** — stranger yang clone repo-mu harus bisa jalan dalam < 10 menit hanya dengan membaca `README.md` + `.env.example` + `SETUP.md`-mu. Kalau butuh penjelasan lisan darimu, dokumentasinya belum cukup.

---

## Standar Struktur Folder (Next.js)

Pastikan struktur repository template-mu tersusun rapi seperti contoh berikut:

```
[nama-template]/
├── app/                    → Next.js App Router (WAJIB, bukan Pages Router)
│   ├── (routes)/           → Halaman aplikasi
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── ui/                 → Komponen atomik/reusable (button, card, dialog)
│   └── layout/             → Navbar, footer, sidebar
├── lib/
│   └── utils.ts            → Helper utilities
├── types/
│   └── index.ts            → Definisi tipe TypeScript
├── public/                 → Asset gambar & ikon
├── .env.example            → Template environment variable (kosong/placeholder)
├── .gitignore              → WAJIB menyertakan .env*, node_modules, .next
└── README.md                → Panduan singkat menjalankan template
```

Penjelasan tiap bagian:

- **`app/`** — wajib App Router. `layout.tsx` untuk kerangka global (font, metadata, provider), `page.tsx` per route untuk halaman. Jangan mencampur Pages Router (`pages/`) dalam template yang sama.
- **`components/ui` vs `components/layout`** — `ui` untuk komponen kecil reusable tanpa logika bisnis (Button, Card, Input, Badge); `layout` untuk kerangka halaman (Navbar, Footer, Sidebar). Komponen yang spesifik satu halaman (mis. `ProductCard` yang hanya dipakai di katalog) boleh di folder feature (`components/product/`), tapi dokumentasikan di README.
- **`lib/`** — helper murni (format rupiah, fetch wrapper, client Supabase). Satu file satu tanggung jawab; jangan menaruh komponen React di sini.
- **`types/`** — semua tipe shared (Product, Cart, Order). Hindari `any` — kalau terpaksa, beri komentar kenapa.
- **`public/`** — gambar dioptimasi (kompres sebelum commit, maksimal ~200KB per file hero). Jangan commit file PSD / mentah berukuran besar.
- **`.env.example`** — lihat standar di bawah. Wajib ada walau template Basic tanpa integrasi (minimal berisi komentar "tidak ada env wajib").
- **`.gitignore`** — minimal mencakup `.env*`, `node_modules`, `.next`. Jangan mengandalkan `.gitignore` global di komputermu — harus ada di repo.
- **`README.md`** — minimal: deskripsi 3–5 baris, prasyarat, command install → env → run, dan link ke `SETUP.md` untuk integrasi. Stranger harus bisa jalan hanya dari file ini.

Untuk template Laravel, padanannya: `routes/`, `app/Http/Controllers/`, `resources/views/`, `database/migrations/`, `.env.example`, dan `README.md` dengan langkah `composer install` → `cp .env.example .env` → `php artisan key:generate` → `php artisan serve`.

---

## Standar `.env.example` dan README

### `.env.example` yang baik

```bash
# --- Supabase ---
# URL project Supabase (Project Settings → API)
NEXT_PUBLIC_SUPABASE_URL=
# Anon key project Supabase (Project Settings → API)
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# --- Midtrans ---
# Server key (Settings → Access Keys, hanya di server!)
MIDTRANS_SERVER_KEY=
# Client key (untuk Snap di browser)
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=
```

Aturannya:

1. Satu section per layanan dengan header komentar.
2. Setiap variable punya komentar: diambil dari dashboard mana dan dipakai untuk apa.
3. Nilai selalu kosong (atau placeholder jelas seperti `your_api_key`). Jangan pernah mengisi key asli, walau key test — anggap semua yang ter-commit sebagai bocor.
4. Prefix `NEXT_PUBLIC_` hanya untuk key publik. Secret server tanpa prefix.

### `README.md` minimal

1. Judul + 3–5 baris deskripsi (untuk siapa template ini).
2. Prasyarat (Node 18+ / PHP 8.2+).
3. Blok command install → env → run yang bisa di-copy paste.
4. Tabel env / link ke `SETUP.md` untuk daftar key.
5. Screenshot atau link demo (boleh menyusul saat pengajuan).

---

## Checklist Kualitas Kode

Sebelum mengajukan template, pastikan semua item ini centang:

- [ ] **TypeScript** — seluruh kode dalam TypeScript murni tanpa `any` yang tidak perlu. Kalau ada `any`, beri komentar alasan + TODO.
- [ ] **Linting** — lolos `npm run lint` tanpa error. Warning harus bisa dijelaskan.
- [ ] **Build** — lolos `npm run build` tanpa error kritis. Test di folder fresh hasil clone, bukan hanya di folder development-mu.
- [ ] **Tanpa Hardcode** — nilai konfigurasi sensitif atau endpoint dibaca dari `process.env` (Next.js) / `env()` (Laravel). Tidak ada URL API, key, atau secret tertulis langsung di kode.
- [ ] **Clean Code** — tidak ada `console.log` sisa debug, kode terkomentari massal, atau dependency tak terpakai di `package.json`.
- [ ] **Responsif** — tampil wajar di mobile 360px dan desktop 1440px. Navigasi tidak pecah, tabel / form bisa dipakai di layar kecil.
- [ ] **File `.env.example`** — lengkap mengikuti standar di atas, sinkron dengan variable yang benar-benar dibaca kode (tidak ada variable hantu yang tidak dipakai, tidak ada variable dipakai tapi tidak terdaftar).
- [ ] **`.gitignore`** — mencakup `.env*`, `node_modules`, `.next` (Next.js) atau `vendor` (Laravel).
- [ ] **Aset ringan** — tidak ada gambar > 500KB tanpa alasan, tidak ada file biner aneh di repo.

---

## Alur Pengajuan Kontribusi

1. **Buat Template** — bangun project di repository GitHub publik milikmu sendiri (belum perlu fork organisasi apa pun). Pastikan repo publik sejak awal agar bisa di-clone tanpa token.
2. **Uji Coba Mandiri** — lakukan clone ke folder baru yang kosong, lalu jalankan dari nol mengikuti `README.md`-mu sendiri tanpa improvisasi:

```bash
npm install
cp .env.example .env.local
npm run dev
```

```bash
npm run lint
npm run build
```

Kalau ada langkah yang hanya jalan di komputermu tapi gagal di folder fresh, perbaiki dokumentasi / kodenya — reviewer akan melakukan hal yang sama.

3. **Siapkan Materi Pengajuan:**
   - Link repository publik.
   - Deskripsi singkat dan target kategori (E-commerce, Landing Page, atau Portfolio) + framework (Next.js / Laravel).
   - Screenshot preview tampilan utama (rasio 16:9 disarankan, minimal 1280px lebar).
   - Daftar integrasi yang digunakan (Supabase / Midtrans / Xendit / RajaOngkir / tanpa integrasi) beserta daftar env var-nya.
4. **Hubungi Tim Scaffdev** — kirim submission melalui kanal yang diumumkan (lihat halaman utama / pengumuman komunitas). Tim akan mereview struktur kode, keamanan (tidak ada secret ter-commit), dan kelengkapan `.env.example` + `README.md`.
5. **Review dan Publish** — bila ada revisi, perbaiki di repo-mu dan kabari ulang. Bila lolos, tim mendaftarkan template-mu ke katalog publik dengan slug resmi — dan template-mu bisa dipakai semua orang via `npx scaffdev@latest --template=<slug>`.

### Alasan penolakan yang paling sering

1. Ada API key / secret ter-commit di histori Git (bukan hanya di file saat ini — histori juga diperiksa).
2. `README.md` tidak cukup untuk menjalankan project dari nol.
3. `.env.example` tidak sinkron dengan kode (variable dipakai tapi tidak terdaftar, atau sebaliknya).
4. Build / lint gagal di folder fresh.
5. Template adalah folder kosong `create-next-app` tanpa UI jadi.

Hindari kelimanya dan peluang lolos sangat besar. Selamat berkontribusi!
