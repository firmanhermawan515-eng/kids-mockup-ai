# DEPLOY GUIDE — V18 Hugging Face Backend + Vercel Frontend

V18 dibuat karena Render meminta kartu. Jalur ini memakai:

- Backend FastAPI: Hugging Face Spaces, Docker, port 7860
- Frontend Next.js: Vercel

## A. Upload project V18 ke GitHub

1. Extract ZIP V18.
2. Buka folder hasil extract.
3. Upload semua isi folder ke repo GitHub `kids-mockup-ai`.
4. Jangan upload file ZIP-nya, upload isi foldernya.

## B. Deploy backend di Hugging Face Spaces

1. Buka https://huggingface.co/spaces
2. Klik **Create new Space**.
3. Isi nama, contoh: `kids-mockup-ai-backend`.
4. Pilih **SDK: Docker**.
5. Visibility boleh Public atau Private.
6. Upload file project atau hubungkan dengan repo GitHub yang berisi V18.
7. Buka **Settings** → **Variables and secrets**.
8. Tambahkan secrets:

```txt
GEMINI_API_KEY = key Gemini kamu
ALLOWED_ORIGINS = *
```

9. Tunggu Space selesai build.
10. Test backend:

```txt
https://NAMA-USER-NAMA-SPACE.hf.space/health
```

Kalau muncul `status: ok`, backend sudah hidup.

## C. Deploy frontend di Vercel

1. Buka https://vercel.com
2. Add New Project.
3. Import repo GitHub `kids-mockup-ai`.
4. Tambahkan Environment Variable:

```txt
NEXT_PUBLIC_API_BASE_URL = https://NAMA-USER-NAMA-SPACE.hf.space
```

5. Klik Deploy.

## D. Setelah frontend jadi

Kalau sudah dapat link Vercel, boleh ganti `ALLOWED_ORIGINS=*` di Hugging Face menjadi link Vercel supaya lebih aman.

Contoh:

```txt
ALLOWED_ORIGINS=https://kids-mockup-ai.vercel.app
```

Untuk testing awal, `*` lebih mudah.

## Catatan

- Hugging Face Spaces Docker memakai port 7860.
- Backend akan tidur/rebuild tergantung kondisi Space, tapi tidak butuh kartu seperti Render.
- Kalau `GEMINI_API_KEY` belum benar, backend tetap jalan dengan fallback lokal, tetapi AI asli Gemini/Veo tidak aktif.


## V18 fix
Frontend punya fallback backend langsung ke https://chufier-generate-ai.hf.space kalau NEXT_PUBLIC_API_BASE_URL belum terbaca di Vercel.
