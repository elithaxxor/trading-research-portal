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
    "Early-access terms information for the Trading Research Portal.",
  openGraph: {
    description:
      "Early-access terms information for the Trading Research Portal.",
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
      "Trading and investing involve risk. Research examples, commentary, watchlists, or future member content do not guarantee any trading or investing outcome.",
  },
  {
    title: "Early access status",
    description:
      "The private dashboard and premium memberships are being prepared. Access details, plan terms, and member features may change before memberships open.",
  },
  {
    title: "User responsibility",
    description:
      "Visitors and future members are responsible for their own research, risk management, and trading decisions.",
  },
  {
    title: "Legal review",
    description:
      "The site owner should review these terms with qualified legal counsel before paid memberships, personalized services, or live trading research are offered.",
  },
];

export default function TermsPage() {
  return (
    <main className="flex-1">
      <section className="border-b border-border">
        <Container>
          <PageHero
            description="Early-access website terms for an educational trading research portal. This page is plain-English planning language and is not legal advice."
            eyebrow="Site terms"
            title="Terms of Use"
          />
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <SectionHeading
            eyebrow="Early access terms"
            title="Clear expectations before memberships open."
            description="These notes explain the current public research experience, educational purpose, user responsibility, and legal-review items that should be finalized before paid access is offered."
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
