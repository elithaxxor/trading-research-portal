"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";
import { Eye, Pencil, Trash2 } from "lucide-react";

import {
  deleteSoftwareProductAction,
  publishSoftwareProductAction,
  unpublishSoftwareProductAction,
} from "@/app/admin/software/actions";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AdminSoftwareActionsProps = {
  id: string;
  published: boolean;
  slug: string;
  title: string;
};

export function AdminSoftwareActions({
  id,
  published,
  slug,
  title,
}: AdminSoftwareActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        className={cn(buttonVariants({ size: "xs", variant: "outline" }))}
        href={`/admin/software/${id}/edit`}
      >
        <Pencil data-icon="inline-start" />
        Edit
      </Link>
      <Link
        className={cn(buttonVariants({ size: "xs", variant: "outline" }))}
        href={`/dashboard/software/${slug}`}
      >
        <Eye data-icon="inline-start" />
        View Member Page
      </Link>
      <form
        action={
          published ? unpublishSoftwareProductAction : publishSoftwareProductAction
        }
      >
        <input name="id" type="hidden" value={id} />
        <SoftwareActionButton
          confirmMessage={
            published
              ? `Unpublish "${title}"? It will no longer appear in the member software library.`
              : `Publish "${title}"? It will become visible to eligible members.`
          }
          label={published ? "Unpublish" : "Publish"}
        />
      </form>
      <form action={deleteSoftwareProductAction}>
        <input name="id" type="hidden" value={id} />
        <SoftwareActionButton
          confirmMessage={`Delete "${title}"? This removes the software product and related access requests.`}
          destructive
          label="Delete"
        />
      </form>
    </div>
  );
}

function SoftwareActionButton({
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
