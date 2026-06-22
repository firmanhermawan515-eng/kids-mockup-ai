"use client";

import { ChangeEvent, useMemo, useState } from "react";

type ColorVariant = {
  name: string;
  hex: string;
  custom?: boolean;
};

type GeneratedFile = {
  name: string;
  type: string;
  status: "Ready" | "Pending";
  url?: string;
};

type PreviewItem = {
  name: string;
  type: string;
  url: string;
};

const productTypes = [
  "Baju Anak",
  "Hoodie Anak",
  "Sweater Anak",
  "Zipper Anak",
  "Jaket Anak",
  "Tas Serut Anak",
  "Topi Anak",
];

const designModes = [
  "Depan Saja",
  "Belakang Saja",
  "Depan + Belakang",
  "Multi Area",
];

const presetColors: ColorVariant[] = [
  { name: "Hitam", hex: "#111827" },
  { name: "Putih", hex: "#ffffff" },
  { name: "Navy", hex: "#1e2a44" },
  { name: "Abu Misty", hex: "#b8b8b8" },
  { name: "Biru Muda", hex: "#93c5fd" },
  { name: "Pink", hex: "#f9a8d4" },
  { name: "Maroon", hex: "#7f1d1d" },
  { name: "Hijau Muda", hex: "#86efac" },
  { name: "Kuning", hex: "#fde047" },
  { name: "Orange", hex: "#fb923c" },
  { name: "Hijau Botol", hex: "#064e3b" },
  { name: "Cokelat", hex: "#7c2d12" },
  { name: "Merah", hex: "#dc2626" },
  { name: "Army", hex: "#4d5d36" },
  { name: "Lilac", hex: "#c084fc" },
  { name: "Biru", hex: "#2563eb" },
  { name: "Lavender", hex: "#ddd6fe" },
  { name: "Mocca", hex: "#a16207" },
];

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "https://chufier-generate-ai.hf.space").replace(/\/+$/, "");

