# Cara mencopot Midtrans dari template ini

> Dibutuhkan bila kamu memakai payment lain (mis. via Scaffdev Builder).
> Ikuti section sesuai framework template-mu (Next.js ATAU Laravel).
> Estimasi: ±10 menit. Ikuti berurutan — jangan loncat.

## 0. Aturan emas (baca dulu!)

- Hapus **HANYA** file di bagian 1 framework-mu. File di bagian 5 **JANGAN PERNAH** dihapus.
- Kalau ragu satu file, BERHENTI dan tanya pembuat template. Menebak = merusak project.

---

## A. Template Next.js

### A.1. Hapus file (aman — tidak dipakai kode lain)

- `lib/payments/midtrans.ts` — client & config Snap Midtrans.
- `app/api/payments/midtrans/route.ts` — buat transaksi + terima webhook.
- `components/checkout/MidtransButton.tsx` — tombol bayar di halaman checkout.

```bash
rm lib/payments/midtrans.ts "app/api/payments/midtrans/route.ts" components/checkout/MidtransButton.tsx
```

### A.2. Hapus env (dari `.env.local`)

- `MIDTRANS_SERVER_KEY`
- `MIDTRANS_CLIENT_KEY`

Hapus barisnya, jangan dikosongkan saja.

### A.3. Bersihkan dependency

```bash
npm uninstall midtrans-client
```

### A.4. Verifikasi (wajib lolos semua)

```bash
npm run build
```

```bash
grep -ri "midtrans" app lib components
```

- Build harus sukses.
- Grep harus menghasilkan **0 baris**. Bila masih ada sisa (mis. import di file
  checkout), hapus import + pemakaiannya, lalu build ulang.

### A.5. Yang JANGAN dihapus (Next.js)

- `lib/payments/types.ts` — interface bersama, dipakai semua payment.
- `app/api/payments/webhook/route.ts` — router umum, bukan khusus Midtrans.
- `components/checkout/CheckoutForm.tsx` — form umum, hanya memanggil tombol payment.

---

## B. Template Laravel

### B.1. Hapus file (aman — tidak dipakai kode lain)

- `app/Services/MidtransService.php` — client & config Snap Midtrans.
- `app/Http/Controllers/MidtransController.php` — buat transaksi + terima webhook.
- `resources/views/checkout/midtrans-button.blade.php` — tombol bayar di checkout.

```bash
rm "app/Services/MidtransService.php" "app/Http/Controllers/MidtransController.php" "resources/views/checkout/midtrans-button.blade.php"
```

### B.2. Hapus env (dari `.env`)

- `MIDTRANS_SERVER_KEY`
- `MIDTRANS_CLIENT_KEY`

Hapus barisnya, jangan dikosongkan saja.

### B.3. Bersihkan dependency

```bash
composer remove midtrans/midtrans-php
```

### B.4. Verifikasi (wajib lolos semua)

```bash
composer install --no-dev
php artisan config:clear
```

```bash
grep -ri "midtrans" app routes resources config
```

- Install harus sukses tanpa error.
- Grep harus menghasilkan **0 baris**. Bila masih ada sisa (mis. route di
  `routes/web.php`), hapus route + pemakaiannya, lalu verifikasi ulang.

### B.5. Yang JANGAN dihapus (Laravel)

- `app/Contracts/PaymentGateway.php` — interface bersama, dipakai semua payment.
- `routes/payments.php` — router umum, bukan khusus Midtrans.
- `resources/views/checkout/form.blade.php` — form umum, hanya memanggil tombol payment.
