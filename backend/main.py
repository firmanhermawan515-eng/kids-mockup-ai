from __future__ import annotations

import base64
import json
import os
import shutil
import time
import zipfile
from pathlib import Path
from typing import Optional
from uuid import uuid4

import imageio.v2 as imageio
import numpy as np
from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from PIL import Image, ImageDraw, ImageFilter, ImageFont

try:
    from google import genai
except Exception:
    genai = None

app = FastAPI(title="Kids Mockup Generator API V17 Hugging Face Ready")

allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "*")
allowed_origins = [origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()]
if not allowed_origins:
    allowed_origins = ["*"]
allow_credentials = False if "*" in allowed_origins else True
if "*" not in allowed_origins:
    allowed_origins += ["http://localhost:3000", "http://127.0.0.1:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent
GENERATED_DIR = BASE_DIR / "generated"
GENERATED_DIR.mkdir(exist_ok=True)
app.mount("/generated-files", StaticFiles(directory=str(GENERATED_DIR)), name="generated-files")


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "message": "Kids Mockup Generator API V17 Hugging Face Ready is running",
        "gemini_available": bool(os.getenv("GEMINI_API_KEY")) and genai is not None,
    }


def safe_filename(name: str) -> str:
    keep = []
    for char in name:
        if char.isalnum() or char in ["-", "_", ".", " "]:
            keep.append(char)
    cleaned = "".join(keep).strip().replace(" ", "_")
    return cleaned or "uploaded_file"


def slugify(text: str) -> str:
    return safe_filename(text.lower().replace(" ", "-")).replace("--", "-")


def hex_to_rgb(value: str):
    value = (value or "").strip().lstrip("#")
    if len(value) == 3:
        value = "".join(ch * 2 for ch in value)
    if len(value) != 6:
        return (220, 220, 220)
    try:
        return tuple(int(value[i : i + 2], 16) for i in (0, 2, 4))
    except ValueError:
        return (220, 220, 220)


def get_font(size: int, bold: bool = False):
    candidates = [
        "DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "arialbd.ttf" if bold else "arial.ttf",
    ]
    for path in candidates:
        try:
            return ImageFont.truetype(path, size=size)
        except Exception:
            pass
    return ImageFont.load_default()


def clamp(value: float, min_value: float, max_value: float):
    return max(min_value, min(max_value, value))


def fit_image(img: Image.Image, max_w: int, max_h: int):
    img = img.convert("RGBA")
    w, h = img.size
    if w == 0 or h == 0:
        return img
    ratio = min(max_w / w, max_h / h)
    new_size = (max(1, int(w * ratio)), max(1, int(h * ratio)))
    return img.resize(new_size, Image.LANCZOS)


async def save_upload(file: Optional[UploadFile], folder: Path, field_name: str):
    if file is None:
        return None
    upload_folder = folder / "uploads"
    upload_folder.mkdir(exist_ok=True)
    filename = f"{field_name}_{safe_filename(file.filename or 'file')}"
    destination = upload_folder / filename
    with destination.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {
        "field": field_name,
        "original_filename": file.filename,
        "saved_as": filename,
        "relative_path": f"uploads/{filename}",
        "path": str(destination),
        "content_type": file.content_type,
    }


def load_optional_image(saved_uploads: list, field_name: str):
    for item in saved_uploads:
        if item.get("field") == field_name:
            path = Path(item["path"])
            if path.exists():
                try:
                    return Image.open(path).convert("RGBA")
                except Exception:
                    return None
    return None


def get_upload_path(saved_uploads: list, field_name: str) -> Optional[Path]:
    for item in saved_uploads:
        if item.get("field") == field_name:
            path = Path(item["path"])
            if path.exists():
                return path
    return None


def add_badge(base: Image.Image, text: str, position: str):
    text = (text or "").strip()
    if not text:
        return
    draw = ImageDraw.Draw(base)
    font = get_font(34, bold=True)
    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    pad_x, pad_y = 26, 16
    bw, bh = tw + pad_x * 2, th + pad_y * 2
    if position == "Bawah":
        x, y = (base.width - bw) // 2, base.height - bh - 30
    elif position == "Kiri":
        x, y = 30, (base.height - bh) // 2
    elif position == "Kanan":
        x, y = base.width - bw - 30, (base.height - bh) // 2
    else:
        x, y = (base.width - bw) // 2, 30
    draw.rounded_rectangle((x, y, x + bw, y + bh), radius=18, fill=(254, 243, 199, 245), outline=(245, 158, 11, 255), width=3)
    draw.text((x + pad_x, y + pad_y - 4), text, font=font, fill=(146, 64, 14, 255))


