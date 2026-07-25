import { useEffect, useState } from "react";
import { isInstalledApp } from "@/lib/ads";

/**
 * Set this once an AdSense account is approved for the website
 * (genie-content-studio-ten.vercel.app). Until then this stays empty and
 * every <AdSlot /> renders nothing — completely inert, safe to leave
 * placed in the UI ahead of approval with zero effect on layout or
 * behavior today.
 *
 * Once approved: paste the publisher ID below (looks like
 * "ca-pub-XXXXXXXXXXXXXXXX" from your AdSense account) and every AdSlot
 * already placed in the app activates automatically — no other code
 * changes needed.
 */
const ADSENSE_PUBLISHER_ID = "";

/**
 * A single ad placement. Renders nothing (not even an empty container) on:
 *   - the server (SSR pass)
 *   - the installed Play Store app / any home-screen PWA install (see ads.ts)
 *   - whenever ADSENSE_PUBLISHER_ID above is unset
 *
 * Drop this anywhere in the UI that makes sense — it costs nothing to have
 * present before approval, and turning ads on later is a one-line change.
 */
export function AdSlot({ slot, className = "" }: { slot?: string; className?: string }) {
  const [eligible, setEligible] = useState(false);

  useEffect(() => {
    const shouldShow = Boolean(ADSENSE_PUBLISHER_ID) && !isInstalledApp();
    setEligible(shouldShow);

    if (shouldShow && !document.querySelector('script[data-adsbygoogle-loader]')) {
      const script = document.createElement("script");
      script.async = true;
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_PUBLISHER_ID}`;
      script.crossOrigin = "anonymous";
      script.setAttribute("data-adsbygoogle-loader", "true");
      document.head.appendChild(script);
    }
  }, []);

  useEffect(() => {
    if (!eligible) return;
    try {
      ((window as unknown as { adsbygoogle?: unknown[] }).adsbygoogle ??= []).push({});
    } catch { /* AdSense script not ready yet — safe to skip this render */ }
  }, [eligible]);

  if (!eligible) return null;

  return (
    <div className={`w-full flex items-center justify-center ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: "block", width: "100%" }}
        data-ad-client={ADSENSE_PUBLISHER_ID}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
