# DEPLOY GUIDE — V16 Online Link

Target V16: user cukup buka link, upload desain/referensi, generate gambar, listing, dan video minimal 10 detik.

## 1. Deploy Backend ke Render

1. Upload project ini ke GitHub.
2. Buka Render.
3. New → Web Service.
4. Pilih repository project ini.
5. Root Directory: `backend`
6. Build Command:
   ```bash
   pip install -r requirements.txt
   ```
7. Start Command:
   ```bash
   python -m uvicorn main:app --host 0.0.0.0 --port $PORT
   ```
8. Tambahkan Environment Variable:
   ```env
   GEMINI_API_KEY=isi_api_key_gemini_kamu
   ALLOWED_ORIGINS=https://domain-frontend-vercel-kamu.vercel.app
   ```
9. Deploy.
10. Simpan URL backend, contoh:
   ```txt
   https://kids-mockup-ai-backend.onrender.com
   ```

## 2. Deploy Frontend ke Vercel

1. Buka Vercel.
2. Add New Project.
3. Pilih repository yang sama.
4. Framework: Next.js.
5. Tambahkan Environment Variable:
   ```env
   NEXT_PUBLIC_API_BASE_URL=https://kids-mockup-ai-backend.onrender.com
   ```
6. Deploy.
7. Hasilnya jadi link online, contoh:
   ```txt
   https://kids-mockup-ai.vercel.app
   ```

## 3. Revisi ALLOWED_ORIGINS

Setelah frontend Vercel jadi, balik ke Render dan update:
```env
ALLOWED_ORIGINS=https://kids-mockup-ai.vercel.app
```

Redeploy backend.

## 4. Tes

Buka:
```txt
https://kids-mockup-ai.vercel.app
```

Coba:
- upload desain
- upload referensi model/pose/style
- pilih warna
- pilih video 12 detik
- klik Generate
- download ZIP

## Catatan

- Video final minimal 10 detik; default diset 12 detik.
- Kalau Gemini/Veo gagal atau `GEMINI_API_KEY` kosong, sistem tetap menghasilkan fallback lokal.
- Untuk produksi serius, tambahkan login, database, storage cloud, dan queue.
