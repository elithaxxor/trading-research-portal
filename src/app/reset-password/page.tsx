import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { KeyRound, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/badge";
import { CardShell } from "@/components/card-shell";
import { Container } from "@/components/container";
import { PageHero } from "@/components/page-hero";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = {
  alternates: {
    canonical: "/reset-password",
  },
  description: "Choose a new password for your Trading Research Portal account.",
  openGraph: {
    description:
      "Choose a new password for your Trading Research Portal account.",
    title: "Choose a New Password",
    url: "/reset-password",
  },
  title: "Choose a New Password",
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

export default async function ResetPasswordPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?authError=password_reset_required");
  }

  return (
    <main className="flex-1">
      <section className="border-b border-border">
        <Container className="grid gap-10 py-16 sm:py-20 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <PageHero
            className="py-0"
            description="Set a new password for your private research dashboard access."
            eyebrow="Account recovery"
            title="Choose a New Password"
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
                  <Badge tone="muted">Recovery session</Badge>
                  <h2 className="mt-3 text-2xl font-semibold text-foreground">
                    Update your password
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    This page requires a valid password recovery session from
                    your reset email.
                  </p>
                </div>
              </div>

              <ResetPasswordForm />

              <div className="rounded-lg border border-border bg-secondary/35 p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck
                    aria-hidden
                    className="mt-0.5 size-4 text-primary"
                  />
                  <p className="text-sm leading-6 text-muted-foreground">
                    If this page does not load from your reset email, request a
                    new password reset link and use the latest email.
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
