import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useAuth } from "@/lib/auth";
import {
  Image as ImageIcon, Film, Video, Wand2, PenLine,
  Briefcase, Palette, Mic, Sparkles, ArrowRight,
  Lock, Zap, TrendingUp, FolderOpen,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Geenie AI Studio" }] }),
  component: DashboardPage,
});

const studios = [
  { icon: ImageIcon, name: "Photo Editor", desc: "Brightness, contrast, filters, crop — edit any photo.", route: "/studios/photo" },
  { icon: Video,     name: "Video Editor", desc: "Edit Reels & Shorts — filters, text, speed, trim.", route: "/studios/video-editor" },
  { icon: Sparkles,  name: "Anime Style",  desc: "Turn your photo or video into anime characters.", route: "/studios/anime" },
];

function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const creditsUsed = (user?.creditsTotal ?? 50) - (user?.credits ?? 50);
  const creditsRemaining = user?.credits ?? 50;
  const creditsTotal = user?.creditsTotal ?? 50;
  const creditsPct = Math.max(0, Math.round((creditsRemaining / creditsTotal) * 100));

  const firstName = user?.fullName?.split(" ")[0] || "there";

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
            Your studios are warming up. First releases ship soon.
          </p>
        </motion.div>

        {/* Credits card */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
          className="glass flex flex-col gap-3 rounded-2xl p-5 min-w-[200px]"
        >
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: "var(--gradient-brand)" }}>
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">AI Credits</p>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-semibold">{creditsRemaining}</span>
            <span className="text-sm text-muted-foreground">/ {creditsTotal}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-elevated">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${creditsPct}%`, background: "var(--gradient-brand)" }}
            />
          </div>
          <p className="text-xs text-muted-foreground capitalize">{user?.plan ?? "starter"} plan · resets monthly</p>
          <a
            href="/#pricing"
            className="mt-1 text-center w-full rounded-lg px-3 py-1.5 text-xs font-medium text-white transition hover:opacity-90"
            style={{ background: "var(--gradient-brand)" }}
          >
            Upgrade plan
          </a>
        </motion.div>
      </div>

      {/* ── Stats ──────────────────────────────────────────────────────── */}
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {[
          { icon: FolderOpen,  label: "Projects",     value: 0, note: "Create your first project" },
          { icon: Zap,         label: "Generations",  value: 0, note: "Run your first generation" },
          { icon: TrendingUp,  label: "Credits used", value: creditsUsed, note: creditsUsed === 0 ? "No credits used yet" : undefined },
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
            <p className="mt-3 text-4xl font-semibold">{s.value}</p>
            {s.note && <p className="mt-1 text-xs text-muted-foreground">{s.note}</p>}
          </motion.div>
        ))}
      </div>

      {/* ── Studios grid ────────────────────────────────────────────────── */}
      <div className="mt-12">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Your Studios</h2>
            <p className="mt-1 text-sm text-muted-foreground">All studios in active development — rolling out one at a time.</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {studios.map((s, i) => (
            <motion.div
              key={s.name}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.25 + i * 0.04 }}
              className="glass group flex flex-col rounded-2xl p-5 transition-transform hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "var(--gradient-brand)" }}>
                  <s.icon className="h-5 w-5 text-white" />
                </div>
                <span className="flex items-center gap-1 rounded-full bg-surface px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  <Lock className="h-2.5 w-2.5" /> Soon
                </span>
              </div>
              <h3 className="mt-4 text-sm font-semibold">{s.name}</h3>
              <p className="mt-1 flex-1 text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
              <button
                onClick={() => navigate({ to: s.route })}
                className="mt-4 inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-purple-400 hover:text-purple-300 transition-colors"
              >
                Open studio <ArrowRight className="h-3 w-3" />
              </button>
            </motion.div>
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
        <h3 className="text-lg font-semibold">Get early access to studios</h3>
        <p className="mt-2 max-w-lg text-sm text-muted-foreground">
          Upgrade to Creator and get priority access when studios go live, plus 2,000 credits per month and HD exports with no watermark.
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
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-5 py-2.5 text-sm font-medium transition hover:bg-surface-elevated"
          >
            Request a feature
          </a>
        </div>
      </motion.div>
    </div>
  );
}
