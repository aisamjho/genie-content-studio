import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { Upload, Download, Play, Pause, Sun, Contrast, RefreshCw, Music, X, Zap, Lock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/studios/video-editor")({
  head: () => ({ meta: [{ title: "Video Editor — Geenie AI Studio" }] }),
  component: VideoEditor,
});

const videoFilters = [
  { name: "Original", css: "" },
  { name: "B&W", css: "grayscale(1)" },
  { name: "Vintage", css: "sepia(0.6) contrast(1.1)" },
  { name: "Vivid", css: "saturate(1.8) contrast(1.1)" },
  { name: "Cool", css: "hue-rotate(15deg) saturate(1.2)" },
  { name: "Warm", css: "hue-rotate(-10deg) saturate(1.2)" },
  { name: "Dramatic", css: "contrast(1.5) brightness(0.85)" },
  { name: "Fade", css: "contrast(0.8) brightness(1.15) saturate(0.75)" },
];

const textStyles = [
  { label: "Bold White", color: "white", shadow: "2px 2px 6px black", size: "1.6rem" },
  { label: "Yellow Caption", color: "yellow", shadow: "2px 2px 6px black", size: "1.5rem" },
  { label: "Pink Neon", color: "#ff6ef7", shadow: "0 0 12px #ff6ef7", size: "1.6rem" },
  { label: "Clean Black", color: "#111", shadow: "none", size: "1.5rem" },
];

const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];

