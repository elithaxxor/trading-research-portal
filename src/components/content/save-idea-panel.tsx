import Link from "next/link";
import { Bookmark, LockKeyhole } from "lucide-react";

import {
  saveIdeaAction,
  unsaveIdeaAction,
  updateSavedIdeaNoteAction,
} from "@/app/dashboard/member-actions";
import { CardShell } from "@/components/card-shell";
import { SaveIdeaSubmitButton } from "@/components/content/save-idea-submit-button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SaveIdeaPanelProps = {
  ideaId: string;
  isAuthenticated: boolean;
  isLocked?: boolean;
  isSaved: boolean;
  savedNote?: string | null;
  slug: string;
  title?: string;
};

export function SaveIdeaPanel({
  ideaId,
  isAuthenticated,
  isLocked = false,
  isSaved,
  savedNote,
  slug,
  title = "Save this idea",
}: SaveIdeaPanelProps) {
  if (!isAuthenticated) {
    return (
      <CardShell padding="md" tone="subtle">
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-background text-gold-300">
              <Bookmark aria-hidden="true" className="size-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Sign in to save
              </h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Keep this idea in your member dashboard without changing its
                access rules.
              </p>
            </div>
          </div>
          <Link
            className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
            href={`/login?redirectedFrom=${encodeURIComponent(`/ideas/${slug}`)}`}
          >
            Sign in to save
          </Link>
        </div>
      </CardShell>
    );
  }

  return (
    <CardShell padding="md" tone={isSaved ? "elevated" : "subtle"}>
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-background text-gold-300">
            {isLocked ? (
              <LockKeyhole aria-hidden="true" className="size-4" />
            ) : (
              <Bookmark aria-hidden="true" className="size-4" />
            )}
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">
              {isSaved ? "Saved to dashboard" : title}
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {isLocked
                ? "Saving this locked preview does not reveal full thesis, levels, updates, or chart details."
                : "Save this research for quick access from your dashboard."}
            </p>
          </div>
        </div>

        {isSaved ? (
          <form action={updateSavedIdeaNoteAction} className="grid gap-3">
            <input name="idea_id" type="hidden" value={ideaId} />
            <input name="slug" type="hidden" value={slug} />
            <label className="grid gap-2 text-sm font-medium text-foreground">
              Saved note
              <textarea
                className="min-h-24 rounded-lg border border-border bg-background px-3 py-2 text-sm leading-6 text-foreground outline-none transition placeholder:text-muted-foreground focus:border-gold-400 focus:ring-2 focus:ring-gold-400/25"
                defaultValue={savedNote ?? ""}
                maxLength={2000}
                name="note"
                placeholder="Add a private dashboard note..."
              />
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <SaveIdeaSubmitButton
                icon="saved"
                label="Update note"
                pendingLabel="Updating..."
              />
            </div>
          </form>
        ) : (
          <form action={saveIdeaAction} className="grid gap-3">
            <input name="idea_id" type="hidden" value={ideaId} />
            <input name="slug" type="hidden" value={slug} />
            <label className="grid gap-2 text-sm font-medium text-foreground">
              Optional note
              <textarea
                className="min-h-20 rounded-lg border border-border bg-background px-3 py-2 text-sm leading-6 text-foreground outline-none transition placeholder:text-muted-foreground focus:border-gold-400 focus:ring-2 focus:ring-gold-400/25"
                maxLength={2000}
                name="note"
                placeholder="Add a private dashboard note..."
              />
            </label>
            <SaveIdeaSubmitButton label="Save idea" pendingLabel="Saving..." />
          </form>
        )}

        {isSaved ? (
          <form action={unsaveIdeaAction}>
            <input name="idea_id" type="hidden" value={ideaId} />
            <input name="slug" type="hidden" value={slug} />
            <SaveIdeaSubmitButton
              icon="trash"
              label="Unsave"
              pendingLabel="Removing..."
              variant="ghost"
            />
          </form>
        ) : null}
      </div>
    </CardShell>
  );
}
