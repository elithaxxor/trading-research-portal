import type { Metadata } from "next";
import Link from "next/link";
import { ListChecks, Star } from "lucide-react";

import {
  addWatchlistItemAction,
  removeWatchlistItemAction,
  updateWatchlistItemAction,
} from "@/app/dashboard/member-actions";
import { CardShell } from "@/components/card-shell";
import { IdeaStatusBadge } from "@/components/content/idea-status-badge";
import { VisibilityBadge } from "@/components/content/visibility-badge";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { DashboardStatCard } from "@/components/dashboard/DashboardStatCard";
import { WatchlistSubmitButton } from "@/components/dashboard/WatchlistSubmitButton";
import { MemberActionNotice } from "@/components/member-action-notice";
import { listWatchlistItems } from "@/lib/member/watchlist";

export const metadata: Metadata = {
  title: "Watchlist",
};

export const dynamic = "force-dynamic";

type DashboardWatchlistPageProps = {
  searchParams?: Promise<{
    notice?: string | string[];
  }>;
};

export default async function DashboardWatchlistPage({
  searchParams,
}: DashboardWatchlistPageProps) {
  const params = await searchParams;
  const items = await listWatchlistItems();
  const linkedIdeaCount = items.filter((item) => item.linkedIdea).length;

  return (
    <div className="grid gap-8">
      <DashboardPageHeader
        breadcrumbs={[
          { href: "/dashboard", label: "Dashboard" },
          { label: "Watchlist" },
        ]}
        description="Manage a personal ticker watchlist with optional links to accessible published ideas. This is content organization only, not alerts or trading automation."
        title="Watchlist"
      />

      <MemberActionNotice notice={params?.notice} />

      <div className="grid gap-4 md:grid-cols-2">
        <DashboardStatCard
          description="Ticker rows owned by your authenticated account."
          icon={Star}
          label="Watchlist items"
          value={String(items.length)}
        />
        <DashboardStatCard
          description="Optional idea links visible only when your account can access the published idea."
          icon={ListChecks}
          label="Linked ideas"
          value={String(linkedIdeaCount)}
        />
      </div>

      <DashboardSection
        description="Add a ticker to organize related research. Optional idea links require a published idea id that your account can access."
        title="Add watchlist item"
      >
        <CardShell padding="lg" tone="elevated">
          <form action={addWatchlistItemAction} className="grid gap-4">
            <div className="grid gap-4 lg:grid-cols-[0.7fr_1fr]">
              <label className="grid gap-2 text-sm font-medium text-foreground">
                Ticker
                <input
                  className="min-h-11 rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm uppercase text-foreground outline-none transition placeholder:font-sans placeholder:normal-case placeholder:text-muted-foreground focus:border-gold-400 focus:ring-2 focus:ring-gold-400/25"
                  maxLength={20}
                  name="ticker"
                  placeholder="SPY"
                  required
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-foreground">
                Optional linked idea id
                <input
                  className="min-h-11 rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm text-foreground outline-none transition placeholder:font-sans placeholder:text-muted-foreground focus:border-gold-400 focus:ring-2 focus:ring-gold-400/25"
                  name="idea_id"
                  placeholder="Published accessible idea UUID"
                />
              </label>
            </div>
            <label className="grid gap-2 text-sm font-medium text-foreground">
              Note
              <textarea
                className="min-h-24 rounded-lg border border-border bg-background px-3 py-2 text-sm leading-6 text-foreground outline-none transition placeholder:text-muted-foreground focus:border-gold-400 focus:ring-2 focus:ring-gold-400/25"
                maxLength={2000}
                name="note"
                placeholder="Why this ticker is on your research watchlist..."
              />
            </label>
            <div>
              <WatchlistSubmitButton
                label="Add to watchlist"
                pendingLabel="Adding..."
                variant="default"
              />
            </div>
          </form>
        </CardShell>
      </DashboardSection>

      <DashboardSection
        description="Recent idea previews are shown through the same public/member access rules as the main ideas page."
        title="Watchlist items"
      >
        {items.length > 0 ? (
          <div className="grid gap-4">
            {items.map((item) => (
              <CardShell key={item.id} padding="md" tone="elevated">
                <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                  <div className="grid min-w-0 gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        Watchlist ticker
                      </p>
                      <h2 className="mt-2 font-mono text-2xl font-semibold uppercase tracking-[0.12em] text-foreground">
                        {item.ticker}
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        This watchlist does not fetch live prices, send alerts,
                        connect to brokers, or execute orders.
                      </p>
                    </div>

                    {item.linkedIdea ? (
                      <div className="rounded-lg border border-border bg-secondary/25 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          Linked idea
                        </p>
                        <Link
                          className="mt-2 block text-sm font-semibold text-foreground transition hover:text-primary"
                          href={`/ideas/${item.linkedIdea.slug}`}
                        >
                          {item.linkedIdea.title}
                        </Link>
                        <p className="mt-1 font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
                          {item.linkedIdea.ticker}
                        </p>
                      </div>
                    ) : (
                      <p className="rounded-lg border border-border bg-secondary/25 px-4 py-3 text-sm leading-6 text-muted-foreground">
                        No accessible linked idea is attached.
                      </p>
                    )}

                    <form action={updateWatchlistItemAction} className="grid gap-3">
                      <input
                        name="watchlist_item_id"
                        type="hidden"
                        value={item.id}
                      />
                      <label className="grid gap-2 text-sm font-medium text-foreground">
                        Ticker
                        <input
                          className="min-h-11 rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm uppercase text-foreground outline-none transition placeholder:font-sans placeholder:normal-case placeholder:text-muted-foreground focus:border-gold-400 focus:ring-2 focus:ring-gold-400/25"
                          defaultValue={item.ticker}
                          maxLength={20}
                          name="ticker"
                          required
                        />
                      </label>
                      <label className="grid gap-2 text-sm font-medium text-foreground">
                        Optional linked idea id
                        <input
                          className="min-h-11 rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm text-foreground outline-none transition placeholder:font-sans placeholder:text-muted-foreground focus:border-gold-400 focus:ring-2 focus:ring-gold-400/25"
                          defaultValue={item.linkedIdea?.id ?? ""}
                          name="idea_id"
                          placeholder="Published accessible idea UUID"
                        />
                      </label>
                      <label className="grid gap-2 text-sm font-medium text-foreground">
                        Note
                        <textarea
                          className="min-h-24 rounded-lg border border-border bg-background px-3 py-2 text-sm leading-6 text-foreground outline-none transition placeholder:text-muted-foreground focus:border-gold-400 focus:ring-2 focus:ring-gold-400/25"
                          defaultValue={item.note ?? ""}
                          maxLength={2000}
                          name="note"
                          placeholder="Add a private watchlist note..."
                        />
                      </label>
                      <WatchlistSubmitButton
                        icon="edit"
                        label="Update watchlist item"
                        pendingLabel="Updating..."
                      />
                    </form>

                    <form action={removeWatchlistItemAction}>
                      <input
                        name="watchlist_item_id"
                        type="hidden"
                        value={item.id}
                      />
                      <WatchlistSubmitButton
                        icon="remove"
                        label="Remove item"
                        pendingLabel="Removing..."
                        variant="ghost"
                      />
                    </form>
                  </div>

                  <div className="grid content-start gap-3">
                    <h3 className="text-base font-semibold text-foreground">
                      Recent ideas for {item.ticker}
                    </h3>
                    {item.recentIdeas.length > 0 ? (
                      <div className="grid gap-3">
                        {item.recentIdeas.map((idea) => (
                          <div
                            className="rounded-lg border border-border bg-secondary/25 p-4"
                            key={`${item.id}-${idea.id}`}
                          >
                            <div className="flex flex-wrap gap-2">
                              <VisibilityBadge visibility={idea.visibility} />
                              <IdeaStatusBadge status={idea.status} />
                            </div>
                            <Link
                              className="mt-3 block text-sm font-semibold text-foreground transition hover:text-primary"
                              href={`/ideas/${idea.slug}`}
                            >
                              {idea.title}
                            </Link>
                            <p className="mt-2 text-xs leading-5 text-muted-foreground">
                              {idea.is_locked
                                ? "Locked preview only. Full thesis, levels, update bodies, and chart details remain protected."
                                : "Full research available for your account."}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="rounded-lg border border-border bg-secondary/25 px-4 py-3 text-sm leading-6 text-muted-foreground">
                        No recent safe previews match this ticker yet.
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
            description="Your watchlist is empty."
            title="Your watchlist is empty"
          />
        )}
      </DashboardSection>
    </div>
  );
}
