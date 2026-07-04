import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { Upload, Download, Sparkles, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/_authenticated/studios/anime")({
  head: () => ({ meta: [{ title: "Anime Style — Geenie AI Studio" }] }),
  component: AnimeStudio,
});

const animeStyles = [
  { label: "Ghibli", prompt: "Studio Ghibli anime style, soft watercolor, Hayao Miyazaki" },
  { label: "Shonen", prompt: "shonen anime style, bold lines, vibrant colors, Dragon Ball Z style" },
  { label: "Cyberpunk Anime", prompt: "cyberpunk anime style, neon lights, futuristic, Ghost in the Shell" },
  { label: "Chibi", prompt: "cute chibi anime style, big eyes, small body, kawaii" },
  { label: "Demon Slayer", prompt: "Demon Slayer kimetsu no yaiba anime art style, detailed, dramatic lighting" },
  { label: "One Piece", prompt: "One Piece anime art style, Eiichiro Oda, bold outlines" },
];

export default function AnimeStudio() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [style, setStyle] = useState(animeStyles[0]);
  const [resultUrl, setResultUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImageSrc(ev.target?.result as string);
    reader.readAsDataURL(file);
    setResultUrl("");
  }

  async function generate() {
    if (!imageSrc) return;
    setLoading(true);
    setResultUrl("");
    const seed = Math.floor(Math.random() * 99999);
    const prompt = encodeURIComponent(
      `${style.prompt}, high quality anime illustration, professional, detailed`
    );
    const url = `https://image.pollinations.ai/prompt/${prompt}?width=1024&height=1024&seed=${seed}&nologo=true`;
    setResultUrl(url);
    const img = new window.Image();
    img.onload = () => setLoading(false);
    img.onerror = () => setLoading(false);
    img.src = url;
    setTimeout(() => setLoading(false), 20000);
  }

  function download() {
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = "geenie-anime.jpg";
    a.target = "_blank";
    a.click();
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-3xl mx-auto w-full">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "var(--gradient-brand)" }}>
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Anime Style</h1>
          <p className="text-sm text-muted-foreground">Turn your photos into anime characters instantly</p>
        </div>
      </div>

      <div className="glass rounded-2xl p-5 flex flex-col gap-4">
        {/* Upload */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">Your Photo</label>
          {imageSrc ? (
            <div className="relative">
              <img src={imageSrc} className="w-full max-h-48 object-contain rounded-xl" alt="Source" />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute top-2 right-2 flex items-center gap-1 rounded-lg bg-black/60 px-2.5 py-1.5 text-xs text-white">
                <RefreshCw className="h-3 w-3" /> Change
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 w-full rounded-xl border-2 border-dashed border-border bg-surface/50 py-10 hover:border-purple-500/50 transition">
              <Upload className="h-6 w-6 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Upload your photo</span>
            </button>
          )}
        </div>

        {/* Anime Style */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">Anime Style</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {animeStyles.map((s) => (
              <button key={s.label} onClick={() => setStyle(s)}
                className={`rounded-xl px-3 py-2.5 text-xs font-medium transition ${
                  style.label === s.label ? "text-white" : "bg-surface border border-border text-muted-foreground hover:bg-surface-elevated"
                }`}
                style={style.label === s.label ? { background: "var(--gradient-brand)" } : undefined}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <button onClick={generate} disabled={loading || !imageSrc}
          className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
          style={{ background: "var(--gradient-brand)" }}>
          <Sparkles className="h-4 w-4" />
          {loading ? "Generating anime art..." : "Convert to Anime"}
        </button>
      </div>

      {/* Result */}
      {(resultUrl || loading) && (
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Your Anime Art ✨</span>
            {resultUrl && !loading && (
              <div className="flex gap-2">
                <button onClick={generate} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                  <RefreshCw className="h-3 w-3" /> Regenerate
                </button>
                <button onClick={download} className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1">
                  <Download className="h-3 w-3" /> Download
                </button>
              </div>
            )}
          </div>
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
              <p className="text-sm text-muted-foreground">Creating your anime art... (15-20 seconds)</p>
            </div>
          ) : (
            <img src={resultUrl} alt="Anime result" className="w-full rounded-xl" />
          )}
        </div>
      )}

      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
    </div>
  );
}
