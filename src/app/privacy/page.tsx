import type { Metadata } from "next";

import { CardShell } from "@/components/card-shell";
import { Container } from "@/components/container";
import { PageHero } from "@/components/page-hero";
import { SectionHeading } from "@/components/section-heading";

export const metadata: Metadata = {
  alternates: {
    canonical: "/privacy",
  },
  description:
    "Early-access privacy information for the Trading Research Portal.",
  openGraph: {
    description:
      "Early-access privacy information for the Trading Research Portal.",
    title: "Privacy Policy",
    url: "/privacy",
  },
  title: "Privacy Policy",
};

const privacyNotes = [
  {
    title: "Early-access status",
    description:
      "The current public site does not open member profiles or collect member dashboard data.",
  },
  {
    title: "No production email collection",
    description:
      "Production email collection is not active yet. When it opens, the site should clearly explain what is collected and how updates are sent.",
  },
  {
    title: "No active payment processing",
    description:
      "Payment processing is not active yet. No payment details are collected on the current public site.",
  },
  {
    title: "Future member data",
    description:
      "If member accounts are added, privacy language should describe account data, billing-related data, research preferences, and support communications.",
  },
  {
    title: "Privacy review",
    description:
      "This is early-access planning language, not legal advice. Privacy language should be reviewed with qualified legal counsel before paid memberships, personalized services, or live trading research are offered.",
  },
];

export default function PrivacyPage() {
  return (
    <main className="flex-1">
      <section className="border-b border-border">
        <Container>
          <PageHero
            description="Early-access privacy information for a public trading research website. This page is planning language and is not legal advice."
            eyebrow="Privacy"
            title="Privacy Policy"
          />
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <SectionHeading
            eyebrow="Privacy status"
            title="Simple public pages now, clearer data policies before memberships open."
            description="The current site is informational. Future email, account, payment, and membership features should include clear privacy disclosures before they are enabled."
          />
          <div className="grid gap-5">
            {privacyNotes.map((item) => (
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
