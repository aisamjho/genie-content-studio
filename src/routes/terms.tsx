import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Geenie AI Studio" },
      { name: "description", content: "Terms and conditions for using Geenie AI Studio." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 pt-28 pb-16">
        <p className="text-sm font-medium" style={{ color: "var(--magenta)" }}>Legal</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">Terms of Service</h1>
        <p className="mt-3 text-sm text-muted-foreground">Last updated: 27 June 2026</p>

        <div className="mt-10 space-y-8 text-sm text-muted-foreground leading-relaxed">
          <Section title="1. Acceptance">
            By using Geenie AI Studio you agree to these terms. If you disagree, please do not use the service.
          </Section>

          <Section title="2. Service description">
            Geenie AI Studio provides AI-powered content creation tools including image editing, video editing,
            caption generation, and related features. Features are subject to change as the product evolves.
          </Section>

          <Section title="3. Accounts">
            <ul className="list-disc pl-5 space-y-1">
              <li>You must be 18 or older to create an account.</li>
              <li>You are responsible for maintaining the security of your account credentials.</li>
              <li>One account per person; do not share accounts.</li>
              <li>We reserve the right to suspend accounts that violate these terms.</li>
            </ul>
          </Section>

          <Section title="4. Acceptable use">
            You must not use Geenie AI Studio to:
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Generate illegal, harmful, harassing, or defamatory content.</li>
              <li>Infringe intellectual property rights of others.</li>
              <li>Attempt to reverse-engineer or scrape our platform or AI outputs at scale.</li>
              <li>Resell or redistribute access to the platform without written permission.</li>
            </ul>
          </Section>

          <Section title="5. Credits and payments">
            <ul className="list-disc pl-5 space-y-1">
              <li>Credits are consumed per generation and are non-refundable once used.</li>
              <li>Subscription payments are billed monthly or annually as selected.</li>
              <li>You may cancel your subscription at any time; access continues until period end.</li>
              <li>We reserve the right to change pricing with 30 days notice.</li>
            </ul>
          </Section>

          <Section title="6. Intellectual property">
            You retain ownership of media you upload. You grant Geenie AI Studio a limited licence to
            process your media for the purpose of providing the service. AI-generated outputs on paid
            plans are yours to use commercially.
          </Section>

          <Section title="7. Disclaimer">
            The service is provided "as is". We make no warranties about uptime, accuracy of AI outputs,
            or fitness for any particular purpose. AI-generated content may contain errors.
          </Section>

          <Section title="8. Limitation of liability">
            To the maximum extent permitted by law, Geenie AI Studio is not liable for indirect, incidental,
            or consequential damages arising from use of the service.
          </Section>

          <Section title="9. Governing law">
            These terms are governed by the laws of India. Disputes shall be resolved in the courts of New Delhi.
          </Section>

          <Section title="10. Contact">
            Questions?{" "}
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
