import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Film, Sparkles, Copy, Check, Download } from "lucide-react";

export const Route = createFileRoute("/_authenticated/studios/animation")({
  head: () => ({ meta: [{ title: "Image Animation — Geenie AI Studio" }] }),
  component: ImageAnimation,
});

const animationTypes = [
  { label: "Ken Burns", desc: "Slow zoom & pan effect", emoji: "🎬" },
  { label: "Parallax", desc: "Depth layers movement", emoji: "🌊" },
  { label: "Zoom In", desc: "Dramatic zoom into subject", emoji: "🔍" },
  { label: "Cinematic Pan", desc: "Smooth horizontal sweep", emoji: "🎥" },
  { label: "Fade Story", desc: "Fade between moments", emoji: "✨" },
  { label: "3D Rotate", desc: "3D perspective rotation", emoji: "🔄" },
];

const moods = ["Epic", "Dreamy", "Romantic", "Energetic", "Mysterious", "Peaceful", "Dramatic", "Playful"];

async function callClaude(prompt: string): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await res.json();
  return data.content?.[0]?.text ?? "";
}

function ImageAnimation() {
  const [imageDesc, setImageDesc] = useState("");
  const [animType, setAnimType] = useState(animationTypes[0]);
  const [mood, setMood] = useState("Epic");
  const [duration, setDuration] = useState("5");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generate animated preview using CSS animation on a Pollinations image
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);

  async function generate() {
    if (!imageDesc.trim()) return;
    setLoading(true);
    setOutput("");

    const prompt = `You are an expert video editor and animator. Create a detailed animation guide for bringing this image to life:

Image: "${imageDesc}"
Animation Type: ${animType.label} (${animType.desc})
Mood: ${mood}
Duration: ${duration} seconds

Provide:

1. ANIMATION BRIEF
   Step-by-step animation instructions for a video editor

2. CAPCUT / PREMIERE STEPS
   Exact steps to recreate this in CapCut or Premiere Pro (5-7 steps)

3. AI VIDEO PROMPT
   A detailed prompt for AI video tools (Runway, Kling, Pika) to animate this

4. MUSIC RECOMMENDATION
   Genre and tempo for background music that matches the mood

5. EXPORT SETTINGS
   Best export settings for Instagram Reels / YouTube Shorts`;

    const result = await callClaude(prompt);
    setOutput(result);
    setLoading(false);

    // Generate a preview image
    setPreviewLoading(true);
    const seed = Math.floor(Math.random() * 99999);
    const imgPrompt = encodeURIComponent(`${imageDesc}, ${mood} mood, cinematic, ${animType.label} style, high quality`);
    setPreviewUrl(`https://image.pollinations.ai/prompt/${imgPrompt}?width=768&height=432&seed=${seed}&nologo=true`);
    setPreviewLoading(false);
  }

  function copy() {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const cssAnimation = animType.label === "Ken Burns" ? "animate-pulse" :
    animType.label === "Zoom In" ? "hover:scale-110 transition-transform duration-[5000ms]" : "";

  return (
    <div className="flex flex-col gap-6 p-6 max-w-3xl mx-auto w-full">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "var(--gradient-brand)" }}>
          <Film className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Image Animation</h1>
          <p className="text-sm text-muted-foreground">Animate stills into living cinematic scenes</p>
        </div>
      </div>

      <div className="glass rounded-2xl p-4 border border-yellow-500/20 bg-yellow-500/5">
        <p className="text-xs text-yellow-400">💡 This studio generates AI animation guides + previews. To render final video, use CapCut (free), Runway ML, or Kling AI with the provided prompts.</p>
      </div>

      <div className="glass rounded-2xl p-5 flex flex-col gap-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">Describe your image</label>
          <textarea value={imageDesc} onChange={(e) => setImageDesc(e.target.value)}
            placeholder="e.g. A woman standing on a mountain peak at sunset, dramatic orange sky, looking into the distance..."
            className="w-full rounded-xl bg-surface border border-border px-4 py-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-purple-500"
            rows={3} />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">Animation Style</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {animationTypes.map((a) => (
              <button key={a.label} onClick={() => setAnimType(a)}
                className={`rounded-xl px-3 py-2.5 text-xs font-medium transition text-left ${
                  animType.label === a.label ? "text-white" : "bg-surface border border-border hover:bg-surface-elevated"
                }`}
                style={animType.label === a.label ? { background: "var(--gradient-brand)" } : undefined}>
                <div className="text-base mb-0.5">{a.emoji}</div>
                <div className="font-semibold">{a.label}</div>
                <div className="text-[10px] opacity-70">{a.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Mood</label>
            <div className="flex flex-wrap gap-1.5">
              {moods.map((m) => (
                <button key={m} onClick={() => setMood(m)}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
                    mood === m ? "bg-purple-600 text-white" : "bg-surface border border-border text-muted-foreground hover:bg-surface-elevated"
                  }`}>
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Duration: {duration}s</label>
            <input type="range" min="3" max="15" step="1" value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full accent-purple-500" />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1"><span>3s</span><span>15s</span></div>
          </div>
        </div>

        <button onClick={generate} disabled={loading || !imageDesc.trim()}
          className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white transition disabled:opacity-50"
          style={{ background: "var(--gradient-brand)" }}>
          <Sparkles className="h-4 w-4" />
          {loading ? "Generating animation guide..." : "Generate Animation Guide"}
        </button>
      </div>

      {loading && (
        <div className="glass rounded-2xl p-8 flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
          <p className="text-sm text-muted-foreground">Crafting your cinematic animation plan...</p>
        </div>
      )}

      {previewUrl && (
        <div className="glass rounded-2xl p-5">
          <p className="text-sm font-medium mb-3">🎬 Scene Preview</p>
          <div className="overflow-hidden rounded-xl">
            <img src={previewUrl} alt="Animation preview" className={`w-full object-cover ${cssAnimation}`} />
          </div>
        </div>
      )}

      {output && (
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Animation Guide</span>
            <button onClick={copy} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition">
              {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied!" : "Copy All"}
            </button>
          </div>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{output}</p>
        </div>
      )}
    </div>
  );
}
