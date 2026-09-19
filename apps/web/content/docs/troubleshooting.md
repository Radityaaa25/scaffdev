---
title: Troubleshooting
description: Katalog error umum CLI dan web beserta solusinya — dari slug tidak ditemukan sampai prasyarat hilang.
order: 6
section: Panduan
---

# Troubleshooting

> **Catatan penting:** Scaffdev saat ini masih dalam masa pengembangan dan baru mendukung 2 framework template yaitu **Next.js** dan **Laravel**. Dukungan framework lain akan terus ditambahkan seiring waktu.

Temukan pesan errormu di bawah ini dan ikuti solusinya berurutan. Setiap error punya pola yang sama: **pesan error → penyebab → solusi langkah demi langkah**. Kalau belum ketemu, salin pesan error lengkap (termasuk 5–10 baris sebelum dan sesudahnya) lalu tanyakan ke asisten AI di pojok kanan bawah.

> Tips umum sebelum mulai: pastikan Node.js v18+, `git`, dan koneksi internet (lihat [Cara Install](/docs/cara-install)), lalu ulangi command yang gagal untuk memastikan error-nya konsisten — bukan gangguan sesaat.

---

## Template dengan slug "x" tidak ditemukan

**Pesan error:**

```text
Template dengan slug "x" tidak ditemukan
```

**Penyebab:**

- Slug salah ketik (typo, kurang tanda hubung, atau salah casing).
- Template belum di-publish (masih draft) sehingga tidak ada di katalog API.
- Katalog lokal / cache slug kedaluwarsa (untuk instalasi global yang lama).

**Solusi:**

1. Jalankan CLI tanpa flag untuk melihat daftar slug yang tersedia dan pilih dari daftar:

```bash
npx scaffdev@latest
```

2. Kalau sudah tahu slug-nya, pakai flag lengkap dengan tanda `=` (tanpa spasi):

```bash
npx scaffdev@latest --template=<slug>
```

3. Contoh konkret dengan nama folder:

```bash
npx scaffdev@latest toko-saya --template=ecommerce-supabase-midtrans-nextjs
```

4. Kalau slug dari web tapi tetap tidak ditemukan, pastikan kamu meng-copy slug persis (tanpa spasi di awal/akhir) dan template-nya berstatus published. Untuk instalasi global lama, update dulu via `npm update -g scaffdev` lalu ulangi.

---

## Tidak dapat menghubungi API Scaffdev

**Pesan error:**

```text
Tidak dapat menghubungi API Scaffdev
```

**Penyebab:**

- CLI tidak bisa mencapai API (default: `https://scaffdev.vercel.app`) karena offline, firewall, atau URL API salah.
- URL API belum disesuaikan untuk development lokal (kontributor yang menjalankan API sendiri di `localhost`).

**Solusi:**

1. Pastikan koneksi internet jalan dan coba lagi. Kalau memakai VPN / proxy kantor, test tanpa VPN dulu.
2. Untuk development lokal (API jalan di komputermu sendiri), set environment variable sebelum menjalankan CLI:

```bash
SCAFF_API_BASE_URL=http://localhost:3000 npx scaffdev@latest --template=<slug>
```

3. Untuk PowerShell, set variable-nya terlebih dahulu dalam sesi yang sama:

```powershell
$env:SCAFF_API_BASE_URL="http://localhost:3000"
npx scaffdev@latest --template=<slug>
```

4. Pengguna biasa (bukan kontributor) tidak perlu set variable ini — cukup pastikan command memakai API default dan internet stabil.

---

## Belum ada template aktif yang terdaftar

**Pesan error:**

```text
Belum ada template aktif yang terdaftar
```

**Penyebab:**

- API jalan tapi katalog kosong — belum ada template berstatus published. Umum di instalasi API lokal yang baru.

**Solusi:**

1. Ini normal untuk instalasi baru, bukan bug di komputermu.
2. Daftarkan template lewat panel admin, isi metadata (slug, repo URL, integrasi), lalu ubah status menjadi published.
3. Jalankan ulang CLI — katalog seharusnya sudah terisi.

