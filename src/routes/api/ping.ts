import { createFileRoute } from "@tanstack/react-router";

/**
 * Lightweight ping endpoint — used by cron-job.org to keep the Supabase
 * free tier database awake. Supabase pauses projects after 7 days of
 * inactivity on the free plan. A daily ping from cron-job.org to
 * https://genie-content-studio-ten.vercel.app/api/ping prevents this.
 *
 * Set up: go to cron-job.org → create a free account → new cron job:
 *   URL: https://genie-content-studio-ten.vercel.app/api/ping
 *   Schedule: every day at 9:00 AM
 */
export const Route = createFileRoute("/api/ping")({
  loader: async () => {
    return { status: "ok", timestamp: new Date().toISOString() };
  },
});
