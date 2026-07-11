"use client";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Linkedin, Send, Loader2, CheckCircle } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Geenie AI Studio" },
      {
        name: "description",
        content:
          "Get in touch with Abhishek Tiwari, founder of Geenie AI Studio. We reply within one business day.",
      },
      { property: "og:title", content: "Contact Geenie AI Studio" },
      { property: "og:description", content: "Questions, partnerships, press — say hello." },
      {
        property: "og:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/7d4a02b4-2b2e-4688-8184-9c7a62442509/id-preview-9b67bd2c--8430f7b8-3713-4c41-bfc0-64d0cf73a802.lovable.app-1782485569522.png",
      },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    try {
      // Build a mailto link as the reliable fallback before a backend email service is wired
      const mailtoUrl = `mailto:abhishek2k1985@gmail.com?subject=${encodeURIComponent(
        formData.subject || `Message from ${formData.name}`
      )}&body=${encodeURIComponent(
        `Name: ${formData.name}\nEmail: ${formData.email}\n\n${formData.message}`
      )}`;
      window.location.href = mailtoUrl;
      setSent(true);
      toast.success("Your email client has opened. Send the message to reach us!");
    } catch {
      toast.error("Something went wrong. Please email us directly.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 pt-28 pb-12">
        <p className="text-sm font-medium" style={{ color: "var(--magenta)" }}>
          Contact
        </p>
        <h1 className="mt-3 text-5xl font-semibold tracking-tight md:text-6xl">
          Let's <span className="text-gradient">talk</span>.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
          Questions, feedback, partnerships, or press — drop a note and we'll get back within one
          business day.
        </p>

        <div className="mt-14 grid gap-8 md:grid-cols-[1.2fr_1fr]">
          {sent ? (
            <div className="glass flex flex-col items-center justify-center gap-4 rounded-2xl p-10 text-center">
              <CheckCircle className="h-12 w-12" style={{ color: "var(--magenta)" }} />
              <h2 className="text-xl font-semibold">Message ready to send!</h2>
              <p className="text-sm text-muted-foreground">
                Your email client should have opened. If not, email us directly at{" "}
                <a
                  href="mailto:abhishek2k1985@gmail.com"
                  className="text-foreground underline"
                >
                  abhishek2k1985@gmail.com
                </a>
              </p>
              <button
                onClick={() => setSent(false)}
                className="mt-2 rounded-xl border border-border bg-surface px-5 py-2 text-sm transition hover:bg-surface-elevated"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="glass space-y-4 rounded-2xl p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Name"
                  name="name"
                  placeholder="Your name"
                  required
                  value={formData.name}
                  onChange={(v) => setFormData((f) => ({ ...f, name: v }))}
                />
                <Field
                  label="Email"
                  name="email"
                  type="email"
                  placeholder="you@company.com"
                  required
                  value={formData.email}
                  onChange={(v) => setFormData((f) => ({ ...f, email: v }))}
                />
              </div>
              <Field
                label="Subject"
                name="subject"
                placeholder="What's this about?"
                value={formData.subject}
                onChange={(v) => setFormData((f) => ({ ...f, subject: v }))}
              />
              <div>
                <label htmlFor="message" className="text-sm font-medium">
                  Message
                </label>
                <textarea
                  id="message"
                  required
                  rows={5}
                  placeholder="Tell us a little about it…"
                  value={formData.message}
                  onChange={(e) => setFormData((f) => ({ ...f, message: e.target.value }))}
                  className="mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none transition focus:border-violet focus:ring-2 focus:ring-violet/40 resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={sending}
                className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium text-white transition hover:opacity-95 active:scale-95 disabled:opacity-60"
                style={{ background: "var(--gradient-brand)" }}
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Send message
              </button>
            </form>
          )}

          <aside className="space-y-4">
            <div className="glass rounded-2xl p-6">
              <h3 className="text-lg font-semibold">Direct contact</h3>
              <ul className="mt-4 space-y-3 text-sm">
                <li>
                  <a
                    href="mailto:abhishek2k1985@gmail.com"
                    className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition"
                  >
                    <Mail className="h-4 w-4 shrink-0" />
                    abhishek2k1985@gmail.com
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.linkedin.com/in/abhishek-tiwari-inenergizer/"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition"
                  >
                    <Linkedin className="h-4 w-4 shrink-0" />
                    LinkedIn — Abhishek Tiwari
                  </a>
                </li>
              </ul>
            </div>
            <div className="glass rounded-2xl p-6">
              <h3 className="text-lg font-semibold">Response time</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                We typically reply within one business day. For urgent matters, email directly.
              </p>
            </div>
            <div className="glass rounded-2xl p-6">
              <h3 className="text-lg font-semibold">Social media</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Instagram, X, YouTube and TikTok handles coming soon as we ship them.
              </p>
            </div>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  required,
  value,
  onChange,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label htmlFor={name} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none transition focus:border-violet focus:ring-2 focus:ring-violet/40"
      />
    </div>
  );
}
