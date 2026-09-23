# REMINDER — Sebelum Production (JANGAN Diskip!)

> Dibuat: 18 Sep 2026. Baca file ini setiap kali mau go-live / publish ulang.
> Isinya adalah pelajaran dari debugging panjang: CLI sempat menampilkan
> 4 template palsu karena paket npm basi. Jangan sampai terulang.

## 1. Command utama & API default (BLOKIR UTAMA)

- `npx scaffdev@latest` (tanpa env var) memakai default di
  `packages/cli/src/lib/api-client.ts` → `DEFAULT_API_URL`.
- Default: `https://scaffdev.vercel.app` (diganti dari `scaff.dev` pada 18 Sep 2026
  agar tidak lupa menjelang penilaian lomba). URL `vercel.app` ini permanen:
  saat domain `scaff.dev` dibeli nanti, cukup pasang sebagai custom domain
  di Vercel — tidak perlu ubah kode/CLI lagi.
- Sebelum production: ganti default ke URL Vercel yang live
  (mis. `https://<app>.vercel.app`), lalu **wajib** bump versi + rebuild + publish ulang.
  Tanpa publish ulang, user tetap dapat CLI lama yang menunjuk domain mati.

## 2. Cara publish CLI (butuh OTP!)

```bash
cd packages/cli
pnpm build        # pastikan dist fresh
npm publish --access public   # JANGAN pnpm publish (kena git-checks)
```

- Publish **selalu minta OTP 6-digit** dari aplikasi authenticator (HP).
  Siapkan authenticator SEBELUM menjalankan command (kode ganti tiap ±30 detik).
- Akun npm: `scaffdev`. Email akun (`scaffdev.official@gmail.com`) **nonaktif** —
  jangan andalkan reset via email. Jaga aplikasi authenticator + password baik-baik.
- Setelah publish, verifikasi (tunggu 3–5 menit propagasi registry):
  ```bash
  npm view scaffdev versions          # harus memuat versi baru
  npm view scaffdev dist-tags.latest  # harus = versi baru
  npx -y scaffdev@<versi-baru> --version
  ```
- Kalau `latest` belum pindah padahal versi sudah ada:
  `npm dist-tag add scaffdev@<versi> latest`
- Uji dengan versi eksplisit (`npx -y scaffdev@x.y.z`) untuk menghindari cache lokal.

## 3. Riwayat versi (jangan rollback ke 0.1.0!)

- `0.1.0` (16 Sep 2026): berisi **4 template HARDCODED** (`github.com/scaff/*`).
  Menampilkan pilihan palsu walau DB kosong. **Jangan pernah rollback ke sini.**
- `0.1.1` (18 Sep 2026): 100% API-driven (pilihan = isi DB via admin),
  spinner menampilkan URL API yang dituju, `--version` = v0.1.1.
- `0.1.2` (18 Sep 2026): sama seperti 0.1.1 + default API diganti ke
  `https://scaffdev.vercel.app` (persiapan production/Vercel).
  Cara bedah ulang tarball bila ragu:
  unduh `https://registry.npmjs.org/scaffdev/-/scaffdev-<versi>.tgz`,
  grep `github.com/scaff/` → harus 0 hasil.

## 4. Prasyarat agar `npx scaffdev@latest` polos bisa dipakai user

Semua harus ✅, kalau satu saja ❌ command utama gagal:

- [ ] `apps/web` ter-deploy (rencana: Vercel `*.vercel.app`) dan reachable.
- [ ] Env Supabase terisi di dashboard hosting:
      `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- [ ] CLI default (poin 1) = URL deploy tersebut + sudah publish ulang.
- [ ] Minimal **1 template berstatus published** di DB production
      (tambah via halaman admin → Template → publish).
- [ ] Uji akhir polos: `npx -y scaffdev@latest` → "Berhasil memuat N template aktif".

## 4b. Deploy 2 project Vercel (web + admin)

Repo ini = 2 aplikasi terpisah → 2 project Vercel dari repo yang sama:

**Project 1 — Web (publik):**

- Root Directory: `apps/web`, Framework: Next.js.
- Env wajib: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  (tanpa ini BUILD GAGAL — sitemap + generateStaticParams memanggil Supabase).
- Env opsional: `GROQ_API_KEY` (tanpa ini AI balas 503),
  `CORS_ALLOWED_ORIGINS` (isi `https://<web>.vercel.app,https://<admin>.vercel.app`).
