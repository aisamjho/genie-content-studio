import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "motion/react";
import { getUser } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n";
import { THEMES, applyTheme } from "@/lib/themes";
import {
  Image as ImageIcon,
  Film,
  Video,
  Wand2,
  PenLine,
  Briefcase,
  LayoutTemplate,
  Palette,
  Mic,
  Music,
  Sparkles,
  Layers,
  ArrowRight,
  Check,
  Zap,
  ShieldCheck,
  Globe,
  ChevronDown,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/")(({
  head: () => ({
    meta: [
      { title: "Geenie AI Studio — Create Amazing Content with AI in Seconds" },
      {
        name: "description",
        content:
          "Free AI photo editor with cinematic filters, video editor with real exports, anime & cartoon art generator, and Instagram carousel maker — all in one browser-based studio.",
      },
      { property: "og:title", content: "Geenie AI Studio" },
      {
        property: "og:description",
        content: "Create Amazing Content with AI in Seconds.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: LandingPage,
}));

const studios = [
  {
    icon: ImageIcon,
    name: "Photo Editor",
    desc: "Brightness, contrast, saturation, filters, rotate — edit any photo instantly.",
  },
  {
    icon: Video,
    name: "Video Editor",
    desc: "Filters, captions, speed control, trim & background music for Reels & Shorts.",
  },
  {
    icon: Sparkles,
    name: "Anime Style",
    desc: "Generate Ghibli, Naruto, Demon Slayer, Chibi anime art from a text description — free.",
  },
  {
    icon: Palette,
    name: "Cartoon & Comic",
    desc: "Disney Pixar, Manga, Lego, Simpsons, Pop Art, Sticker styles and more.",
  },
  {
    icon: Layers,
    name: "Carousel Maker",
    desc: "Multi-slide Instagram carousels — quotes, tips lists, before/after posts.",
  },
];

const plans = [
  {
    name: "Starter",
    price: "$0",
    period: "forever",
    desc: "Try all tools free.",
    features: [
      "✅ Photo Editor — full access",
      "✅ Video Editor — full access",
      "⚡ Anime Style — 5 generations only",
      "⚡ Cartoon & Comic — 5 generations only",
      "⚠️ Photo downloads have watermark",
      "⚠️ Video downloads are SD only",
    ],
    highlight: false,
    cta: "Start for free",
  },
  {
    name: "Creator",
    price: "$2",
    period: "/ month",
    desc: "For creators who want more.",
    features: [
      "✅ Everything in Free",
      "✅ Unlimited Anime & Cartoon generations",
      "✅ No watermark on photos",
      "✅ HD video downloads (up to 1080p)",
      "✅ Ask AI — describe an edit, AI applies it",
      "✅ Priority support",
    ],
    highlight: true,
    cta: "Upgrade — $2/mo",
  },
  {
    name: "Studio",
    price: "$7",
    period: "/ month",
    desc: "For power users who want the best output quality.",
    features: [
      "✅ Everything in Creator",
      "✅ Full native resolution video (no 1080p cap)",
      "✅ Dedicated support",
      "✅ Early access to new features",
    ],
    highlight: false,
    cta: "Get Studio — $7/mo",
  },
];

const faqs = [
  {
    q: "Is Geenie AI really free?",
    a: "Yes, you can start for free. Photo and Video Editor are free with a small watermark and SD video, and Anime/Cartoon give 5 free generations each. Upgrade to Creator ($2/mo) to remove the watermark, get HD video, and unlimited generations.",
  },
  {
    q: "Do I need to install anything?",
    a: "No. Geenie works entirely in your browser. No download, no install. Works on phone and desktop.",
  },
  {
    q: "Can I use this for Instagram Reels and YouTube Shorts?",
    a: "Yes. The Video Editor supports 9:16 (Reels/Shorts), 1:1 (feed), and 16:9 (YouTube) ratios. Add music, captions, filters and speed effects.",
  },
  {
    q: "What is the Anime Style feature?",
    a: "Describe a character or scene and AI generates original anime art in styles like Studio Ghibli, Naruto, Demon Slayer, Chibi and more. It creates new art from your description — it doesn't convert an uploaded photo (true photo-to-anime conversion needs a paid model we haven't added yet).",
  },
  {
    q: "How does payment work?",
    a: "We use Razorpay for secure payments. You can pay with UPI, credit/debit card, or net banking. Plans are monthly and you can cancel anytime.",
  },
  {
    q: "Will my photos and videos be stored?",
    a: "No. All editing happens in your browser. We never upload or store your files. Your content stays private on your device.",
  },
];

const roadmap = [
  {
    tag: "Live now",
    items: ["Photo Editor", "Video Editor", "Anime Style", "Cartoon & Comic", "Carousel Maker"],
  },
  {
    tag: "Recently added",
    items: ["Cinematic filters & effects", "Real video export with music", "4-language support"],
  },
  {
    tag: "Exploring",
    items: ["True photo-to-anime conversion", "More languages", "Background removal"],
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium"
        aria-expanded={open}
      >
        <span>{q}</span>
        <ChevronDown
          className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="px-5 pb-4 text-sm text-muted-foreground">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Razorpay requires amounts in paise (1 INR = 100 paise)
// $2 USD ≈ ₹166 INR = 16600 paise
// $7 USD ≈ ₹583 INR = 58300 paise
const planAmounts: Record<string, number> = {
  Starter: 0,
  Creator: 16600,
  Studio: 58300,
};

const planLabels: Record<string, string> = {
  Creator: "₹166 / month (~$2)",
  Studio: "₹583 / month (~$7)",
};

function PricingButton({ plan }: { plan: (typeof plans)[number] }) {
  const navigate = useNavigate();

  function handleClick() {
    if (plan.name === "Starter") {
      navigate({ to: "/auth" });
      return;
    }
    const amount = planAmounts[plan.name];
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount,
      currency: "INR",
      name: "Geenie Content Studio",
      description: `${plan.name} Plan — ${planLabels[plan.name]}`,
      image: "/favicon.svg",
      handler: function () {
        // This fires only on a successful payment (Razorpay never calls it
        // otherwise). Previously nothing here ever wrote the upgraded plan
        // anywhere — every studio reads geenie_plan from localStorage to
        // gate watermarks, generation limits, and HD exports, but nothing
        // in the entire app ever set it after payment. A real, successful
        // payment was activating no benefit at all. Fixed below.
        if (typeof window !== "undefined") {
          localStorage.setItem("geenie_plan", plan.name.toLowerCase());
        }
        // Someone upgrading from inside the dashboard is already signed
        // in — sending them back to the login screen after they just paid
        // was its own separate bug. Route based on actual auth state.
        navigate({ to: getUser() ? "/dashboard" : "/auth" });
      },
      prefill: { name: "", email: "" },
      theme: { color: "#7c3aed" },
    };
    // @ts-ignore
    const rzp = new window.Razorpay(options);
    rzp.open();
  }

  return (
    <button
      onClick={handleClick}
      className={`mt-7 w-full rounded-xl px-4 py-2.5 text-sm font-medium transition active:scale-95 ${
        plan.highlight
          ? "text-white hover:opacity-90"
          : "border-2 border-orange-400 hover:bg-orange-50 text-orange-600 font-medium"
      }`}
      style={{ background: plan.highlight ? "var(--gradient-brand)" : plan.name === "Studio" ? "linear-gradient(135deg,#1a1a2e,#2d2d50)" : undefined, color: !plan.highlight && plan.name !== "Studio" ? undefined : "white" }}
    >
      {plan.cta}
    </button>
  );
}

function LandingPage() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-32">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto inline-flex items-center gap-2 rounded-full border border-border/70 bg-surface/60 px-4 py-1.5 text-xs text-muted-foreground backdrop-blur"
          >
            <Sparkles className="h-3.5 w-3.5" style={{ color: "var(--magenta)" }} />
            5 AI studios · One subscription · Zero complexity
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="mx-auto mt-6 max-w-4xl text-5xl font-semibold leading-[1.05] tracking-tight md:text-7xl"
          >
            Create <span className="text-gradient">amazing content</span> with AI in seconds.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground"
          >
            Edit photos with cinematic filters, export real video with music, and turn any idea
            into anime art, cartoon style, or an Instagram carousel — free to start.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.22 }}
            className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground"
          >
            <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5" style={{ color: "var(--magenta)" }} />No card required</span>
            <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5" style={{ color: "var(--magenta)" }} />5 AI studios, one login</span>
            <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5" style={{ color: "var(--magenta)" }} />Your files stay on your device</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-3"
          >
            <a
              href="#pricing"
              className="glow inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-medium text-white transition hover:opacity-95 active:scale-95"
              style={{ background: "var(--gradient-brand)" }}
            >
              {t("landing.startCreatingFree")} <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#features"
              className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-surface/60 px-6 py-3 text-sm font-medium backdrop-blur transition hover:bg-surface"
            >
              {t("landing.exploreStudios")}
            </a>
          </motion.div>

          {/* Hero visual */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35 }}
            className="relative mx-auto mt-20 max-w-5xl"
          >
            <div
              aria-hidden
              className="absolute -inset-10 -z-10 rounded-[3rem] opacity-60 blur-3xl"
              style={{ background: "var(--gradient-brand)" }}
            />
            <div
              aria-hidden
              className="absolute -inset-16 -z-20 rounded-[4rem] opacity-25 blur-3xl"
              style={{ background: "linear-gradient(135deg, var(--violet), var(--magenta))" }}
            />
            <div className="glass overflow-hidden rounded-3xl p-2 shadow-2xl">
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                {studios.slice(0, 8).map((s) => (
                  <div
                    key={s.name}
                    className="group flex flex-col items-start gap-3 rounded-2xl bg-surface-elevated/70 p-5 transition hover:bg-surface-elevated"
                  >
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-lg"
                      style={{ background: "var(--gradient-brand)" }}
                    >
                      <s.icon className="h-4 w-4 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium">{s.name}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Theme showcase — interactive preview that actually changes the page
          colours live so visitors immediately see the value of the feature
          before they even sign up. Resets to default on section leave. */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="glass rounded-3xl p-8 md:p-12">
          <div className="text-center mb-8">
            <p className="text-sm font-medium mb-2" style={{ color: "var(--magenta)" }}>🎨 Make it yours</p>
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">8 themes. Your vibe.</h2>
            <p className="mt-3 text-muted-foreground">Hover a theme to preview it live — right here on this page.</p>
          </div>
          <div className="grid grid-cols-4 gap-3 md:grid-cols-8">
            {THEMES.map((theme) => (
              <motion.button
                key={theme.id}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                onMouseEnter={() => { if (typeof document !== "undefined") applyTheme(theme); }}
                onMouseLeave={() => {
                  if (typeof document !== "undefined") {
                    const saved = typeof window !== "undefined" ? localStorage.getItem("geenie_theme") : null;
                    const savedTheme = THEMES.find((t) => t.id === (saved ?? "default")) ?? THEMES[0];
                    applyTheme(savedTheme);
                  }
                }}
                onClick={() => {
                  if (typeof window !== "undefined") {
                    localStorage.setItem("geenie_theme", theme.id);
                    applyTheme(theme);
                  }
                }}
                className="flex flex-col items-center gap-2 rounded-2xl p-3 transition hover:bg-surface-elevated"
              >
                <div
                  className="h-10 w-10 rounded-full shadow-lg ring-2 ring-white/20"
                  style={{ background: theme.gradient }}
                />
                <span className="text-[11px] font-medium text-muted-foreground">{theme.emoji} {theme.name}</span>
              </motion.button>
            ))}
          </div>
          <div className="mt-8 flex justify-center">
            <div className="rounded-2xl p-5 text-center max-w-md" style={{ background: "var(--gradient-brand)" }}>
              <p className="text-white font-semibold text-sm">Colour theme applies across the entire app</p>
              <p className="text-white/80 text-xs mt-1">Every button, gradient and accent — instantly, no reload needed.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4" style={{ scrollMarginTop: "96px" }}>
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium" style={{ color: "var(--magenta)" }}>
            5 AI studios. One workspace.
          </p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
            Everything you need to ship content.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Upload your media, describe what you want, and Geenie picks the right AI behind the
            scenes.
          </p>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {studios.map((s, i) => (
            <motion.div
              key={s.name}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: i * 0.03 }}
            >
              <Link
                to="/auth"
                className="glass group block rounded-2xl p-6 transition hover:-translate-y-0.5 cursor-pointer"
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background: "var(--gradient-brand)" }}
                >
                  <s.icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">{s.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Why */}
      <section className="mx-auto mt-32 max-w-6xl px-4">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              icon: Zap,
              title: "Seconds, not hours",
              desc: "From upload to finished asset in under a minute.",
            },
            {
              icon: ShieldCheck,
              title: "Privacy by design",
              desc: "Your photos and videos are edited right in your browser — never uploaded to a server.",
            },
            {
              icon: Globe,
              title: "Built for every channel",
              desc: "Auto-resize for Instagram, YouTube, TikTok, LinkedIn.",
            },
          ].map((b) => (
            <div key={b.title} className="glass rounded-2xl p-6">
              <b.icon className="h-6 w-6" style={{ color: "var(--magenta)" }} />
              <h3 className="mt-4 text-lg font-semibold">{b.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto mt-32 max-w-6xl px-4 pt-4" style={{ scrollMarginTop: "96px" }}>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-4xl font-semibold tracking-tight md:text-5xl">
            Pricing for every creator.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Start free. Upgrade when you're ready to ship more.
          </p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative rounded-2xl p-7 ${p.highlight ? "glow" : ""} glass`}
              style={
                p.highlight
                  ? { borderColor: "color-mix(in oklab, var(--violet) 50%, transparent)" }
                  : undefined
              }
            >
              {p.highlight && (
                <span
                  className="absolute -top-3 left-7 rounded-full px-3 py-1 text-xs font-medium text-white"
                  style={{ background: "var(--gradient-brand)" }}
                >
                  Most popular
                </span>
              )}
              <h3 className="text-lg font-semibold">{p.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-semibold">{p.price}</span>
                <span className="text-sm text-muted-foreground">{p.period}</span>
              </div>
              <ul className="mt-6 space-y-3 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--magenta)" }} />
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>
              <PricingButton plan={p} />
            </div>
          ))}
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Payments via Razorpay · UPI · Credit/Debit Card · Net Banking. Cancel anytime.
        </p>
      </section>

      {/* Roadmap */}
      <section id="roadmap" className="mx-auto mt-32 max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-4xl font-semibold tracking-tight md:text-5xl">What's next.</h2>
          <p className="mt-4 text-muted-foreground">A transparent roadmap. Built in public.</p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {roadmap.map((r) => (
            <div key={r.tag} className="glass rounded-2xl p-6">
              <span
                className="inline-block rounded-full px-3 py-1 text-xs font-medium text-white"
                style={{ background: "var(--gradient-brand)" }}
              >
                {r.tag}
              </span>
              <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
                {r.items.map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: "var(--magenta)" }}
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto mt-32 max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-4xl font-semibold tracking-tight md:text-5xl">
            Loved by creators.
          </h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            {
              q: "Geenie replaced four tools in my workflow. I just describe what I want.",
              n: "Aisha R.",
              r: "Content creator",
              initials: "AR",
            },
            {
              q: "I made my first Reel in under 5 minutes. The cinematic filters look so professional.",
              n: "Marcus L.",
              r: "Content creator",
              initials: "ML",
            },
            {
              q: "The image studio alone is worth it. Cinematic edits in one click.",
              n: "Priya S.",
              r: "Photographer",
              initials: "PS",
            },
          ].map((t) => (
            <div key={t.n} className="glass rounded-2xl p-6">
              <p className="text-sm leading-relaxed text-muted-foreground">"{t.q}"</p>
              <div className="mt-5 flex items-center gap-3">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                  style={{ background: "var(--gradient-brand)" }}
                >
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-medium">{t.n}</p>
                  <p className="text-xs text-muted-foreground">{t.r}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto mt-32 max-w-3xl px-4" style={{ scrollMarginTop: "96px" }}>
        <div className="text-center">
          <h2 className="text-4xl font-semibold tracking-tight md:text-5xl">
            Questions, answered.
          </h2>
        </div>
        <div className="mt-12 space-y-3">
          {faqs.map((f) => (
            <FaqItem key={f.q} q={f.q} a={f.a} />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto mt-32 max-w-5xl px-4">
        <div className="glass glow relative overflow-hidden rounded-3xl p-12 text-center">
          <div
            aria-hidden
            className="absolute inset-0 -z-10 opacity-30"
            style={{ background: "var(--gradient-brand)" }}
          />
          <h2 className="text-3xl font-semibold tracking-tight md:text-5xl">
            Your next post is one prompt away.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Join creators using Geenie AI Studio to ship content their audience actually stops for.
          </p>
          <a
            href="#pricing"
            className="mt-8 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-medium text-white transition hover:opacity-95 active:scale-95"
            style={{ background: "var(--gradient-brand)" }}
          >
            Get started free <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
