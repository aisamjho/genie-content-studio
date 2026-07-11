import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { Upload, Download, Sparkles, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/_authenticated/studios/cartoon")({
  head: () => ({ meta: [{ title: "Cartoon & Comic Style — Geenie AI Studio" }] }),
  component: CartoonStudio,
});

const styles = [
  {
    name: "Disney Pixar",
    emoji: "🏰",
    prompt: "Disney Pixar 3D animated character style, soft rounded features, big expressive eyes, vibrant colors, CGI render, high quality Disney animation",
  },
  {
    name: "Comic Book",
    emoji: "💥",
    prompt: "Marvel DC comic book style illustration, bold black outlines, halftone dots, flat colors, action comic panel, professional comic art",
  },
  {
    name: "Cartoon Network",
    emoji: "📺",
    prompt: "Cartoon Network animation style, simple bold outlines, flat bright colors, fun cartoon character, 2D animation style",
  },
  {
    name: "South Park",
    emoji: "❄️",
    prompt: "South Park cartoon style, simple cut-out paper animation, flat colors, simple face features, comedy cartoon",
  },
  {
    name: "Simpsons",
    emoji: "🍩",
    prompt: "Simpsons cartoon style, yellow skin, overbite, simple round eyes, Springfield animation style, Matt Groening art",
  },
  {
    name: "Manga",
    emoji: "📖",
    prompt: "Japanese manga illustration style, black and white ink, screen tone shading, detailed manga art, shounen manga style",
  },
  {
    name: "Lego",
    emoji: "🧱",
    prompt: "Lego minifigure style, plastic toy character, blocky proportions, yellow Lego face, colorful Lego bricks, 3D render",
  },
  {
    name: "Watercolor Cartoon",
    emoji: "🎨",
    prompt: "Cute watercolor cartoon illustration, soft brush strokes, pastel colors, children's book illustration style, whimsical art",
  },
  {
    name: "3D Animated",
    emoji: "🎬",
    prompt: "High quality 3D animated movie character, subsurface scattering skin, expressive eyes, Dreamworks animation quality",
  },
  {
    name: "Pop Art",
    emoji: "🟡",
    prompt: "Andy Warhol Roy Lichtenstein pop art style, bold primary colors, Ben-Day dots, thick black outlines, 1960s pop art illustration",
  },
  {
    name: "Anime Movie",
    emoji: "🌸",
    prompt: "Studio Ghibli Makoto Shinkai anime movie quality, detailed backgrounds, realistic anime art style, cinematic anime illustration",
  },
  {
    name: "Sticker Art",
    emoji: "⭐",
    prompt: "Cute kawaii sticker art style, white outline border, chibi proportions, glossy sticker effect, adorable character design",
  },
];

const sizes = [
  { label: "Square", w: 1024, h: 1024 },
  { label: "Portrait", w: 768, h: 1024 },
  { label: "Wide", w: 1024, h: 576 },
];

