# Kids Mockup Generator — V16 Online Deploy Ready

V16 ini versi **siap deploy online** supaya user cukup buka link, tanpa install apa pun di device mereka.

## Fitur

- Upload desain produk
- Upload logo
- Upload referensi model, pose, thumbnail, style
- Pilih produk dan varian warna
- Generate mockup gambar
- Generate thumbnail
- Generate listing text
- Generate video MP4 minimal 10 detik
- Download ZIP export

## AI Engine

- Gambar: Gemini image generation
- Video: Veo video generation
- Fallback: render lokal + slideshow video jika API key belum aktif

## Yang perlu disiapkan

Backend butuh:

```env
GEMINI_API_KEY=isi_api_key_gemini_kamu
ALLOWED_ORIGINS=https://domain-frontend-kamu.vercel.app
```

Frontend butuh:

```env
NEXT_PUBLIC_API_BASE_URL=https://domain-backend-kamu.onrender.com
```

## Deploy

Ikuti file:

```txt
DEPLOY_GUIDE.md
```

## Output

```txt
backend/generated/<job_id>/
├── ai_prompt.json
├── manifest.json
├── listing.txt
├── generated_files.json
├── uploads/
├── renders/
│   ├── *_mockup-*.png
│   ├── *_thumbnail-utama.jpg
│   └── *_promo.mp4
└── <job_id>_export.zip
```

## Catatan

Saya tidak bisa membuat URL publik langsung dari dalam chat tanpa akses akun hosting kamu. Tapi project ini sudah disiapkan agar bisa langsung dipublish ke Vercel + Render/Railway.
