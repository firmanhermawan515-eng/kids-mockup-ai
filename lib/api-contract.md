# API Contract V15

Endpoint utama: `POST /generate-assets`

Field penting tambahan:
- `use_ai_generation`
- `openai_model` (dipakai sebagai image model field, default UI = Gemini image model)
- `video_ai_model`
- `ai_quality`

Output utama:
- `generated_files`
- `preview_urls`
- `download_url`
- `ai_summary`

Jika `GEMINI_API_KEY` ada, backend akan mencoba generate mockup dan thumbnail dengan Gemini image generation dan video promo dengan Veo. Jika tidak, backend fallback ke render lokal + slideshow video.
