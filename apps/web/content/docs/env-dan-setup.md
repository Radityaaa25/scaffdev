---
title: Environment & File SETUP.md
description: Memahami .env.example, pengisian API key, perbedaan environment Next.js vs Laravel, dan cara membaca SETUP.md.
order: 4
section: Panduan
---

# Environment & File SETUP.md

Setiap project hasil generate membawa dua file penting: `.env.example` (daftar variabel yang dibutuhkan) dan `SETUP.md` (panduan mengisinya). Scaffdev **tidak pernah** membuatkan akun pihak ketiga untukmu — akun Supabase / Midtrans / dll tetap kamu buat sendiri, lalu API key-nya ditempel ke file env. Panduan ini menjelaskan konsep env, perbedaan Next.js vs Laravel, cara mengisi key langkah demi langkah, aturan keamanan, dan cara membaca `SETUP.md`.

## Konsep Dasar: Apa Itu Env?

Environment variable (env) adalah cara standar menyimpan konfigurasi rahasia di luar kode: API key, URL database, secret webhook. Alasannya:

1. **Keamanan** — key tidak ikut ter-commit ke Git (file env masuk `.gitignore`).
2. **Fleksibilitas** — environment development, staging, dan production bisa pakai key berbeda tanpa ubah kode.
3. **Standar template** — semua template Scaffdev membaca konfigurasi dari `process.env` (Next.js) atau `env()` (Laravel), tidak ada key yang di-hardcode di kode.

Dua file yang perlu dibedakan:

| File | Fungsi | Di-commit ke Git? |
|---|---|---|
| `.env.example` | Kerangka: nama variable + komentar deskripsi, nilainya kosong. Di-generate CLI dari metadata integrasi. | Ya (aman, tidak berisi key asli) |
| `.env.local` (Next.js) / `.env` (Laravel) | File aktif berisi key aslimu. Dibuat dengan menyalin `.env.example`. | Tidak (masuk `.gitignore`) |

Alur yang benar selalu: salin `.env.example` → isi nilainya → jangan pernah commit file aktif.

## Next.js vs Laravel: Nama File Berbeda

| | Next.js | Laravel |
|---|---|---|
| Contoh bawaan CLI | `.env.example` | `.env.example` |
| File aktif | `.env.local` | `.env` |
| Perintah salin | `cp .env.example .env.local` | `cp .env.example .env` |
| Langkah khusus | — | `php artisan key:generate` |

CLI menuliskan langkah yang benar otomatis sesuai framework template-mu, jadi cukup ikuti `SETUP.md` yang ada di folder project. Tabel di atas untuk referensi cepat kalau kamu lupa.

> **Catatan penting:** Scaffdev saat ini masih dalam masa pengembangan dan baru mendukung 2 framework template yaitu **Next.js** dan **Laravel**. Dukungan framework lain akan terus ditambahkan seiring waktu.

> Catatan Windows CMD: `cp` tidak tersedia di CMD. Gunakan `copy .env.example .env.local` (Next.js) atau `copy .env.example .env` (Laravel). Di PowerShell dan Git Bash, `cp` / `Copy-Item` keduanya bisa.

## Langkah Mengisi Env (Next.js)

1. Salin kerangka menjadi file aktif:

```bash
cp .env.example .env.local
```

2. Buka `.env.local` di editor. Isinya seperti ini (contoh, nilai masih kosong):

```bash
# --- Supabase ---
# URL project Supabase
NEXT_PUBLIC_SUPABASE_URL=
# Anon key project Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# --- Midtrans ---
# Server key Midtrans
MIDTRANS_SERVER_KEY=
# Client key Midtrans
MIDTRANS_CLIENT_KEY=
```

3. Buka `SETUP.md` di folder yang sama. Untuk tiap section integrasi, ikuti langkahnya: daftar akun di dashboard layanan → ambil key yang diminta → tempel ke variable yang sesuai. Isi satu layanan sampai selesai sebelum pindah ke layanan berikutnya.
4. Simpan file, lalu restart dev server (`npm run dev`) agar env baru terbaca. Next.js membaca env saat proses dimulai — mengubah `.env.local` tanpa restart sering dikira "key tidak terbaca" padahal hanya belum restart.
5. Verifikasi: buka halaman fitur terkait (mis. login untuk Supabase, checkout untuk Midtrans). Kalau halaman tampil tapi fitur error, biasanya key salah paste atau mode sandbox/production tertukar (lihat bagian Sandbox di bawah).

