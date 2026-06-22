---
title: Kids Mockup AI Backend
emoji: 🧸
colorFrom: purple
colorTo: pink
sdk: docker
pinned: false
---

# Kids Mockup Generator — V17 Hugging Face Ready

V17 ini versi **siap deploy tanpa Render/card**. Backend disiapkan untuk **Hugging Face Spaces Docker**, sedangkan frontend tetap cocok untuk **Vercel**.

## Isi utama

- `backend/` — FastAPI backend untuk generate mockup, thumbnail, listing, ZIP, dan video fallback.
- `Dockerfile` — konfigurasi Hugging Face Spaces Docker port 7860.
- `app/` — frontend Next.js.
- `HUGGINGFACE_DEPLOY_GUIDE.md` — panduan deploy step-by-step.
- `.env.example` — env frontend Vercel.
- `backend/.env.example` — env backend Hugging Face/local.

## Backend Hugging Face

Secret yang perlu diisi di Hugging Face Spaces:

```txt
GEMINI_API_KEY=your_gemini_api_key_here
ALLOWED_ORIGINS=*
```

Test backend setelah build:

```txt
https://nama-space.hf.space/health
```

## Frontend Vercel

Environment variable di Vercel:

```txt
NEXT_PUBLIC_API_BASE_URL=https://nama-space.hf.space
```

## Local development

Backend:

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

Frontend:

```bash
npm install
npm run dev
```

## Catatan penting

- Kalau `GEMINI_API_KEY` valid, backend mencoba memakai Gemini Images dan Veo.
- Kalau AI gagal atau key belum ada, backend tetap membuat fallback mockup lokal + video slideshow minimal 10 detik.
- Download ZIP dan preview sekarang otomatis memakai domain backend aktif, bukan `localhost`.
