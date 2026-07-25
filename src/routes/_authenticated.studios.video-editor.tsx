import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { Upload, Download, Play, Pause, Sun, Contrast, RefreshCw, Film, AlertCircle } from "lucide-react";

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
  { label: "Bold White", color: "#ffffff", shadow: "2px 2px 6px black", size: "1.6rem" },
  { label: "Yellow Caption", color: "#ffeb3b", shadow: "2px 2px 6px black", size: "1.5rem" },
  { label: "Pink Neon", color: "#ff6ef7", shadow: "0 0 12px #ff6ef7", size: "1.6rem" },
  { label: "Clean Black", color: "#111111", shadow: "none", size: "1.5rem" },
];

const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];

function isExportSupported() {
  if (typeof window === "undefined") return false;
  const v = document.createElement("video");
  return typeof (v as any).captureStream === "function" && typeof window.MediaRecorder !== "undefined";
}

function VideoEditor() {
  const navigate = useNavigate();
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
  const [activeTab, setActiveTab] = useState<"filters"|"text"|"speed"|"trim">("filters");
  const [aspect, setAspect] = useState<"9:16"|"1:1"|"16:9">("9:16");
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportError, setExportError] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => { setSupported(isExportSupported()); }, []);
  useEffect(() => { if (videoRef.current && !exporting) videoRef.current.playbackRate = speed; }, [speed, exporting]);

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoSrc(URL.createObjectURL(file));
    setPlaying(false); setCurrentTime(0); setTrimStart(0); setTrimEnd(100);
    setExportError(null);
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
    if (!videoRef.current || exporting) return;
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
    return `${m}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
  }

  /**
   * Real video export: draws each video frame onto a canvas with the
   * selected CSS filter + text overlay baked in, captures the canvas as a
   * stream, mixes in the video's own audio track, and records it with
   * MediaRecorder. This produces an actual downloadable video file with
   * the edits applied — entirely client-side, no server or paid API.
   */
  async function exportVideo() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !videoSrc) return;

    if (!supported) {
      setExportError("Your browser doesn't support video export. Please use Chrome, Edge, or Firefox on desktop or Android.");
      return;
    }

    setExporting(true);
    setExportError(null);
    setExportProgress(0);
    video.pause();
    setPlaying(false);

    const startTime = (trimStart / 100) * duration;
    const endTime = (trimEnd / 100) * duration;

    canvas.width = video.videoWidth || 720;
    canvas.height = video.videoHeight || 1280;
    const ctx = canvas.getContext("2d");
    if (!ctx) { setExporting(false); return; }

    // Seek to trim start and wait for it to actually land there
    await new Promise<void>((resolve) => {
      const onSeeked = () => { video.removeEventListener("seeked", onSeeked); resolve(); };
      video.addEventListener("seeked", onSeeked);
      video.currentTime = startTime;
    });

    // Build the output stream: canvas video frames + original audio track
    const canvasStream = (canvas as any).captureStream(30) as MediaStream;
    let outputStream = canvasStream;
    try {
      const videoEl = video as any;
      const mediaStream: MediaStream | undefined = videoEl.captureStream ? videoEl.captureStream() : videoEl.mozCaptureStream?.();
      const audioTracks = mediaStream?.getAudioTracks?.() ?? [];
      if (audioTracks.length) {
        outputStream = new MediaStream([...canvasStream.getVideoTracks(), ...audioTracks]);
      }
    } catch {
      // No audio track available — export video-only, still works fine
    }

    const mimeType =
      MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus") ? "video/webm;codecs=vp9,opus" :
      MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus") ? "video/webm;codecs=vp8,opus" :
      "video/webm";

    const recorder = new MediaRecorder(outputStream, { mimeType });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

    const finished = new Promise<void>((resolve) => { recorder.onstop = () => resolve(); });

    recorder.start();
    video.playbackRate = speed;
    try { await video.play(); } catch { /* autoplay restrictions — recorder still runs */ }

    const draw = () => {
      if (video.paused || video.ended) return;
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) ${activeFilter.css}`;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.filter = "none";

      if (overlayText) {
        const fontSize = Math.round(canvas.width / 14);
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.textAlign = "center";
        ctx.lineWidth = Math.max(3, fontSize / 10);
        ctx.strokeStyle = "rgba(0,0,0,0.55)";
        ctx.fillStyle = textStyle.color;
        const y = canvas.height - canvas.height * 0.08;
        ctx.strokeText(overlayText, canvas.width / 2, y);
        ctx.fillText(overlayText, canvas.width / 2, y);
      }

      const pct = ((video.currentTime - startTime) / Math.max(0.001, endTime - startTime)) * 100;
      setExportProgress(Math.min(100, Math.max(0, pct)));

      if (video.currentTime >= endTime || video.ended) {
        video.pause();
        recorder.stop();
        return;
      }
      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);

    await finished;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const blob = new Blob(chunks, { type: "video/webm" });
    if (blob.size === 0) {
      setExportError("Export produced an empty file. Please try again — this can happen if the tab was backgrounded during export.");
      setExporting(false);
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "geenie-edited-video.webm";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);

    video.currentTime = startTime;
    video.playbackRate = speed;
    setExporting(false);
    setExportProgress(0);
  }

  function downloadOriginal() {
    if (!videoSrc) return;
    const a = document.createElement("a");
    a.href = videoSrc;
    a.download = "geenie-original.mp4";
    a.click();
  }

  const filterStyle = `brightness(${brightness}%) contrast(${contrast}%) ${activeFilter.css}`;
  const aspectClass = aspect === "9:16" ? "max-w-[260px]" : aspect === "1:1" ? "max-w-[360px]" : "max-w-full";

  const tabs = [
    { key: "filters" as const, label: "🎨" },
    { key: "text" as const, label: "✏️" },
    { key: "speed" as const, label: "⚡" },
    { key: "trim" as const, label: "✂️" },
  ];

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6 max-w-4xl mx-auto w-full">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate({ to: "/dashboard" })}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition mr-1">
          ← Back
        </button>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: "var(--gradient-brand)" }}>
          <Film className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Video Editor</h1>
          <p className="text-sm text-muted-foreground">Edit Reels & Shorts · Filters, text, speed, trim — exports with edits applied</p>
        </div>
      </div>

      {!supported && (
        <div className="flex items-start gap-2 rounded-xl bg-orange-50 border border-orange-200 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
          <p className="text-xs text-orange-700">Video export with edits works best on Chrome, Edge, or Firefox. Your current browser may only support downloading the original file.</p>
        </div>
      )}

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
                onEnded={() => setPlaying(false)}
              />
              {overlayText && (
                <div className="absolute bottom-6 left-0 right-0 flex justify-center px-3">
                  <p className="text-center px-3 py-1 rounded-lg bg-black/30 backdrop-blur-sm"
                    style={{ fontSize: textStyle.size, color: textStyle.color, textShadow: textStyle.shadow, fontWeight: "bold" }}>
                    {overlayText}
                  </p>
                </div>
              )}
              {exporting && (
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-3">
                  <div className="h-10 w-10 animate-spin rounded-full border-3 border-orange-500 border-t-transparent" />
                  <p className="text-white text-sm font-medium">Exporting video... {Math.round(exportProgress)}%</p>
                  <div className="w-40 h-1.5 rounded-full bg-white/20 overflow-hidden">
                    <div className="h-full bg-orange-500 transition-all" style={{ width: `${exportProgress}%` }} />
                  </div>
                  <p className="text-white/60 text-[11px]">Keep this tab open and active</p>
                </div>
              )}
            </div>

            <div className="w-full">
              <input type="range" min={0} max={100}
                value={duration ? (currentTime / duration) * 100 : 0}
                onChange={handleSeek} disabled={exporting} className="w-full accent-orange-500" />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {exportError && (
              <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-3 py-2.5 w-full">
                <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs text-red-600">{exportError}</p>
              </div>
            )}

            <div className="flex gap-2 w-full flex-wrap">
              <button onClick={() => fileInputRef.current?.click()} disabled={exporting}
                className="flex items-center gap-1.5 rounded-xl bg-surface border border-border px-3 py-2.5 text-sm font-medium hover:bg-surface-elevated transition disabled:opacity-40">
                <RefreshCw className="h-4 w-4" /> New
              </button>
              <button onClick={togglePlay} disabled={exporting}
                className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition disabled:opacity-40"
                style={{ background: "var(--gradient-brand)" }}>
                {playing ? <><Pause className="h-4 w-4" /> Pause</> : <><Play className="h-4 w-4" /> Play</>}
              </button>
              <button onClick={downloadOriginal} disabled={exporting} title="Download original file, no edits"
                className="flex items-center gap-1.5 rounded-xl bg-surface border border-border px-3 py-2.5 text-sm font-medium hover:bg-surface-elevated transition disabled:opacity-40">
                <Download className="h-4 w-4" />
              </button>
            </div>

            <button onClick={exportVideo} disabled={exporting}
              className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition disabled:opacity-50"
              style={{ background: "linear-gradient(135deg,#ff5a1f,#f7277e)" }}>
              <Download className="h-4 w-4" />{exporting ? "Exporting..." : "Export Video with Edits"}
            </button>
            <p className="text-[11px] text-muted-foreground text-center">Export renders in real time — a 30s clip takes about 30s (faster at higher speed)</p>
          </div>

          {/* Controls panel */}
          <div className="glass rounded-2xl overflow-hidden w-full lg:w-[300px] shrink-0">
            <div className="flex border-b border-border">
              {tabs.map((tab) => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)} disabled={exporting}
                  className={`flex-1 py-3 text-base transition disabled:opacity-40 ${activeTab === tab.key ? "border-b-2 border-orange-500 bg-surface/50" : "text-muted-foreground hover:text-foreground"}`}>
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
                  <p className="text-[11px] text-muted-foreground">Text is baked into the exported video, bottom-centered.</p>
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
                  <p className="text-xs text-muted-foreground">0.5x = slow-mo · 2x = time-lapse. Applied to the exported file too.</p>
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
            </div>
          </div>
        </div>
      )}

      <input ref={fileInputRef} type="file" accept="video/*" onChange={handleUpload} className="hidden" />
      <canvas ref={canvasRef} className="hidden" />
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
