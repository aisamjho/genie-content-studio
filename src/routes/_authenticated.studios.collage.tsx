import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useCallback } from "react";
import { motion } from "motion/react";
import { Upload, Download, LayoutGrid, Trash2, RefreshCw, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/studios/collage")({
  head: () => ({ meta: [{ title: "Collage Maker — Geenie AI Studio" }] }),
  component: CollageMaker,
});

/** Canvas dimensions for the exported collage — 1:1 at 1080px
 *  (Instagram feed standard) or 4:5 portrait. */
const SIZES = {
  "1:1": { w: 1080, h: 1080, label: "Square (1:1)" },
  "4:5": { w: 1080, h: 1350, label: "Portrait (4:5)" },
  "16:9": { w: 1920, h: 1080, label: "Wide (16:9)" },
} as const;
type RatioKey = keyof typeof SIZES;

/** A grid slot definition — (row,col) are 0-indexed cell positions,
 *  (rowSpan,colSpan) let us build non-uniform feature-photo layouts. */
interface Slot {
  row: number; col: number; rowSpan: number; colSpan: number;
}

/** A named layout template. totalCols/totalRows define the grid dimensions;
 *  slots tell us what cells exist and their span. */
interface Layout {
  id: string;
  name: string;
  emoji: string;
  totalRows: number;
  totalCols: number;
  slots: Slot[];
}

const LAYOUTS: Layout[] = [
  {
    id: "grid2x2",
    name: "2×2 Grid",
    emoji: "⊞",
    totalRows: 2, totalCols: 2,
    slots: [
      { row: 0, col: 0, rowSpan: 1, colSpan: 1 },
      { row: 0, col: 1, rowSpan: 1, colSpan: 1 },
      { row: 1, col: 0, rowSpan: 1, colSpan: 1 },
      { row: 1, col: 1, rowSpan: 1, colSpan: 1 },
    ],
  },
  {
    id: "feature-right",
    name: "Feature Right",
    emoji: "▦",
    totalRows: 2, totalCols: 3,
    slots: [
      { row: 0, col: 0, rowSpan: 1, colSpan: 1 },
      { row: 1, col: 0, rowSpan: 1, colSpan: 1 },
      { row: 0, col: 1, rowSpan: 2, colSpan: 2 },
    ],
  },
  {
    id: "feature-left",
    name: "Feature Left",
    emoji: "▧",
    totalRows: 2, totalCols: 3,
    slots: [
      { row: 0, col: 0, rowSpan: 2, colSpan: 2 },
      { row: 0, col: 2, rowSpan: 1, colSpan: 1 },
      { row: 1, col: 2, rowSpan: 1, colSpan: 1 },
    ],
  },
  {
    id: "strip3",
    name: "Strip (3)",
    emoji: "▬",
    totalRows: 1, totalCols: 3,
    slots: [
      { row: 0, col: 0, rowSpan: 1, colSpan: 1 },
      { row: 0, col: 1, rowSpan: 1, colSpan: 1 },
      { row: 0, col: 2, rowSpan: 1, colSpan: 1 },
    ],
  },
  {
    id: "trio",
    name: "Trio",
    emoji: "⊟",
    totalRows: 2, totalCols: 2,
    slots: [
      { row: 0, col: 0, rowSpan: 1, colSpan: 2 },
      { row: 1, col: 0, rowSpan: 1, colSpan: 1 },
      { row: 1, col: 1, rowSpan: 1, colSpan: 1 },
    ],
  },
  {
    id: "grid3x2",
    name: "6-Photo Grid",
    emoji: "⊞",
    totalRows: 2, totalCols: 3,
    slots: [
      { row: 0, col: 0, rowSpan: 1, colSpan: 1 },
      { row: 0, col: 1, rowSpan: 1, colSpan: 1 },
      { row: 0, col: 2, rowSpan: 1, colSpan: 1 },
      { row: 1, col: 0, rowSpan: 1, colSpan: 1 },
      { row: 1, col: 1, rowSpan: 1, colSpan: 1 },
      { row: 1, col: 2, rowSpan: 1, colSpan: 1 },
    ],
  },
];

