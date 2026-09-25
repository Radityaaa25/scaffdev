# Cara mencopot Xendit dari template ini

> Dibutuhkan bila kamu memakai payment lain (mis. via Scaffdev Builder).
> Ikuti section sesuai framework template-mu (Next.js ATAU Laravel).
> Estimasi: ±10 menit. Ikuti berurutan — jangan loncat.

## 0. Aturan emas (baca dulu!)

- Hapus **HANYA** file di bagian 1 framework-mu. File di bagian 5 **JANGAN PERNAH** dihapus.
- Kalau ragu satu file, BERHENTI dan tanya pembuat template. Menebak = merusak project.

---

## A. Template Next.js

### A.1. Hapus file (aman — tidak dipakai kode lain)

- `lib/payments/xendit.ts` — client Xendit (invoice, charge, callback verify).
- `app/api/payments/xendit/route.ts` — buat invoice + terima callback.
- `components/checkout/XenditButton.tsx` — tombol bayar di halaman checkout.

```bash
rm lib/payments/xendit.ts "app/api/payments/xendit/route.ts" components/checkout/XenditButton.tsx
```

### A.2. Hapus env (dari `.env.local`)

- `XENDIT_SECRET_KEY`
- `NEXT_PUBLIC_XENDIT_PUBLIC_KEY`

Hapus barisnya, jangan dikosongkan saja.

### A.3. Bersihkan dependency

```bash
npm uninstall xendit-node
```

(Sesuaikan dengan package yang benar-benar terdaftar di `package.json`.)

### A.4. Verifikasi (wajib lolos semua)

```bash
npm run build
```

```bash
grep -ri "xendit" app lib components
```

- Build harus sukses.
- Grep harus menghasilkan **0 baris**. Bila masih ada sisa, hapus import + pemakaiannya, lalu build ulang.

### A.5. Yang JANGAN dihapus (Next.js)

- `lib/payments/types.ts` — interface bersama, dipakai semua payment.
- `app/api/payments/webhook/route.ts` — router umum, bukan khusus Xendit.
- `components/checkout/CheckoutForm.tsx` — form umum, hanya memanggil tombol payment.

---

## B. Template Laravel

### B.1. Hapus file (aman — tidak dipakai kode lain)

- `app/Services/XenditService.php` — client Xendit (invoice, callback verify).
- `app/Http/Controllers/XenditController.php` — buat invoice + terima callback.
- `resources/views/checkout/xendit-button.blade.php` — tombol bayar di checkout.

```bash
rm "app/Services/XenditService.php" "app/Http/Controllers/XenditController.php" "resources/views/checkout/xendit-button.blade.php"
```

### B.2. Hapus env (dari `.env`)

- `XENDIT_SECRET_KEY`
- `XENDIT_PUBLIC_KEY`

Hapus barisnya, jangan dikosongkan saja.

### B.3. Bersihkan dependency

```bash
composer remove xendit/xendit-php
```

(Sesuaikan dengan package yang benar-benar terdaftar di `composer.json`.)

### B.4. Verifikasi (wajib lolos semua)

```bash
composer install --no-dev
php artisan config:clear
```

```bash
grep -ri "xendit" app routes resources config
```

- Install harus sukses tanpa error.
- Grep harus menghasilkan **0 baris**. Bila masih ada sisa (mis. route di
  `routes/web.php`), hapus route + pemakaiannya, lalu verifikasi ulang.

### B.5. Yang JANGAN dihapus (Laravel)

- `app/Contracts/PaymentGateway.php` — interface bersama, dipakai semua payment.
- `routes/payments.php` — router umum, bukan khusus Xendit.
- `resources/views/checkout/form.blade.php` — form umum, hanya memanggil tombol payment.
