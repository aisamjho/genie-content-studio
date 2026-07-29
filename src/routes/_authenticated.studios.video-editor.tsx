import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { Upload, Download, Play, Pause, Sun, Contrast, RefreshCw, Film, AlertCircle, Music, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/studios/video-editor")({
  head: () => ({ meta: [{ title: "Video Editor — Geenie AI Studio" }] }),
  component: VideoEditor,
});

// Standard filters + the same 2026 cinematic color-grade presets used in
// Photo Editor, for a consistent look across the app. Because these are
// plain CSS filter strings, they automatically flow into both the live
// preview AND the exported file (see the draw loop in exportVideo below)
// with zero extra plumbing.
const videoFilters = [
  { name: "Original", css: "" },
  { name: "B&W", css: "grayscale(1)" },
  { name: "Vintage", css: "sepia(0.6) contrast(1.1)" },
  { name: "Vivid", css: "saturate(1.8) contrast(1.1)" },
  { name: "Cool", css: "hue-rotate(15deg) saturate(1.2)" },
  { name: "Warm", css: "hue-rotate(-10deg) saturate(1.2)" },
  { name: "Dramatic", css: "contrast(1.5) brightness(0.85)" },
  { name: "Fade", css: "contrast(0.8) brightness(1.15) saturate(0.75)" },
  { name: "Teal & Orange", css: "contrast(1.2) saturate(1.35) hue-rotate(-6deg)", trending: true },
  { name: "Midnight", css: "contrast(1.3) brightness(0.82) saturate(0.75) hue-rotate(190deg)", trending: true },
  { name: "Golden Hour", css: "brightness(1.12) saturate(1.25) sepia(0.18) hue-rotate(-8deg)", trending: true },
  { name: "VHS Retro", css: "contrast(0.85) saturate(0.85) brightness(1.05) sepia(0.15) hue-rotate(340deg)", trending: true },
];

const textStyles = [
  { label: "Bold White", color: "#ffffff", shadow: "2px 2px 6px black", size: "1.6rem" },
  { label: "Yellow Caption", color: "#ffeb3b", shadow: "2px 2px 6px black", size: "1.5rem" },
  { label: "Pink Neon", color: "#ff6ef7", shadow: "0 0 12px #ff6ef7", size: "1.6rem" },
  { label: "Clean Black", color: "#111111", shadow: "none", size: "1.5rem" },
];

const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];

const LIGHT_LEAK_POS: Record<string, { x: string; y: string }> = {
  "top-left": { x: "15%", y: "15%" },
  "top-right": { x: "85%", y: "15%" },
  "bottom-left": { x: "15%", y: "85%" },
  "bottom-right": { x: "85%", y: "85%" },
};
type LeakCorner = keyof typeof LIGHT_LEAK_POS;

function isExportSupported() {
  if (typeof window === "undefined") return false;
  const v = document.createElement("video");
  return typeof (v as any).captureStream === "function" && typeof window.MediaRecorder !== "undefined";
}

/** A single static noise tile, generated once and reused every export frame
 *  (regenerating full-resolution noise 30 times a second would be far too
 *  slow) — cheap to composite via drawImage + globalCompositeOperation. */
