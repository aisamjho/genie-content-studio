import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { Upload, Download, RotateCcw, Sun, Contrast, Droplet, Palette, Sparkles, RefreshCw, Music, Zap, Image as ImageIcon } from "lucide-react";

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

const bgs = [
  { name: "None", value: "" },
  { name: "White", value: "#ffffff" },
  { name: "Black", value: "#000000" },
  { name: "Gray", value: "#e8e8e8" },
  { name: "Sky", value: "linear-gradient(180deg,#87CEEB,#fff)" },
  { name: "Sunset", value: "linear-gradient(135deg,#ff6b35,#f7277e)" },
  { name: "Forest", value: "linear-gradient(180deg,#2d6a4f,#40916c)" },
  { name: "Office", value: "#f0f4f8" },
];

const TABS = ["Edit", "Smart Edit", "AI Generate", "Background"] as const;
type Tab = typeof TABS[number];

const PROMPTS = ["Make it brighter and vivid","Cinematic dramatic look","Vintage warm film","Black and white high contrast","Soft dreamy pastel","Cool blue tone","Professional clean look","Make skin tones warmer"];
const AI_PRESETS = ["Product photo on white background","LinkedIn headshot professional","YouTube thumbnail dramatic","Instagram aesthetic café"];

function PhotoEditor() {
  const navigate = useNavigate();
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [blur, setBlur] = useState(0);
  const [activeFilter, setActiveFilter] = useState(filters[0]);
  const [rotation, setRotation] = useState(0);
  const [tab, setTab] = useState<Tab>("Edit");
  const [bg, setBg] = useState(bgs[0]);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [smartPrompt, setSmartPrompt] = useState("");
  const [smartLoading, setSmartLoading] = useState(false);
  const [smartMsg, setSmartMsg] = useState("");
  const [aiBgPrompt, setAiBgPrompt] = useState("");
  const [aiBgLoading, setAiBgLoading] = useState(false);
  const [aiBgUrl, setAiBgUrl] = useState<string | null>(null);
  const [musicFile, setMusicFile] = useState<string | null>(null);
  const [musicName, setMusicName] = useState("");
  const [plan, setPlan] = useState("starter");
  const fileRef = useRef<HTMLInputElement>(null);
  const musicRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setPlan(localStorage.getItem("geenie_plan") || "starter");
  }, []);

  const isPaid = plan === "creator" || plan === "studio";
  const filterStyle = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) blur(${blur}px) ${activeFilter.css}`;

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImageSrc(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function handleMusic(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMusicFile(URL.createObjectURL(file));
    setMusicName(file.name.replace(/\.[^.]+$/, ""));
  }

  function reset() {
    setBrightness(100); setContrast(100); setSaturation(100);
    setBlur(0); setActiveFilter(filters[0]); setRotation(0);
  }

  async function generateAI() {
    if (!aiPrompt.trim()) return;
    setAiLoading(true); setAiResult(null);
    const seed = Math.floor(Math.random() * 99999);
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(aiPrompt + ", high quality, detailed")}?width=1024&height=1024&seed=${seed}&nologo=true&enhance=true`;
    setAiResult(url);
    const img = new window.Image();
    img.onload = () => setAiLoading(false);
    img.onerror = () => setAiLoading(false);
    img.src = url;
    setTimeout(() => setAiLoading(false), 25000);
  }

  async function applySmartEdit() {
    if (!smartPrompt.trim() || !imageSrc) return;
    setSmartLoading(true); setSmartMsg("");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6", max_tokens: 200,
          messages: [{ role: "user", content: `Convert this photo editing instruction to CSS filter values. Instruction: "${smartPrompt}". Current: brightness=${brightness}, contrast=${contrast}, saturation=${saturation}. Respond ONLY with JSON (no markdown): {"brightness":110,"contrast":120,"saturation":100,"blur":0,"filter":"","message":"Applied warm look"}` }]
        })
      });
      const data = await res.json();
      const text = data.content?.[0]?.text ?? "{}";
      const parsed = JSON.parse(text.trim());
      if (parsed.brightness) setBrightness(parsed.brightness);
      if (parsed.contrast) setContrast(parsed.contrast);
      if (parsed.saturation !== undefined) setSaturation(parsed.saturation);
      if (parsed.blur !== undefined) setBlur(parsed.blur);
      if (parsed.filter !== undefined) setActiveFilter({ name: "Smart", css: parsed.filter });
      setSmartMsg(parsed.message || "Edit applied!");
      setSmartPrompt("");
    } catch { setSmartMsg("Try: 'make it brighter' or 'add vintage look'"); }
    setSmartLoading(false);
  }

  function generateAIBg() {
    if (!aiBgPrompt.trim()) return;
    setAiBgLoading(true);
    setAiBgUrl(null);
    const seed = Math.floor(Math.random() * 99999);
    const prompt = encodeURIComponent(`${aiBgPrompt}, background scenery, high quality, wide angle, no people, photorealistic`);
    const url = `https://image.pollinations.ai/prompt/${prompt}?width=1024&height=1024&seed=${seed}&nologo=true&enhance=true`;
    setAiBgUrl(url);
    const img = new window.Image();
    img.onload = () => setAiBgLoading(false);
    img.onerror = () => setAiBgLoading(false);
    img.src = url;
    setTimeout(() => setAiBgLoading(false), 25000);
  }

  function download() {
    const src = tab === "AI Generate" ? aiResult : imageSrc;
    if (!src) return;
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;
      const r = rotation % 180 !== 0;
      canvas.width = r ? img.height : img.width;
      canvas.height = r ? img.width : img.height;
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      if (tab !== "AI Generate") ctx.filter = filterStyle;
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();
      if (!isPaid) {
        ctx.font = `bold ${Math.max(16, canvas.width / 30)}px sans-serif`;
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.fillText("Made with Geenie AI", 12, canvas.height - 12);
      }
      const a = document.createElement("a");
      a.download = "geenie-photo.png";
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = src;
  }

  const grad = { background: "var(--gradient-brand)" };
  const surfaceBtn = "rounded-xl bg-surface border border-border text-sm font-medium hover:bg-surface-elevated transition";

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6 max-w-4xl mx-auto w-full">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate({ to: "/dashboard" })}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition mr-1">
          ← Back
        </button>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={grad}>
          <ImageIcon className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Photo Editor</h1>
          <p className="text-sm text-muted-foreground">Edit · Smart AI Edit · Generate · Change Background</p>
        </div>
      </div>

      <div className="flex rounded-xl bg-surface border border-border overflow-hidden">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 text-xs sm:text-sm font-medium transition ${tab === t ? "text-white" : "text-muted-foreground hover:text-foreground"}`}
            style={tab === t ? grad : undefined}>{t}</button>
        ))}
      </div>

      {(tab === "Edit" || tab === "Smart Edit" || tab === "Background") && !imageSrc && (
        <button onClick={() => fileRef.current?.click()}
          className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-surface/50 py-20 hover:border-orange-500/50 transition">
          <div className="flex h-14 w-14 items-center justify-center rounded-full" style={grad}>
            <Upload className="h-6 w-6 text-white" />
          </div>
          <p className="text-sm font-medium">Upload a photo</p>
          <p className="text-xs text-muted-foreground">JPG, PNG, WEBP</p>
        </button>
      )}

      {tab === "Edit" && imageSrc && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-4">
          <div className="flex flex-col gap-3">
            <div className="rounded-2xl overflow-hidden bg-black/10 flex items-center justify-center min-h-[280px]">
              <img src={imageSrc} alt="edit" style={{ filter: filterStyle, transform: `rotate(${rotation}deg)`, maxHeight: "480px" }} className="max-w-full object-contain transition-all" />
            </div>
            {musicFile && <div className="flex items-center gap-2 rounded-xl bg-surface border border-border px-3 py-2"><Music className="h-4 w-4 text-orange-400 shrink-0" /><span className="text-xs truncate">{musicName}</span><audio src={musicFile} controls className="h-7 flex-1" /></div>}
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => fileRef.current?.click()} className={`flex items-center gap-1.5 px-3 py-2 ${surfaceBtn}`}><RefreshCw className="h-4 w-4" />New</button>
              <button onClick={() => setRotation(r => (r + 90) % 360)} className={`flex items-center gap-1.5 px-3 py-2 ${surfaceBtn}`}><RotateCcw className="h-4 w-4" />Rotate</button>
              <button onClick={() => musicRef.current?.click()} className={`flex items-center gap-1.5 px-3 py-2 ${surfaceBtn}`}><Music className="h-4 w-4" />Music</button>
              <button onClick={download} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-white transition" style={grad}>
                <Download className="h-4 w-4" />{isPaid ? "Download HD" : "Download (watermarked)"}
              </button>
            </div>
          </div>
          <div className="glass rounded-2xl p-4 flex flex-col gap-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Filters</p>
              <div className="grid grid-cols-4 gap-1.5">
                {filters.map(f => (
                  <button key={f.name} onClick={() => setActiveFilter(f)}
                    className={`rounded-lg py-2 text-[10px] font-medium transition ${activeFilter.name === f.name ? "text-white" : "bg-surface border border-border text-muted-foreground"}`}
                    style={activeFilter.name === f.name ? grad : undefined}>{f.name}</button>
                ))}
              </div>
            </div>
            <Slider icon={Sun} label="Brightness" value={brightness} onChange={setBrightness} min={50} max={150} />
            <Slider icon={Contrast} label="Contrast" value={contrast} onChange={setContrast} min={50} max={150} />
            <Slider icon={Droplet} label="Saturation" value={saturation} onChange={setSaturation} min={0} max={200} />
            <Slider icon={Palette} label="Blur" value={blur} onChange={setBlur} min={0} max={10} suffix="px" />
            <button onClick={reset} className={`flex items-center justify-center gap-2 px-4 py-2 text-xs ${surfaceBtn}`}><RotateCcw className="h-3.5 w-3.5" />Reset All</button>
          </div>
        </div>
      )}

      {tab === "Smart Edit" && imageSrc && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
          <div className="flex flex-col gap-3">
            <div className="rounded-2xl overflow-hidden bg-black/10 flex items-center justify-center min-h-[280px]">
              <img src={imageSrc} alt="smart edit" style={{ filter: filterStyle, maxHeight: "480px" }} className="max-w-full object-contain transition-all duration-300" />
            </div>
            <button onClick={download} className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white" style={grad}>
              <Download className="h-4 w-4" />{isPaid ? "Download HD" : "Download (watermarked)"}
            </button>
          </div>
          <div className="glass rounded-2xl p-4 flex flex-col gap-3">
            <p className="text-sm font-semibold">✨ Smart Edit</p>
            <p className="text-xs text-muted-foreground">Type what you want — AI applies it</p>
            {!isPaid ? (
              <div className="rounded-xl bg-orange-50 border border-orange-300 p-4 text-center flex flex-col gap-2">
                <p className="text-sm font-semibold text-orange-700">🔒 Paid Plan Only</p>
                <p className="text-xs text-orange-600">Upgrade to Creator ($2/mo) to use Smart Edit</p>
                <a href="/#pricing" className="inline-block rounded-xl px-4 py-2 text-sm font-medium text-white mt-1" style={grad}>Upgrade →</a>
              </div>
            ) : (
              <>
                <textarea value={smartPrompt} onChange={e => setSmartPrompt(e.target.value)}
                  placeholder="e.g. make it brighter and more vivid..."
                  className="w-full rounded-xl bg-surface border border-border px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-orange-500" rows={2} />
                <button onClick={applySmartEdit} disabled={smartLoading || !smartPrompt.trim()}
                  className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50" style={grad}>
                  <Zap className="h-4 w-4" />{smartLoading ? "Applying..." : "Apply Edit"}
                </button>
                {smartMsg && <p className="text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2">✅ {smartMsg}</p>}
                <div className="flex flex-col gap-1.5">
                  {PROMPTS.map(s => (
                    <button key={s} onClick={() => setSmartPrompt(s)}
                      className="text-left rounded-lg bg-surface border border-border px-3 py-2 text-xs text-muted-foreground hover:bg-surface-elevated transition">{s}</button>
                  ))}
                </div>
                <button onClick={reset} className={`flex items-center justify-center gap-2 px-4 py-2 text-xs mt-1 ${surfaceBtn}`}><RotateCcw className="h-3.5 w-3.5" />Reset All</button>
              </>
            )}
          </div>
        </div>
      )}

      {tab === "AI Generate" && (
        <div className="glass rounded-2xl p-5 flex flex-col gap-4">
          <div className="rounded-xl bg-orange-50 border border-orange-200 p-3">
            <p className="text-xs text-orange-700 font-medium">✨ Type anything — AI creates the image. Free, no watermark.</p>
          </div>
          <textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
            placeholder="e.g. a professional woman at a laptop in a modern office, warm lighting..."
            className="w-full rounded-xl bg-surface border border-border px-4 py-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-orange-500" rows={3} />
          <div className="flex flex-wrap gap-2">
            {AI_PRESETS.map(p => (
              <button key={p} onClick={() => setAiPrompt(p)} className="rounded-full bg-surface border border-border px-3 py-1 text-xs text-muted-foreground hover:bg-surface-elevated transition">{p}</button>
            ))}
          </div>
          <button onClick={generateAI} disabled={aiLoading || !aiPrompt.trim()}
            className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white disabled:opacity-50" style={grad}>
            <Sparkles className="h-4 w-4" />{aiLoading ? "Generating... (15-20s)" : "Generate Image"}
          </button>
          {aiLoading && <div className="flex flex-col items-center gap-2 py-8"><div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" /><p className="text-xs text-muted-foreground">Creating your image...</p></div>}
          {aiResult && !aiLoading && (
            <div className="flex flex-col gap-3">
              <img src={aiResult} alt="AI generated" className="w-full rounded-xl object-cover" />
              <div className="flex gap-2">
                <button onClick={generateAI} className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 ${surfaceBtn}`}><RefreshCw className="h-4 w-4" />Regenerate</button>
                <button onClick={download} className="flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white" style={grad}><Download className="h-4 w-4" />Download</button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "Background" && imageSrc && (
        <div className="glass rounded-2xl p-5 flex flex-col gap-4">
          {/* AI Prompt Background */}
          <div className="rounded-xl bg-orange-50 border border-orange-200 p-3 flex flex-col gap-2">
            <p className="text-xs font-semibold text-orange-700">✨ AI Background — describe what you want</p>
            <div className="flex gap-2">
              <input value={aiBgPrompt} onChange={e => setAiBgPrompt(e.target.value)}
                placeholder="e.g. sunset beach, city skyline, forest, studio white..."
                className="flex-1 rounded-xl bg-white border border-orange-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500" />
              <button onClick={generateAIBg} disabled={aiBgLoading || !aiBgPrompt.trim()}
                className="rounded-xl px-4 py-2 text-sm font-medium text-white disabled:opacity-50 shrink-0" style={grad}>
                {aiBgLoading ? "..." : "Generate"}
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {["Sunset beach","City skyline at night","Forest green","White studio","Galaxy stars","Neon city","Mountain peak","Marble texture"].map(p => (
                <button key={p} onClick={() => setAiBgPrompt(p)}
                  className="rounded-full bg-white border border-orange-200 px-2.5 py-1 text-[11px] text-orange-600 hover:bg-orange-100 transition">{p}</button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="rounded-2xl overflow-hidden flex items-center justify-center min-h-[240px] relative"
            style={{ background: aiBgUrl ? undefined : (bg.value || "#f5f5f7") }}>
            {aiBgUrl && <img src={aiBgUrl} className="absolute inset-0 w-full h-full object-cover rounded-2xl" alt="ai bg" />}
            {aiBgLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-2xl z-10">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
              </div>
            )}
            <img src={imageSrc} alt="bg preview" style={{ filter: filterStyle, maxHeight: "240px", position: "relative", zIndex: 2 }} className="max-w-full object-contain" />
          </div>
          {(aiBgUrl || bg.value) && (
            <div className="rounded-xl bg-blue-50 border border-blue-200 p-3">
              <p className="text-xs text-blue-700">💡 <strong>How it works:</strong> The background appears behind your photo. For full background removal (replacing sky, walls etc), upgrade to Creator plan — coming soon with Replicate AI.</p>
            </div>
          )}

          {/* Solid backgrounds */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Or choose a solid background</p>
            <div className="grid grid-cols-4 gap-2">
              {bgs.map(b => (
                <button key={b.name} onClick={() => { setBg(b); setAiBgUrl(null); }}
                  className={`rounded-xl h-12 text-xs font-medium border-2 transition ${bg.name === b.name && !aiBgUrl ? "border-orange-500" : "border-transparent"}`}
                  style={{ background: b.value || "#f0f0f0" }}>
                  <span style={{ color: b.value === "#000000" ? "#fff" : "#111" }}>{b.name}</span>
                </button>
              ))}
            </div>
          </div>

          <button onClick={download} className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white" style={grad}>
            <Download className="h-4 w-4" />Download with Background
          </button>
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
      <input ref={musicRef} type="file" accept="audio/*" onChange={handleMusic} className="hidden" />
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
