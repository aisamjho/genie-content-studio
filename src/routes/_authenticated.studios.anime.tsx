"use client";
import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { Upload, Download, Sparkles, Music, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/studios/anime")({
  head: () => ({ meta: [{ title: "Anime Style — Geenie AI Studio" }] }),
  component: AnimeStudio,
});

const animeStyles = [
  { name: "Studio Ghibli", prompt: "studio ghibli anime art style, miyazaki, soft watercolor painting, magical background, beautiful anime illustration" },
  { name: "Naruto", prompt: "naruto anime style character, bold black outlines, orange and blue colors, ninja headband, shounen manga style" },
  { name: "Demon Slayer", prompt: "demon slayer kimetsu no yaiba anime style, vibrant colors, detailed hair, dramatic lighting, beautiful anime character" },
  { name: "One Piece", prompt: "one piece anime style, eiichiro oda art style, bold outlines, colorful, adventure anime character" },
  { name: "Attack on Titan", prompt: "attack on titan anime style, dark dramatic lighting, detailed military uniform, intense expression, survey corps" },
  { name: "Chibi", prompt: "super cute chibi anime character, big sparkling eyes, tiny body, kawaii style, pastel colors, adorable" },
  { name: "Cyberpunk", prompt: "cyberpunk anime character, neon lights, futuristic city background, glowing eyes, dystopian anime style" },
  { name: "Watercolor", prompt: "soft watercolor anime illustration, pastel dreamy colors, gentle brushwork, aesthetic anime girl style" },
];

