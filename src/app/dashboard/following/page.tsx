import type { Metadata } from "next";
import { Eye } from "lucide-react";

import {
  unfollowTickerAction,
  updateFollowedTickerNoteAction,
} from "@/app/dashboard/member-actions";
import { Badge } from "@/components/badge";
import { CardShell } from "@/components/card-shell";
import { FollowTickerSubmitButton } from "@/components/content/follow-ticker-submit-button";
import { IdeaCard } from "@/components/content/idea-card";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { DashboardStatCard } from "@/components/dashboard/DashboardStatCard";
import { MemberActionNotice } from "@/components/member-action-notice";
import { getIdeaPreviews } from "@/lib/content/ideas";
import { getFollowedTickerIdeaCards } from "@/lib/member/dashboard";
import { listFollowedTickers } from "@/lib/member/followed-tickers";

export const metadata: Metadata = {
  title: "Following",
};

export const dynamic = "force-dynamic";

type FollowingPageProps = {
  searchParams?: Promise<{
    notice?: string | string[];
  }>;
};

export default async function FollowingPage({
  searchParams,
}: FollowingPageProps) {
  const params = await searchParams;
  const [followedTickers, cards] = await Promise.all([
    listFollowedTickers(),
    getFollowedTickerIdeaCards(24),
  ]);
  const relatedIdeasByTicker = new Map(
    await Promise.all(
      followedTickers.map(async (ticker) => {
        const relatedIdeas = await getIdeaPreviews({
          limit: 3,
          search: ticker.ticker,
          sort: "updated",
        });

        return [
          ticker.ticker,
          relatedIdeas.filter(
            (idea) => idea.ticker.toUpperCase() === ticker.ticker.toUpperCase()
          ),
        ] as const;
      })
    )
  );

  return (
    <div className="grid gap-8">
      <DashboardPageHeader
        breadcrumbs={[
          { href: "/dashboard", label: "Dashboard" },
          { label: "Following" },
        ]}
        description="Ticker-level follow list for finding recent research connected to names you care about."
        title="Following"
      />

      <MemberActionNotice notice={params?.notice} />

      <DashboardStatCard
        description="Followed tickers are member-owned and do not subscribe you to alerts."
        icon={Eye}
        label="Tickers"
        value={String(followedTickers.length)}
      />

      <DashboardSection title="Followed tickers">
        {followedTickers.length > 0 ? (
          <div className="grid gap-4">
            {followedTickers.map((ticker) => (
              <CardShell key={ticker.id} padding="md" tone="subtle">
                <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                  <div className="flex min-w-0 flex-col gap-4">
                    <div>
                      <Badge tone="gold">{ticker.ticker}</Badge>
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">
                        Content-following only. No price alerts, live market
                        data feeds, or broker actions are created.
                      </p>
                    </div>

                    <form
                      action={updateFollowedTickerNoteAction}
                      className="grid gap-3"
                    >
                      <input name="ticker" type="hidden" value={ticker.ticker} />
                      <input
                        name="return_to"
                        type="hidden"
                        value="/dashboard/following"
                      />
                      <label className="grid gap-2 text-sm font-medium text-foreground">
                        Ticker note
                        <textarea
                          className="min-h-24 rounded-lg border border-border bg-background px-3 py-2 text-sm leading-6 text-foreground outline-none transition placeholder:text-muted-foreground focus:border-gold-400 focus:ring-2 focus:ring-gold-400/25"
                          defaultValue={ticker.note ?? ""}
                          maxLength={2000}
                          name="note"
                          placeholder="Add a private ticker note..."
                        />
                      </label>
                      <FollowTickerSubmitButton
                        icon="followed"
                        label="Update note"
                        pendingLabel="Updating..."
                      />
                    </form>

                    <form action={unfollowTickerAction}>
                      <input name="ticker" type="hidden" value={ticker.ticker} />
                      <input
                        name="return_to"
                        type="hidden"
                        value="/dashboard/following"
                      />
                      <FollowTickerSubmitButton
                        icon="unfollow"
                        label="Unfollow ticker"
                        pendingLabel="Removing..."
                        variant="ghost"
                      />
                    </form>
                  </div>

                  <div className="grid gap-3">
                    <h2 className="text-base font-semibold text-foreground">
                      Recent related ideas
                    </h2>
                    {(relatedIdeasByTicker.get(ticker.ticker) ?? []).length >
                    0 ? (
                      <div className="grid gap-3">
                        {(relatedIdeasByTicker.get(ticker.ticker) ?? []).map(
                          (idea) => (
                            <div
                              className="rounded-lg border border-border bg-background/45 p-3"
                              key={`${ticker.id}-${idea.id}`}
                            >
                              <div className="flex flex-wrap gap-2">
                                <Badge tone="muted">{idea.visibility}</Badge>
                                <Badge tone="muted">{idea.status}</Badge>
                              </div>
                              <p className="mt-2 text-sm font-semibold text-foreground">
                                {idea.title}
                              </p>
                              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                {idea.is_locked
                                  ? "Locked preview only"
                                  : "Full research available"}
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <p className="rounded-lg border border-border bg-background/45 px-4 py-3 text-sm leading-6 text-muted-foreground">
                        No recent idea previews match this ticker yet.
                      </p>
                    )}
                  </div>
                </div>
              </CardShell>
            ))}
          </div>
        ) : (
          <DashboardEmptyState
            actionHref="/ideas"
            actionLabel="Browse ideas"
            description="Follow tickers to pull related research into this view."
            title="No followed tickers yet"
          />
        )}
      </DashboardSection>

      <DashboardSection
        description="These cards are filtered by the ticker symbols you follow."
        title="Related research"
      >
        {cards.length > 0 ? (
          <div className="grid gap-5 xl:grid-cols-3">
            {cards.map((idea) => (
              <IdeaCard
                key={idea.id}
                lockedCtaHref="/pricing"
                lockedCtaLabel="View access options"
                {...idea}
              />
            ))}
          </div>
        ) : (
          <DashboardEmptyState
            description="No accessible idea previews match your followed tickers yet."
            title="No related research"
          />
        )}
      </DashboardSection>
    </div>
  );
}
