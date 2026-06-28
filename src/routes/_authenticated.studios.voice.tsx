import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { Mic, Play, Square, Download, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/studios/voice")({
  head: () => ({ meta: [{ title: "Voice Studio — Geenie AI Studio" }] }),
  component: VoiceStudio,
});

const languages = [
  { label: "English (US)", code: "en-US" },
  { label: "English (UK)", code: "en-GB" },
  { label: "Hindi", code: "hi-IN" },
  { label: "Spanish", code: "es-ES" },
  { label: "French", code: "fr-FR" },
  { label: "German", code: "de-DE" },
  { label: "Japanese", code: "ja-JP" },
  { label: "Arabic", code: "ar-SA" },
];

const presets = [
  { label: "YouTube Intro", text: "Hey everyone, welcome back to my channel! Today we're going to explore something amazing that will completely change the way you think about AI content creation." },
  { label: "Ad Voiceover", text: "Introducing Geenie AI Studio — the all-in-one platform that lets you create stunning content with the power of artificial intelligence. Start free today." },
  { label: "Podcast Intro", text: "Welcome to the show! I'm your host, and today we have an incredible episode lined up for you. Let's dive right in." },
  { label: "Instagram Reel", text: "Wait till you see this! I just discovered the most incredible AI tool and I had to share it with you all immediately." },
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
  return data.content?.[0]?.text ?? "";
}

function VoiceStudio() {
  const [text, setText] = useState("");
  const [lang, setLang] = useState(languages[0]);
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    function loadVoices() {
      const v = window.speechSynthesis.getVoices();
      setVoices(v);
      if (v.length > 0) setSelectedVoice(v[0].name);
    }
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  function speak() {
    if (!text.trim()) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang.code;
    utter.rate = rate;
    utter.pitch = pitch;
    const voice = voices.find((v) => v.name === selectedVoice);
    if (voice) utter.voice = voice;
    utter.onstart = () => setPlaying(true);
    utter.onend = () => setPlaying(false);
    utter.onerror = () => setPlaying(false);
    utterRef.current = utter;
    window.speechSynthesis.speak(utter);
  }

  function stop() {
    window.speechSynthesis.cancel();
    setPlaying(false);
  }

  async function generateScript() {
    if (!aiTopic.trim()) return;
    setAiLoading(true);
    const prompt = `Write a natural, engaging voiceover script (60-90 words) about: "${aiTopic}". Make it conversational, punchy, and suitable for a video or podcast. No stage directions, just the spoken words.`;
    const result = await callClaude(prompt);
    setText(result);
    setAiLoading(false);
  }

  const filteredVoices = voices.filter((v) => v.lang.startsWith(lang.code.split("-")[0]));

  return (
    <div className="flex flex-col gap-6 p-6 max-w-3xl mx-auto w-full">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "var(--gradient-brand)" }}>
          <Mic className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Voice Studio</h1>
          <p className="text-sm text-muted-foreground">Convert text to natural speech in any language</p>
        </div>
      </div>

      {/* AI Script Generator */}
      <div className="glass rounded-2xl p-5 flex flex-col gap-3">
        <p className="text-sm font-medium">✨ Generate Script with AI</p>
        <div className="flex gap-2">
          <input
            value={aiTopic}
            onChange={(e) => setAiTopic(e.target.value)}
            placeholder="e.g. product launch for eco-friendly water bottle..."
            className="flex-1 rounded-xl bg-surface border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
          <button
            onClick={generateScript}
            disabled={aiLoading || !aiTopic.trim()}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition disabled:opacity-50"
            style={{ background: "var(--gradient-brand)" }}
          >
            <Sparkles className="h-4 w-4" />
            {aiLoading ? "Writing..." : "Generate"}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <button key={p.label} onClick={() => setText(p.text)} className="rounded-full bg-surface border border-border px-3 py-1 text-xs text-muted-foreground hover:bg-surface-elevated transition">
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Text + Settings */}
      <div className="glass rounded-2xl p-5 flex flex-col gap-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">Script / Text</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type or paste your script here, or generate one with AI above..."
            className="w-full rounded-xl bg-surface border border-border px-4 py-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-purple-500"
            rows={5}
          />
          <p className="text-xs text-muted-foreground mt-1">{text.length} characters · ~{Math.round(text.split(" ").length / 130)} min read</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Language</label>
            <select
              value={lang.code}
              onChange={(e) => setLang(languages.find((l) => l.code === e.target.value) ?? languages[0])}
              className="w-full rounded-xl bg-surface border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              {languages.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
          </div>
          {filteredVoices.length > 0 && (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Voice</label>
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                className="w-full rounded-xl bg-surface border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                {filteredVoices.map((v) => <option key={v.name} value={v.name}>{v.name}</option>)}
              </select>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Speed: {rate}x</label>
            <input type="range" min="0.5" max="2" step="0.1" value={rate} onChange={(e) => setRate(Number(e.target.value))} className="w-full accent-purple-500" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Pitch: {pitch}</label>
            <input type="range" min="0.5" max="2" step="0.1" value={pitch} onChange={(e) => setPitch(Number(e.target.value))} className="w-full accent-purple-500" />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={playing ? stop : speak}
            disabled={!text.trim()}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white transition disabled:opacity-50"
            style={{ background: "var(--gradient-brand)" }}
          >
            {playing ? <><Square className="h-4 w-4" /> Stop</> : <><Play className="h-4 w-4" /> Play Voiceover</>}
          </button>
        </div>
        <p className="text-xs text-center text-muted-foreground">Uses your browser's built-in speech engine · Works offline · Free forever</p>
      </div>
    </div>
  );
}
