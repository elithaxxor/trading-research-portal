import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight } from "lucide-react";

import { signOutAction } from "@/app/(auth)/actions";
import { Badge } from "@/components/badge";
import { AuthNotice } from "@/components/auth-notice";
import { CardShell } from "@/components/card-shell";
import { Container } from "@/components/container";
import { EmptyState } from "@/components/content/empty-state";
import { IdeaCard } from "@/components/content/idea-card";
import { ResearchPostCard } from "@/components/content/research-post-card";
import { SignOutSubmitButton } from "@/components/sign-out-submit-button";
import { buttonVariants } from "@/components/ui/button";
import { ensureUserRecords } from "@/lib/auth/ensure-user-records";
import { getIdeaPreviews } from "@/lib/content/ideas";
import { getPostPreviews } from "@/lib/content/posts";
import type { IdeaPreview, PostPreview } from "@/lib/content/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database.types";

export const metadata: Metadata = {
  alternates: {
    canonical: "/dashboard",
  },
  description:
    "Private dashboard shell for Trading Research Portal account access.",
  openGraph: {
    description:
      "Private dashboard shell for Trading Research Portal account access.",
    title: "Dashboard",
    url: "/dashboard",
  },
  title: "Dashboard",
};

export const dynamic = "force-dynamic";

type SubscriptionRow =
  Database["public"]["Tables"]["subscriptions"]["Row"];

function loginRedirect(): never {
  redirect("/login?redirectedFrom=%2Fdashboard");
}

async function getDashboardContext() {
  const warnings: string[] = [];
  const supabase = await createSupabaseServerClient().catch(() => null);

  if (!supabase) {
    loginRedirect();
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    loginRedirect();
  }

  await ensureUserRecords(user).catch(() => {
    warnings.push(
      "Account setup is still preparing. Some dashboard details may show default access until setup finishes."
    );
  });

  const { data: subscription, error: subscriptionError } = await supabase
    .from("subscriptions")
    .select("tier,status,current_period_end")
    .eq("user_id", user.id)
    .maybeSingle();

  if (subscriptionError) {
    warnings.push(
      "We could not load subscription details right now. Your account is shown with safe default access."
    );
  }

  const [
    latestIdeasResult,
    recentlyUpdatedIdeasResult,
    latestResearchResult,
  ] = await Promise.allSettled([
    getIdeaPreviews({ limit: 3 }),
    getIdeaPreviews({ limit: 3, sort: "updated" }),
    getPostPreviews({ limit: 3 }),
  ]);

  if (latestIdeasResult.status === "rejected") {
    warnings.push("Latest trading idea previews could not be loaded.");
  }

  if (recentlyUpdatedIdeasResult.status === "rejected") {
    warnings.push("Recently updated idea previews could not be loaded.");
  }

  if (latestResearchResult.status === "rejected") {
    warnings.push("Latest research previews could not be loaded.");
  }

  return {
    latestIdeas:
      latestIdeasResult.status === "fulfilled" ? latestIdeasResult.value : [],
    latestResearch:
      latestResearchResult.status === "fulfilled"
        ? latestResearchResult.value
        : [],
    recentlyUpdatedIdeas:
      recentlyUpdatedIdeasResult.status === "fulfilled"
        ? recentlyUpdatedIdeasResult.value
        : [],
    subscription,
    user,
    warnings,
  };
}

