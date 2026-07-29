/**
 * App theme system — swaps CSS custom properties on :root so every
 * gradient, button, accent and sidebar highlight changes instantly
 * with no page reload. Stored in localStorage so the choice persists
 * across sessions.
 */

export interface Theme {
  id: string;
  name: string;
  emoji: string;
  violet: string;        // start color of the brand gradient
  magenta: string;       // end color of the brand gradient
  gradient: string;      // full CSS gradient string
  accent: string;        // light tint background (used on hover badges etc.)
  accentFg: string;      // foreground on accent background
}

export const THEMES: Theme[] = [
  {
    id: "default",
    name: "Sunset",
    emoji: "🔥",
    violet: "#ff5a1f",
    magenta: "#f7277e",
    gradient: "linear-gradient(135deg, #ff5a1f 0%, #f7277e 100%)",
    accent: "#fff0eb",
    accentFg: "#ff5a1f",
  },
  {
    id: "midnight",
    name: "Midnight",
    emoji: "🌙",
    violet: "#6366f1",
    magenta: "#8b5cf6",
    gradient: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    accent: "#ede9fe",
    accentFg: "#6366f1",
  },
  {
    id: "ocean",
    name: "Ocean",
    emoji: "🌊",
    violet: "#0ea5e9",
    magenta: "#06b6d4",
    gradient: "linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)",
    accent: "#e0f7ff",
    accentFg: "#0ea5e9",
  },
  {
    id: "forest",
    name: "Forest",
    emoji: "🌿",
    violet: "#10b981",
    magenta: "#059669",
    gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    accent: "#d1fae5",
    accentFg: "#10b981",
  },
  {
    id: "gold",
    name: "Gold",
    emoji: "✨",
    violet: "#f59e0b",
    magenta: "#f97316",
    gradient: "linear-gradient(135deg, #f59e0b 0%, #f97316 100%)",
    accent: "#fef3c7",
    accentFg: "#f59e0b",
  },
  {
    id: "rose",
    name: "Rose",
    emoji: "🌸",
    violet: "#ec4899",
    magenta: "#be185d",
    gradient: "linear-gradient(135deg, #ec4899 0%, #be185d 100%)",
    accent: "#fce7f3",
    accentFg: "#ec4899",
  },
  {
    id: "cosmic",
    name: "Cosmic",
    emoji: "🚀",
    violet: "#7c3aed",
    magenta: "#db2777",
    gradient: "linear-gradient(135deg, #7c3aed 0%, #db2777 100%)",
    accent: "#f5f3ff",
    accentFg: "#7c3aed",
  },
  {
    id: "neon",
    name: "Neon",
    emoji: "⚡",
    violet: "#22d3ee",
    magenta: "#a855f7",
    gradient: "linear-gradient(135deg, #22d3ee 0%, #a855f7 100%)",
    accent: "#f0fdf4",
    accentFg: "#22d3ee",
  },
];

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.style.setProperty("--violet", theme.violet);
  root.style.setProperty("--magenta", theme.magenta);
  root.style.setProperty("--gradient-brand", theme.gradient);
  root.style.setProperty("--primary", theme.violet);
  root.style.setProperty("--accent", theme.accent);
  root.style.setProperty("--accent-foreground", theme.accentFg);
}

export function loadSavedTheme() {
  if (typeof window === "undefined") return;
  const saved = localStorage.getItem("geenie_theme");
  if (saved) {
    const theme = THEMES.find((t) => t.id === saved);
    if (theme) applyTheme(theme);
  }
}

export function saveTheme(theme: Theme) {
  if (typeof window === "undefined") return;
  localStorage.setItem("geenie_theme", theme.id);
  applyTheme(theme);
}

export function getCurrentThemeId(): string {
  if (typeof window === "undefined") return "default";
  return localStorage.getItem("geenie_theme") ?? "default";
}
