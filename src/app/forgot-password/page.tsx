import type { Metadata } from "next";
import { KeyRound, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/badge";
import { CardShell } from "@/components/card-shell";
import { Container } from "@/components/container";
import { PageHero } from "@/components/page-hero";

import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = {
  alternates: {
    canonical: "/forgot-password",
  },
  description:
    "Request a password reset link for your Trading Research Portal account.",
  openGraph: {
    description:
      "Request a password reset link for your Trading Research Portal account.",
    title: "Reset Your Password",
    url: "/forgot-password",
  },
  title: "Reset Your Password",
};

export default function ForgotPasswordPage() {
  return (
    <main className="flex-1">
      <section className="border-b border-border">
        <Container className="grid gap-10 py-16 sm:py-20 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <PageHero
            className="py-0"
            description="Enter your email and we will send reset instructions if an account exists."
            eyebrow="Account recovery"
            title="Reset Your Password"
          />

          <CardShell
            className="relative overflow-hidden"
            padding="lg"
            tone="elevated"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-market-line" />
            <div className="flex flex-col gap-7">
              <div className="flex items-start gap-4">
                <div className="flex size-11 items-center justify-center rounded-lg border border-border bg-secondary text-primary">
                  <KeyRound aria-hidden />
                </div>
                <div>
                  <Badge tone="muted">Private access</Badge>
                  <h2 className="mt-3 text-2xl font-semibold text-foreground">
                    Request a reset link
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    For privacy, the response is the same whether an email is
                    registered or not.
                  </p>
                </div>
              </div>

              <ForgotPasswordForm />

              <div className="rounded-lg border border-border bg-secondary/35 p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck
                    aria-hidden
                    className="mt-0.5 size-4 text-primary"
                  />
                  <p className="text-sm leading-6 text-muted-foreground">
                    Password reset links are handled through Supabase Auth and
                    return through the secure auth callback route.
                  </p>
                </div>
              </div>
            </div>
          </CardShell>
        </Container>
      </section>
    </main>
  );
}
