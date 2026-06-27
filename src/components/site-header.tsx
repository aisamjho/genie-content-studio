import { Link } from "@tanstack/react-router";
import { Sparkles, Menu, X } from "lucide-react";
import { useState } from "react";

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { href: "/#features", label: "Features" },
    { href: "/#pricing", label: "Pricing" },
    { href: "/#faq", label: "FAQ" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="mx-auto mt-4 max-w-6xl px-4">
        <div className="glass flex items-center justify-between rounded-2xl px-5 py-3">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: "var(--gradient-brand)" }}
            >
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-display text-lg font-semibold tracking-tight">
              Geenie <span className="text-gradient">AI Studio</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            {navLinks.map((l) => (
              <a key={l.href} href={l.href} className="transition hover:text-foreground">
                {l.label}
              </a>
            ))}
            <Link
              to="/about"
              className="transition hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              About
            </Link>
            <Link
              to="/contact"
              className="transition hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              Contact
            </Link>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:block">
            <Link
              to="/auth"
              className="rounded-xl px-4 py-2 text-sm font-medium text-white shadow-lg transition hover:opacity-90"
              style={{ background: "var(--gradient-brand)" }}
            >
              Get started
            </Link>
          </div>

          {/* Mobile controls */}
          <div className="flex items-center gap-2 md:hidden">
            <Link
              to="/auth"
              className="rounded-xl px-3 py-1.5 text-sm font-medium text-white transition hover:opacity-90"
              style={{ background: "var(--gradient-brand)" }}
              onClick={() => setMobileOpen(false)}
            >
              Get started
            </Link>
            <button
              type="button"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((o) => !o)}
              className="rounded-lg p-2 text-muted-foreground transition hover:bg-surface-elevated hover:text-foreground"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileOpen && (
          <div className="glass mt-2 rounded-2xl px-5 py-4 md:hidden">
            <nav className="flex flex-col gap-1 text-sm">
              {navLinks.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  className="rounded-lg px-3 py-2.5 text-muted-foreground transition hover:bg-surface-elevated hover:text-foreground"
                  onClick={() => setMobileOpen(false)}
                >
                  {l.label}
                </a>
              ))}
              <Link
                to="/about"
                className="rounded-lg px-3 py-2.5 text-muted-foreground transition hover:bg-surface-elevated hover:text-foreground"
                activeProps={{ className: "text-foreground bg-surface-elevated" }}
                onClick={() => setMobileOpen(false)}
              >
                About
              </Link>
              <Link
                to="/contact"
                className="rounded-lg px-3 py-2.5 text-muted-foreground transition hover:bg-surface-elevated hover:text-foreground"
                activeProps={{ className: "text-foreground bg-surface-elevated" }}
                onClick={() => setMobileOpen(false)}
              >
                Contact
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
