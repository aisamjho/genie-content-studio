import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Palette, Sparkles, Download, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/_authenticated/studios/logo")({
  head: () => ({ meta: [{ title: "Logo & Poster Studio — Geenie AI Studio" }] }),
  component: LogoPosterStudio,
});

const modes = ["Logo", "Poster", "Banner", "Flyer", "Cover Art"];

const logoStyles = ["Minimalist", "Modern", "Vintage", "Bold", "Elegant", "Playful", "Tech", "Luxury"];
const colorPalettes = [
  { label: "Purple & Gold", colors: "purple and gold" },
  { label: "Blue & White", colors: "blue and white" },
  { label: "Black & Red", colors: "black and red" },
  { label: "Green & Natural", colors: "green and earthy tones" },
  { label: "Pink & Coral", colors: "pink and coral" },
  { label: "Dark Neon", colors: "dark background with neon accents" },
];

async function callClaude(prompt: string): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 150,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await res.json();
  return data.content?.[0]?.text ?? "";
}

function LogoPosterStudio() {
  const [mode, setMode] = useState("Logo");
  const [brandName, setBrandName] = useState("");
  const [description, setDescription] = useState("");
  const [logoStyle, setLogoStyle] = useState("Minimalist");
  const [palette, setPalette] = useState(colorPalettes[0]);
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [seed, setSeed] = useState(0);

  async function generate() {
    if (!brandName.trim()) return;
    setLoading(true);

    let basePrompt = "";
    if (mode === "Logo") {
      basePrompt = `Professional ${logoStyle.toLowerCase()} logo design for "${brandName}" brand. ${description}. ${palette.colors} color scheme. Vector style, clean, scalable, no text unless specified, white background.`;
    } else if (mode === "Poster") {
      basePrompt = `Eye-catching ${mode.toLowerCase()} for "${brandName}". ${description}. ${logoStyle} style, ${palette.colors} colors. High quality print design, dramatic composition.`;
    } else {
      basePrompt = `Professional ${mode.toLowerCase()} design for "${brandName}". ${description}. ${logoStyle} aesthetic, ${palette.colors} color palette. Modern, high quality.`;
    }

    const newSeed = Math.floor(Math.random() * 99999);
    setSeed(newSeed);
    const w = mode === "Logo" ? 1024 : mode === "Poster" ? 768 : 1024;
    const h = mode === "Logo" ? 1024 : mode === "Poster" ? 1024 : 512;
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(basePrompt)}?width=${w}&height=${h}&seed=${newSeed}&nologo=true`;
    setImageUrl(url);
    setTimeout(() => setLoading(false), 15000);
    const img = new window.Image();
    img.onload = () => setLoading(false);
    img.onerror = () => setLoading(false);
    img.src = url;
  }

  function download() {
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `geenie-${mode.toLowerCase()}-${seed}.jpg`;
    a.target = "_blank";
    a.click();
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-3xl mx-auto w-full">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "var(--gradient-brand)" }}>
          <Palette className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Logo & Poster Studio</h1>
          <p className="text-sm text-muted-foreground">Create logos, posters, banners and brand visuals</p>
        </div>
      </div>

      <div className="glass rounded-2xl p-5 flex flex-col gap-4">
        {/* Mode */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">What to create?</label>
          <div className="flex flex-wrap gap-2">
            {modes.map((m) => (
              <button key={m} onClick={() => setMode(m)}
                className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
                  mode === m ? "bg-purple-600 text-white" : "bg-surface border border-border text-muted-foreground hover:bg-surface-elevated"
                }`}>
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Brand / Business Name</label>
            <input value={brandName} onChange={(e) => setBrandName(e.target.value)}
              placeholder="e.g. Geenie AI Studio"
              className="w-full rounded-xl bg-surface border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Style</label>
            <select value={logoStyle} onChange={(e) => setLogoStyle(e.target.value)}
              className="w-full rounded-xl bg-surface border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500">
              {logoStyles.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">What does your brand do? (optional)</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. AI content creation platform for creators"
            className="w-full rounded-xl bg-surface border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500" />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">Color Palette</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {colorPalettes.map((p) => (
              <button key={p.label} onClick={() => setPalette(p)}
                className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                  palette.label === p.label ? "text-white" : "bg-surface border border-border text-muted-foreground hover:bg-surface-elevated"
                }`}
                style={palette.label === p.label ? { background: "var(--gradient-brand)" } : undefined}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <button onClick={generate} disabled={loading || !brandName.trim()}
          className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white transition disabled:opacity-50"
          style={{ background: "var(--gradient-brand)" }}>
          <Sparkles className="h-4 w-4" />
          {loading ? `Creating ${mode}...` : `Generate ${mode}`}
        </button>
      </div>

      {(imageUrl || loading) && (
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Your {mode}</span>
            <div className="flex gap-2">
              {imageUrl && !loading && (
                <>
                  <button onClick={generate} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition">
                    <RefreshCw className="h-3.5 w-3.5" /> Regenerate
                  </button>
                  <button onClick={download} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition">
                    <Download className="h-3.5 w-3.5" /> Download
                  </button>
                </>
              )}
            </div>
          </div>
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
              <p className="text-sm text-muted-foreground">Designing your {mode.toLowerCase()}... (10-20 seconds)</p>
            </div>
          ) : (
            <img src={imageUrl} alt={`Generated ${mode}`} className="w-full rounded-xl object-contain max-h-96" />
          )}
          <p className="text-xs text-center text-muted-foreground mt-2">Powered by Pollinations AI · Free forever</p>
        </div>
      )}
    </div>
  );
}
