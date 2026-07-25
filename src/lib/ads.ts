/**
 * Ad-monetization prep — not active yet, safe to ship as-is.
 *
 * The split that actually matters here: Google's AdSense is built for
 * websites and is unreliable (often zero revenue, and a real policy risk)
 * when served inside an app wrapper distributed through an app store —
 * which is exactly what our Play Store listing is (a Trusted Web Activity
 * wrapping this same website). Google's own guidance for that context is
 * AdMob, which needs native Android integration that a PWABuilder-generated
 * TWA doesn't expose.
 *
 * The practical (and safe) split:
 *   - Website visitors, in a normal browser tab → AdSense is fine once approved
 *   - Installed-app visitors (opened via the Play Store TWA, or "Add to
 *     Home Screen") → don't show AdSense here; keep monetizing this
 *     surface via the existing Razorpay subscription plans
 *
 * isInstalledApp() below is the check that enforces that split.
 */

export function isInstalledApp(): boolean {
  if (typeof window === "undefined") return false;
  // A TWA launch and a home-screen PWA install both render in standalone
  // or fullscreen display mode — never as a normal browser tab. We treat
  // both the same way here (no AdSense) since neither is web-tab traffic.
  const standalone =
    window.matchMedia?.("(display-mode: standalone)").matches ||
    window.matchMedia?.("(display-mode: fullscreen)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true;
  return Boolean(standalone);
}
