---
title: Pertanyaan yang Sering Diajukan (FAQ)
description: Jawaban atas pertanyaan umum seputar penggunaan, keamanan, dan batasan Scaff.
order: 7
section: Panduan
---

# Pertanyaan yang Sering Diajukan (FAQ)

---

### 1. Apakah Scaff gratis digunakan?
**Ya, 100% gratis.** Seluruh template starter kit dan CLI Scaff bersifat open-source dan dapat Anda gunakan baik untuk project pribadi, perlombaan, maupun kebutuhan komersial.

---

### 2. Apakah Scaff membuatkan akun Supabase atau Midtrans untuk saya?
**Tidak.** Scaff adalah scaffolding generator, bukan penyedia akun pihak ketiga. Anda tetap perlu mendaftarkan akun di layanan terkait secara mandiri. Scaff membantu Anda dengan:
- Menyusun kode integrasi yang sudah teruji.
- Men-generate file `.env.example` yang siap diisi.
- Menyediakan file `SETUP.md` dengan instruksi lengkap cara mendapatkan API key.

---

### 3. Apakah repository template Scaff bersifat publik?
**Ya.** Di tahap MVP, seluruh template starter kit disimpan sebagai repository GitHub publik di akun masing-masing pembuatnya (tanpa GitHub Organization). Hal ini memungkinkan proses `git clone` berjalan cepat tanpa memerlukan login ataupun personal access token. Pastikan Anda **tidak pernah** meng-commit file `.env.local` yang berisi secret key asli Anda ke repository publik.

---

### 4. Apa perbedaan template "Basic" dengan template berintegrasi?
- **Template Basic** (contoh: `ecommerce-basic-nextjs`): Memiliki struktur folder dan tampilan UI yang sudah jadi lengkap, namun data keranjang atau katalog masih disimpan di memory/state lokal tanpa koneksi database.
- **Template Berintegrasi** (contoh: `ecommerce-supabase-midtrans-nextjs`): Sudah terhubung dengan SDK Supabase dan gateway pembayaran Midtrans, siap pakai untuk transaksi nyata setelah Anda mengisi `.env.local`.

---

### 5. Apakah Scaff mendukung Laravel?
**Ya.** Selain Next.js (App Router), katalog Scaff juga menyediakan template **Laravel**. Pilih framework Laravel saat browsing katalog atau lewat interactive prompt CLI — CLI otomatis memeriksa prasyarat PHP & Composer di komputer Anda.

---

### 6. Bagaimana jika saya menemukan bug pada template?
Silakan laporkan kendala atau buat pull request di repository GitHub template terkait.
