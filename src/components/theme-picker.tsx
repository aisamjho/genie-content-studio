import { useState, useEffect } from "react";
import { Palette } from "lucide-react";
import { THEMES, saveTheme, getCurrentThemeId } from "@/lib/themes";

export function ThemePicker() {
  // Must NOT call getCurrentThemeId() directly as the useState initialiser —
  // TanStack Start SSR runs component bodies on the server where localStorage
  // doesn't exist. Using "default" as the server-side starting value and
  // syncing to the real stored value in useEffect is the safe pattern.
  const [currentId, setCurrentId] = useState("default");

  useEffect(() => {
    setCurrentId(getCurrentThemeId());
  }, []);
  const [open, setOpen] = useState(false);

  function pick(theme: typeof THEMES[0]) {
    saveTheme(theme);
    setCurrentId(theme.id);
    setOpen(false);
  }

  const current = THEMES.find((t) => t.id === currentId) ?? THEMES[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-muted-foreground hover:bg-surface-elevated hover:text-foreground transition"
      >
        <Palette className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left truncate">{current.emoji} {current.name}</span>
      </button>

      {open && (
        <div className="absolute bottom-full mb-1 left-0 z-50 w-56 rounded-2xl border border-border bg-card shadow-xl overflow-hidden p-2">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1.5">App Theme</p>
          <div className="grid grid-cols-2 gap-1.5">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => pick(t)}
                className={`flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-medium transition text-left ${
                  currentId === t.id
                    ? "text-white shadow-sm"
                    : "bg-surface hover:bg-surface-elevated text-foreground"
                }`}
                style={currentId === t.id ? { background: t.gradient } : undefined}
              >
                <span
                  className="h-4 w-4 rounded-full shrink-0 shadow-sm"
                  style={{ background: t.gradient }}
                />
                {t.name}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground px-2 pt-2 pb-1">
            Changes apply instantly everywhere
          </p>
        </div>
      )}
    </div>
  );
}
