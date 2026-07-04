import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useCallback, useEffect } from "react";
import { Upload, Download, RotateCcw, Sun, Contrast, Droplet, Palette, Sparkles, RefreshCw, Music } from "lucide-react";

export const Route = createFileRoute("/_authenticated/studios/photo")({
  head: () => ({ meta: [{ title: "Photo Editor — Geenie AI Studio" }] }),
  component: PhotoEditor,
});

const filters = [
  { name: "Original", css: "" },
  { name: "B&W", css: "grayscale(1)" },
  { name: "Vintage", css: "sepia(0.5) contrast(1.1) brightness(1.05)" },
  { name: "Cool", css: "hue-rotate(15deg) saturate(1.2)" },
  { name: "Warm", css: "hue-rotate(-10deg) saturate(1.15) brightness(1.05)" },
  { name: "Dramatic", css: "contrast(1.4) brightness(0.9) saturate(1.1)" },
  { name: "Fade", css: "contrast(0.85) brightness(1.1) saturate(0.8)" },
  { name: "Vivid", css: "saturate(1.6) contrast(1.15)" },
];

const aspectRatios = [
  { label: "Free", value: null },
  { label: "1:1", value: 1 },
  { label: "4:5", value: 4 / 5 },
  { label: "9:16", value: 9 / 16 },
  { label: "16:9", value: 16 / 9 },
];

function PhotoEditor() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [blur, setBlur] = useState(0);
  const [activeFilter, setActiveFilter] = useState(filters[0]);
  const [rotation, setRotation] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const musicInputRef = useRef<HTMLInputElement>(null);
  const [musicFile, setMusicFile] = useState<string | null>(null);
  const [musicName, setMusicName] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImageSrc(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function handleMusicUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMusicFile(URL.createObjectURL(file));
    setMusicName(file.name);
  }

  function resetAll() {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setBlur(0);
    setActiveFilter(filters[0]);
    setRotation(0);
  }

  const filterStyle = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) blur(${blur}px) ${activeFilter.css}`;

  function downloadImage() {
    if (!imageSrc) return;
    const plan = localStorage.getItem("geenie_plan") || "starter";
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const isRotated90 = rotation % 180 !== 0;
      canvas.width = isRotated90 ? img.height : img.width;
      canvas.height = isRotated90 ? img.width : img.height;

      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.filter = filterStyle;
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();

      // Add watermark for free users
      if (plan === "starter") {
        ctx.font = "bold 18px Inter, sans-serif";
        ctx.fillStyle = "rgba(255,255,255,0.75)";
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.shadowBlur = 4;
        ctx.fillText("Made with Geenie AI", 16, canvas.height - 16);
      }

      const link = document.createElement("a");
      link.download = "geenie-edited-photo.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = imageSrc;
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto w-full">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "var(--gradient-brand)" }}>
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Photo Editor</h1>
          <p className="text-sm text-muted-foreground">Adjust, filter, and perfect your photos instantly</p>
        </div>
      </div>

      {!imageSrc ? (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-surface/50 py-20 transition hover:border-purple-500/50 hover:bg-surface"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full" style={{ background: "var(--gradient-brand)" }}>
            <Upload className="h-6 w-6 text-white" />
          </div>
          <p className="text-sm font-medium">Click to upload a photo</p>
          <p className="text-xs text-muted-foreground">JPG, PNG, WEBP supported</p>
        </button>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5">
          {/* Preview */}
          <div className="flex flex-col gap-3">
            <div className="relative overflow-hidden rounded-2xl bg-black/40 flex items-center justify-center" style={{ minHeight: "400px" }}>
              <img
                src={imageSrc}
                alt="Editing preview"
                style={{ filter: filterStyle, transform: `rotate(${rotation}deg)`, maxHeight: "500px" }}
                className="max-w-full object-contain transition-all duration-150"
              />
            </div>
            <div className="flex gap-2">
              {/* Music */}
            <div className="rounded-xl bg-surface border border-border p-3 flex items-center gap-3 flex-wrap">
              <Music className="h-4 w-4 text-purple-400 flex-shrink-0" />
              <button onClick={() => musicInputRef.current?.click()} className="text-xs font-medium text-muted-foreground hover:text-foreground transition">
                {musicName || "Add Music (MP3)"}
              </button>
              {musicFile && <audio src={musicFile} controls className="h-7 flex-1 min-w-0" />}
              {musicFile && <button onClick={() => {setMusicFile(null); setMusicName('');}} className="text-xs text-red-400">✕</button>}
            </div>
            <button onClick={() => fileInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-surface border border-border px-4 py-2.5 text-sm font-medium hover:bg-surface-elevated transition">
                <RefreshCw className="h-4 w-4" /> New Photo
              </button>
              <button onClick={() => setRotation((r) => (r + 90) % 360)} className="flex items-center justify-center gap-2 rounded-xl bg-surface border border-border px-4 py-2.5 text-sm font-medium hover:bg-surface-elevated transition">
                <RotateCcw className="h-4 w-4" /> Rotate
              </button>
              <button onClick={downloadImage} className="flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition" style={{ background: "var(--gradient-brand)" }}>
                <Download className="h-4 w-4" /> Download
              </button>
            </div>
          </div>

          {/* Controls */}
          <div className="glass rounded-2xl p-4 flex flex-col gap-5">
            {/* Filters */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Filters</p>
              <div className="grid grid-cols-4 gap-2">
                {filters.map((f) => (
                  <button
                    key={f.name}
                    onClick={() => setActiveFilter(f)}
                    className={`flex flex-col items-center gap-1 rounded-lg p-1.5 transition ${
                      activeFilter.name === f.name ? "ring-2 ring-purple-500" : ""
                    }`}
                  >
                    <div className="h-10 w-10 rounded-md overflow-hidden bg-surface">
                      {imageSrc && <img src={imageSrc} className="h-full w-full object-cover" style={{ filter: f.css }} alt={f.name} />}
                    </div>
                    <span className="text-[10px] text-muted-foreground">{f.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sliders */}
            <div className="flex flex-col gap-3">
              <SliderControl icon={Sun} label="Brightness" value={brightness} onChange={setBrightness} min={50} max={150} />
              <SliderControl icon={Contrast} label="Contrast" value={contrast} onChange={setContrast} min={50} max={150} />
              <SliderControl icon={Droplet} label="Saturation" value={saturation} onChange={setSaturation} min={0} max={200} />
              <SliderControl icon={Palette} label="Blur" value={blur} onChange={setBlur} min={0} max={10} suffix="px" />
            </div>

            <button onClick={resetAll} className="flex items-center justify-center gap-2 rounded-xl bg-surface border border-border px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-surface-elevated transition">
              <RotateCcw className="h-3.5 w-3.5" /> Reset All
            </button>
          </div>
        </div>
      )}

      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
      <canvas ref={canvasRef} className="hidden" />
      <input ref={musicInputRef} type="file" accept="audio/*" onChange={handleMusicUpload} className="hidden" />
    </div>
  );
}

function SliderControl({
  icon: Icon, label, value, onChange, min, max, suffix = "%"
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  suffix?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Icon className="h-3.5 w-3.5" /> {label}
        </span>
        <span className="text-xs text-muted-foreground">{value}{suffix}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-purple-500"
      />
    </div>
  );
}
