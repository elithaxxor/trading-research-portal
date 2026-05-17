"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";
import { Eye, Pencil, Trash2 } from "lucide-react";

import {
  deletePostAction,
  publishPostAction,
  unpublishPostAction,
} from "@/app/admin/posts/actions";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AdminPostActionsProps = {
  id: string;
  published: boolean;
  slug: string;
  title: string;
};

export function AdminPostActions({
  id,
  published,
  slug,
  title,
}: AdminPostActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        className={cn(buttonVariants({ size: "xs", variant: "outline" }))}
        href={`/admin/posts/${id}/edit`}
      >
        <Pencil data-icon="inline-start" />
        Edit
      </Link>
      <Link
        className={cn(buttonVariants({ size: "xs", variant: "outline" }))}
        href={`/research/${slug}`}
      >
        <Eye data-icon="inline-start" />
        View Public Page
      </Link>
      <form action={published ? unpublishPostAction : publishPostAction}>
        <input name="id" type="hidden" value={id} />
        <PostActionButton
          confirmMessage={
            published
              ? `Unpublish "${title}"? It will no longer be visible on public/member research pages.`
              : `Publish "${title}"? It will become visible according to its access level.`
          }
          label={published ? "Unpublish" : "Publish"}
        />
      </form>
      <form action={deletePostAction}>
        <input name="id" type="hidden" value={id} />
        <PostActionButton
          confirmMessage={`Delete "${title}"? This removes the research post and cannot be undone.`}
          destructive
          label="Delete"
        />
      </form>
    </div>
  );
}

function PostActionButton({
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
