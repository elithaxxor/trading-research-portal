import type { Metadata } from "next";
import Link from "next/link";
import { KeyRound, LockKeyhole, Mail } from "lucide-react";

import { Badge } from "@/components/badge";
import { CardShell } from "@/components/card-shell";
import { Container } from "@/components/container";
import { PageHero } from "@/components/page-hero";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  alternates: {
    canonical: "/login",
  },
  description:
    "Member access is coming soon for the Trading Research Portal private dashboard.",
  openGraph: {
    description:
      "Member access is coming soon for the Trading Research Portal private dashboard.",
    title: "Member Access Coming Soon",
    url: "/login",
  },
  title: "Member Access Coming Soon",
};

export default function LoginPage() {
  return (
    <main className="flex-1">
      <section className="border-b border-border">
        <Container className="grid gap-10 py-16 sm:py-20 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <PageHero
            className="py-0"
            description="The private member dashboard is being prepared. Login will open when early access begins."
            eyebrow="Member access"
            title="Member Access Coming Soon"
          />

          <CardShell className="relative overflow-hidden" padding="lg" tone="elevated">
            <div className="absolute inset-x-0 top-0 h-px bg-market-line" />
            <div className="flex flex-col gap-7">
              <div className="flex items-start gap-4">
                <div className="flex size-11 items-center justify-center rounded-lg border border-border bg-secondary text-primary">
                  <LockKeyhole aria-hidden />
                </div>
                <div>
                  <Badge tone="muted">Access preview</Badge>
                  <h2 className="mt-3 text-2xl font-semibold text-foreground">
                    Private dashboard access
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Early access members will use this area when the dashboard
                    opens.
                  </p>
                </div>
              </div>

              <div className="grid gap-4">
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
                Access Coming Soon
              </button>

              <p className="text-center text-sm leading-6 text-muted-foreground">
                Interested in access?{" "}
                <Link
                  className="font-medium text-primary transition-colors hover:text-foreground"
                  href="/register"
                >
                  Join early access
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
