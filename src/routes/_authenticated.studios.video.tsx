import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Video, Sparkles, Copy, Check } from "lucide-react";

export const Route = createFileRoute("/_authenticated/studios/video")({
  head: () => ({ meta: [{ title: "Video Studio — Geenie AI Studio" }] }),
  component: VideoStudio,
});

const videoTypes = [
  { label: "YouTube Video", emoji: "▶️" },
  { label: "Product Demo", emoji: "📦" },
  { label: "Tutorial / How-To", emoji: "📚" },
  { label: "Testimonial", emoji: "⭐" },
  { label: "Brand Story", emoji: "🏢" },
  { label: "Event Recap", emoji: "🎉" },
  { label: "Documentary", emoji: "🎬" },
  { label: "Explainer", emoji: "💡" },
];

const styles = ["Talking Head", "B-Roll Heavy", "Animated Text", "Cinematic", "Vlog Style", "Minimalist"];

async function callClaude(prompt: string): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await res.json();
  return data.content?.[0]?.text ?? "";
}

function VideoStudio() {
  const [videoType, setVideoType] = useState(videoTypes[0]);
  const [topic, setTopic] = useState("");
  const [style, setStyle] = useState("Talking Head");
  const [duration, setDuration] = useState("5 minutes");
  const [audience, setAudience] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"script" | "shotlist" | "editing">("script");

  const [sections, setSections] = useState<{ script: string; shotlist: string; editing: string }>({
    script: "", shotlist: "", editing: ""
  });

  async function generate() {
    if (!topic.trim()) return;
    setLoading(true);
    setSections({ script: "", shotlist: "", editing: "" });

    const prompt = `Create a complete professional video production package for:

Type: ${videoType.label}
Topic: "${topic}"
Style: ${style}
Duration: ${duration}
Target Audience: ${audience || "General audience"}

Provide ALL of the following sections:

=== SCRIPT ===
[Full word-for-word script with [PAUSE], [EMPHASIS], speaker directions. Include intro hook, main content, outro CTA]

=== SHOT LIST ===
Shot 1 | [Type: Wide/Medium/Close] | [Duration] | [Description] | [Camera movement]
Shot 2 | ...
[Continue for all shots]

=== EDITING GUIDE ===
[Step-by-step CapCut / Premiere Pro editing instructions including:
- Cuts and transitions
- Music recommendations
- Text overlays and timing
- Color grade suggestion
- Export settings]

=== TITLE IDEAS ===
1. [Clickbait title option]
2. [SEO optimized title]
3. [Curiosity gap title]

=== DESCRIPTION ===
[Full YouTube/social description with timestamps and keywords]`;

    const result = await callClaude(prompt);

    const scriptMatch = result.match(/=== SCRIPT ===([\s\S]*?)(?==== SHOT LIST ===|$)/);
    const shotMatch = result.match(/=== SHOT LIST ===([\s\S]*?)(?==== EDITING GUIDE ===|$)/);
    const editingMatch = result.match(/=== EDITING GUIDE ===([\s\S]*?)(?==== TITLE IDEAS ===|$)/);
    const rest = result.match(/=== TITLE IDEAS ===([\s\S]*?)$/);

    setSections({
      script: (scriptMatch?.[1]?.trim() ?? "") + "\n\n" + (rest?.[0]?.trim() ?? ""),
      shotlist: shotMatch?.[1]?.trim() ?? "",
      editing: editingMatch?.[1]?.trim() ?? "",
    });
    setOutput(result);
    setLoading(false);
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const tabs = [
    { key: "script" as const, label: "📝 Script & Titles" },
    { key: "shotlist" as const, label: "🎥 Shot List" },
    { key: "editing" as const, label: "✂️ Editing Guide" },
  ];

  return (
    <div className="flex flex-col gap-6 p-6 max-w-3xl mx-auto w-full">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "var(--gradient-brand)" }}>
          <Video className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Video Studio</h1>
          <p className="text-sm text-muted-foreground">Script, shot list, and editing guide for any video</p>
        </div>
      </div>

      <div className="glass rounded-2xl p-5 flex flex-col gap-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">Video Type</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {videoTypes.map((v) => (
              <button key={v.label} onClick={() => setVideoType(v)}
                className={`rounded-lg px-3 py-2 text-xs font-medium transition flex items-center gap-1.5 ${
                  videoType.label === v.label ? "text-white" : "bg-surface border border-border hover:bg-surface-elevated text-muted-foreground"
                }`}
                style={videoType.label === v.label ? { background: "var(--gradient-brand)" } : undefined}>
                {v.emoji} {v.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">Video Topic</label>
          <textarea value={topic} onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. How I use AI tools to create 30 days of content in just 2 hours..."
            className="w-full rounded-xl bg-surface border border-border px-4 py-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-purple-500"
            rows={2} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Style</label>
            <select value={style} onChange={(e) => setStyle(e.target.value)}
              className="w-full rounded-xl bg-surface border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500">
              {styles.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Duration</label>
            <select value={duration} onChange={(e) => setDuration(e.target.value)}
              className="w-full rounded-xl bg-surface border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500">
              {["1 minute", "3 minutes", "5 minutes", "10 minutes", "15 minutes", "20+ minutes"].map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Target Audience</label>
            <input value={audience} onChange={(e) => setAudience(e.target.value)}
              placeholder="e.g. entrepreneurs"
              className="w-full rounded-xl bg-surface border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500" />
          </div>
        </div>

        <button onClick={generate} disabled={loading || !topic.trim()}
          className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white transition disabled:opacity-50"
          style={{ background: "var(--gradient-brand)" }}>
          <Sparkles className="h-4 w-4" />
          {loading ? "Creating your video package..." : "Generate Full Video Package"}
        </button>
      </div>

      {loading && (
        <div className="glass rounded-2xl p-8 flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
          <p className="text-sm text-muted-foreground">Writing script, shot list & editing guide...</p>
        </div>
      )}

      {sections.script && (
        <div className="glass rounded-2xl overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-border">
            {tabs.map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-3 text-xs font-medium transition ${
                  activeTab === tab.key ? "text-purple-400 border-b-2 border-purple-500 bg-surface/50" : "text-muted-foreground hover:text-foreground"
                }`}>
                {tab.label}
              </button>
            ))}
          </div>
          <div className="p-5">
            <div className="flex justify-end mb-3">
              <button onClick={() => copy(sections[activeTab])} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition">
                {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{sections[activeTab]}</p>
          </div>
        </div>
      )}
    </div>
  );
}