function AnimeStudio() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [style, setStyle] = useState(animeStyles[0]);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [musicFile, setMusicFile] = useState<string | null>(null);
  const [musicName, setMusicName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const musicInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please upload an image file."); return; }
    const reader = new FileReader();
    reader.onload = (ev) => { setImageSrc(ev.target?.result as string); setResultUrl(null); setError(null); };
    reader.readAsDataURL(file);
  }

  function handleMusicUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMusicFile(URL.createObjectURL(file));
    setMusicName(file.name);
  }

  function convert() {
    if (!imageSrc) return;

    // Free plan: 5 anime conversions limit
    const used = typeof window !== "undefined" ? parseInt(localStorage.getItem("geenie_anime_count") || "0") : 0;
    const plan = typeof window !== "undefined" ? (localStorage.getItem("geenie_plan") || "starter") : "starter";
    if (plan === "starter" && used >= 5) {
      setError("You've used all 5 free anime conversions. Upgrade to Creator ($2/mo) for unlimited. Click Billing in the sidebar.");
      return;
    }
    if (typeof window !== "undefined") localStorage.setItem("geenie_anime_count", String(used + 1));

    setLoading(true);
    setResultUrl(null);
    setError(null);

    // Use Pollinations with style prompt - generates anime version
    const seed = Math.floor(Math.random() * 999999);
    const fullPrompt = `${style.prompt}, portrait, face visible, high quality anime art, 4k detailed`;
    const encoded = encodeURIComponent(fullPrompt);
    const url = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&seed=${seed}&nologo=true&enhance=true`;

    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => { setResultUrl(url); setLoading(false); };
    img.onerror = () => {
      // retry with different seed
      const seed2 = Math.floor(Math.random() * 999999);
      const url2 = `https://image.pollinations.ai/prompt/${encoded}?width=512&height=512&seed=${seed2}&nologo=true`;
      setResultUrl(url2);
      setLoading(false);
    };
    img.src = url;
    // Fallback after 25s
    setTimeout(() => {
      if (loading) { setResultUrl(url); setLoading(false); }
    }, 25000);
  }

  function download() {
    if (!resultUrl) return;
    const a = document.createElement("a");
    a.href = resultUrl; a.download = `geenie-anime-${style.name.toLowerCase().replace(" ","-")}.jpg`;
    a.target = "_blank"; a.click();
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto w-full">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "linear-gradient(135deg, #a855f7, #ec4899)" }}>
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Anime Style</h1>
          <p className="text-sm text-muted-foreground">Transform photos into anime characters · Add background music</p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 flex flex-col gap-5 backdrop-blur-sm">
        {/* Style selector */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">Anime Style</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {animeStyles.map((s) => (
              <button key={s.name} onClick={() => setStyle(s)}
                className={`rounded-xl px-3 py-2 text-xs font-medium transition ${style.name === s.name ? "text-white" : "bg-white/5 border border-white/10 text-muted-foreground hover:bg-white/10"}`}
                style={style.name === s.name ? { background: "linear-gradient(135deg, #a855f7, #ec4899)" } : undefined}>
                {s.name}
              </button>
            ))}
          </div>
        </div>

        {/* Upload + Result */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Reference Photo (for inspiration)</label>
            <button onClick={() => fileInputRef.current?.click()}
              className="w-full flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/20 bg-white/5 hover:border-purple-500/60 transition min-h-[200px] overflow-hidden">
              {imageSrc
                ? <img src={imageSrc} className="w-full h-full object-cover rounded-xl max-h-[200px]" alt="upload" />
                : <><Upload className="h-7 w-7 text-muted-foreground" /><span className="text-xs text-muted-foreground">Click to upload photo</span><span className="text-[10px] text-muted-foreground/60">JPG, PNG, WEBP</span></>}
            </button>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Anime Result</label>
            <div className="w-full flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/20 bg-white/5 min-h-[200px] overflow-hidden">
              {loading
                ? <><div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" /><span className="text-xs text-muted-foreground">Generating anime art...</span><span className="text-[10px] text-muted-foreground/60">~15–25 seconds</span></>
                : resultUrl
                  ? <img src={resultUrl} className="w-full h-full object-cover rounded-xl max-h-[200px]" alt="anime result"
                      onError={() => setError("Generation failed. Try again.")} />
                  : <span className="text-xs text-muted-foreground">Result appears here</span>}
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3">
            <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        {/* Music section */}
        <div className="rounded-xl bg-white/5 border border-white/10 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Music className="h-4 w-4 text-purple-400" />
            <span className="text-sm font-medium">Add Background Music</span>
          </div>
          <div className="flex gap-3 items-center flex-wrap">
            <button onClick={() => musicInputRef.current?.click()}
              className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/15 px-4 py-2 text-xs font-medium hover:bg-white/10 transition">
              <Upload className="h-3.5 w-3.5" /> {musicName || "Upload MP3"}
            </button>
            {musicFile && (
              <>
                <audio ref={audioRef} src={musicFile} controls className="h-8 flex-1 min-w-0" />
                <button onClick={() => { setMusicFile(null); setMusicName(""); }} className="text-xs text-red-400 hover:text-red-300">Remove</button>
              </>
            )}
          </div>
          {!musicFile && <p className="text-[11px] text-muted-foreground mt-2">Upload an MP3 to preview your image with music — great for Reels content</p>}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={convert} disabled={loading || !imageSrc}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white disabled:opacity-40 transition"
            style={{ background: "linear-gradient(135deg, #a855f7, #ec4899)" }}>
            <Sparkles className="h-4 w-4" />{loading ? "Converting..." : "Convert to Anime"}
          </button>
          {resultUrl && !loading && (
            <button onClick={download} className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/15 px-4 py-3 text-sm font-medium hover:bg-white/10 transition">
              <Download className="h-4 w-4" /> Save
            </button>
          )}
        </div>
        {(() => {
          const used = typeof window !== "undefined" ? parseInt(localStorage.getItem("geenie_anime_count") || "0") : 0;
          const plan = typeof window !== "undefined" ? (localStorage.getItem("geenie_plan") || "starter") : "starter";
          const remaining = 5 - used;
          return plan === "starter" ? (
            <p className="text-xs text-center text-muted-foreground">
              {remaining > 0 ? `${remaining} free conversions remaining · ` : "⚠️ Limit reached · "}
              <a href="/#pricing" className="text-orange-500 font-medium hover:underline">Upgrade for unlimited →</a>
            </p>
          ) : (
            <p className="text-xs text-center text-muted-foreground">Unlimited · Creator Plan · Powered by Pollinations AI</p>
          );
        })()}
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
      <input ref={musicInputRef} type="file" accept="audio/*" onChange={handleMusicUpload} className="hidden" />
    </div>
  );
}
