---
title: Lisensi Scaffdev
description: Aturan lisensi source-available Scaffdev, template premium, watermark, merek, dan kontribusi.
order: 10
section: Panduan
---

# Lisensi Scaffdev

Scaffdev itu **source-available**, bukan open-source (OSI). Kode sumber terbuka dan boleh dilihat siapa pun, tapi ada syarat non-kompetisi. Teks hukum lengkapnya ada di file `LICENSE.md` di repo (PolyForm Shield 1.0.0). Halaman ini ringkasannya.

## Yang boleh

- Melihat, mempelajari, dan mem-fork kode untuk pemakaian pribadi.
- Memakai untuk perusahaan atau internal dalam skala apa pun.
- Mengubah dan membagikan ulang, selama menyertakan `LICENSE.md` + baris `Required Notice` (Copyright ScaffDev).
- Berkontribusi (diatur file `CLA.md` di repo: submit = setuju).
- Membangun produk yang **tidak bersaing** dengan Scaffdev di atas kode ini.
- Memakai project hasil generate (`npx scaffdev`) secara bebas untuk keperluan apa pun.

## Yang tidak boleh tanpa perjanjian komersial terpisah

Menyediakan produk atau layanan yang **bersaing** dengan Scaffdev atau produk Scaffdev. Berlaku untuk yang gratis maupun berbayar, interface apa pun, bahasa apa pun. Contoh yang bersaing: generator scaffolding, katalog template, atau builder visual yang dipasarkan sebagai pengganti Scaffdev.

## Template premium

Template bertanda premium memakai lisensi komersial terpisah (di luar lisensi platform). Membeli template premium = hak pakai sesuai syaratnya, bukan hak mengedarkan ulang template tersebut.

Cara kerja (tanpa login web - kunci = kredensial):

- Repo template premium privat. Publik tidak melihat URL repo maupun isinya.
- Pembeli menerima 1 kunci lisensi (format `SCAFF-XXXX-XXXX-XXXX`) dari admin.
- Generate memakai kunci: `npx scaffdev@latest toko-saya --template=slug-premium --license-key=SCAFF-XXXX-XXXX-XXXX` (butuh CLI 0.8.0+). Tanpa flag, CLI memakai kunci tersimpan (`~/.scaffdev/licenses.json`) atau meminta saat prompt.
- CLI memverifikasi kunci ke server lalu mengunduh arsip dari repo privat. Kunci salah/cabut = generate ditolak. Email pembeli dicatat di `.scaff/license.json` hasil generate.
- Satu kunci berlaku untuk 1 template (tidak lintas template). Kunci yang disalahgunakan dapat dicabut admin kapan saja.

## Atribusi / watermark

Project hasil generate wajib mempertahankan kredit ScaffDev level kode:

- baris kredit di `README.md`,
- section atribusi di `SETUP.md`,
- stempel generator di `.scaff/meta.json`.

Elemen visual (badge, logo, footer) bebas diubah atau dihapus. Tidak ada visual Scaffdev yang dipaksa tampil di project-mu.

## Merek

Nama, logo, dan merek "Scaffdev" tidak dilisensikan oleh lisensi kode. Versi modifikasi yang diedarkan ulang tidak boleh memakai nama atau merek Scaffdev seolah-olah produk resmi.
