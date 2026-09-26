# Template panduan copot — COPY file ini menjadi REMOVE-<KODE>.md

> Cara pakai: duplikat file ini, ganti `<KODE>` dengan kode integrasi
> (huruf KAPITAL untuk judul, huruf kecil untuk path), lalu isi semua
> bagian bertanda ✏️. Hapus baris ini setelah selesai.
>
> Aturan file: 1 file per integrasi, WAJIB 2 section framework
> (Next.js dan Laravel) walau template-mu hanya mendukung salah satunya
> (isi section yang tidak relevan dengan "Tidak berlaku untuk template ini").
> Daftarkan nama file akhirnya di `scaff.template.json` → `removalGuides`.

# Cara mencopot ✏️NAMA-INTEGRASI dari template ini

> Dibutuhkan bila kamu memakai layanan lain se-kategori (mis. via Scaffdev Builder).
> Ikuti section sesuai framework template-mu (Next.js ATAU Laravel).
> Estimasi: ±10 menit. Ikuti berurutan — jangan loncat.

## 0. Aturan emas (baca dulu!)

- Hapus **HANYA** file di bagian 1 framework-mu. File di bagian 5 **JANGAN PERNAH** dihapus.
- Kalau ragu satu file, BERHENTI dan tanya pembuat template. Menebak = merusak project.

---

## A. Template Next.js

### A.1. Hapus file (aman — tidak dipakai kode lain)

- ✏️`path/ke/file.ts` — deskripsi satu baris fungsi file ini.
- ✏️`path/ke/file-lain.ts` — deskripsi satu baris fungsi file ini.

```bash
✏️rm path/ke/file.ts path/ke/file-lain.ts
```

### A.2. Hapus env (dari `.env.local`)

- ✏️`NAMA_KEY_1`
- ✏️`NAMA_KEY_2`

Hapus barisnya, jangan dikosongkan saja.

### A.3. Bersihkan dependency

```bash
✏️npm uninstall nama-package
```

(Lewati langkah ini bila integrasi dipakai via HTTP API langsung tanpa SDK.
Tulis "Lewati" eksplisit agar pembaca tidak bertanya-tanya.)

### A.4. Verifikasi (wajib lolos semua)

```bash
npm run build
```

```bash
✏️grep -ri "kata-kunci" app lib components
```

- Build harus sukses.
- Grep harus menghasilkan **0 baris**. Bila masih ada sisa, hapus import +
  pemakaiannya, lalu build ulang.

### A.5. Yang JANGAN dihapus (Next.js)

- ✏️`path/file-bersama.ts` — alasan: dipakai kode apa (spesifik!).
- ✏️Tulis SEMUA file bersama yang relevan, jangan "dll".

---

## B. Template Laravel

### B.1. Hapus file (aman — tidak dipakai kode lain)

- ✏️`app/Services/NamaService.php` — deskripsi satu baris.
- ✏️`app/Http/Controllers/NamaController.php` — deskripsi satu baris.
- ✏️`resources/views/.../nama-button.blade.php` — deskripsi satu baris.

```bash
✏️rm "app/Services/NamaService.php" "app/Http/Controllers/NamaController.php" "resources/views/.../nama-button.blade.php"
```

### B.2. Hapus env (dari `.env`)

- ✏️`NAMA_KEY_1`
- ✏️`NAMA_KEY_2`

Hapus barisnya, jangan dikosongkan saja.

### B.3. Bersihkan dependency

```bash
✏️composer remove vendor/package
```

(Lewati eksplisit bila tanpa SDK.)

### B.4. Verifikasi (wajib lolos semua)

```bash
composer install --no-dev
php artisan config:clear
```

```bash
✏️grep -ri "kata-kunci" app routes resources config
```

- Install harus sukses tanpa error.
- Grep harus menghasilkan **0 baris**. Bila masih ada sisa, hapus + verifikasi ulang.

### B.5. Yang JANGAN dihapus (Laravel)

- ✏️`app/Contracts/...` — alasan spesifik.
- ✏️`routes/...` — alasan spesifik.
- ✏️view form umum — alasan spesifik.

---

## Checklist sebelum menyimpan file ini

- [ ] Semua path di A.1/B.1 benar-benar ada di repo (cek satu per satu).
- [ ] Nama package di A.3/B.3 sama persis dengan `package.json`/`composer.json`.
- [ ] Kata kunci grep di A.4/B.4 menemukan file A.1/B.1 bila dijalankan SEBELUM hapus
      (kalau grep tidak menemukan apa-apa dari awal, kata kuncinya salah).
- [ ] Bagian 5 menyebut SEMUA file bersama yang relevan (cek import!).
- [ ] Tidak ada lagi tanda ✏️ yang tersisa.
