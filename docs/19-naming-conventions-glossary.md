# 19 — Naming Conventions & Glossary

## Tujuan
Menyatukan istilah yang dipakai di seluruh dokumentasi dan kode, agar tidak ada kebingungan makna antar anggota tim/AI agent yang berbeda-beda mengerjakan bagian proyek ini.

## Glosarium Istilah

| Istilah | Definisi |
|---|---|
| **Slug** | Kode pendek unik (huruf kecil, angka, dash) yang mewakili satu template, dipakai sebagai parameter command CLI. Contoh: `ecommerce-basic-nextjs`. Lihat `07-template-slug-system.md`. |
| **Template** | Satu paket project lengkap (struktur folder + tampilan visual jadi) untuk kategori dan framework tertentu, disimpan sebagai satu repo GitHub. |
| **Kategori** | Jenis project, contoh: `ecommerce`, `landing-page`, `portfolio`. |
| **Framework** | Teknologi dasar project, contoh: `nextjs`, `laravel`. |
| **Integrasi** | Opsi tambahan yang bisa disertakan dalam template, contoh: `supabase` (database), `midtrans` (payment). Lihat tabel `integrasi` di `03-database-architecture.md`. |
| **Kombinasi Terbatas** | Pendekatan MVP di mana user memilih dari daftar kombinasi template yang sudah dibuat sebelumnya (pre-built), BUKAN merakit bebas dari opsi-opsi terpisah. Lawan dari "Custom Combination Engine". |
| **Base Template** | (Konsep roadmap, belum diimplementasikan) Template dasar tanpa integrasi apapun, digunakan sebagai fondasi untuk sistem kustomisasi bebas di masa depan. Lihat `17-roadmap-custom-combination-engine.md`. |
| **Repo Template** | Repository GitHub yang berisi isi kode satu template, disimpan di dalam GitHub Organization. |
| **CLI** | Package Node.js yang dipublish ke npm, dijalankan user di terminal untuk generate project dari template. |
| **Builder** (halaman) | Halaman web tempat user memilih kategori, framework, dan kombinasi template secara visual. |
| **Admin Panel** | Halaman web internal untuk tim mengelola metadata template (tambah, edit, hapus). |
| **AI Recommendation Assistant** | Fitur AI yang merekomendasikan kombinasi template dari daftar yang ada, berdasarkan input bahasa natural user. |
| **AI Setup Chatbot** | Fitur AI yang membantu troubleshooting proses instalasi/setup berdasarkan dokumentasi yang ada. |

## Konvensi Penamaan Kode

### Penamaan File
- Komponen React: PascalCase, contoh `TemplateCard.tsx`
- Utility/helper function: camelCase, contoh `apiClient.ts`
- File dokumentasi: kebab-case dengan prefix angka urut, contoh `07-template-slug-system.md`

### Penamaan Variable & Fungsi (TypeScript)
- Variable dan fungsi: camelCase
- Type dan interface: PascalCase, contoh `interface Template { ... }`
- Konstanta global: UPPER_SNAKE_CASE, contoh `const MAX_TEMPLATE_NAME_LENGTH = 100`

### Penamaan Slug (Data)
- Format: `[kategori]-[varian]-[framework]`, semua huruf kecil, dipisah dash
- Contoh valid: `ecommerce-basic-nextjs`, `landingpage-basic-nextjs`
- Contoh TIDAK valid: `Ecommerce_Basic_NextJS`, `ecommerce basic nextjs`

### Penamaan Kode Integrasi (Data)
- Format: nama service dalam huruf kecil, satu kata jika memungkinkan
- Contoh: `supabase`, `midtrans`, `clerk`, `xendit`

### Penamaan Repo GitHub
- Disarankan identik dengan slug untuk memudahkan pelacakan, meski secara teknis tidak wajib sama persis (sumber kebenaran tetap kolom `slug` di database, lihat `07-template-slug-system.md`)

## Bahasa dalam Kode vs Dokumentasi
- **Kode** (nama variable, fungsi, komentar teknis): Bahasa Inggris, mengikuti konvensi umum industri software.
- **Dokumentasi** (`docs/*.md`, `PRD-scaffolding-tool.md`): Bahasa Indonesia.
- **Teks yang ditampilkan ke user** (UI, pesan error CLI, `SETUP.md` yang di-generate): Bahasa Indonesia.

## Referensi Silang
File ini adalah rujukan istilah untuk SEMUA file lain di folder `docs/`. Jika menemukan istilah baru yang belum terdaftar di sini saat mengerjakan bagian manapun dari proyek, tambahkan definisinya ke file ini agar tetap menjadi sumber kebenaran tunggal.
