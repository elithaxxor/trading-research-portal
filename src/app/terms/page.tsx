import type { Metadata } from "next";

import { CardShell } from "@/components/card-shell";
import { Container } from "@/components/container";
import { PageHero } from "@/components/page-hero";
import { SectionHeading } from "@/components/section-heading";

export const metadata: Metadata = {
  alternates: {
    canonical: "/terms",
  },
  description:
    "Terms information for the Trading Research Portal subscription and research access experience.",
  openGraph: {
    description:
      "Terms information for the Trading Research Portal subscription and research access experience.",
    title: "Terms of Use",
    url: "/terms",
  },
  title: "Terms of Use",
};

const terms = [
  {
    title: "Educational and informational content",
    description:
      "Content is provided for educational and informational purposes only. It should not be treated as personalized financial, investment, legal, or tax advice.",
  },
  {
    title: "No guaranteed results",
    description:
      "Trading and investing involve risk. Research examples, commentary, watchlists, software tools, member content, or closed reviews do not guarantee any trading or investing outcome.",
  },
  {
    title: "Subscriptions and member access",
    description:
      "Premium and Pro subscriptions may unlock member content, dashboard workflows, and tiered software-library access. Subscriptions renew until canceled and access changes are driven by Stripe webhook-confirmed billing status.",
  },
  {
    title: "User responsibility",
    description:
      "Visitors and members are responsible for their own research, risk management, and trading decisions.",
  },
  {
    title: "No broker or order execution",
    description:
      "The portal does not connect to brokers, execute orders, provide copy-trading automation, or manage TradingView invite-only access automatically.",
  },
  {
    title: "Legal review",
    description:
      "The site owner should review these terms with qualified legal counsel before live subscriptions, personalized services, or live trading research are offered.",
  },
];

export default function TermsPage() {
  return (
    <main className="flex-1">
      <section className="border-b border-border">
        <Container>
          <PageHero
            description="Website terms for an educational trading research portal. This page is plain-English planning language and is not legal advice."
            eyebrow="Site terms"
            title="Terms of Use"
          />
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <SectionHeading
            eyebrow="Subscription terms"
            title="Clear expectations for educational research access."
            description="These notes explain the research purpose, subscription access model, user responsibility, billing-source-of-truth model, and legal-review items to finalize before live subscriptions."
          />
          <div className="grid gap-5">
            {terms.map((item) => (
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
