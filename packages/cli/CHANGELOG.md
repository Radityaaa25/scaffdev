# Changelog CLI Scaffdev

## 0.7.0

- Watermark level kode saat generate (wajib lisensi): baris kredit di akhir
  `README.md`, section Atribusi di akhir `SETUP.md`, stempel generator di
  `.scaff/meta.json`. Idempoten (aman generate ulang), visual tidak disentuh.
- Uji `test:watermark`: 5 asersi (fresh, append, idempoten, merge meta, meta rusak).

## 0.6.0

- Template asing (tanpa `scaff.template.json`): heuristik jejak modul/musuhnya
  (env, dependency, keyword konflik) sebagai peringatan best-effort + konfirmasi
  lanjut; preview menandai folder baru yang akan dibuat; tawaran adopsi manifest
  (default Ya) agar `add` berikutnya eksak.
- `validate-module`: cek resolvabilitas import relatif (TS/JS) - gagal eksplisit
  bila ada import yang tidak mengarah ke file yang ada.
- Uji `test:foreign`: 8 asersi heuristik/adopsi/import + E2E inject ke template
  asing (hermetik, tanpa network).

## 0.5.0

- `validate-module --ref=<branch>`: audit branch tertentu (untuk repo fixture
  multi-branch dan kasus ref eksplisit).
- Parser tar tahan header pax/global dan nama root arsip non-standar.

## 0.4.0

- Standalone integration: `scaffdev add <kode>`: suntik 1 modul ke project
  yang sedang dibuka (deteksi framework + fallback prompt, konflik
  Cancel/Overwrite/Skip + backup `.scaff/trash/`, preview rencana, install
  opsional, validasi final).
- Mode interaktif opsi ke-3: Ambil integrasi (memakai mesin `add` yang sama).
- Injector: mode konflik `skip`/`overwrite` (default `abort`, perilaku lama).
- Manifest: field opsional `docsUrl` (URL dokumentasi resmi, tanpa hardcode).

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