const BORDER_COLORS = ["#ffffff", "#000000", "#f7277e", "#6366f1", "#10b981", "transparent"];
const FILTERS = [
  { name: "None", css: "" },
  { name: "B&W", css: "grayscale(1)" },
  { name: "Vintage", css: "sepia(0.5) contrast(1.1)" },
  { name: "Vivid", css: "saturate(1.6) contrast(1.1)" },
  { name: "Matte", css: "contrast(0.9) brightness(1.1) saturate(0.7)" },
];

function CollageMaker() {
  const navigate = useNavigate();
  const [layout, setLayout] = useState<Layout>(LAYOUTS[0]);
  const [ratio, setRatio] = useState<RatioKey>("1:1");
  const [images, setImages] = useState<(string | null)[]>(Array(LAYOUTS[0].slots.length).fill(null));
  const [borderSize, setBorderSize] = useState(8);
  const [borderColor, setBorderColor] = useState("#ffffff");
  const [activeFilter, setActiveFilter] = useState(FILTERS[0]);
  const [plan, setPlan] = useState("starter");
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRefs = useRef<(HTMLInputElement | null)[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Read plan from localStorage in useEffect (SSR-safe, reactive to upgrades)
  // Previously this was a lazy useState — meaning if a user upgraded mid-session
  // the watermark would persist until page reload.
  useEffect(() => {
    if (typeof window !== "undefined") {
      setPlan(localStorage.getItem("geenie_plan") ?? "starter");
    }
  }, []);

  const isPaid = plan === "creator" || plan === "studio";
  const size = SIZES[ratio];

  function switchLayout(l: Layout) {
    setLayout(l);
    setImages(Array(l.slots.length).fill(null));
    // Clear all file input values so re-clicking a cell after a layout
    // switch doesn't retain the previously selected file.
    fileRefs.current.forEach((ref) => { if (ref) ref.value = ""; });
    fileRefs.current = [];
  }

  function handleFileUpload(slotIndex: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImages((imgs) => {
        const updated = [...imgs];
        updated[slotIndex] = ev.target?.result as string;
        return updated;
      });
    };
    reader.readAsDataURL(file);
  }

  function removeImage(idx: number) {
    setImages((imgs) => { const u = [...imgs]; u[idx] = null; return u; });
  }

  /** Renders the full collage onto the hidden canvas and downloads it.
   *  Each photo is cover-fit into its grid cell, border drawn around it,
   *  and the chosen CSS filter applied to every image uniformly. */
  const downloadCollage = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = size.w;
    canvas.height = size.h;
    setDownloading(true);
    setError(null);

    const gap = borderSize;
    const outerPad = borderSize;
    const totalCols = layout.totalCols;
    const totalRows = layout.totalRows;
    const innerW = size.w - outerPad * 2;
    const innerH = size.h - outerPad * 2;
    const cellW = (innerW - gap * (totalCols - 1)) / totalCols;
    const cellH = (innerH - gap * (totalRows - 1)) / totalRows;

    // Background
    ctx.fillStyle = borderColor === "transparent" ? "#ffffff" : borderColor;
    ctx.fillRect(0, 0, size.w, size.h);

    try {
      for (let i = 0; i < layout.slots.length; i++) {
        const slot = layout.slots[i];
        const x = outerPad + slot.col * (cellW + gap);
        const y = outerPad + slot.row * (cellH + gap);
        const w = cellW * slot.colSpan + gap * (slot.colSpan - 1);
        const h = cellH * slot.rowSpan + gap * (slot.rowSpan - 1);

        if (images[i]) {
          const img = await new Promise<HTMLImageElement>((resolve, reject) => {
            const el = new window.Image();
            el.onload = () => resolve(el);
            el.onerror = reject;
            el.src = images[i]!;
          });
          ctx.save();
          ctx.beginPath();
          ctx.rect(x, y, w, h);
          ctx.clip();
          if (activeFilter.css) ctx.filter = activeFilter.css;
          // Cover-fit: scale image to fill cell without stretching
          const scale = Math.max(w / img.width, h / img.height);
          const dw = img.width * scale, dh = img.height * scale;
          ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
          ctx.filter = "none";
          ctx.restore();
        } else {
          ctx.fillStyle = "#f0f0f5";
          ctx.fillRect(x, y, w, h);
          ctx.fillStyle = "#aaaaaa";
          ctx.font = `${Math.round(Math.min(w, h) * 0.12)}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(`Photo ${i + 1}`, x + w / 2, y + h / 2);
        }
      }

      if (!isPaid) {
        const wm = "Made with Geenie AI";
        const wmSize = Math.round(size.w / 45);
        ctx.font = `bold ${wmSize}px sans-serif`;
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
        // Shadow for legibility on any background
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.shadowBlur = 4;
        ctx.fillStyle = "rgba(255,255,255,0.75)";
        ctx.fillText(wm, outerPad + 8, size.h - outerPad - 8);
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
      }

      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = "geenie-collage.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      setError("Could not export the collage. Make sure photos are uploaded.");
    } finally {
      setDownloading(false);
    }
  }, [layout, images, size, borderSize, borderColor, activeFilter, isPaid]);

  const grad = { background: "var(--gradient-brand)" };
  const filledCount = images.filter(Boolean).length;

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate({ to: "/dashboard" })} className="text-xs text-muted-foreground hover:text-foreground transition mr-1">← Back</button>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={grad}><LayoutGrid className="h-5 w-5 text-white" /></div>
        <div>
          <h1 className="text-xl font-semibold">Collage Maker</h1>
          <p className="text-sm text-muted-foreground">Multi-photo layouts for Instagram, Stories, and mood boards</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
        {/* Left — collage preview */}
        <div className="flex flex-col gap-3">
          {/* Format picker */}
          <div className="flex gap-2 flex-wrap">
            {(Object.keys(SIZES) as RatioKey[]).map((r) => (
              <button key={r} onClick={() => setRatio(r)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${ratio === r ? "text-white" : "bg-surface border border-border text-muted-foreground"}`}
                style={ratio === r ? grad : undefined}>{SIZES[r].label}</button>
            ))}
          </div>

          {/* Live grid preview */}
          <div className="rounded-2xl overflow-hidden bg-surface border border-border"
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${layout.totalCols}, 1fr)`,
              gridTemplateRows: `repeat(${layout.totalRows}, 1fr)`,
              gap: `${Math.max(2, borderSize * 0.3)}px`,
              padding: `${Math.max(4, borderSize * 0.3)}px`,
              background: borderColor === "transparent" ? "#f5f5f7" : borderColor,
              aspectRatio: ratio === "1:1" ? "1/1" : ratio === "4:5" ? "4/5" : "16/9",
            }}>
            {layout.slots.map((slot, i) => (
              <div key={i}
                className="relative overflow-hidden rounded-sm cursor-pointer group"
                style={{
                  gridColumn: `${slot.col + 1} / span ${slot.colSpan}`,
                  gridRow: `${slot.row + 1} / span ${slot.rowSpan}`,
                  minHeight: "60px",
                  background: images[i] ? undefined : "#e8e8ed",
                }}
                onClick={() => fileRefs.current[i]?.click()}
              >
                {images[i] ? (
                  <>
                    <img src={images[i]!} alt={`slot ${i}`}
                      className="w-full h-full object-cover"
                      style={{ filter: activeFilter.css }} />
                    <button onPointerDown={(e) => { e.stopPropagation(); removeImage(i); }}
                      className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/60 text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition">×</button>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-muted-foreground/50">
                    <Upload className="h-5 w-5" />
                    <span className="text-[9px] font-medium">Photo {i + 1}</span>
                  </div>
                )}
                <input ref={(el) => { fileRefs.current[i] = el; }} type="file" accept="image/*"
                  className="hidden" onChange={(e) => handleFileUpload(i, e)} />
              </div>
            ))}
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-3 py-2.5">
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            <button onClick={() => switchLayout(layout)}
              className="flex items-center gap-1.5 rounded-xl bg-surface border border-border px-3 py-2.5 text-sm font-medium hover:bg-surface-elevated transition">
              <RefreshCw className="h-4 w-4" /> Clear All
            </button>
            <motion.button whileTap={{ scale: 0.97 }} onClick={downloadCollage} disabled={downloading || filledCount === 0}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50 transition" style={grad}>
              <Download className="h-4 w-4" />
              {downloading ? "Exporting..." : filledCount === 0 ? "Upload photos first" : filledCount < layout.slots.length ? `Download (${filledCount}/${layout.slots.length} photos)` : isPaid ? "Download HD" : "Download (watermarked)"}
            </motion.button>
          </div>
          {!isPaid && <p className="text-[11px] text-center text-muted-foreground">Free plan adds a small watermark · <a href="/#pricing" className="text-orange-500 font-medium hover:underline">Upgrade to remove →</a></p>}
        </div>

        {/* Right — controls */}
        <div className="glass rounded-2xl p-4 flex flex-col gap-5">
          <div>
            <p className="text-xs font-semibold mb-2">Layout</p>
            <div className="grid grid-cols-2 gap-2">
              {LAYOUTS.map((l) => (
                <button key={l.id} onClick={() => switchLayout(l)}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition ${layout.id === l.id ? "text-white" : "bg-surface border border-border text-muted-foreground hover:bg-surface-elevated"}`}
                  style={layout.id === l.id ? grad : undefined}>
                  <span className="text-base">{l.emoji}</span>{l.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold mb-2">Filter</p>
            <div className="grid grid-cols-2 gap-1.5">
              {FILTERS.map((f) => (
                <button key={f.name} onClick={() => setActiveFilter(f)}
                  className={`rounded-lg py-1.5 text-xs font-medium transition ${activeFilter.name === f.name ? "text-white" : "bg-surface border border-border text-muted-foreground"}`}
                  style={activeFilter.name === f.name ? grad : undefined}>{f.name}</button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1.5">
              <p className="text-xs font-semibold">Border / Gap</p>
              <span className="text-xs text-muted-foreground">{borderSize}px</span>
            </div>
            <input type="range" min={0} max={40} value={borderSize} onChange={(e) => setBorderSize(Number(e.target.value))} className="w-full accent-orange-500" />
          </div>

          <div>
            <p className="text-xs font-semibold mb-2">Border Colour</p>
            <div className="flex gap-2 flex-wrap">
              {BORDER_COLORS.map((c) => (
                <button key={c} onClick={() => setBorderColor(c)}
                  className={`h-8 w-8 rounded-full border-2 transition ${borderColor === c ? "border-orange-500 scale-110" : "border-border"}`}
                  style={{ background: c === "transparent" ? "repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 0 0 / 8px 8px" : c }} />
              ))}
              <input type="color" value={borderColor.startsWith("#") ? borderColor : "#ffffff"}
                onChange={(e) => setBorderColor(e.target.value)}
                className="h-8 w-8 rounded-full border border-border cursor-pointer" title="Custom colour" />
            </div>
          </div>

          <div className="glass rounded-xl p-3 text-xs text-muted-foreground">
            <p className="font-medium mb-1">💡 Tips</p>
            <ul className="space-y-1 text-[11px]">
              <li>• Tap any cell to upload a photo</li>
              <li>• Photos auto fit (cover) each cell</li>
              <li>• Set border to 0 for a seamless look</li>
              <li>• Use white border for a polaroid feel</li>
            </ul>
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
