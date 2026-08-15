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
    "Privacy information for the Trading Research Portal account, subscription, and research experience.",
  openGraph: {
    description:
      "Privacy information for the Trading Research Portal account, subscription, and research experience.",
    title: "Privacy Policy",
    url: "/privacy",
  },
  title: "Privacy Policy",
};

const privacyNotes = [
  {
    title: "Account and dashboard data",
    description:
      "Authenticated features may store account profile data, subscription tier/status metadata, saved ideas, followed tickers, watchlist items, preferences, member notes, and software access requests.",
  },
  {
    title: "Email and support communications",
    description:
      "Email notification infrastructure exists, but production sending remains disabled until provider-domain, support, legal, and business approval are complete. Account email addresses may still be used for authentication, billing records, notification preferences, unsubscribe records, and support workflows.",
  },
  {
    title: "Stripe payment processing",
    description:
      "Payments are processed by Stripe. The portal stores billing metadata such as customer, subscription, status, and audit references, but it does not store card numbers or raw payment method details.",
  },
  {
    title: "Member access and software requests",
    description:
      "Software access requests may include a TradingView username and member-provided notes so admins can review manual invite-only access. TradingView permissions are not automated in this phase.",
  },
  {
    title: "Privacy review",
    description:
      "This is prelaunch planning language, not legal advice. Privacy language should be reviewed with qualified legal counsel before live subscriptions, personalized services, or live trading research are offered.",
  },
];

export default function PrivacyPage() {
  return (
    <main className="flex-1">
      <section className="border-b border-border">
        <Container>
          <PageHero
            description="Privacy information for an educational trading research portal. This page is planning language and is not legal advice."
            eyebrow="Privacy"
            title="Privacy Policy"
          />
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <SectionHeading
            eyebrow="Privacy status"
            title="Account, billing, and member workflow data need clear handling."
            description="The portal uses Supabase for account/member data and Stripe for payment processing. Final privacy terms should be reviewed before live subscriptions are enabled."
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
