import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

import {
  followTickerAction,
  unfollowTickerAction,
  updateFollowedTickerNoteAction,
} from "@/app/dashboard/member-actions";
import { CardShell } from "@/components/card-shell";
import { FollowTickerSubmitButton } from "@/components/content/follow-ticker-submit-button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FollowTickerPanelProps = {
  isAuthenticated: boolean;
  isFollowed: boolean;
  note?: string | null;
  slug: string;
  ticker: string;
};

export function FollowTickerPanel({
  isAuthenticated,
  isFollowed,
  note,
  slug,
  ticker,
}: FollowTickerPanelProps) {
  if (!isAuthenticated) {
    return (
      <CardShell padding="md" tone="subtle">
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-background text-gold-300">
              <Eye aria-hidden="true" className="size-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Sign in to follow ticker
              </h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Follow {ticker} to pull related research into your dashboard.
                No alerts or live price feeds are created.
              </p>
            </div>
          </div>
          <Link
            className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
            href={`/login?redirectedFrom=${encodeURIComponent(`/ideas/${slug}`)}`}
          >
            Sign in to follow
          </Link>
        </div>
      </CardShell>
    );
  }

  return (
    <CardShell padding="md" tone={isFollowed ? "elevated" : "subtle"}>
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-background text-gold-300">
            {isFollowed ? (
              <EyeOff aria-hidden="true" className="size-4" />
            ) : (
              <Eye aria-hidden="true" className="size-4" />
            )}
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">
              {isFollowed ? `Following ${ticker}` : `Follow ${ticker}`}
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              This is a content-following feature only. It does not create price
              alerts, live market data feeds, or broker actions.
            </p>
          </div>
        </div>

        {isFollowed ? (
          <form action={updateFollowedTickerNoteAction} className="grid gap-3">
            <input name="ticker" type="hidden" value={ticker} />
            <input name="slug" type="hidden" value={slug} />
            <label className="grid gap-2 text-sm font-medium text-foreground">
              Ticker note
              <textarea
                className="min-h-24 rounded-lg border border-border bg-background px-3 py-2 text-sm leading-6 text-foreground outline-none transition placeholder:text-muted-foreground focus:border-gold-400 focus:ring-2 focus:ring-gold-400/25"
                defaultValue={note ?? ""}
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
        ) : (
          <form action={followTickerAction} className="grid gap-3">
            <input name="ticker" type="hidden" value={ticker} />
            <input name="slug" type="hidden" value={slug} />
            <label className="grid gap-2 text-sm font-medium text-foreground">
              Optional note
              <textarea
                className="min-h-20 rounded-lg border border-border bg-background px-3 py-2 text-sm leading-6 text-foreground outline-none transition placeholder:text-muted-foreground focus:border-gold-400 focus:ring-2 focus:ring-gold-400/25"
                maxLength={2000}
                name="note"
                placeholder="Add a private ticker note..."
              />
            </label>
            <FollowTickerSubmitButton
              label={`Follow ${ticker}`}
              pendingLabel="Following..."
            />
          </form>
        )}

        {isFollowed ? (
          <form action={unfollowTickerAction}>
            <input name="ticker" type="hidden" value={ticker} />
            <input name="slug" type="hidden" value={slug} />
            <FollowTickerSubmitButton
              icon="unfollow"
              label="Unfollow ticker"
              pendingLabel="Removing..."
              variant="ghost"
            />
          </form>
        ) : null}
      </div>
    </CardShell>
  );
}
