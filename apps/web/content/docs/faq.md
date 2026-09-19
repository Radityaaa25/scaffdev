---
title: Pertanyaan yang Sering Diajukan (FAQ)
description: Jawaban atas pertanyaan umum seputar penggunaan, keamanan, dan batasan Scaff.
order: 7
section: Panduan
---

# Pertanyaan yang Sering Diajukan (FAQ)

Kumpulan jawaban atas pertanyaan yang paling sering masuk — dari biaya, akun, keamanan, sampai batasan teknis. Kalau pertanyaanmu belum ada di sini, tanyakan ke asisten AI di pojok kanan bawah dengan konteks yang jelas (template apa, langkah mana yang gagal).

---

### 1. Apakah Scaff gratis digunakan?

**Ya, 100% gratis.** Seluruh template starter kit dan CLI Scaff bersifat open-source dan dapat kamu gunakan untuk project pribadi, perlombaan, maupun kebutuhan komersial.

Yang mungkin berbayar adalah **layanan pihak ketiga** yang kamu pakai di dalam template (mis. paket berbayar Supabase / Midtrans / Xendit bila melewati kuota gratis). Scaff tidak memungut biaya dan tidak menagih langganan apa pun — tagihan layanan luar sepenuhnya urusanmu dengan penyedia layanan tersebut. Untuk tahap belajar dan MVP, tier gratis masing-masing layanan umumnya sudah cukup.

---

### 2. Apakah Scaff membuatkan akun Supabase atau Midtrans untuk saya?

**Tidak.** Scaff adalah scaffolding generator, bukan penyedia akun pihak ketiga. Kamu tetap mendaftar akun di layanan terkait secara mandiri. Scaff membantu dengan:

- Menyusun kode integrasi yang sudah teruji (client Supabase, Snap Midtrans, webhook contoh, dll).
- Men-generate file `.env.example` yang siap diisi (nama variable + komentar deskripsi).
- Menyediakan file `SETUP.md` dengan instruksi lengkap cara mendapatkan API key dari tiap dashboard.

Alurnya selalu: daftar akun sendiri → ambil key → tempel ke file env lokal. Tidak ada key yang transit di server Scaffdev.

---

### 3. Apakah repository template Scaff bersifat publik?

**Ya.** Di tahap MVP, seluruh template starter kit disimpan sebagai repository GitHub publik di akun masing-masing pembuatnya (tanpa GitHub Organization). Dampaknya:

- Proses `git clone` berjalan cepat **tanpa login ataupun personal access token**.
- Siapa pun bisa mengintip kode template sebelum generate — manfaatkan untuk menilai kualitas.
- Kamu **tidak boleh** meng-commit file `.env.local` / `.env` berisi secret key asli ke repository publik (milikmu maupun milik template). File env aktif selalu masuk `.gitignore`. Kalau tidak sengaja ter-commit, revoke key di dashboard layanan segera.

---

### 4. Apa perbedaan template "Basic" dengan template berintegrasi?

- **Template Basic** (contoh: `ecommerce-basic-nextjs`): struktur folder dan tampilan UI sudah jadi lengkap, namun data keranjang atau katalog masih disimpan di memory / state lokal tanpa koneksi database. Cocok untuk prototipe UI, demo visual, atau belajar struktur. Setup tercepat — tidak perlu API key apa pun untuk melihat tampilannya.
- **Template Berintegrasi** (contoh: `ecommerce-supabase-midtrans-nextjs`): sudah terhubung dengan SDK Supabase dan gateway pembayaran Midtrans, siap transaksi nyata setelah kamu mengisi `.env.local`. Butuh waktu setup 15–30 menit untuk daftar akun dan isi key.

Aturan praktis: mulai dari Basic kalau tujuanmu demo tampilan hari ini; pilih Berintegrasi kalau tujuanmu transaksi nyata minggu ini.

---

### 5. Apakah Scaff mendukung Laravel? Framework apa saja yang didukung?

**Ya.** Selain Next.js (App Router), katalog Scaff juga menyediakan template **Laravel**. Pilih framework Laravel saat browsing katalog atau lewat interactive prompt CLI.

> **Catatan penting:** Scaffdev saat ini masih dalam masa pengembangan dan baru mendukung 2 framework template yaitu **Next.js** dan **Laravel**. Dukungan framework lain akan terus ditambahkan seiring waktu.

