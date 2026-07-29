import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { Upload, Download, RotateCcw, Sun, Contrast, Droplet, Palette, Sparkles, RefreshCw, Zap, Image as ImageIcon, FlipHorizontal, Type, Film, Wand2, X, Bookmark } from "lucide-react";

export const Route = createFileRoute("/_authenticated/studios/photo")({
  head: () => ({ meta: [{ title: "Photo Editor — Geenie AI Studio" }] }),
  component: PhotoEditor,
});

// Standard filters + 2026's dominant "cinematic color grade" presets
// (teal & orange blockbuster look, moody midnight grade, golden-hour glow,
// faded VHS/disposable-camera look) — these are the specific looks young
// creators are leaning into this year per current trend research.
const filters = [
  { name: "Original", css: "" },
  { name: "B&W", css: "grayscale(1)" },
  { name: "Vintage", css: "sepia(0.5) contrast(1.1) brightness(1.05)" },
  { name: "Cool", css: "hue-rotate(15deg) saturate(1.2)" },
  { name: "Warm", css: "hue-rotate(-10deg) saturate(1.15) brightness(1.05)" },
  { name: "Dramatic", css: "contrast(1.4) brightness(0.9) saturate(1.1)" },
  { name: "Fade", css: "contrast(0.85) brightness(1.1) saturate(0.8)" },
  { name: "Vivid", css: "saturate(1.6) contrast(1.15)" },
  { name: "Matte", css: "contrast(0.9) brightness(1.1) saturate(0.7) sepia(0.1)" },
  { name: "Chrome", css: "contrast(1.2) brightness(1.1) saturate(0.8) hue-rotate(5deg)" },
  { name: "Neon", css: "saturate(2) contrast(1.3) brightness(0.9) hue-rotate(30deg)" },
  { name: "Lomo", css: "contrast(1.3) saturate(1.4) sepia(0.2) brightness(0.9)" },
  { name: "Teal & Orange", css: "contrast(1.2) saturate(1.35) hue-rotate(-6deg) brightness(1.02)", trending: true },
  { name: "Midnight", css: "contrast(1.3) brightness(0.82) saturate(0.75) hue-rotate(190deg)", trending: true },
  { name: "Golden Hour", css: "brightness(1.12) saturate(1.25) sepia(0.18) hue-rotate(-8deg)", trending: true },
  { name: "VHS Retro", css: "contrast(0.85) saturate(0.85) brightness(1.05) sepia(0.15) hue-rotate(340deg)", trending: true },
];

const bgs = [
  { name: "None", value: "" },
  { name: "White", value: "#ffffff" },
  { name: "Black", value: "#000000" },
  { name: "Gray", value: "#e8e8e8" },
  { name: "Sky", value: "linear-gradient(180deg,#87CEEB,#fff)" },
  { name: "Sunset", value: "linear-gradient(135deg,#ff6b35,#f7277e)" },
  { name: "Forest", value: "linear-gradient(180deg,#2d6a4f,#40916c)" },
  { name: "Navy", value: "linear-gradient(135deg,#0f0c29,#302b63)" },
];

const LIGHT_LEAK_POS: Record<string, { x: string; y: string }> = {
  "top-left": { x: "15%", y: "15%" },
  "top-right": { x: "85%", y: "15%" },
  "bottom-left": { x: "15%", y: "85%" },
  "bottom-right": { x: "85%", y: "85%" },
};
type LeakCorner = keyof typeof LIGHT_LEAK_POS;

/** A single draggable sticker placed on the photo — emoji-based so no new
 *  image assets need to be loaded, works instantly, and renders identically
 *  in the CSS preview and the canvas export via the same font. */
interface StickerItem {
  id: string;
  emoji: string;
  x: number; // percentage, 0-100
  y: number; // percentage, 0-100
}

const STICKER_EMOJIS = ["🔥", "✨", "❤️", "⭐", "🎉", "👑", "💯", "😂", "😍", "🥳", "👀", "💀", "🌟", "🚀", "🌈", "☀️"];

/** A saved combination of filter + cinematic settings, stored in
 *  localStorage so users can reapply a full "look" in one click instead of
 *  re-toggling everything each time. */
interface Preset {
  name: string;
  filterName: string;
  brightness: number;
  contrast: number;
  saturation: number;
  warmth: number;
  vignette: boolean;
  cinematicBars: boolean;
  filmGrain: boolean;
  grainIntensity: number;
  lightLeak: boolean;
  leakCorner: LeakCorner;
  chromaticAb: boolean;
  chromaticAmount: number;
}

// Enhance previously duplicated Edit's brightness/contrast/saturation
// sliders in a second tab with only a few unique controls (blur, warmth,
// vignette, flip) — confusing redundancy for no real benefit. Those unique
// controls now live in the Edit tab itself; Enhance is removed.
const TABS = ["Edit", "Cinematic", "Ask AI", "AI Generate", "Background"] as const;
type Tab = typeof TABS[number];

const PROMPTS = ["Make it brighter and vivid","Cinematic dramatic look","Vintage warm film","Black and white high contrast","Soft dreamy pastel","Cool blue tone","Professional clean look","Make skin tones warmer","HDR effect","Moody dark contrast"];
const AI_PRESETS = ["Professional LinkedIn headshot","Product photo on white background","YouTube thumbnail dramatic","Instagram aesthetic café","Wedding portrait soft light","Real estate interior bright"];

/** Generates a fully opaque grayscale noise canvas — used both as a live CSS
 *  preview texture (via toDataURL) and re-generated fresh at export time so
 *  film grain in the downloaded image looks organic rather than tiled. */
function makeNoiseCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d")!;
  const imgData = ctx.createImageData(w, h);
  const buf = imgData.data;
  for (let i = 0; i < buf.length; i += 4) {
    const v = Math.random() * 255;
    buf[i] = v; buf[i + 1] = v; buf[i + 2] = v; buf[i + 3] = 255;
  }
  ctx.putImageData(imgData, 0, 0);
  return c;
}

/** True per-pixel RGB channel split — shifts the red channel one way and the
 *  blue channel the other, leaving green centered. This is the real
 *  chromatic-aberration / "glitch" look, baked directly into the canvas
 *  pixels so it survives into the downloaded file (unlike a CSS-only
 *  approximation, which only affects the on-screen preview). */
function applyChromaticAberration(ctx: CanvasRenderingContext2D, w: number, h: number, amount: number) {
  if (amount <= 0) return;
  const src = ctx.getImageData(0, 0, w, h).data;
  const out = new Uint8ClampedArray(src.length);
  for (let y = 0; y < h; y++) {
    const row = y * w;
    for (let x = 0; x < w; x++) {
      const idx = (row + x) * 4;
      const rx = Math.min(w - 1, x + amount);
      const bx = Math.max(0, x - amount);
      const rIdx = (row + rx) * 4;
      const bIdx = (row + bx) * 4;
      out[idx] = src[rIdx];
      out[idx + 1] = src[idx + 1];
      out[idx + 2] = src[bIdx + 2];
      out[idx + 3] = src[idx + 3];
    }
  }
  ctx.putImageData(new ImageData(out, w, h), 0, 0);
}

