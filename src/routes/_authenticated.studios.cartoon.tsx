import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { motion } from "motion/react";
import { Upload, Download, Sparkles, RefreshCw, Dice5 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/studios/cartoon")({
  head: () => ({ meta: [{ title: "Cartoon & Comic Style — Geenie AI Studio" }] }),
  component: CartoonStudio,
});

const STYLES = [
  { name: "Disney Pixar", emoji: "🏰", prompt: "Disney Pixar 3D animated character, soft rounded features, big expressive eyes, vibrant colors, CGI render, high quality" },
  { name: "Comic Book", emoji: "💥", prompt: "Marvel DC comic book style, bold black outlines, halftone dots, flat colors, action comic panel" },
  { name: "Cartoon Network", emoji: "📺", prompt: "Cartoon Network 2D animation style, simple bold outlines, flat bright colors, fun cartoon character" },
  { name: "Manga", emoji: "📖", prompt: "Japanese manga black and white ink illustration, screen tone shading, detailed manga art" },
  { name: "Lego", emoji: "🧱", prompt: "Lego minifigure 3D render, plastic toy character, blocky proportions, yellow Lego face, colorful bricks" },
  { name: "Simpsons", emoji: "🍩", prompt: "Simpsons cartoon style, yellow skin, overbite, simple round eyes, Matt Groening Springfield animation" },
  { name: "Pop Art", emoji: "🟡", prompt: "Roy Lichtenstein pop art style, bold primary colors, Ben-Day dots, thick black outlines, 1960s illustration" },
  { name: "Watercolor", emoji: "🎨", prompt: "Cute watercolor cartoon illustration, soft brush strokes, pastel colors, children's book art style" },
  { name: "3D Animated", emoji: "🎬", prompt: "High quality 3D animated movie character, Dreamworks quality, expressive eyes, subsurface skin" },
  { name: "Sticker Art", emoji: "⭐", prompt: "Cute kawaii sticker art, white outline border, chibi proportions, glossy sticker effect, adorable" },
  { name: "South Park", emoji: "❄️", prompt: "South Park cartoon cut-out paper animation style, simple flat colors, comedy cartoon character" },
  { name: "Anime Movie", emoji: "🌸", prompt: "Studio Ghibli Makoto Shinkai anime movie quality, detailed cinematic anime illustration" },
];

const surpriseSubjects = [
  "a man with glasses and a beard",
  "a cat wearing a tiny hat",
  "a superhero flying through the city",
  "a chef cooking in a busy kitchen",
  "a dog skateboarding down a street",
  "a grandma baking cookies",
  "a robot playing guitar",
  "a knight in shining armor",
  "a kid riding a bicycle at sunset",
  "a detective examining clues with a magnifying glass",
];

