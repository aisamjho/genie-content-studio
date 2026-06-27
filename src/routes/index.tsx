import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "motion/react";
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
  ArrowRight,
  Check,
  Zap,
  ShieldCheck,
  Globe,
  ChevronDown,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useState } from "react";

export const Route = createFileRoute("/")(({
  head: () => ({
    meta: [
      { title: "Geenie AI Studio — Create Amazing Content with AI in Seconds" },
      {
        name: "description",
        content:
          "Edit photos, edit videos, animate images, generate reels, captions, and business content with one intelligent AI platform.",
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
    name: "AI Image Studio",
    desc: "Background removal, retouch, upscale, cinematic and luxury edits.",
  },
  {
    icon: Film,
    name: "AI Image Animation",
    desc: "Bring portraits and products to life with cinematic motion.",
  },
  {
    icon: Video,
    name: "AI Video Studio",
    desc: "Prompt-based video editing, captions, color grading, auto resize.",
  },
  {
    icon: Wand2,
    name: "AI Reel Generator",
    desc: "Turn a single photo into scroll-stopping Reels and Shorts.",
  },
  {
    icon: PenLine,
    name: "AI Content Studio",
    desc: "Captions, posts, blogs, newsletters, ad copy and SEO.",
  },
  {
    icon: Briefcase,
    name: "AI Business Toolkit",
    desc: "Ads, listings, proposals, sales scripts, customer replies.",
  },
  {
    icon: LayoutTemplate,
    name: "AI Thumbnail Studio",
    desc: "YouTube thumbnails, banners, covers and pins.",
  },
  {
    icon: Palette,
    name: "AI Logo & Poster",
    desc: "Logos, brand kits, posters, flyers and event creatives.",
  },
  {
    icon: Mic,
    name: "AI Voice Studio",
    desc: "Natural voiceovers in English, Hindi, Spanish, French and more.",
  },
  {
    icon: Music,
    name: "AI Music Match",
    desc: "Royalty-free music recommendations tuned to your mood.",
  },
];

const plans = [
  {
    name: "Starter",
    price: "$0",
    period: "forever",
    desc: "For curious creators exploring AI.",
    features: [
      "50 credits / month",
      "All studios in preview",
      "Watermarked exports",
      "Community support",
    ],
    highlight: false,
    cta: "Start for free",
  },
  {
    name: "Creator",
    price: "$19",
    period: "/ month",
    desc: "For solo creators shipping daily.",
    features: [
      "2,000 credits / month",
      "HD exports, no watermark",
      "Brand kit & history",
      "Priority queue",
    ],
    highlight: true,
    cta: "Start Creator plan",
  },
  {
    name: "Studio",
    price: "$49",
    period: "/ month",
    desc: "For agencies and small teams.",
    features: [
      "8,000 credits / month",
      "4K exports & API access",
      "Team brand kits",
      "Dedicated support",
    ],
    highlight: false,
    cta: "Choose Studio",
  },
];

const faqs = [
  {
    q: "Do I need to pick the right AI model?",
    a: "No. Geenie intelligently routes every request to the best provider behind the scenes — you just describe what you want.",
  },
  {
    q: "Can I use generations commercially?",
    a: "Yes. All paid plans include a commercial license for content you generate.",
  },
  {
    q: "Which payment methods are supported?",
    a: "Stripe, PayPal, Razorpay, Google Pay and Apple Pay. Cancel or change plans anytime.",
  },
  {
    q: "Is there an API?",
    a: "API access is included in the Studio plan and rolling out to Creator in beta.",
  },
  {
    q: "Where is my data stored?",
    a: "Encrypted at rest in secure regional storage. GDPR-ready architecture. You can delete projects anytime.",
  },
];

const roadmap = [
  {
    tag: "Shipping",
    items: ["Image Studio", "Content Studio", "Brand Kit"],
  },
  {
    tag: "Beta",
    items: ["Video Studio", "Reel Generator", "Voice Studio"],
  },
  {
    tag: "Soon",
    items: ["Voice cloning", "AI avatars", "Mobile apps (iOS & Android)"],
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

function PricingButton({ plan }: { plan: (typeof plans)[number] }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate({ to: "/auth" })}
      className={`mt-7 w-full rounded-xl px-4 py-2.5 text-sm font-medium transition active:scale-95 ${
        plan.highlight
          ? "text-white hover:opacity-90"
          : "border border-border bg-surface hover:bg-surface-elevated"
      }`}
      style={plan.highlight ? { background: "var(--gradient-brand)" } : undefined}
    >
      {plan.cta}
    </button>
  );
}

function LandingPage() {
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
            One platform · Many AI models · Zero complexity
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
            Edit photos, edit videos, animate images, generate reels, captions, hashtags and
            business content using one intelligent AI platform.
          </motion.p>

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
              Start creating free <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#features"
              className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-surface/60 px-6 py-3 text-sm font-medium backdrop-blur transition hover:bg-surface"
            >
              Explore studios
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

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium" style={{ color: "var(--magenta)" }}>
            Ten studios. One workspace.
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
              className="glass group rounded-2xl p-6 transition hover:-translate-y-0.5"
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: "var(--gradient-brand)" }}
              >
                <s.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="mt-5 text-lg font-semibold">{s.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
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
              title: "Secure by design",
              desc: "Encrypted storage, validated uploads, GDPR-ready.",
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
      <section id="pricing" className="mx-auto mt-32 max-w-6xl px-4">
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
          Payments via Stripe, PayPal, Razorpay, Google Pay &amp; Apple Pay. Cancel anytime.
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
              q: "Our team ships campaigns 5x faster. The brand kit is a game changer.",
              n: "Marcus L.",
              r: "Marketing lead",
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
      <section id="faq" className="mx-auto mt-32 max-w-3xl px-4">
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
