import type { Metadata } from "next";
import { Bookmark } from "lucide-react";

import {
  unsaveIdeaAction,
  updateSavedIdeaNoteAction,
} from "@/app/dashboard/member-actions";
import { CardShell } from "@/components/card-shell";
import { IdeaCard } from "@/components/content/idea-card";
import { SaveIdeaSubmitButton } from "@/components/content/save-idea-submit-button";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { DashboardStatCard } from "@/components/dashboard/DashboardStatCard";
import { MemberActionNotice } from "@/components/member-action-notice";
import { getSavedIdeaCards } from "@/lib/member/dashboard";
import { listSavedIdeas } from "@/lib/member/saved-ideas";

export const metadata: Metadata = {
  title: "Saved Ideas",
};

export const dynamic = "force-dynamic";

type SavedIdeasPageProps = {
  searchParams?: Promise<{
    notice?: string | string[];
  }>;
};

export default async function SavedIdeasPage({
  searchParams,
}: SavedIdeasPageProps) {
  const params = await searchParams;
  const [savedIdeas, cards] = await Promise.all([
    listSavedIdeas(),
    getSavedIdeaCards(24),
  ]);
  const savedByIdeaId = new Map(
    savedIdeas.map((savedIdea) => [savedIdea.idea_id, savedIdea])
  );

  return (
    <div className="grid gap-8">
      <DashboardPageHeader
        breadcrumbs={[
          { href: "/dashboard", label: "Dashboard" },
          { label: "Saved Ideas" },
        ]}
        description="Research you marked for later review. Premium and pro cards stay safely locked when your tier cannot access the full idea."
        title="Saved Ideas"
      />

      <MemberActionNotice notice={params?.notice} />

      <DashboardStatCard
        description="Saved idea records belong only to your account and are protected by RLS."
        icon={Bookmark}
        label="Saved"
        value={String(savedIdeas.length)}
      />

      <DashboardSection title="Saved research">
        {cards.length > 0 ? (
          <div className="grid gap-5 xl:grid-cols-3">
            {cards.map((idea) => {
              const savedIdea = savedByIdeaId.get(idea.id);

              return (
                <div className="flex min-w-0 flex-col gap-3" key={idea.id}>
                  <IdeaCard
                    lockedCtaHref={`/ideas/${idea.slug}`}
                    lockedCtaLabel="View saved preview"
                    {...idea}
                  />
                  <CardShell padding="sm" tone="subtle">
                    <div className="grid gap-3">
                      <form
                        action={updateSavedIdeaNoteAction}
                        className="grid gap-3"
                      >
                        <input name="idea_id" type="hidden" value={idea.id} />
                        <input name="slug" type="hidden" value={idea.slug} />
                        <input
                          name="return_to"
                          type="hidden"
                          value="/dashboard/saved"
                        />
                        <label className="grid gap-2 text-sm font-medium text-foreground">
                          Saved note
                          <textarea
                            className="min-h-24 rounded-lg border border-border bg-background px-3 py-2 text-sm leading-6 text-foreground outline-none transition placeholder:text-muted-foreground focus:border-gold-400 focus:ring-2 focus:ring-gold-400/25"
                            defaultValue={savedIdea?.note ?? ""}
                            maxLength={2000}
                            name="note"
                            placeholder="Add a private note..."
                          />
                        </label>
                        <SaveIdeaSubmitButton
                          icon="saved"
                          label="Update note"
                          pendingLabel="Updating..."
                        />
                      </form>

                      <form action={unsaveIdeaAction}>
                        <input name="idea_id" type="hidden" value={idea.id} />
                        <input name="slug" type="hidden" value={idea.slug} />
                        <input
                          name="return_to"
                          type="hidden"
                          value="/dashboard/saved"
                        />
                        <SaveIdeaSubmitButton
                          icon="trash"
                          label="Unsave"
                          pendingLabel="Removing..."
                          variant="ghost"
                        />
                      </form>
                    </div>
                  </CardShell>
                </div>
              );
            })}
          </div>
        ) : (
          <DashboardEmptyState
            actionHref="/ideas"
            actionLabel="Browse ideas"
            description="Save an idea from the research library to keep it close."
            title="No saved ideas yet"
          />
        )}
      </DashboardSection>
    </div>
  );
}
