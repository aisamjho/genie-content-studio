import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Download, Sparkles, RefreshCw, AlertCircle, Dice5 } from "lucide-react";

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

// Fun subject prompts for "Surprise Me" — removes blank-page hesitation,
// which is the single biggest drop-off point in AI generation tools.
const surpriseSubjects = [
  "a mysterious ninja standing on a rooftop at night",
  "a fierce warrior princess with a glowing sword",
  "a cute robot companion with big round eyes",
  "a wise old wizard with a long beard and staff",
  "a space explorer in a futuristic suit",
  "a magical forest fairy surrounded by fireflies",
  "a samurai swordsman under cherry blossoms",
  "a steampunk inventor with brass goggles",
  "a dragon rider soaring through clouds",
  "a school student with a mysterious glowing pendant",
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
  const requestIdRef = useRef(0);

  useEffect(() => {
    setPlan(localStorage.getItem("geenie_plan") || "starter");
    setUsedCount(parseInt(localStorage.getItem("geenie_anime_count") || "0"));
  }, []);

  const isPaid = plan === "creator" || plan === "studio";
  const remaining = 5 - usedCount;

  function convert(styleOverride?: typeof animeStyles[0], subjectOverride?: string) {
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

    // Track this request so a stale in-flight request (from a previous
    // click, or one that hangs) can never overwrite a newer result or get
    // "stuck" reporting loading forever.
    const myId = ++requestIdRef.current;

    // Use explicit overrides when provided (e.g. from Surprise Me, which
    // sets state and generates in the same tick — reading component state
    // directly here would still see the stale pre-update values since
    // React state updates aren't applied synchronously).
    const useStyle = styleOverride ?? style;
    const useSubject = subjectOverride !== undefined ? subjectOverride : subject;

    const seed = Math.floor(Math.random() * 999999);
    const subjectText = useSubject.trim() ? `, ${useSubject}` : ", anime character portrait";
    const fullPrompt = encodeURIComponent(`${useStyle.prompt}${subjectText}, high quality anime art, 4k detailed`);
    const url = `https://image.pollinations.ai/prompt/${fullPrompt}?width=1024&height=1024&seed=${seed}&nologo=true&enhance=true`;

    const img = new window.Image();
    img.onload = () => {
      if (requestIdRef.current !== myId) return; // superseded by a newer request
      setResultUrl(url);
      setLoading(false);
    };
    img.onerror = () => {
      if (requestIdRef.current !== myId) return;
      setError("Generation failed. Please try again.");
      setLoading(false);
    };
    img.src = url;
    setTimeout(() => {
      if (requestIdRef.current !== myId) return; // already resolved or superseded
      setError("This is taking longer than expected. Please try again.");
      setLoading(false);
    }, 25000);
  }

  function surpriseMe() {
    if (!isPaid && usedCount >= 5) {
      setError("You've used all 5 free anime generations. Upgrade to Creator ($2/mo) for unlimited.");
      return;
    }
    const randomStyle = animeStyles[Math.floor(Math.random() * animeStyles.length)];
    const randomSubject = surpriseSubjects[Math.floor(Math.random() * surpriseSubjects.length)];
    setStyle(randomStyle);
    setSubject(randomSubject);
    convert(randomStyle, randomSubject);
  }

  async function download() {
    if (!resultUrl) return;
    // A 15s bound so a slow or dropped connection falls back to opening the
    // image in a new tab (still lets the user save it manually) instead of
    // hanging with no feedback and no indication anything went wrong.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(resultUrl, { signal: controller.signal });
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
    } finally {
      clearTimeout(timeoutId);
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
          <div className="flex gap-2">
            <input value={subject} onChange={e => setSubject(e.target.value)}
              placeholder="e.g. a young woman with long silver hair, a warrior with a sword, a cute cat..."
              className="flex-1 rounded-xl bg-surface border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500" />
            <button onClick={surpriseMe} disabled={loading || (!isPaid && usedCount >= 5)}
              title="Surprise me — random style and subject"
              className="flex items-center gap-1.5 rounded-xl bg-surface border border-border px-3 py-2.5 text-xs font-medium hover:bg-surface-elevated transition disabled:opacity-40 shrink-0">
              <Dice5 className="h-4 w-4" /> Surprise Me
            </button>
          </div>
        </div>

        {/* Result */}
        {(loading || resultUrl) && (
          <div className="w-full flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-surface/50 min-h-[280px] overflow-hidden">
            {loading
              ? <><div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" /><span className="text-xs text-muted-foreground">Generating anime art... (15-25s)</span></>
              : resultUrl
                ? <motion.img key={resultUrl} src={resultUrl}
                    initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35, ease: "easeOut" }}
                    className="w-full object-contain rounded-xl max-h-[360px]" alt="anime result" onError={() => setError("Generation failed. Try again.")} />
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
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => convert()} disabled={loading || (!isPaid && usedCount >= 5)}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white disabled:opacity-40 transition"
            style={grad}>
            <Sparkles className="h-4 w-4" />{loading ? "Generating..." : "Generate Anime Art"}
          </motion.button>
          {resultUrl && !loading && (
            <>
              <motion.button whileTap={{ scale: 0.94 }} onClick={() => convert()} className="flex items-center gap-2 rounded-xl bg-surface border border-border px-4 py-3 text-sm font-medium hover:bg-surface-elevated transition">
                <RefreshCw className="h-4 w-4" />
              </motion.button>
              <motion.button whileTap={{ scale: 0.94 }} onClick={download} className="flex items-center gap-2 rounded-xl bg-surface border border-border px-4 py-3 text-sm font-medium hover:bg-surface-elevated transition">
                <Download className="h-4 w-4" />
              </motion.button>
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
