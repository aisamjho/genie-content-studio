import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Geenie AI Studio" },
      { name: "description", content: "How Geenie AI Studio collects, uses and protects your data." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 pt-28 pb-16">
        <p className="text-sm font-medium" style={{ color: "var(--magenta)" }}>Legal</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">Privacy Policy</h1>
        <p className="mt-3 text-sm text-muted-foreground">Last updated: 27 June 2026</p>

        <div className="mt-10 space-y-8 text-sm text-muted-foreground leading-relaxed">
          <Section title="1. Who we are">
            Geenie AI Studio is operated by Abhishek Tiwari. Contact:{" "}
            <a href="mailto:abhishek2k1985@gmail.com" className="text-foreground underline">
              abhishek2k1985@gmail.com
            </a>
          </Section>

          <Section title="2. Data we collect">
            <ul className="list-disc pl-5 space-y-1">
              <li>Account information: email address and name when you sign up.</li>
              <li>Profile data: full name and avatar URL stored in our database.</li>
              <li>Usage data: generation history, credits used, feature interactions.</li>
              <li>Media uploads: images and videos you upload for processing.</li>
              <li>Device data: browser type, IP address, and access timestamps (server logs).</li>
            </ul>
          </Section>

          <Section title="3. How we use your data">
            <ul className="list-disc pl-5 space-y-1">
              <li>To provide and improve the Geenie AI Studio service.</li>
              <li>To process AI generation requests.</li>
              <li>To manage subscriptions and billing.</li>
              <li>To send transactional emails (sign-up confirmation, password reset).</li>
              <li>To prevent fraud and enforce our Terms of Service.</li>
            </ul>
          </Section>

          <Section title="4. Data storage and security">
            All data is stored via Supabase on secure, encrypted infrastructure. We apply
            Row-Level Security (RLS) policies so each user can only access their own data.
            Media files are stored encrypted at rest.
          </Section>

          <Section title="5. Third-party services">
            We use the following third parties:
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Supabase — authentication and database.</li>
              <li>Stripe / PayPal / Razorpay — payment processing.</li>
              <li>AI providers (OpenAI, Fal.ai, Replicate, etc.) — content generation.</li>
            </ul>
            Each provider operates under their own privacy policy.
          </Section>

          <Section title="6. Your rights (GDPR)">
            You have the right to access, correct, or delete your personal data at any time.
            Email{" "}
            <a href="mailto:abhishek2k1985@gmail.com" className="text-foreground underline">
              abhishek2k1985@gmail.com
            </a>{" "}
            with your request. We will respond within 30 days.
          </Section>

          <Section title="7. Cookies">
            We use essential cookies only (session authentication). No advertising or tracking cookies.
          </Section>

          <Section title="8. Changes to this policy">
            We may update this policy and will notify users by email and by updating the date above.
          </Section>

          <Section title="9. Contact">
            Questions about privacy?{" "}
            <a href="mailto:abhishek2k1985@gmail.com" className="text-foreground underline">
              abhishek2k1985@gmail.com
            </a>
          </Section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-base font-semibold text-foreground mb-2">{title}</h2>
      <div className="text-muted-foreground">{children}</div>
    </div>
  );
}
