import type { Metadata } from "next";

import { CardShell } from "@/components/card-shell";
import { Container } from "@/components/container";
import { PageHero } from "@/components/page-hero";
import { SectionHeading } from "@/components/section-heading";

export const metadata: Metadata = {
  alternates: {
    canonical: "/contact",
  },
  description:
    "Contact and support information for the Trading Research Portal.",
  openGraph: {
    description:
      "Contact and support information for the Trading Research Portal.",
    title: "Contact",
    url: "/contact",
  },
  title: "Contact",
};

export default function ContactPage() {
  return (
    <main className="flex-1">
      <section className="border-b border-border">
        <Container>
          <PageHero
            description="Billing self-service is handled through Stripe-hosted account tools. A dedicated support channel should be finalized before live subscriptions are enabled."
            eyebrow="Contact"
            title="Contact"
          />
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <SectionHeading
            eyebrow="Support status"
            title="Use account billing tools for subscription self-service."
            description="Members can manage Stripe billing from the account area. A direct support channel and response process should be finalized before live subscription launch."
          />
          <CardShell padding="lg" tone="elevated">
            <h2 className="text-lg font-semibold text-foreground">
              Support channel review required
            </h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Review the pricing, refund policy, terms, privacy policy, and
              disclaimer pages before subscribing. Stripe-hosted billing tools
              handle checkout and subscription management, but final live-launch
              support procedures still need business/legal review.
            </p>
          </CardShell>
        </Container>
      </section>
    </main>
  );
}
