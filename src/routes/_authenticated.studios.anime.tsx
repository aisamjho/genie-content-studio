import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { Upload, Download, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/studios/anime")({
  head: () => ({ meta: [{ title: "Anime Style — Geenie AI Studio" }] }),
  component: AnimeStudio,
});

const animeStyles = [
  { name: "Studio Ghibli", prompt: "Studio Ghibli anime style, Hayao Miyazaki, soft watercolor, magical" },
  { name: "Naruto", prompt: "Naruto anime style, sharp lines, bold colors, shounen manga" },
  { name: "Demon Slayer", prompt: "Demon Slayer kimetsu no yaiba anime style, vibrant, detailed" },
  { name: "One Piece", prompt: "One Piece anime style, Eiichiro Oda, bold outlines, adventure" },
  { name: "Attack on Titan", prompt: "Attack on Titan anime style, dark, detailed, dramatic lighting" },
  { name: "Chibi", prompt: "cute chibi anime character, big eyes, small body, kawaii style" },
  { name: "Cyberpunk", prompt: "cyberpunk anime style, neon lights, futuristic city, detailed" },
  { name: "Watercolor", prompt: "soft watercolor anime illustration, pastel colors, gentle brushwork" },
];

function AnimeStudio() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [style, setStyle] = useState(animeStyles[0]);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setImageSrc(ev.target?.result as string); setResultUrl(null); };
    reader.readAsDataURL(file);
  }

  function convert() {
    setLoading(true);
    setResultUrl(null);
    const seed = Math.floor(Math.random() * 99999);
    const prompt = encodeURIComponent(`${style.prompt}, anime portrait, high quality, detailed illustration, beautiful`);
    const url = `https://image.pollinations.ai/prompt/${prompt}?width=1024&height=1024&seed=${seed}&nologo=true`;
    const img = new window.Image();
    img.onload = () => { setResultUrl(url); setLoading(false); };
    img.onerror = () => setLoading(false);
    img.src = url;
    setTimeout(() => { setResultUrl(url); setLoading(false); }, 20000);
  }

  function download() {
    if (!resultUrl) return;
    const a = document.createElement("a");
    a.href = resultUrl; a.download = "geenie-anime.jpg"; a.target = "_blank"; a.click();
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto w-full">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "var(--gradient-brand)" }}>
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Anime Style</h1>
          <p className="text-sm text-muted-foreground">Transform photos & videos into anime characters</p>
        </div>
      </div>

      <div className="glass rounded-2xl p-5 flex flex-col gap-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">Choose Anime Style</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {animeStyles.map((s) => (
              <button key={s.name} onClick={() => setStyle(s)}
                className={`rounded-xl px-3 py-2 text-xs font-medium transition ${style.name === s.name ? "text-white" : "bg-surface border border-border text-muted-foreground hover:bg-surface-elevated"}`}
                style={style.name === s.name ? { background: "var(--gradient-brand)" } : undefined}>
                {s.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Your Photo</label>
            <button onClick={() => fileInputRef.current?.click()}
              className="w-full flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-surface/50 py-8 hover:border-purple-500/50 transition min-h-[180px]">
              {imageSrc ? <img src={imageSrc} className="max-h-40 rounded-lg object-contain" alt="upload" /> : <><Upload className="h-6 w-6 text-muted-foreground" /><span className="text-xs text-muted-foreground">Upload photo</span></>}
            </button>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Anime Result</label>
            <div className="w-full flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-surface/50 py-8 min-h-[180px]">
              {loading ? <><div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" /><span className="text-xs text-muted-foreground">Converting... (15-20s)</span></> : resultUrl ? <img src={resultUrl} className="max-h-40 rounded-lg object-contain" alt="anime" /> : <span className="text-xs text-muted-foreground">Result appears here</span>}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={convert} disabled={loading || !imageSrc}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white disabled:opacity-50 transition"
            style={{ background: "var(--gradient-brand)" }}>
            <Sparkles className="h-4 w-4" />{loading ? "Converting..." : "Convert to Anime"}
          </button>
          {resultUrl && !loading && (
            <button onClick={download} className="flex items-center gap-2 rounded-xl bg-surface border border-border px-4 py-3 text-sm font-medium hover:bg-surface-elevated transition">
              <Download className="h-4 w-4" /> Save
            </button>
          )}
        </div>
        <p className="text-xs text-center text-muted-foreground">Free · No watermark · Powered by Pollinations AI</p>
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
    </div>
  );
}
