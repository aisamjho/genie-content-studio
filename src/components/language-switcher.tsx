import { useState, useRef, useEffect } from "react";
import { Globe, Check } from "lucide-react";
import { LANGUAGES, useLanguage } from "@/lib/i18n";

/**
 * A small dropdown for switching the app's display language. Placed in the
 * sidebar (every authenticated page) and the landing page header, so it's
 * reachable before AND after signing in — someone who doesn't read English
 * needs to be able to find this without already being able to read "Language."
 * The globe icon plus each language's own native name (हिन्दी, not "Hindi")
 * is what makes it findable without English literacy.
 */
export function LanguageSwitcher({ compact = false, dropUp }: { compact?: boolean; dropUp?: boolean }) {
  const { lang, setLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const current = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];
  // Sidebar usage sits near the bottom of the screen, so it defaults to
  // opening upward to avoid getting clipped below the viewport; header/menu
  // usage sits near the top, so it defaults to opening downward. `dropUp`
  // can override this when the two don't line up (e.g. the mobile menu
  // wants full-width sidebar-style sizing but still sits near the top).
  const goUp = dropUp ?? !compact;
  const dropdownPosition = goUp ? "bottom-full mb-1" : "top-full mt-1";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 rounded-lg border border-border bg-surface text-muted-foreground hover:bg-surface-elevated hover:text-foreground transition ${compact ? "px-2.5 py-2 text-xs" : "px-3 py-2 text-sm w-full"}`}
      >
        <Globe className="h-4 w-4 shrink-0" />
        <span className="truncate">{current.label}</span>
      </button>
      {open && (
        <div className={`absolute ${dropdownPosition} left-0 z-50 w-40 rounded-xl border border-border bg-card shadow-lg overflow-hidden`}>
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => { setLang(l.code); setOpen(false); }}
              className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-sm hover:bg-surface-elevated transition text-left"
            >
              <span>{l.label}</span>
              {l.code === lang && <Check className="h-3.5 w-3.5 text-orange-500 shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
