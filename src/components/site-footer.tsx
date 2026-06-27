import { Link } from "@tanstack/react-router";
import { Sparkles, Linkedin, Mail } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-32 border-t border-border/60">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ background: "var(--gradient-brand)" }}
              >
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="font-display text-lg font-semibold">
                Geenie <span className="text-gradient">AI Studio</span>
              </span>
            </div>
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              Create amazing content with AI in seconds. One intelligent platform for images, video,
              reels, captions, and business content.
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              Built by{" "}
              <a
                href="mailto:abhishek2k1985@gmail.com"
                className="text-foreground hover:underline"
              >
                Abhishek Tiwari
              </a>
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">Product</h4>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="/#features" className="hover:text-foreground transition">
                  Features
                </a>
              </li>
              <li>
                <a href="/#pricing" className="hover:text-foreground transition">
                  Pricing
                </a>
              </li>
              <li>
                <a href="/#roadmap" className="hover:text-foreground transition">
                  Roadmap
                </a>
              </li>
              <li>
                <a href="/#faq" className="hover:text-foreground transition">
                  FAQ
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">Company</h4>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/about" className="hover:text-foreground transition">
                  About
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-foreground transition">
                  Contact
                </Link>
              </li>
              <li>
                <a
                  href="mailto:abhishek2k1985@gmail.com"
                  className="hover:text-foreground transition"
                >
                  abhishek2k1985@gmail.com
                </a>
              </li>
              <li className="flex items-center gap-3 pt-1">
                <a
                  href="https://www.linkedin.com/in/abhishek-tiwari-inenergizer/"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="LinkedIn"
                  className="hover:text-foreground transition"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
                <a
                  href="mailto:abhishek2k1985@gmail.com"
                  aria-label="Email"
                  className="hover:text-foreground transition"
                >
                  <Mail className="h-4 w-4" />
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-border/60 pt-6 text-xs text-muted-foreground md:flex-row md:items-center">
          <p>© 2026 Geenie AI Studio. Built by Abhishek Tiwari. All Rights Reserved.</p>
          <div className="flex gap-5">
            <Link to="/privacy" className="hover:text-foreground transition">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-foreground transition">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
