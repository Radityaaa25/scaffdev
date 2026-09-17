# 10 — GitHub Repository Management

## Struktur Organisasi
Semua repo template disimpan dalam SATU GitHub Organization (bukan akun pribadi individu manapun). Ini memudahkan pengelolaan akses tim tanpa berbagi kredensial akun pribadi.

## Cara Membuat Organization
1. Buka [github.com/organizations/new](https://github.com/account/organizations/new)
2. Pilih plan **Free**
3. Isi nama organization (bagian dari URL, harus unik), email kontak, pilih "This organization belongs to: My personal account"
4. Setelah terbuat, invite anggota tim lewat Settings → Members, atur role (Owner untuk pengelola inti, Member untuk kontributor)

## Konvensi Penamaan Repo
Format: `[kategori]-[varian]-[framework]`, konsisten dengan format slug (lihat `07-template-slug-system.md`). Contoh:
- `ecommerce-basic-nextjs`
- `ecommerce-supabase-midtrans-nextjs`
- `landingpage-basic-nextjs`

**Catatan penting:** Nama repo GitHub TIDAK HARUS identik dengan slug di database, tapi SANGAT DISARANKAN sama persis untuk menghindari kebingungan tim. Yang menjadi sumber kebenaran tetap kolom `slug` di database (lihat `03-database-architecture.md`), bukan nama repo.

## Visibilitas Repo: WAJIB PUBLIC untuk MVP
Karena CLI melakukan `git clone` langsung tanpa autentikasi/token, repo template WAJIB berstatus **public**. Ini adalah keputusan arsitektur sadar untuk MVP, bukan kelalaian.

**Konsekuensi yang harus dipahami tim:**
- Isi kode template bisa dilihat dan di-copy oleh siapa saja yang menemukan link repo-nya.
- Jika di masa depan ingin membuat template premium/berbayar yang tidak bisa diakses gratis, diperlukan perubahan arsitektur: repo menjadi private, dan CLI perlu menyertakan token akses (dikelola di sisi backend, bukan disebar ke user) untuk bisa melakukan clone. Ini didokumentasikan sebagai item roadmap, belum diimplementasikan di MVP.

## Aturan Isi Repo (WAJIB Dipatuhi Setiap Template)
1. File `.env` (isi asli) TIDAK BOLEH ada di repo — hanya `.env.example` (kosong/placeholder) yang boleh ada.
2. `.gitignore` WAJIB menyertakan minimal: `.env`, `.env.local`, `node_modules`, `.next`, `dist`.
3. Tidak boleh ada API key, token, atau credential apapun ter-commit ke riwayat git manapun (termasuk commit lama yang sudah di-revert — jika pernah ter-commit, key tersebut harus dianggap bocor dan credential aslinya harus di-rotate oleh pemiliknya).

## Keamanan Akun/Organization
- **2FA (Two-Factor Authentication) WAJIB diaktifkan** di akun pribadi setiap anggota yang memiliki akses ke organization (Settings → Password and authentication di GitHub).
- Gunakan fitur **Team** di dalam organization untuk mengelompokkan akses jika jumlah repo template sudah banyak (Settings → Teams).
- Pertimbangkan **branch protection** pada branch utama tiap repo template jika lebih dari satu orang berkontribusi langsung, mewajibkan pull request/review sebelum merge ke branch utama.

## Proses Menambah Template Baru (dari Sisi GitHub)
1. Buat repo baru di dalam organization (bukan akun pribadi).
2. Push kode template yang sudah melewati proses review sesuai `08-template-best-practice-standard.md`.
3. Pastikan repo berstatus public.
4. Catat URL repo (format `https://github.com/scaff/[nama-repo].git` atau `https://github.com/scaff-dev/[nama-repo].git`) untuk didaftarkan lewat admin panel (lihat `06-admin-panel-architecture.md`).

## Referensi Silang
- Format slug yang idealnya konsisten dengan nama repo: `07-template-slug-system.md`
- Checklist isi repo sebelum publish: `08-template-best-practice-standard.md`
- Cara mendaftarkan URL repo ke sistem: `06-admin-panel-architecture.md`
- Aturan keamanan lebih detail: `15-security-guidelines.md`
