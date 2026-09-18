---
title: Daftar Integrasi yang Didukung
description: Ringkasan layanan pihak ketiga dan integrasi lokal Indonesia yang didukung oleh template Scaff.
order: 5
section: Panduan
---

# Daftar Integrasi yang Didukung

Salah satu keunggulan utama Scaff adalah kurasi integrasi yang relevan untuk kebutuhan developer, terutama integrasi lokal Indonesia yang sering kali tidak tersedia pada boilerplate global.

---

## 1. Database & Autentikasi: Supabase

[Supabase](https://supabase.com) adalah alternatif open-source untuk Firebase yang menyediakan database PostgreSQL, autentikasi pengguna, instant API, dan storage.

### Environment Variable yang Digunakan:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Kapan Memilih Supabase:
- Cocok untuk project E-commerce, SaaS, dan aplikasi yang membutuhkan sistem login user, keranjang belanja di database, atau riwayat transaksi.
- Paket gratis (Free Tier) memadai untuk tahap prototipe dan MVP.

---

## 2. Payment Gateway: Midtrans

[Midtrans](https://midtrans.com) adalah payment gateway terkemuka di Indonesia yang mendukung pembayaran via QRIS, GoPay, OVO, ShopeePay, Virtual Account Bank (BCA, Mandiri, BNI, BRI), hingga kartu kredit.

### Environment Variable yang Digunakan:
```bash
MIDTRANS_SERVER_KEY=SB-Mid-server-...
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=SB-Mid-client-...
```

### Cara Kerja di Template Scaff:
- Menggunakan popup **Midtrans Snap** untuk pengalaman checkout yang mulus tanpa mengalihkan user ke halaman luar.
- Dilengkapi template endpoint webhook verifikasi notifikasi pembayaran.

---

## 3. Payment Gateway: Xendit

[Xendit](https://xendit.co) adalah platform infrastruktur pembayaran untuk Indonesia dan Asia Tenggara yang menyediakan invoice online, direct debit, e-Wallet, dan virtual account.

### Environment Variable yang Digunakan:
```bash
XENDIT_SECRET_KEY=xnd_development_...
NEXT_PUBLIC_XENDIT_PUBLIC_KEY=xnd_public_...
```

---

## 4. Ongkos Kirim: RajaOngkir

[RajaOngkir](https://rajaongkir.com) mempermudah kalkulasi biaya pengiriman ekspedisi di Indonesia (JNE, POS, TIKI, SiCepat, J&T).

### Environment Variable yang Digunakan:
```bash
RAJAONGKIR_API_KEY=your_api_key
```

---

## Cara Pengisian Environment Variable

Scaff **tidak pernah** membuatkan akun atau menagih biaya langganan layanan di atas. Scaff secara otomatis membuat file:

1. `.env.example` — format kerangka variable yang wajib diisi.
2. `SETUP.md` — panduan terperinci cara mendapatkan API key dari masing-masing dashboard.

Anda cukup menyalin `.env.example` menjadi file env aktif, kemudian mengisi nilai key Anda sendiri:

```bash
cp .env.example .env.local   # Next.js
cp .env.example .env         # Laravel (+ php artisan key:generate)
```

> Catatan: daftar key persis mengikuti data tiap template (lihat halaman detail template) — contoh di atas adalah bentuk umumnya. Panduan lengkap ada di [Environment & SETUP.md](/docs/env-dan-setup).
