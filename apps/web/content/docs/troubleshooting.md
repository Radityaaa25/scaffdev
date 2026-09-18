---
title: Troubleshooting
description: Katalog error umum CLI dan web beserta solusinya — dari slug tidak ditemukan sampai prasyarat hilang.
order: 6
section: Panduan
---

# Troubleshooting

Temukan pesan errormu di bawah ini dan ikuti solusinya. Kalau belum ketemu, tanyakan ke asisten AI (bubble kanan bawah) dengan menempel pesan error lengkap.

## `Template dengan slug "x" tidak ditemukan`

Penyebab: slug salah ketik, atau template belum di-publish (masih draft). Solusi: jalankan `npx scaffdev@latest` tanpa flag untuk melihat daftar slug yang tersedia, lalu pakai flag lengkap `--template=<slug>` (jangan lupa tanda `=`).

## `Tidak dapat menghubungi API Scaffdev`

Penyebab: CLI tidak bisa mencapai API (default: `https://scaff.dev`). Untuk development lokal, set environment variable sebelum menjalankan CLI:

```bash
SCAFF_API_BASE_URL=http://localhost:3000 npx scaffdev@latest --template=<slug>
```

(PowerShell: `$env:SCAFF_API_BASE_URL="http://localhost:3000"` terlebih dahulu.)

## `Belum ada template aktif yang terdaftar`

API jalan tapi katalog kosong — belum ada template berstatus published. Ini normal untuk instalasi baru; daftarkan template lewat admin lalu publish.

## Prasyarat gagal: Node.js / Composer tidak ditemukan

- Template Next.js butuh **Node.js v18+** — cek dengan `node --version`, unduh di [nodejs.org](https://nodejs.org).
- Template Laravel butuh **PHP 8.2+ dan Composer** — cek dengan `php --version` dan `composer --version`, unduh di [getcomposer.org](https://getcomposer.org).

## `Folder sudah ada dan tidak kosong`

CLI tidak akan menimpa diam-diam. Pilih folder kosong/nama lain, atau jawab "ya" saat ditanya overwrite bila kamu yakin isinya boleh ditimpa.

## Error saat `npm install` / `composer install`

Ini di luar kendali CLI — biasanya jaringan atau versi runtime. Coba: hapus folder, pastikan prasyarat di atas lolos, ulangi generate, lalu install manual (`npm install` atau `composer install`) untuk melihat pesan error aslinya.

## `git clone` gagal

Pastikan `git` terinstall (`git --version`) dan kamu punya akses internet ke github.com. Semua repo template bersifat publik — tidak perlu token atau login GitHub.