function CartoonStudio() {
  const [style, setStyle] = useState(styles[0]);
  const [size, setSize] = useState(sizes[0]);
  const [customDesc, setCustomDesc] = useState("");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImageSrc(ev.target?.result as string);
      setResultUrl(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  }

  function generate() {
    setLoading(true);
    setResultUrl(null);
    setError(null);

    const seed = Math.floor(Math.random() * 999999);
    const desc = customDesc.trim() ? `, subject: ${customDesc}` : ", portrait character";
    const fullPrompt = `${style.prompt}${desc}, high quality, detailed, professional illustration`;
    const encoded = encodeURIComponent(fullPrompt);
    const url = `https://image.pollinations.ai/prompt/${encoded}?width=${size.w}&height=${size.h}&seed=${seed}&nologo=true&enhance=true`;

    setResultUrl(url);
    const img = new window.Image();
    img.onload = () => setLoading(false);
    img.onerror = () => {
      setError("Generation failed. Please try again.");
      setLoading(false);
    };
    img.src = url;
    setTimeout(() => setLoading(false), 25000);
  }

  function download() {
    if (!resultUrl) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = `geenie-cartoon-${style.name.toLowerCase().replace(/ /g, "-")}.jpg`;
    a.target = "_blank";
    a.click();
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl" style={{ background: "var(--gradient-brand)" }}>
          🎨
        </div>
        <div>
          <h1 className="text-xl font-semibold">Cartoon & Comic Style</h1>
          <p className="text-sm text-muted-foreground">Disney · Pixar · Comics · Manga · Lego · Sticker and more</p>
        </div>
      </div>

      <div className="glass rounded-2xl p-5 flex flex-col gap-5">
        {/* Style grid */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">Choose Style</label>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {styles.map((s) => (
              <button key={s.name} onClick={() => setStyle(s)}
                className={`rounded-xl px-2 py-2.5 text-xs font-medium transition flex flex-col items-center gap-1 ${
                  style.name === s.name ? "text-white" : "bg-surface border border-border text-muted-foreground hover:bg-surface-elevated"
                }`}
                style={style.name === s.name ? { background: "var(--gradient-brand)" } : undefined}>
                <span className="text-lg">{s.emoji}</span>
                <span>{s.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Optional description */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">
            Describe your subject <span className="text-muted-foreground/60">(optional)</span>
          </label>
          <input value={customDesc} onChange={(e) => setCustomDesc(e.target.value)}
            placeholder="e.g. a man with glasses and a beard, or a cat sitting on a chair..."
            className="w-full rounded-xl bg-surface border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500" />
        </div>

        {/* Size */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">Size</label>
          <div className="flex gap-2">
            {sizes.map((sz) => (
              <button key={sz.label} onClick={() => setSize(sz)}
                className={`rounded-xl px-4 py-2 text-xs font-medium transition ${
                  size.label === sz.label ? "text-white" : "bg-surface border border-border text-muted-foreground hover:bg-surface-elevated"
                }`}
                style={size.label === sz.label ? { background: "var(--gradient-brand)" } : undefined}>
                {sz.label}
              </button>
            ))}
          </div>
        </div>

        {/* Preview + Result */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Upload reference */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">
              Reference Photo <span className="text-muted-foreground/60">(optional — for inspiration)</span>
            </label>
            <button onClick={() => fileInputRef.current?.click()}
              className="w-full flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-surface/50 hover:border-orange-500/60 transition min-h-[160px] overflow-hidden">
              {imageSrc
                ? <img src={imageSrc} className="w-full max-h-[160px] object-cover rounded-xl" alt="reference" />
                : <><Upload className="h-6 w-6 text-muted-foreground" /><span className="text-xs text-muted-foreground">Upload reference (optional)</span></>}
            </button>
          </div>

          {/* Result */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Your {style.name} Art</label>
            <div className="w-full rounded-xl border-2 border-dashed border-border bg-surface/50 min-h-[160px] flex items-center justify-center overflow-hidden">
              {loading
                ? <div className="flex flex-col items-center gap-2 p-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
                    <span className="text-xs text-muted-foreground">Creating {style.name} art... (15-25s)</span>
                  </div>
                : resultUrl
                  ? <img src={resultUrl} className="w-full max-h-[220px] object-contain rounded-xl"
                      alt="cartoon result" onError={() => setError("Failed to load. Try again.")} />
                  : <span className="text-xs text-muted-foreground p-4 text-center">Your cartoon art appears here</span>}
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3">
            <p className="text-xs text-red-600">⚠️ {error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={generate} disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white disabled:opacity-50 transition"
            style={{ background: "var(--gradient-brand)" }}>
            <Sparkles className="h-4 w-4" />{loading ? "Generating..." : `Create ${style.name} Art`}
          </button>
          {resultUrl && !loading && (
            <>
              <button onClick={generate}
                className="flex items-center gap-2 rounded-xl bg-surface border border-border px-4 py-3 text-sm font-medium hover:bg-surface-elevated transition">
                <RefreshCw className="h-4 w-4" />
              </button>
              <button onClick={download}
                className="flex items-center gap-2 rounded-xl bg-surface border border-border px-4 py-3 text-sm font-medium hover:bg-surface-elevated transition">
                <Download className="h-4 w-4" />
              </button>
            </>
          )}
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Free · No watermark · Powered by Pollinations AI · 
          <span className="text-orange-500"> Full face-to-cartoon coming with Replicate integration</span>
        </p>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
    </div>
  );
}
