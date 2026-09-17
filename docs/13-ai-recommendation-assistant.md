# 13 — AI Recommendation Assistant

## Tujuan
Membantu user menemukan kombinasi template yang paling sesuai dengan kebutuhan mereka, cukup dengan menjelaskan kebutuhan dalam bahasa natural, tanpa harus mengerti istilah teknis (Supabase, Midtrans, dll) satu per satu.

## Batasan yang WAJIB Dipatuhi (Prinsip Keamanan Inti Proyek)
**AI DI FITUR INI TIDAK BOLEH MEN-GENERATE KODE APAPUN.** AI hanya boleh **memilih dari daftar template yang sudah ada di database** (yang sudah melalui proses review manual sesuai `08-template-best-practice-standard.md`). AI berperan sebagai lapisan rekomendasi/kurasi, bukan sebagai pembuat konten baru.

**Alasan keputusan ini:** LLM berisiko menghasilkan kode yang salah atau usang untuk integrasi security-critical (payment, auth). Risiko ini terlalu besar untuk kode yang langsung dipakai user tanpa review manusia. Diskusi lengkap soal ini ada di riwayat keputusan produk — intinya, AI generate kode real-time untuk fitur seperti payment gateway TIDAK PERNAH diimplementasikan di proyek ini.

## Cara Kerja

1. User mengetik kebutuhan di widget chat (`AiRecommendWidget.tsx`, lihat `05-web-frontend-architecture.md`), contoh: *"Saya mau bikin toko online kecil-kecilan buat jual baju, budget minim, gak ngerti teknis"*
2. Request dikirim ke `POST /api/ai/recommend` (lihat `04-api-backend-architecture.md`)
3. Di server, sistem melakukan:
   a. Mengambil DAFTAR LENGKAP template yang tersedia (`is_published = true`) dari database, termasuk deskripsi dan daftar integrasinya
   b. Menyusun prompt ke LLM (Groq API) yang berisi: pertanyaan user + daftar template yang tersedia (sebagai konteks/referensi)
   c. LLM diminta memilih SATU atau BEBERAPA slug dari daftar yang diberikan, beserta alasan singkat kenapa itu cocok
   d. Response LLM di-parse dan divalidasi — SLUG YANG DIREKOMENDASIKAN HARUS ADA di daftar template yang memang tersedia. Jika LLM mengembalikan slug yang tidak valid/tidak ada di database, sistem tidak boleh menampilkannya sebagai rekomendasi (fallback ke pesan "coba jelaskan kebutuhan lebih detail" atau tampilkan template default).
4. Response dikembalikan ke web, ditampilkan sebagai kartu rekomendasi dengan tombol langsung menuju halaman preview template tersebut.

## Contoh Prompt System (Konsep, Bukan Final)
```
Kamu adalah asisten yang merekomendasikan template project dari daftar berikut. 
JANGAN merekomendasikan template yang tidak ada di daftar ini. 
JANGAN membuat slug baru yang tidak ada di daftar.

Daftar template tersedia:
[daftar template dalam format JSON: slug, nama, kategori, opsi_integrasi, deskripsi]

Pertanyaan user: "{pertanyaan}"

Berikan rekomendasi dalam format JSON:
{ "rekomendasi": [{ "slug": "...", "alasan": "..." }] }
```

## Validasi Wajib di Sisi Server (Sebelum Response Dikirim ke Client)
```
untuk setiap item di response.rekomendasi:
  jika item.slug TIDAK ADA di daftar template yang valid:
    hapus item ini dari response
jika response.rekomendasi kosong setelah filter:
  kembalikan pesan fallback, bukan array kosong tanpa penjelasan
```
Ini adalah safeguard WAJIB untuk mencegah halusinasi LLM (LLM menyebut slug yang sebenarnya tidak ada) sampai ditampilkan ke user.

## Tech Stack
- Groq API sebagai LLM (gratis, cepat)
- Vercel AI SDK untuk memudahkan pemanggilan API dan (opsional) streaming response

## Referensi Silang
- Endpoint terkait: `04-api-backend-architecture.md`
- Widget UI: `05-web-frontend-architecture.md`
- Alasan pembatasan AI tidak generate kode: `00-overview.md` (Prinsip Arsitektur Kunci)
