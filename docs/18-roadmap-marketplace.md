# 18 — Roadmap: Marketplace Template Pihak Ketiga (BELUM DIIMPLEMENTASIKAN DI MVP)

## Status
**TIDAK ADA DI MVP.** Sebutkan sebagai visi/roadmap dalam presentasi produk, JANGAN dibangun fungsional untuk lomba. Jika ingin ditampilkan dalam demo, cukup berupa mockup/wireframe halaman, bukan sistem yang benar-benar berjalan.

## Konsep
Kreator/developer eksternal (bukan tim inti) dapat "menitipkan" template mereka untuk dijual/dibagikan lewat platform ini, dengan model bagi hasil (revenue share) antara kreator dan platform.

## Alur yang Dibayangkan
1. Kreator eksternal submit link repo GitHub template mereka lewat form submission
2. Template melewati proses inspeksi keamanan oleh tim internal SEBELUM dipublikasikan ke katalog publik
3. Jika lolos inspeksi, template masuk ke katalog dan bisa dipilih user seperti template lainnya
4. Jika template ini berbayar, sistem melakukan split pembayaran otomatis antara platform dan kreator sesuai persentase yang disepakati

## Tantangan Utama yang Harus Diselesaikan Sebelum Membangun Fitur Ini

### 1. Proses Inspeksi Keamanan
Mengecek keamanan kode pihak ketiga secara menyeluruh (malicious code, backdoor, dependency yang vulnerable, kebocoran data ke server pihak ketiga) memerlukan:
- Expertise keamanan yang serius, tidak bisa dilakukan asal baca kode sekilas
- Waktu manual yang signifikan per submission — ini TIDAK BISA sepenuhnya diotomatisasi dengan mudah, terutama untuk mendeteksi logic berbahaya yang tersembunyi (bukan sekadar dependency yang punya CVE publik)
- Proses ini harus terdokumentasi dan konsisten (checklist inspeksi yang jelas) agar tidak bergantung pada satu orang saja

### 2. Tanggung Jawab Hukum & Legal
- Jika ada template yang lolos inspeksi tapi ternyata bermasalah (melanggar lisensi/hak cipta pihak lain, atau mengandung kode berbahaya yang lolos), platform berpotensi ikut bertanggung jawab
- Diperlukan Terms of Service yang jelas mengatur pembagian tanggung jawab antara platform dan kreator

### 3. Infrastruktur Pembayaran & Revenue Split
- Memerlukan integrasi payment gateway yang mendukung split payment otomatis, atau proses manual di awal sebelum otomatisasi penuh
- Perlu sistem payout terjadwal ke kreator (mingguan/bulanan)

## Keputusan untuk Konteks Lomba
Fitur ini TIDAK dibangun secara fungsional. Cukup disebutkan sebagai bagian dari visi produk jangka panjang saat presentasi, untuk menunjukkan model bisnis yang berkelanjutan tanpa perlu menghabiskan waktu development yang tidak realistis untuk timeline lomba.

## Prasyarat Sebelum Melanjutkan ke Fase Ini
- Fondasi produk MVP (template generator dari tim inti) sudah stabil dan punya basis pengguna
- Checklist/SOP inspeksi keamanan yang terdokumentasi dengan jelas
- Kajian hukum terkait tanggung jawab platform vs kreator
- Sistem autentikasi & profil kreator (belum ada di MVP)

## Referensi Silang
- Standar kualitas template yang berlaku untuk template internal (sebagai basis checklist inspeksi nanti): `08-template-best-practice-standard.md`
- Aturan keamanan umum proyek: `15-security-guidelines.md`
