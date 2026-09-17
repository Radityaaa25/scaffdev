# 14 — AI Setup Chatbot

## Tujuan
Membantu user yang mengalami kendala saat proses setup (misalnya error "composer not found", bingung cara mendapatkan API key Midtrans, dll) tanpa harus mencari dokumentasi resmi tiap service secara manual.

## Batasan yang WAJIB Dipatuhi
Sama seperti `13-ai-recommendation-assistant.md`, chatbot ini TIDAK BOLEH menulis/menyarankan kode integrasi baru yang belum ada di template. Chatbot ini murni membantu TROUBLESHOOTING berdasarkan dokumentasi yang sudah ada, bukan membuat solusi baru dari nol.

## Sumber Pengetahuan (RAG — Retrieval Augmented Generation)
Chatbot ini dijawab berdasarkan konteks yang diambil dari:
1. Isi `instruksi_setup` di tabel `integrasi` (sama seperti sumber untuk generate `SETUP.md`, lihat `12-env-and-setup-doc-generation.md`)
2. FAQ umum seputar error instalasi yang sudah diketahui (Node.js tidak ditemukan, Composer tidak ditemukan, git tidak dikenali sebagai command, dll) — disimpan sebagai teks statis tambahan di prompt/konteks

## Cara Kerja
1. User mengetik pertanyaan di widget chat (`AiSetupChatWidget.tsx`)
2. Request dikirim ke `POST /api/ai/chat` beserta riwayat percakapan (jika ada) dan konteks template yang sedang dikerjakan user (opsional, jika diketahui dari halaman mana chat dibuka)
3. Server menyusun prompt yang berisi: pertanyaan user + instruksi_setup dari integrasi yang relevan + FAQ umum
4. LLM (Groq API) menjawab HANYA berdasarkan konteks yang diberikan — prompt harus secara eksplisit menginstruksikan LLM untuk tidak menjawab di luar konteks yang diberikan, dan mengarahkan ke dokumentasi resmi service terkait jika pertanyaan di luar cakupan

## Contoh Prompt System (Konsep)
```
Kamu adalah asisten troubleshooting setup project. 
Jawab HANYA berdasarkan informasi berikut. 
Jika pertanyaan di luar informasi ini, sarankan user membaca dokumentasi resmi service terkait, JANGAN mengarang jawaban.

Informasi setup yang tersedia:
[instruksi_setup dari integrasi yang relevan]

FAQ umum:
[daftar FAQ statis]

Riwayat percakapan:
[riwayat]

Pertanyaan user: "{pesan}"
```

## Perbedaan dengan AI Recommendation Assistant (13)
| | AI Recommendation (13) | AI Setup Chatbot (14) |
|---|---|---|
| Kapan dipakai | Sebelum memilih template | Setelah generate project, saat proses setup |
| Tujuan | Memilih kombinasi yang cocok | Membantu troubleshooting |
| Output | Daftar slug template | Jawaban percakapan bebas (dibatasi konteks) |

## Tech Stack
- Groq API
- Vercel AI SDK — DIREKOMENDASIKAN menggunakan mode streaming untuk chatbot ini agar respons terasa lebih responsif (berbeda dengan recommendation assistant yang bisa non-streaming karena outputnya singkat berupa JSON).

## Referensi Silang
- Endpoint terkait: `04-api-backend-architecture.md`
- Sumber data instruksi setup: `03-database-architecture.md`, `12-env-and-setup-doc-generation.md`
- Widget UI: `05-web-frontend-architecture.md`
