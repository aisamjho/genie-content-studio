"use client";
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
        <p className="mt-3 text-sm text-muted-foreground">Last updated: 29 July 2026</p>

        <div className="mt-10 space-y-8 text-sm text-muted-foreground leading-relaxed">
          <Section title="1. Who we are">
            Geenie AI Studio is operated by Abhishek Tiwari. Contact:{" "}
            <a href="mailto:abhishek2k1985@gmail.com" className="text-foreground underline">
              abhishek2k1985@gmail.com
            </a>
          </Section>

          <Section title="2. Data we collect">
            <ul className="list-disc pl-5 space-y-1">
              <li>Account information: the name and email you provide when you sign up. This is stored securely in our database (Supabase) and also cached locally in your browser.</li>
              <li>Plan and usage data: your subscription plan (Starter, Creator, or Studio) and generation counters (e.g. how many free anime or cartoon images you have used). Stored in our database and your browser.</li>
              <li>Your photos and videos: edited entirely on your device. They are never uploaded to our servers or stored by us.</li>
              <li>AI generation inputs: your typed text prompts are sent to third-party AI providers to generate images. Your uploaded photos are never sent for Anime Style, Cartoon &amp; Comic, or Ask AI features.</li>
              <li>Payment information: handled entirely by Razorpay. We do not store your card details. We only receive confirmation of a successful payment and the plan purchased.</li>
            </ul>
          </Section>

          <Section title="3. How we use your data">
            <ul className="list-disc pl-5 space-y-1">
              <li>To create and maintain your account so it works across devices and browser restarts.</li>
              <li>To track your subscription plan and enforce free-tier generation limits fairly.</li>
              <li>To send your text prompts to the AI providers listed below to generate images.</li>
              <li>To process payments via Razorpay when you upgrade your plan.</li>
            </ul>
          </Section>

          <Section title="4. Data storage and security">
            Your account details (name, email, plan, generation counts) are stored in a secure database hosted by Supabase (supabase.com), with Row Level Security enabled — meaning only you can read or update your own data. Your photos and videos are never uploaded to us; all photo and video editing happens entirely in your browser on your own device.
          </Section>

          <Section title="5. Third-party services">
            We use the following third parties:
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Supabase — secure database and authentication. Stores your account details and plan status.</li>
              <li>Pollinations AI — image generation for Anime Style, Cartoon &amp; Comic, AI Generate, and AI backgrounds. Only your text description is sent, never your uploaded photo.</li>
              <li>Anthropic (Claude) — powers the Ask AI photo editing feature. Only your typed instruction and edit settings are sent, never your uploaded photo.</li>
              <li>Razorpay — payment processing. We do not see or store your payment card details.</li>
              <li>Vercel — hosting and analytics (anonymous page view counts only, no personal data).</li>
            </ul>
            Each third-party provider operates under their own privacy policy.
          </Section>

          <Section title="6. Your rights (GDPR &amp; DPDP)">
            You have the right to access, correct, or delete your personal data at any time.
            Email{" "}
            <a href="mailto:abhishek2k1985@gmail.com" className="text-foreground underline">
              abhishek2k1985@gmail.com
            </a>{" "}
            with your request. We will respond within 30 days.
          </Section>

          <Section title="7. Cookies">
            We use essential cookies only (session authentication via Supabase). No advertising or tracking cookies.
          </Section>

          <Section title="8. Changes to this policy">
            We may update this policy and will notify users by email and by updating the date above.
          </Section>

          <Section title="9. Children's Privacy">
            Geenie AI Studio is not directed to children under 13. We do not knowingly collect
            personal data from children under 13. If you believe a child has provided us with
            personal data, please contact us immediately and we will delete it.
          </Section>

          <Section title="10. Data Deletion">
            You can request deletion of your account and all associated data at any time by
            emailing{" "}
            <a href="mailto:abhishek2k1985@gmail.com" className="text-foreground underline">
              abhishek2k1985@gmail.com
            </a>{" "}
            with the subject line "Delete My Data". We will process your request within 30 days and permanently delete your account, email, name, plan status, and generation history from our database.
          </Section>

          <Section title="11. India Data Protection">
            We comply with the Digital Personal Data Protection Act, 2023 (India). As a Data
            Fiduciary, we process your personal data only for the purposes stated in this policy.
            You have the right to nominate a person to exercise your rights in the event of your
            death or incapacity.
          </Section>

          <Section title="12. Contact">
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
