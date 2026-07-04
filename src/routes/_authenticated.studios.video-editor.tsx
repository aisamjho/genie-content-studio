import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import {
  Upload, Download, Play, Pause, RotateCcw, Type, Zap,
  Sun, Contrast, RefreshCw, Music, Scissors
} from "lucide-react";

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
  { label: "Bold White", style: "2rem bold white", shadow: "2px 2px 4px black" },
  { label: "Yellow Caption", style: "1.8rem bold yellow", shadow: "2px 2px 6px black" },
  { label: "Pink Neon", style: "2rem bold #ff6ef7", shadow: "0 0 10px #ff6ef7" },
  { label: "Clean Black", style: "1.8rem 600 #111", shadow: "none" },
];

const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];

function VideoEditor() {
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState(videoFilters[0]);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [speed, setSpeed] = useState(1);
  const [overlayText, setOverlayText] = useState("");
  const [textStyle, setTextStyle] = useState(textStyles[0]);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(100);
  const [activeTab, setActiveTab] = useState<"filters" | "text" | "speed" | "trim">("filters");
  const [aspect, setAspect] = useState<"9:16" | "1:1" | "16:9">("9:16");
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filterStyle = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) ${activeFilter.css}`;

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  }, [speed]);

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setVideoSrc(url);
    setPlaying(false);
    setCurrentTime(0);
  }

  function togglePlay() {
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setPlaying(!playing);
  }

  function handleTimeUpdate() {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
    const endTime = (trimEnd / 100) * duration;
    if (videoRef.current.currentTime >= endTime) {
      videoRef.current.pause();
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
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }

  const aspectClass = aspect === "9:16" ? "max-w-[280px]" : aspect === "1:1" ? "max-w-[400px]" : "max-w-full";

  const tabs = [
    { key: "filters" as const, label: "🎨 Filters" },
    { key: "text" as const, label: "✏️ Text" },
    { key: "speed" as const, label: "⚡ Speed" },
    { key: "trim" as const, label: "✂️ Trim" },
  ];

  return (
    <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "var(--gradient-brand)" }}>
          <Zap className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Video Editor</h1>
          <p className="text-sm text-muted-foreground">Edit videos for Instagram Reels & YouTube Shorts</p>
        </div>
      </div>

      {!videoSrc ? (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-surface/50 py-20 transition hover:border-purple-500/50 hover:bg-surface"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full" style={{ background: "var(--gradient-brand)" }}>
            <Upload className="h-6 w-6 text-white" />
          </div>
          <p className="text-sm font-medium">Click to upload your video</p>
          <p className="text-xs text-muted-foreground">MP4, MOV, WEBM supported</p>
        </button>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
          {/* Preview */}
          <div className="flex flex-col gap-3 items-center">
            {/* Aspect ratio selector */}
            <div className="flex gap-2 self-start">
              {(["9:16", "1:1", "16:9"] as const).map((a) => (
                <button key={a} onClick={() => setAspect(a)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${aspect === a ? "bg-purple-600 text-white" : "bg-surface border border-border text-muted-foreground hover:bg-surface-elevated"}`}>
                  {a}
                </button>
              ))}
            </div>

            {/* Video */}
            <div className={`relative bg-black rounded-2xl overflow-hidden w-full ${aspectClass}`}>
              <video
                ref={videoRef}
                src={videoSrc}
                className="w-full h-full object-contain"
                style={{ filter: filterStyle }}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={() => {
                  if (videoRef.current) setDuration(videoRef.current.duration);
                }}
                onEnded={() => setPlaying(false)}
              />
              {/* Text overlay */}
              {overlayText && (
                <div className="absolute bottom-8 left-0 right-0 flex justify-center px-4">
                  <p className="text-center px-3 py-1 rounded-lg bg-black/30 backdrop-blur-sm"
                    style={{
                      fontSize: textStyle.style.split(" ")[0],
                      fontWeight: textStyle.style.split(" ")[1],
                      color: textStyle.style.split(" ")[2],
                      textShadow: textStyle.shadow,
                    }}>
                    {overlayText}
                  </p>
                </div>
              )}
            </div>

            {/* Timeline */}
            <div className="w-full flex flex-col gap-1">
              <input type="range" min={0} max={100}
                value={duration ? (currentTime / duration) * 100 : 0}
                onChange={handleSeek}
                className="w-full accent-purple-500" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Playback controls */}
            <div className="flex gap-2 w-full">
              <button onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 rounded-xl bg-surface border border-border px-4 py-2.5 text-sm font-medium hover:bg-surface-elevated transition">
                <RefreshCw className="h-4 w-4" /> New Video
              </button>
              <button onClick={togglePlay}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition"
                style={{ background: "var(--gradient-brand)" }}>
                {playing ? <><Pause className="h-4 w-4" /> Pause</> : <><Play className="h-4 w-4" /> Play</>}
              </button>
              <button
                onClick={() => {
                  const link = document.createElement("a");
                  link.href = videoSrc;
                  link.download = "geenie-reel.mp4";
                  link.click();
                }}
                className="flex items-center justify-center gap-2 rounded-xl bg-surface border border-border px-4 py-2.5 text-sm font-medium hover:bg-surface-elevated transition">
                <Download className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground text-center">Speed: {speed}x · Filter: {activeFilter.name} · {aspect} ratio</p>
          </div>

          {/* Controls */}
          <div className="glass rounded-2xl overflow-hidden">
            {/* Tabs */}
            <div className="grid grid-cols-4 border-b border-border">
              {tabs.map((tab) => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`py-2.5 text-[11px] font-medium transition ${activeTab === tab.key ? "text-purple-400 border-b-2 border-purple-500 bg-surface/50" : "text-muted-foreground hover:text-foreground"}`}>
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
                        className={`flex flex-col items-center gap-1 rounded-lg p-1.5 transition ${activeFilter.name === f.name ? "ring-2 ring-purple-500" : ""}`}>
                        <div className="h-10 w-full rounded-md bg-surface flex items-center justify-center">
                          <span className="text-[9px] text-muted-foreground">{f.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                  <SliderRow icon={Sun} label="Brightness" value={brightness} onChange={setBrightness} min={50} max={150} />
                  <SliderRow icon={Contrast} label="Contrast" value={contrast} onChange={setContrast} min={50} max={150} />
                </div>
              )}

              {activeTab === "text" && (
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-2 block">Caption Text</label>
                    <textarea value={overlayText} onChange={(e) => setOverlayText(e.target.value)}
                      placeholder="Add text overlay to your video..."
                      className="w-full rounded-xl bg-surface border border-border px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-purple-500"
                      rows={3} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-2 block">Text Style</label>
                    <div className="flex flex-col gap-2">
                      {textStyles.map((ts) => (
                        <button key={ts.label} onClick={() => setTextStyle(ts)}
                          className={`rounded-lg px-3 py-2 text-xs font-medium transition text-left ${textStyle.label === ts.label ? "ring-2 ring-purple-500 bg-surface" : "bg-surface border border-border hover:bg-surface-elevated"}`}>
                          {ts.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "speed" && (
                <div className="flex flex-col gap-3">
                  <p className="text-xs font-medium text-muted-foreground">Playback Speed</p>
                  <div className="grid grid-cols-3 gap-2">
                    {speeds.map((s) => (
                      <button key={s} onClick={() => setSpeed(s)}
                        className={`rounded-xl py-3 text-sm font-medium transition ${speed === s ? "text-white" : "bg-surface border border-border text-muted-foreground hover:bg-surface-elevated"}`}
                        style={speed === s ? { background: "var(--gradient-brand)" } : undefined}>
                        {s}x
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">Use 0.5x for slow-motion reels, 1.5-2x for time-lapse effect</p>
                </div>
              )}

              {activeTab === "trim" && (
                <div className="flex flex-col gap-4">
                  <p className="text-xs font-medium text-muted-foreground">Trim Video</p>
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Start: {formatTime((trimStart / 100) * duration)}</span>
                      <span>End: {formatTime((trimEnd / 100) * duration)}</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div>
                        <label className="text-[11px] text-muted-foreground">Start</label>
                        <input type="range" min={0} max={trimEnd - 1} value={trimStart}
                          onChange={(e) => {
                            setTrimStart(Number(e.target.value));
                            if (videoRef.current) videoRef.current.currentTime = (Number(e.target.value) / 100) * duration;
                          }}
                          className="w-full accent-purple-500" />
                      </div>
                      <div>
                        <label className="text-[11px] text-muted-foreground">End</label>
                        <input type="range" min={trimStart + 1} max={100} value={trimEnd}
                          onChange={(e) => setTrimEnd(Number(e.target.value))}
                          className="w-full accent-purple-500" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Duration: {formatTime(((trimEnd - trimStart) / 100) * duration)}</p>
                  </div>
                  <div className="glass rounded-xl p-3 border border-yellow-500/20 bg-yellow-500/5">
                    <p className="text-xs text-yellow-400">💡 Preview uses trim range. For final export with trim, use CapCut or open video in your phone's native editor.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <input ref={fileInputRef} type="file" accept="video/*" onChange={handleUpload} className="hidden" />
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
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Icon className="h-3.5 w-3.5" /> {label}</span>
        <span className="text-xs text-muted-foreground">{value}%</span>
      </div>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-purple-500" />
    </div>
  );
}
