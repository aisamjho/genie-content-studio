import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PenLine, Sparkles, Copy, Check, ChevronDown } from "lucide-react";

export const Route = createFileRoute("/_authenticated/studios/content")({
  head: () => ({ meta: [{ title: "Content Studio — Geenie AI Studio" }] }),
  component: ContentStudio,
});

const contentTypes = [
  { label: "Instagram Caption", prompt: "Write an engaging Instagram caption" },
  { label: "LinkedIn Post", prompt: "Write a professional LinkedIn post" },
  { label: "Twitter/X Thread", prompt: "Write a Twitter/X thread" },
  { label: "Blog Post Intro", prompt: "Write a compelling blog post introduction" },
  { label: "YouTube Description", prompt: "Write a YouTube video description" },
  { label: "Ad Copy", prompt: "Write persuasive ad copy" },
  { label: "Newsletter", prompt: "Write an email newsletter" },
  { label: "Product Description", prompt: "Write a product description" },
];

const tones = ["Professional", "Casual", "Funny", "Inspirational", "Urgent", "Friendly"];

async function callClaude(prompt: string): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await res.json();
  return data.content?.[0]?.text ?? "Error generating content.";
}

function ContentStudio() {
  const [contentType, setContentType] = useState(contentTypes[0]);
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("Professional");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function generate() {
    if (!topic.trim()) return;
    setLoading(true);
    setOutput("");
    const prompt = `${contentType.prompt} about: "${topic}". Tone: ${tone}. Make it engaging, relevant, and ready to post. Include relevant emojis where appropriate.`;
    const result = await callClaude(prompt);
    setOutput(result);
    setLoading(false);
  }

  function copy() {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-3xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "var(--gradient-brand)" }}>
          <PenLine className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Content Studio</h1>
          <p className="text-sm text-muted-foreground">AI-powered captions, posts, blogs & ad copy</p>
        </div>
      </div>

      {/* Controls */}
      <div className="glass rounded-2xl p-5 flex flex-col gap-4">
        {/* Content Type */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">Content Type</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {contentTypes.map((ct) => (
              <button
                key={ct.label}
                onClick={() => setContentType(ct)}
                className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                  contentType.label === ct.label
                    ? "text-white"
                    : "bg-surface border border-border hover:bg-surface-elevated text-muted-foreground"
                }`}
                style={contentType.label === ct.label ? { background: "var(--gradient-brand)" } : undefined}
              >
                {ct.label}
              </button>
            ))}
          </div>
        </div>

        {/* Topic */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">Topic / Brief</label>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. New product launch for eco-friendly water bottles targeting gym-goers..."
            className="w-full rounded-xl bg-surface border border-border px-4 py-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-purple-500"
            rows={3}
          />
        </div>

        {/* Tone */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">Tone</label>
          <div className="flex flex-wrap gap-2">
            {tones.map((t) => (
              <button
                key={t}
                onClick={() => setTone(t)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  tone === t ? "bg-purple-600 text-white" : "bg-surface border border-border text-muted-foreground hover:bg-surface-elevated"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={generate}
          disabled={loading || !topic.trim()}
          className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white transition disabled:opacity-50"
          style={{ background: "var(--gradient-brand)" }}
        >
          <Sparkles className="h-4 w-4" />
          {loading ? "Generating..." : "Generate Content"}
        </button>
      </div>

      {/* Output */}
      {(output || loading) && (
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Generated Content</span>
            {output && (
              <button onClick={copy} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition">
                {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied!" : "Copy"}
              </button>
            )}
          </div>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
              Writing your content...
            </div>
          ) : (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{output}</p>
          )}
        </div>
      )}
    </div>
  );
}
