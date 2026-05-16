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
    "Contact information for the Trading Research Portal early-access site.",
  openGraph: {
    description:
      "Contact information for the Trading Research Portal early-access site.",
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
            description="A simple contact method will be added before early access opens."
            eyebrow="Contact"
            title="Contact"
          />
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <SectionHeading
            eyebrow="Early access contact"
            title="Support and inquiry channels will open with the launch process."
            description="The public site is currently focused on previewing the research model. A dedicated contact method will be added before memberships open."
          />
          <CardShell padding="lg" tone="elevated">
            <h2 className="text-lg font-semibold text-foreground">
              Contact channel coming soon
            </h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              For now, review the free research, planned pricing, and disclaimer
              pages to understand the early-access direction. A dedicated
              contact method will be published before early access opens.
            </p>
          </CardShell>
        </Container>
      </section>
    </main>
  );
}
