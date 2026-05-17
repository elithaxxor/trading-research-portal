"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";
import { Eye, Pencil, Trash2 } from "lucide-react";

import {
  deleteIdeaAction,
  publishIdeaAction,
  unpublishIdeaAction,
} from "@/app/admin/ideas/actions";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AdminIdeaActionsProps = {
  id: string;
  published: boolean;
  slug: string;
  title: string;
};

export function AdminIdeaActions({
  id,
  published,
  slug,
  title,
}: AdminIdeaActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        className={cn(buttonVariants({ size: "xs", variant: "outline" }))}
        href={`/admin/ideas/${id}/edit`}
      >
        <Pencil data-icon="inline-start" />
        Edit
      </Link>
      <Link
        className={cn(buttonVariants({ size: "xs", variant: "outline" }))}
        href={`/admin/ideas/${id}/updates`}
      >
        <Pencil data-icon="inline-start" />
        Manage Updates
      </Link>
      <Link
        className={cn(buttonVariants({ size: "xs", variant: "outline" }))}
        href={`/admin/ideas/${id}/charts`}
      >
        <Pencil data-icon="inline-start" />
        Manage Charts
      </Link>
      <Link
        className={cn(buttonVariants({ size: "xs", variant: "outline" }))}
        href={`/ideas/${slug}`}
      >
        <Eye data-icon="inline-start" />
        View Public Page
      </Link>
      <form action={published ? unpublishIdeaAction : publishIdeaAction}>
        <input name="id" type="hidden" value={id} />
        <IdeaActionButton
          confirmMessage={
            published
              ? `Unpublish "${title}"? It will no longer be visible on public/member content pages.`
              : `Publish "${title}"? It will become visible according to its access level.`
          }
          label={published ? "Unpublish" : "Publish"}
        />
      </form>
      <form action={deleteIdeaAction}>
        <input name="id" type="hidden" value={id} />
        <IdeaActionButton
          confirmMessage={`Delete "${title}"? This removes the idea and related updates, charts, and tag links. This cannot be undone.`}
          destructive
          label="Delete"
        />
      </form>
    </div>
  );
}

function IdeaActionButton({
  confirmMessage,
  destructive = false,
  label,
}: {
  confirmMessage: string;
  destructive?: boolean;
  label: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      className={cn(
        buttonVariants({
          size: "xs",
          variant: destructive ? "destructive" : "outline",
        })
      )}
      disabled={pending}
      onClick={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
      type="submit"
    >
      {destructive ? <Trash2 data-icon="inline-start" /> : null}
      {pending ? "Working..." : label}
    </button>
  );
}