## Langkah Mengisi Env (Laravel)

1. Salin kerangka menjadi file aktif:

```bash
cp .env.example .env
```

2. Generate application key (wajib, hanya sekali per project):

```bash
php artisan key:generate
```

Tanpa langkah ini Laravel error `No application encryption key has been specified`.

3. Buka `.env` dan isi key layanan satu per satu mengikuti `SETUP.md`, sama seperti alur Next.js di atas.
4. Jalankan server:

```bash
php artisan serve
```

5. Kalau mengubah `.env` saat server jalan, restart `php artisan serve` agar konfigurasi baru terbaca (Laravel me-cache config dalam beberapa setup).

## Aturan Penting: `NEXT_PUBLIC_` dan Secret

Setiap key disertai komentar deskripsi di `.env.example`. Perhatikan prefix:

- Variable yang diawali `NEXT_PUBLIC_` (Next.js) **terbaca di browser** — siapa pun bisa melihatnya via DevTools. Hanya gunakan prefix ini untuk key publik: Supabase URL, Supabase anon key, Midtrans client key.
- **Jangan pernah** menaruh secret server dengan prefix itu: Midtrans server key, Xendit secret key, dan sejenisnya harus tanpa prefix (`MIDTRANS_SERVER_KEY`, `XENDIT_SECRET_KEY`) agar hanya terbaca di server (API route / server component).
- Kalau ragu, ikuti default dari `.env.example` — prefix di sana sudah benar. Jangan mengganti prefix sendiri.

Contoh pola yang benar:

```bash
# Publik — boleh di browser
NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...

# Rahasia — hanya di server, tanpa prefix NEXT_PUBLIC_
MIDTRANS_SERVER_KEY=SB-Mid-server-xxxx
XENDIT_SECRET_KEY=xnd_development_xxxx
```

## Sandbox vs Production (Payment)

Untuk Midtrans / Xendit, selalu mulai dari **mode Sandbox / Test**:

1. Daftar akun, ambil **test key** (biasanya diawali `SB-` untuk Midtrans atau `xnd_development_` untuk Xendit).
2. Tempel test key ke env, pastikan alur bayar jalan end-to-end (buat transaksi → bayar dengan metode test → verifikasi webhook masuk).
3. Baru ganti ke **production key** saat akan go-live. Jangan campur: server key sandbox dengan client key production tidak akan cocok.

Jangan pernah commit file env berisi key asli ke Git — pastikan `.env` dan `.env.local` ada di `.gitignore` (semua template Scaffdev sudah menyertakannya). Kalau tidak sengaja ter-commit, revoke / regenerate key di dashboard layanan segera, karena histori Git tetap menyimpan key walau file-nya sudah dihapus.

## Membaca SETUP.md

`SETUP.md` di-generate CLI di folder project khusus untuk template yang kamu pilih — isinya tidak generik. Struktur standarnya selalu sama:

1. **Langkah Cepat** — urutan install → env → run dalam 5–10 baris. Ikuti ini dulu untuk gambaran besar.
2. **Satu section per integrasi** — masing-masing berisi: daftar akun di mana, key apa yang diambil dari dashboard mana, ditempel ke variable apa, dan cara verifikasi (mis. "buka halaman checkout, pastikan popup Snap muncul").
3. **Catatan khusus framework** — mis. `php artisan key:generate` untuk Laravel.

Kalau mentok di satu layanan, kerjakan section itu saja sampai tuntas sebelum lanjut. Salin pesan error lengkapnya dan tanyakan ke asisten AI di pojok kanan bawah — ia membaca dokumentasi ini juga, jadi sebutkan nama layanan + langkah mana yang gagal.

## Masalah Env yang Sering Terjadi

- **Env tidak terbaca setelah diisi** — lupa restart dev server. Restart `npm run dev` / `php artisan serve`.
- **Fitur auth/payment error padahal key sudah diisi** — kemungkinan salah paste (spasi di awal/akhir), tertukar sandbox vs production, atau prefix `NEXT_PUBLIC_` diubah. Bandingkan lagi dengan `.env.example`.
- **Error `APP_KEY` di Laravel** — lupa `php artisan key:generate` setelah menyalin `.env`.
- **`cp` tidak dikenali (Windows CMD)** — gunakan `copy` sebagai gantinya.
