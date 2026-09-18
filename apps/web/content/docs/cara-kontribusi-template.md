---
title: Panduan Kontribusi Template
description: Standar kualitas, struktur folder, dan panduan bagi developer eksternal yang ingin berkontribusi membuat template baru untuk Scaff.
order: 8
section: Referensi
---

# Panduan Kontribusi Template

Kami menyambut kontribusi dari komunitas developer untuk memperkaya variasi template di katalog Scaff. Agar setiap template yang dirilis memiliki standar kualitas yang konsisten, aman, dan mudah dipelajari, silakan ikuti panduan berikut.

---

## Prinsip Dasar Template Scaff

1. **UI Siap Pakai**: Template bukan sekadar folder kosong hasil `create-next-app`. Template harus sudah memiliki tampilan visual, komponen UI terstruktur, dan navigasi yang berfungsi.
2. **Best Practice Modern**: Menggunakan Next.js App Router, TypeScript, dan Tailwind CSS.
3. **Bebas Kredensial Rahasia**: Tidak boleh ada API key asli, token, atau kredensial rahasia yang ter-commit ke dalam repository.

---

## Standar Struktur Folder (Next.js)

Pastikan struktur repository template Anda tersusun rapi seperti contoh berikut:

```
[nama-template]/
├── app/                    → Next.js App Router (WAJIB, bukan Pages Router)
│   ├── (routes)/           → Halaman aplikasi
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── ui/                 → Komponen atomik/reusable (button, card, dialog)
│   └── layout/             → Navbar, footer, sidebar
├── lib/
│   └── utils.ts            → Helper utilities
├── types/
│   └── index.ts            → Definisi tipe TypeScript
├── public/                 → Asset gambar & ikon
├── .env.example            → Template environment variable (kosong/placeholder)
├── .gitignore              → WAJIB menyertakan .env*, node_modules, .next
└── README.md                → Panduan singkat menjalankan template
```

---

## Checklist Kualitas Kode

Sebelum mengajukan template:

- [ ] **TypeScript**: Seluruh kode ditulis dalam TypeScript murni tanpa `any` yang tidak perlu.
- [ ] **Linting**: Berhasil melewati `npm run lint` tanpa error.
- [ ] **Tanpa Hardcode**: Nilai konfigurasi sensitif atau endpoint harus dibaca dari `process.env`.
- [ ] **Clean Code**: Bersihkan seluruh `console.log` sisa debug dan dependency yang tidak terpakai dari `package.json`.
- [ ] **File `.env.example`**: Sediakan file `.env.example` dengan format variabel yang jelas dan dokumentasi singkat fungsi masing-masing key.

---

## Alur Pengajuan Kontribusi

1. **Buat Template**: Bangun project template di repository GitHub publik Anda sendiri.
2. **Uji Coba Mandiri**: Lakukan clone ke folder baru, jalankan `npm install && npm run build`, pastikan build berhasil tanpa peringatan kritis.
3. **Hubungi Tim Scaffdev**: Kirimkan submission Anda dengan menyertakan:
   - Link repository publik
   - Deskripsi singkat dan target kategori (E-commerce, Landing Page, atau Portfolio)
   - Screenshot preview tampilan utama (rasio 16:9 disarankan)
   - Daftar integrasi yang digunakan (jika ada)

Tim Scaff akan mereview struktur kode dan mendaftarkan template Anda ke katalog publik!
