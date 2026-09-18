---
title: Environment & File SETUP.md
description: Memahami .env.example, pengisian API key, perbedaan environment Next.js vs Laravel, dan cara membaca SETUP.md.
order: 4
section: Panduan
---

# Environment & File SETUP.md

Setiap project hasil generate membawa dua file penting: `.env.example` (daftar variabel yang dibutuhkan) dan `SETUP.md` (panduan mengisinya). Scaffdev **tidak pernah** membuatkan akun pihak ketiga untukmu — akun Supabase/Midtrans/dll tetap kamu buat sendiri, lalu API key-nya ditempel ke file env.

## Next.js vs Laravel: Nama File Berbeda

| | Next.js | Laravel |
|---|---|---|
| Contoh bawaan CLI | `.env.example` | `.env.example` |
| File aktif | `.env.local` | `.env` |
| Perintah salin | `cp .env.example .env.local` | `cp .env.example .env` |
| Langkah khusus | — | `php artisan key:generate` |

CLI menuliskan langkah yang benar otomatis sesuai framework template-mu, jadi cukup ikuti `SETUP.md` yang ada di folder project.

## Contoh Isi `.env.example`

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

Setiap key disertai komentar deskripsi. Nilai yang diawali `NEXT_PUBLIC_` akan terbaca di browser — jangan taruh secret server (mis. Server Key Midtrans) dengan prefix itu.

## Sandbox vs Production (Payment)

Untuk Midtrans/Xendit, selalu mulai dari **mode Sandbox/Test**: daftar, ambil test key, pastikan alur bayar jalan end-to-end, baru ganti ke production key. Jangan pernah commit file env berisi key asli ke Git — pastikan `.env`, `.env.local` ada di `.gitignore` (semua template Scaffdev sudah menyertakannya).

## Membaca SETUP.md

Struktur standarnya: **Langkah Cepat** (install → env → run) lalu satu section per integrasi berisi langkah daftar akun + key apa yang diambil + ditempel ke mana. Kalau mentok di satu layanan, salin pesan error-nya dan tanyakan ke asisten AI di pojok kanan bawah — ia membaca dokumentasi ini juga.
