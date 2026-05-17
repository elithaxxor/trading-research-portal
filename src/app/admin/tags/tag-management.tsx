"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Save, Trash2 } from "lucide-react";

import { AuthNotice } from "@/components/auth-notice";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminFormSection } from "@/components/admin/forms/AdminFormSection";
import { AdminTextInput } from "@/components/admin/forms/AdminTextInput";
import { SlugFieldHelper } from "@/components/admin/forms/SlugFieldHelper";
import { Badge } from "@/components/badge";
import { CardShell } from "@/components/card-shell";
import { buttonVariants } from "@/components/ui/button";
import type { AdminTagWithUsage } from "@/lib/admin/types";
import { cn } from "@/lib/utils";

import {
  createTagAction,
  deleteTagAction,
  initialTagActionState,
  updateTagAction,
} from "./actions";

type TagManagementProps = {
  tags: AdminTagWithUsage[];
};

export function TagManagement({ tags }: TagManagementProps) {
  return (
    <div className="grid gap-6">
      <CreateTagForm />

      {tags.length > 0 ? (
        <div className="grid gap-4">
          {tags.map((tag) => (
            <TagRow key={tag.id} tag={tag} />
          ))}
        </div>
      ) : (
        <AdminEmptyState
          description="Create tags for market themes, strategy types, education topics, sectors, or other taxonomy you want to assign to ideas."
          title="No tags yet"
        />
      )}
    </div>
  );
}

function CreateTagForm() {
  const [name, setName] = useState("");
  const [state, formAction] = useActionState(
    createTagAction,
    initialTagActionState
  );

  function fieldError(fieldName: string) {
    return state.fieldErrors?.[fieldName];
  }

  return (
    <form action={formAction} className="grid gap-4">
      {state.status === "error" && state.message ? (
        <AuthNotice message={state.message} tone="error" />
      ) : null}
      {state.status === "idle" && state.message ? (
        <AuthNotice message={state.message} tone="success" />
      ) : null}

      <AdminFormSection
        description="Create reusable tags for organizing ideas by market theme, education topic, strategy type, or sector."
        title="Create tag"
      >
        <div className="grid gap-5 lg:grid-cols-2">
          <AdminTextInput
            error={fieldError("name")}
            id="new-tag-name"
            label="Name"
            maxLength={80}
            name="name"
            onChange={(event) => setName(event.currentTarget.value)}
            placeholder="Risk Management"
            required
          />
          <AdminTextInput
            description="Leave blank to generate from the name."
            error={fieldError("slug")}
            id="new-tag-slug"
            label="Slug"
            maxLength={100}
            name="slug"
            placeholder="risk-management"
          />
        </div>

        <SlugFieldHelper title={name} />

        <div className="flex justify-end">
          <TagSubmitButton label="Create Tag" />
        </div>
      </AdminFormSection>
    </form>
  );
}

function TagRow({ tag }: { tag: AdminTagWithUsage }) {
  const [name, setName] = useState(tag.name);
  const [updateState, updateFormAction] = useActionState(
    updateTagAction,
    initialTagActionState
  );
  const [deleteState, deleteFormAction] = useActionState(
    deleteTagAction,
    initialTagActionState
  );

  function updateFieldError(fieldName: string) {
    return updateState.fieldErrors?.[fieldName];
  }

  return (
    <CardShell padding="lg" tone="elevated">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_auto]">
        <form action={updateFormAction} className="grid gap-4">
          <input name="id" type="hidden" value={tag.id} />

          {updateState.status === "error" && updateState.message ? (
            <AuthNotice message={updateState.message} tone="error" />
          ) : null}
          {updateState.status === "idle" && updateState.message ? (
            <AuthNotice message={updateState.message} tone="success" />
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="muted">/{tag.slug}</Badge>
            <Badge tone={tag.ideaCount > 0 ? "gold" : "muted"}>
              {tag.ideaCount} assigned idea{tag.ideaCount === 1 ? "" : "s"}
            </Badge>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <AdminTextInput
              defaultValue={tag.name}
              error={updateFieldError("name")}
              id={`tag-${tag.id}-name`}
              label="Name"
              maxLength={80}
              name="name"
              onChange={(event) => setName(event.currentTarget.value)}
              required
            />
            <AdminTextInput
              defaultValue={tag.slug}
              error={updateFieldError("slug")}
              id={`tag-${tag.id}-slug`}
              label="Slug"
              maxLength={100}
              name="slug"
              required
            />
          </div>

          <SlugFieldHelper currentSlug={tag.slug} title={name} />

          <div className="flex justify-end">
            <TagSubmitButton icon="save" label="Save Tag" />
          </div>
        </form>

        <form action={deleteFormAction} className="xl:min-w-56">
          <input name="id" type="hidden" value={tag.id} />

          {deleteState.status === "error" && deleteState.message ? (
            <AuthNotice className="mb-3" message={deleteState.message} tone="error" />
          ) : null}
          {deleteState.status === "idle" && deleteState.message ? (
            <AuthNotice
              className="mb-3"
              message={deleteState.message}
              tone="success"
            />
          ) : null}

          <DeleteTagButton disabledByUsage={tag.ideaCount > 0} tagName={tag.name} />
        </form>
      </div>
    </CardShell>
  );
}

function TagSubmitButton({
  icon,
  label,
}: {
  icon?: "save";
  label: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      className={cn(buttonVariants({ size: "lg", variant: "default" }))}
      disabled={pending}
      type="submit"
    >
      {icon === "save" ? <Save data-icon="inline-start" /> : null}
      {pending ? "Saving..." : label}
    </button>
  );
}

function DeleteTagButton({
  disabledByUsage,
  tagName,
}: {
  disabledByUsage: boolean;
  tagName: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      className={cn(
        buttonVariants({ size: "lg", variant: "destructive" }),
        "w-full"
      )}
      disabled={pending || disabledByUsage}
      onClick={(event) => {
        if (
          !window.confirm(
            `Delete "${tagName}"? This can only proceed when the tag is not assigned to any ideas.`
          )
        ) {
          event.preventDefault();
        }
      }}
      title={
        disabledByUsage
          ? "Remove this tag from assigned ideas before deleting it."
          : undefined
      }
      type="submit"
    >
      <Trash2 data-icon="inline-start" />
      {pending ? "Deleting..." : "Delete Tag"}
    </button>
  );
}
