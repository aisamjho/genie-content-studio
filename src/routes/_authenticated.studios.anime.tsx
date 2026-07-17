import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Download, Sparkles, RefreshCw, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/studios/anime")({
  head: () => ({ meta: [{ title: "Anime Style — Geenie AI Studio" }] }),
  component: AnimeStudio,
});

const animeStyles = [
  { name: "Studio Ghibli", prompt: "Studio Ghibli anime art style, Hayao Miyazaki, soft watercolor painting, magical background, beautiful anime illustration" },
  { name: "Naruto", prompt: "Naruto anime style character, bold black outlines, orange and blue colors, ninja headband, shounen manga style" },
  { name: "Demon Slayer", prompt: "Demon Slayer kimetsu no yaiba anime style, vibrant colors, detailed hair, dramatic lighting, beautiful anime character" },
  { name: "One Piece", prompt: "One Piece anime style, Eiichiro Oda art style, bold outlines, colorful, adventure anime character" },
  { name: "Attack on Titan", prompt: "Attack on Titan anime style, dark dramatic lighting, detailed military uniform, intense expression, survey corps" },
  { name: "Chibi", prompt: "super cute chibi anime character, big sparkling eyes, tiny body, kawaii style, pastel colors, adorable" },
  { name: "Cyberpunk", prompt: "cyberpunk anime character, neon lights, futuristic city background, glowing eyes, dystopian anime style" },
  { name: "Watercolor", prompt: "soft watercolor anime illustration, pastel dreamy colors, gentle brushwork, aesthetic anime style" },
];

function AnimeStudio() {
  const navigate = useNavigate();
  const [style, setStyle] = useState(animeStyles[0]);
  const [subject, setSubject] = useState("");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState("starter");
  const [usedCount, setUsedCount] = useState(0);

  useEffect(() => {
    setPlan(localStorage.getItem("geenie_plan") || "starter");
    setUsedCount(parseInt(localStorage.getItem("geenie_anime_count") || "0"));
  }, []);

  const isPaid = plan === "creator" || plan === "studio";
  const remaining = 5 - usedCount;

  function convert() {
    if (!isPaid && usedCount >= 5) {
      setError("You've used all 5 free anime generations. Upgrade to Creator ($2/mo) for unlimited.");
      return;
    }
    setLoading(true);
    setResultUrl(null);
    setError(null);

    if (!isPaid) {
      const newCount = usedCount + 1;
      localStorage.setItem("geenie_anime_count", String(newCount));
      setUsedCount(newCount);
    }

    const seed = Math.floor(Math.random() * 999999);
    const subjectText = subject.trim() ? `, ${subject}` : ", anime character portrait";
    const fullPrompt = encodeURIComponent(`${style.prompt}${subjectText}, high quality anime art, 4k detailed`);
    const url = `https://image.pollinations.ai/prompt/${fullPrompt}?width=1024&height=1024&seed=${seed}&nologo=true&enhance=true`;

    const img = new window.Image();
    img.onload = () => { setResultUrl(url); setLoading(false); };
    img.onerror = () => { setError("Generation failed. Please try again."); setLoading(false); };
    img.src = url;
    setTimeout(() => { if (loading) { setResultUrl(url); setLoading(false); } }, 25000);
  }

  async function download() {
    if (!resultUrl) return;
    try {
      const response = await fetch(resultUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `geenie-anime-${style.name.toLowerCase().replace(/ /g, "-")}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      window.open(resultUrl, "_blank");
    }
  }

  const grad = { background: "var(--gradient-brand)" };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-4xl mx-auto w-full">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate({ to: "/dashboard" })}
          className="text-xs text-muted-foreground hover:text-foreground transition mr-1">← Back</button>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={grad}>
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Anime Style</h1>
          <p className="text-sm text-muted-foreground">Generate anime art in any style — describe your character</p>
        </div>
      </div>

      <div className="glass rounded-2xl p-5 flex flex-col gap-5">
        {/* Style selector */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">Anime Style</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {animeStyles.map(s => (
              <button key={s.name} onClick={() => setStyle(s)}
                className={`rounded-xl px-3 py-2 text-xs font-medium transition ${style.name === s.name ? "text-white" : "bg-surface border border-border text-muted-foreground hover:bg-surface-elevated"}`}
                style={style.name === s.name ? grad : undefined}>
                {s.name}
              </button>
            ))}
          </div>
        </div>

        {/* Subject description */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">
            Describe your character <span className="opacity-60">(optional)</span>
          </label>
          <input value={subject} onChange={e => setSubject(e.target.value)}
            placeholder="e.g. a young woman with long silver hair, a warrior with a sword, a cute cat..."
            className="w-full rounded-xl bg-surface border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500" />
        </div>

        {/* Result */}
        {(loading || resultUrl) && (
          <div className="w-full flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-surface/50 min-h-[280px] overflow-hidden">
            {loading
              ? <><div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" /><span className="text-xs text-muted-foreground">Generating anime art... (15-25s)</span></>
              : resultUrl
                ? <img src={resultUrl} className="w-full object-contain rounded-xl max-h-[360px]" alt="anime result" onError={() => setError("Generation failed. Try again.")} />
                : null}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
            <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
            <p className="text-xs text-red-600">{error}</p>
            {!isPaid && usedCount >= 5 && (
              <a href="/#pricing" className="ml-auto text-xs font-medium text-orange-500 hover:underline shrink-0">Upgrade →</a>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={convert} disabled={loading || (!isPaid && usedCount >= 5)}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white disabled:opacity-40 transition"
            style={grad}>
            <Sparkles className="h-4 w-4" />{loading ? "Generating..." : "Generate Anime Art"}
          </button>
          {resultUrl && !loading && (
            <>
              <button onClick={convert} className="flex items-center gap-2 rounded-xl bg-surface border border-border px-4 py-3 text-sm font-medium hover:bg-surface-elevated transition">
                <RefreshCw className="h-4 w-4" />
              </button>
              <button onClick={download} className="flex items-center gap-2 rounded-xl bg-surface border border-border px-4 py-3 text-sm font-medium hover:bg-surface-elevated transition">
                <Download className="h-4 w-4" />
              </button>
            </>
          )}
        </div>

        {/* Usage counter */}
        <p className="text-xs text-center text-muted-foreground">
          {isPaid
            ? "Unlimited generations · Creator Plan · Powered by Pollinations AI"
            : remaining > 0
              ? `${remaining} free generations remaining · `
              : "⚠️ Limit reached · "}
          {!isPaid && <a href="/#pricing" className="text-orange-500 font-medium hover:underline">Upgrade for unlimited →</a>}
        </p>
      </div>
    </div>
  );
}
