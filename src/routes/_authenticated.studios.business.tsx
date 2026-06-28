import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Briefcase, Sparkles, Copy, Check } from "lucide-react";

export const Route = createFileRoute("/_authenticated/studios/business")({
  head: () => ({ meta: [{ title: "Business Toolkit — Geenie AI Studio" }] }),
  component: BusinessToolkit,
});

const tools = [
  { label: "Ad Copy", icon: "📢", prompt: "Write high-converting ad copy" },
  { label: "Sales Script", icon: "🎯", prompt: "Write a persuasive sales script" },
  { label: "Business Proposal", icon: "📋", prompt: "Write a professional business proposal" },
  { label: "Cold Email", icon: "📧", prompt: "Write a cold outreach email" },
  { label: "Product Listing", icon: "🛍️", prompt: "Write an optimized product listing" },
  { label: "Pitch Deck Text", icon: "📊", prompt: "Write compelling pitch deck content" },
  { label: "FAQ Section", icon: "❓", prompt: "Write a comprehensive FAQ section" },
  { label: "About Us", icon: "🏢", prompt: "Write an engaging About Us page" },
];

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

function BusinessToolkit() {
  const [tool, setTool] = useState(tools[0]);
  const [businessName, setBusinessName] = useState("");
  const [description, setDescription] = useState("");
  const [audience, setAudience] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function generate() {
    if (!businessName.trim() || !description.trim()) return;
    setLoading(true);
    setOutput("");
    const prompt = `${tool.prompt} for the following business:
Business Name: ${businessName}
Description: ${description}
Target Audience: ${audience || "General audience"}

Make it professional, compelling, and ready to use. Be specific and persuasive.`;
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
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "var(--gradient-brand)" }}>
          <Briefcase className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Business Toolkit</h1>
          <p className="text-sm text-muted-foreground">Ads, proposals, sales scripts & more</p>
        </div>
      </div>

      <div className="glass rounded-2xl p-5 flex flex-col gap-4">
        {/* Tool selector */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">What do you need?</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {tools.map((t) => (
              <button
                key={t.label}
                onClick={() => setTool(t)}
                className={`rounded-lg px-3 py-2 text-xs font-medium transition flex items-center gap-1.5 ${
                  tool.label === t.label ? "text-white" : "bg-surface border border-border hover:bg-surface-elevated text-muted-foreground"
                }`}
                style={tool.label === t.label ? { background: "var(--gradient-brand)" } : undefined}
              >
                <span>{t.icon}</span> {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Business / Product Name</label>
            <input
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. Geenie AI Studio"
              className="w-full rounded-xl bg-surface border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Target Audience</label>
            <input
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="e.g. Small business owners in India"
              className="w-full rounded-xl bg-surface border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">What does your business do?</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. AI-powered content creation platform that helps creators make stunning images, videos and captions in seconds..."
            className="w-full rounded-xl bg-surface border border-border px-4 py-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-purple-500"
            rows={3}
          />
        </div>

        <button
          onClick={generate}
          disabled={loading || !businessName.trim() || !description.trim()}
          className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white transition disabled:opacity-50"
          style={{ background: "var(--gradient-brand)" }}
        >
          <Sparkles className="h-4 w-4" />
          {loading ? "Generating..." : `Generate ${tool.label}`}
        </button>
      </div>

      {(output || loading) && (
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">{tool.label}</span>
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
              Crafting your {tool.label.toLowerCase()}...
            </div>
          ) : (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{output}</p>
          )}
        </div>
      )}
    </div>
  );
}
