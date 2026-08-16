"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Tags } from "lucide-react";

import { AuthNotice } from "@/components/auth-notice";
import { AdminFormSection } from "@/components/admin/forms/AdminFormSection";
import { buttonVariants } from "@/components/ui/button";
import type { AdminTag } from "@/lib/admin/types";
import { cn } from "@/lib/utils";

import { setIdeaTagsAction } from "@/app/admin/tags/actions";
import type { TagActionState } from "@/app/admin/tags/actions";

const initialTagActionState: TagActionState = {
  status: "idle",
};

type IdeaTagSelectorProps = {
  ideaId: string;
  selectedTagIds: string[];
  tags: AdminTag[];
};

export function IdeaTagSelector({
  ideaId,
  selectedTagIds,
  tags,
}: IdeaTagSelectorProps) {
  const [state, formAction] = useActionState(
    setIdeaTagsAction,
    initialTagActionState
  );
  const selectedTagIdSet = new Set(selectedTagIds);

  return (
    <form action={formAction}>
      <input name="idea_id" type="hidden" value={ideaId} />

      <AdminFormSection
        description="Assign tags for internal organization and future content discovery. Tags do not change access permissions."
        title="Tags"
      >
        {state.status === "error" && state.message ? (
          <AuthNotice message={state.message} tone="error" />
        ) : null}
        {state.status === "idle" && state.message ? (
          <AuthNotice message={state.message} tone="success" />
        ) : null}

        {tags.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {tags.map((tag) => (
              <label
                className="flex items-start gap-3 rounded-lg border border-border bg-background/60 p-4 text-sm transition-colors hover:border-primary/40"
                htmlFor={`idea-tag-${tag.id}`}
                key={tag.id}
              >
                <input
                  className="mt-1 size-4 rounded border border-input bg-background text-primary accent-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
                  defaultChecked={selectedTagIdSet.has(tag.id)}
                  id={`idea-tag-${tag.id}`}
                  name="tag_ids"
                  type="checkbox"
                  value={tag.id}
                />
                <span className="grid gap-1">
                  <span className="font-medium text-foreground">
                    {tag.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    /{tag.slug}
                  </span>
                </span>
              </label>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-background/50 p-5">
            <p className="text-sm leading-6 text-muted-foreground">
              No tags exist yet. Create tags before assigning them to ideas.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Link
            className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
            href="/admin/tags"
          >
            Manage Tags
          </Link>
          <SaveTagsButton disabled={tags.length === 0} />
        </div>
      </AdminFormSection>
    </form>
  );
}

function SaveTagsButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      className={cn(buttonVariants({ size: "lg", variant: "default" }))}
      disabled={pending || disabled}
      type="submit"
    >
      <Tags data-icon="inline-start" />
      {pending ? "Saving..." : "Save Tags"}
    </button>
  );
}
