import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldCheck, UserPlus } from "lucide-react";

import { Badge } from "@/components/badge";
import { CardShell } from "@/components/card-shell";
import { Container } from "@/components/container";
import { PageHero } from "@/components/page-hero";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  alternates: {
    canonical: "/register",
  },
  description:
    "Create an account for Trading Research Portal dashboard and subscription access.",
  openGraph: {
    description:
      "Create an account for Trading Research Portal dashboard and subscription access.",
    title: "Create Your Account",
    url: "/register",
  },
  title: "Create Your Account",
};

export const dynamic = "force-dynamic";

async function getCurrentUser() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return user;
  } catch {
    return null;
  }
}

export default async function RegisterPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex-1">
      <section className="border-b border-border">
        <Container className="grid gap-10 py-16 sm:py-20 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <PageHero
            className="py-0"
            description="Create an account for the private research dashboard. Premium and Pro access are managed through Stripe-hosted billing after checkout is configured for the environment."
            eyebrow="Account access"
            title="Create Your Account"
          />

          <CardShell className="relative overflow-hidden" padding="lg" tone="elevated">
            <div className="absolute inset-x-0 top-0 h-px bg-market-line" />
            <div className="flex flex-col gap-7">
              <div className="flex items-start gap-4">
                <div className="flex size-11 items-center justify-center rounded-lg border border-border bg-secondary text-primary">
                  <UserPlus aria-hidden />
                </div>
                <div>
                  <Badge tone="muted">Free account</Badge>
                  <h2 className="mt-3 text-2xl font-semibold text-foreground">
                    Start with a standard account
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    New users start with free access. Paid access is granted
                    only after Stripe webhook processing updates the account
                    subscription state.
                  </p>
                </div>
              </div>

              <RegisterForm />

              <div className="rounded-lg border border-border bg-secondary/35 p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck
                    aria-hidden
                    className="mt-0.5 size-4 text-primary"
                  />
                  <p className="text-sm leading-6 text-muted-foreground">
                    Payments are processed by Stripe. Research content and
                    software access are educational only, and no trading results
                    are guaranteed.
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
