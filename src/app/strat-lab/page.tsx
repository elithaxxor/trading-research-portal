import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  FlaskConical,
  Layers3,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

import { Badge } from "@/components/badge";
import { CardShell } from "@/components/card-shell";
import { Container } from "@/components/container";
import { DisclaimerBanner } from "@/components/disclaimer-banner";
import { buttonVariants } from "@/components/ui/button";
import {
  canAccessStratLab,
  getCurrentSoftwareAccessTier,
} from "@/lib/software/access";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  description:
    "Discover Strat Lab, a Pro-only workspace for custom-built, institutional-style trading research tooling.",
  title: "Strat Lab",
};

export const dynamic = "force-dynamic";

const capabilities = [
  {
    description:
      "Organize repeatable research processes around market structure, conditions, and scenario evaluation.",
    icon: Layers3,
    title: "Structured workflows",
  },
  {
    description:
      "Study strategy logic and supporting documentation without connecting a broker or automating execution.",
    icon: FlaskConical,
    title: "Strategy research",
  },
  {
    description:
      "Use purpose-built tools designed for disciplined analysis, validation, and risk-aware review.",
    icon: Activity,
    title: "Custom tooling",
  },
];

export default async function StratLabLandingPage() {
  const access = await getCurrentSoftwareAccessTier().catch(() => null);
  const canAccess = access
    ? canAccessStratLab(access.userTier, access.isAdmin)
    : false;

  return (
    <main className="flex-1">
      <section className="relative flex min-h-[min(40rem,72svh)] items-center overflow-hidden border-b border-border py-12 sm:py-16">
        <Image
          alt="Institutional-style Strat Lab workspace with charts, indicators, and analytical panels"
          className="object-cover object-center"
          fill
          priority
          sizes="100vw"
          src="/images/strat-lab-workspace.png"
        />
        <div className="absolute inset-0 bg-black/55" aria-hidden />
        <Container className="relative z-10">
          <div className="max-w-3xl">
            <Badge tone="gold">Pro research workspace</Badge>
            <h1 className="mt-6 text-balance text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
              Strat Lab
            </h1>
            <p className="mt-6 max-w-2xl text-pretty text-base leading-7 text-zinc-200 sm:text-lg">
              Strat Lab is where custom-built, institutional-style research
              tooling lives. It brings structured strategy study, repeatable
              analytical workflows, and disciplined validation into one
              protected Pro workspace.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                className={cn(buttonVariants({ size: "lg" }))}
                href={canAccess ? "/dashboard/strat-lab" : "/pricing"}
              >
                {canAccess ? "Open Strat Lab" : "View Pro access"}
                <ArrowUpRight data-icon="inline-end" />
              </Link>
              <Link
                className={cn(
                  buttonVariants({ size: "lg", variant: "outline" })
                )}
                href="/research"
              >
                Explore research
              </Link>
            </div>
            <div className="mt-8 flex max-w-2xl items-start gap-4 border-l border-primary pl-5">
              {canAccess ? (
                <ShieldCheck className="mt-1 size-6 shrink-0 text-positive" />
              ) : (
                <LockKeyhole className="mt-1 size-6 shrink-0 text-primary" />
              )}
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.16em] text-primary">
                  {canAccess ? "Access confirmed" : "Pro access required"}
                </p>
                <p className="mt-2 text-sm leading-6 text-zinc-300">
                  {canAccess
                    ? "Your account can enter the protected Strat Lab workspace."
                    : "Everyone can review this overview. Strategy records, documentation, and downloads remain locked to active Pro members and admins."}
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="border-b border-border bg-surface/35 py-9 sm:py-16">
        <Container>
          <div className="mb-8 max-w-3xl">
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-primary">
              Inside the lab
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-foreground sm:text-3xl">
              Research infrastructure built for deeper strategy work.
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {capabilities.map((capability) => {
              const Icon = capability.icon;

              return (
                <CardShell
                  className="flex h-full flex-col gap-5"
                  key={capability.title}
                  padding="md"
                  tone="elevated"
                >
                  <Icon className="size-6 text-primary" />
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {capability.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {capability.description}
                    </p>
                  </div>
                </CardShell>
              );
            })}
          </div>
        </Container>
      </section>

      <Container className="py-12 sm:py-16">
        <DisclaimerBanner message="Strat Lab provides educational research tooling only. It does not connect to brokers, execute orders, provide copy trading, or guarantee results." />
      </Container>
    </main>
  );
}
