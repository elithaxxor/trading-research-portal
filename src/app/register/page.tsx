import type { Metadata } from "next";
import Link from "next/link";
import { KeyRound, Mail, UserPlus, UserRound } from "lucide-react";

import { Badge } from "@/components/badge";
import { CardShell } from "@/components/card-shell";
import { Container } from "@/components/container";
import { PageHero } from "@/components/page-hero";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  alternates: {
    canonical: "/register",
  },
  description:
    "Join early access for future Trading Research Portal premium membership updates.",
  openGraph: {
    description:
      "Join early access for future Trading Research Portal premium membership updates.",
    title: "Join Early Access",
    url: "/register",
  },
  title: "Join Early Access",
};

export default function RegisterPage() {
  return (
    <main className="flex-1">
      <section className="border-b border-border">
        <Container className="grid gap-10 py-16 sm:py-20 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <PageHero
            className="py-0"
            description="Premium memberships are not open yet. This page previews the future access flow."
            eyebrow="Early access"
            title="Join Early Access"
          />

          <CardShell className="relative overflow-hidden" padding="lg" tone="elevated">
            <div className="absolute inset-x-0 top-0 h-px bg-market-line" />
            <div className="flex flex-col gap-7">
              <div className="flex items-start gap-4">
                <div className="flex size-11 items-center justify-center rounded-lg border border-border bg-secondary text-primary">
                  <UserPlus aria-hidden />
                </div>
                <div>
                  <Badge tone="muted">Visual preview</Badge>
                  <h2 className="mt-3 text-2xl font-semibold text-foreground">
                    Early access interest
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    The private dashboard is in development. Early access will
                    open when memberships are ready.
                  </p>
                </div>
              </div>

              <div className="grid gap-4">
                <PreviewField
                  icon={UserRound}
                  label="Name"
                  type="text"
                />
                <PreviewField
                  icon={Mail}
                  label="Email"
                  type="email"
                />
                <PreviewField
                  icon={KeyRound}
                  label="Password"
                  type="password"
                />
              </div>

              <button
                className={cn(buttonVariants({ size: "lg" }), "w-full")}
                disabled
                type="button"
              >
                Join Early Access
              </button>

              <p className="text-center text-sm leading-6 text-muted-foreground">
                Already have an account?{" "}
                <Link
                  className="font-medium text-primary transition-colors hover:text-foreground"
                  href="/login"
                >
                  Login
                </Link>
              </p>
            </div>
          </CardShell>
        </Container>
      </section>
    </main>
  );
}

function PreviewField({
  icon: Icon,
  label,
  type,
}: {
  icon: typeof Mail;
  label: string;
  type: "email" | "password" | "text";
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <span className="relative">
        <Icon
          className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          className="h-11 w-full rounded-lg border border-border bg-background px-10 text-sm text-foreground outline-none disabled:cursor-not-allowed disabled:opacity-80"
          disabled
          type={type}
        />
      </span>
    </label>
  );
}
