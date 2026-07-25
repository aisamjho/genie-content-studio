import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";
import { AdSlot } from "@/components/ad-slot";
import {
  Image as ImageIcon, Video, Sparkles, Palette, Layers,
  ArrowRight, Zap, TrendingUp, Bookmark, Crown,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Geenie AI Studio" }] }),
  component: DashboardPage,
});

const studios = [
  { icon: ImageIcon, name: "Photo Editor", desc: "Filters, cinematic FX, Smart AI Edit, AI backgrounds.", route: "/studios/photo" },
  { icon: Video,     name: "Video Editor", desc: "Filters, cinematic FX, music, text — exports real video.", route: "/studios/video-editor" },
  { icon: Sparkles,  name: "Anime Style",  desc: "Generate anime art in 8 styles from a text prompt.", route: "/studios/anime", badge: "🔥 Popular" },
  { icon: Palette,   name: "Cartoon & Comic", desc: "Disney, Pixar, Comics, Manga, Lego, Sticker styles.", route: "/studios/cartoon" },
  { icon: Layers,    name: "Carousel Maker", desc: "Multi-slide Instagram carousels — quotes, tips, before/after.", route: "/studios/carousel", badge: "✨ New" },
];

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  starter: { label: "Starter", color: "var(--muted-foreground)" },
  creator: { label: "Creator", color: "var(--magenta)" },
  studio: { label: "Studio", color: "var(--violet)" },
};

function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [plan, setPlan] = useState("starter");
  const [animeUsed, setAnimeUsed] = useState(0);
  const [presetCount, setPresetCount] = useState(0);

  // Pull the real, actively-used plan and usage counters from localStorage
  // — the app's actual gating lives here (see the Anime/Photo studios),
  // not in a separate unused "credits" field on the user object.
  useEffect(() => {
    if (typeof window === "undefined") return;
    setPlan(localStorage.getItem("geenie_plan") || "starter");
    setAnimeUsed(parseInt(localStorage.getItem("geenie_anime_count") || "0"));
    try {
      const presets = JSON.parse(localStorage.getItem("geenie_photo_presets") || "[]");
      if (Array.isArray(presets)) setPresetCount(presets.length);
    } catch { /* corrupted preset data — treat as none */ }
  }, []);

  const isPaid = plan === "creator" || plan === "studio";
  const planInfo = PLAN_LABELS[plan] ?? PLAN_LABELS.starter;
  const firstName = user?.fullName?.split(" ")[0] || "there";
  const animeRemaining = Math.max(0, 5 - animeUsed);

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-10 md:px-10 md:py-14">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-6">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <p className="text-sm font-medium" style={{ color: "var(--magenta)" }}>Dashboard</p>
          <h1 className="mt-1 text-4xl font-semibold tracking-tight md:text-5xl">
            Hey {firstName} 👋
          </h1>
          <p className="mt-2 text-muted-foreground">
            All 5 studios are ready. Pick one below and start creating.
          </p>
        </motion.div>

        {/* Plan card — reflects your real plan, not a fake credits counter */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
          className="glass flex flex-col gap-3 rounded-2xl p-5 min-w-[200px]"
        >
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: "var(--gradient-brand)" }}>
              {isPaid ? <Crown className="h-3.5 w-3.5 text-white" /> : <Sparkles className="h-3.5 w-3.5 text-white" />}
            </div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Your Plan</p>
          </div>
          <p className="text-2xl font-semibold" style={{ color: planInfo.color }}>{planInfo.label}</p>
          <p className="text-xs text-muted-foreground">
            {isPaid ? "Unlimited generations · No watermark · HD exports" : `${animeRemaining} of 5 free anime generations left`}
          </p>
          {!isPaid && (
            <a
              href="/#pricing"
              className="mt-1 text-center w-full rounded-lg px-3 py-1.5 text-xs font-medium text-white transition hover:opacity-90 active:scale-[0.97]"
              style={{ background: "var(--gradient-brand)" }}
            >
              Upgrade — $2/mo
            </a>
          )}
        </motion.div>
      </div>

      {/* ── Stats — real, tracked numbers, not static placeholders ─────── */}
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {[
          { icon: Zap,       label: "Anime Generated", value: animeUsed, note: animeUsed === 0 ? "Try the Anime Style studio" : `${animeRemaining} free left this month` },
          { icon: Bookmark,  label: "Saved Presets",   value: presetCount, note: presetCount === 0 ? "Save a look in Photo Editor" : "In your Cinematic tab" },
          { icon: TrendingUp,label: "Current Plan",    value: planInfo.label, note: isPaid ? "Unlimited access" : "Free tier active" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.15 + i * 0.07 }}
            className="glass rounded-2xl p-5"
          >
            <div className="flex items-center gap-2 text-muted-foreground">
              <s.icon className="h-4 w-4" />
              <p className="text-xs uppercase tracking-wider">{s.label}</p>
            </div>
            <p className="mt-3 text-3xl font-semibold">{s.value}</p>
            {s.note && <p className="mt-1 text-xs text-muted-foreground">{s.note}</p>}
          </motion.div>
        ))}
      </div>

      {/* ── Studios grid ────────────────────────────────────────────────── */}
      <div className="mt-12">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Your Studios</h2>
            <p className="mt-1 text-sm text-muted-foreground">Everything below is live — tap any studio to start.</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {studios.map((s, i) => (
            <motion.button
              key={s.name}
              type="button"
              onClick={() => navigate({ to: s.route })}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.3, delay: 0.25 + i * 0.05 }}
              className="glass group flex flex-col rounded-2xl p-5 text-left cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "var(--gradient-brand)" }}>
                  <s.icon className="h-5 w-5 text-white" />
                </div>
                {s.badge && (
                  <span className="flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-[9px] font-semibold text-orange-600">
                    {s.badge}
                  </span>
                )}
              </div>
              <h3 className="mt-4 text-sm font-semibold">{s.name}</h3>
              <p className="mt-1 flex-1 text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-purple-400 group-hover:text-purple-300 transition-colors">
                Open studio <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* ── CTA banner ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
        className="glass relative mt-10 overflow-hidden rounded-2xl p-7"
      >
        <div aria-hidden className="absolute inset-0 -z-10 opacity-15" style={{ background: "var(--gradient-brand)" }} />
        <h3 className="text-lg font-semibold">Go unlimited with Creator</h3>
        <p className="mt-2 max-w-lg text-sm text-muted-foreground">
          Unlimited anime & cartoon generations, no watermark on photos, HD video exports, and Smart AI Edit — for $2/month.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <a
            href="/#pricing"
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90 active:scale-[0.98]"
            style={{ background: "var(--gradient-brand)" }}
          >
            View pricing <ArrowRight className="h-4 w-4" />
          </a>
          <a
            href="mailto:abhishek2k1985@gmail.com?subject=Feature Request — Geenie AI Studio"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-5 py-2.5 text-sm font-medium transition hover:bg-surface-elevated active:scale-[0.98]"
          >
            Request a feature
          </a>
        </div>
      </motion.div>

      {/* Inert until an AdSense publisher ID is set in src/components/ad-slot.tsx
          — renders nothing on the installed Play Store app or before approval.
          Safe to leave here now, and to copy this pattern anywhere else useful. */}
      <AdSlot slot="dashboard-bottom" className="mt-6" />
    </div>
  );
}