function CartoonStudio() {
  const navigate = useNavigate();
  const [style, setStyle] = useState(STYLES[0]);
  const [desc, setDesc] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const requestIdRef = useRef(0);

  function generate(styleOverride?: typeof STYLES[0], descOverride?: string) {
    // A unique id for this specific request. If the user clicks Generate
    // or Try Again again before this one finishes, any late-arriving
    // onload/onerror/timeout from THIS call becomes stale and is ignored —
    // this is what prevents "regenerate gets stuck" and result mix-ups.
    const myId = ++requestIdRef.current;

    setLoading(true); setResult(null); setError(null);
    // Overrides let Surprise Me set state and generate in the same click —
    // reading component state directly here would still see the
    // pre-update values since React state updates aren't synchronous.
    const useStyle = styleOverride ?? style;
    const useDesc = descOverride !== undefined ? descOverride : desc;
    const seed = Math.floor(Math.random() * 999999);
    const subject = useDesc.trim() ? `, ${useDesc}` : ", portrait character";
    const prompt = encodeURIComponent(`${useStyle.prompt}${subject}, high quality illustration`);
    const url = `https://image.pollinations.ai/prompt/${prompt}?width=1024&height=1024&seed=${seed}&nologo=true&enhance=true`;

    const img = new window.Image();
    img.onload = () => {
      if (requestIdRef.current !== myId) return;
      setResult(url);
      setLoading(false);
    };
    img.onerror = () => {
      if (requestIdRef.current !== myId) return;
      setResult(null); // clear so a broken image icon never shows next to the error
      setError("Generation failed. Please try again.");
      setLoading(false);
    };
    img.src = url;
    setTimeout(() => {
      if (requestIdRef.current !== myId) return;
      setError("This is taking longer than expected. Please try again.");
      setLoading(false);
    }, 25000);
  }

  function surpriseMe() {
    const randomStyle = STYLES[Math.floor(Math.random() * STYLES.length)];
    const randomSubject = surpriseSubjects[Math.floor(Math.random() * surpriseSubjects.length)];
    setStyle(randomStyle);
    setDesc(randomSubject);
    generate(randomStyle, randomSubject);
  }

  async function download() {
    if (!result) return;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(result, { signal: controller.signal });
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `geenie-${style.name.toLowerCase().replace(/ /g, "-")}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Fallback - open in new tab
      window.open(result, "_blank");
    } finally {
      clearTimeout(timeoutId);
    }
  }

  const grad = { background: "var(--gradient-brand)" };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-4xl mx-auto w-full">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate({ to: "/dashboard" })}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition mr-1">
          ← Back
        </button>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl" style={grad}>🎨</div>
        <div>
          <h1 className="text-xl font-semibold">Cartoon & Comic Style</h1>
          <p className="text-sm text-muted-foreground">Disney · Pixar · Comics · Manga · Lego · Sticker & more</p>
        </div>
      </div>

      <div className="glass rounded-2xl p-5 flex flex-col gap-5">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">Choose Style</label>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {STYLES.map(s => (
              <button key={s.name} onClick={() => setStyle(s)}
                className={`rounded-xl px-2 py-2.5 text-xs font-medium transition flex flex-col items-center gap-1 ${style.name === s.name ? "text-white" : "bg-surface border border-border text-muted-foreground hover:bg-surface-elevated"}`}
                style={style.name === s.name ? grad : undefined}>
                <span className="text-lg">{s.emoji}</span><span>{s.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">Describe your subject <span className="opacity-60">(optional)</span></label>
          <div className="flex gap-2">
            <input value={desc} onChange={e => setDesc(e.target.value)}
              placeholder="e.g. a man with glasses and beard, a cat sitting on a chair, a superhero..."
              className="flex-1 rounded-xl bg-surface border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500" />
            <button onClick={surpriseMe} disabled={loading} title="Surprise me — random style and subject"
              className="flex items-center gap-1.5 rounded-xl bg-surface border border-border px-3 py-2.5 text-xs font-medium hover:bg-surface-elevated transition disabled:opacity-40 shrink-0">
              <Dice5 className="h-4 w-4" /> Surprise Me
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Your {style.name} Art</label>
            <div className="w-full rounded-xl border-2 border-dashed border-border bg-surface/50 min-h-[200px] flex items-center justify-center overflow-hidden">
              {loading
                ? <div className="flex flex-col items-center gap-2 p-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
                    <span className="text-xs text-muted-foreground">Creating {style.name} art... (15-25s)</span>
                  </div>
                : result
                  ? <motion.img key={result} src={result}
                      initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35, ease: "easeOut" }}
                      className="w-full object-contain rounded-xl" alt="cartoon" />
                  : <span className="text-xs text-muted-foreground p-4 text-center">Your cartoon art appears here after generating</span>}
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <div className="rounded-xl bg-orange-50 border border-orange-200 p-3">
              <p className="text-xs text-orange-700 font-medium">💡 Selected: <strong>{style.emoji} {style.name}</strong></p>
              <p className="text-xs text-orange-600 mt-1">Add a description below to personalise your art, or just click Generate.</p>
            </div>
            {error && <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2">⚠️ {error}</p>}
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => generate()} disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white disabled:opacity-50 transition" style={grad}>
              <Sparkles className="h-4 w-4" />{loading ? "Generating..." : `Create ${style.name} Art`}
            </motion.button>
            {result && !loading && (
              <>
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => generate()} className="flex items-center justify-center gap-2 rounded-xl bg-surface border border-border px-4 py-2.5 text-sm font-medium hover:bg-surface-elevated transition">
                  <RefreshCw className="h-4 w-4" />Try Again
                </motion.button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={download} className="flex items-center justify-center gap-2 rounded-xl bg-surface border border-border px-4 py-2.5 text-sm font-medium hover:bg-surface-elevated transition">
                  <Download className="h-4 w-4" />Download
                </motion.button>
              </>
            )}
          </div>
        </div>
        <p className="text-xs text-center text-muted-foreground">Free · No watermark · Powered by Pollinations AI</p>
      </div>
    
    </div>
  );
}
