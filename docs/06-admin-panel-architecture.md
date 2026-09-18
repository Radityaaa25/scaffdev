# 06 — Admin Panel Architecture

## Tujuan
Memungkinkan admin (anggota tim) menambah, mengedit, dan mengelola metadata template TANPA menyentuh database secara langsung atau menulis kode.

## Lokasi Kode
`apps/admin/` — aplikasi Next.js terpisah (port 3001) dari web publik. Write ke
database TIDAK langsung dari browser, melainkan via API Routes di `apps/web`
(`POST/PUT/DELETE /api/templates`) dengan session dibawa sebagai header
`Authorization: Bearer` (cookie tidak lintas origin/port). Keputusan: admin
terpisah, bukan route di dalam `apps/web`.

## Autentikasi
- Menggunakan Supabase Auth (email/password).
- Untuk MVP, cukup satu tabel `admin_users` yang berisi email anggota tim yang diizinkan login (lihat `03-database-architecture.md`). Tidak perlu sistem registrasi publik — akun admin dibuat manual oleh tim lewat Supabase dashboard.
- Semua route di bawah `/admin/*` (kecuali `/admin/login`) WAJIB dilindungi middleware yang memeriksa session valid. Jika tidak ada session, redirect ke `/admin/login`.

## Halaman & Fungsi

### `/admin/login`
Form email + password sederhana, memanggil Supabase Auth sign-in.

### `/admin` (Dashboard)
- Menampilkan tabel semua template (termasuk yang `is_published = false`, berbeda dari halaman builder publik yang hanya menampilkan yang published).
- Kolom tabel: nama, slug, framework, kategori, status (published/draft), tombol edit, tombol hapus/unpublish.
- Tombol "Tambah Template Baru" mengarah ke `/admin/templates/new`.

### `/admin/templates/new`
Form dengan field:
- Nama template (text input)
- Slug (opsional — otomatis dari nama + framework; immutable setelah dibuat)
- Framework (dropdown setara: Next.js, Laravel)
- Kategori (dropdown: E-commerce, Landing Page, Portfolio)
- Link repo GitHub publik di akun pribadi (text input, validasi `https://github.com/owner/repo[.git]`)
- Deskripsi (textarea)
- Screenshot: input URL langsung (text input) — KEPUTUSAN MVP: tidak menggunakan upload ke Supabase Storage di tahap ini karena menambah kompleksitas (setup bucket, policy, upload handler) yang tidak krusial untuk kebutuhan lomba. Admin mengunggah gambar ke layanan hosting gambar manapun (imgur, atau serupa) secara manual, lalu menempelkan URL-nya ke form. Migrasi ke Supabase Storage bisa menjadi peningkatan pasca-MVP jika dibutuhkan.
- Opsi integrasi (checkbox multi-select, diambil dari tabel `integrasi` — lihat `03-database-architecture.md`)
- Status published (toggle, default off/draft)

**Slug generation:** Field slug TIDAK diinput manual oleh admin secara default — sistem generate otomatis dari `nama` + `framework` (contoh: "E-commerce Basic" + "nextjs" → `ecommerce-basic-nextjs`). Sediakan opsi "edit manual" untuk kasus khusus, dengan validasi uniqueness sebelum simpan.

**Validasi sebelum submit:**
- Link repo harus bisa diakses publik (opsional: lakukan pengecekan HEAD request ke URL saat submit, tampilkan warning jika gagal diakses, tapi tetap izinkan simpan sebagai draft).
- Slug harus unique (cek ke `GET /api/templates/:slug`, jika sudah ada tampilkan error).

### `/admin/templates/[slug]/edit`
Sama seperti form `new`, tapi ter-prefill data existing, memanggil `PUT /api/templates/:slug` saat submit.

## Alur Setelah Admin Menambah Template Baru
1. Admin submit form → data tersimpan ke tabel `templates`.
2. **TIDAK ADA proses build/deploy ulang yang diperlukan.** Template baru otomatis muncul di halaman builder publik (karena halaman itu fetch data secara real-time dari database) dan otomatis bisa dipanggil lewat CLI (karena CLI juga resolve slug secara real-time ke API yang sama). Ini adalah keuntungan utama dari arsitektur slug — lihat `07-template-slug-system.md`.

## Aturan untuk Developer/AI Agent
- Jangan pernah expose Supabase Service Role Key ke sisi client. Semua operasi write (POST/PUT/DELETE) ke database HARUS melalui API Route (server-side), bukan langsung dari komponen client menggunakan Supabase client-side SDK dengan service role.
- Validasi input di sisi server (API Route) WAJIB ada, jangan hanya mengandalkan validasi di form sisi client.

## Referensi Silang
- Skema tabel yang diisi lewat form ini: `03-database-architecture.md`
- Endpoint yang dipanggil form ini: `04-api-backend-architecture.md`
- Cara sistem slug bekerja setelah data ini disimpan: `07-template-slug-system.md`