def paste_logo(base: Image.Image, logo_img: Optional[Image.Image], position_label: str, logo_scale: float = 100):
    if logo_img is None or position_label == "Tidak Ditampilkan":
        return
    max_size = int(140 * clamp(logo_scale, 20, 250) / 100)
    logo = fit_image(logo_img, max_size, max_size)
    x, y = 50, base.height - logo.height - 50
    if position_label == "Pojok Kanan Bawah":
        x, y = base.width - logo.width - 50, base.height - logo.height - 50
    elif position_label == "Pojok Kiri Bawah":
        x, y = 50, base.height - logo.height - 50
    elif position_label == "Bawah Desain":
        x, y = (base.width - logo.width) // 2, base.height - logo.height - 90
    elif position_label == "Label Produk":
        x, y = base.width - logo.width - 80, 180
    elif position_label == "Lengan":
        x, y = 180, 320
    base.alpha_composite(logo, (x, y))


def render_with_template(
    template_img: Image.Image,
    design_img: Optional[Image.Image],
    logo_img: Optional[Image.Image],
    default_text: str,
    default_text_position: str,
    logo_position: str,
    color_name: str,
    product_name: str,
    design_x: float,
    design_y: float,
    design_scale: float,
    logo_scale: float,
):
    canvas = Image.new("RGBA", (1200, 1400), (245, 247, 251, 255))
    draw = ImageDraw.Draw(canvas)
    draw.rounded_rectangle((55, 55, 1145, 1345), radius=40, fill=(255, 255, 255, 255), outline=(226, 232, 240, 255), width=4)
    template = fit_image(template_img, 900, 1020)
    template_x = (1200 - template.width) // 2
    template_y = 220
    shadow = Image.new("RGBA", template.size, (0, 0, 0, 0))
    alpha = template.split()[-1]
    shadow.putalpha(alpha.filter(ImageFilter.GaussianBlur(16)))
    canvas.alpha_composite(shadow, (template_x + 18, template_y + 24))
    canvas.alpha_composite(template, (template_x, template_y))
    if design_img is not None:
        max_dim = int(min(template.width, template.height) * clamp(design_scale, 5, 90) / 100)
        design = fit_image(design_img, max_dim, max_dim)
        dx = int(canvas.width * clamp(design_x, 0, 100) / 100 - design.width / 2)
        dy = int(canvas.height * clamp(design_y, 0, 100) / 100 - design.height / 2)
        canvas.alpha_composite(design, (dx, dy))
    paste_logo(canvas, logo_img, logo_position, logo_scale)
    add_badge(canvas, default_text, default_text_position)
    draw.text((90, 95), product_name[:36], fill=(17, 24, 39, 255), font=get_font(44, bold=True))
    draw.rounded_rectangle((90, 1180, 1110, 1265), radius=24, fill=(248, 250, 252, 255), outline=(203, 213, 225, 255), width=3)
    draw.text((120, 1205), f"Varian warna: {color_name}", fill=(15, 23, 42, 255), font=get_font(30, bold=True))
    return canvas


def draw_fallback_shirt(
    color_rgb,
    design_img=None,
    logo_img=None,
    product_name="Produk",
    default_text="",
    default_text_position="Atas",
    logo_position="Bawah Desain",
    design_x=50,
    design_y=50,
    design_scale=28,
    logo_scale=100,
):
    canvas = Image.new("RGBA", (1200, 1400), (248, 250, 252, 255))
    draw = ImageDraw.Draw(canvas)
    draw.rounded_rectangle((60, 60, 1140, 1340), radius=40, fill=(255, 255, 255, 255), outline=(226, 232, 240, 255), width=4)
    draw.text((90, 92), product_name[:36], fill=(17, 24, 39, 255), font=get_font(44, bold=True))
    x, y = 340, 260
    fill = color_rgb + (255,)
    outline = (156, 163, 175, 255)
    shirt = Image.new("RGBA", (420, 760), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shirt)
    sd.polygon([(40, 140), (120, 100), (145, 250), (58, 310)], fill=fill, outline=outline)
    sd.polygon([(380, 140), (300, 100), (275, 250), (362, 310)], fill=fill, outline=outline)
    sd.rounded_rectangle((110, 90, 310, 640), radius=38, fill=fill, outline=outline, width=4)
    sd.rectangle((100, 170, 320, 280), fill=fill)
    sd.ellipse((165, 88, 255, 150), fill=(240, 240, 240, 255), outline=outline, width=3)
    sd.ellipse((180, 100, 240, 140), fill=(248, 250, 252, 255))
    canvas.alpha_composite(shirt, (x, y))
    if design_img is not None:
        max_dim = int(420 * clamp(design_scale, 5, 90) / 100)
        design = fit_image(design_img, max_dim, max_dim)
        dx = int(canvas.width * clamp(design_x, 0, 100) / 100 - design.width / 2)
        dy = int(canvas.height * clamp(design_y, 0, 100) / 100 - design.height / 2)
        canvas.alpha_composite(design, (dx, dy))
    paste_logo(canvas, logo_img, logo_position, logo_scale)
    add_badge(canvas, default_text, default_text_position)
    return canvas


