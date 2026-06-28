import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Image as ImageIcon, Sparkles, Download, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/_authenticated/studios/image")({
  head: () => ({ meta: [{ title: "Image Studio — Geenie AI Studio" }] }),
  component: ImageStudio,
});

const styles = [
  "Photorealistic", "Digital Art", "Oil Painting", "Watercolor",
  "Anime", "Cinematic", "3D Render", "Minimalist",
  "Vintage", "Neon", "Sketch", "Fantasy",
];

const sizes = [
  { label: "Square (1:1)", w: 1024, h: 1024 },
  { label: "Portrait (9:16)", w: 576, h: 1024 },
  { label: "Landscape (16:9)", w: 1024, h: 576 },
];

const presets = [
  { label: "Product Photo", prompt: "Professional product photography, clean white background, studio lighting, high detail" },
  { label: "Social Banner", prompt: "Eye-catching social media banner, vibrant colors, modern design, text space on left" },
  { label: "Profile Avatar", prompt: "Professional headshot portrait, soft bokeh background, natural lighting, confident expression" },
  { label: "YouTube Thumbnail", prompt: "Dramatic YouTube thumbnail style, bold colors, high contrast, compelling focal point" },
];

async function callClaude(prompt: string): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 200,
      messages: [{ role: "user", content: `Convert this image idea into a detailed, vivid image generation prompt (max 50 words, no explanations, just the prompt): "${prompt}"` }],
    }),
  });
  const data = await res.json();
  return data.content?.[0]?.text ?? prompt;
}

function ImageStudio() {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("Photorealistic");
  const [size, setSize] = useState(sizes[0]);
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [seed, setSeed] = useState(Math.floor(Math.random() * 9999));

  async function enhancePrompt() {
    if (!prompt.trim()) return;
    setEnhancing(true);
    const enhanced = await callClaude(prompt);
    setPrompt(enhanced);
    setEnhancing(false);
  }

  async function generate() {
    if (!prompt.trim()) return;
    setLoading(true);
    const newSeed = Math.floor(Math.random() * 99999);
    setSeed(newSeed);
    const fullPrompt = `${prompt}, ${style} style, highly detailed, professional quality`;
    const encodedPrompt = encodeURIComponent(fullPrompt);
    const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${size.w}&height=${size.h}&seed=${newSeed}&nologo=true`;
    // Pre-load image
    const img = new Image();
    img.onload = () => { setImageUrl(url); setLoading(false); };
    img.onerror = () => { setLoading(false); };
    img.src = url;
    setImageUrl(url);
    setTimeout(() => setLoading(false), 12000); // fallback timeout
  }

  function download() {
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `geenie-image-${seed}.jpg`;
    a.target = "_blank";
    a.click();
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-3xl mx-auto w-full">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "var(--gradient-brand)" }}>
          <ImageIcon className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Image Studio</h1>
          <p className="text-sm text-muted-foreground">Generate stunning AI images from text</p>
        </div>
      </div>

      <div className="glass rounded-2xl p-5 flex flex-col gap-4">
        {/* Presets */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">Quick Presets</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {presets.map((p) => (
              <button key={p.label} onClick={() => setPrompt(p.prompt)}
                className="rounded-lg bg-surface border border-border px-3 py-2 text-xs text-muted-foreground hover:bg-surface-elevated transition text-left">
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Prompt */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">Describe your image</label>
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. A professional woman working on a laptop in a modern office, natural light, warm tones..."
              className="w-full rounded-xl bg-surface border border-border px-4 py-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-purple-500 pr-32"
              rows={3}
            />
            <button
              onClick={enhancePrompt}
              disabled={enhancing || !prompt.trim()}
              className="absolute right-3 bottom-3 flex items-center gap-1 rounded-lg bg-purple-600/20 border border-purple-500/30 px-2.5 py-1.5 text-xs font-medium text-purple-400 hover:bg-purple-600/30 transition disabled:opacity-50"
            >
              <Sparkles className="h-3 w-3" />
              {enhancing ? "Enhancing..." : "Enhance"}
            </button>
          </div>
        </div>

        {/* Style */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">Style</label>
          <div className="flex flex-wrap gap-2">
            {styles.map((s) => (
              <button key={s} onClick={() => setStyle(s)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  style === s ? "bg-purple-600 text-white" : "bg-surface border border-border text-muted-foreground hover:bg-surface-elevated"
                }`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Size */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">Size</label>
          <div className="flex gap-2">
            {sizes.map((s) => (
              <button key={s.label} onClick={() => setSize(s)}
                className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                  size.label === s.label ? "text-white" : "bg-surface border border-border text-muted-foreground hover:bg-surface-elevated"
                }`}
                style={size.label === s.label ? { background: "var(--gradient-brand)" } : undefined}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={generate}
          disabled={loading || !prompt.trim()}
          className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white transition disabled:opacity-50"
          style={{ background: "var(--gradient-brand)" }}
        >
          <Sparkles className="h-4 w-4" />
          {loading ? "Generating image..." : "Generate Image"}
        </button>
      </div>

      {/* Result */}
      {(imageUrl || loading) && (
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Generated Image</span>
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
              <p className="text-sm text-muted-foreground">Creating your image... (10-20 seconds)</p>
            </div>
          ) : (
            <img src={imageUrl} alt="Generated" className="w-full rounded-xl object-cover" onLoad={() => setLoading(false)} />
          )}
          <p className="text-xs text-center text-muted-foreground mt-2">Powered by Pollinations AI · Free forever</p>
        </div>
      )}
    </div>
  );
}