- Hasil URL web inilah yang jadi default CLI (poin 1) saat custom domain dibeli.

**Project 2 — Admin (rahasia, jangan sebar URL-nya):**

- Root Directory: `apps/admin`, Framework: Next.js.
- Env wajib: sama 2 Supabase di atas, PLUS
  `NEXT_PUBLIC_API_BASE_URL=https://<url-web-project-1>` (tanpa ini tombol
  simpan/hapus admin tidak bisa menghubungi API).
- Env opsional: `GROQ_API_KEY` (asisten AI admin), sama seperti web.
- Catatan: build admin lolos tanpa env, tapi halaman admin butuh env saat runtime.

**Urutan deploy yang aman (final, jangan dibalik):**

1. Push GitHub ✅ (selesai).
2. Migrasi DB 005–009 ✅ (selesai — verifikasi sekalian saat langkah 5).
3. Tunggu landing page selesai → deploy web + admin ke Vercel + isi env.
4. Verifikasi URL live (lihat "Cara verifikasi URL" di bawah).
5. Tambah + publish 1 template via admin production (coba upload).
6. Publish npm (`0.1.2` apa adanya bila kode CLI tidak berubah; butuh OTP).
   JANGAN publish sebelum langkah 4 hijau.
7. Uji akhir polos: `npx -y scaffdev@latest` → "Berhasil memuat N template aktif".

**Cara verifikasi URL (wajib tiap deploy/ulang):**

```bash
# 1. API hidup? Harus balas JSON (walau {"templates":[]}).
curl https://<app>.vercel.app/api/templates

# 2. Halaman utama & katalog render? Buka di browser:
#    https://<app>.vercel.app/  dan  https://<app>.vercel.app/templates

# 3. Admin bisa login? Buka https://<admin>.vercel.app/login
#    + cek halaman Pengaturan: semua env "Terisi".

# 4. End-to-end: tambah 1 template via admin production → publish →
#    curl ulang /api/templates → slug-nya muncul.
#    Lalu: npx -y scaffdev@latest → "Berhasil memuat 1 template aktif".
```

Hasil yang benar per langkah: (1) JSON valid, bukan timeout/404/500;
(2) halaman tampil bukan error; (3) login sukses, env Terisi;
(4) slug muncul di API dan CLI. Kalau langkah 1 gagal → cek status
deployment di dashboard Vercel (harus "Ready") + env sudah terisi sebelum build.

## 5. Tes bukti "CLI sesuai DB/admin" (wajib lolos tiap rilis)

```bash
# Arahkan CLI ke API yang mau dites:
SCAFF_API_BASE_URL=http://localhost:3000 npx -y scaffdev@<versi>
```

| Kondisi DB | Hasil CLI yang benar |
|---|---|
| Tabel kosong | Error "Belum ada template aktif…" (BUKAN daftar pilihan!) |
| 1 template di-publish via admin | "Berhasil memuat 1 template aktif" + muncul di pilihan |
| Template di-unpublish | Kembali error kosong |

## 6. Fakta arsitektur (jangan dilanggar)

- CLI **tidak boleh** punya template bawaan/hardcode/fallback
  (lihat `docs/11-npm-publishing-guide.md` + `docs/07-template-slug-system.md`).
  DB kosong = error eksplisit, itu perilaku yang benar.
- Tombol delete template di admin = **hard delete permanen** di DB
  (tidak ada tong sampah). Untuk menyembunyikan sementara, pakai **unpublish**.
- Pilihan CLI selalu = `templates` dengan `is_published = true` dari API.
- Kalau CLI menampilkan template yang tidak ada di tabel Supabase yang kamu lihat,
  berarti CLI menembak **database/API yang berbeda** — cek `SCAFF_API_BASE_URL`
  dan bandingkan project ref Supabase (jangan share key).

## 7. Ide backlog (opsional, belum dikerjakan)

- Peringatan versi CLI kedaluwarsa saat ada rilis baru.
- Flag `--with=` untuk kombinasi integrasi custom (menunggu aba-aba "GAS KE OPSI INTEGRASI").
- Aturan max 1 per kategori (payment/database/auth) untuk kombinasi custom.
