import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LockKeyhole, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/badge";
import { AuthNotice } from "@/components/auth-notice";
import { CardShell } from "@/components/card-shell";
import { Container } from "@/components/container";
import { PageHero } from "@/components/page-hero";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  alternates: {
    canonical: "/login",
  },
  description: "Sign in to access your private trading research dashboard.",
  openGraph: {
    description: "Sign in to access your private trading research dashboard.",
    title: "Member Login",
    url: "/login",
  },
  title: "Member Login",
};

type LoginPageProps = {
  searchParams?: Promise<{
    authError?: string | string[];
    redirectedFrom?: string | string[];
    status?: string | string[];
  }>;
};

function sanitizeRedirectedFrom(value?: string | string[]) {
  const redirectedFrom = Array.isArray(value) ? value[0] : value;

  if (
    redirectedFrom &&
    redirectedFrom.startsWith("/") &&
    !redirectedFrom.startsWith("//")
  ) {
    return redirectedFrom;
  }

  return "";
}

function getFirstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function getLoginNotice(params?: Awaited<LoginPageProps["searchParams"]>) {
  const status = getFirstParam(params?.status);
  const authError = getFirstParam(params?.authError);

  if (status === "signed_out") {
    return {
      message: "You have been signed out.",
      tone: "success" as const,
    };
  }

  if (authError === "password_reset_required") {
    return {
      message:
        "Use the latest password reset link from your email before choosing a new password.",
      tone: "info" as const,
    };
  }

  if (authError === "callback_failed") {
    return {
      message:
        "We could not complete the email link sign-in. Request a new link or sign in again.",
      tone: "error" as const,
    };
  }

  if (authError === "missing_code") {
    return {
      message:
        "That sign-in link is incomplete. Request a new email link or sign in again.",
      tone: "error" as const,
    };
  }

  return null;
}

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

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const redirectedFrom = sanitizeRedirectedFrom(params?.redirectedFrom);
  const notice = getLoginNotice(params);
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
            description="Access your private trading research dashboard, including research notes, watchlists, and transparent update logs."
            eyebrow="Member access"
            title="Member Login"
          />

          <CardShell className="relative overflow-hidden" padding="lg" tone="elevated">
            <div className="absolute inset-x-0 top-0 h-px bg-market-line" />
            <div className="flex flex-col gap-7">
              <div className="flex items-start gap-4">
                <div className="flex size-11 items-center justify-center rounded-lg border border-border bg-secondary text-primary">
                  <LockKeyhole aria-hidden />
                </div>
                <div>
                  <Badge tone="muted">Secure access</Badge>
                  <h2 className="mt-3 text-2xl font-semibold text-foreground">
                    Sign in to continue
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Access your private trading research dashboard.
                  </p>
                </div>
              </div>

              <LoginForm redirectedFrom={redirectedFrom} />

              {notice ? (
                <AuthNotice message={notice.message} tone={notice.tone} />
              ) : null}

              <div className="rounded-lg border border-border bg-secondary/35 p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck
                    aria-hidden
                    className="mt-0.5 size-4 text-primary"
                  />
                  <p className="text-sm leading-6 text-muted-foreground">
                    Research content is educational and risk-aware. No dashboard
                    content should be treated as personalized financial advice.
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