function drawVignette(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const grad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.32, w / 2, h / 2, Math.max(w, h) * 0.72);
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(1, "rgba(0,0,0,0.55)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

function drawLightLeak(ctx: CanvasRenderingContext2D, w: number, h: number, corner: LeakCorner) {
  const pos = LIGHT_LEAK_POS[corner] ?? LIGHT_LEAK_POS["bottom-right"];
  const cx = (parseFloat(pos.x) / 100) * w;
  const cy = (parseFloat(pos.y) / 100) * h;
  const r = Math.max(w, h) * 0.55;
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  grad.addColorStop(0, "rgba(255,175,90,0.55)");
  grad.addColorStop(0.4, "rgba(255,105,140,0.28)");
  grad.addColorStop(1, "rgba(255,105,140,0)");
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function drawFilmGrain(ctx: CanvasRenderingContext2D, w: number, h: number, intensity: number) {
  if (intensity <= 0) return;
  const noise = makeNoiseCanvas(w, h);
  ctx.save();
  ctx.globalAlpha = (intensity / 100) * 0.5;
  ctx.globalCompositeOperation = "overlay";
  ctx.drawImage(noise, 0, 0, w, h);
  ctx.restore();
}

function drawCinematicBars(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const barHeight = h * 0.09;
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, w, barHeight);
  ctx.fillRect(0, h - barHeight, w, barHeight);
}

/**
 * Dual-Tone (Gradient Map) — maps each pixel's luminance to a colour
 * between `shadowColor` (dark end) and `highlightColor` (light end).
 * This is the technique behind the split-tone cinematic look seen
 * everywhere on film photography accounts. Pure per-pixel canvas math,
 * zero API, zero cost. The `intensity` param blends with the original
 * so users can dial between "subtle mood" and "full poster look".
 */
function applyDualTone(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  shadowHex: string,
  highlightHex: string,
  intensity: number, // 0-100
) {
  if (intensity <= 0) return;
  if (w <= 0 || h <= 0) return;
  const parseHex = (hex: string): [number, number, number] => {
    const cleaned = hex.replace("#", "");
    // Expand 3-digit hex to 6-digit
    const full = cleaned.length === 3
      ? cleaned.split("").map((c) => c + c).join("")
      : cleaned;
    const n = parseInt(full, 16);
    if (isNaN(n)) return [0, 0, 0];
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const [sr, sg, sb] = parseHex(shadowHex);
  const [hr, hg, hb] = parseHex(highlightHex);
  try {
    const data = ctx.getImageData(0, 0, w, h);
    const buf = data.data;
    const mix = intensity / 100;
    for (let i = 0; i < buf.length; i += 4) {
      const lum = 0.299 * buf[i] + 0.587 * buf[i + 1] + 0.114 * buf[i + 2];
      const t = lum / 255;
      buf[i]     = Math.round(buf[i]     * (1 - mix) + (sr + (hr - sr) * t) * mix);
      buf[i + 1] = Math.round(buf[i + 1] * (1 - mix) + (sg + (hg - sg) * t) * mix);
      buf[i + 2] = Math.round(buf[i + 2] * (1 - mix) + (sb + (hb - sb) * t) * mix);
    }
    ctx.putImageData(data, 0, 0);
  } catch {
    // getImageData fails on tainted canvas (cross-origin without CORS) —
    // fail silently rather than crashing the whole download flow
  }
}

/** Converts one of the simple two-color linear-gradient() strings used in
 *  `bgs` into a real canvas gradient. Falls back to a flat color if the
 *  string doesn't match (never crashes the export over a cosmetic detail). */
function parseGradientForCanvas(ctx: CanvasRenderingContext2D, css: string, w: number, h: number): string | CanvasGradient {
  try {
    const match = css.match(/linear-gradient\(([\d.]+)deg,\s*(#[0-9a-fA-F]{3,6}),\s*(#[0-9a-fA-F]{3,6})\)/);
    if (!match) return "#f5f5f7";
    const [, , c1, c2] = match;
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, c1);
    grad.addColorStop(1, c2);
    return grad;
  } catch {
    return "#f5f5f7";
  }
}

/** Shared live-preview overlay stack — vignette, cinematic bars, film grain,
 *  and light leak rendered as lightweight CSS layers so the preview matches
 *  what download() bakes into the real file. Defined as a top-level
 *  component (not nested inside PhotoEditor) so React can diff and update
 *  it normally across re-renders instead of remounting it every time any
 *  slider or text field changes. */
function CinematicOverlayLayer({ vignette, lightLeak, leakCorner, filmGrain, noiseTileUrl, grainIntensity, cinematicBars, dualToneOn, dualShadow, dualHighlight, dualIntensity }: {
  vignette: boolean;
  lightLeak: boolean;
  leakCorner: LeakCorner;
  filmGrain: boolean;
  noiseTileUrl: string | null;
  grainIntensity: number;
  cinematicBars: boolean;
  dualToneOn: boolean;
  dualShadow: string;
  dualHighlight: string;
  dualIntensity: number;
}) {
  return (
    <>
      {dualToneOn && (
        <div className="absolute inset-0 pointer-events-none" style={{
          background: `linear-gradient(to bottom, ${dualHighlight}, ${dualShadow})`,
          opacity: (dualIntensity / 100) * 0.55,
          mixBlendMode: "color",
        }} />
      )}
      {vignette && <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: "inset 0 0 80px rgba(0,0,0,0.6)" }} />}
      {lightLeak && (
        <div className="absolute inset-0 pointer-events-none" style={{
          background: `radial-gradient(circle at ${LIGHT_LEAK_POS[leakCorner].x} ${LIGHT_LEAK_POS[leakCorner].y}, rgba(255,175,90,0.55), rgba(255,105,140,0.22) 40%, transparent 70%)`,
          mixBlendMode: "screen",
        }} />
      )}
      {filmGrain && noiseTileUrl && (
        <div className="absolute inset-0 pointer-events-none rounded-[inherit]" style={{
          backgroundImage: `url(${noiseTileUrl})`, backgroundSize: "180px 180px", backgroundRepeat: "repeat",
          opacity: (grainIntensity / 100) * 0.5, mixBlendMode: "overlay",
        }} />
      )}
      {cinematicBars && (
        <>
          <div className="absolute top-0 left-0 right-0 bg-black pointer-events-none" style={{ height: "9%" }} />
          <div className="absolute bottom-0 left-0 right-0 bg-black pointer-events-none" style={{ height: "9%" }} />
        </>
      )}
    </>
  );
}

function PhotoEditor() {
  const navigate = useNavigate();
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [blur, setBlur] = useState(0);
  const [warmth, setWarmth] = useState(0);
  const [vignette, setVignette] = useState(false);
  const [flipH, setFlipH] = useState(false);
  const [activeFilter, setActiveFilter] = useState(filters[0]);
  const [rotation, setRotation] = useState(0);
  const [tab, setTab] = useState<Tab>("Edit");
  const [bg, setBg] = useState(bgs[0]);
  const [aiBgPrompt, setAiBgPrompt] = useState("");
  const [aiBgLoading, setAiBgLoading] = useState(false);
  const [aiBgUrl, setAiBgUrl] = useState<string | null>(null);
  const [aiBgError, setAiBgError] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [aiError, setAiError] = useState(false);
  const [smartPrompt, setSmartPrompt] = useState("");
  const [smartLoading, setSmartLoading] = useState(false);
  const [smartMsg, setSmartMsg] = useState("");
  const [textOverlay, setTextOverlay] = useState("");
  const [textColor, setTextColor] = useState("#ffffff");
  const [textSize, setTextSize] = useState(32);
  const [textX, setTextX] = useState(50);
  const [textY, setTextY] = useState(85);
  const [textBg, setTextBg] = useState(false);
  const [stickers, setStickers] = useState<StickerItem[]>([]);
  // Which overlay (text, or a sticker by id) is currently being dragged —
  // null when nothing is being dragged. Shared by the one generic pointer
  // handler below so text and every sticker all drag the same way.
  const [draggingId, setDraggingId] = useState<string | "text" | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  // Cinematic effects — trending "movie-look" toggles (see makeNoiseCanvas /
  // applyChromaticAberration / drawLightLeak / drawCinematicBars above for
  // how each one is actually baked into the exported file, not just shown
  // in preview).
  const [cinematicBars, setCinematicBars] = useState(false);
  const [filmGrain, setFilmGrain] = useState(false);
  const [grainIntensity, setGrainIntensity] = useState(40);
  const [lightLeak, setLightLeak] = useState(false);
  const [leakCorner, setLeakCorner] = useState<LeakCorner>("bottom-right");
  const [chromaticAb, setChromaticAb] = useState(false);
  const [chromaticAmount, setChromaticAmount] = useState(4);
  const [compareMode, setCompareMode] = useState(false);
  const [comparePos, setComparePos] = useState(50);
  // Dual-Tone (Gradient Map) — shadow/highlight colour split
  const [dualToneOn, setDualToneOn] = useState(false);
  const [dualShadow, setDualShadow] = useState("#1a0533");   // deep purple shadow default
  const [dualHighlight, setDualHighlight] = useState("#ff9a5c"); // warm orange highlight default
  const [dualIntensity, setDualIntensity] = useState(60);
  // Quick dual-tone presets — named looks that resonate with creators
  const DUAL_PRESETS = [
    { name: "Cyberpunk", shadow: "#0d0221", highlight: "#00f5ff" },
    { name: "Golden Film", shadow: "#1a0a00", highlight: "#ffd700" },
    { name: "Rose Quartz", shadow: "#2d0a1e", highlight: "#ffb7c5" },
    { name: "Teal & Orange", shadow: "#003333", highlight: "#ff6b35" },
    { name: "Arctic", shadow: "#001233", highlight: "#90e0ef" },
    { name: "Moody", shadow: "#0a0a0a", highlight: "#8b7355" },
  ];
  const [presets, setPresets] = useState<Preset[]>([]);
  const [presetNameInput, setPresetNameInput] = useState("");
  const [plan, setPlan] = useState("starter");
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [noiseTileUrl, setNoiseTileUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const aiRequestIdRef = useRef(0);
  const aiBgRequestIdRef = useRef(0);

  useEffect(() => { setPlan(typeof window !== "undefined" ? (localStorage.getItem("geenie_plan") || "starter") : "starter"); }, []);
  // Generate a small reusable noise tile once, client-side only, for the
  // live grain preview (the actual download regenerates full-resolution
  // grain fresh — see drawFilmGrain).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const tile = makeNoiseCanvas(180, 180);
    setNoiseTileUrl(tile.toDataURL());
  }, []);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = JSON.parse(localStorage.getItem("geenie_photo_presets") || "[]");
      if (Array.isArray(saved)) setPresets(saved);
    } catch { /* corrupted or missing — start with an empty preset list */ }
  }, []);

  function savePreset() {
    const name = presetNameInput.trim();
    if (!name || typeof window === "undefined") return;
    const preset: Preset = {
      name, filterName: activeFilter.name, brightness, contrast, saturation, warmth,
      vignette, cinematicBars, filmGrain, grainIntensity, lightLeak, leakCorner, chromaticAb, chromaticAmount,
    };
    // Overwrite any existing preset with the same name rather than duplicate.
    const updated = [...presets.filter(p => p.name !== name), preset];
    setPresets(updated);
    localStorage.setItem("geenie_photo_presets", JSON.stringify(updated));
    setPresetNameInput("");
  }

  function applyPreset(p: Preset) {
    const f = filters.find(x => x.name === p.filterName) ?? filters[0];
    setActiveFilter(f);
    setBrightness(p.brightness); setContrast(p.contrast); setSaturation(p.saturation); setWarmth(p.warmth);
    setVignette(p.vignette); setCinematicBars(p.cinematicBars); setFilmGrain(p.filmGrain); setGrainIntensity(p.grainIntensity);
    setLightLeak(p.lightLeak); setLeakCorner(p.leakCorner); setChromaticAb(p.chromaticAb); setChromaticAmount(p.chromaticAmount);
  }

  function deletePreset(name: string) {
    if (typeof window === "undefined") return;
    const updated = presets.filter(p => p.name !== name);
    setPresets(updated);
    localStorage.setItem("geenie_photo_presets", JSON.stringify(updated));
  }

  const isPaid = plan === "creator" || plan === "studio";
  const warmthFilter = warmth !== 0 ? `hue-rotate(${warmth < 0 ? warmth : 0}deg) sepia(${warmth > 0 ? (warmth / 100) * 0.4 : 0})` : "";
  const filterStyle = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) blur(${blur}px) ${activeFilter.css} ${warmthFilter}`;
  const transformStyle = `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1})`;
  const hasCinematicFx = cinematicBars || filmGrain || lightLeak || chromaticAb || dualToneOn;

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImageSrc(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function reset() {
    setBrightness(100); setContrast(100); setSaturation(100);
    setBlur(0); setWarmth(0);
    setVignette(false); setFlipH(false);
    setActiveFilter(filters[0]); setRotation(0); setTextOverlay(""); setStickers([]);
    setCinematicBars(false); setFilmGrain(false); setLightLeak(false); setChromaticAb(false);
    setDualToneOn(false); setDualIntensity(60);
  }

  function addSticker(emoji: string) {
    setStickers((s) => [...s, { id: Math.random().toString(36).slice(2), emoji, x: 50, y: 50 }]);
  }

  function removeSticker(id: string) {
    setStickers((s) => s.filter((st) => st.id !== id));
  }

  /**
   * One generic pointer-drag implementation shared by the text overlay and
   * every sticker — whichever overlay is grabbed becomes `draggingId`, and
   * pointer movement is translated into a percentage position relative to
   * the preview container so it works identically at any preview size and
   * for touch or mouse alike.
   */
  function handleOverlayPointerDown(id: string | "text") {
    return (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDraggingId(id);
    };
  }

  function handlePreviewPointerMove(e: React.PointerEvent) {
    if (!draggingId || !previewRef.current) return;
    const rect = previewRef.current.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * 100;
    const py = ((e.clientY - rect.top) / rect.height) * 100;
    const x = Math.min(96, Math.max(4, px));
    const y = Math.min(96, Math.max(4, py));
    if (draggingId === "text") {
      setTextX(x); setTextY(y);
    } else {
      setStickers((s) => s.map((st) => (st.id === draggingId ? { ...st, x, y } : st)));
    }
  }

  function handlePreviewPointerUp() {
    setDraggingId(null);
  }

  async function generateAI() {
    if (!aiPrompt.trim()) return;
    const myId = ++aiRequestIdRef.current;
    setAiLoading(true); setAiResult(null); setAiError(false);
    const seed = Math.floor(Math.random() * 999999);
    const prompt = encodeURIComponent(aiPrompt + ", high quality, 4k, detailed");
    const url = `https://image.pollinations.ai/prompt/${prompt}?width=1024&height=1024&seed=${seed}&nologo=true`;
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (aiRequestIdRef.current !== myId) return;
      setAiResult(url); setAiLoading(false);
    };
    img.onerror = () => {
      if (aiRequestIdRef.current !== myId) return;
      const url2 = `https://image.pollinations.ai/prompt/${prompt}?width=512&height=512&seed=${seed + 1}&nologo=true`;
      const img2 = new window.Image();
      img2.onload = () => {
        if (aiRequestIdRef.current !== myId) return;
        setAiResult(url2); setAiLoading(false);
      };
      img2.onerror = () => {
        if (aiRequestIdRef.current !== myId) return;
        setAiLoading(false); setAiError(true);
      };
      img2.src = url2;
    };
    img.src = url;
    setTimeout(() => {
      if (aiRequestIdRef.current !== myId) return;
      setAiLoading(false); setAiError(true);
    }, 30000);
  }

  function generateAIBg() {
    if (!aiBgPrompt.trim()) return;
    const myId = ++aiBgRequestIdRef.current;
    setAiBgLoading(true); setAiBgUrl(null); setAiBgError(null);
    const seed = Math.floor(Math.random() * 99999);
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(aiBgPrompt + ", background scenery, wide angle, no people, high quality")}?width=1024&height=1024&seed=${seed}&nologo=true`;
    const img = new window.Image();
    img.onload = () => {
      if (aiBgRequestIdRef.current !== myId) return;
      setAiBgUrl(url); setAiBgLoading(false);
    };
    img.onerror = () => {
      if (aiBgRequestIdRef.current !== myId) return;
      setAiBgLoading(false);
      setAiBgError("Background generation failed. Please try again.");
    };
    img.src = url;
    setTimeout(() => {
      if (aiBgRequestIdRef.current !== myId) return;
      setAiBgLoading(false);
      setAiBgError("This is taking longer than expected. Please try again.");
    }, 25000);
  }

  async function applySmartEdit() {
    if (!smartPrompt.trim() || !imageSrc) return;
    setSmartLoading(true); setSmartMsg("");
    // Every other network call in this app times out after 25-30s so a
    // slow or dropped connection can never leave a button stuck disabled
    // forever. This fetch previously had no such guard — a hung request
    // on a weak connection would leave "Applying..." showing indefinitely
    // with no way to recover short of reloading the page.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          model: "claude-sonnet-4-6", max_tokens: 200,
          messages: [{ role: "user", content: `Convert this photo editing instruction to CSS filter values. Instruction: "${smartPrompt}". Current: brightness=${brightness}, contrast=${contrast}, saturation=${saturation}. Respond ONLY with JSON (no markdown): {"brightness":110,"contrast":120,"saturation":100,"blur":0,"filter":"","message":"Applied warm look"}` }]
        })
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = await res.json();
      const parsed = JSON.parse(data.content?.[0]?.text?.trim() ?? "{}");
      if (parsed.brightness) setBrightness(parsed.brightness);
      if (parsed.contrast) setContrast(parsed.contrast);
      if (parsed.saturation !== undefined) setSaturation(parsed.saturation);
      if (parsed.blur !== undefined) setBlur(parsed.blur);
      if (parsed.filter !== undefined) setActiveFilter({ name: "Smart", css: parsed.filter });
      setSmartMsg(parsed.message || "Edit applied!");
      setSmartPrompt("");
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        setSmartMsg("Connection is slow — request timed out. Please try again.");
      } else {
        setSmartMsg("Try: 'make it brighter' or 'add vintage look'");
      }
    } finally {
      clearTimeout(timeoutId);
      setSmartLoading(false);
    }
  }

  /**
   * Renders the final image to canvas and downloads it. This is the single
   * source of truth for what gets exported — every toggle below (vignette,
   * cinematic bars, grain, light leak, chromatic aberration, text overlay)
   * is baked directly into the canvas pixels here, in the same order the
   * live preview approximates, so what you see is what you actually get.
   */
  /**
   * Renders the final image to canvas and downloads it. This is the single
   * source of truth for what gets exported — every toggle below (vignette,
   * cinematic bars, grain, light leak, chromatic aberration, text overlay,
   * and — critically — the Background tab's chosen backdrop) is baked
   * directly into the canvas pixels here, in the same order the live
   * preview approximates, so what you see is what you actually get.
   *
   * The Background tab previously only showed its backdrop in the CSS
   * preview and never actually drew it into the exported file at all —
   * every download from that tab silently came out as just the plain
   * photo with no background whatsoever. Fixed below.
   */
  async function download() {
    const src = tab === "AI Generate" ? aiResult : imageSrc;
    if (!src) return;
    setDownloadError(null);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new window.Image();
        el.crossOrigin = "anonymous";
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error("Failed to load image"));
        el.src = src;
      });

      const canvas = canvasRef.current;
      if (!canvas) throw new Error("Canvas not available");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context unavailable");
      const isAI = tab === "AI Generate";
      const isBgTab = tab === "Background";

      if (isBgTab) {
        // Canvas matches the photo's own resolution — background gets
        // cover-scaled to fill it regardless.
        canvas.width = img.width;
        canvas.height = img.height;

        // 1. Paint the chosen backdrop across the whole canvas first.
        if (aiBgUrl) {
          try {
            const bgImg = await new Promise<HTMLImageElement>((resolve, reject) => {
              const el = new window.Image();
              el.crossOrigin = "anonymous";
              el.onload = () => resolve(el);
              el.onerror = () => reject(new Error("bg load failed"));
              el.src = aiBgUrl;
            });
            const scale = Math.max(canvas.width / bgImg.width, canvas.height / bgImg.height);
            const dw = bgImg.width * scale, dh = bgImg.height * scale;
            ctx.drawImage(bgImg, (canvas.width - dw) / 2, (canvas.height - dh) / 2, dw, dh);
          } catch {
            ctx.fillStyle = "#f5f5f7";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
        } else if (bg.value) {
          ctx.fillStyle = bg.value.startsWith("linear-gradient")
            ? parseGradientForCanvas(ctx, bg.value, canvas.width, canvas.height)
            : bg.value;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else {
          ctx.fillStyle = "#f5f5f7";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // 2. Inset the photo with consistent padding + a soft shadow, so it
        // always reads as an intentionally "placed" photo on a backdrop
        // regardless of the original photo's own aspect ratio — instead of
        // an unpredictable letterbox gap that varies photo to photo.
        const pad = canvas.width * 0.07;
        const availW = canvas.width - pad * 2;
        const availH = canvas.height - pad * 2;
        const scale = Math.min(availW / img.width, availH / img.height, 1);
        const dw = img.width * scale, dh = img.height * scale;
        const dx = (canvas.width - dw) / 2, dy = (canvas.height - dh) / 2;

        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.4)";
        ctx.shadowBlur = canvas.width * 0.025;
        ctx.shadowOffsetY = canvas.width * 0.012;
        ctx.filter = filterStyle;
        ctx.drawImage(img, dx, dy, dw, dh);
        ctx.restore();

        // Apply pixel-level effects to the inset photo area only —
        // clip to the photo bounds first so effects don't spill onto the
        // background, then restore the full canvas context.
        if (dualToneOn || chromaticAb) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(dx, dy, dw, dh);
          ctx.clip();
          if (chromaticAb) applyChromaticAberration(ctx, canvas.width, canvas.height, chromaticAmount);
          if (dualToneOn) applyDualTone(ctx, canvas.width, canvas.height, dualShadow, dualHighlight, dualIntensity);
          ctx.restore();
        }
      } else {
        const r = rotation % 180 !== 0;
        canvas.width = r ? img.height : img.width;
        canvas.height = r ? img.width : img.height;

        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        if (flipH) ctx.scale(-1, 1);
        if (!isAI) ctx.filter = filterStyle;
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        ctx.restore();

        if (!isAI) {
          if (chromaticAb) applyChromaticAberration(ctx, canvas.width, canvas.height, chromaticAmount);
          if (dualToneOn) applyDualTone(ctx, canvas.width, canvas.height, dualShadow, dualHighlight, dualIntensity);
          if (vignette) drawVignette(ctx, canvas.width, canvas.height);
          if (lightLeak) drawLightLeak(ctx, canvas.width, canvas.height, leakCorner);
          if (filmGrain) drawFilmGrain(ctx, canvas.width, canvas.height, grainIntensity);
        }
      }

      if (textOverlay) {
        const tx = (textX / 100) * canvas.width;
        const ty = (textY / 100) * canvas.height;
        ctx.font = `bold ${textSize}px sans-serif`;
        ctx.textAlign = "center";
        if (textBg) {
          const metrics = ctx.measureText(textOverlay);
          ctx.fillStyle = "rgba(0,0,0,0.5)";
          ctx.fillRect(tx - metrics.width / 2 - 8, ty - textSize, metrics.width + 16, textSize + 8);
        }
        ctx.fillStyle = textColor;
        ctx.strokeStyle = "rgba(0,0,0,0.6)";
        ctx.lineWidth = 2;
        ctx.strokeText(textOverlay, tx, ty);
        ctx.fillText(textOverlay, tx, ty);
      }

      if (stickers.length > 0) {
        // Matches the preview's clamp(28px, 9vw, 56px) proportionally —
        // roughly 9% of the image width, so a sticker looks the same
        // relative size in the download as it did while placing it.
        const stickerFontPx = Math.round(canvas.width * 0.09);
        ctx.font = `${stickerFontPx}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        for (const st of stickers) {
          ctx.fillText(st.emoji, (st.x / 100) * canvas.width, (st.y / 100) * canvas.height);
        }
        ctx.textBaseline = "alphabetic";
      }

      if (!isAI && !isBgTab && cinematicBars) drawCinematicBars(ctx, canvas.width, canvas.height);

      if (!isPaid && !isAI) {
        ctx.font = `bold ${Math.max(14, canvas.width / 40)}px sans-serif`;
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.textAlign = "left";
        ctx.fillText("Made with Geenie AI", 12, canvas.height - 12);
      }

      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.download = "geenie-photo.png";
      a.href = dataUrl;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      setDownloadError("Couldn't bake in edits for download. Opening the image in a new tab instead — long-press or right-click to save it.");
      window.open(src, "_blank");
    }
  }

  const grad = { background: "var(--gradient-brand)" };
  const surfaceBtn = "rounded-xl bg-surface border border-border text-sm font-medium hover:bg-surface-elevated transition";

  const previewImg = (
    <img src={imageSrc!} alt="edit"
      style={{ filter: filterStyle, transform: transformStyle, maxHeight: "480px" }}
      className="max-w-full object-contain transition-all duration-150" />
  );

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6 max-w-4xl mx-auto w-full">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate({ to: "/dashboard" })} className="text-xs text-muted-foreground hover:text-foreground transition mr-1">← Back</button>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={grad}><ImageIcon className="h-5 w-5 text-white" /></div>
        <div>
          <h1 className="text-xl font-semibold">Photo Editor</h1>
          <p className="text-sm text-muted-foreground">Edit · Cinematic effects · Ask AI · Generate images · Change background</p>
        </div>
      </div>

      <div className="flex rounded-xl bg-surface border border-border overflow-hidden overflow-x-auto">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 text-[10px] sm:text-xs font-medium transition whitespace-nowrap px-1.5 ${tab === t ? "text-white" : "text-muted-foreground hover:text-foreground"}`}
            style={tab === t ? grad : undefined}>{t}</button>
        ))}
      </div>

      {downloadError && (
        <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
          <span className="text-red-500 shrink-0">⚠️</span>
          <p className="text-xs text-red-600">{downloadError}</p>
        </div>
      )}

      {(tab === "Edit" || tab === "Cinematic" || tab === "Ask AI" || tab === "Background") && !imageSrc && (
        <button onClick={() => fileRef.current?.click()}
          className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-surface/50 py-20 hover:border-orange-500/50 transition">
          <div className="flex h-14 w-14 items-center justify-center rounded-full" style={grad}><Upload className="h-6 w-6 text-white" /></div>
          <p className="text-sm font-medium">Upload a photo</p>
          <p className="text-xs text-muted-foreground">JPG, PNG, WEBP</p>
        </button>
      )}

      {/* EDIT TAB */}
      {tab === "Edit" && imageSrc && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-4">
          <div className="flex flex-col gap-3">
            <div ref={previewRef}
              onPointerMove={handlePreviewPointerMove} onPointerUp={handlePreviewPointerUp} onPointerLeave={handlePreviewPointerUp}
              className="rounded-2xl overflow-hidden bg-black/10 flex items-center justify-center min-h-[280px] relative touch-none">
              {previewImg}
              {textOverlay && (
                <div onPointerDown={handleOverlayPointerDown("text")}
                  className="absolute cursor-move select-none" style={{ left: `${textX}%`, top: `${textY}%`, transform: "translate(-50%, -50%)" }}>
                  <p className="font-bold whitespace-nowrap px-2 py-0.5 rounded"
                    style={{ color: textColor, textShadow: "2px 2px 4px rgba(0,0,0,0.7)", fontSize: `${textSize * 0.4}px`, background: textBg ? "rgba(0,0,0,0.5)" : "transparent" }}>
                    {textOverlay}
                  </p>
                </div>
              )}
              {stickers.map((st) => (
                <div key={st.id} onPointerDown={handleOverlayPointerDown(st.id)}
                  className="absolute cursor-move select-none group" style={{ left: `${st.x}%`, top: `${st.y}%`, transform: "translate(-50%, -50%)", fontSize: "clamp(28px, 9vw, 56px)", lineHeight: 1 }}>
                  {st.emoji}
                  <button onPointerDown={(e) => e.stopPropagation()} onClick={() => removeSticker(st.id)}
                    className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-black/70 text-white text-[9px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition">×</button>
                </div>
              ))}
              <CinematicOverlayLayer
                vignette={vignette} lightLeak={lightLeak} leakCorner={leakCorner}
                filmGrain={filmGrain} noiseTileUrl={noiseTileUrl} grainIntensity={grainIntensity}
                cinematicBars={cinematicBars}
                dualToneOn={dualToneOn} dualShadow={dualShadow} dualHighlight={dualHighlight} dualIntensity={dualIntensity}
              />
            </div>
            {(textOverlay || stickers.length > 0) && (
              <p className="text-[11px] text-center text-muted-foreground">👆 Drag the text {stickers.length > 0 ? "or stickers" : ""} directly on the photo to reposition</p>
            )}
            {hasCinematicFx && (
              <p className="text-[11px] text-center text-orange-600 bg-orange-50 rounded-lg py-1.5">🎬 Cinematic effects active — edit them in the Cinematic tab</p>
            )}
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => fileRef.current?.click()} className={`flex items-center gap-1.5 px-3 py-2 ${surfaceBtn}`}><RefreshCw className="h-4 w-4" />New</button>
              <button onClick={() => setRotation(r => (r + 90) % 360)} className={`flex items-center gap-1.5 px-3 py-2 ${surfaceBtn}`}><RotateCcw className="h-4 w-4" />Rotate</button>
              <button onClick={() => setFlipH(f => !f)} className={`flex items-center gap-1.5 px-3 py-2 ${surfaceBtn}`}><FlipHorizontal className="h-4 w-4" />Flip</button>
              <button onClick={download} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-white" style={grad}>
                <Download className="h-4 w-4" />{isPaid ? "Download HD" : "Download (watermarked)"}
              </button>
            </div>
          </div>
          <div className="glass rounded-2xl p-4 flex flex-col gap-4 max-h-[640px] overflow-y-auto">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Filters</p>
              <div className="grid grid-cols-4 gap-1.5">
                {filters.map(f => (
                  <button key={f.name} onClick={() => setActiveFilter(f)}
                    className={`relative rounded-lg py-2 text-[10px] font-medium transition ${activeFilter.name === f.name ? "text-white" : "bg-surface border border-border text-muted-foreground"}`}
                    style={activeFilter.name === f.name ? grad : undefined}>
                    {(f as { trending?: boolean }).trending && <span className="absolute -top-1.5 -right-1 text-[9px]" title="Trending">🔥</span>}
                    {f.name}
                  </button>
                ))}
              </div>
            </div>
            <Slider icon={Sun} label="Brightness" value={brightness} onChange={setBrightness} min={50} max={150} />
            <Slider icon={Contrast} label="Contrast" value={contrast} onChange={setContrast} min={50} max={150} />
            <Slider icon={Droplet} label="Saturation" value={saturation} onChange={setSaturation} min={0} max={200} />
            <Slider icon={Palette} label="Blur/Soften" value={blur} onChange={setBlur} min={0} max={8} suffix="px" />
            <div>
              <div className="flex justify-between mb-1"><span className="text-xs text-muted-foreground">🌡️ Warmth</span><span className="text-xs text-muted-foreground">{warmth > 0 ? `+${warmth}` : warmth}</span></div>
              <input type="range" min={-50} max={50} value={warmth} onChange={e => setWarmth(Number(e.target.value))} className="w-full accent-orange-500" />
            </div>
            {/* Text overlay */}
            <div className="flex flex-col gap-2 border-t border-border pt-3">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Type className="h-3 w-3" /> Text Overlay</label>
              <input value={textOverlay} onChange={e => setTextOverlay(e.target.value)} placeholder="Add text — then drag it on the photo" className="w-full rounded-xl bg-surface border border-border px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500" />
              <div className="flex items-center gap-2">
                <label className="text-[11px] text-muted-foreground shrink-0">Color:</label>
                <input type="color" value={textColor} onChange={e => setTextColor(e.target.value)} className="h-7 w-10 rounded border border-border cursor-pointer" />
                <label className="text-[11px] text-muted-foreground shrink-0 ml-2">Size:</label>
                <input type="range" min={16} max={80} value={textSize} onChange={e => setTextSize(Number(e.target.value))} className="flex-1 accent-orange-500" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={textBg} onChange={e => setTextBg(e.target.checked)} className="accent-orange-500" />
                <span className="text-[11px] text-muted-foreground">Text background</span>
              </label>
            </div>
            {/* Stickers */}
            <div className="flex flex-col gap-2 border-t border-border pt-3">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">✨ Stickers <span className="text-[9px] bg-orange-100 text-orange-600 px-1 rounded ml-1">New</span></label>
              <div className="grid grid-cols-8 gap-1">
                {STICKER_EMOJIS.map((e) => (
                  <button key={e} onClick={() => addSticker(e)} className="rounded-lg bg-surface border border-border py-1.5 text-base hover:bg-surface-elevated transition">{e}</button>
                ))}
              </div>
              {stickers.length > 0 && <p className="text-[11px] text-muted-foreground">{stickers.length} sticker{stickers.length > 1 ? "s" : ""} on photo — tap × to remove</p>}
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={vignette} onChange={e => setVignette(e.target.checked)} className="accent-orange-500" />
              <span className="text-xs text-muted-foreground">Vignette effect</span>
            </label>
            <button onClick={reset} className={`flex items-center justify-center gap-2 px-4 py-2 text-xs ${surfaceBtn}`}><RotateCcw className="h-3.5 w-3.5" />Reset All</button>
          </div>
        </div>
      )}

      {/* CINEMATIC TAB — trending "movie look" effects for 2026: film grain,
          letterbox bars, light leaks, and RGB-split glitch. Research shows
          these are exactly what young creators are using right now to get
          an "anti-perfect", nostalgic, movie-frame aesthetic. */}
      {tab === "Cinematic" && imageSrc && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
          <div className="flex flex-col gap-3">
            {compareMode ? (
              <div className="relative w-full rounded-2xl overflow-hidden bg-black/10 select-none" style={{ minHeight: 280 }}>
                <img src={imageSrc} alt="edited" style={{ filter: filterStyle, transform: transformStyle }} className="w-full object-contain block" />
                <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - comparePos}% 0 0)` }}>
                  <img src={imageSrc} alt="original" className="w-full h-full object-contain" />
                </div>
                <div className="absolute top-0 bottom-0 pointer-events-none" style={{ left: `${comparePos}%` }}>
                  <div className="w-0.5 h-full bg-white shadow-lg" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white shadow-lg flex items-center justify-center text-xs">↔</div>
                </div>
                <input type="range" min={0} max={100} value={comparePos} onChange={e => setComparePos(Number(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize m-0" />
                <span className="absolute top-2 left-2 text-[10px] bg-black/60 text-white px-2 py-0.5 rounded pointer-events-none">Before</span>
                <span className="absolute top-2 right-2 text-[10px] bg-black/60 text-white px-2 py-0.5 rounded pointer-events-none">After</span>
              </div>
            ) : (
              <div className="rounded-2xl overflow-hidden bg-black/10 flex items-center justify-center min-h-[280px] relative">
                {chromaticAb ? (
                  <div className="relative" style={{ transform: transformStyle }}>
                    <img src={imageSrc} alt="rgb-red" style={{ filter: `${filterStyle} sepia(1) saturate(6) hue-rotate(-50deg) brightness(1.15)`, maxHeight: "480px" }}
                      className="absolute inset-0 max-w-full object-contain" style={{ mixBlendMode: "screen", transform: `translateX(-${chromaticAmount}px)`, maxHeight: "480px" }} />
                    <img src={imageSrc} alt="rgb-cyan" style={{ filter: `${filterStyle} sepia(1) saturate(6) hue-rotate(140deg) brightness(1.15)`, maxHeight: "480px" }}
                      className="absolute inset-0 max-w-full object-contain" style={{ mixBlendMode: "screen", transform: `translateX(${chromaticAmount}px)`, maxHeight: "480px" }} />
                    <img src={imageSrc} alt="rgb-base" style={{ filter: filterStyle, maxHeight: "480px" }} className="relative max-w-full object-contain opacity-90" />
                  </div>
                ) : previewImg}
                <CinematicOverlayLayer
                  vignette={vignette} lightLeak={lightLeak} leakCorner={leakCorner}
                  filmGrain={filmGrain} noiseTileUrl={noiseTileUrl} grainIntensity={grainIntensity}
                  cinematicBars={cinematicBars}
                />
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => setCompareMode(m => !m)}
                className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-medium transition ${compareMode ? "text-white" : "bg-surface border border-border text-muted-foreground hover:bg-surface-elevated"}`}
                style={compareMode ? grad : undefined}>
                <Wand2 className="h-4 w-4" />{compareMode ? "Comparing" : "Compare"}
              </button>
              <button onClick={download} className="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white" style={grad}><Download className="h-4 w-4" />{isPaid ? "Download HD" : "Download (watermarked)"}</button>
            </div>
          </div>
          <div className="glass rounded-2xl p-4 flex flex-col gap-4">
            <p className="text-sm font-semibold flex items-center gap-1.5"><Film className="h-4 w-4 text-orange-500" />Cinematic Effects</p>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={cinematicBars} onChange={e => setCinematicBars(e.target.checked)} className="accent-orange-500" />
                <span className="text-xs flex items-center gap-1">🎞️ Cinematic Bars <span className="text-[9px] bg-orange-100 text-orange-600 px-1 rounded">🔥 Trending</span></span>
              </label>
            </div>
            <p className="text-[11px] text-muted-foreground -mt-2">Widescreen letterbox — instant movie-frame look</p>

            <div>
              <label className="flex items-center gap-2 cursor-pointer mb-1.5">
                <input type="checkbox" checked={filmGrain} onChange={e => setFilmGrain(e.target.checked)} className="accent-orange-500" />
                <span className="text-xs flex items-center gap-1">🎬 Film Grain <span className="text-[9px] bg-orange-100 text-orange-600 px-1 rounded">🔥 Trending</span></span>
              </label>
              {filmGrain && (
                <input type="range" min={10} max={100} value={grainIntensity} onChange={e => setGrainIntensity(Number(e.target.value))} className="w-full accent-orange-500" />
              )}
              <p className="text-[11px] text-muted-foreground">Analog texture — the "imperfect on purpose" look</p>
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer mb-1.5">
                <input type="checkbox" checked={lightLeak} onChange={e => setLightLeak(e.target.checked)} className="accent-orange-500" />
                <span className="text-xs">☀️ Light Leak</span>
              </label>
              {lightLeak && (
                <div className="grid grid-cols-4 gap-1.5">
                  {(Object.keys(LIGHT_LEAK_POS) as LeakCorner[]).map(c => (
                    <button key={c} onClick={() => setLeakCorner(c)}
                      className={`rounded-lg py-1.5 text-[10px] font-medium transition ${leakCorner === c ? "text-white" : "bg-surface border border-border text-muted-foreground"}`}
                      style={leakCorner === c ? grad : undefined}>
                      {c.split("-").map(w => w[0].toUpperCase()).join("")}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer mb-1.5">
                <input type="checkbox" checked={chromaticAb} onChange={e => setChromaticAb(e.target.checked)} className="accent-orange-500" />
                <span className="text-xs flex items-center gap-1"><Wand2 className="h-3 w-3" />Glitch / RGB Split</span>
              </label>
              {chromaticAb && (
                <input type="range" min={1} max={12} value={chromaticAmount} onChange={e => setChromaticAmount(Number(e.target.value))} className="w-full accent-orange-500" />
              )}
              <p className="text-[11px] text-muted-foreground">Retro VHS-glitch color split</p>
            </div>

            {/* Dual-Tone / Gradient Map */}
            <div className="border-t border-border pt-3">
              <label className="flex items-center gap-2 cursor-pointer mb-2">
                <input type="checkbox" checked={dualToneOn} onChange={e => setDualToneOn(e.target.checked)} className="accent-orange-500" />
                <span className="text-xs font-medium flex items-center gap-1">
                  🎨 Dual-Tone
                  <span className="text-[9px] bg-orange-100 text-orange-600 px-1 rounded">✨ New</span>
                </span>
              </label>
              {dualToneOn && (
                <div className="flex flex-col gap-2">
                  <p className="text-[11px] text-muted-foreground">Maps shadows → one colour, highlights → another. The split-tone cinematic look.</p>
                  {/* Quick presets */}
                  <div className="grid grid-cols-3 gap-1.5">
                    {DUAL_PRESETS.map(p => (
                      <button key={p.name} onClick={() => { setDualShadow(p.shadow); setDualHighlight(p.highlight); }}
                        className="rounded-lg py-1.5 text-[10px] font-medium transition text-white"
                        style={{ background: `linear-gradient(135deg, ${p.shadow}, ${p.highlight})` }}>
                        {p.name}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-3 items-center">
                    <div className="flex flex-col items-center gap-1">
                      <label className="text-[11px] text-muted-foreground">Shadows</label>
                      <input type="color" value={dualShadow} onChange={e => setDualShadow(e.target.value)} className="h-8 w-10 rounded border border-border cursor-pointer" />
                    </div>
                    <div className="flex-1 h-6 rounded-lg shadow-sm" style={{ background: `linear-gradient(90deg, ${dualShadow}, ${dualHighlight})` }} />
                    <div className="flex flex-col items-center gap-1">
                      <label className="text-[11px] text-muted-foreground">Highlights</label>
                      <input type="color" value={dualHighlight} onChange={e => setDualHighlight(e.target.value)} className="h-8 w-10 rounded border border-border cursor-pointer" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                      <span>Intensity</span><span>{dualIntensity}%</span>
                    </div>
                    <input type="range" min={10} max={100} value={dualIntensity} onChange={e => setDualIntensity(Number(e.target.value))} className="w-full accent-orange-500" />
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-border pt-3">
              <p className="text-xs font-semibold mb-2 flex items-center gap-1.5"><Bookmark className="h-3.5 w-3.5 text-orange-500" />My Presets</p>
              <div className="flex gap-1.5 mb-2">
                <input value={presetNameInput} onChange={e => setPresetNameInput(e.target.value)} placeholder="Name this look..."
                  className="flex-1 rounded-lg bg-surface border border-border px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500" />
                <button onClick={savePreset} disabled={!presetNameInput.trim()}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40 shrink-0" style={grad}>Save</button>
              </div>
              {presets.length === 0 ? (
                <p className="text-[11px] text-muted-foreground">Set up a look (filter + effects), then save it here for one-tap reuse.</p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {presets.map(p => (
                    <div key={p.name} className="flex items-center gap-2 rounded-lg bg-surface border border-border px-2.5 py-1.5">
                      <button onClick={() => applyPreset(p)} className="flex-1 text-left text-xs font-medium hover:text-orange-600 transition truncate">{p.name}</button>
                      <button onClick={() => deletePreset(p.name)} className="text-muted-foreground hover:text-red-500 shrink-0"><X className="h-3 w-3" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <p className="text-[11px] text-muted-foreground mt-1">💡 Try "Teal & Orange" or "Midnight" filters in the Edit tab combined with these for a full blockbuster grade.</p>
            <button onClick={reset} className={`flex items-center justify-center gap-2 px-4 py-2 text-xs ${surfaceBtn}`}><RotateCcw className="h-3.5 w-3.5" />Reset All</button>
          </div>
        </div>
      )}

      {/* SMART EDIT TAB */}
      {tab === "Ask AI" && imageSrc && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
          <div className="flex flex-col gap-3">
            <div className="rounded-2xl overflow-hidden bg-black/10 flex items-center justify-center min-h-[280px] relative">
              <img src={imageSrc} alt="smart" style={{ filter: filterStyle, transform: transformStyle, maxHeight: "480px" }} className="max-w-full object-contain transition-all duration-300" />
              <CinematicOverlayLayer
                vignette={vignette} lightLeak={lightLeak} leakCorner={leakCorner}
                filmGrain={filmGrain} noiseTileUrl={noiseTileUrl} grainIntensity={grainIntensity}
                cinematicBars={cinematicBars}
                dualToneOn={dualToneOn} dualShadow={dualShadow} dualHighlight={dualHighlight} dualIntensity={dualIntensity}
              />
            </div>
            <button onClick={download} className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white" style={grad}><Download className="h-4 w-4" />{isPaid ? "Download HD" : "Download (watermarked)"}</button>
          </div>
          <div className="glass rounded-2xl p-4 flex flex-col gap-3">
            <p className="text-sm font-semibold">✨ Ask AI</p>
            <p className="text-xs text-muted-foreground">Type what you want — AI applies it</p>
            {!isPaid ? (
              <div className="rounded-xl bg-orange-50 border border-orange-300 p-4 text-center flex flex-col gap-2">
                <p className="text-sm font-semibold text-orange-700">🔒 Paid Plan Only</p>
                <p className="text-xs text-orange-600">Upgrade to Creator ($2/mo)</p>
                <a href="/#pricing" className="inline-block rounded-xl px-4 py-2 text-sm font-medium text-white mt-1" style={grad}>Upgrade →</a>
              </div>
            ) : (
              <>
                <textarea value={smartPrompt} onChange={e => setSmartPrompt(e.target.value)} placeholder="e.g. make it brighter and more vivid..." className="w-full rounded-xl bg-surface border border-border px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-orange-500" rows={2} />
                <button onClick={applySmartEdit} disabled={smartLoading || !smartPrompt.trim()} className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50" style={grad}>
                  <Zap className="h-4 w-4" />{smartLoading ? "Applying..." : "Apply Edit"}
                </button>
                {smartMsg && <p className="text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2">✅ {smartMsg}</p>}
                <div className="flex flex-col gap-1.5">
                  {PROMPTS.map(s => <button key={s} onClick={() => setSmartPrompt(s)} className="text-left rounded-lg bg-surface border border-border px-3 py-2 text-xs text-muted-foreground hover:bg-surface-elevated transition">{s}</button>)}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* AI GENERATE TAB */}
      {tab === "AI Generate" && (
        <div className="glass rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl shrink-0" style={grad}>
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold">AI Image Generator</p>
              <p className="text-xs text-muted-foreground">Free, no watermark — describe anything and AI creates it</p>
            </div>
          </div>
          <div>
            <label htmlFor="ai-generate-prompt" className="text-xs font-semibold text-orange-600 mb-1.5 block">
              ✍️ Type what you want to see
            </label>
            <textarea
              id="ai-generate-prompt"
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              placeholder="e.g. a professional woman at a laptop in a modern office, warm lighting, photorealistic..."
              className="w-full rounded-2xl bg-white border-2 border-orange-300 px-4 py-4 text-base shadow-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 placeholder:text-muted-foreground/70"
              rows={4}
              autoFocus
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-muted-foreground self-center mr-1">Try:</span>
            {AI_PRESETS.map(p => <button key={p} onClick={() => setAiPrompt(p)} className="rounded-full bg-surface border border-border px-3 py-1 text-xs text-muted-foreground hover:bg-surface-elevated transition">{p}</button>)}
          </div>
          <button onClick={generateAI} disabled={aiLoading || !aiPrompt.trim()} className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white disabled:opacity-50" style={grad}>
            <Sparkles className="h-4 w-4" />{aiLoading ? "Generating... (15-20s)" : "Generate Image"}
          </button>
          {aiLoading && <div className="flex flex-col items-center gap-2 py-8"><div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" /><p className="text-xs text-muted-foreground">Creating your image... (15-30s)</p></div>}
          {aiError && !aiLoading && <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3"><p className="text-xs text-red-600">⚠️ Generation failed. Pollinations AI may be busy. Please try again in a few seconds.</p></div>}
          {aiResult && !aiLoading && (
            <div className="flex flex-col gap-3">
              <motion.img key={aiResult} src={aiResult} alt="AI generated"
                initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35, ease: "easeOut" }}
                className="w-full rounded-xl object-cover" />
              <div className="flex gap-2">
                <button onClick={generateAI} className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 ${surfaceBtn}`}><RefreshCw className="h-4 w-4" />Regenerate</button>
                <button onClick={download} className="flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white" style={grad}><Download className="h-4 w-4" />Download</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* BACKGROUND TAB */}
      {tab === "Background" && imageSrc && (
        <div className="glass rounded-2xl p-5 flex flex-col gap-4">
          <div className="rounded-xl bg-orange-50 border border-orange-200 p-3 flex flex-col gap-2">
            <p className="text-xs font-semibold text-orange-700">✨ AI Background</p>
            <div className="flex gap-2">
              <input value={aiBgPrompt} onChange={e => setAiBgPrompt(e.target.value)} placeholder="e.g. sunset beach, city skyline, forest, white studio..." className="flex-1 rounded-xl bg-white border border-orange-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500" />
              <button onClick={generateAIBg} disabled={aiBgLoading || !aiBgPrompt.trim()} className="rounded-xl px-4 py-2 text-sm font-medium text-white disabled:opacity-50 shrink-0" style={grad}>{aiBgLoading ? "..." : "Generate"}</button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {["Sunset beach","City skyline","Forest","White studio","Galaxy stars","Marble texture","Mountain peak","Neon city"].map(p => (
                <button key={p} onClick={() => setAiBgPrompt(p)} className="rounded-full bg-white border border-orange-200 px-2.5 py-1 text-[11px] text-orange-600 hover:bg-orange-50 transition">{p}</button>
              ))}
            </div>
            {aiBgError && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">⚠️ {aiBgError}</p>}
          </div>
          <div className="rounded-2xl overflow-hidden flex items-center justify-center min-h-[260px] p-6 relative" style={{ background: aiBgUrl ? undefined : (bg.value || "#f5f5f7") }}>
            {aiBgUrl && <img src={aiBgUrl} className="absolute inset-0 w-full h-full object-cover" alt="ai bg" />}
            {aiBgLoading && <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10"><div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" /></div>}
            <img src={imageSrc} alt="bg preview" style={{ filter: filterStyle, maxHeight: "220px", position: "relative", zIndex: 2, boxShadow: "0 12px 28px rgba(0,0,0,0.35)" }} className="max-w-full object-contain rounded-sm" />
          </div>
          <p className="text-[11px] text-muted-foreground text-center -mt-1">Photo is framed on the backdrop with a soft shadow — this matches exactly what downloads.</p>
          <div className="grid grid-cols-4 gap-2">
            {bgs.map(b => (
              <button key={b.name} onClick={() => { setBg(b); setAiBgUrl(null); }}
                className={`rounded-xl h-12 text-xs font-medium border-2 transition ${bg.name === b.name && !aiBgUrl ? "border-orange-500" : "border-transparent"}`}
                style={{ background: b.value || "#f0f0f0" }}>
                <span style={{ color: b.value === "#000000" ? "#fff" : "#111" }}>{b.name}</span>
              </button>
            ))}
          </div>
          <button onClick={download} className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white" style={grad}><Download className="h-4 w-4" />Download with Background</button>
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

function Slider({ icon: Icon, label, value, onChange, min, max, suffix = "%" }: {
  icon: React.ComponentType<{ className?: string }>; label: string; value: number;
  onChange: (v: number) => void; min: number; max: number; suffix?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><Icon className="h-3.5 w-3.5" />{label}</span>
        <span className="text-xs text-muted-foreground">{value}{suffix}</span>
      </div>
      <input type="range" min={min} max={max} value={value} onChange={e => onChange(Number(e.target.value))} className="w-full accent-orange-500" />
    </div>
  );
}