const menuItems = [
  "Generate Assets",
  "Product Templates",
  "Brand Kit",
  "Variant Manager",
  "Video Generator",
  "Listing Assistant",
  "Output Gallery",
  "Export Olshop",
  "Settings",
];

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function HomePage() {
  const [activeMenu, setActiveMenu] = useState("Generate Assets");
  const [productName, setProductName] = useState("Kaos Anak Dino Series");
  const [productType, setProductType] = useState("Baju Anak");
  const [designMode, setDesignMode] = useState("Depan Saja");
  const [colors, setColors] = useState<ColorVariant[]>(presetColors);
  const [selectedColorNames, setSelectedColorNames] = useState<string[]>([
    "Hitam",
    "Putih",
    "Biru Muda",
    "Pink",
  ]);
  const [customColorName, setCustomColorName] = useState("");
  const [customColorHex, setCustomColorHex] = useState("#a7f3d0");
  const [logoPosition, setLogoPosition] = useState("Bawah Desain");
  const [modelMode, setModelMode] = useState("Tanpa Model");
  const [ageTarget, setAgeTarget] = useState("4-6 Tahun");
  const [theme, setTheme] = useState("Lucu");
  const [style, setStyle] = useState("Playful");
  const [extraText, setExtraText] = useState("");

  const [thumbnailColorChoice, setThumbnailColorChoice] = useState("Auto");
  const [videoColorChoice, setVideoColorChoice] = useState("Auto");
  const [imageDefaultText, setImageDefaultText] = useState("FREE NAMA");
  const [imageDefaultTextPosition, setImageDefaultTextPosition] = useState("Atas");

  const [videoDuration, setVideoDuration] = useState("12 Detik");
  const [videoFormat, setVideoFormat] = useState("9:16 Vertical");
  const [marketplace, setMarketplace] = useState("Shopee");
  const [listingTone, setListingTone] = useState("SEO Marketplace");
  const [keywords, setKeywords] = useState("baju anak, kaos anak lucu, baju anak custom");
  const [advantages, setAdvantages] = useState("bahan adem, desain lucu, cocok untuk anak aktif, tersedia banyak warna");
  const [status, setStatus] = useState("Draft");
  const [message, setMessage] = useState("Belum ada aset yang digenerate.");
  const [backendStatus, setBackendStatus] = useState(`Backend belum dipanggil. Target: ${API_BASE_URL}`);
  const [zipDownloadUrl, setZipDownloadUrl] = useState("");
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([]);
  const [previewUrls, setPreviewUrls] = useState<PreviewItem[]>([]);
  const [useAiGeneration, setUseAiGeneration] = useState(true);
  const [openaiModel, setOpenaiModel] = useState("gemini-3-pro-image");
  const [videoAiModel, setVideoAiModel] = useState("veo-3.1-generate-preview");
  const [aiQuality, setAiQuality] = useState("high");
  const [frontDesignFile, setFrontDesignFile] = useState<File | null>(null);
  const [backDesignFile, setBackDesignFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [templateFrontFile, setTemplateFrontFile] = useState<File | null>(null);
  const [templateBackFile, setTemplateBackFile] = useState<File | null>(null);
  const [aiModelReferenceFile, setAiModelReferenceFile] = useState<File | null>(null);
  const [aiPoseReferenceFile, setAiPoseReferenceFile] = useState<File | null>(null);
  const [aiThumbnailReferenceFile, setAiThumbnailReferenceFile] = useState<File | null>(null);
  const [aiStyleReferenceFile, setAiStyleReferenceFile] = useState<File | null>(null);
  const [aiReferenceMode, setAiReferenceMode] = useState("AI Reference + Product Mockup");
  const [designPositionX, setDesignPositionX] = useState(50);
  const [designPositionY, setDesignPositionY] = useState(50);
  const [designScale, setDesignScale] = useState(28);
  const [logoScale, setLogoScale] = useState(100);

  const selectedColors = useMemo(
    () => colors.filter((color) => selectedColorNames.includes(color.name)),
    [colors, selectedColorNames]
  );

  const selectedColorOptions = selectedColors.map((color) => color.name);

  function resolveChosenColor(choice: string) {
    if (selectedColors.length === 0) return "-";
    if (choice !== "Auto" && selectedColorOptions.includes(choice)) return choice;
    return selectedColors[0].name;
  }

  const resolvedThumbnailColor = resolveChosenColor(thumbnailColorChoice);
  const resolvedVideoColor = resolveChosenColor(videoColorChoice);

  const generatedTitle = `${productName || productType} ${theme} ${productType}, Banyak Warna, Nyaman untuk Anak`;
  const colorText = selectedColors.map((color) => color.name).join(", ");
  const generatedDescription = `${productName || productType} adalah ${productType.toLowerCase()} dengan desain ${theme.toLowerCase()} dan style ${style.toLowerCase()}. Cocok untuk target usia ${ageTarget}. Tersedia dalam varian warna: ${colorText || "-"}. Keunggulan produk: ${advantages || "-"}.`;
  const fileBaseName = slugify(productName || productType);
  const firstColor = selectedColors[0] ?? colors[0];
  const totalAssets = selectedColors.length === 0 ? 0 : selectedColors.length + 3;

  const promoPositionClass =
    imageDefaultTextPosition === "Bawah"
      ? "bottom"
      : imageDefaultTextPosition === "Kiri"
      ? "left"
      : imageDefaultTextPosition === "Kanan"
      ? "right"
      : "top";

  function toggleColor(name: string) {
    setSelectedColorNames((current) =>
      current.includes(name)
        ? current.filter((item) => item !== name)
        : [...current, name]
    );
    setStatus("Draft");
    setMessage("Varian warna berubah. Klik generate untuk membuat ulang output.");
  }

  function addCustomColor() {
    const name = customColorName.trim();
    if (!name) {
      alert("Isi nama warna dulu, contoh: Mint atau Dusty Pink.");
      return;
    }

    const exists = colors.some(
      (color) => color.name.toLowerCase() === name.toLowerCase()
    );

    if (exists) {
      alert("Warna itu sudah ada di daftar varian.");
      return;
    }

    const newColor = { name, hex: customColorHex, custom: true };
    setColors((current) => [...current, newColor]);
    setSelectedColorNames((current) => [...current, name]);
    setCustomColorName("");
    setStatus("Draft");
    setMessage(`Warna manual "${name}" berhasil ditambahkan.`);
  }

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>,
    setter: (file: File | null) => void
  ) {
    const file = event.target.files?.[0] ?? null;
    setter(file);
    if (file) {
      setMessage(`File "${file.name}" berhasil dipilih.`);
    }
  }

  function buildGeneratedFiles() {
    const files: GeneratedFile[] = [];

    selectedColors.forEach((color) => {
      const colorSlug = slugify(color.name);

      if (designMode === "Depan Saja") {
        files.push({
          name: `${fileBaseName}_${colorSlug}_mockup-depan.png`,
          type: "Mockup Warna",
          status: "Ready",
        });
      }

      if (designMode === "Belakang Saja") {
        files.push({
          name: `${fileBaseName}_${colorSlug}_mockup-belakang.png`,
          type: "Mockup Warna",
          status: "Ready",
        });
      }

      if (designMode === "Depan + Belakang") {
        files.push({
          name: `${fileBaseName}_${colorSlug}_mockup-depan-belakang.png`,
          type: "Mockup Warna Gabungan",
          status: "Ready",
        });
      }

      if (designMode === "Multi Area") {
        files.push({
          name: `${fileBaseName}_${colorSlug}_mockup-multi-area.png`,
          type: "Mockup Warna Multi Area",
          status: "Ready",
        });
      }
    });

    files.push({
      name: `${fileBaseName}_${slugify(resolvedThumbnailColor)}_thumbnail-utama.jpg`,
      type: `Thumbnail Utama (${resolvedThumbnailColor})`,
      status: "Ready",
    });
    files.push({
      name: `${fileBaseName}_${slugify(resolvedVideoColor)}_video-10detik.mp4`,
      type: `Video Produk (${resolvedVideoColor})`,
      status: "Ready",
    });
    files.push({
      name: `${fileBaseName}_listing.txt`,
      type: "Listing Produk",
      status: "Ready",
    });

    return files;
  }

  async function generateAssets() {
    if (selectedColors.length === 0) {
      alert("Pilih minimal satu warna dulu.");
      return;
    }

    if (!productName.trim()) {
      alert("Isi nama produk dulu supaya nama file dan listing bisa dibuat.");
      return;
    }

    const files = buildGeneratedFiles();

    const formData = new FormData();
    formData.append("product_name", productName);
    formData.append("product_type", productType);
    formData.append("design_mode", designMode);
    formData.append("colors", JSON.stringify(selectedColors));
    formData.append("thumbnail_color", resolvedThumbnailColor);
    formData.append("video_color", resolvedVideoColor);
    formData.append("default_text", imageDefaultText);
    formData.append("default_text_position", imageDefaultTextPosition);
    formData.append("logo_position", logoPosition);
    formData.append("model_mode", modelMode);
    formData.append("age_target", ageTarget);
    formData.append("theme", theme);
    formData.append("style", style);
    formData.append("extra_text", extraText);
    formData.append("video_duration", videoDuration);
    formData.append("video_format", videoFormat);
    formData.append("marketplace", marketplace);
    formData.append("listing_tone", listingTone);
    formData.append("keywords", keywords);
    formData.append("advantages", advantages);
    formData.append("generated_files", JSON.stringify(files));
    formData.append("design_x", String(designPositionX));
    formData.append("design_y", String(designPositionY));
    formData.append("design_scale", String(designScale));
    formData.append("logo_scale", String(logoScale));
    formData.append("ai_reference_mode", aiReferenceMode);
    formData.append("use_ai_generation", String(useAiGeneration));
    formData.append("openai_model", openaiModel);
    formData.append("ai_quality", aiQuality);
    formData.append("video_ai_model", videoAiModel);

    if (frontDesignFile) formData.append("design_front", frontDesignFile);
    if (backDesignFile) formData.append("design_back", backDesignFile);
    if (logoFile) formData.append("logo", logoFile);
    if (templateFrontFile) formData.append("template_front", templateFrontFile);
    if (templateBackFile) formData.append("template_back", templateBackFile);
    if (aiModelReferenceFile) formData.append("ai_model_reference", aiModelReferenceFile);
    if (aiPoseReferenceFile) formData.append("ai_pose_reference", aiPoseReferenceFile);
    if (aiThumbnailReferenceFile) formData.append("ai_thumbnail_reference", aiThumbnailReferenceFile);
    if (aiStyleReferenceFile) formData.append("ai_style_reference", aiStyleReferenceFile);

    setStatus("Generating...");
    setMessage(`Mengirim data ke backend FastAPI: ${API_BASE_URL}`);

    try {
      const response = await fetch(`${API_BASE_URL}/generate-assets`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Backend error ${response.status}`);
      }

      const data = await response.json();
      setGeneratedFiles(data.generated_files ?? files);
      setPreviewUrls(data.preview_urls ?? []);
      setZipDownloadUrl(data.download_url ?? "");
      setBackendStatus(
        `Backend OK. Job ID: ${data.job_id}. ${data.ai_summary ?? "Output tersimpan di backend/generated."}`
      );
      setStatus("All Assets Ready");
      setActiveMenu("Output Gallery");
      setMessage(
        `Generate berhasil via backend. ${selectedColors.length} mockup warna + 1 thumbnail (${resolvedThumbnailColor}) + 1 video (${resolvedVideoColor}) + 1 listing = ${files.length} file. mockup gambar asli dan ZIP export siap diunduh.`
      );
    } catch (error) {
      console.error(error);
      setGeneratedFiles(files);
      setPreviewUrls([]);
      setZipDownloadUrl("");
      setBackendStatus(
        `Backend gagal dipanggil: ${error instanceof Error ? error.message : String(error)}. Target: ${API_BASE_URL}. Output frontend tetap dibuat sebagai simulasi.`
      );
      setStatus("All Assets Ready");
      setActiveMenu("Output Gallery");
      setMessage(
        `Generate simulasi berhasil. Jalankan backend FastAPI agar data upload benar-benar tersimpan.`
      );
    }
  }

  function downloadListing() {
    const content = [
      `Judul Produk:`,
      generatedTitle,
      ``,
      `Deskripsi Produk:`,
      generatedDescription,
      ``,
      `Bullet Point:`,
      `- ${advantages.split(",").map((item) => item.trim()).filter(Boolean).join("\n- ")}`,
      ``,
      `Keyword:`,
      keywords,
      ``,
      `Varian Warna:`,
      selectedColors.map((color) => `- ${color.name}`).join("\n"),
      ``,
      `Thumbnail Warna Utama: ${resolvedThumbnailColor}`,
      `Video Warna Utama: ${resolvedVideoColor}`,
      `Default Text di Semua Gambar: ${imageDefaultText || "-"}`,
      `Posisi Default Text: ${imageDefaultTextPosition}`,
      `Video: ${videoDuration} - ${videoFormat}`,
      `Marketplace: ${marketplace}`,
      `Gaya Listing: ${listingTone}`,
    ].join("\n");

    downloadTextFile(`${fileBaseName}_listing.txt`, content);
  }

  function downloadManifest() {
    const content = {
      productName,
      productType,
      designMode,
      colors: selectedColors,
      logoPosition,
      modelMode,
      ageTarget,
      theme,
      style,
      extraText,
      thumbnailColorChoice: resolvedThumbnailColor,
      videoColorChoice: resolvedVideoColor,
      imageDefaultText,
      imageDefaultTextPosition,
      videoDuration,
      videoFormat,
      marketplace,
      listingTone,
      keywords,
      advantages,
      backendStatus,
      zipDownloadUrl,
      templateFrontFile: templateFrontFile?.name ?? null,
      templateBackFile: templateBackFile?.name ?? null,
      designPositionX,
      designPositionY,
      designScale,
      logoScale,
      aiReferenceMode,
      aiModelReferenceFile: aiModelReferenceFile?.name ?? null,
      aiPoseReferenceFile: aiPoseReferenceFile?.name ?? null,
      aiThumbnailReferenceFile: aiThumbnailReferenceFile?.name ?? null,
      aiStyleReferenceFile: aiStyleReferenceFile?.name ?? null,
      generatedFiles,
      useAiGeneration,
      openaiModel,
      aiQuality,
      previewUrls,
    };

    downloadTextFile(`${fileBaseName}_manifest.json`, JSON.stringify(content, null, 2));
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          Kids Mockup AI V18
          <span>HF Backend + Gemini/Veo</span>
        </div>
        <nav className="nav">
          {menuItems.map((item) => (
            <button
              key={item}
              type="button"
              className={activeMenu === item ? "active" : ""}
              onClick={() => setActiveMenu(item)}
            >
              {item}
            </button>
          ))}
        </nav>
      </aside>

      <section className="main">
        <header className="topbar">
          <div>
            <h1>{activeMenu}</h1>
            <p>
              Upload desain + referensi AI, pilih warna, lalu generate mockup AI, thumbnail, dan listing.
            </p>
          </div>
          <div className={status === "All Assets Ready" ? "badge success" : "badge"}>
            {status}
          </div>
        </header>

        <div className="notice">{message}</div>

        <div className="grid">
          <section className="card form-card">
            {activeMenu === "Generate Assets" && (
              <GenerateAssetsForm
                productName={productName}
                setProductName={setProductName}
                productType={productType}
                setProductType={setProductType}
                designMode={designMode}
                setDesignMode={setDesignMode}
                colors={colors}
                selectedColorNames={selectedColorNames}
                toggleColor={toggleColor}
                setSelectedColorNames={setSelectedColorNames}
                customColorName={customColorName}
                setCustomColorName={setCustomColorName}
                customColorHex={customColorHex}
                setCustomColorHex={setCustomColorHex}
                addCustomColor={addCustomColor}
                logoPosition={logoPosition}
                setLogoPosition={setLogoPosition}
                modelMode={modelMode}
                setModelMode={setModelMode}
                ageTarget={ageTarget}
                setAgeTarget={setAgeTarget}
                theme={theme}
                setTheme={setTheme}
                style={style}
                setStyle={setStyle}
                extraText={extraText}
                setExtraText={setExtraText}
                frontDesignFile={frontDesignFile}
                backDesignFile={backDesignFile}
                logoFile={logoFile}
                templateFrontFile={templateFrontFile}
                templateBackFile={templateBackFile}
                onFrontFile={(event) => handleFileChange(event, setFrontDesignFile)}
                onBackFile={(event) => handleFileChange(event, setBackDesignFile)}
                onLogoFile={(event) => handleFileChange(event, setLogoFile)}
                onTemplateFrontFile={(event) => handleFileChange(event, setTemplateFrontFile)}
                onTemplateBackFile={(event) => handleFileChange(event, setTemplateBackFile)}
                designPositionX={designPositionX}
                setDesignPositionX={setDesignPositionX}
                designPositionY={designPositionY}
                setDesignPositionY={setDesignPositionY}
                designScale={designScale}
                setDesignScale={setDesignScale}
                logoScale={logoScale}
                setLogoScale={setLogoScale}
                aiReferenceMode={aiReferenceMode}
                setAiReferenceMode={setAiReferenceMode}
                aiModelReferenceFile={aiModelReferenceFile}
                aiPoseReferenceFile={aiPoseReferenceFile}
                aiThumbnailReferenceFile={aiThumbnailReferenceFile}
                aiStyleReferenceFile={aiStyleReferenceFile}
                onAiModelReferenceFile={(event) => handleFileChange(event, setAiModelReferenceFile)}
                onAiPoseReferenceFile={(event) => handleFileChange(event, setAiPoseReferenceFile)}
                onAiThumbnailReferenceFile={(event) => handleFileChange(event, setAiThumbnailReferenceFile)}
                onAiStyleReferenceFile={(event) => handleFileChange(event, setAiStyleReferenceFile)}
                useAiGeneration={useAiGeneration}
                setUseAiGeneration={setUseAiGeneration}
                openaiModel={openaiModel}
                setOpenaiModel={setOpenaiModel}
                videoAiModel={videoAiModel}
                setVideoAiModel={setVideoAiModel}
                aiQuality={aiQuality}
                setAiQuality={setAiQuality}
                thumbnailColorChoice={thumbnailColorChoice}
                setThumbnailColorChoice={setThumbnailColorChoice}
                videoColorChoice={videoColorChoice}
                setVideoColorChoice={setVideoColorChoice}
                selectedColorOptions={selectedColorOptions}
                imageDefaultText={imageDefaultText}
                setImageDefaultText={setImageDefaultText}
                imageDefaultTextPosition={imageDefaultTextPosition}
                setImageDefaultTextPosition={setImageDefaultTextPosition}
                generateAssets={generateAssets}
              />
            )}

            {activeMenu === "Product Templates" && (
              <SimplePanel
                title="Product Templates"
                text="Template yang disiapkan: baju anak, hoodie anak, sweater anak, zipper anak, jaket anak, tas serut anak, dan topi anak."
              />
            )}

            {activeMenu === "Brand Kit" && (
              <SimplePanel
                title="Brand Kit"
                text="Bagian ini untuk menyimpan nama toko, logo utama, logo alternatif, warna brand, dan default posisi logo."
              />
            )}

            {activeMenu === "Variant Manager" && (
              <VariantManager
                colors={colors}
                selectedColors={selectedColors}
                selectedColorNames={selectedColorNames}
                toggleColor={toggleColor}
              />
            )}

            {activeMenu === "Video Generator" && (
              <VideoPanel
                videoDuration={videoDuration}
                setVideoDuration={setVideoDuration}
                videoFormat={videoFormat}
                setVideoFormat={setVideoFormat}
                selectedColorOptions={selectedColorOptions}
                videoColorChoice={videoColorChoice}
                setVideoColorChoice={setVideoColorChoice}
              />
            )}

            {activeMenu === "Listing Assistant" && (
              <ListingPanel
                marketplace={marketplace}
                setMarketplace={setMarketplace}
                listingTone={listingTone}
                setListingTone={setListingTone}
                keywords={keywords}
                setKeywords={setKeywords}
                advantages={advantages}
                setAdvantages={setAdvantages}
                generatedTitle={generatedTitle}
                generatedDescription={generatedDescription}
                defaultText={imageDefaultText}
                defaultTextPosition={imageDefaultTextPosition}
                downloadListing={downloadListing}
              />
            )}

            {activeMenu === "Output Gallery" && (
              <GalleryPanel
                generatedFiles={generatedFiles}
                previewUrls={previewUrls}
                backendStatus={backendStatus}
                zipDownloadUrl={zipDownloadUrl}
                downloadListing={downloadListing}
                downloadManifest={downloadManifest}
              />
            )}

            {activeMenu === "Export Olshop" && (
              <ExportPanel
                generatedFiles={generatedFiles}
                thumbnailColor={resolvedThumbnailColor}
                videoColor={resolvedVideoColor}
                defaultText={imageDefaultText}
                defaultTextPosition={imageDefaultTextPosition}
                zipDownloadUrl={zipDownloadUrl}
                downloadListing={downloadListing}
                downloadManifest={downloadManifest}
              />
            )}

            {activeMenu === "Settings" && (
              <SimplePanel
                title="Settings"
                text="Pengaturan nanti bisa berisi default marketplace, default rasio video, koneksi backend FastAPI/ComfyUI, dan preset text promosi."
              />
            )}
          </section>

          <aside className="card preview-card">
            <h2>Live Preview</h2>
            <p className="desc">
              Preview ini menunjukkan warna mockup awal, pilihan thumbnail/video,
              dan default text yang akan dipakai di semua gambar.
            </p>

            <div className="preview-box">
              <div
                className="mock-shirt"
                style={{ "--shirt-color": firstColor?.hex ?? "#ffffff" } as React.CSSProperties}
              >
                {imageDefaultText.trim() ? (
                  <span className={`promo-tag ${promoPositionClass}`}>
                    {imageDefaultText}
                  </span>
                ) : null}
                <span className="design-area">DESIGN</span>
              </div>
              <strong>{productName || "Mockup Preview"}</strong>
            </div>

            <div className="status-list">
              <div><b>Produk</b><span>{productType}</span></div>
              <div><b>Area Desain</b><span>{designMode}</span></div>
              <div><b>Varian Warna</b><span>{selectedColors.length} warna</span></div>
              <div><b>Total Aset</b><span>{totalAssets} file</span></div>
              <div><b>Backend</b><span>{backendStatus}</span></div>
              <div><b>AI Engine</b><span>{useAiGeneration ? `${openaiModel} + ${videoAiModel} (${aiQuality})` : "OFF / fallback"}</span></div>
              <div><b>Thumbnail</b><span>{resolvedThumbnailColor}</span></div>
              <div><b>Video</b><span>{resolvedVideoColor}</span></div>
              <div><b>Default Text</b><span>{imageDefaultText || "-"}</span></div>
              <div><b>Posisi Text</b><span>{imageDefaultTextPosition}</span></div>
            </div>

            <div className="variant-preview">
              {selectedColors.map((color) => (
                <div className="variant-thumb-card" key={color.name}>
                  <span style={{ background: color.hex }} />
                  <b>{color.name}</b>
                </div>
              ))}
            </div>

            <div className="output-grid">
              <OutputCard
                title="Mockup Warna"
                text="1 warna menghasilkan 1 mockup utama, AI bila tersedia."
                ready={status === "All Assets Ready"}
              />
              <OutputCard
                title={`Thumbnail (${resolvedThumbnailColor})`}
                text="1 gambar cover utama untuk satu produk."
                ready={status === "All Assets Ready"}
              />
              <OutputCard
                title={`Video (${resolvedVideoColor})`}
                text={`${videoDuration}, ${videoFormat}.`}
                ready={status === "All Assets Ready"}
              />
              <OutputCard
                title="Listing TXT"
                text="Judul, deskripsi, keyword, dan setting text."
                ready={status === "All Assets Ready"}
              />
            </div>

            <div className="panel">
              <h2>Preview Listing</h2>
              <p><b>Judul:</b><br />{generatedTitle}</p>
              <p><b>Deskripsi:</b><br />{generatedDescription}</p>
              <p><b>Default Text Semua Gambar:</b><br />{imageDefaultText || "-"} ({imageDefaultTextPosition})</p>
              <div className="actions compact">
                <button type="button" className="secondary" onClick={downloadListing}>
                  Download Listing TXT
                </button>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

function GenerateAssetsForm(props: {
  productName: string;
  setProductName: (value: string) => void;
  productType: string;
  setProductType: (value: string) => void;
  designMode: string;
  setDesignMode: (value: string) => void;
  colors: ColorVariant[];
  selectedColorNames: string[];
  toggleColor: (name: string) => void;
  setSelectedColorNames: (names: string[]) => void;
  customColorName: string;
  setCustomColorName: (value: string) => void;
  customColorHex: string;
  setCustomColorHex: (value: string) => void;
  addCustomColor: () => void;
  logoPosition: string;
  setLogoPosition: (value: string) => void;
  modelMode: string;
  setModelMode: (value: string) => void;
  ageTarget: string;
  setAgeTarget: (value: string) => void;
  theme: string;
  setTheme: (value: string) => void;
  style: string;
  setStyle: (value: string) => void;
  extraText: string;
  setExtraText: (value: string) => void;
  frontDesignFile: File | null;
  backDesignFile: File | null;
  logoFile: File | null;
  templateFrontFile: File | null;
  templateBackFile: File | null;
  onFrontFile: (event: ChangeEvent<HTMLInputElement>) => void;
  onBackFile: (event: ChangeEvent<HTMLInputElement>) => void;
  onLogoFile: (event: ChangeEvent<HTMLInputElement>) => void;
  onTemplateFrontFile: (event: ChangeEvent<HTMLInputElement>) => void;
  onTemplateBackFile: (event: ChangeEvent<HTMLInputElement>) => void;
  designPositionX: number;
  setDesignPositionX: (value: number) => void;
  designPositionY: number;
  setDesignPositionY: (value: number) => void;
  designScale: number;
  setDesignScale: (value: number) => void;
  logoScale: number;
  setLogoScale: (value: number) => void;
  aiReferenceMode: string;
  setAiReferenceMode: (value: string) => void;
  aiModelReferenceFile: File | null;
  aiPoseReferenceFile: File | null;
  aiThumbnailReferenceFile: File | null;
  aiStyleReferenceFile: File | null;
  onAiModelReferenceFile: (event: ChangeEvent<HTMLInputElement>) => void;
  onAiPoseReferenceFile: (event: ChangeEvent<HTMLInputElement>) => void;
  onAiThumbnailReferenceFile: (event: ChangeEvent<HTMLInputElement>) => void;
  onAiStyleReferenceFile: (event: ChangeEvent<HTMLInputElement>) => void;
  useAiGeneration: boolean;
  setUseAiGeneration: (value: boolean) => void;
  openaiModel: string;
  setOpenaiModel: (value: string) => void;
  videoAiModel: string;
  setVideoAiModel: (value: string) => void;
  aiQuality: string;
  setAiQuality: (value: string) => void;
  thumbnailColorChoice: string;
  setThumbnailColorChoice: (value: string) => void;
  videoColorChoice: string;
  setVideoColorChoice: (value: string) => void;
  selectedColorOptions: string[];
  imageDefaultText: string;
  setImageDefaultText: (value: string) => void;
  imageDefaultTextPosition: string;
  setImageDefaultTextPosition: (value: string) => void;
  generateAssets: () => void | Promise<void>;
}) {
  return (
    <>
      <h2>Input Produk & Desain</h2>
      <p className="desc">
        1 warna = 1 mockup. Sebelum generate, sekarang kamu bisa pilih warna
        thumbnail, warna video, dan default text yang tampil di semua gambar.
      </p>

      <div className="section">
        <div className="row">
          <div className="field">
            <label>Nama Produk</label>
            <input value={props.productName} onChange={(e) => props.setProductName(e.target.value)} />
          </div>
          <div className="field">
            <label>Tipe Produk</label>
            <select value={props.productType} onChange={(e) => props.setProductType(e.target.value)}>
              {productTypes.map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>
        </div>

        <div className="field">
          <label>Mode Area Desain</label>
          <select value={props.designMode} onChange={(e) => props.setDesignMode(e.target.value)}>
            {designModes.map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>

        <div className="row">
          <FileUpload
            label="Upload Desain Depan"
            file={props.frontDesignFile}
            onChange={props.onFrontFile}
            hidden={props.designMode === "Belakang Saja"}
          />
          <FileUpload
            label="Upload Desain Belakang"
            file={props.backDesignFile}
            onChange={props.onBackFile}
            hidden={props.designMode === "Depan Saja"}
          />
        </div>

        <div className="section mini-section">
          <h2>Template Produk Kosong</h2>
          <p className="desc">
            Optional, tapi ini yang bikin hasil jauh lebih profesional. Upload template
            baju/topi/tas kosong tampak depan/belakang, nanti desain ditempel ke template itu.
          </p>
          <div className="row">
            <FileUpload
              label="Upload Template Depan"
              file={props.templateFrontFile}
              onChange={props.onTemplateFrontFile}
              hidden={props.designMode === "Belakang Saja"}
            />
            <FileUpload
              label="Upload Template Belakang"
              file={props.templateBackFile}
              onChange={props.onTemplateBackFile}
              hidden={props.designMode === "Depan Saja"}
            />
          </div>
          <div className="note-box">
            <strong>Saran:</strong>
            <span>
              Pakai template produk PNG/JPG resolusi besar, background bersih, produk menghadap lurus.
              Hasil terbaik tetap dari template yang memang sudah bagus.
            </span>
          </div>
        </div>
      </div>

      <div className="section">
        <h2>AI Reference Mode</h2>
        <p className="desc">
          Ini bagian utama untuk hasil seperti referensi. Upload referensi model anak, pose,
          layout thumbnail, dan style visual. Backend akan menyimpan bahan AI dan membuat
          ai_prompt.json untuk dikirim ke generator AI seperti ComfyUI/API.
        </p>

        <div className="field">
          <label>Mode AI</label>
          <select
            value={props.aiReferenceMode}
            onChange={(e) => props.setAiReferenceMode(e.target.value)}
          >
            <option>AI Reference + Product Mockup</option>
            <option>AI Model Wearing Product</option>
            <option>AI Thumbnail Listing Layout</option>
            <option>AI Full Listing Asset Pack</option>
          </select>
        </div>

        <div className="row">
          <FileUpload
            label="Upload Referensi Model Anak"
            file={props.aiModelReferenceFile}
            onChange={props.onAiModelReferenceFile}
          />
          <FileUpload
            label="Upload Referensi Pose / Angle"
            file={props.aiPoseReferenceFile}
            onChange={props.onAiPoseReferenceFile}
          />
        </div>

        <div className="row">
          <FileUpload
            label="Upload Referensi Thumbnail / Layout"
            file={props.aiThumbnailReferenceFile}
            onChange={props.onAiThumbnailReferenceFile}
          />
          <FileUpload
            label="Upload Referensi Style / Lighting"
            file={props.aiStyleReferenceFile}
            onChange={props.onAiStyleReferenceFile}
          />
        </div>

        <div className="note-box">
          <strong>Target hasil:</strong>
          <span>
            AI akan diarahkan membuat model anak memakai produk, varian warna konsisten,
            thumbnail listing clean, zoom desain, badge, size guide, dan style olshop-ready
            seperti referensi.
          </span>
        </div>
      </div>

      <div className="section">
        <h2>AI Engine</h2>
        <p className="desc">
          V18 online pakai Gemini untuk gambar dan Veo untuk video. Kalau GEMINI_API_KEY belum ada,
          backend otomatis fallback ke render lokal + video slideshow.
        </p>
        <div className="row">
          <div className="field">
            <label>Pakai AI Beneran</label>
            <select
              value={props.useAiGeneration ? "Ya" : "Tidak"}
              onChange={(e) => props.setUseAiGeneration(e.target.value === "Ya")}
            >
              <option>Ya</option>
              <option>Tidak</option>
            </select>
          </div>
          <div className="field">
            <label>Gemini Image Model</label>
            <input value={props.openaiModel} onChange={(e) => props.setOpenaiModel(e.target.value)} />
          </div>
        </div>
        <div className="row">
          <div className="field">
            <label>Gemini Video Model</label>
            <input value={props.videoAiModel} onChange={(e) => props.setVideoAiModel(e.target.value)} />
          </div>
          <div className="field">
            <label>Kualitas AI</label>
            <select value={props.aiQuality} onChange={(e) => props.setAiQuality(e.target.value)}>
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
            </select>
          </div>
        </div>
        <div className="note-box inline-note">
          <strong>Env wajib:</strong>
          <span>GEMINI_API_KEY di backend. Tanpa itu hasil AI asli tidak akan jalan.</span>
        </div>
      </div>

      <div className="section">
        <h2>Kontrol Posisi Desain & Logo</h2>
        <p className="desc">
          Ini untuk merapikan hasil. Kalau desain terlalu tinggi, geser Y. Kalau terlalu besar/kecil,
          atur ukuran desain. Nilai ini dikirim ke backend saat generate.
        </p>
        <div className="row">
          <RangeField
            label={`Posisi Desain X: ${props.designPositionX}%`}
            value={props.designPositionX}
            min={20}
            max={80}
            onChange={props.setDesignPositionX}
          />
          <RangeField
            label={`Posisi Desain Y: ${props.designPositionY}%`}
            value={props.designPositionY}
            min={25}
            max={80}
            onChange={props.setDesignPositionY}
          />
        </div>
        <div className="row">
          <RangeField
            label={`Ukuran Desain: ${props.designScale}%`}
            value={props.designScale}
            min={8}
            max={65}
            onChange={props.setDesignScale}
          />
          <RangeField
            label={`Ukuran Logo: ${props.logoScale}%`}
            value={props.logoScale}
            min={40}
            max={180}
            onChange={props.setLogoScale}
          />
        </div>
        <div className="note-box">
          <strong>Default aman:</strong>
          <span>
            X 50%, Y 50%, ukuran desain 28%. Kalau template punya area dada lebih tinggi,
            coba Y 43–48%. Kalau desain kebesaran, turunkan ukuran ke 18–24%.
          </span>
        </div>
      </div>

      <div className="section">
        <div className="pill">Multi Varian Warna</div>
        <h2>Varian Warna Produk</h2>
        <div className="color-grid">
          {props.colors.map((color) => (
            <button
              key={color.name}
              type="button"
              className={`color-option ${props.selectedColorNames.includes(color.name) ? "selected" : ""}`}
              onClick={() => props.toggleColor(color.name)}
            >
              <span className="dot" style={{ background: color.hex }} />
              <span>{color.name}</span>
              {color.custom && <em>Custom</em>}
            </button>
          ))}
        </div>

        <div className="actions compact">
          <button
            type="button"
            className="secondary"
            onClick={() => props.setSelectedColorNames(props.colors.map((color) => color.name))}
          >
            Pilih Semua
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => props.setSelectedColorNames([])}
          >
            Kosongkan
          </button>
        </div>

        <div className="row">
          <div className="field">
            <label>Tambah Warna Manual</label>
            <input
              value={props.customColorName}
              onChange={(e) => props.setCustomColorName(e.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  props.addCustomColor();
                }
              }}
              placeholder="Contoh: Mint, Salem, Dusty Pink"
            />
          </div>
          <div className="field">
            <label>Kode Warna</label>
            <input
              type="color"
              value={props.customColorHex}
              onChange={(e) => props.setCustomColorHex(e.target.value)}
            />
          </div>
        </div>
        <button type="button" className="secondary full" onClick={props.addCustomColor}>
          + Tambah Warna ke Varian
        </button>
      </div>

      <div className="section">
        <h2>Pilihan Warna Thumbnail & Video</h2>
        <p className="desc">
          Tentukan warna mana yang dipakai untuk thumbnail utama dan video utama
          sebelum generate.
        </p>
        <div className="row">
          <div className="field">
            <label>Thumbnail Mau Pakai Warna Apa?</label>
            <select
              value={props.thumbnailColorChoice}
              onChange={(e) => props.setThumbnailColorChoice(e.target.value)}
            >
              <option>Auto</option>
              {props.selectedColorOptions.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Video Mau Pakai Warna Apa?</label>
            <select
              value={props.videoColorChoice}
              onChange={(e) => props.setVideoColorChoice(e.target.value)}
            >
              <option>Auto</option>
              {props.selectedColorOptions.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="section">
        <h2>Default Text di Semua Gambar</h2>
        <p className="desc">
          Untuk teks promosi seperti FREE STIKER, FREE NAMA, atau teks default lain
          yang ingin muncul di setiap gambar.
        </p>
        <div className="row">
          <div className="field">
            <label>Isi Default Text</label>
            <input
              value={props.imageDefaultText}
              onChange={(e) => props.setImageDefaultText(e.target.value)}
              placeholder="Contoh: FREE STIKER / FREE NAMA"
            />
          </div>
          <div className="field">
            <label>Posisi Text</label>
            <select
              value={props.imageDefaultTextPosition}
              onChange={(e) => props.setImageDefaultTextPosition(e.target.value)}
            >
              <option>Atas</option>
              <option>Bawah</option>
              <option>Kiri</option>
              <option>Kanan</option>
            </select>
          </div>
        </div>
        <div className="note-box">
          <strong>Contoh penggunaan:</strong>
          <span>
            FREE STIKER, FREE NAMA, BISA COD, atau teks promosi lain. Posisi bisa
            di atas, bawah, kiri, atau kanan.
          </span>
        </div>
      </div>

      <div className="section">
        <h2>Logo, Model, Tema</h2>
        <div className="row">
          <FileUpload label="Upload Logo Toko" file={props.logoFile} onChange={props.onLogoFile} />
          <div className="field">
            <label>Posisi Logo</label>
            <select value={props.logoPosition} onChange={(e) => props.setLogoPosition(e.target.value)}>
              <option>Bawah Desain</option>
              <option>Label Produk</option>
              <option>Lengan</option>
              <option>Pojok Kanan Bawah</option>
              <option>Pojok Kiri Bawah</option>
              <option>Tidak Ditampilkan</option>
            </select>
          </div>
        </div>

        <div className="row">
          <div className="field">
            <label>Gunakan Model?</label>
            <select value={props.modelMode} onChange={(e) => props.setModelMode(e.target.value)}>
              <option>Tanpa Model</option>
              <option>Model Anak Laki-laki</option>
              <option>Model Anak Perempuan</option>
              <option>Model Bayi</option>
              <option>Upload Referensi Model</option>
            </select>
          </div>
          <div className="field">
            <label>Target Usia</label>
            <select value={props.ageTarget} onChange={(e) => props.setAgeTarget(e.target.value)}>
              <option>1-3 Tahun</option>
              <option>4-6 Tahun</option>
              <option>7-10 Tahun</option>
              <option>11-13 Tahun</option>
            </select>
          </div>
        </div>

        <div className="row">
          <div className="field">
            <label>Tema</label>
            <select value={props.theme} onChange={(e) => props.setTheme(e.target.value)}>
              <option>Lucu</option>
              <option>Edukasi</option>
              <option>Hewan</option>
              <option>Islami</option>
              <option>Kartun Original</option>
              <option>Minimalis</option>
              <option>Sporty</option>
              <option>Custom</option>
            </select>
          </div>
          <div className="field">
            <label>Style</label>
            <select value={props.style} onChange={(e) => props.setStyle(e.target.value)}>
              <option>Clean</option>
              <option>Playful</option>
              <option>Premium</option>
              <option>Simple</option>
              <option>Colorful</option>
              <option>Cute</option>
            </select>
          </div>
        </div>

        <div className="field">
          <label>Tambahan Teks Produk</label>
          <input value={props.extraText} onChange={(e) => props.setExtraText(e.target.value)} placeholder="Optional" />
        </div>
      </div>

      <div className="actions">
        <button type="button" className="secondary">Save Draft</button>
        <button type="button" className="primary" onClick={props.generateAssets}>
          Generate All Product Assets
        </button>
      </div>
    </>
  );
}


function RangeField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="field">
      <label>{label}</label>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

function FileUpload({
  label,
  file,
  onChange,
  hidden,
}: {
  label: string;
  file: File | null;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  hidden?: boolean;
}) {
  if (hidden) return null;

  return (
    <div className="field">
      <label>{label}</label>
      <label className={file ? "upload has-file" : "upload"}>
        <strong>{file ? file.name : "Klik untuk upload file"}</strong>
        <span>{file ? `${Math.round(file.size / 1024)} KB` : "PNG / JPG / SVG"}</span>
        <input type="file" accept=".png,.jpg,.jpeg,.svg" onChange={onChange} />
      </label>
    </div>
  );
}

function SimplePanel({ title, text }: { title: string; text: string }) {
  return (
    <>
      <h2>{title}</h2>
      <p className="desc">{text}</p>
      <div className="placeholder-panel">
        Fitur ini sudah bisa diklik dari sidebar. Isi detailnya masuk tahap lanjutan.
      </div>
    </>
  );
}

function VariantManager({
  colors,
  selectedColors,
  selectedColorNames,
  toggleColor,
}: {
  colors: ColorVariant[];
  selectedColors: ColorVariant[];
  selectedColorNames: string[];
  toggleColor: (name: string) => void;
}) {
  return (
    <>
      <h2>Variant Manager</h2>
      <p className="desc">Kelola warna yang aktif untuk generate aset.</p>
      <div className="color-grid">
        {colors.map((color) => (
          <button
            key={color.name}
            type="button"
            className={`color-option ${selectedColorNames.includes(color.name) ? "selected" : ""}`}
            onClick={() => toggleColor(color.name)}
          >
            <span className="dot" style={{ background: color.hex }} />
            <span>{color.name}</span>
          </button>
        ))}
      </div>
      <div className="panel">
        <b>Warna aktif:</b> {selectedColors.map((item) => item.name).join(", ") || "-"}
      </div>
    </>
  );
}

function VideoPanel({
  videoDuration,
  setVideoDuration,
  videoFormat,
  setVideoFormat,
  selectedColorOptions,
  videoColorChoice,
  setVideoColorChoice,
}: {
  videoDuration: string;
  setVideoDuration: (value: string) => void;
  videoFormat: string;
  setVideoFormat: (value: string) => void;
  selectedColorOptions: string[];
  videoColorChoice: string;
  setVideoColorChoice: (value: string) => void;
}) {
  return (
    <>
      <h2>Video Generator</h2>
      <p className="desc">Setting video produk minimal 10 detik dan pilih warna utama video.</p>
      <div className="row">
        <div className="field">
          <label>Durasi Video</label>
          <select value={videoDuration} onChange={(e) => setVideoDuration(e.target.value)}>
            <option>10 Detik</option>
            <option>15 Detik</option>
            <option>30 Detik</option>
          </select>
        </div>
        <div className="field">
          <label>Format Video</label>
          <select value={videoFormat} onChange={(e) => setVideoFormat(e.target.value)}>
            <option>9:16 Vertical</option>
            <option>1:1 Square</option>
            <option>4:5 Feed</option>
            <option>16:9 Landscape</option>
          </select>
        </div>
      </div>
      <div className="field">
        <label>Warna Utama untuk Video</label>
        <select value={videoColorChoice} onChange={(e) => setVideoColorChoice(e.target.value)}>
          <option>Auto</option>
          {selectedColorOptions.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </div>
      <div className="note-box">
        <strong>Storyboard:</strong>
        <span>0-2s produk utama, 2-4s zoom desain, 4-6s fitur utama, 6-8s warna pilihan, 8-10s logo toko.</span>
      </div>
    </>
  );
}

function ListingPanel({
  marketplace,
  setMarketplace,
  listingTone,
  setListingTone,
  keywords,
  setKeywords,
  advantages,
  setAdvantages,
  generatedTitle,
  generatedDescription,
  defaultText,
  defaultTextPosition,
  downloadListing,
}: {
  marketplace: string;
  setMarketplace: (value: string) => void;
  listingTone: string;
  setListingTone: (value: string) => void;
  keywords: string;
  setKeywords: (value: string) => void;
  advantages: string;
  setAdvantages: (value: string) => void;
  generatedTitle: string;
  generatedDescription: string;
  defaultText: string;
  defaultTextPosition: string;
  downloadListing: () => void;
}) {
  return (
    <>
      <h2>Listing Assistant</h2>
      <div className="row">
        <div className="field">
          <label>Target Marketplace</label>
          <select value={marketplace} onChange={(e) => setMarketplace(e.target.value)}>
            <option>Shopee</option>
            <option>Tokopedia</option>
            <option>TikTok Shop</option>
            <option>Instagram</option>
            <option>Semua Marketplace</option>
          </select>
        </div>
        <div className="field">
          <label>Gaya Bahasa</label>
          <select value={listingTone} onChange={(e) => setListingTone(e.target.value)}>
            <option>Jualan Santai</option>
            <option>SEO Marketplace</option>
            <option>Premium</option>
            <option>Singkat & Padat</option>
            <option>Ramah Orang Tua</option>
          </select>
        </div>
      </div>
      <div className="field">
        <label>Keyword Utama</label>
        <input value={keywords} onChange={(e) => setKeywords(e.target.value)} />
      </div>
      <div className="field">
        <label>Keunggulan Produk</label>
        <textarea value={advantages} onChange={(e) => setAdvantages(e.target.value)} />
      </div>
      <div className="panel">
        <p><b>Judul:</b><br />{generatedTitle}</p>
        <p><b>Deskripsi:</b><br />{generatedDescription}</p>
        <p><b>Default Text:</b><br />{defaultText || "-"} ({defaultTextPosition})</p>
      </div>
      <button type="button" className="primary full" onClick={downloadListing}>
        Download Listing TXT
      </button>
    </>
  );
}

function GalleryPanel({
  generatedFiles,
  previewUrls,
  backendStatus,
  zipDownloadUrl,
  downloadListing,
  downloadManifest,
}: {
  generatedFiles: GeneratedFile[];
  previewUrls: PreviewItem[];
  backendStatus: string;
  zipDownloadUrl: string;
  downloadListing: () => void;
  downloadManifest: () => void;
}) {
  return (
    <>
      <h2>Output Gallery</h2>
      <p className="desc">Setelah klik Generate, hasil AI atau fallback lokal akan muncul di sini.</p>
      <div className="panel"><b>Status Backend:</b> {backendStatus}</div>
      {zipDownloadUrl ? (
        <div className="actions compact">
          <a className="primary-link" href={zipDownloadUrl} target="_blank" rel="noreferrer">
            Download ZIP Export
          </a>
        </div>
      ) : null}
      {previewUrls.length > 0 ? (
        <div className="gallery-grid">
          {previewUrls.map((item) => {
            const isVideo = item.url.toLowerCase().endsWith(".mp4") || item.type.toLowerCase().includes("video");
            return (
              <a key={item.name} href={item.url} className="gallery-item" target="_blank" rel="noreferrer">
                {isVideo ? (
                  <video src={item.url} controls muted playsInline />
                ) : (
                  <img src={item.url} alt={item.name} />
                )}
                <strong>{item.type}</strong>
                <span>{item.name}</span>
              </a>
            );
          })}
        </div>
      ) : null}
      {generatedFiles.length === 0 ? (
        <div className="placeholder-panel">Belum ada output. Klik menu Generate Assets lalu klik tombol Generate.</div>
      ) : (
        <div className="file-list">
          {generatedFiles.map((file) => (
            <div className="file-row" key={file.name}>
              <span>{file.type}</span>
              <b>{file.name}</b>
              <em>{file.status}</em>
            </div>
          ))}
        </div>
      )}
      <div className="actions">
        <button type="button" className="secondary" onClick={downloadListing}>Download Listing</button>
        <button type="button" className="primary" onClick={downloadManifest}>Download Manifest</button>
      </div>
    </>
  );
}

function ExportPanel({
  generatedFiles,
  thumbnailColor,
  videoColor,
  defaultText,
  defaultTextPosition,
  zipDownloadUrl,
  downloadListing,
  downloadManifest,
}: {
  generatedFiles: GeneratedFile[];
  thumbnailColor: string;
  videoColor: string;
  defaultText: string;
  defaultTextPosition: string;
  zipDownloadUrl: string;
  downloadListing: () => void;
  downloadManifest: () => void;
}) {
  return (
    <>
      <h2>Export Olshop</h2>
      <p className="desc">
        Backend V18 bisa langsung jalan di Hugging Face Spaces dan panggil Gemini Images/Veo kalau GEMINI_API_KEY tersedia.
      </p>
      <div className="checks">
        <label><input type="checkbox" defaultChecked /> Mockup warna sesuai jumlah varian</label>
        <label><input type="checkbox" defaultChecked /> 1 Thumbnail Utama ({thumbnailColor})</label>
        <label><input type="checkbox" defaultChecked /> 1 Video MP4 minimal 10 detik ({videoColor})</label>
        <label><input type="checkbox" defaultChecked /> 1 Listing TXT</label>
        <label><input type="checkbox" defaultChecked /> Default Text: {defaultText || "-"} ({defaultTextPosition})</label>
      </div>
      <div className="panel">
        <b>Total output simulasi:</b> {generatedFiles.length} file
      </div>
      <div className="actions">
        <button type="button" className="secondary" onClick={downloadListing}>Download Listing TXT</button>
        <button type="button" className="primary" onClick={downloadManifest}>Download Manifest JSON</button>
      </div>
      {zipDownloadUrl ? (
        <div className="actions compact">
          <a className="primary-link" href={zipDownloadUrl} target="_blank" rel="noreferrer">
            Download ZIP Export
          </a>
        </div>
      ) : null}
    </>
  );
}

function OutputCard({ title, text, ready }: { title: string; text: string; ready: boolean }) {
  return (
    <div className={ready ? "output-card ready" : "output-card"}>
      <div className="mini-preview">{ready ? "Ready" : "Draft"}</div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}