// Free music tracks from Pixabay (royalty-free)
const onlineTracks = [
  { name: "Upbeat Energy", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", genre: "Pop" },
  { name: "Chill Vibes", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", genre: "Lofi" },
  { name: "Epic Cinematic", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3", genre: "Cinematic" },
  { name: "Hip Hop Beat", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3", genre: "Hip Hop" },
  { name: "Acoustic Guitar", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3", genre: "Acoustic" },
  { name: "Dance Floor", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3", genre: "Electronic" },
];

function VideoEditor() {
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState(videoFilters[0]);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [speed, setSpeed] = useState(1);
  const [overlayText, setOverlayText] = useState("");
  const [textStyle, setTextStyle] = useState(textStyles[0]);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(100);
  const [activeTab, setActiveTab] = useState<"filters"|"text"|"speed"|"trim"|"music"|"smart">("filters");
  const [aspect, setAspect] = useState<"9:16"|"1:1"|"16:9">("9:16");
  const [musicSrc, setMusicSrc] = useState<string | null>(null);
  const [musicName, setMusicName] = useState("");
  const [musicVolume, setMusicVolume] = useState(70);
  const [showOnlineMusic, setShowOnlineMusic] = useState(false);
  const [smartPrompt, setSmartPrompt] = useState("");
  const [smartLoading, setSmartLoading] = useState(false);
  const [smartMsg, setSmartMsg] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const musicInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (videoRef.current) videoRef.current.playbackRate = speed; }, [speed]);
  useEffect(() => { if (audioRef.current) audioRef.current.volume = musicVolume / 100; }, [musicVolume]);

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoSrc(URL.createObjectURL(file));
    setPlaying(false); setCurrentTime(0);
  }

  function handleMusicUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMusicSrc(URL.createObjectURL(file));
    setMusicName(file.name.replace(/\.[^.]+$/, ""));
  }

  function selectOnlineTrack(track: typeof onlineTracks[0]) {
    setMusicSrc(track.url);
    setMusicName(track.name);
    setShowOnlineMusic(false);
  }

  async function applyVideoSmartEdit() {
    if (!smartPrompt.trim()) return;
    setSmartLoading(true);
    setSmartMsg("");
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 200,
        messages: [{ role: "user", content: `Convert this video editing instruction to CSS filter values. Instruction: "${smartPrompt}". Current: brightness=${brightness}, contrast=${contrast}. Respond ONLY with JSON: {"brightness":110,"contrast":120,"filter":"sepia(0.3)","filterName":"Warm","message":"Applied warm tone"}` }]
      })
    });
    const data = await res.json();
    try {
      const text = data.content?.[0]?.text ?? "{}";
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      if (parsed.brightness) setBrightness(parsed.brightness);
      if (parsed.contrast) setContrast(parsed.contrast);
      if (parsed.filter !== undefined) setActiveFilter({ name: parsed.filterName || "Smart", css: parsed.filter });
      setSmartMsg(parsed.message || "Edit applied!");
      setSmartPrompt("");
    } catch { setSmartMsg("Try: 'make it cinematic' or 'add warm tones'"); }
    setSmartLoading(false);
  }

  function togglePlay() {
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.pause();
      audioRef.current?.pause();
    } else {
      videoRef.current.play();
      audioRef.current?.play();
    }
    setPlaying(!playing);
  }

  function handleTimeUpdate() {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
    const endTime = (trimEnd / 100) * duration;
    if (videoRef.current.currentTime >= endTime) {
      videoRef.current.pause(); audioRef.current?.pause();
      setPlaying(false);
      videoRef.current.currentTime = (trimStart / 100) * duration;
    }
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const t = (Number(e.target.value) / 100) * duration;
    if (videoRef.current) videoRef.current.currentTime = t;
    setCurrentTime(t);
  }

  function formatTime(s: number) {
    const m = Math.floor(s / 60);
    return `${m}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
  }

  const filterStyle = `brightness(${brightness}%) contrast(${contrast}%) ${activeFilter.css}`;
  const aspectClass = aspect === "9:16" ? "max-w-[260px]" : aspect === "1:1" ? "max-w-[360px]" : "max-w-full";

  const tabs = [
    { key: "filters" as const, label: "🎨" },
    { key: "text" as const, label: "✏️" },
    { key: "speed" as const, label: "⚡" },
    { key: "trim" as const, label: "✂️" },
    { key: "music" as const, label: "🎵" },
    { key: "smart" as const, label: "🪄" },
  ];

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: "var(--gradient-brand)" }}>
          <Play className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Video Editor</h1>
          <p className="text-sm text-muted-foreground">Edit Reels & Shorts · Add music · Apply filters</p>
        </div>
      </div>

      {!videoSrc ? (
        <button onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-surface/50 py-20 transition hover:border-orange-500/50 hover:bg-surface">
          <div className="flex h-14 w-14 items-center justify-center rounded-full" style={{ background: "var(--gradient-brand)" }}>
            <Upload className="h-6 w-6 text-white" />
          </div>
          <p className="text-sm font-medium">Tap to upload your video</p>
          <p className="text-xs text-muted-foreground">MP4, MOV, WEBM</p>
        </button>
      ) : (
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Preview */}
          <div className="flex flex-col gap-3 items-center flex-1">
            <div className="flex gap-2 self-start">
              {(["9:16","1:1","16:9"] as const).map((a) => (
                <button key={a} onClick={() => setAspect(a)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${aspect === a ? "text-white" : "bg-surface border border-border text-muted-foreground"}`}
                  style={aspect === a ? { background: "var(--gradient-brand)" } : undefined}>{a}</button>
              ))}
            </div>

            <div className={`relative bg-black rounded-2xl overflow-hidden w-full ${aspectClass} mx-auto`}>
              <video ref={videoRef} src={videoSrc} className="w-full object-contain"
                style={{ filter: filterStyle }}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={() => { if (videoRef.current) setDuration(videoRef.current.duration); }}
                onEnded={() => { setPlaying(false); audioRef.current?.pause(); }}
              />
              {overlayText && (
                <div className="absolute bottom-6 left-0 right-0 flex justify-center px-3">
                  <p className="text-center px-3 py-1 rounded-lg bg-black/30 backdrop-blur-sm"
                    style={{ fontSize: textStyle.size, color: textStyle.color, textShadow: textStyle.shadow, fontWeight: "bold" }}>
                    {overlayText}
                  </p>
                </div>
              )}
            </div>

            {musicSrc && (
              <audio ref={audioRef} src={musicSrc} loop className="hidden" />
            )}

            <div className="w-full">
              <input type="range" min={0} max={100}
                value={duration ? (currentTime / duration) * 100 : 0}
                onChange={handleSeek} className="w-full accent-orange-500" />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>{musicName && <span className="text-orange-400">🎵 {musicName}</span>}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <div className="flex gap-2 w-full">
              <button onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 rounded-xl bg-surface border border-border px-3 py-2.5 text-sm font-medium hover:bg-surface-elevated transition">
                <RefreshCw className="h-4 w-4" /> New
              </button>
              <button onClick={togglePlay}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition"
                style={{ background: "var(--gradient-brand)" }}>
                {playing ? <><Pause className="h-4 w-4" /> Pause</> : <><Play className="h-4 w-4" /> Play</>}
              </button>
              <button onClick={() => {
                  const plan = typeof window !== "undefined" ? (localStorage.getItem("geenie_plan") || "starter") : "starter";
                  if (plan === "starter") {
                    const ok = window.confirm("Free plan downloads are SD quality. Upgrade to Creator ($2/mo) for HD. Download anyway?");
                    if (!ok) return;
                  }
                  const a = document.createElement("a"); a.href = videoSrc; a.download = "geenie-reel.mp4"; a.click();
                }}
                className="flex items-center gap-1.5 rounded-xl bg-surface border border-border px-3 py-2.5 text-sm font-medium hover:bg-surface-elevated transition">
                <Download className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Controls panel */}
          <div className="glass rounded-2xl overflow-hidden w-full lg:w-[300px] shrink-0">
            <div className="flex border-b border-border">
              {tabs.map((tab) => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 py-3 text-base transition ${activeTab === tab.key ? "border-b-2 border-orange-500 bg-surface/50" : "text-muted-foreground hover:text-foreground"}`}>
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-4">
              {activeTab === "filters" && (
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-4 gap-2">
                    {videoFilters.map((f) => (
                      <button key={f.name} onClick={() => setActiveFilter(f)}
                        className={`rounded-lg py-2 text-[10px] font-medium transition ${activeFilter.name === f.name ? "text-white" : "bg-surface border border-border text-muted-foreground"}`}
                        style={activeFilter.name === f.name ? { background: "var(--gradient-brand)" } : undefined}>
                        {f.name}
                      </button>
                    ))}
                  </div>
                  <SliderRow icon={Sun} label="Brightness" value={brightness} onChange={setBrightness} min={50} max={150} />
                  <SliderRow icon={Contrast} label="Contrast" value={contrast} onChange={setContrast} min={50} max={150} />
                </div>
              )}

              {activeTab === "text" && (
                <div className="flex flex-col gap-3">
                  <textarea value={overlayText} onChange={(e) => setOverlayText(e.target.value)}
                    placeholder="Add caption to your video..."
                    className="w-full rounded-xl bg-surface border border-border px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-orange-500"
                    rows={3} />
                  <div className="flex flex-col gap-2">
                    {textStyles.map((ts) => (
                      <button key={ts.label} onClick={() => setTextStyle(ts)}
                        className={`rounded-lg px-3 py-2 text-xs font-medium transition text-left ${textStyle.label === ts.label ? "ring-2 ring-orange-500 bg-surface" : "bg-surface border border-border hover:bg-surface-elevated"}`}>
                        {ts.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "speed" && (
                <div className="flex flex-col gap-3">
                  <p className="text-xs text-muted-foreground">Playback Speed</p>
                  <div className="grid grid-cols-3 gap-2">
                    {speeds.map((s) => (
                      <button key={s} onClick={() => setSpeed(s)}
                        className={`rounded-xl py-3 text-sm font-medium transition ${speed === s ? "text-white" : "bg-surface border border-border text-muted-foreground"}`}
                        style={speed === s ? { background: "var(--gradient-brand)" } : undefined}>
                        {s}x
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">0.5x = slow-mo · 2x = time-lapse</p>
                </div>
              )}

              {activeTab === "trim" && (
                <div className="flex flex-col gap-3">
                  <p className="text-xs text-muted-foreground">Trim Video</p>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Start: {formatTime((trimStart / 100) * duration)}</span>
                    <span>End: {formatTime((trimEnd / 100) * duration)}</span>
                  </div>
                  <label className="text-[11px] text-muted-foreground">Start</label>
                  <input type="range" min={0} max={trimEnd - 1} value={trimStart}
                    onChange={(e) => { setTrimStart(Number(e.target.value)); if (videoRef.current) videoRef.current.currentTime = (Number(e.target.value) / 100) * duration; }}
                    className="w-full accent-orange-500" />
                  <label className="text-[11px] text-muted-foreground">End</label>
                  <input type="range" min={trimStart + 1} max={100} value={trimEnd}
                    onChange={(e) => setTrimEnd(Number(e.target.value))} className="w-full accent-orange-500" />
                  <p className="text-xs text-muted-foreground">Duration: {formatTime(((trimEnd - trimStart) / 100) * duration)}</p>
                </div>
              )}

              {activeTab === "music" && (
                <div className="flex flex-col gap-4">
                  {/* Current music */}
                  {musicSrc && (
                    <div className="flex items-center gap-2 rounded-xl bg-orange-500/10 border border-orange-500/30 px-3 py-2">
                      <Music className="h-4 w-4 text-orange-400 shrink-0" />
                      <span className="text-xs font-medium text-orange-400 flex-1 truncate">{musicName}</span>
                      <button onClick={() => { setMusicSrc(null); setMusicName(""); }} className="text-muted-foreground hover:text-red-400">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Volume */}
                  {musicSrc && (
                    <div>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>🔊 Music Volume</span><span>{musicVolume}%</span>
                      </div>
                      <input type="range" min={0} max={100} value={musicVolume}
                        onChange={(e) => setMusicVolume(Number(e.target.value))} className="w-full accent-orange-500" />
                    </div>
                  )}

                  {/* Upload own music */}
                  <button onClick={() => musicInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 rounded-xl bg-surface border border-border px-4 py-2.5 text-sm font-medium hover:bg-surface-elevated transition">
                    <Upload className="h-4 w-4" /> Upload MP3 from device
                  </button>

                  {/* Online tracks */}
                  <div>
                    <button onClick={() => setShowOnlineMusic(!showOnlineMusic)}
                      className="flex items-center justify-center gap-2 w-full rounded-xl px-4 py-2.5 text-sm font-medium text-white transition"
                      style={{ background: "var(--gradient-brand)" }}>
                      <Music className="h-4 w-4" /> {showOnlineMusic ? "Hide" : "Browse Free Music"}
                    </button>

                    {showOnlineMusic && (
                      <div className="flex flex-col gap-2 mt-3">
                        <p className="text-[11px] text-muted-foreground">Royalty-free tracks — safe for Reels & Shorts</p>
                        {onlineTracks.map((track) => (
                          <button key={track.name} onClick={() => selectOnlineTrack(track)}
                            className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-xs transition border ${musicName === track.name ? "border-orange-500 bg-orange-500/10 text-orange-400" : "bg-surface border-border hover:bg-surface-elevated text-foreground"}`}>
                            <span className="font-medium">{track.name}</span>
                            <span className="text-muted-foreground">{track.genre}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground text-center">Music plays during preview only</p>
                </div>
              )}

              {activeTab === "smart" && (
                <div className="flex flex-col gap-3">
                  <p className="text-xs font-semibold">🪄 Smart Edit</p>
                  <p className="text-xs text-muted-foreground">Type what you want — AI applies it instantly</p>
                  {(typeof window !== "undefined" && localStorage.getItem("geenie_plan") !== "creator" && localStorage.getItem("geenie_plan") !== "studio") ? (
                    <div className="rounded-xl bg-orange-50 border border-orange-300 p-3 text-center">
                      <Lock className="h-5 w-5 text-orange-500 mx-auto mb-1" />
                      <p className="text-xs font-semibold text-orange-700">Creator Plan Only</p>
                      <a href="/#pricing" className="text-xs text-orange-600 underline">Upgrade $2/mo →</a>
                    </div>
                  ) : (
                    <>
                      <textarea value={smartPrompt} onChange={(e) => setSmartPrompt(e.target.value)}
                        placeholder="e.g. make it cinematic and dramatic..."
                        className="w-full rounded-xl bg-surface border border-border px-3 py-2 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-orange-500"
                        rows={2} />
                      <button onClick={applyVideoSmartEdit} disabled={smartLoading || !smartPrompt.trim()}
                        className="flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-xs font-medium text-white disabled:opacity-50 transition"
                        style={{ background: "var(--gradient-brand)" }}>
                        <Zap className="h-3.5 w-3.5" />{smartLoading ? "Applying..." : "Apply"}
                      </button>
                      {smartMsg && <p className="text-xs text-green-600 bg-green-50 rounded-lg px-3 py-2">✅ {smartMsg}</p>}
                      <div className="flex flex-col gap-1">
                        {["Cinematic dramatic look","Warm golden hour","Cool blue tone","Vintage film style","High contrast B&W","Dreamy soft glow"].map((s) => (
                          <button key={s} onClick={() => setSmartPrompt(s)}
                            className="text-left text-xs rounded-lg bg-surface border border-border px-2.5 py-1.5 text-muted-foreground hover:bg-surface-elevated transition">
                            {s}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <input ref={fileInputRef} type="file" accept="video/*" onChange={handleUpload} className="hidden" />
      <input ref={musicInputRef} type="file" accept="audio/*" onChange={handleMusicUpload} className="hidden" />
    </div>
  );
}

function SliderRow({ icon: Icon, label, value, onChange, min, max }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: number; onChange: (v: number) => void; min: number; max: number;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Icon className="h-3.5 w-3.5" />{label}</span>
        <span className="text-xs text-muted-foreground">{value}%</span>
      </div>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-orange-500" />
    </div>
  );
}
