# Cara mencopot Duitku dari template ini

> Dibutuhkan bila kamu memakai payment lain (mis. via Scaffdev Builder).
> Ikuti section sesuai framework template-mu (Next.js ATAU Laravel).
> Estimasi: ±10 menit. Ikuti berurutan — jangan loncat.

## 0. Aturan emas (baca dulu!)

- Hapus **HANYA** file di bagian 1 framework-mu. File di bagian 5 **JANGAN PERNAH** dihapus.
- Kalau ragu satu file, BERHENTI dan tanya pembuat template. Menebak = merusak project.

---

## A. Template Next.js

### A.1. Hapus file (aman — tidak dipakai kode lain)

- `lib/payments/duitku.ts` — client Duitku (buat transaksi + verifikasi signature callback).
- `app/api/payments/duitku/route.ts` — buat transaksi + terima callback.
- `components/checkout/DuitkuButton.tsx` — tombol bayar di halaman checkout.

```bash
rm lib/payments/duitku.ts "app/api/payments/duitku/route.ts" components/checkout/DuitkuButton.tsx
```

### A.2. Hapus env (dari `.env.local`)

- `DUITKU_MERCHANT_CODE`
- `DUITKU_API_KEY`

Hapus barisnya, jangan dikosongkan saja.

### A.3. Bersihkan dependency

Duitku dipakai via HTTP API langsung (tanpa SDK wajib). Bila template-mu
mendaftarkan package terkait, hapus yang berhubungan saja, contoh:

```bash
npm uninstall duitku-node
```

(Lewati langkah ini bila tidak ada package Duitku di `package.json`.)

### A.4. Verifikasi (wajib lolos semua)

```bash
npm run build
```

```bash
grep -ri "duitku" app lib components
```

- Build harus sukses.
- Grep harus menghasilkan **0 baris**. Bila masih ada sisa, hapus import + pemakaiannya, lalu build ulang.

### A.5. Yang JANGAN dihapus (Next.js)

- `lib/payments/types.ts` — interface bersama, dipakai semua payment.
- `app/api/payments/webhook/route.ts` — router umum, bukan khusus Duitku.
- `components/checkout/CheckoutForm.tsx` — form umum, hanya memanggil tombol payment.

---

## B. Template Laravel

### B.1. Hapus file (aman — tidak dipakai kode lain)

- `app/Services/DuitkuService.php` — client Duitku (transaksi + signature callback).
- `app/Http/Controllers/DuitkuController.php` — buat transaksi + terima callback.
- `resources/views/checkout/duitku-button.blade.php` — tombol bayar di checkout.

```bash
rm "app/Services/DuitkuService.php" "app/Http/Controllers/DuitkuController.php" "resources/views/checkout/duitku-button.blade.php"
```

### B.2. Hapus env (dari `.env`)

- `DUITKU_MERCHANT_CODE`
- `DUITKU_API_KEY`

Hapus barisnya, jangan dikosongkan saja.

### B.3. Bersihkan dependency

Duitku dipakai via HTTP API langsung (tanpa SDK wajib). Bila template-mu
mendaftarkan package terkait, hapus yang berhubungan saja, contoh:

```bash
composer remove duitku/duitku-php
```

(Lewati langkah ini bila tidak ada package Duitku di `composer.json`.)

### B.4. Verifikasi (wajib lolos semua)

```bash
composer install --no-dev
php artisan config:clear
```

```bash
grep -ri "duitku" app routes resources config
```

- Install harus sukses tanpa error.
- Grep harus menghasilkan **0 baris**. Bila masih ada sisa (mis. route di
  `routes/web.php`), hapus route + pemakaiannya, lalu verifikasi ulang.

### B.5. Yang JANGAN dihapus (Laravel)

- `app/Contracts/PaymentGateway.php` — interface bersama, dipakai semua payment.
- `routes/payments.php` — router umum, bukan khusus Duitku.
- `resources/views/checkout/form.blade.php` — form umum, hanya memanggil tombol payment.
