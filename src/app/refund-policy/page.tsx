import type { Metadata } from "next";

import { CardShell } from "@/components/card-shell";
import { Container } from "@/components/container";
import { PageHero } from "@/components/page-hero";
import { SectionHeading } from "@/components/section-heading";

export const metadata: Metadata = {
  alternates: {
    canonical: "/refund-policy",
  },
  description:
    "Refund and cancellation policy information for Trading Research Portal subscriptions.",
  openGraph: {
    description:
      "Refund and cancellation policy information for Trading Research Portal subscriptions.",
    title: "Refund Policy",
    url: "/refund-policy",
  },
  title: "Refund Policy",
};

const refundNotes = [
  {
    title: "Stripe-hosted subscription billing",
    description:
      "Paid memberships are processed through Stripe-hosted Checkout and Customer Portal flows. Subscription access updates after Stripe confirms payment and webhook processing.",
  },
  {
    title: "Renewal and cancellation",
    description:
      "Subscriptions renew until canceled. Members should manage billing through the Stripe Customer Portal, and cancellation timing may depend on the active billing period and final plan terms.",
  },
  {
    title: "Payment details",
    description:
      "The portal does not store card details. Stripe handles payment collection, card storage, receipts, and hosted billing management.",
  },
  {
    title: "No performance refunds",
    description:
      "Educational research subscriptions should not be framed around trading outcomes. No plan guarantees trading results.",
  },
  {
    title: "Legal and business review required",
    description:
      "This refund and cancellation language is a prelaunch placeholder. Final refund eligibility, cancellation timing, support procedure, and jurisdiction-specific terms must be reviewed before live subscriptions are enabled.",
  },
];

export default function RefundPolicyPage() {
  return (
    <main className="flex-1">
      <section className="border-b border-border">
        <Container>
          <PageHero
            description="Refund and cancellation policy information for subscription access."
            eyebrow="Refund policy"
            title="Refund Policy"
          />
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <SectionHeading
            eyebrow="Refund status"
            title="Subscription billing is Stripe-hosted; final policy review is still required."
            description="This page sets expectations for subscription billing, cancellation, refund review, and educational-access limitations before live subscriptions are enabled."
          />
          <div className="grid gap-5">
            {refundNotes.map((item) => (
              <CardShell key={item.title} padding="lg">
                <h2 className="text-lg font-semibold text-foreground">
                  {item.title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {item.description}
                </p>
              </CardShell>
            ))}
          </div>
        </Container>
      </section>
    </main>
  );
}
