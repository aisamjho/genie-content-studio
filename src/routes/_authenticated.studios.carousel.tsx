import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect, useCallback } from "react";
import { Plus, Trash2, Download, ChevronLeft, ChevronRight, Copy, Upload, Sparkles, Layers, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/studios/carousel")({
  head: () => ({ meta: [{ title: "Carousel Post Maker — Geenie AI Studio" }] }),
  component: CarouselStudio,
});

type BgType = "gradient" | "color" | "image" | "ai";

interface Slide {
  id: string;
  bgType: BgType;
  bgValue: string;      // gradient css / hex color
  imageUrl: string | null; // uploaded or AI-generated image
  heading: string;
  body: string;
  align: "left" | "center";
  textColor: "light" | "dark";
  showNumber: boolean;
}

const gradients = [
  "linear-gradient(135deg,#ff5a1f,#f7277e)",
  "linear-gradient(135deg,#7b2ff7,#f107a3)",
  "linear-gradient(135deg,#0f2027,#2c5364)",
  "linear-gradient(135deg,#11998e,#38ef7d)",
  "linear-gradient(135deg,#f7971e,#ffd200)",
  "linear-gradient(135deg,#1a2a6c,#b21f1f)",
  "linear-gradient(135deg,#360033,#0b8793)",
  "linear-gradient(135deg,#ee0979,#ff6a00)",
];
const solidColors = ["#0f172a", "#1a1a2e", "#ffffff", "#fff5f0", "#0c4a3e", "#3d1a52"];

const templates: { name: string; slides: Partial<Slide>[] }[] = [
  {
    name: "Quote",
    slides: [
      { heading: "\"Your quote goes here\"", body: "— Attribution", align: "center", bgType: "gradient", bgValue: gradients[0] },
    ],
  },
  {
    name: "5 Tips",
    slides: [
      { heading: "5 Tips for", body: "Swipe to see all →", align: "left", bgType: "gradient", bgValue: gradients[2] },
      { heading: "Tip 1", body: "Write your first tip here", align: "left", bgType: "gradient", bgValue: gradients[2] },
      { heading: "Tip 2", body: "Write your second tip here", align: "left", bgType: "gradient", bgValue: gradients[2] },
      { heading: "Tip 3", body: "Write your third tip here", align: "left", bgType: "gradient", bgValue: gradients[2] },
      { heading: "Follow for more!", body: "@youraccount", align: "center", bgType: "gradient", bgValue: gradients[2] },
    ],
  },
  {
    name: "Before/After",
    slides: [
      { heading: "BEFORE", body: "Describe the before state", align: "center", bgType: "color", bgValue: "#1a1a2e" },
      { heading: "AFTER", body: "Describe the after state", align: "center", bgType: "gradient", bgValue: gradients[3] },
    ],
  },
];

function newSlide(overrides: Partial<Slide> = {}): Slide {
  return {
    id: Math.random().toString(36).slice(2),
    bgType: "gradient",
    bgValue: gradients[0],
    imageUrl: null,
    heading: "",
    body: "",
    align: "center",
    textColor: "light",
    showNumber: true,
    ...overrides,
  };
}

const SIZES = { "1:1": { w: 1080, h: 1080, label: "Square" }, "4:5": { w: 1080, h: 1350, label: "Portrait" } };

