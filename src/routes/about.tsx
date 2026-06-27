import { createFileRoute, Link } from "@tanstack/react-router";
import { Linkedin, Mail, ArrowRight, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Geenie AI Studio" },
      {
        name: "description",
        content:
          "Meet Abhishek Tiwari, founder of Geenie AI Studio, and the mission behind one intelligent AI platform for creators.",
      },
      { property: "og:title", content: "About Geenie AI Studio" },
      {
        property: "og:description",
        content: "Founder story and mission behind Geenie AI Studio.",
      },
      {
        property: "og:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/7d4a02b4-2b2e-4688-8184-9c7a62442509/id-preview-9b67bd2c--8430f7b8-3713-4c41-bfc0-64d0cf73a802.lovable.app-1782485569522.png",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 pt-20 pb-12">
        <p className="text-sm font-medium" style={{ color: "var(--magenta)" }}>
          About
        </p>
        <h1 className="mt-3 text-5xl font-semibold tracking-tight md:text-6xl">
          Built so anyone can create like a{" "}
          <span className="text-gradient">studio</span>.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          Geenie AI Studio is a single intelligent platform that hides the complexity of AI. Upload
          your media, describe what you want, and the right model gets to work — quietly, in the
          background.
        </p>

        {/* Founder */}
        <section className="mt-16 grid gap-8 md:grid-cols-[200px_1fr]">
          <div className="glass flex aspect-square items-center justify-center rounded-3xl">
            <div
              className="flex h-28 w-28 items-center justify-center rounded-full text-white"
              style={{ background: "var(--gradient-brand)" }}
            >
              <Sparkles className="h-10 w-10" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-semibold">Abhishek Tiwari</h2>
            <p className="mt-1 text-sm text-muted-foreground">Founder · Geenie AI Studio</p>
            <p className="mt-5 text-muted-foreground">
              Abhishek is a builder fascinated by the gap between what AI can do and what most
              people get to use. After years of stitching together a dozen tools to ship a single
              piece of content, he set out to build the opposite: one calm, well-designed product
              that quietly routes every request to the best AI for the job.
            </p>
            <p className="mt-4 text-muted-foreground">
              Geenie AI Studio is the result — a creator-first platform where the model is an
              implementation detail and the work is the point.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a
                href="https://www.linkedin.com/in/abhishek-tiwari-inenergizer/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-sm transition hover:bg-surface-elevated"
              >
                <Linkedin className="h-4 w-4" /> LinkedIn
              </a>
              <a
                href="mailto:abhishek2k1985@gmail.com"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-sm transition hover:bg-surface-elevated"
              >
                <Mail className="h-4 w-4" /> abhishek2k1985@gmail.com
              </a>
            </div>
          </div>
        </section>

        {/* Mission */}
        <section className="mt-20">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Our mission</h2>
          <p className="mt-4 text-muted-foreground">
            Build an AI platform where users simply upload media, describe what they want, and the
            application intelligently chooses the appropriate AI capabilities behind the scenes.
            Users should never need to understand which AI provider powers a feature.
          </p>
        </section>

        {/* Values */}
        <section className="mt-16 grid gap-4 md:grid-cols-3">
          {[
            {
              t: "Calm by default",
              d: "Premium, distraction-free interfaces. No model picker chaos.",
            },
            {
              t: "Quality over quantity",
              d: "Every feature is judged by the final asset, not the demo.",
            },
            {
              t: "Honest pricing",
              d: "Pay for what you create. Cancel anytime. No dark patterns.",
            },
          ].map((v) => (
            <div key={v.t} className="glass rounded-2xl p-6">
              <h3 className="text-lg font-semibold">{v.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{v.d}</p>
            </div>
          ))}
        </section>

        <div className="mt-16 flex items-center gap-3">
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium text-white transition hover:opacity-95 active:scale-95"
            style={{ background: "var(--gradient-brand)" }}
          >
            Get in touch <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
