---
title: Konsep Dasar Scaffdev
description: Memahami apa itu Scaffdev, alur kerja web ke CLI, dan istilah penting seperti slug, template, dan integrasi.
order: 1
section: Mulai
---

# Konsep Dasar Scaffdev

Scaffdev adalah **scaffolding generator**: tools yang membuatkan project baru siap jalan dalam hitungan detik — bukan folder kosong, melainkan starter kit lengkap dengan tampilan visual yang sudah jadi, struktur folder best-practice, dan panduan setup integrasi.

## Alur Kerja (3 Langkah)

1. **Pilih di web** — buka katalog, pilih kategori (E-commerce, Landing Page, Portfolio) dan framework (Next.js atau Laravel), lihat preview, lalu copy satu baris command.
2. **Generate di terminal** — paste command `npx scaffdev@latest --template=<slug>`, tekan enter. CLI meng-clone template dan men-generate `.env.example` + `SETUP.md`.
3. **Setup & jalan** — ikuti `SETUP.md` untuk mengisi API key, lalu `npm run dev` (Next.js) atau `php artisan serve` (Laravel).

## Istilah Penting

- **Template** — satu starter kit lengkap (kode + tampilan + struktur). Contoh: E-commerce Basic, SaaS Landing Page.
- **Slug** — kode pendek unik tiap template, contoh `ecommerce-basic-nextjs`. Slug inilah yang kamu pakai di command CLI (`--template=ecommerce-basic-nextjs`). Tidak perlu hafal URL GitHub.
- **Framework** — teknologi utama template: Next.js (JavaScript/TypeScript) atau Laravel (PHP).
- **Kategori** — jenis project: `ecommerce`, `landing-page`, `portfolio` (bisa bertambah).
- **Integrasi** — layanan pihak ketiga yang sudah disiapkan panduannya, mis. Supabase (database), Midtrans/Xendit (payment), RajaOngkir (ongkir).
- **Basic vs Berintegrasi** — template Basic tanpa layanan tambahan; template berintegrasi menyertakan SDK + panduan setup layanan tertentu.

## Kenapa Tidak Clone Manual Saja?

Bisa saja clone repo GitHub-nya langsung — semua repo template bersifat publik. Tapi lewat CLI kamu dapat tiga hal ekstra: resolusi slug otomatis (tidak perlu cari URL), `.env.example` yang digabungkan dari semua integrasi template itu, dan `SETUP.md` berisi langkah setup tiap layanan. Satu command, project langsung siap dikonfigurasi.
