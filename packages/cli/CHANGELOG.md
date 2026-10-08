# Changelog CLI Scaffdev

## 0.3.0

- Security audit repository: prompt `Run security audit?` sebelum setiap clone
  (interaktif, `--template` direct, tiap modul `--with`); temuan HIGH/CRITICAL
  memblokir default; skip butuh konfirmasi ganda.
- Post-clone audit lokal (`.git/config` + hooks, tanpa eksekusi); `.git` hasil
  clone ditahan sampai audit selesai.
- `validate-module` menyertakan laporan audit read-only (tanpa prompt).
- Mode Builder interaktif: pilih Siap pakai / Builder, lalu racik base +
  integrasi (radio max-1-per-kategori-inti + multiselect `other`).
- Teks bantuan diperbarui.

## 0.2.2

- Progress output 1-baris (aman di Git Bash), timeout API 20 detik.

## 0.2.0

- Builder dual-framework (`--with`), AI chat streaming + rotasi key, error pages.

## 0.1.2

- Katalog template, dokumentasi, admin, keamanan & SEO.

## 0.1.0

- Rilis awal.