Yang perlu disiapkan tambahan: **PHP 8.2+ dan Composer** (lihat [Cara Install](/docs/cara-install)). Langkah pasca-generate juga sedikit berbeda: file env aktif bernama `.env` (bukan `.env.local`) dan wajib menjalankan `php artisan key:generate` sekali per project. CLI otomatis memeriksa prasyarat PHP & Composer di komputermu dan menampilkan langkah yang sesuai framework.

---

### 6. Bagaimana jika saya menemukan bug pada template?

Laporkan agar bisa diperbaiki. Sertakan tiga hal agar laporanmu cepat ditindaklanjuti:

1. Slug template dan langkah yang gagal (mis. "checkout Midtrans di `ecommerce-supabase-midtrans-nextjs`").
2. Pesan error lengkap (copy 10–15 baris, bukan paraphrase).
3. Hasil cek `node --version` / `git --version` (plus `php --version` untuk Laravel).

Laporkan kendala atau buat pull request di repository GitHub template terkait (link repo ada di halaman detail template). Untuk bug CLI / web katalog, laporkan ke repository utama Scaffdev.

---

### 7. Apakah saya butuh internet untuk memakai Scaffdev?

**Ya, untuk tahap generate.** CLI membutuhkan internet untuk mengambil metadata dari API dan meng-clone repo GitHub. Setelah project ter-generate dan dependency ter-install (`npm install` / `composer install`), development harian (edit kode, `npm run dev`) bisa offline — kecuali fitur yang memang memanggil layanan luar (auth Supabase, payment, ongkir) yang tetap butuh internet.

---

### 8. Apakah API key saya aman? Apakah tersimpan di server Scaffdev?

**Aman selama mengikuti alur yang benar.** API key hanya ada di file env di komputermu (`.env.local` / `.env`) dan tidak pernah dikirim ke server Scaffdev — CLI hanya mengambil metadata template (slug, URL repo, daftar nama variable), bukan nilainya.

Dua aturan yang tidak boleh dilanggar:

1. Jangan commit file env aktif ke Git (semua template sudah memasukkannya ke `.gitignore` — jangan dihapus barisnya).
2. Jangan menaruh secret server dengan prefix `NEXT_PUBLIC_` ( yang terbaca di browser). Ikuti prefix default dari `.env.example`. Detail ada di [Environment & Setup](/docs/env-dan-setup).

---

### 9. Bisakah saya memakai repository template sendiri?

Bisa, dengan dua jalur:

- **Jalur cepat (tanpa katalog):** clone repo publik apa pun manual dengan `git clone` biasa. Kamu tidak mendapat resolve slug dan generate `SETUP.md` otomatis, tapi bebas memakai repo apa saja.
- **Jalur katalog:** daftarkan template-mu mengikuti [Panduan Kontribusi Template](/docs/cara-kontribusi-template) (repo publik, struktur standar, tanpa secret ter-commit). Setelah direview dan di-publish, template-mu bisa dipakai semua orang via slug.

---

### 10. Bagaimana cara update template yang sudah ter-generate?

Project hasil generate adalah **snapshot** (hasil clone saat itu) — tidak terhubung update otomatis ke repo template. Kalau template sumber diperbarui, project lamamu tidak ikut berubah. Pilihanmu:

- Untuk project berjalan: cherry-pick perubahan yang dibutuhkan manual (lihat commit di repo template).
- Untuk project baru: generate ulang dengan slug yang sama untuk mendapat versi terbaru.

Pola ini disengaja: project-mu adalah milikmu penuh setelah generate, tidak akan diubah remote tanpa sepengetahuanmu.

---

### 11. Apakah Scaffdev bisa dipakai di Windows, Mac, dan Linux?

**Ya, ketiganya bisa.** Satu-satunya perbedaan praktis ada di command salin env dan, `PATH`:

- `cp .env.example .env.local` berlaku di Mac / Linux / Git Bash. Di CMD Windows gunakan `copy` sebagai gantinya.
- Kalau `node` / `php` dikenali di satu terminal tapi tidak di terminal lain, masalahnya hampir pasti `PATH` — install ulang runtime dengan opsi "Add to PATH" dan buka ulang terminal.

---

### 12. Apakah saya perlu kartu kredit untuk mencoba payment (Midtrans / Xendit)?

**Tidak, untuk mode sandbox.** Pendaftaran sandbox dan test key gratis tanpa kartu kredit. Kamu bisa mensimulasikan pembayaran penuh (buat transaksi → bayar dengan metode test → verifikasi webhook) murni dengan akun test. Kartu kredit / verifikasi usaha baru dibutuhkan saat aktivasi **production** (go-live) — dan itu pun urusanmu langsung dengan Midtrans / Xendit, bukan dengan Scaffdev.
