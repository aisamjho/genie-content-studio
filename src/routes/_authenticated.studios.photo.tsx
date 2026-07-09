import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { Upload, Download, RotateCcw, Sun, Contrast, Droplet, Palette, Sparkles, RefreshCw, Music, Wand2, Image as ImageIcon, Zap } from "lucide-react";

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

const backgrounds = [
  { name: "None", value: "" },
  { name: "White", value: "#ffffff" },
  { name: "Black", value: "#000000" },
  { name: "Studio Gray", value: "#e8e8e8" },
  { name: "Sky Blue", value: "linear-gradient(180deg,#87CEEB,#ffffff)" },
  { name: "Sunset", value: "linear-gradient(135deg,#ff6b35,#f7277e)" },
  { name: "Forest", value: "linear-gradient(180deg,#2d6a4f,#40916c)" },
  { name: "Office", value: "#f0f4f8" },
];

const tabs = ["Edit", "Smart Edit", "AI Generate", "Background"] as const;
type Tab = typeof tabs[number];

async function callClaude(prompt: string): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 150,
      messages: [{ role: "user", content: `Convert this into a vivid image generation prompt, max 40 words, no explanation: "${prompt}"` }],
    }),
  });
  const data = await res.json();
  return data.content?.[0]?.text ?? prompt;
}