function formatTier(subscription: Pick<SubscriptionRow, "tier"> | null) {
  const tier = subscription?.tier ?? "free";

  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

function formatStatus(
  subscription: Pick<SubscriptionRow, "status"> | null
) {
  if (!subscription) {
    return "Free access";
  }

  return subscription.status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default async function DashboardPage() {
  const {
    latestIdeas,
    latestResearch,
    recentlyUpdatedIdeas,
    subscription,
    user,
    warnings,
  } = await getDashboardContext();
  const tierLabel = formatTier(subscription);
  const statusLabel = formatStatus(subscription);

  return (
    <main className="flex-1">
      <section className="border-b border-border">
        <Container className="py-12 sm:py-16">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex max-w-3xl flex-col gap-5">
              <Badge tone="gold">Member dashboard</Badge>
              <div className="flex flex-col gap-3">
                <h1 className="text-balance text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
                  Welcome to your research dashboard.
                </h1>
                <p className="text-base leading-7 text-muted-foreground sm:text-lg">
                  Review RLS-aware research previews, recent updates, and your
                  current account tier from one protected workspace.
                </p>
              </div>
            </div>

            <form action={signOutAction}>
              <SignOutSubmitButton className="w-full sm:w-auto" />
            </form>
          </div>
        </Container>
      </section>

      <section>
        <Container className="grid gap-6 py-10 sm:py-12">
          {warnings.map((warning) => (
            <AuthNotice key={warning} message={warning} tone="info" />
          ))}

          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <CardShell padding="lg" tone="elevated">
              <div className="flex flex-col gap-6">
                <div>
                  <Badge tone="muted">Signed in</Badge>
                  <h2 className="mt-3 text-2xl font-semibold text-foreground">
                    Account access
                  </h2>
                </div>

                <dl className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border border-border bg-secondary/35 p-4">
                    <dt className="text-sm text-muted-foreground">Email</dt>
                    <dd className="mt-2 break-words text-sm font-medium text-foreground">
                      {user.email ?? "Email unavailable"}
                    </dd>
                  </div>
                  <div className="rounded-lg border border-border bg-secondary/35 p-4">
                    <dt className="text-sm text-muted-foreground">
                      Current tier
                    </dt>
                    <dd className="mt-2 text-sm font-medium text-foreground">
                      {tierLabel}
                    </dd>
                  </div>
                  <div className="rounded-lg border border-border bg-secondary/35 p-4 sm:col-span-2">
                    <dt className="text-sm text-muted-foreground">
                      Subscription status
                    </dt>
                    <dd className="mt-2 text-sm font-medium text-foreground">
                      {statusLabel}
                    </dd>
                  </div>
                </dl>
              </div>
            </CardShell>

            <CardShell padding="lg" tone="subtle">
              <div className="flex h-full flex-col justify-between gap-6">
                <div>
                  <Badge tone="gold">Account Tier Summary</Badge>
                  <h2 className="mt-3 text-2xl font-semibold text-foreground">
                    {tierLabel} research access
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    Your account is currently shown as {tierLabel.toLowerCase()}{" "}
                    with status {statusLabel.toLowerCase()}. Content access is
                    enforced by Supabase RLS, not client-side hiding.
                  </p>
                </div>
                <Link
                  className={cn(
                    "w-full sm:w-fit",
                    buttonVariants({ size: "lg", variant: "outline" })
                  )}
                  href="/pricing"
                >
                  View access options
                  <ArrowUpRight data-icon="inline-end" />
                </Link>
              </div>
            </CardShell>
          </div>

          <DashboardIdeaSection
            description="Latest safe previews across free, premium, and pro trading research. Locked cards do not expose full thesis, levels, or targets."
            emptyDescription="No trading idea previews are available yet."
            ideas={latestIdeas}
            title="Latest Trading Ideas"
          />

          <DashboardIdeaSection
            description="Recent preview cards ordered by updated date, useful for quickly spotting refreshed research."
            emptyDescription="No recently updated idea previews are available yet."
            ideas={recentlyUpdatedIdeas}
            title="Recently Updated Ideas"
          />

          <DashboardResearchSection posts={latestResearch} />
        </Container>
      </section>
    </main>
  );
}

function DashboardIdeaSection({
  description,
  emptyDescription,
  ideas,
  title,
}: {
  description: string;
  emptyDescription: string;
  ideas: IdeaPreview[];
  title: string;
}) {
  return (
    <section className="flex flex-col gap-5">
      <WidgetHeader
        ctaHref="/ideas"
        ctaLabel="View all ideas"
        description={description}
        title={title}
      />

      {ideas.length > 0 ? (
        <div className="grid gap-5 xl:grid-cols-3">
          {ideas.map((idea) => (
            <IdeaCard
              key={`${title}-${idea.id}`}
              lockedCtaHref="/pricing"
              lockedCtaLabel="View access options"
              {...idea}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          actionHref="/ideas"
          description={emptyDescription}
          title="No ideas found"
        />
      )}
    </section>
  );
}

function DashboardResearchSection({ posts }: { posts: PostPreview[] }) {
  return (
    <section className="flex flex-col gap-5">
      <WidgetHeader
        ctaHref="/research"
        ctaLabel="View all research"
        description="Latest market commentary and educational research previews. Locked posts keep full body content protected."
        title="Latest Research"
      />

      {posts.length > 0 ? (
        <div className="grid gap-5 xl:grid-cols-3">
          {posts.map((post) => (
            <ResearchPostCard
              key={post.id}
              lockedCtaHref="/pricing"
              lockedCtaLabel="View access options"
              {...post}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          actionHref="/research"
          description="No research post previews are available yet."
          title="No research found"
        />
      )}
    </section>
  );
}

function WidgetHeader({
  ctaHref,
  ctaLabel,
  description,
  title,
}: {
  ctaHref: string;
  ctaLabel: string;
  description: string;
  title: string;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-3xl">
        <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
      <Link
        className={cn(
          "w-full sm:w-auto",
          buttonVariants({ size: "lg", variant: "outline" })
        )}
        href={ctaHref}
      >
        {ctaLabel}
        <ArrowUpRight data-icon="inline-end" />
      </Link>
    </div>
  );
}
