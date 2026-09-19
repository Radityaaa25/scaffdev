---
title: Daftar Integrasi yang Didukung
description: Ringkasan framework dan layanan pihak ketiga yang didukung template Scaff — Next.js, Laravel, Supabase, Midtrans, Xendit, dan Duitku.
order: 5
section: Panduan
---

# Daftar yang Didukung Scaffdev

Halaman ini merangkum semua yang didukung template Scaffdev — sama persis dengan
daftar di halaman [Templates](/templates): dua framework (Next.js, Laravel) dan
empat layanan terintegrasi (Supabase, Midtrans, Xendit, Duitku).

Setiap bagian di bawah menjelaskan: apa fungsinya, kapan memilih (dan kapan
**tidak** memilih), environment variable yang dipakai, cara mendapatkan key
langkah demi langkah, cara kerja kode di template, hingga cara verifikasi dan
masalah yang sering terjadi.

> **Catatan penting:** Scaffdev saat ini masih dalam masa pengembangan dan baru mendukung 2 framework template yaitu **Next.js** dan **Laravel**. Dukungan framework lain akan terus ditambahkan seiring waktu.

**Daftar isi halaman ini:**

- [1. Framework: Next.js](#1-framework-nextjs)
- [2. Framework: Laravel](#2-framework-laravel)
- [3. Database & Autentikasi: Supabase](#3-database--autentikasi-supabase)
- [4. Payment Gateway: Midtrans](#4-payment-gateway-midtrans)
- [5. Payment Gateway: Xendit](#5-payment-gateway-xendit)
- [6. Payment Gateway: Duitku](#6-payment-gateway-duitku)
- [Cara Pengisian Environment Variable](#cara-pengisian-environment-variable)

---

## 1. Framework: Next.js

[Next.js](https://nextjs.org) (App Router) adalah framework React dari Vercel untuk
membangun aplikasi web modern — dari landing page statis sampai e-commerce
interaktif dengan rendering server (SSR), static generation (SSG), dan API route
dalam satu codebase.

### Kapan memilih Next.js

- Butuh UI interaktif (keranjang live, filter katalog instan, checkout tanpa reload).
- Nyaman dengan JavaScript/TypeScript, atau tim sudah terbiasa ekosistem React.
- Rencana deploy ke Vercel atau Node hosting (Railway, VPS dengan PM2, dsb.).
- Template yang kamu incar hanya tersedia dalam varian Next.js.

### Kapan TIDAK memilih Next.js

- Hosting-mu hanya mendukung PHP (shared hosting murah) — pilih Laravel.
- Tim hanya menguasai PHP — biaya belajar React + TypeScript tidak sebanding untuk project kecil.

### Prasyarat & perintah dasar

- **Prasyarat di komputermu:** Node.js v18+ ([nodejs.org](https://nodejs.org), pilih LTS).
- **File env aktif:** `.env.local` — dibuat via `cp .env.example .env.local`
  (di CMD Windows gunakan `copy`).
- **Alur standar:**

```bash
npm install
cp .env.example .env.local   # lalu isi API key
npm run dev                  # buka http://localhost:3000
```

Untuk build production: `npm run build` lalu `npm start`. Detail prasyarat ada di
[Cara Install](/docs/cara-install) dan pengisian env di
[Environment & Setup](/docs/env-dan-setup).

---

## 2. Framework: Laravel

[Laravel](https://laravel.com) adalah framework PHP dengan ekosistem paling matang
untuk aplikasi CRUD klasik — routing, ORM Eloquent, Blade templating, migrasi
database, dan autentikasi bawaan dalam satu paket.

### Kapan memilih Laravel

- Hosting-mu PHP-based (shared hosting, Niagahoster, dsb.) atau VPS yang sudah nyaman dengan PHP.
- Aplikasi dominan CRUD + relasi database kompleks (laporan, admin panel, multi-role).
- Tim terbiasa PHP dan ingin produktif tanpa belajar React.

### Kapan TIDAK memilih Laravel

- Butuh interaktivitas real-time berat di frontend — Next.js lebih natural.
- Komputermu tidak bisa install PHP 8.2+/Composer dengan mudah.

### Prasyarat & perintah dasar

- **Prasyarat di komputermu:** PHP 8.2+ dan Composer ([getcomposer.org](https://getcomposer.org)).
- **File env aktif:** `.env` — dibuat via `cp .env.example .env`, **wajib** dilanjut
  `php artisan key:generate` (tanpa ini Laravel error `No application encryption key`).
- **Alur standar:**

```bash
composer install
cp .env.example .env         # lalu isi API key
php artisan key:generate
php artisan serve             # buka http://127.0.0.1:8000
```

---

## 3. Database & Autentikasi: Supabase

[Supabase](https://supabase.com) adalah alternatif open-source untuk Firebase yang menyediakan database PostgreSQL, autentikasi pengguna, instant API (REST + realtime), dan storage file dalam satu dashboard.

### Kapan memilih Supabase

- Project E-commerce, SaaS, atau aplikasi yang butuh sistem login user, keranjang belanja tersimpan di database, atau riwayat transaksi.
- Kamu ingin backend tanpa mengelola server database sendiri (tidak perlu install dan tuning PostgreSQL manual).
- Paket gratis (Free Tier) memadai untuk prototipe dan MVP: database kecil, auth standar, dan storage terbatas — cukup untuk demo, lomba, dan validasi awal.

### Kapan TIDAK memilih Supabase

- Landing page statis atau portfolio tanpa login — template Basic tanpa Supabase lebih ringan dan tanpa setup akun.
- Data sangat sensitif dengan regulasi khusus (perbankan, kesehatan) yang mewajibkan database on-premise — konsultasikan dulu ke tim compliance-mu.

### Environment Variable yang Digunakan

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Keduanya bersifat publik (prefix `NEXT_PUBLIC_`) dan aman dipasang di browser.
Key `service_role` **tidak dipakai template dan jangan pernah ditempel ke env**
(kunci itu setara password super-admin database).

### Cara mendapatkan key langkah demi langkah

1. Daftar di [supabase.com](https://supabase.com), klik **New Project**.
2. Isi nama project, tentukan password database (simpan baik-baik), pilih region
   terdekat — untuk Indonesia pilih **Singapore**.
3. Tunggu provisioning database selesai (1–2 menit, jangan tutup tab).
4. Buka **Project Settings → API**: salin **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`,
   dan **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
5. Tempel ke `.env.local`, **restart dev server** (`npm run dev` ulang).
6. Verifikasi: buka halaman register/login template, buat akun test, pastikan bisa
   login-logout. Cek di dashboard Supabase → **Authentication → Users**: akun test
   harus muncul di sana.

### Cara kerja di template Scaff

- Template menyertakan Supabase client yang sudah dikonfigurasi membaca dua env di atas.
- Fitur auth (register, login, logout) dan query database (produk, cart, order) memakai client ini — kamu tinggal menyesuaikan nama tabel dengan skema di project Supabase-mu.
- Proteksi halaman (mis. checkout wajib login) memakai session Supabase — jangan ganti dengan flag boolean di localStorage.

### Masalah yang sering terjadi

- **Login gagal padahal key sudah diisi** — kemungkinan lupa restart dev server setelah mengisi env, atau salah paste (spasi di awal/akhir). Bandingkan lagi dengan dashboard.
- **"row-level security" / data tidak muncul** — tabel Supabase-mu belum punya policy yang mengizinkan read untuk user terautentikasi. Atur di dashboard → **Authentication → Policies** (untuk belajar, aktifkan policy baca publik dulu, ketatkan sebelum production).
- **Email konfirmasi tidak datang** — untuk development, matikan "Confirm email" di **Authentication → Providers → Email** agar register langsung aktif.

---

## 4. Payment Gateway: Midtrans

[Midtrans](https://midtrans.com) adalah payment gateway terkemuka di Indonesia yang mendukung pembayaran via QRIS, GoPay, OVO, ShopeePay, Virtual Account bank (BCA, Mandiri, BNI, BRI), gerai retail, hingga kartu kredit — semua dalam satu integrasi.

### Kapan memilih Midtrans

- E-commerce yang menargetkan pembeli Indonesia dengan banyak metode bayar.
- Kamu ingin alur checkout tanpa redirect ke halaman luar (pakai popup Snap).
- Siap mengurus webhook verifikasi pembayaran (template sudah menyertakan endpoint contohnya).

### Kapan TIDAK memilih Midtrans

- Produk digital murni tanpa variasi metode bayar — Xendit/Duitku invoice bisa lebih sederhana.
- Kamu butuh payout massal ke banyak rekening (fitur payout Midtrans ada, tapi bandingkan dulu dengan Xendit Disbursement).

### Environment Variable yang Digunakan

```bash
MIDTRANS_SERVER_KEY=SB-Mid-server-...
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=SB-Mid-client-...
```

Perhatikan: server key **tanpa prefix** (rahasia, hanya di server), client key
**dengan prefix** (publik, dipakai Snap di browser). Jangan tertukar — menaruh
server key dengan prefix `NEXT_PUBLIC_` berarti memajangnya ke publik.

### Cara mendapatkan key langkah demi langkah

1. Daftar di [midtrans.com](https://midtrans.com), masuk ke dashboard **Sandbox** dulu (jangan langsung production).
2. Buka **Settings → Access Keys**: salin **Server Key** (diawali `SB-Mid-server-`) dan **Client Key** (diawali `SB-Mid-client-`).
3. Tempel ke env sesuai pasangan di atas, restart dev server.
4. Verifikasi: buat transaksi test → bayar dengan metode sandbox (mis. QRIS test / VA test dengan nominal unik) → pastikan status berubah dan **webhook verifikasi masuk** (cek log endpoint webhook template).
5. Setelah alur end-to-end jalan, baru ganti ke **production key** saat go-live (server key production diawali `Mid-server-`, tanpa `SB-`).

### Cara kerja di template Scaff

- Checkout menggunakan popup **Midtrans Snap**: user tetap di halaman tokomu, popup pembayaran muncul di atasnya — pengalaman lebih mulus dibanding redirect ke halaman bank.
- Template menyertakan endpoint webhook contoh untuk verifikasi notifikasi pembayaran dari Midtrans. Di production, pastikan URL webhook terdaftar di dashboard Midtrans dan signature-nya diverifikasi (jangan percaya status dari frontend saja — selalu konfirmasi via server-to-server/webhook).

### Masalah yang sering terjadi

- **Popup Snap tidak muncul** — client key salah / belum diisi, atau script Snap belum dimuat (cek console browser untuk error `Midtrans is not defined`).
- **Pembayaran sandbox sukses tapi status tidak berubah** — webhook belum terjangkau (localhost tidak bisa diakses Midtrans) atau signature tidak cocok. Untuk test webhook lokal, gunakan tunneling (mis. ngrok) dan daftarkan URL tunnel sementara di dashboard sandbox.
- **Key sandbox vs production tertukar** — gejalanya error autentikasi 401 dari API Midtrans. Cek awalan key: `SB-` = sandbox.

---

## 5. Payment Gateway: Xendit

[Xendit](https://xendit.co) adalah platform infrastruktur pembayaran untuk Indonesia dan Asia Tenggara: invoice online, direct debit, e-wallet, virtual account, dan disbursement/payout.

### Kapan memilih Xendit

- Kamu butuh **invoice online** (link bayar yang dikirim ke customer via chat/email) selain checkout popup.
- Butuh direct debit / e-wallet spesifik, atau **payout massal** (gaji, refund, komisi mitra).
- Tim finance ingin rekonsiliasi via dashboard Xendit yang detail per transaksi.

### Kapan TIDAK memilih Xendit

- Cukup satu gateway dan Midtrans sudah memenuhi semua metode yang dibutuhkan — dua gateway berarti dua dashboard, dua webhook, dua rekonsiliasi. Pilih satu saja kecuali ada alasan bisnis kuat.

### Environment Variable yang Digunakan

```bash
XENDIT_SECRET_KEY=xnd_development_...
NEXT_PUBLIC_XENDIT_PUBLIC_KEY=xnd_public_...
```

Secret key tanpa prefix (hanya server), public key dengan prefix. Untuk sandbox,
secret diawali `xnd_development_`; production diawali `xnd_production_` —
jangan campur keduanya dalam satu environment.

### Cara mendapatkan key langkah demi langkah

1. Daftar di [xendit.co](https://xendit.co), pastikan berada di mode **Test** (toggle di dashboard).
2. Buka **Settings → Developers → API Keys**: salin secret dan public key test.
3. Tempel ke env, restart dev server.
4. Verifikasi: buat invoice/charge test → selesaikan pembayaran test → pastikan callback/webhook masuk dan status terupdate.
5. Ganti ke production key hanya saat go-live, dan daftarkan URL callback production di dashboard.

### Cara kerja di template Scaff

- Template memakai API Xendit dari sisi server (API route) — secret key tidak pernah dikirim ke browser.
- Contoh alur: buat invoice via server → redirect/ tampilkan link invoice ke customer → terima callback → update status order.

### Masalah yang sering terjadi

- **Callback tidak masuk** — URL callback belum terdaftar atau tidak reachable publik (sama seperti kasus webhook Midtrans: pakai tunnel untuk test lokal).
- **Mode test vs live tertukar** — transaksi test tidak muncul di dashboard live dan sebaliknya. Selalu cek toggle mode di dashboard sebelum debugging lebih jauh.

---

## 6. Payment Gateway: Duitku

[Duitku](https://duitku.com) adalah payment gateway Indonesia yang mendukung QRIS, e-wallet (OVO, Dana, LinkAja, ShopeePay), Virtual Account semua bank lokal, gerai retail (Alfamart/Indomaret), hingga kartu kredit — populer untuk UMKM dan toko online karena pendaftarannya ringan.

### Kapan memilih Duitku

- Target pembeli tersebar dengan metode bayar beragam termasuk gerai retail.
- Kamu UMKM dan ingin onboarding cepat dengan dokumen minimal.
- Butuh alternatif/satu-satunya gateway yang ringan diintegrasikan via API popup/redirect.

### Kapan TIDAK memilih Duitku

- Sudah puas dengan satu gateway lain (Midtrans/Xendit) — hindari dua gateway tanpa alasan bisnis yang jelas.

### Environment Variable yang Digunakan

```bash
DUITKU_MERCHANT_CODE=your_merchant_code
DUITKU_API_KEY=your_api_key
```

Keduanya rahasia — dipakai dari server (API route), **tanpa prefix `NEXT_PUBLIC_`**.
Signature transaksi dihitung server-side memakai API key + merchant code.

### Cara mendapatkan key langkah demi langkah

1. Daftar di [duitku.com](https://duitku.com), lengkapi data usaha.
2. Masuk ke **project Sandbox**: catat **Merchant Code** dan **API Key** sandbox.
3. Tempel ke env, restart dev server.
4. Verifikasi: buat transaksi test → bayar via salah satu metode sandbox → pastikan callback masuk dan status order berubah.
5. Minta aktivasi production ke Duitku bila siap go-live, lalu ganti kedua nilai dengan kredensial production.

### Cara kerja di template Scaff

- Pembayaran diinisiasi dari server (buat transaksi + signature), customer diarahkan ke halaman/metode bayar, lalu Duitku memanggil URL callback-mu.
- Selalu verifikasi callback dengan menghitung ulang signature di server — jangan update status order hanya dari redirect frontend.

### Masalah yang sering terjadi

- **Signature tidak cocok** — urutan parameter atau timestamp salah; ikuti persis dokumentasi Duitku untuk format signature. Perbedaan satu karakter (termasuk spasi) menggagalkan verifikasi.
- **Callback tidak masuk** — URL callback harus publik dan terdaftar; test lokal wajib via tunnel.

---

## Cara Pengisian Environment Variable

Scaff **tidak pernah** membuatkan akun atau menagih biaya langganan layanan di atas. Scaff secara otomatis membuat dua file saat generate:

1. `.env.example` — kerangka variable yang wajib diisi (nama + komentar deskripsi, nilai kosong).
2. `SETUP.md` — panduan terperinci cara mendapatkan API key dari masing-masing dashboard.

Kamu cukup menyalin `.env.example` menjadi file env aktif, kemudian mengisi nilai key-mu sendiri **satu layanan sampai tuntas sebelum pindah ke layanan berikutnya**:

```bash
cp .env.example .env.local   # Next.js
cp .env.example .env         # Laravel (+ php artisan key:generate)
```

Langkah detail (termasuk aturan `NEXT_PUBLIC_`, sandbox vs production, dan masalah umum) ada di [Environment & SETUP.md](/docs/env-dan-setup).

> Catatan: daftar key persis mengikuti data tiap template (lihat halaman detail template) — contoh di atas adalah bentuk umumnya. Kalau template-mu hanya memakai Supabase, file `.env.example`-mu hanya berisi dua variable Supabase; tidak perlu mengisi key payment apa pun.