function makeNoiseTile(size = 200): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = size; c.height = size;
  const ctx = c.getContext("2d")!;
  const imgData = ctx.createImageData(size, size);
  const buf = imgData.data;
  for (let i = 0; i < buf.length; i += 4) {
    const v = Math.random() * 255;
    buf[i] = v; buf[i + 1] = v; buf[i + 2] = v; buf[i + 3] = 255;
  }
  ctx.putImageData(imgData, 0, 0);
  return c;
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
  const [activeTab, setActiveTab] = useState<"filters"|"text"|"speed"|"trim"|"cinematic"|"music">("filters");
  const [aspect, setAspect] = useState<"9:16"|"1:1"|"16:9">("9:16");
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportError, setExportError] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);
  // This studio previously had zero paid differentiation at all — every
  // export was full native resolution with no watermark for every user
  // regardless of plan, despite being one of the most substantial features
  // in the app (real MediaRecorder export, cinematic effects, music
  // mixing). Adding the same free-vs-paid pattern used everywhere else:
  // capped export resolution + a watermark for free, full native
  // resolution and no watermark for Creator/Studio.
  const [plan, setPlan] = useState("starter");
  // Cinematic effects — same trending "movie look" toggles as Photo Editor.
  const [cinematicBars, setCinematicBars] = useState(false);
  const [filmGrain, setFilmGrain] = useState(false);
  const [grainIntensity, setGrainIntensity] = useState(35);
  const [lightLeak, setLightLeak] = useState(false);
  const [leakCorner, setLeakCorner] = useState<LeakCorner>("bottom-right");
  const [noiseTileUrl, setNoiseTileUrl] = useState<string | null>(null);
  // Music — uploaded MP3 only (not an online library). A cross-origin music
  // URL would get silently muted by the Web Audio API's CORS protections
  // when mixed into the export graph below, which is a failure mode users
  // could never diagnose. A locally uploaded file has no such restriction.
  const [musicSrc, setMusicSrc] = useState<string | null>(null);
  const [musicName, setMusicName] = useState("");
  const [musicVolume, setMusicVolume] = useState(80);
  const [keepOriginalAudio, setKeepOriginalAudio] = useState(true);
  const [originalVolume, setOriginalVolume] = useState(100);
  const videoRef = useRef<HTMLVideoElement>(null);
  const musicRef = useRef<HTMLAudioElement>(null);
  const musicInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const noiseTileRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => { setSupported(isExportSupported()); }, []);
  useEffect(() => { setPlan(localStorage.getItem("geenie_plan") || "starter"); }, []);
  useEffect(() => { if (videoRef.current && !exporting) videoRef.current.playbackRate = speed; }, [speed, exporting]);
  useEffect(() => { if (musicRef.current) musicRef.current.volume = musicVolume / 100; }, [musicVolume]);
  useEffect(() => { if (videoRef.current) videoRef.current.volume = keepOriginalAudio ? originalVolume / 100 : 0; }, [keepOriginalAudio, originalVolume]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const tile = makeNoiseTile(200);
    noiseTileRef.current = tile;
    setNoiseTileUrl(tile.toDataURL());
  }, []);

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoSrc(URL.createObjectURL(file));
    setPlaying(false); setCurrentTime(0); setTrimStart(0); setTrimEnd(100);
    setExportError(null);
  }

  function handleMusicUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMusicSrc(URL.createObjectURL(file));
    setMusicName(file.name.replace(/\.[^.]+$/, ""));
  }

  function removeMusic() {
    setMusicSrc(null);
    setMusicName("");
    if (musicRef.current) musicRef.current.pause();
  }

  function togglePlay() {
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.pause();
      musicRef.current?.pause();
    } else {
      videoRef.current.play();
      if (musicSrc && musicRef.current) {
        musicRef.current.currentTime = 0;
        musicRef.current.play().catch(() => {});
      }
    }
    setPlaying(!playing);
  }

  function handleTimeUpdate() {
    if (!videoRef.current || exporting) return;
    setCurrentTime(videoRef.current.currentTime);
    const endTime = (trimEnd / 100) * duration;
    if (videoRef.current.currentTime >= endTime) {
      videoRef.current.pause();
      musicRef.current?.pause();
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
   * selected CSS filter, cinematic overlays (grain / light leak / letterbox
   * bars), and text overlay baked in, captures the canvas as a stream,
   * mixes in the video's own audio track, and records it with
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
    musicRef.current?.pause();
    setPlaying(false);

    const startTime = (trimStart / 100) * duration;
    const endTime = (trimEnd / 100) * duration;

    // Read plan fresh from localStorage at export time — not from the
    // component state captured at render. This means upgrading mid-session
    // takes effect on the very next export without a page reload.
    const livePlan = typeof window !== "undefined"
      ? (localStorage.getItem("geenie_plan") ?? "starter")
      : plan;
    const isStudio = livePlan === "studio";
    const isPaid = livePlan === "creator" || livePlan === "studio";
    const nativeW = video.videoWidth || 720;
    const nativeH = video.videoHeight || 1280;
    // Three real tiers, not two: free is capped at 720p-equivalent, Creator
    // at 1080p-equivalent, and only Studio gets the source's true native
    // resolution uncapped. Previously Creator and Studio were identical
    // here — every paid-gate in the app treated them the same — which
    // meant Studio's advertised "4K exports" wasn't actually true for
    // anyone. This is what makes it true now.
    const MAX_FREE_EDGE = 720;
    const MAX_CREATOR_EDGE = 1080;
    const longEdge = Math.max(nativeW, nativeH);
    const cap = isStudio ? Infinity : isPaid ? MAX_CREATOR_EDGE : MAX_FREE_EDGE;
    const capScale = longEdge > cap ? cap / longEdge : 1;
    canvas.width = Math.round(nativeW * capScale);
    canvas.height = Math.round(nativeH * capScale);
    const ctx = canvas.getContext("2d");
    if (!ctx) { setExporting(false); return; }

    await new Promise<void>((resolve) => {
      const onSeeked = () => { video.removeEventListener("seeked", onSeeked); resolve(); };
      video.addEventListener("seeked", onSeeked);
      video.currentTime = startTime;
    });

    const canvasStream = (canvas as any).captureStream(30) as MediaStream;
    let outputStream = canvasStream;
    let mixCtx: AudioContext | null = null;
    let exportMusicEl: HTMLAudioElement | null = null;

    try {
      const videoEl = video as any;
      const videoMediaStream: MediaStream | undefined = videoEl.captureStream ? videoEl.captureStream() : videoEl.mozCaptureStream?.();
      const videoAudioTracks = videoMediaStream?.getAudioTracks?.() ?? [];

      if (musicSrc) {
        // Mixing music in requires routing both the video's own audio and
        // the uploaded track through a Web Audio graph into one combined
        // destination stream — this is the actual mechanism that lets
        // music end up baked INTO the downloaded file, not just playing
        // alongside it on screen while recording only silence.
        mixCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const dest = mixCtx.createMediaStreamDestination();

        if (keepOriginalAudio && videoAudioTracks.length) {
          const videoAudioSource = mixCtx.createMediaStreamSource(new MediaStream([videoAudioTracks[0]]));
          const videoGain = mixCtx.createGain();
          videoGain.gain.value = originalVolume / 100;
          videoAudioSource.connect(videoGain).connect(dest);
        }

        // A fresh <audio> element dedicated to export (separate from the
        // live-preview musicRef) — createMediaElementSource can only ever
        // be called once per element, so reusing the preview element would
        // throw on a second export.
        exportMusicEl = new Audio(musicSrc);
        exportMusicEl.loop = true;
        const musicSource = mixCtx.createMediaElementSource(exportMusicEl);
        const musicGain = mixCtx.createGain();
        musicGain.gain.value = musicVolume / 100;
        musicSource.connect(musicGain).connect(dest);

        outputStream = new MediaStream([...canvasStream.getVideoTracks(), ...dest.stream.getAudioTracks()]);
      } else if (videoAudioTracks.length && keepOriginalAudio) {
        outputStream = new MediaStream([...canvasStream.getVideoTracks(), ...videoAudioTracks]);
      }
      // If keepOriginalAudio is off and there's no music, the export is
      // intentionally silent (video-only track).
    } catch {
      // Audio mixing failed for any reason (unsupported browser, etc.) —
      // fall back to a video-only export rather than crashing entirely.
      setExportError("Audio mixing wasn't available on this device — exported without sound. Try Chrome or Edge for full audio support.");
      mixCtx = null;
      exportMusicEl = null;
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
    try {
      if (exportMusicEl) { exportMusicEl.currentTime = 0; await exportMusicEl.play(); }
      await video.play();
    } catch { /* autoplay restrictions — recorder still runs */ }

    const barHeight = canvas.height * 0.09;

    const draw = () => {
      if (video.paused || video.ended) return;
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) ${activeFilter.css}`;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.filter = "none";

      if (lightLeak) {
        const pos = LIGHT_LEAK_POS[leakCorner];
        const cx = (parseFloat(pos.x) / 100) * canvas.width;
        const cy = (parseFloat(pos.y) / 100) * canvas.height;
        const r = Math.max(canvas.width, canvas.height) * 0.55;
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0, "rgba(255,175,90,0.5)");
        g.addColorStop(0.4, "rgba(255,105,140,0.25)");
        g.addColorStop(1, "rgba(255,105,140,0)");
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
      }

      if (filmGrain && noiseTileRef.current) {
        ctx.save();
        ctx.globalAlpha = (grainIntensity / 100) * 0.45;
        ctx.globalCompositeOperation = "overlay";
        // Tile the small noise canvas across the frame instead of
        // stretching it, so the grain stays fine-grained at any resolution.
        const tile = noiseTileRef.current;
        for (let y = 0; y < canvas.height; y += tile.height) {
          for (let x = 0; x < canvas.width; x += tile.width) {
            ctx.drawImage(tile, x, y);
          }
        }
        ctx.restore();
      }

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

      if (cinematicBars) {
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, canvas.width, barHeight);
        ctx.fillRect(0, canvas.height - barHeight, canvas.width, barHeight);
      }

      if (!isPaid) {
        ctx.font = `bold ${Math.max(12, canvas.width / 32)}px sans-serif`;
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
        ctx.shadowColor = "rgba(0,0,0,0.6)";
        ctx.shadowBlur = 4;
        ctx.fillStyle = "rgba(255,255,255,0.75)";
        ctx.fillText("Made with Geenie AI", canvas.width * 0.02, canvas.height - canvas.height * 0.02);
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
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

    // Always tear down the export-only music element and audio graph,
    // whether the export succeeded or the blob came back empty below.
    exportMusicEl?.pause();
    if (mixCtx) { try { await mixCtx.close(); } catch { /* already closed */ } }

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
  const hasCinematicFx = cinematicBars || filmGrain || lightLeak;

  const tabs = [
    { key: "filters" as const, label: "🎨", text: "Filters" },
    { key: "cinematic" as const, label: "🎬", text: "Cinematic" },
    { key: "text" as const, label: "✏️", text: "Text" },
    { key: "music" as const, label: "🎵", text: "Music" },
    { key: "speed" as const, label: "⚡", text: "Speed" },
    { key: "trim" as const, label: "✂️", text: "Trim" },
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
          <p className="text-sm text-muted-foreground">Filters, cinematic FX, text, speed, trim — exports with edits applied</p>
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
              {lightLeak && (
                <div className="absolute inset-0 pointer-events-none" style={{
                  background: `radial-gradient(circle at ${LIGHT_LEAK_POS[leakCorner].x} ${LIGHT_LEAK_POS[leakCorner].y}, rgba(255,175,90,0.5), rgba(255,105,140,0.22) 40%, transparent 70%)`,
                  mixBlendMode: "screen",
                }} />
              )}
              {filmGrain && noiseTileUrl && (
                <div className="absolute inset-0 pointer-events-none" style={{
                  backgroundImage: `url(${noiseTileUrl})`, backgroundSize: "200px 200px", backgroundRepeat: "repeat",
                  opacity: (grainIntensity / 100) * 0.45, mixBlendMode: "overlay",
                }} />
              )}
              {overlayText && (
                <div className="absolute bottom-6 left-0 right-0 flex justify-center px-3">
                  <p className="text-center px-3 py-1 rounded-lg bg-black/30 backdrop-blur-sm"
                    style={{ fontSize: textStyle.size, color: textStyle.color, textShadow: textStyle.shadow, fontWeight: "bold" }}>
                    {overlayText}
                  </p>
                </div>
              )}
              {cinematicBars && (
                <>
                  <div className="absolute top-0 left-0 right-0 bg-black pointer-events-none" style={{ height: "9%" }} />
                  <div className="absolute bottom-0 left-0 right-0 bg-black pointer-events-none" style={{ height: "9%" }} />
                </>
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

            {hasCinematicFx && (
              <p className="text-[11px] text-center text-orange-600 bg-orange-50 rounded-lg py-1.5 w-full">🎬 Cinematic effects active — edit them in the 🎬 tab</p>
            )}
            {musicSrc && (
              <p className="text-[11px] text-center text-orange-600 bg-orange-50 rounded-lg py-1.5 w-full">🎵 Music: {musicName} — will play in Preview and export</p>
            )}

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
              <Download className="h-4 w-4" />{exporting ? "Exporting..." : plan === "studio" ? "Export Native Resolution" : plan === "creator" ? "Export Full HD" : "Export Video (720p)"}
            </button>
            <p className="text-[11px] text-muted-foreground text-center">Export renders in real time — a 30s clip takes about 30s (faster at higher speed)</p>
            {plan !== "creator" && plan !== "studio" && (
              <p className="text-[11px] text-center text-orange-600 bg-orange-50 rounded-lg py-1.5 w-full">
                Free exports are capped at 720p with a small watermark · <a href="/#pricing" className="font-medium hover:underline">Upgrade for full HD, no watermark →</a>
              </p>
            )}
            {plan === "creator" && (
              <p className="text-[11px] text-center text-muted-foreground w-full">
                Creator exports up to 1080p · <a href="/#pricing" className="font-medium text-orange-600 hover:underline">Go Studio for full native/4K resolution →</a>
              </p>
            )}
          </div>

          {/* Controls panel */}
          <div className="glass rounded-2xl overflow-hidden w-full lg:w-[300px] shrink-0">
            <div className="flex border-b border-border">
              {tabs.map((tab) => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)} disabled={exporting}
                  className={`flex-1 py-2.5 flex flex-col items-center gap-0.5 transition disabled:opacity-40 ${activeTab === tab.key ? "border-b-2 border-orange-500 bg-surface/50" : "text-muted-foreground hover:text-foreground"}`}>
                  <span className="text-base">{tab.label}</span>
                  <span className="text-[9px] font-medium">{tab.text}</span>
                </button>
              ))}
            </div>

            <div className="p-4">
              {activeTab === "filters" && (
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-4 gap-2">
                    {videoFilters.map((f) => (
                      <button key={f.name} onClick={() => setActiveFilter(f)}
                        className={`relative rounded-lg py-2 text-[10px] font-medium transition ${activeFilter.name === f.name ? "text-white" : "bg-surface border border-border text-muted-foreground"}`}
                        style={activeFilter.name === f.name ? { background: "var(--gradient-brand)" } : undefined}>
                        {(f as { trending?: boolean }).trending && <span className="absolute -top-1.5 -right-1 text-[9px]" title="Trending">🔥</span>}
                        {f.name}
                      </button>
                    ))}
                  </div>
                  <SliderRow icon={Sun} label="Brightness" value={brightness} onChange={setBrightness} min={50} max={150} />
                  <SliderRow icon={Contrast} label="Contrast" value={contrast} onChange={setContrast} min={50} max={150} />
                </div>
              )}

              {activeTab === "cinematic" && (
                <div className="flex flex-col gap-4">
                  <p className="text-xs font-semibold flex items-center gap-1.5"><Film className="h-3.5 w-3.5 text-orange-500" />Cinematic Effects</p>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={cinematicBars} onChange={(e) => setCinematicBars(e.target.checked)} className="accent-orange-500" />
                    <span className="text-xs flex items-center gap-1">🎞️ Cinematic Bars (letterbox) <span className="text-[9px] bg-orange-100 text-orange-600 px-1 rounded">🔥</span></span>
                  </label>

                  <div>
                    <label className="flex items-center gap-2 cursor-pointer mb-1.5">
                      <input type="checkbox" checked={filmGrain} onChange={(e) => setFilmGrain(e.target.checked)} className="accent-orange-500" />
                      <span className="text-xs flex items-center gap-1">🎬 Film Grain <span className="text-[9px] bg-orange-100 text-orange-600 px-1 rounded">🔥</span></span>
                    </label>
                    {filmGrain && (
                      <input type="range" min={10} max={100} value={grainIntensity} onChange={(e) => setGrainIntensity(Number(e.target.value))} className="w-full accent-orange-500" />
                    )}
                  </div>

                  <div>
                    <label className="flex items-center gap-2 cursor-pointer mb-1.5">
                      <input type="checkbox" checked={lightLeak} onChange={(e) => setLightLeak(e.target.checked)} className="accent-orange-500" />
                      <span className="text-xs">☀️ Light Leak</span>
                    </label>
                    {lightLeak && (
                      <div className="grid grid-cols-4 gap-1.5">
                        {(Object.keys(LIGHT_LEAK_POS) as LeakCorner[]).map((c) => (
                          <button key={c} onClick={() => setLeakCorner(c)}
                            className={`rounded-lg py-1.5 text-[10px] font-medium transition ${leakCorner === c ? "text-white" : "bg-surface border border-border text-muted-foreground"}`}
                            style={leakCorner === c ? { background: "var(--gradient-brand)" } : undefined}>
                            {c.split("-").map((w) => w[0].toUpperCase()).join("")}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">Combine with "Teal & Orange" or "Midnight" filters for a full blockbuster grade.</p>
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

              {activeTab === "music" && (
                <div className="flex flex-col gap-4">
                  <p className="text-xs font-semibold flex items-center gap-1.5"><Music className="h-3.5 w-3.5 text-orange-500" />Background Music</p>

                  {musicSrc ? (
                    <div className="flex items-center gap-2 rounded-xl bg-orange-500/10 border border-orange-500/30 px-3 py-2">
                      <Music className="h-4 w-4 text-orange-500 shrink-0" />
                      <span className="text-xs font-medium text-orange-700 flex-1 truncate">{musicName}</span>
                      <button onClick={removeMusic} className="text-muted-foreground hover:text-red-500"><X className="h-3.5 w-3.5" /></button>
                    </div>
                  ) : (
                    <button onClick={() => musicInputRef.current?.click()}
                      className="flex items-center justify-center gap-2 rounded-xl bg-surface border border-border px-4 py-2.5 text-sm font-medium hover:bg-surface-elevated transition">
                      <Upload className="h-4 w-4" /> Upload MP3
                    </button>
                  )}

                  {musicSrc && (
                    <div>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>🎵 Music Volume</span><span>{musicVolume}%</span>
                      </div>
                      <input type="range" min={0} max={100} value={musicVolume} onChange={(e) => setMusicVolume(Number(e.target.value))} className="w-full accent-orange-500" />
                    </div>
                  )}

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={keepOriginalAudio} onChange={(e) => setKeepOriginalAudio(e.target.checked)} className="accent-orange-500" />
                    <span className="text-xs">Keep original video audio</span>
                  </label>
                  {keepOriginalAudio && (
                    <div>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>🔊 Original Volume</span><span>{originalVolume}%</span>
                      </div>
                      <input type="range" min={0} max={100} value={originalVolume} onChange={(e) => setOriginalVolume(Number(e.target.value))} className="w-full accent-orange-500" />
                    </div>
                  )}

                  <p className="text-[11px] text-muted-foreground">Music is mixed into the exported file for real — plays back with the video everywhere, not just in this preview. Upload from your device only (no online library, to guarantee it actually works).</p>
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
      <input ref={musicInputRef} type="file" accept="audio/*" onChange={handleMusicUpload} className="hidden" />
      {musicSrc && <audio ref={musicRef} src={musicSrc} loop className="hidden" />}
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