function PhotoEditor() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [blur, setBlur] = useState(0);
  const [activeFilter, setActiveFilter] = useState(filters[0]);
  const [rotation, setRotation] = useState(0);
  const [activeTab, setActiveTab] = useState<Tab>("Edit");
  const [bg, setBg] = useState(backgrounds[0]);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [smartPrompt, setSmartPrompt] = useState("");
  const [smartLoading, setSmartLoading] = useState(false);
  const [smartMessage, setSmartMessage] = useState("");
  const [musicFile, setMusicFile] = useState<string | null>(null);
  const [musicName, setMusicName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const musicInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const filterStyle = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) blur(${blur}px) ${activeFilter.css}`;

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
    setMusicName(file.name.replace(/\.[^.]+$/, ""));
  }

  function resetAll() {
    setBrightness(100); setContrast(100); setSaturation(100);
    setBlur(0); setActiveFilter(filters[0]); setRotation(0);
  }

  async function generateAI() {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiResult(null);
    const enhanced = await callClaude(aiPrompt);
    const seed = Math.floor(Math.random() * 99999);
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhanced)}?width=1024&height=1024&seed=${seed}&nologo=true&enhance=true`;
    setAiResult(url);
    setAiLoading(false);
  }


  async function applySmartEdit() {
    if (!smartPrompt.trim()) return;
    setSmartLoading(true);
    setSmartMessage("");

    // Map natural language to CSS filter adjustments using Claude
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 300,
        messages: [{
          role: "user",
          content: `You are a photo editing AI. Convert this editing instruction into CSS filter values.
Instruction: "${smartPrompt}"

Current values: brightness=${brightness}, contrast=${contrast}, saturation=${saturation}, blur=${blur}

Respond ONLY with valid JSON like this (no explanation):
{"brightness": 110, "contrast": 120, "saturation": 100, "blur": 0, "filter": "sepia(0.3)", "message": "Applied warm vintage look"}

Rules:
- brightness: 50-200 (100=normal)
- contrast: 50-200 (100=normal)  
- saturation: 0-200 (100=normal)
- blur: 0-10
- filter: any additional CSS filter string or empty string ""
- message: friendly 1-sentence description of what was applied`
        }]
      })
    });
    const data = await res.json();
    try {
      const text = data.content?.[0]?.text ?? "{}";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      if (parsed.brightness) setBrightness(parsed.brightness);
      if (parsed.contrast) setContrast(parsed.contrast);
      if (parsed.saturation !== undefined) setSaturation(parsed.saturation);
      if (parsed.blur !== undefined) setBlur(parsed.blur);
      if (parsed.filter !== undefined) setActiveFilter({ name: "Smart", css: parsed.filter });
      setSmartMessage(parsed.message || "Edit applied!");
      setSmartPrompt("");
    } catch {
      setSmartMessage("Could not understand that edit. Try: 'make it brighter' or 'add vintage look'");
    }
    setSmartLoading(false);
  }

  function downloadImage() {
    const plan = typeof window !== "undefined" ? (localStorage.getItem("geenie_plan") || "starter") : "starter";
    const src = activeTab === "AI Generate" ? aiResult : imageSrc;
    if (!src) return;
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;
      const isRotated = rotation % 180 !== 0;
      canvas.width = isRotated ? img.height : img.width;
      canvas.height = isRotated ? img.width : img.height;
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      if (activeTab === "Edit") ctx.filter = filterStyle;
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();
      if (plan === "starter") {
        ctx.font = `bold ${Math.max(16, canvas.width / 30)}px Inter, sans-serif`;
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.shadowBlur = 4;
        ctx.fillText("Made with Geenie AI", 16, canvas.height - 16);
      }
      const link = document.createElement("a");
      link.download = "geenie-photo.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = src;
  }

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6 max-w-4xl mx-auto w-full">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: "var(--gradient-brand)" }}>
          <ImageIcon className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Photo Editor</h1>
          <p className="text-sm text-muted-foreground">Edit · Change background · Generate AI images</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl bg-surface border border-border overflow-hidden">
        {tabs.map((t) => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`flex-1 py-2.5 text-sm font-medium transition ${activeTab === t ? "text-white" : "text-muted-foreground hover:text-foreground"}`}
            style={activeTab === t ? { background: "var(--gradient-brand)" } : undefined}>
            {t}
          </button>
        ))}
      </div>

      {/* ── EDIT TAB ── */}
      {activeTab === "Edit" && (
        <>
          {!imageSrc ? (
            <button onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-surface/50 py-20 hover:border-orange-500/50 transition">
              <div className="flex h-14 w-14 items-center justify-center rounded-full" style={{ background: "var(--gradient-brand)" }}>
                <Upload className="h-6 w-6 text-white" />
              </div>
              <p className="text-sm font-medium">Upload a photo to edit</p>
              <p className="text-xs text-muted-foreground">JPG, PNG, WEBP</p>
            </button>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-4">
              <div className="flex flex-col gap-3">
                <div className="rounded-2xl overflow-hidden bg-black/10 flex items-center justify-center min-h-[300px]">
                  <img src={imageSrc} alt="Editing" style={{ filter: filterStyle, transform: `rotate(${rotation}deg)`, maxHeight: "480px" }} className="max-w-full object-contain transition-all duration-150" />
                </div>
                {musicFile && <div className="flex items-center gap-2 rounded-xl bg-surface border border-border px-3 py-2"><Music className="h-4 w-4 text-orange-400" /><span className="text-xs truncate">{musicName}</span><audio src={musicFile} controls className="h-7 flex-1" /></div>}
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 rounded-xl bg-surface border border-border px-3 py-2 text-sm hover:bg-surface-elevated transition"><RefreshCw className="h-4 w-4" /> New</button>
                  <button onClick={() => setRotation((r) => (r + 90) % 360)} className="flex items-center gap-1.5 rounded-xl bg-surface border border-border px-3 py-2 text-sm hover:bg-surface-elevated transition"><RotateCcw className="h-4 w-4" /> Rotate</button>
                  <button onClick={() => musicInputRef.current?.click()} className="flex items-center gap-1.5 rounded-xl bg-surface border border-border px-3 py-2 text-sm hover:bg-surface-elevated transition"><Music className="h-4 w-4" /> Music</button>
                  <button onClick={downloadImage} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-white transition" style={{ background: "var(--gradient-brand)" }}>
                    <Download className="h-4 w-4" /> {(typeof window !== "undefined" && localStorage.getItem("geenie_plan") === "creator" || typeof window !== "undefined" && localStorage.getItem("geenie_plan") === "studio") ? "Download HD" : "Download (watermarked)"}
                  </button>
                </div>
              </div>
              <div className="glass rounded-2xl p-4 flex flex-col gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Filters</p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {filters.map((f) => (
                      <button key={f.name} onClick={() => setActiveFilter(f)}
                        className={`rounded-lg py-2 text-[10px] font-medium transition ${activeFilter.name === f.name ? "text-white" : "bg-surface border border-border text-muted-foreground"}`}
                        style={activeFilter.name === f.name ? { background: "var(--gradient-brand)" } : undefined}>
                        {f.name}
                      </button>
                    ))}
                  </div>
                </div>
                <SliderControl icon={Sun} label="Brightness" value={brightness} onChange={setBrightness} min={50} max={150} />
                <SliderControl icon={Contrast} label="Contrast" value={contrast} onChange={setContrast} min={50} max={150} />
                <SliderControl icon={Droplet} label="Saturation" value={saturation} onChange={setSaturation} min={0} max={200} />
                <SliderControl icon={Palette} label="Blur" value={blur} onChange={setBlur} min={0} max={10} suffix="px" />
                <button onClick={resetAll} className="flex items-center justify-center gap-2 rounded-xl bg-surface border border-border px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-surface-elevated transition">
                  <RotateCcw className="h-3.5 w-3.5" /> Reset All
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── SMART EDIT TAB ── */}
      {activeTab === "Smart Edit" && (
        <>
          {!imageSrc ? (
            <button onClick={() => { setActiveTab("Edit"); setTimeout(() => fileInputRef.current?.click(), 100); }}
              className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-surface/50 py-20 hover:border-orange-500/50 transition">
              <div className="flex h-14 w-14 items-center justify-center rounded-full" style={{ background: "var(--gradient-brand)" }}>
                <Upload className="h-6 w-6 text-white" />
              </div>
              <p className="text-sm font-medium">Upload a photo first</p>
              <p className="text-xs text-muted-foreground">Go to Edit tab and upload</p>
            </button>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
              <div className="flex flex-col gap-3">
                <div className="rounded-2xl overflow-hidden bg-black/10 flex items-center justify-center min-h-[300px]">
                  <img src={imageSrc} alt="Smart editing" style={{ filter: filterStyle, transform: `rotate(${rotation}deg)`, maxHeight: "480px" }} className="max-w-full object-contain transition-all duration-300" />
                </div>
                <button onClick={downloadImage} className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition" style={{ background: "var(--gradient-brand)" }}>
                  <Download className="h-4 w-4" /> Download
                </button>
              </div>
              <div className="glass rounded-2xl p-4 flex flex-col gap-4">
                <div>
                  <p className="text-sm font-semibold mb-1">✨ Smart Edit</p>
                  <p className="text-xs text-muted-foreground">Type what you want to do in plain English</p>
                </div>
                <div className="flex flex-col gap-2">
                  <textarea value={smartPrompt} onChange={(e) => setSmartPrompt(e.target.value)}
                    placeholder="e.g. make it brighter and more vivid..."
                    className="w-full rounded-xl bg-surface border border-border px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-orange-500"
                    rows={2}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); applySmartEdit(); } }}
                  />
                  <button onClick={applySmartEdit} disabled={smartLoading || !smartPrompt.trim() || !imageSrc}
                    className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50 transition"
                    style={{ background: "var(--gradient-brand)" }}>
                    <Zap className="h-4 w-4" />{smartLoading ? "Applying..." : "Apply Edit"}
                  </button>
                  {smartMessage && (
                    <div className="rounded-xl bg-green-50 border border-green-200 px-3 py-2">
                      <p className="text-xs text-green-700">✅ {smartMessage}</p>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Try these:</p>
                  <div className="flex flex-col gap-1.5">
                    {[
                      "Make it brighter and more vivid",
                      "Add a cinematic dramatic look",
                      "Make it look vintage and warm",
                      "Black and white with high contrast",
                      "Soft dreamy pastel look",
                      "Make skin tones warmer",
                      "Add a cool blue tone",
                      "Make it look professional",
                    ].map((s) => (
                      <button key={s} onClick={() => setSmartPrompt(s)}
                        className="text-left rounded-lg bg-surface border border-border px-3 py-2 text-xs text-muted-foreground hover:bg-surface-elevated hover:text-foreground transition">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={resetAll} className="flex items-center justify-center gap-2 rounded-xl bg-surface border border-border px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-surface-elevated transition">
                  <RotateCcw className="h-3.5 w-3.5" /> Reset All Edits
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── AI GENERATE TAB ── */}
      {activeTab === "AI Generate" && (
        <div className="glass rounded-2xl p-5 flex flex-col gap-4">
          <div className="rounded-xl bg-orange-50 border border-orange-200 p-3">
            <p className="text-xs text-orange-700 font-medium">✨ Type anything — AI will create the image for you. Free, no watermark.</p>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Describe your image</label>
            <textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g. a professional woman working at a laptop in a modern office, warm lighting, photorealistic..."
              className="w-full rounded-xl bg-surface border border-border px-4 py-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-orange-500"
              rows={3} />
          </div>
          <div className="flex flex-wrap gap-2">
            {["Product photo on white background", "LinkedIn headshot, professional", "YouTube thumbnail, dramatic", "Instagram post, aesthetic café"].map((p) => (
              <button key={p} onClick={() => setAiPrompt(p)} className="rounded-full bg-surface border border-border px-3 py-1 text-xs text-muted-foreground hover:bg-surface-elevated transition">{p}</button>
            ))}
          </div>
          <button onClick={generateAI} disabled={aiLoading || !aiPrompt.trim()}
            className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white disabled:opacity-50 transition"
            style={{ background: "var(--gradient-brand)" }}>
            <Sparkles className="h-4 w-4" />{aiLoading ? "Generating... (15-20s)" : "Generate Image"}
          </button>
          {aiLoading && (
            <div className="flex flex-col items-center gap-2 py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
              <p className="text-xs text-muted-foreground">Creating your image...</p>
            </div>
          )}
          {aiResult && !aiLoading && (
            <div className="flex flex-col gap-3">
              <img src={aiResult} alt="AI generated" className="w-full rounded-xl object-cover" />
              <div className="flex gap-2">
                <button onClick={generateAI} className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-surface border border-border px-4 py-2.5 text-sm font-medium hover:bg-surface-elevated transition">
                  <RefreshCw className="h-4 w-4" /> Regenerate
                </button>
                <button onClick={downloadImage} className="flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition" style={{ background: "var(--gradient-brand)" }}>
                  <Download className="h-4 w-4" /> Download
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── BACKGROUND TAB ── */}
      {activeTab === "Background" && (
        <div className="glass rounded-2xl p-5 flex flex-col gap-4">
          <div className="rounded-xl bg-blue-50 border border-blue-200 p-3">
            <p className="text-xs text-blue-700 font-medium">🎨 Choose a background colour or gradient for your photo. Upload your photo first, then pick a background.</p>
          </div>

          {!imageSrc ? (
            <button onClick={() => { setActiveTab("Edit"); setTimeout(() => fileInputRef.current?.click(), 100); }}
              className="flex items-center justify-center gap-2 rounded-xl bg-surface border border-border px-4 py-3 text-sm font-medium hover:bg-surface-elevated transition">
              <Upload className="h-4 w-4" /> Upload Photo First
            </button>
          ) : (
            <>
              {/* Preview with background */}
              <div className="rounded-2xl overflow-hidden flex items-center justify-center min-h-[280px]"
                style={{ background: bg.value || "#f5f5f7" }}>
                <img src={imageSrc} alt="With background" style={{ filter: filterStyle, maxHeight: "260px" }} className="max-w-full object-contain mix-blend-multiply" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Choose Background</p>
                <div className="grid grid-cols-4 gap-2">
                  {backgrounds.map((b) => (
                    <button key={b.name} onClick={() => setBg(b)}
                      className={`rounded-xl h-12 text-xs font-medium transition border-2 ${bg.name === b.name ? "border-orange-500" : "border-transparent"}`}
                      style={{ background: b.value || "#f0f0f0" }}>
                      <span className="drop-shadow-sm" style={{ color: b.value === "#000000" ? "#fff" : "#111" }}>{b.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">💡 Tip: For best results, use a photo with a clear subject. Full background removal coming soon (requires paid API).</p>
              <button onClick={downloadImage} className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white transition" style={{ background: "var(--gradient-brand)" }}>
                <Download className="h-4 w-4" /> Download with Background
              </button>
            </>
          )}
        </div>
      )}

      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
      <input ref={musicInputRef} type="file" accept="audio/*" onChange={handleMusicUpload} className="hidden" />
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

function SliderControl({ icon: Icon, label, value, onChange, min, max, suffix = "%" }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: number; onChange: (v: number) => void;
  min: number; max: number; suffix?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><Icon className="h-3.5 w-3.5" />{label}</span>
        <span className="text-xs text-muted-foreground">{value}{suffix}</span>
      </div>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-orange-500" />
    </div>
  );
}