---

## Prasyarat gagal: Node.js / Composer tidak ditemukan

**Penyebab:**

- Runtime yang dibutuhkan template belum terinstall atau tidak ada di `PATH` terminal yang dipakai.

**Solusi:**

- Template Next.js butuh **Node.js v18+**. Cek dan install:

```bash
node --version
```

Unduh di [nodejs.org](https://nodejs.org) (pilih LTS). Setelah install, tutup dan buka ulang terminal. Pastikan keluar `v18` atau lebih baru — versi 16 ke bawah ditolak CLI.

- Template Laravel butuh **PHP 8.2+ dan Composer**. Cek satu per satu:

```bash
php --version
composer --version
```

Unduh PHP dari situs resmi dan Composer dari [getcomposer.org](https://getcomposer.org). Di Windows, pastikan kedua command dikenali di terminal yang sama dengan tempat kamu menjalankan CLI (masalah umum: install di satu terminal, eksekusi di terminal lain dengan `PATH` berbeda).

---

## Folder sudah ada dan tidak kosong

**Pesan error:**

```text
Folder sudah ada dan tidak kosong
```

**Penyebab:**

- Folder tujuan sudah ada dan berisi file. CLI menolak menimpa diam-diam agar tidak menghapus kerjaanmu.

**Solusi:**

1. Pilih folder kosong atau nama lain:

```bash
npx scaffdev@latest nama-folder-baru --template=<slug>
```

2. Atau jawab "ya" saat ditanya overwrite — hanya bila kamu yakin isi folder boleh ditimpa (mis. folder percobaan kosong).
3. Kalau folder terlihat kosong tapi tetap ditolak, tampilkan file tersembunyi (`.git`, `.DS_Store` dihitung sebagai isi). Hapus folder sepenuhnya lalu generate ulang.

---

## Error saat `npm install` / `composer install`

**Penyebab:**

- Ini di luar kendali CLI — biasanya jaringan (registry / packagist tidak terjangkau), versi runtime tidak cocok dengan dependency template, atau cache install rusak.

**Solusi:**

1. Hapus folder hasil generate (atau `node_modules` / `vendor` bila ingin coba ulang di folder yang sama).
2. Pastikan prasyarat Node.js / PHP di atas sudah lolos.
3. Ulangi generate, lalu install manual untuk melihat pesan error aslinya (jangan hanya mengandalkan output CLI):

```bash
npm install
```

```bash
composer install
```

4. Baca 10–20 baris pertama error asli: `ETIMEDOUT` / `ENOTFOUND` berarti jaringan; `requires php ^8.2` berarti versi PHP kurang; `EBADENGINE` berarti versi Node kurang. Perbaiki sesuai pesannya, bukan mengulang command yang sama berkali-kali.
5. Kalau jaringan kantor memakai proxy, konfigurasi `npm` / `composer` untuk proxy tersebut sebelum install.

---

## `git clone` gagal

**Pesan error:**

```text
git clone gagal
```

**Penyebab:**

- `git` belum terinstall, tidak ada di `PATH`, atau tidak ada akses internet ke github.com.

**Solusi:**

1. Pastikan `git` terinstall dan dikenali:

```bash
git --version
```

2. Pastikan kamu punya akses internet ke github.com (buka di browser sebagai test cepat).
3. Semua repo template bersifat publik — tidak perlu token atau login GitHub. Kalau error menyebut autentikasi, kemungkinan URL remote salah ketik atau file hosts / proxy mengganggu — coba clone URL yang sama manual untuk memastikan.
4. Di jaringan terbatas (kampus / kantor), pastikan port 443 ke github.com tidak diblokir firewall.

---

## Port dev server sudah dipakai

**Pesan error (contoh):**

```text
Port 3000 is already in use
```

**Penyebab:**

- Dev server lama masih jalan di port yang sama (terminal lama belum dimatikan).

**Solusi:**

1. Matikan proses lama (Ctrl+C di terminal tempat server jalan).
2. Atau jalankan di port lain:

```bash
npx next dev -p 3001
```

```bash
php artisan serve --port=8001
```

---

## Env / API key tidak terbaca

**Gejala:** halaman tampil tapi login / payment / ongkir error; log menyebut variable `undefined` atau `missing`.

**Penyebab umum:**

- Lupa menyalin `.env.example` menjadi file aktif, atau lupa restart dev server setelah mengisi env.
- Salah paste (spasi di awal/akhir), tertukar sandbox vs production, atau prefix `NEXT_PUBLIC_` diubah.

**Solusi:**

1. Pastikan file aktif ada (`.env.local` untuk Next.js, `.env` untuk Laravel) dan sudah diisi mengikuti `SETUP.md`.
2. Restart dev server — Next.js dan Laravel membaca env saat proses dimulai.
3. Bandingkan nama variable dengan `.env.example` huruf per huruf. Detail lengkap ada di [Environment & Setup](/docs/env-dan-setup).

---

## Cara membaca pesan error (metode 2 menit)

Sebelum scroll ke daftar error, pahami dulu anatomi pesan error agar solusinya
ketemu dalam 2 menit, bukan 2 jam:

1. **Baca 10–20 baris PERTAMA error, bukan yang terakhir.** Baris pertama
   biasanya berisi penyebab asli (`Error: ...`, `ETIMEDOUT`, `requires php ^8.2`);
   baris-baris akhir biasanya hanya jejak tumpukan (stack trace) yang mengulang.
2. **Pisahkan "apa" dari "di mana".** Contoh `npm ERR! code ERESOLVE` → "apa"-nya
   konflik dependency, "di mana"-nya nama package yang disebut di bawahnya.
3. **Ulangi command sekali lagi.** Error jaringan/sementara hilang di percobaan
   kedua. Kalau hasilnya beda-beda tiap run, curigai koneksi — bukan kode.
4. **Kecilkan masalah:** error saat `npm install`? Jalankan manual di folder project
   agar pesan aslinya terlihat (CLI merangkum output dan bisa menyembunyikan detail).

### Cek diagnostik satu menit

Jalankan blok ini dan simpan hasilnya sebelum bertanya ke siapa pun:

```bash
node --version
npm --version
git --version
```

```bash
php --version
composer --version
```

Versi yang sehat: Node.js v18+, npm v9+, git sembarang versi modern,
PHP 8.2+, Composer v2+. Kalau salah satunya error `command not found`,
berhenti di sini dan bereskan instalasinya dulu — 80% error misterius
berasal dari prasyarat yang belum lolos.

---

## Error saat install: konflik dependency (ERESOLVE)

**Pesan error (contoh):**

```text
npm ERR! code ERESOLVE
npm ERR! ERESOLVE could not resolve
npm ERR! While resolving: ...
```

**Penyebab:**

- Template mengunci versi dependency yang tidak cocok dengan versi Node.js-mu
  (mis. template butuh Node 18 tapi kamu pakai Node 22, atau sebaliknya).
- Cache `node_modules` / `package-lock.json` rusak dari percobaan sebelumnya.

**Solusi:**

1. Pastikan Node.js-mu v18+ (lihat cek diagnostik di atas). Kalau memakai nvm/nvm-windows,
   ganti versi lalu install ulang dari nol:

```bash
rm -rf node_modules package-lock.json
npm install
```

2. Jangan paksa dengan `--force` / `--legacy-peer-deps` kecuali kamu paham
   konsekuensinya — flag itu menyembunyikan konflik, bukan menyelesaikannya,
   dan bisa meledak saat `npm run build`.
3. Kalau error menyebut package spesifik, catat nama + versinya — itu bahan
   laporan bug ke pembuat template.

---

## Error versi runtime tidak cocok (EBADENGINE / requires php)

**Pesan error (contoh):**

```text
npm WARN EBADENGINE unsupported engine
```

```text
composer install: your php version does not satisfy that requirement
```

**Penyebab:**

- Versi Node.js / PHP di komputermu di luar rentang yang didukung template.

**Solusi:**

1. Untuk Node.js: install versi LTS dari [nodejs.org](https://nodejs.org),
   atau pakai version manager (nvm/nvm-windows/volts) agar bisa ganti versi
   per project tanpa uninstall.
2. Untuk PHP: install PHP 8.2+ dan pastikan `php --version` di terminal yang
   SAMA dengan tempat menjalankan Composer (Windows sering punya dua PHP:
   satu dari XAMPP, satu standalone — pastikan yang 8.2+ yang dikenali).
3. Setelah ganti versi, hapus `node_modules` / `vendor` lalu install ulang.

---

## Error permission (EACCES /EPERM) saat install global

**Pesan error (contoh):**

```text
npm ERR! code EACCES
npm ERR! syscall mkdir
```

**Penyebab:**

- `npm install -g` mencoba menulis ke folder sistem yang butuh hak admin.

**Solusi:**

1. **Jangan** biasakan `sudo npm install -g` (mengacaukan kepemilikan file).
   Untuk pemakaian Scaffdev, pilih mode `npx scaffdev@latest` yang tidak butuh
   install global sama sekali.
2. Kalau tetap butuh global, perbaiki prefix npm ke folder milik user-mu
   (lihat dokumentasi npm `npm config set prefix`) atau pakai Node version
   manager yang mengelola prefix sendiri.

---

## Login Supabase gagal / data tidak muncul (RLS)

**Gejala:** register/login error, atau halaman kosong padahal tabel ada isinya;
log menyebut `row-level security`, `permission denied`, atau `JWT`.

**Penyebab:**

- Tabel Supabase belum punya policy yang mengizinkan operasi itu.
- Key yang dipakai salah (anon key vs service_role tertukar), atau env belum di-restart.

**Solusi:**

1. Pastikan memakai **anon key** (bukan service_role) di env publik.
2. Restart dev server setelah mengubah env.
3. Buka dashboard Supabase → **Authentication → Policies** di tabel terkait:
   untuk belajar, buat policy baca untuk semua (public read) dulu, tulis hanya
   untuk user terautentikasi. Ketatkan sebelum production.
4. Test dengan akun baru (bukan akun yang dibuat sebelum policy diubah).

Detail alur setup ada di [Daftar Integrasi](/docs/daftar-integrasi) bagian Supabase.

---

## Popup Midtrans / Xendit / Duitku tidak muncul

**Gejala:** tombol bayar diklik tapi tidak terjadi apa-apa, atau checkout error;
console browser menyebut key `undefined` atau `... is not defined`.

**Penyebab:**

- Client key belum diisi / salah paste / tertukar sandbox vs production.
- Script popup payment belum dimuat sebelum dipanggil.
- Secret key malah dipasang dengan prefix `NEXT_PUBLIC_` (bocor + tidak terbaca server).

**Solusi:**

1. Cek env: client/public key berprefix `NEXT_PUBLIC_`, secret/server key TANPA prefix.
2. Restart dev server, hard-refresh browser (Ctrl+Shift+R) agar env baru terbaca.
3. Buka console browser (F12) dan baca error merah pertama — 90% jawabannya ada di sana.
4. Pastikan memakai key **sandbox** selama development (Midtrans `SB-...`, Xendit `xnd_development_...`).

---

## Webhook / callback payment tidak masuk

**Gejala:** pembayaran sandbox sukses, tapi status order di aplikasi tidak berubah.

**Penyebab:**

- URL callback di dashboard payment menunjuk `localhost` — server payment tidak
  bisa menjangkau komputermu, jadi notifikasi tidak pernah sampai.
- Signature verifikasi gagal (format salah) sehingga aplikasi menolak notifikasi.

**Solusi:**

1. Untuk development, expose localhost via tunnel (mis. ngrok), daftarkan URL
   tunnel sementara di dashboard sandbox payment.
2. Pastikan handler callback memverifikasi signature sesuai dokumentasi resmi
   (satu karakter meleset = ditolak).
3. Jangan update status order dari redirect frontend saja — selalu konfirmasi
   via callback server-to-server.
4. Cek log endpoint callback-mu: request masuk tapi ditolak, atau tidak masuk
   sama sekali — dua hal berbeda dengan solusi berbeda.

---

## Error Laravel: APP_KEY, migrasi, dan Composer kehabisan memori

**Pesan error (contoh):**

```text
No application encryption key has been specified
```

```text
Allowed memory size exhausted (composer)
```

**Solusi:**

1. `APP_KEY`: jalankan `php artisan key:generate` setelah menyalin `.env`.
   Kalau `.env` dihapus/ditimpa, generate ulang.
2. Migrasi gagal: pastikan kredensial database di `.env` benar dan database-nya
   sudah dibuat (Laravel tidak membuat database otomatis di semua driver).
   Jalankan `php artisan migrate` dan baca error baris pertamanya.
3. Composer kehabisan memori: jalankan dengan batas dinaikkan sementara:

```bash
COMPOSER_MEMORY_LIMIT=-1 composer install
```

---

## Build gagal (TypeScript / Tailwind / lint)

**Pesan error (contoh):**

```text
Type error: ...
```

```text
Could not resolve ... / Unknown at rule
```

**Penyebab:**

- Error ketik di kode, import path salah, atau dependency belum terinstall
  (`npm install` belum dijalankan / gagal di tengah).

**Solusi:**

1. Jalankan `npm install` sampai tuntas dulu, baru `npm run build` — sebagian
   besar "build gagal" sebenarnya "install belum beres".
2. Baca error TypeScript pertama dari atas; perbaiki satu per satu (error
   turunan di bawahnya sering hilang sendiri).
3. Untuk Tailwind: pastikan file CSS yang diimpor ada dan directive-nya benar;
   jangan campur sintaks versi 3 dan 4.
4. Untuk Laravel: `composer install` tuntas + `php artisan key:generate` +
   pastikan ekstensi PHP yang dibutuhkan template terinstall.

---

## Masalah khusus Windows

**Gejala umum:** command dari panduan (yang ditulis untuk Mac/Linux) error di CMD/PowerShell.

**Solusi per kasus:**

1. `cp: command not found` (CMD tidak punya `cp`) — gunakan padanannya:

```bash
copy .env.example .env.local   # Next.js (CMD)
copy .env.example .env         # Laravel (CMD)
```

2. PowerShell menolak menjalankan script (`execution policy`) — jalankan
   terminal sebagai user biasa dan set policy minimal untuk user-mu, atau
   gunakan Git Bash/CMD untuk command tersebut.
3. `node`/`php` dikenali di satu terminal tapi tidak di terminal lain — masalah
   `PATH`: install ulang runtime dengan opsi "Add to PATH" dicentang, tutup
   SEMUA terminal, buka ulang.
4. Path dengan spasi (`C:\Users\Nama Panjang\...`) kadang bermasalah dengan
   tools tertentu — generate project di path tanpa spasi bila menemui error aneh.

---

## Git SSL / clone lambat / gagal di jaringan kantor-kampus

**Gejala:** `git clone` timeout, error SSL certificate, atau sangat lambat.

**Penyebab:**

- Firewall/proxy kampus-kantor memblokir atau menginspeksi koneksi ke github.com.

**Solusi:**

1. Test cepat: buka github.com di browser. Kalau browser bisa tapi git tidak,
   masalahnya di konfigurasi git/proxy, bukan internet mati.
2. Kalau memakai proxy, konfigurasi git dan npm untuk proxy tersebut.
3. Jangan matikan verifikasi SSL (`http.sslVerify false`) kecuali sementara
   untuk diagnosis — itu membuka serangan man-in-the-middle.
4. Coba jaringan lain (tethering HP) untuk memastikan apakah masalahnya
   spesifik jaringan tersebut.

---

## Cara meminta bantuan yang efektif

Kalau semua solusi di atas belum menyelesaikan masalah, siapkan tiga hal ini sebelum bertanya ke AI atau tim:

1. Command persis yang dijalankan (sensor API key bila ada di command).
2. Pesan error lengkap (copy 10–15 baris, bukan paraphrase).
3. Hasil cek prasyarat: `node --version`, `git --version`, dan untuk Laravel `php --version` + `composer --version`.
