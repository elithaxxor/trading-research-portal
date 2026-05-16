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
    "Early-access refund policy information for the Trading Research Portal.",
  openGraph: {
    description:
      "Early-access refund policy information for the Trading Research Portal.",
    title: "Refund Policy",
    url: "/refund-policy",
  },
  title: "Refund Policy",
};

const refundNotes = [
  {
    title: "Memberships are not open",
    description:
      "Paid memberships are not active yet. There are no active checkout flows, subscriptions, or charges on the current public site.",
  },
  {
    title: "Terms before payments",
    description:
      "Refund and cancellation terms will be published before payments are collected. Those terms should clearly explain cancellation timing, billing periods, eligibility, and support procedures.",
  },
  {
    title: "No payment details collected",
    description:
      "No payment details are collected on the current site.",
  },
  {
    title: "No performance refunds",
    description:
      "Educational research subscriptions should not be framed around trading outcomes. No plan guarantees trading results.",
  },
  {
    title: "Policy review",
    description:
      "Refund language should be reviewed with qualified legal counsel before paid memberships, personalized services, or live trading research are offered.",
  },
];

export default function RefundPolicyPage() {
  return (
    <main className="flex-1">
      <section className="border-b border-border">
        <Container>
          <PageHero
            description="Refund policy information for the early-access public site."
            eyebrow="Refund policy"
            title="Refund Policy"
          />
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <SectionHeading
            eyebrow="Refund status"
            title="No paid memberships are active yet."
            description="This page sets expectations before any paid access exists. Final billing, refund, and cancellation terms should be completed before memberships open."
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
