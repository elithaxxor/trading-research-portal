import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, MailX, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/badge";
import { CardShell } from "@/components/card-shell";
import { Container } from "@/components/container";
import { buttonVariants } from "@/components/ui/button";
import { formatUnsubscribeGroup } from "@/lib/email/format";
import { processUnsubscribeToken } from "@/lib/email/unsubscribe";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  alternates: {
    canonical: "/unsubscribe",
  },
  description: "Confirm email unsubscribe preferences.",
  title: "Unsubscribe",
};

export const dynamic = "force-dynamic";

type UnsubscribePageProps = {
  searchParams?: Promise<{
    token?: string | string[];
  }>;
};

function getFirstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function maskEmail(email: string) {
  const [name, domain] = email.split("@");

  if (!name || !domain) {
    return "your email address";
  }

  const visible = name.slice(0, Math.min(2, name.length));

  return `${visible}${"*".repeat(Math.max(2, name.length - visible.length))}@${domain}`;
}

async function getUnsubscribeResult(token: string | undefined) {
  if (!token) {
    return {
      error: "This unsubscribe link is missing a token.",
      row: null,
    };
  }

  try {
    const row = await processUnsubscribeToken(token);

    if (!row) {
      return {
        error: "This unsubscribe link is invalid or has expired.",
        row: null,
      };
    }

    return { error: null, row };
  } catch {
    return {
      error: "We could not process this unsubscribe link.",
      row: null,
    };
  }
}

export default async function UnsubscribePage({
  searchParams,
}: UnsubscribePageProps) {
  const params = await searchParams;
  const token = getFirstParam(params?.token);
  const { error, row } = await getUnsubscribeResult(token);
  const isSuccess = Boolean(row && !error);

  return (
    <main className="flex-1">
      <section className="border-b border-border">
        <Container className="py-12 sm:py-16">
          <div className="flex max-w-3xl flex-col gap-5">
            <Badge tone={isSuccess ? "positive" : "gold"}>
              Email preferences
            </Badge>
            <div className="flex flex-col gap-3">
              <h1 className="text-balance text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
                {isSuccess ? "Unsubscribe confirmed" : "Unsubscribe link"}
              </h1>
              <p className="text-base leading-7 text-muted-foreground sm:text-lg">
                {isSuccess
                  ? "Your email preference update has been recorded."
                  : "We could not confirm this unsubscribe request from the link provided."}
              </p>
            </div>
          </div>
        </Container>
      </section>

      <section>
        <Container className="grid gap-6 py-10 sm:py-12 lg:grid-cols-[1fr_0.8fr]">
          <CardShell padding="lg" tone="elevated">
            <div className="flex items-start gap-4">
              <div className="flex size-11 items-center justify-center rounded-lg border border-border bg-secondary text-primary">
                {isSuccess ? <CheckCircle2 aria-hidden /> : <MailX aria-hidden />}
              </div>
              <div className="min-w-0">
                <Badge tone={isSuccess ? "positive" : "muted"}>
                  {isSuccess ? "Updated" : "Not updated"}
                </Badge>
                <h2 className="mt-3 text-2xl font-semibold text-foreground">
                  {isSuccess
                    ? formatUnsubscribeGroup(row?.unsubscribe_group)
                    : "Token not processed"}
                </h2>
                {isSuccess && row ? (
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    We recorded an unsubscribe preference for{" "}
                    <span className="break-words font-medium text-foreground">
                      {maskEmail(row.email)}
                    </span>
                    . Group-specific unsubscribes disable that group. An all
                    unsubscribe suppresses non-essential content, lifecycle,
                    and digest emails; transactional software, billing, and
                    account status emails may still be sent when needed.
                  </p>
                ) : (
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {error} You can still sign in and update notification
                    preferences from your account.
                  </p>
                )}

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Link
                    className={cn(buttonVariants({ size: "lg" }))}
                    href="/account/notifications"
                  >
                    Manage Preferences
                  </Link>
                  <Link
                    className={cn(
                      buttonVariants({ size: "lg", variant: "outline" })
                    )}
                    href="/"
                  >
                    Return Home
                  </Link>
                </div>
              </div>
            </div>
          </CardShell>

          <CardShell padding="lg" tone="subtle">
            <div className="flex items-start gap-4">
              <div className="flex size-11 items-center justify-center rounded-lg border border-border bg-secondary text-primary">
                <ShieldCheck aria-hidden />
              </div>
              <div>
                <Badge tone="muted">Privacy</Badge>
                <h2 className="mt-3 text-2xl font-semibold text-foreground">
                  Safe confirmation only
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  This public page does not reveal private account data,
                  subscription details, research content, software access, or
                  billing information.
                </p>
              </div>
            </div>
          </CardShell>
        </Container>
      </section>
    </main>
  );
}
