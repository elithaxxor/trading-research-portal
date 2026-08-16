"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Trash2 } from "lucide-react";

import { AuthNotice } from "@/components/auth-notice";
import { AdminCheckbox } from "@/components/admin/forms/AdminCheckbox";
import { AdminFormSection } from "@/components/admin/forms/AdminFormSection";
import { AdminTextInput } from "@/components/admin/forms/AdminTextInput";
import { AdminTextarea } from "@/components/admin/forms/AdminTextarea";
import { SlugFieldHelper } from "@/components/admin/forms/SlugFieldHelper";
import { VisibilitySelect } from "@/components/admin/forms/VisibilitySelect";
import { CardShell } from "@/components/card-shell";
import { buttonVariants } from "@/components/ui/button";
import type { AdminPost } from "@/lib/admin/types";
import { cn } from "@/lib/utils";

import {
  createResearchPostAction,
  deleteResearchPostAction,
  publishResearchPostAction,
  unpublishResearchPostAction,
  updateResearchPostAction,
} from "./actions";
import type { ResearchPostActionState } from "./actions";

const initialResearchPostActionState: ResearchPostActionState = {
  status: "idle",
};

type ResearchPostFormProps =
  | {
      mode: "create";
      post?: never;
    }
  | {
      mode: "edit";
      post: AdminPost;
    };

function toDateTimeLocalValue(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 16);
}

export function ResearchPostForm({ mode, post }: ResearchPostFormProps) {
  const [title, setTitle] = useState(post?.title ?? "");
  const [state, formAction] = useActionState(
    mode === "create" ? createResearchPostAction : updateResearchPostAction,
    initialResearchPostActionState
  );

  function fieldError(name: string) {
    return state.fieldErrors?.[name];
  }

  return (
    <div className="flex flex-col gap-6">
      <form action={formAction} className="flex flex-col gap-6">
        {post ? (
          <>
            <input name="id" type="hidden" value={post.id} />
            <input
              name="current_published"
              type="hidden"
              value={String(post.published)}
            />
          </>
        ) : null}

        {state.status === "error" && state.message ? (
          <AuthNotice message={state.message} tone="error" />
        ) : null}
        {state.status === "idle" && state.message ? (
          <AuthNotice message={state.message} tone="success" />
        ) : null}

        <AdminFormSection
          description="Create plain-text research posts with controlled access visibility and safe preview excerpts."
          title="Post details"
        >
          <div className="grid gap-5 lg:grid-cols-2">
            <AdminTextInput
              defaultValue={post?.title ?? ""}
              error={fieldError("title")}
              id="title"
              label="Title"
              name="title"
              onChange={(event) => setTitle(event.currentTarget.value)}
              placeholder="Weekly Market Outlook"
              required
            />
            <AdminTextInput
              defaultValue={post?.slug ?? ""}
              description="Leave blank on create to generate from the title."
              error={fieldError("slug")}
              id="slug"
              label="Slug"
              name="slug"
              placeholder="weekly-market-outlook"
              required={mode === "edit"}
            />
          </div>

          <SlugFieldHelper currentSlug={post?.slug} title={title} />

          <VisibilitySelect
            defaultValue={post?.visibility ?? "free"}
            error={fieldError("visibility")}
            name="visibility"
            required
          />
        </AdminFormSection>

        <AdminFormSection
          description="For premium/pro posts, the excerpt must be a safe public preview and must not reveal the full body."
          title="Excerpt and body"
        >
          <AdminTextarea
            defaultValue={post?.excerpt ?? ""}
            description="Required for premium/pro posts. Keep locked-content excerpts concise and safe."
            error={fieldError("excerpt")}
            id="excerpt"
            label="Excerpt"
            name="excerpt"
            placeholder="A concise public-safe summary of the research note."
          />
          <AdminTextarea
            className="min-h-64"
            defaultValue={post?.body ?? ""}
            description="Plain text only for now. Markdown rendering and rich formatting can be added later."
            id="body"
            label="Body"
            name="body"
            placeholder="Write the research note in plain text."
          />
        </AdminFormSection>

        <AdminFormSection
          description="Publishing makes the post visible according to its access level. This form does not send research-post email alerts directly."
          title="Publishing"
        >
          <AdminCheckbox
            defaultChecked={post?.published ?? false}
            description="You can also use the Publish button below to publish immediately."
            id="published"
            label="Published"
            name="published"
          />
          <AdminTextInput
            defaultValue={toDateTimeLocalValue(post?.published_at)}
            description="Optional. If publishing with no date, the current time is used."
            error={fieldError("published_at")}
            id="published_at"
            label="Published at"
            name="published_at"
            type="datetime-local"
          />
        </AdminFormSection>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Link
            className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
            href="/admin/posts"
          >
            Back to Posts
          </Link>
          {mode === "create" ? (
            <>
              <ResearchPostSubmitButton intent="draft" label="Save Draft" />
              <ResearchPostSubmitButton intent="publish" label="Publish" />
            </>
          ) : (
            <ResearchPostSubmitButton intent="save" label="Save Changes" />
          )}
        </div>
      </form>

      {post ? <ResearchPostManagement post={post} /> : null}
    </div>
  );
}

function ResearchPostSubmitButton({
  intent,
  label,
}: {
  intent: "draft" | "publish" | "save";
  label: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      className={cn(
        buttonVariants({
          size: "lg",
          variant: intent === "publish" ? "default" : "outline",
        })
      )}
      disabled={pending}
      name="intent"
      type="submit"
      value={intent}
    >
      {pending ? "Saving..." : label}
    </button>
  );
}

function ResearchPostManagement({ post }: { post: AdminPost }) {
  return (
    <CardShell padding="lg" tone="subtle">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">
            Publishing and removal
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Unpublishing clears the publish timestamp and returns the post to a
            clean draft state. Email alerts are not sent yet.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <form
            action={
              post.published
                ? unpublishResearchPostAction
                : publishResearchPostAction
            }
          >
            <input name="id" type="hidden" value={post.id} />
            <PublishToggleButton published={post.published} title={post.title} />
          </form>
          <form action={deleteResearchPostAction}>
            <input name="id" type="hidden" value={post.id} />
            <DeleteButton title={post.title} />
          </form>
        </div>
      </div>
    </CardShell>
  );
}

function PublishToggleButton({
  published,
  title,
}: {
  published: boolean;
  title: string;
}) {
  const { pending } = useFormStatus();
  const label = published ? "Unpublish" : "Publish";

  return (
    <button
      className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
      disabled={pending}
      onClick={(event) => {
        const message = published
          ? `Unpublish "${title}"? It will no longer appear on research pages.`
          : `Publish "${title}"? It will become visible according to its access level.`;

        if (!window.confirm(message)) {
          event.preventDefault();
        }
      }}
      type="submit"
    >
      {pending ? "Working..." : label}
    </button>
  );
}

function DeleteButton({ title }: { title: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      className={cn(buttonVariants({ size: "lg", variant: "destructive" }))}
      disabled={pending}
      onClick={(event) => {
        if (
          !window.confirm(
            `Delete "${title}"? This removes the research post and cannot be undone.`
          )
        ) {
          event.preventDefault();
        }
      }}
      type="submit"
    >
      <Trash2 data-icon="inline-start" />
      {pending ? "Deleting..." : "Delete"}
    </button>
  );
}
