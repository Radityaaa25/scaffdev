# Cara mencopot Supabase dari template ini

> Dibutuhkan bila kamu memakai database/auth lain (mis. via Scaffdev Builder).
> Ikuti section sesuai framework template-mu (Next.js ATAU Laravel).
> Estimasi: ±10 menit. Ikuti berurutan — jangan loncat.

## 0. Aturan emas (baca dulu!)

- Hapus **HANYA** file di bagian 1 framework-mu. File di bagian 5 **JANGAN PERNAH** dihapus.
- Kalau ragu satu file, BERHENTI dan tanya pembuat template. Menebak = merusak project.

---

## A. Template Next.js

### A.1. Hapus file (aman — tidak dipakai kode lain)

- `lib/supabase.ts` — inisialisasi Supabase client.
- `lib/auth.ts` — helper register/login/logout via Supabase Auth.

```bash
rm lib/supabase.ts lib/auth.ts
```

### A.2. Hapus env (dari `.env.local`)

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Hapus barisnya, jangan dikosongkan saja.

### A.3. Bersihkan dependency

```bash
npm uninstall @supabase/supabase-js @supabase/ssr
```

(Sesuaikan dengan package yang benar-benar terdaftar di `package.json` — hapus hanya yang berhubungan Supabase.)

### A.4. Verifikasi (wajib lolos semua)

```bash
npm run build
```

```bash
grep -ri "supabase" app lib components
```

- Build harus sukses.
- Grep harus menghasilkan **0 baris**. Bila masih ada sisa (mis. guard login di
  halaman tertentu), ganti dengan logika auth penggantimu, lalu build ulang.

### A.5. Yang JANGAN dihapus (Next.js)

- `lib/db-types.ts` — definisi tipe data bersama (Product, Order, dsb.), bukan khusus Supabase.
- `middleware.ts` — middleware umum aplikasi, bukan khusus Supabase.
- Halaman login/register (`app/(auth)/`) — UI-nya generik; yang diganti hanya pemanggil `lib/auth.ts` di dalamnya.

---

## B. Template Laravel

### B.1. Hapus file (aman — tidak dipakai kode lain)

- `app/Services/SupabaseService.php` — client Supabase (database + auth).
- `app/Http/Controllers/Auth/SupabaseAuthController.php` — register/login/logout.

```bash
rm "app/Services/SupabaseService.php" "app/Http/Controllers/Auth/SupabaseAuthController.php"
```

### B.2. Hapus env (dari `.env`)

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

Hapus barisnya, jangan dikosongkan saja.

### B.3. Bersihkan dependency

```bash
composer remove supabase/supabase-php
```

(Sesuaikan dengan package yang benar-benar terdaftar di `composer.json`.)

### B.4. Verifikasi (wajib lolos semua)

```bash
composer install --no-dev
php artisan config:clear
```

```bash
grep -ri "supabase" app routes resources config
```

- Install harus sukses tanpa error.
- Grep harus menghasilkan **0 baris**. Bila masih ada sisa (mis. guard di
  route/middleware), ganti dengan logika auth penggantimu, lalu verifikasi ulang.

### B.5. Yang JANGAN dihapus (Laravel)

- `app/Models/` — model Eloquent generik, bukan khusus Supabase.
- `database/migrations/` — migrasi skema generik (sesuaikan isinya, jangan hapus file-nya membabi buta).
- View login/register (`resources/views/auth/`) — UI-nya generik; yang diganti hanya pemanggil service di controller-nya.
