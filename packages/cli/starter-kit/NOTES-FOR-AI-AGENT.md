# CATATAN WAJIB BACA — untuk AI agent pengisi manifest template

> Kamu sedang mengisi manifest Scaffdev Builder. File yang kamu hasilkan adalah
> **satu-satunya bukti** yang dipercaya CLI untuk menghapus file. Salah isi =
> CLI menghapus file yang salah (atau menolak yang benar). Bekerja pelan,
> verifikasi setiap klaim ke isi repo. **Dilarang menebak.**

## Tugasmu (berurutan, jangan dilompati)

1. **Petakan dulu, tulis belakangan.** Jelajahi SELURUH repo: setiap file tentukan
   pemiliknya — inti template, atau integrasi bawaan tertentu (supabase, midtrans,
   xendit, duitku, rajaongkir, ...). Buat daftarnya di kepala/chat sebelum menyentuh file.
2. **Isi `scaff.template.json`** dari contoh di folder ini:
   - `name`, `slug`, `framework` (`nextjs` | `laravel`) sesuai repo ini.
   - `provides`: hanya file yang **100% milik satu integrasi**. Kriteria lolos SEMUA:
     a. file tidak diimpor/dipakai kode di luar integrasi itu (cek import!),
     b. menghapus file tidak merusak fitur inti template,
     c. file bukan config/shared (types bersama, router umum, layout, env example).
   - Template polosan (tanpa integrasi): `"provides": {}` — JANGAN dikosongi dengan alasan malas.
   - `removalGuides`: satu file `REMOVE-<KODE>.md` per key di `provides`.
3. **Tulis `REMOVE-<KODE>.md` per integrasi** — mulai dari `REMOVE-TEMPLATE.md`
   (copy-rename, isi semua ✏️, hapus baris instruksi template):
   aturan emas → daftar file + perintah hapus → env yang dibersihkan → uninstall
   dependency → verifikasi (build + grep 0 sisa) → bagian **"Yang JANGAN dihapus"**.
   Setiap file WAJIB 2 section framework (Next.js dan Laravel); section yang
   tidak relevan diisi "Tidak berlaku untuk template ini" + alasannya.
4. **Verifikasi mandiri (wajib, laporkan hasilnya):**
   - (a) Setiap path di `provides` benar-benar ada di repo (cek satu per satu).
   - (b) Tidak ada file inti template yang masuk ke `provides`.
   - (c) Setiap `REMOVE-*.md` menyebut file yang SAMA PERSIS dengan `provides`
         (tidak lebih, tidak kurang — kecuali perintah verifikasi).
   - (d) Env di REMOVE cocok dengan yang dibaca kode (`process.env.*` / `env(...)`).
   - (e) Setiap file di `provides` lolos kriteria 2a–2c (sebutkan bukti import-nya).
   - (f) Checklist di `REMOVE-TEMPLATE.md` lolos semua (termasuk uji grep
         menemukan file SEBELUM dihapus).
   - (g) Tidak ada tanda ✏️ yang tersisa di file final.

## Larangan keras

- ❌ Menebak pemilik file ("kayaknya ini milik midtrans").
- ❌ Memasukkan file shared (types/router/layout/env/config) ke `provides`.
- ❌ Mengarang path yang tidak ada di repo.
- ❌ Menghapus atau mengubah makna section "Yang JANGAN dihapus".
- ❌ Membuat `provides` berisi integrasi yang tidak ada di repo ini.

## Kasus ambigu (SERING TERJADI — baca!)

File yang dipakai integrasi SEKALIGUS inti (mis. `CheckoutForm.tsx` memanggil
tombol Midtrans TAPI juga merender form umum): **JANGAN masukkan ke `provides`**.
Taruh di "Yang JANGAN dihapus" + tulis cara melepas kaitannya manual
(mis. "hapus baris import MidtransButton di ..."). Menandai ambigu sebagai
milik integrasi = CLI akan menghapus file inti = project rusak.

## Format laporan akhir ke user

1. Tabel: file → pemilik (inti / kode integrasi) + bukti satu baris per file ambigu.
2. Hasil verifikasi (a)–(g): LULUS/GAGAL per poin.
3. Daftar hal yang kamu TIDAK yakin (bila ada) — jujur lebih baik dari rapi tapi salah.

## Kenapa aturan ini ketat (baca bila tergoda melonggarkan)

CLI Builder menghapus file berdasarkan manifest-mu. Satu klaim salah =
satu dari dua: (1) file inti ikut terhapus → project user rusak, atau
(2) file yatim tertinggal → verifikasi grep gagal → user bingung.
Itulah kenapa ada backup/restore otomatis di CLI — tapi backup adalah
JARING PENGAMAN, bukan izin untuk ceroboh. Manifest yang benar membuat
backup tidak pernah terpakai.