def create_combined_front_back(front_img: Image.Image, back_img: Image.Image, product_name: str, color_name: str):
    canvas = Image.new("RGBA", (1600, 1200), (245, 247, 251, 255))
    draw = ImageDraw.Draw(canvas)
    draw.rounded_rectangle((50, 50, 1550, 1150), radius=40, fill=(255, 255, 255, 255), outline=(226, 232, 240, 255), width=4)
    draw.text((90, 90), product_name[:36], fill=(17, 24, 39, 255), font=get_font(50, bold=True))
    draw.text((90, 160), f"Depan + Belakang • {color_name}", fill=(71, 85, 105, 255), font=get_font(30, bold=True))
    front = fit_image(front_img, 650, 820)
    back = fit_image(back_img, 650, 820)
    canvas.alpha_composite(front, (140, 280))
    canvas.alpha_composite(back, (820, 280))
    draw.text((360, 235), "DEPAN", fill=(30, 64, 175, 255), font=get_font(30, bold=True))
    draw.text((1050, 235), "BELAKANG", fill=(30, 64, 175, 255), font=get_font(30, bold=True))
    return canvas


def generate_thumbnail(product_name, product_type, thumbnail_color, all_colors, base_mockup_path: Path, design_img: Optional[Image.Image], default_text: str, default_text_position: str):
    base = Image.new("RGBA", (1600, 1600), (245, 247, 251, 255))
    draw = ImageDraw.Draw(base)
    draw.rounded_rectangle((60, 60, 1540, 1540), radius=50, fill=(255, 255, 255, 255), outline=(226, 232, 240, 255), width=5)
    draw.text((100, 105), product_name[:34], fill=(17, 24, 39, 255), font=get_font(58, bold=True))
    draw.text((100, 185), f"{product_type} • Warna utama: {thumbnail_color}", fill=(71, 85, 105, 255), font=get_font(30, bold=False))
    mock = Image.open(base_mockup_path).convert("RGBA")
    mock = fit_image(mock, 860, 980)
    base.alpha_composite(mock, (100, 290))
    draw.rounded_rectangle((1080, 320, 1460, 700), radius=28, fill=(248, 250, 252, 255), outline=(191, 219, 254, 255), width=4)
    draw.text((1160, 345), "Zoom Desain", fill=(30, 64, 175, 255), font=get_font(32, bold=True))
    if design_img is not None:
        dz = fit_image(design_img, 280, 280)
        base.alpha_composite(dz, ((1080 + 380 - dz.width) // 2, (410 + 260 - dz.height) // 2))
    else:
        draw.text((1165, 520), "DESAIN", fill=(30, 64, 175, 255), font=get_font(42, bold=True))
    draw.text((1090, 770), "Pilihan Warna", fill=(17, 24, 39, 255), font=get_font(36, bold=True))
    start_x, start_y = 1090, 835
    for idx, item in enumerate(all_colors[:8]):
        cx = start_x + (idx % 2) * 185
        cy = start_y + (idx // 2) * 102
        rgb = hex_to_rgb(item.get("hex", "#dddddd"))
        draw.rounded_rectangle((cx, cy, cx + 165, cy + 84), radius=20, fill=(248, 250, 252, 255), outline=(226, 232, 240, 255), width=3)
        draw.rounded_rectangle((cx + 16, cy + 16, cx + 56, cy + 56), radius=18, fill=rgb + (255,), outline=(148, 163, 184, 255), width=2)
        draw.text((cx + 70, cy + 24), item.get("name", "-"), fill=(51, 65, 85, 255), font=get_font(24, bold=True))
    add_badge(base, default_text, default_text_position)
    return base


def build_listing_text(product_name, product_type, colors, thumbnail_color, video_color, default_text, default_text_position, marketplace, listing_tone, keywords, advantages, generated_files):
    color_lines = [f"- {item.get('name', '-')}" if isinstance(item, dict) else f"- {str(item)}" for item in colors]
    bullet_advantages = [part.strip() for part in advantages.split(",") if part.strip()]
    bullet_lines = "\n".join(f"- {item}" for item in bullet_advantages) if bullet_advantages else "-"
    file_lines = [f"- {item.get('name', '-')}" if isinstance(item, dict) else f"- {str(item)}" for item in generated_files]
    return f"""Judul Produk:\n{product_name}\n\nTipe Produk:\n{product_type}\n\nVarian Warna:\n{chr(10).join(color_lines) if color_lines else '-'}\n\nThumbnail Warna Utama:\n{thumbnail_color}\n\nVideo Warna Utama:\n{video_color}\n\nDefault Text:\n{default_text or '-'}\n\nPosisi Default Text:\n{default_text_position}\n\nMarketplace:\n{marketplace}\n\nGaya Listing:\n{listing_tone}\n\nKeyword:\n{keywords or '-'}\n\nKeunggulan:\n{bullet_lines}\n\nDaftar Output:\n{chr(10).join(file_lines) if file_lines else '-'}\n\nCatatan:\nFile ini dibuat otomatis oleh backend V15. Jika GEMINI_API_KEY tersedia, gambar/video akan dicoba melalui Gemini + Veo. Jika tidak, backend memakai fallback lokal.\n"""


def create_zip_export(job_folder: Path, job_id: str) -> Path:
    zip_path = job_folder / f"{job_id}_export.zip"
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for path in sorted(job_folder.rglob("*")):
            if path == zip_path:
                continue
            if path.is_file():
                zf.write(path, path.relative_to(job_folder))
    return zip_path


def get_gemini_client():
    api_key = os.getenv("GEMINI_API_KEY")
    if genai is None or not api_key:
        return None
    try:
        return genai.Client(api_key=api_key)
    except TypeError:
        return genai.Client()


def encode_image_base64(path: Path) -> str:
    return base64.b64encode(path.read_bytes()).decode("utf-8")


def infer_mime(path: Path) -> str:
    ext = path.suffix.lower()
    if ext in [".jpg", ".jpeg"]:
        return "image/jpeg"
    if ext == ".webp":
        return "image/webp"
    return "image/png"


def extract_interaction_image_data(interaction):
    try:
        output_image = getattr(interaction, "output_image", None)
        if output_image and getattr(output_image, "data", None):
            return output_image.data
    except Exception:
        pass
    try:
        for step in getattr(interaction, "steps", []) or []:
            if getattr(step, "type", None) == "model_output":
                for content in getattr(step, "content", []) or []:
                    if getattr(content, "type", None) == "image" and getattr(content, "data", None):
                        return content.data
    except Exception:
        pass
    return None


def generate_image_with_gemini(client, prompt: str, reference_paths: list[Path], model: str, out_path: Path, aspect_ratio: str | None = None):
    payload = [{"type": "text", "text": prompt}]
    for path in reference_paths[:8]:
        if path.exists():
            payload.append({
                "type": "image",
                "mime_type": infer_mime(path),
                "data": encode_image_base64(path),
            })
    kwargs = {"model": model, "input": payload}
    if aspect_ratio:
        kwargs["response_format"] = {"type": "image", "aspect_ratio": aspect_ratio}
    interaction = client.interactions.create(**kwargs)
    image_b64 = extract_interaction_image_data(interaction)
    if not image_b64:
        raise RuntimeError("Gemini interaction did not return image data.")
    out_path.write_bytes(base64.b64decode(image_b64))
    return out_path


def build_mockup_prompt(product_name, product_type, color_name, design_mode, default_text, logo_position, age_target, theme, style, extra_text):
    notes = []
    if default_text:
        notes.append(f'Include a small tasteful promo badge with the text "{default_text}".')
    if extra_text:
        notes.append(f'Optional supporting text: "{extra_text}" if it improves the design.')
    if design_mode == "Depan + Belakang":
        scene = "Create one ecommerce listing image that clearly shows both front and back views in a clean split composition."
    elif design_mode == "Belakang Saja":
        scene = "Show the back view clearly as the main focus."
    else:
        scene = "Show the front view clearly as the main focus."
    return (
        f"Create a high-resolution photorealistic ecommerce fashion image for a children's product listing. "
        f"Product: {product_name}. Product type: {product_type}. Garment color: {color_name}. Target age: {age_target}. "
        f"Theme: {theme}. Style direction: {style}. Use the uploaded artwork as the main print on the garment and keep it readable. "
        f"If a logo reference is provided, place it tastefully around the {logo_position.lower()}. "
        f"Use uploaded child model / pose / style references when available. Make the child look natural and age-appropriate, "
        f"with realistic anatomy, realistic fabric drape, soft clean lighting, and a clean background suitable for Shopee or Tokopedia. "
        f"{scene} {' '.join(notes)}"
    )


def build_thumbnail_prompt(product_name, product_type, color_name, colors, default_text, age_target, theme, style):
    color_list = ", ".join(item.get("name", "-") for item in colors)
    badge = f'Include a visible promo badge reading "{default_text}".' if default_text else "Promo badge is optional."
    return (
        f"Create a premium ecommerce thumbnail for a children's fashion product. Product: {product_name}. Type: {product_type}. "
        f"Main displayed color: {color_name}. Target age: {age_target}. Theme: {theme}. Style: {style}. "
        f"Use the uploaded references if provided. The layout must be clean, modern, and attractive. Include one main child model wearing the product, "
        f"a zoom circle for the print detail, a compact section showing available colors ({color_list}), and a neat information block. "
        f"{badge} Make it minimal, readable, and marketplace-ready."
    )


def build_video_prompt(product_name, product_type, color_name, age_target, theme, style, default_text, extra_text):
    notes = []
    if default_text:
        notes.append(f'Feature the promo text "{default_text}" subtly in one scene.')
    if extra_text:
        notes.append(f'Optional supporting text: "{extra_text}".')
    return (
        f"Create a short vertical product promo video for an ecommerce listing. Product: {product_name}. Product type: {product_type}. "
        f"Main color: {color_name}. Target age: {age_target}. Theme: {theme}. Style: {style}. "
        f"Show a cute child model naturally wearing the product. Focus on the printed design, the garment fit, and a clean premium online-shop feel. "
        f"Use short lifestyle-style motion, clean camera movement, and a bright friendly mood. {' '.join(notes)}"
    )


def parse_video_dims(video_format: str):
    if "1:1" in (video_format or ""):
        return (1080, 1080)
    if "16:9" in (video_format or ""):
        return (1280, 720)
    return (720, 1280)


def create_fallback_video(source_images: list[Path], out_path: Path, video_format: str = "9:16 Vertical", duration_label: str = "12 Detik"):
    width, height = parse_video_dims(video_format)
    try:
        seconds = int(str(duration_label).split()[0])
    except Exception:
        seconds = 12
    # Olshop-ready rule: video final minimal 10 detik, default aman 12 detik.
    if seconds < 10:
        seconds = 12
    fps = 12
    total_frames = max(1, seconds * fps)
    if not source_images:
        blank = Image.new("RGB", (width, height), (245, 247, 251))
        draw = ImageDraw.Draw(blank)
        draw.text((40, 40), "No source image available", fill=(31, 41, 55), font=get_font(36, bold=True))
        source_images = []
        temp = out_path.with_suffix(".png")
        blank.save(temp)
        source_images = [temp]

    frames_per_image = max(1, total_frames // len(source_images))
    with imageio.get_writer(out_path, fps=fps) as writer:
        written = 0
        for img_path in source_images:
            img = Image.open(img_path).convert("RGB")
            scale_base = 1.0
            for i in range(frames_per_image):
                progress = i / max(1, frames_per_image - 1)
                zoom = scale_base + 0.08 * progress
                target_w = int(img.width * zoom)
                target_h = int(img.height * zoom)
                zoomed = img.resize((target_w, target_h), Image.LANCZOS)
                if target_w < width or target_h < height:
                    zoomed = fit_image(zoomed.convert("RGBA"), width, height).convert("RGB")
                    canvas = Image.new("RGB", (width, height), (245, 247, 251))
                    canvas.paste(zoomed, ((width - zoomed.width) // 2, (height - zoomed.height) // 2))
                else:
                    left = max(0, (target_w - width) // 2)
                    top = max(0, (target_h - height) // 2)
                    canvas = zoomed.crop((left, top, left + width, top + height))
                writer.append_data(np.array(canvas))
                written += 1
        while written < total_frames:
            img = Image.open(source_images[-1]).convert("RGB")
            canvas = fit_image(img.convert("RGBA"), width, height).convert("RGB")
            bg = Image.new("RGB", (width, height), (245, 247, 251))
            bg.paste(canvas, ((width - canvas.width) // 2, (height - canvas.height) // 2))
            writer.append_data(np.array(bg))
            written += 1
    return out_path


def generate_video_with_gemini(client, prompt: str, model: str, out_path: Path, timeout_sec: int = 900):
    operation = client.models.generate_videos(model=model, prompt=prompt)
    start = time.time()
    while not operation.done:
        if time.time() - start > timeout_sec:
            raise TimeoutError("Video generation timed out.")
        time.sleep(10)
        operation = client.operations.get(operation)
    generated_video = operation.response.generated_videos[0]
    client.files.download(file=generated_video.video)
    generated_video.video.save(str(out_path))
    return out_path


@app.get("/download-zip/{job_id}")
async def download_zip(job_id: str):
    zip_path = GENERATED_DIR / job_id / f"{job_id}_export.zip"
    if not zip_path.exists():
        raise HTTPException(status_code=404, detail="ZIP export tidak ditemukan.")
    return FileResponse(path=zip_path, filename=zip_path.name, media_type="application/zip")


@app.post("/generate-assets")
async def generate_assets(
    request: Request,
    product_name: str = Form(...),
    product_type: str = Form(...),
    design_mode: str = Form(...),
    colors: str = Form(...),
    thumbnail_color: str = Form("Auto"),
    video_color: str = Form("Auto"),
    default_text: str = Form(""),
    default_text_position: str = Form("Atas"),
    logo_position: str = Form("Bawah Desain"),
    model_mode: str = Form("Tanpa Model"),
    age_target: str = Form("4-6 Tahun"),
    theme: str = Form("Lucu"),
    style: str = Form("Playful"),
    extra_text: str = Form(""),
    video_duration: str = Form("12 Detik"),
    video_format: str = Form("9:16 Vertical"),
    marketplace: str = Form("Shopee"),
    listing_tone: str = Form("SEO Marketplace"),
    keywords: str = Form(""),
    advantages: str = Form(""),
    generated_files: str = Form("[]"),
    design_x: float = Form(50),
    design_y: float = Form(50),
    design_scale: float = Form(28),
    logo_scale: float = Form(100),
    ai_reference_mode: str = Form("AI Reference + Product Mockup"),
    use_ai_generation: str = Form("true"),
    openai_model: str = Form("gemini-3-pro-image"),
    ai_quality: str = Form("high"),
    video_ai_model: str = Form("veo-3.1-generate-preview"),
    design_front: Optional[UploadFile] = File(None),
    design_back: Optional[UploadFile] = File(None),
    logo: Optional[UploadFile] = File(None),
    template_front: Optional[UploadFile] = File(None),
    template_back: Optional[UploadFile] = File(None),
    ai_model_reference: Optional[UploadFile] = File(None),
    ai_pose_reference: Optional[UploadFile] = File(None),
    ai_thumbnail_reference: Optional[UploadFile] = File(None),
    ai_style_reference: Optional[UploadFile] = File(None),
):
    base_url = str(request.base_url).rstrip("/")
    job_id = uuid4().hex[:12]
    job_folder = GENERATED_DIR / job_id
    renders_folder = job_folder / "renders"
    job_folder.mkdir(parents=True, exist_ok=True)
    renders_folder.mkdir(exist_ok=True)

    try:
        parsed_colors = json.loads(colors)
    except json.JSONDecodeError:
        parsed_colors = []
    normalized_colors = []
    for idx, item in enumerate(parsed_colors or []):
        if isinstance(item, dict):
            normalized_colors.append({"name": item.get("name", f"Warna-{idx + 1}"), "hex": item.get("hex", "#dddddd")})
        else:
            normalized_colors.append({"name": str(item), "hex": "#dddddd"})

    saved_uploads = []
    for file, field_name in [
        (design_front, "design_front"),
        (design_back, "design_back"),
        (logo, "logo"),
        (template_front, "template_front"),
        (template_back, "template_back"),
        (ai_model_reference, "ai_model_reference"),
        (ai_pose_reference, "ai_pose_reference"),
        (ai_thumbnail_reference, "ai_thumbnail_reference"),
        (ai_style_reference, "ai_style_reference"),
    ]:
        saved = await save_upload(file, job_folder, field_name)
        if saved:
            saved_uploads.append(saved)

    front_design_img = load_optional_image(saved_uploads, "design_front")
    back_design_img = load_optional_image(saved_uploads, "design_back") or front_design_img
    logo_img = load_optional_image(saved_uploads, "logo")
    template_front_img = load_optional_image(saved_uploads, "template_front")
    template_back_img = load_optional_image(saved_uploads, "template_back") or template_front_img

    ai_client = get_gemini_client() if str(use_ai_generation).lower() == "true" else None
    ai_active = ai_client is not None
    ai_errors = []
    preview_urls = []
    actual_generated_files = []
    chosen_thumbnail_path = None
    chosen_video_path = None
    chosen_thumbnail_name = normalized_colors[0]["name"] if normalized_colors else thumbnail_color
    chosen_video_name = normalized_colors[0]["name"] if normalized_colors else video_color
    product_slug = slugify(product_name)

    mockup_ref_fields = ["design_front", "design_back", "logo", "ai_model_reference", "ai_pose_reference", "ai_style_reference"]
    thumbnail_ref_fields = ["design_front", "logo", "ai_model_reference", "ai_thumbnail_reference", "ai_style_reference"]
    mockup_ref_paths = [get_upload_path(saved_uploads, field) for field in mockup_ref_fields]
    mockup_ref_paths = [p for p in mockup_ref_paths if p]
    thumbnail_ref_paths = [get_upload_path(saved_uploads, field) for field in thumbnail_ref_fields]
    thumbnail_ref_paths = [p for p in thumbnail_ref_paths if p]

    for color in normalized_colors:
        color_name = color["name"]
        color_rgb = hex_to_rgb(color.get("hex", "#dddddd"))
        color_slug = slugify(color_name)
        if design_mode == "Depan Saja":
            filename = f"{product_slug}_{color_slug}_mockup-depan.png"
        elif design_mode == "Belakang Saja":
            filename = f"{product_slug}_{color_slug}_mockup-belakang.png"
        elif design_mode == "Depan + Belakang":
            filename = f"{product_slug}_{color_slug}_mockup-depan-belakang.png"
        else:
            filename = f"{product_slug}_{color_slug}_mockup-multi-area.png"
        out_path = renders_folder / filename
        generated_by = "fallback"
        if ai_active:
            try:
                prompt = build_mockup_prompt(product_name, product_type, color_name, design_mode, default_text, logo_position, age_target, theme, style, extra_text)
                aspect = "4:5" if design_mode != "Depan + Belakang" else "4:3"
                generate_image_with_gemini(ai_client, prompt, mockup_ref_paths, openai_model, out_path, aspect)
                generated_by = "gemini"
            except Exception as exc:
                ai_errors.append({"file": filename, "error": str(exc)})
        if not out_path.exists():
            if design_mode == "Depan + Belakang" and (template_front_img is not None or template_back_img is not None):
                front = render_with_template(template_front_img or template_back_img, front_design_img, logo_img, default_text, default_text_position, logo_position, color_name, product_name, design_x, design_y, design_scale, logo_scale)
                back = render_with_template(template_back_img or template_front_img, back_design_img, logo_img, default_text, default_text_position, logo_position, color_name, product_name, design_x, design_y, design_scale, logo_scale)
                mockup = create_combined_front_back(front, back, product_name, color_name)
            elif design_mode == "Belakang Saja" and template_back_img is not None:
                mockup = render_with_template(template_back_img, back_design_img, logo_img, default_text, default_text_position, logo_position, color_name, product_name, design_x, design_y, design_scale, logo_scale)
            elif template_front_img is not None:
                mockup = render_with_template(template_front_img, front_design_img, logo_img, default_text, default_text_position, logo_position, color_name, product_name, design_x, design_y, design_scale, logo_scale)
            else:
                mockup = draw_fallback_shirt(color_rgb, front_design_img, logo_img, product_name, default_text, default_text_position, logo_position, design_x, design_y, design_scale, logo_scale)
            mockup.save(out_path)
        url = f"{base_url}/generated-files/{job_id}/renders/{filename}"
        actual_generated_files.append({"name": filename, "type": f"Mockup Warna ({generated_by})", "status": "Ready", "url": url})
        preview_urls.append({"name": filename, "type": f"Mockup Warna ({generated_by})", "url": url})
        if color_name == thumbnail_color or (thumbnail_color == "Auto" and chosen_thumbnail_path is None):
            chosen_thumbnail_path = out_path
            chosen_thumbnail_name = color_name
        if color_name == video_color or (video_color == "Auto" and chosen_video_path is None):
            chosen_video_path = out_path
            chosen_video_name = color_name

    if chosen_thumbnail_path is None and actual_generated_files:
        chosen_thumbnail_path = renders_folder / actual_generated_files[0]["name"]
    if chosen_video_path is None and actual_generated_files:
        chosen_video_path = renders_folder / actual_generated_files[0]["name"]

    if chosen_thumbnail_path and chosen_thumbnail_path.exists():
        thumb_filename = f"{product_slug}_{slugify(chosen_thumbnail_name)}_thumbnail-utama.jpg"
        thumb_path = renders_folder / thumb_filename
        generated_by = "fallback"
        if ai_active:
            try:
                prompt = build_thumbnail_prompt(product_name, product_type, chosen_thumbnail_name, normalized_colors, default_text, age_target, theme, style)
                generate_image_with_gemini(ai_client, prompt, thumbnail_ref_paths, openai_model, thumb_path, "1:1")
                generated_by = "gemini"
            except Exception as exc:
                ai_errors.append({"file": thumb_filename, "error": str(exc)})
        if not thumb_path.exists():
            thumb = generate_thumbnail(product_name, product_type, chosen_thumbnail_name, normalized_colors, chosen_thumbnail_path, front_design_img, default_text, default_text_position)
            thumb.convert("RGB").save(thumb_path, quality=95)
        thumb_url = f"{base_url}/generated-files/{job_id}/renders/{thumb_filename}"
        actual_generated_files.append({"name": thumb_filename, "type": f"Thumbnail Utama ({generated_by})", "status": "Ready", "url": thumb_url})
        preview_urls.append({"name": thumb_filename, "type": f"Thumbnail Utama ({generated_by})", "url": thumb_url})

    video_filename = f"{product_slug}_{slugify(chosen_video_name)}_promo.mp4"
    video_path = renders_folder / video_filename
    video_generated_by = "fallback"
    if ai_active:
        try:
            prompt = build_video_prompt(product_name, product_type, chosen_video_name, age_target, theme, style, default_text, extra_text)
            generate_video_with_gemini(ai_client, prompt, video_ai_model, video_path)
            video_generated_by = "veo"
        except Exception as exc:
            ai_errors.append({"file": video_filename, "error": str(exc)})
    if not video_path.exists():
        source_imgs = [p for p in [chosen_video_path, chosen_thumbnail_path] if p and Path(p).exists()]
        create_fallback_video(source_imgs, video_path, video_format, video_duration)
    video_url = f"{base_url}/generated-files/{job_id}/renders/{video_filename}"
    actual_generated_files.append({"name": video_filename, "type": f"Video Promo ({video_generated_by})", "status": "Ready", "url": video_url})
    preview_urls.append({"name": video_filename, "type": f"Video Promo ({video_generated_by})", "url": video_url})

    listing_text = build_listing_text(product_name, product_type, normalized_colors, chosen_thumbnail_name, chosen_video_name, default_text, default_text_position, marketplace, listing_tone, keywords, advantages, actual_generated_files)
    (job_folder / "listing.txt").write_text(listing_text, encoding="utf-8")
    actual_generated_files.append({"name": "listing.txt", "type": "Listing Produk", "status": "Ready"})

    ai_prompt = {
        "mode": ai_reference_mode,
        "provider": "Gemini",
        "image_model": openai_model,
        "video_model": video_ai_model,
        "quality": ai_quality,
        "ai_enabled": ai_active,
        "product": {
            "name": product_name,
            "type": product_type,
            "design_mode": design_mode,
            "colors": normalized_colors,
            "thumbnail_color": chosen_thumbnail_name,
            "video_color": chosen_video_name,
            "default_text": default_text,
            "default_text_position": default_text_position,
        },
        "references": [
            item
            for item in saved_uploads
            if item.get("field")
            in [
                "ai_model_reference",
                "ai_pose_reference",
                "ai_thumbnail_reference",
                "ai_style_reference",
                "design_front",
                "design_back",
                "logo",
            ]
        ],
        "errors": ai_errors,
    }
    (job_folder / "ai_prompt.json").write_text(json.dumps(ai_prompt, indent=2, ensure_ascii=False), encoding="utf-8")
    (job_folder / "generated_files.json").write_text(json.dumps(actual_generated_files, indent=2, ensure_ascii=False), encoding="utf-8")

    manifest = {
        "job_id": job_id,
        "status": "completed",
        "product_name": product_name,
        "product_type": product_type,
        "design_mode": design_mode,
        "colors": normalized_colors,
        "thumbnail_color": chosen_thumbnail_name,
        "video_color": chosen_video_name,
        "default_text": default_text,
        "default_text_position": default_text_position,
        "logo_position": logo_position,
        "model_mode": model_mode,
        "age_target": age_target,
        "theme": theme,
        "style": style,
        "extra_text": extra_text,
        "video_duration": video_duration,
        "video_format": video_format,
        "marketplace": marketplace,
        "listing_tone": listing_tone,
        "keywords": keywords,
        "advantages": advantages,
        "saved_uploads": saved_uploads,
        "generated_files": actual_generated_files,
        "preview_urls": preview_urls,
        "ai_reference_mode": ai_reference_mode,
        "ai_provider": "Gemini",
        "use_ai_generation": str(use_ai_generation).lower() == "true",
        "ai_enabled": ai_active,
        "image_model": openai_model,
        "video_model": video_ai_model,
        "ai_quality": ai_quality,
        "ai_errors": ai_errors,
        "note": "V17 Hugging Face ready online app. Video final is designed to be minimum 10 seconds. Gemini/Veo runs if GEMINI_API_KEY is configured; otherwise fallback local render + slideshow video is used.",
    }
    (job_folder / "manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
    zip_path = create_zip_export(job_folder, job_id)

    ai_summary = "Gemini + Veo aktif dan dipakai." if ai_active else "AI tidak aktif (GEMINI_API_KEY belum ada / library belum tersedia), jadi backend pakai fallback lokal."
    if ai_errors:
        ai_summary += f" Sebagian file fallback karena error AI: {len(ai_errors)}."

    return {
        "status": "completed",
        "job_id": job_id,
        "message": "Data diterima backend. Mockup, thumbnail, video, listing, manifest, dan ZIP export sudah disimpan.",
        "zip_path": str(zip_path),
        "download_url": f"{base_url}/download-zip/{job_id}",
        "saved_uploads": saved_uploads,
        "generated_files": actual_generated_files,
        "preview_urls": preview_urls,
        "ai_enabled": ai_active,
        "ai_summary": ai_summary,
        "ai_errors": ai_errors,
    }