function CarouselStudio() {
  const navigate = useNavigate();
  const [slides, setSlides] = useState<Slide[]>([newSlide({ heading: "Swipe for more →", body: "Add your content here", bgValue: gradients[0] })]);
  const [active, setActive] = useState(0);
  const [ratio, setRatio] = useState<"1:1" | "4:5">("4:5");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiBgError, setAiBgError] = useState<string | null>(null);
  const aiRequestIdRef = useRef(0);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [plan, setPlan] = useState("starter");
  const fileRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => { setPlan(localStorage.getItem("geenie_plan") || "starter"); }, []);
  const isPaid = plan === "creator" || plan === "studio";

  const slide = slides[active];
  const size = SIZES[ratio];

  function updateSlide(patch: Partial<Slide>) {
    setSlides((s) => s.map((sl, i) => (i === active ? { ...sl, ...patch } : sl)));
  }

  function addSlide() {
    if (slides.length >= 10) return;
    setSlides((s) => [...s, newSlide({ bgValue: gradients[s.length % gradients.length] })]);
    setActive(slides.length);
  }

  function duplicateSlide() {
    if (slides.length >= 10) return;
    const copy = { ...slide, id: Math.random().toString(36).slice(2) };
    setSlides((s) => { const arr = [...s]; arr.splice(active + 1, 0, copy); return arr; });
    setActive(active + 1);
  }

  function removeSlide(i: number) {
    if (slides.length <= 1) return;
    setSlides((s) => s.filter((_, idx) => idx !== i));
    setActive((a) => Math.max(0, a >= i ? a - 1 : a));
  }

  function moveSlide(dir: -1 | 1) {
    const j = active + dir;
    if (j < 0 || j >= slides.length) return;
    setSlides((s) => { const arr = [...s]; [arr[active], arr[j]] = [arr[j], arr[active]]; return arr; });
    setActive(j);
  }

  function applyTemplate(t: typeof templates[0]) {
    setSlides(t.slides.map((s) => newSlide(s)));
    setActive(0);
  }

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => updateSlide({ bgType: "image", imageUrl: ev.target?.result as string });
    reader.readAsDataURL(file);
  }

  async function generateAIBg() {
    if (!aiPrompt.trim()) return;
    const myId = ++aiRequestIdRef.current;

    setAiLoading(true);
    setAiBgError(null);
    const seed = Math.floor(Math.random() * 999999);
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(aiPrompt + ", background, no text, high quality")}?width=1024&height=1280&seed=${seed}&nologo=true`;
    const img = new window.Image();
    img.onload = () => {
      if (aiRequestIdRef.current !== myId) return;
      updateSlide({ bgType: "ai", imageUrl: url });
      setAiLoading(false);
    };
    img.onerror = () => {
      if (aiRequestIdRef.current !== myId) return;
      setAiLoading(false);
      setAiBgError("Background generation failed. Please try again.");
    };
    img.src = url;
    setTimeout(() => {
      if (aiRequestIdRef.current !== myId) return;
      setAiLoading(false);
      setAiBgError("This is taking longer than expected. Please try again.");
    }, 25000);
  }

  /** Renders a single slide to an offscreen canvas and returns a PNG data URL. */
  const renderSlide = useCallback((sl: Slide, index: number, total: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = canvasRef.current;
      if (!canvas) return reject(new Error("Canvas not available"));
      canvas.width = size.w;
      canvas.height = size.h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas context unavailable"));

      const drawTextAndFinish = () => {
        const padding = size.w * 0.08;
        const textColor = sl.textColor === "light" ? "#ffffff" : "#0f172a";
        ctx.textAlign = sl.align === "center" ? "center" : "left";
        const tx = sl.align === "center" ? size.w / 2 : padding;
        const maxWidth = sl.align === "center" ? size.w - padding * 2 : size.w - padding * 1.6;

        let y = size.h * 0.42;
        if (sl.heading) {
          ctx.font = `bold ${Math.round(size.w / 13)}px sans-serif`;
          ctx.fillStyle = textColor;
          y = wrapText(ctx, sl.heading, tx, y, maxWidth, size.w / 11) + size.w * 0.03;
        }
        if (sl.body) {
          ctx.font = `${Math.round(size.w / 24)}px sans-serif`;
          ctx.fillStyle = textColor;
          wrapText(ctx, sl.body, tx, y, maxWidth, size.w / 20);
        }
        if (sl.showNumber && total > 1) {
          ctx.font = `600 ${Math.round(size.w / 32)}px sans-serif`;
          ctx.textAlign = "right";
          ctx.fillStyle = textColor;
          ctx.globalAlpha = 0.85;
          ctx.fillText(`${index + 1}/${total}`, size.w - padding * 0.6, padding);
          ctx.globalAlpha = 1;
        }
        if (!isPaid) {
          ctx.font = `500 ${Math.round(size.w / 45)}px sans-serif`;
          ctx.textAlign = "left";
          ctx.fillStyle = textColor;
          ctx.globalAlpha = 0.55;
          ctx.fillText("Made with Geenie AI", padding * 0.6, size.h - padding * 0.5);
          ctx.globalAlpha = 1;
        }
        resolve(canvas.toDataURL("image/png"));
      };

      if (sl.bgType === "color") {
        ctx.fillStyle = sl.bgValue;
        ctx.fillRect(0, 0, size.w, size.h);
        drawTextAndFinish();
      } else if (sl.bgType === "gradient") {
        const grad = parseGradient(ctx, sl.bgValue, size.w, size.h);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, size.w, size.h);
        drawTextAndFinish();
      } else if ((sl.bgType === "image" || sl.bgType === "ai") && sl.imageUrl) {
        const img = new window.Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          // cover-fit
          const scale = Math.max(size.w / img.width, size.h / img.height);
          const dw = img.width * scale, dh = img.height * scale;
          ctx.drawImage(img, (size.w - dw) / 2, (size.h - dh) / 2, dw, dh);
          // dark overlay for text legibility
          ctx.fillStyle = "rgba(0,0,0,0.35)";
          ctx.fillRect(0, 0, size.w, size.h);
          drawTextAndFinish();
        };
        img.onerror = () => reject(new Error("Failed to load background image"));
        img.src = sl.imageUrl;
      } else {
        ctx.fillStyle = "#1a1a2e";
        ctx.fillRect(0, 0, size.w, size.h);
        drawTextAndFinish();
      }
    });
  }, [size, isPaid]);

  async function downloadCurrent() {
    setDownloadError(null);
    try {
      const dataUrl = await renderSlide(slide, active, slides.length);
      triggerDownload(dataUrl, `geenie-carousel-slide-${active + 1}.png`);
    } catch {
      setDownloadError("Couldn't render this slide. Please try again.");
    }
  }

  async function downloadAll() {
    setDownloading(true);
    setDownloadError(null);
    try {
      for (let i = 0; i < slides.length; i++) {
        const dataUrl = await renderSlide(slides[i], i, slides.length);
        triggerDownload(dataUrl, `geenie-carousel-slide-${i + 1}.png`);
        await new Promise((r) => setTimeout(r, 350)); // avoid browser blocking rapid downloads
      }
    } catch {
      setDownloadError("Some slides failed to export. Please try downloading them individually.");
    } finally {
      setDownloading(false);
    }
  }

  function triggerDownload(dataUrl: string, filename: string) {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  const grad = { background: "var(--gradient-brand)" };
  const previewAspect = ratio === "1:1" ? "aspect-square" : "aspect-[4/5]";

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6 max-w-4xl mx-auto w-full">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate({ to: "/dashboard" })} className="text-xs text-muted-foreground hover:text-foreground transition mr-1">← Back</button>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={grad}><Layers className="h-5 w-5 text-white" /></div>
        <div>
          <h1 className="text-xl font-semibold">Carousel Post Maker</h1>
          <p className="text-sm text-muted-foreground">Multi-slide Instagram carousels — quotes, tips, before/after</p>
        </div>
      </div>

      {/* Templates */}
      <div className="flex gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground self-center mr-1">Quick start:</span>
        {templates.map((t) => (
          <button key={t.name} onClick={() => applyTemplate(t)}
            className="rounded-full bg-surface border border-border px-3 py-1.5 text-xs font-medium hover:bg-surface-elevated transition flex items-center gap-1">
            {t.name === "Quote" && <span className="text-[9px]" title="Trending">🔥</span>}
            {t.name}
          </button>
        ))}
        <div className="flex gap-1 ml-auto">
          {(["1:1", "4:5"] as const).map((r) => (
            <button key={r} onClick={() => setRatio(r)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${ratio === r ? "text-white" : "bg-surface border border-border text-muted-foreground"}`}
              style={ratio === r ? grad : undefined}>{SIZES[r].label}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
        {/* Preview */}
        <div className="flex flex-col gap-3">
          <div className={`relative rounded-2xl overflow-hidden mx-auto w-full max-w-[340px] ${previewAspect}`}
            style={{
              background: slide.bgType === "gradient" ? slide.bgValue : slide.bgType === "color" ? slide.bgValue : "#1a1a2e",
            }}>
            {(slide.bgType === "image" || slide.bgType === "ai") && slide.imageUrl && (
              <>
                <img src={slide.imageUrl} alt="slide bg" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/35" />
              </>
            )}
            <div className={`relative h-full flex flex-col justify-center p-8 ${slide.align === "center" ? "items-center text-center" : "items-start text-left"}`}>
              {slide.heading && <p className="font-bold text-2xl leading-tight" style={{ color: slide.textColor === "light" ? "#fff" : "#0f172a" }}>{slide.heading}</p>}
              {slide.body && <p className="mt-3 text-sm leading-relaxed opacity-90" style={{ color: slide.textColor === "light" ? "#fff" : "#0f172a" }}>{slide.body}</p>}
            </div>
            {slide.showNumber && slides.length > 1 && (
              <span className="absolute top-3 right-4 text-xs font-semibold opacity-85" style={{ color: slide.textColor === "light" ? "#fff" : "#0f172a" }}>
                {active + 1}/{slides.length}
              </span>
            )}
          </div>

          {/* Slide navigator */}
          <div className="flex items-center justify-center gap-2">
            <button onClick={() => setActive((a) => Math.max(0, a - 1))} disabled={active === 0}
              className="rounded-lg bg-surface border border-border p-1.5 disabled:opacity-30 hover:bg-surface-elevated transition"><ChevronLeft className="h-4 w-4" /></button>
            <div className="flex gap-1.5 overflow-x-auto max-w-[220px] px-1">
              {slides.map((s, i) => (
                <button key={s.id} onClick={() => setActive(i)}
                  className={`h-2 w-2 rounded-full shrink-0 transition ${i === active ? "bg-orange-500 w-5" : "bg-border"}`} />
              ))}
            </div>
            <button onClick={() => setActive((a) => Math.min(slides.length - 1, a + 1))} disabled={active === slides.length - 1}
              className="rounded-lg bg-surface border border-border p-1.5 disabled:opacity-30 hover:bg-surface-elevated transition"><ChevronRight className="h-4 w-4" /></button>
          </div>
          <p className="text-xs text-center text-muted-foreground">Slide {active + 1} of {slides.length} · max 10</p>

          {downloadError && (
            <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-3 py-2.5">
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-600">{downloadError}</p>
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={downloadCurrent} disabled={downloading}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-surface-elevated transition disabled:opacity-50 bg-surface border border-border`}>
              <Download className="h-4 w-4" />This slide
            </button>
            <button onClick={downloadAll} disabled={downloading}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition disabled:opacity-50" style={grad}>
              <Download className="h-4 w-4" />{downloading ? "Exporting..." : `Download all ${slides.length}`}
            </button>
          </div>
          {!isPaid && <p className="text-[11px] text-center text-muted-foreground">Free plan adds a small watermark · <a href="/#pricing" className="text-orange-500 font-medium hover:underline">Upgrade to remove</a></p>}
        </div>

        {/* Editor panel */}
        <div className="glass rounded-2xl p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Slide {active + 1}</p>
            <div className="flex gap-1">
              <button onClick={() => moveSlide(-1)} disabled={active === 0} className="rounded-lg bg-surface border border-border p-1.5 disabled:opacity-30 hover:bg-surface-elevated transition" title="Move left"><ChevronLeft className="h-3.5 w-3.5" /></button>
              <button onClick={() => moveSlide(1)} disabled={active === slides.length - 1} className="rounded-lg bg-surface border border-border p-1.5 disabled:opacity-30 hover:bg-surface-elevated transition" title="Move right"><ChevronRight className="h-3.5 w-3.5" /></button>
              <button onClick={duplicateSlide} disabled={slides.length >= 10} className="rounded-lg bg-surface border border-border p-1.5 disabled:opacity-30 hover:bg-surface-elevated transition" title="Duplicate"><Copy className="h-3.5 w-3.5" /></button>
              <button onClick={() => removeSlide(active)} disabled={slides.length <= 1} className="rounded-lg bg-surface border border-border p-1.5 disabled:opacity-30 hover:bg-red-50 hover:text-red-500 transition" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Heading</label>
            <input value={slide.heading} onChange={(e) => updateSlide({ heading: e.target.value })}
              placeholder="Big bold text..." className="w-full rounded-xl bg-surface border border-border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Body text</label>
            <textarea value={slide.body} onChange={(e) => updateSlide({ body: e.target.value })}
              placeholder="Supporting text..." rows={2}
              className="w-full rounded-xl bg-surface border border-border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-orange-500" />
          </div>

          <div className="flex gap-2">
            <button onClick={() => updateSlide({ align: "left" })} className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition ${slide.align === "left" ? "text-white" : "bg-surface border border-border text-muted-foreground"}`} style={slide.align === "left" ? grad : undefined}>Left</button>
            <button onClick={() => updateSlide({ align: "center" })} className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition ${slide.align === "center" ? "text-white" : "bg-surface border border-border text-muted-foreground"}`} style={slide.align === "center" ? grad : undefined}>Center</button>
            <button onClick={() => updateSlide({ textColor: slide.textColor === "light" ? "dark" : "light" })} className="flex-1 rounded-lg py-1.5 text-xs font-medium bg-surface border border-border text-muted-foreground hover:bg-surface-elevated transition">
              {slide.textColor === "light" ? "White text" : "Dark text"}
            </button>
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">Background</p>
            <div className="grid grid-cols-4 gap-1.5 mb-2">
              {gradients.map((g) => (
                <button key={g} onClick={() => updateSlide({ bgType: "gradient", bgValue: g, imageUrl: null })}
                  className={`h-8 rounded-lg border-2 transition ${slide.bgType === "gradient" && slide.bgValue === g ? "border-orange-500" : "border-transparent"}`}
                  style={{ background: g }} />
              ))}
            </div>
            <div className="grid grid-cols-6 gap-1.5 mb-2">
              {solidColors.map((c) => (
                <button key={c} onClick={() => updateSlide({ bgType: "color", bgValue: c, imageUrl: null })}
                  className={`h-7 rounded-lg border-2 transition ${slide.bgType === "color" && slide.bgValue === c ? "border-orange-500" : "border-border"}`}
                  style={{ background: c }} />
              ))}
            </div>
            <button onClick={() => fileRef.current?.click()}
              className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-surface border border-border py-1.5 text-xs font-medium hover:bg-surface-elevated transition mb-2">
              <Upload className="h-3.5 w-3.5" />Upload photo
            </button>
            <div className="flex gap-1.5">
              <input value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="AI background, e.g. sunset city"
                className="flex-1 rounded-lg bg-surface border border-border px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500" />
              <button onClick={generateAIBg} disabled={aiLoading || !aiPrompt.trim()}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50 shrink-0" style={grad}>
                <Sparkles className="h-3.5 w-3.5" />
              </button>
            </div>
            {aiLoading && <p className="text-[11px] text-muted-foreground mt-1.5">Generating... (15-20s)</p>}
            {aiBgError && <p className="text-[11px] text-red-600 bg-red-50 rounded-lg px-2 py-1.5 mt-1.5">⚠️ {aiBgError}</p>}
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={slide.showNumber} onChange={(e) => updateSlide({ showNumber: e.target.checked })} className="accent-orange-500" />
            <span className="text-xs text-muted-foreground">Show slide number (1/{slides.length})</span>
          </label>

          <button onClick={addSlide} disabled={slides.length >= 10}
            className="flex items-center justify-center gap-2 rounded-xl bg-surface border border-dashed border-border py-2.5 text-sm font-medium text-muted-foreground hover:bg-surface-elevated transition disabled:opacity-40">
            <Plus className="h-4 w-4" />Add Slide ({slides.length}/10)
          </button>
        </div>
      </div>

      <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

/** Wraps text on a canvas context and returns the y position after the last line. */
function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number): number {
  const paragraphs = text.split("\n");
  let curY = y;
  for (const para of paragraphs) {
    const words = para.split(" ");
    let line = "";
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        ctx.fillText(line, x, curY);
        line = word;
        curY += lineHeight;
      } else {
        line = test;
      }
    }
    if (line) { ctx.fillText(line, x, curY); curY += lineHeight; }
  }
  return curY;
}

/** Converts a CSS linear-gradient(...) string into a canvas gradient. Falls back to solid color on parse failure. */
function parseGradient(ctx: CanvasRenderingContext2D, css: string, w: number, h: number): string | CanvasGradient {
  try {
    const match = css.match(/linear-gradient\(([\d.]+)deg,\s*(#[0-9a-fA-F]{3,6}),\s*(#[0-9a-fA-F]{3,6})\)/);
    if (!match) return "#1a1a2e";
    const [, , c1, c2] = match;
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, c1);
    grad.addColorStop(1, c2);
    return grad;
  } catch {
    return "#1a1a2e";
  }
}
