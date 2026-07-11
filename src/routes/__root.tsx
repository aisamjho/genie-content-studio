import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Toaster } from "sonner";
import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { useEffect } from "react";
import { useRouter } from "@tanstack/react-router";

function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div
        className="flex h-20 w-20 items-center justify-center rounded-2xl mb-6"
        style={{ background: "var(--gradient-brand)" }}
      >
        <span className="text-3xl font-bold text-white">404</span>
      </div>
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="mt-2 text-sm text-muted-foreground max-w-xs">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 transition"
        style={{ background: "var(--gradient-brand)" }}
      >
        Go home
      </Link>
    </div>
  );
}

function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "root_error" });
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm">
        Something went wrong. Please try refreshing the page.
      </p>
      <div className="mt-6 flex gap-3">
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="rounded-xl px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 transition"
          style={{ background: "var(--gradient-brand)" }}
        >
          Try again
        </button>
        <a
          href="/"
          className="rounded-xl border border-border bg-surface px-5 py-2.5 text-sm font-medium hover:bg-surface-elevated transition"
        >
          Go home
        </a>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#ff5a1f" },
      { name: "robots", content: "index, follow" },
      { name: "author", content: "Abhishek Tiwari" },
      { title: "Geenie AI Studio — Create Amazing Content with AI in Seconds" },
      { name: "description", content: "One intelligent AI platform for images, videos, reels, captions and business content. Built by Abhishek Tiwari." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://genie-content-studio-ten.vercel.app" },
      { property: "og:title", content: "Geenie AI Studio — Create Amazing Content with AI" },
      { property: "og:description", content: "One intelligent AI platform for images, videos, reels, captions and business content." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/7d4a02b4-2b2e-4688-8184-9c7a62442509/id-preview-9b67bd2c--8430f7b8-3713-4c41-bfc0-64d0cf73a802.lovable.app-1782485569522.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Geenie AI Studio" },
      { name: "twitter:description", content: "Create amazing content with AI in seconds." },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/7d4a02b4-2b2e-4688-8184-9c7a62442509/id-preview-9b67bd2c--8430f7b8-3713-4c41-bfc0-64d0cf73a802.lovable.app-1782485569522.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "canonical", href: "https://genie-content-studio-ten.vercel.app" },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundPage,
  errorComponent: ErrorPage,
}));

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /><script src="https://checkout.razorpay.com/v1/checkout.js"></script></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster
        position="top-right"
        richColors
        toastOptions={{
          style: {
            background: "oklch(0.21 0.06 295)",
            border: "1px solid oklch(0.32 0.06 295 / 60%)",
            color: "oklch(0.97 0.01 300)",
          },
        }}
      />
    </QueryClientProvider>
  );
}
