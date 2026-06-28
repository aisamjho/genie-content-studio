import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Wand2, Sparkles, Copy, Check, Download } from "lucide-react";

export const Route = createFileRoute("/_authenticated/studios/reel")({
  head: () => ({ meta: [{ title: "Reel Generator — Geenie AI Studio" }] }),
  component: ReelGenerator,
});

const niches = ["Lifestyle", "Business", "Education", "Fitness", "Food", "Travel", "Tech", "Fashion", "Motivational", "Comedy"];
const durations = ["15 seconds", "30 seconds", "60 seconds", "90 seconds"];
const platforms = ["Instagram Reels", "YouTube Shorts", "TikTok"];

interface Scene {
  number: number;
  duration: string;
  visual: string;
  caption: string;
  hook: string;
}

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

function ReelGenerator() {
  const [topic, setTopic] = useState("");
  const [niche, setNiche] = useState("Lifestyle");
  const [duration, setDuration] = useState("30 seconds");
  const [platform, setPlatform] = useState("Instagram Reels");
  const [loading, setLoading] = useState(false);
  const [script, setScript] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [hook, setHook] = useState("");
  const [cta, setCta] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  async function generate() {
    if (!topic.trim()) return;
    setLoading(true);
    setScript(""); setHashtags(""); setHook(""); setCta("");

    const prompt = `Create a complete ${platform} reel package for: "${topic}"
Niche: ${niche}
Duration: ${duration}

Respond in this EXACT format:

HOOK (first 3 seconds):
[Write one punchy, scroll-stopping opening line]

SCRIPT:
[Write the full voiceover script for ${duration}, natural spoken language, energetic]

SCENE BREAKDOWN:
Scene 1 | [duration]s | [what to film] | [on-screen text]
Scene 2 | [duration]s | [what to film] | [on-screen text]
Scene 3 | [duration]s | [what to film] | [on-screen text]
[continue for all scenes]

CALL TO ACTION:
[Strong CTA for the end]

HASHTAGS:
[20 relevant hashtags]

CAPTION:
[Full Instagram/platform caption with emojis]`;

    const result = await callClaude(prompt);

    // Parse sections
    const hookMatch = result.match(/HOOK[^:]*:\s*([\s\S]*?)(?=SCRIPT:|$)/i);
    const scriptMatch = result.match(/SCRIPT:\s*([\s\S]*?)(?=SCENE BREAKDOWN:|$)/i);
    const ctaMatch = result.match(/CALL TO ACTION:\s*([\s\S]*?)(?=HASHTAGS:|$)/i);
    const hashtagMatch = result.match(/HASHTAGS:\s*([\s\S]*?)(?=CAPTION:|$)/i);
    const captionMatch = result.match(/CAPTION:\s*([\s\S]*?)$/i);

    setHook(hookMatch?.[1]?.trim() ?? "");
    setScript(scriptMatch?.[1]?.trim() ?? result);
    setCta(ctaMatch?.[1]?.trim() ?? "");
    setHashtags(hashtagMatch?.[1]?.trim() ?? "");

    setLoading(false);
  }

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  function copyAll() {
    const full = `HOOK:\n${hook}\n\nSCRIPT:\n${script}\n\nCTA:\n${cta}\n\nHASHTAGS:\n${hashtags}`;
    copy(full, "all");
  }

  const CopyBtn = ({ text, id }: { text: string; id: string }) => (
    <button onClick={() => copy(text, id)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition">
      {copied === id ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
      {copied === id ? "Copied!" : "Copy"}
    </button>
  );

  return (
    <div className="flex flex-col gap-6 p-6 max-w-3xl mx-auto w-full">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "var(--gradient-brand)" }}>
          <Wand2 className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Reel Generator</h1>
          <p className="text-sm text-muted-foreground">Script, storyboard, captions & hashtags for viral reels</p>
        </div>
      </div>

      <div className="glass rounded-2xl p-5 flex flex-col gap-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">Platform</label>
          <div className="flex gap-2">
            {platforms.map((p) => (
              <button key={p} onClick={() => setPlatform(p)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  platform === p ? "bg-purple-600 text-white" : "bg-surface border border-border text-muted-foreground hover:bg-surface-elevated"
                }`}>
                {p}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">What's your reel about?</label>
          <textarea value={topic} onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. 3 AI tools that will save you 10 hours a week as a content creator..."
            className="w-full rounded-xl bg-surface border border-border px-4 py-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-purple-500"
            rows={2} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Niche</label>
            <select value={niche} onChange={(e) => setNiche(e.target.value)}
              className="w-full rounded-xl bg-surface border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500">
              {niches.map((n) => <option key={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Duration</label>
            <select value={duration} onChange={(e) => setDuration(e.target.value)}
              className="w-full rounded-xl bg-surface border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500">
              {durations.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
        </div>

        <button onClick={generate} disabled={loading || !topic.trim()}
          className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white transition disabled:opacity-50"
          style={{ background: "var(--gradient-brand)" }}>
          <Sparkles className="h-4 w-4" />
          {loading ? "Generating reel package..." : "Generate Full Reel Package"}
        </button>
      </div>

      {loading && (
        <div className="glass rounded-2xl p-8 flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
          <p className="text-sm text-muted-foreground">Crafting your viral reel package...</p>
        </div>
      )}

      {hook && (
        <div className="flex flex-col gap-4">
          {/* Copy All */}
          <div className="flex justify-end">
            <button onClick={copyAll} className="flex items-center gap-1.5 text-xs font-medium text-purple-400 hover:text-purple-300 transition">
              {copied === "all" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied === "all" ? "Copied!" : "Copy All"}
            </button>
          </div>

          {/* Hook */}
          <div className="glass rounded-2xl p-5 border-l-4 border-purple-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">🎣 Hook (First 3 Seconds)</span>
              <CopyBtn text={hook} id="hook" />
            </div>
            <p className="text-sm font-medium leading-relaxed">{hook}</p>
          </div>

          {/* Script */}
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">📝 Script & Storyboard</span>
              <CopyBtn text={script} id="script" />
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{script}</p>
          </div>

          {/* CTA */}
          {cta && (
            <div className="glass rounded-2xl p-5 border-l-4 border-green-500">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-green-400">🎯 Call to Action</span>
                <CopyBtn text={cta} id="cta" />
              </div>
              <p className="text-sm leading-relaxed">{cta}</p>
            </div>
          )}

          {/* Hashtags */}
          {hashtags && (
            <div className="glass rounded-2xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"># Hashtags</span>
                <CopyBtn text={hashtags} id="hashtags" />
              </div>
              <p className="text-sm text-purple-400 leading-relaxed">{hashtags}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
