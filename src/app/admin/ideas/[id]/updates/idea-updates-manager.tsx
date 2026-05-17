"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Trash2 } from "lucide-react";

import { AuthNotice } from "@/components/auth-notice";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminFormSection } from "@/components/admin/forms/AdminFormSection";
import { AdminSelect } from "@/components/admin/forms/AdminSelect";
import { AdminTextInput } from "@/components/admin/forms/AdminTextInput";
import { AdminTextarea } from "@/components/admin/forms/AdminTextarea";
import { Badge } from "@/components/badge";
import { CardShell } from "@/components/card-shell";
import { buttonVariants } from "@/components/ui/button";
import type { AdminIdea, AdminIdeaUpdateRecord } from "@/lib/admin/types";
import { ideaStatusValues } from "@/lib/admin/validation";
import { formatDate, formatIdeaStatus } from "@/lib/content/format";
import { cn } from "@/lib/utils";

import {
  createIdeaUpdateAction,
  deleteIdeaUpdateAction,
  initialIdeaUpdateActionState,
  updateIdeaUpdateAction,
} from "./actions";

type IdeaUpdatesManagerProps = {
  idea: AdminIdea;
  updates: AdminIdeaUpdateRecord[];
};

export function IdeaUpdatesManager({
  idea,
  updates,
}: IdeaUpdatesManagerProps) {
  const [state, formAction] = useActionState(
    createIdeaUpdateAction,
    initialIdeaUpdateActionState
  );

  function fieldError(name: string) {
    return state.fieldErrors?.[name];
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <AdminFormSection
        description="Create timestamped update-log entries. Email alerts are not active yet and will come in a later phase."
        title="Create update"
      >
        <form action={formAction} className="flex flex-col gap-5">
          <input name="idea_id" type="hidden" value={idea.id} />

          {state.status === "error" && state.message ? (
            <AuthNotice message={state.message} tone="error" />
          ) : null}
          {state.status === "idle" && state.message ? (
            <AuthNotice message={state.message} tone="success" />
          ) : null}

          <AdminTextInput
            error={fieldError("title")}
            id="new-update-title"
            label="Update title"
            name="title"
            placeholder="Status check"
            required
          />
          <AdminTextarea
            error={fieldError("body")}
            id="new-update-body"
            label="Update body"
            name="body"
            placeholder="Describe what changed, what remains valid, and what should be reviewed."
          />
          <StatusSelect
            error={fieldError("status_after_update")}
            id="new-update-status"
            label="Status after update"
            name="status_after_update"
          />
          <CreateUpdateButton />
        </form>
      </AdminFormSection>

      <CardShell padding="lg" tone="elevated">
        <div className="flex flex-col gap-5">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">
              Update timeline
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Full update bodies are shown here for admins. Public idea pages
              only show bodies when RLS allows access to the full idea.
            </p>
          </div>

          {updates.length > 0 ? (
            <div className="flex flex-col gap-4">
              {updates.map((update) => (
                <UpdateEditor
                  idea={idea}
                  key={update.id}
                  update={update}
                />
              ))}
            </div>
          ) : (
            <AdminEmptyState
              description="No update log entries have been added for this idea yet. Add one when the thesis, status, or review context changes."
              framed={false}
              title="No updates yet"
            />
          )}
        </div>
      </CardShell>
    </div>
  );
}

function UpdateEditor({
  idea,
  update,
}: {
  idea: AdminIdea;
  update: AdminIdeaUpdateRecord;
}) {
  const [updateState, updateFormAction] = useActionState(
    updateIdeaUpdateAction,
    initialIdeaUpdateActionState
  );
  const [deleteState, deleteFormAction] = useActionState(
    deleteIdeaUpdateAction,
    initialIdeaUpdateActionState
  );

  function fieldError(name: string) {
    return updateState.fieldErrors?.[name];
  }

  return (
    <CardShell padding="md" tone="subtle">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {update.status_after_update ? (
              <Badge tone="muted">
                {formatIdeaStatus(update.status_after_update)}
              </Badge>
            ) : (
              <Badge tone="default">No status change</Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {formatDate(update.created_at)}
            </span>
          </div>
          <form action={deleteFormAction}>
            <input name="idea_id" type="hidden" value={idea.id} />
            <input name="update_id" type="hidden" value={update.id} />
            <DeleteUpdateButton title={update.title} />
          </form>
        </div>

        {deleteState.status === "error" && deleteState.message ? (
          <AuthNotice message={deleteState.message} tone="error" />
        ) : null}
        {deleteState.status === "idle" && deleteState.message ? (
          <AuthNotice message={deleteState.message} tone="success" />
        ) : null}

        <form action={updateFormAction} className="flex flex-col gap-4">
          <input name="idea_id" type="hidden" value={idea.id} />
          <input name="update_id" type="hidden" value={update.id} />
          {updateState.status === "error" && updateState.message ? (
            <AuthNotice message={updateState.message} tone="error" />
          ) : null}
          {updateState.status === "idle" && updateState.message ? (
            <AuthNotice message={updateState.message} tone="success" />
          ) : null}
          <AdminTextInput
            defaultValue={update.title}
            error={fieldError("title")}
            id={`update-title-${update.id}`}
            label="Title"
            name="title"
            required
          />
          <AdminTextarea
            defaultValue={update.body ?? ""}
            id={`update-body-${update.id}`}
            label="Body"
            name="body"
          />
          <StatusSelect
            defaultValue={update.status_after_update ?? ""}
            error={fieldError("status_after_update")}
            id={`update-status-${update.id}`}
            label="Status after update"
            name="status_after_update"
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Link
              className={cn(
                buttonVariants({ size: "sm", variant: "outline" })
              )}
              href={`/ideas/${idea.slug}`}
            >
              View Public Page
            </Link>
            <SaveUpdateButton />
          </div>
        </form>
      </div>
    </CardShell>
  );
}

function StatusSelect({
  defaultValue = "",
  error,
  id,
  label,
  name,
}: {
  defaultValue?: string;
  error?: string;
  id: string;
  label: string;
  name: string;
}) {
  return (
    <AdminSelect
      defaultValue={defaultValue}
      error={error}
      id={id}
      label={label}
      name={name}
      placeholder="No status change"
    >
      {ideaStatusValues.map((status) => (
        <option key={status} value={status}>
          {formatIdeaStatus(status)}
        </option>
      ))}
    </AdminSelect>
  );
}

function CreateUpdateButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className={cn(buttonVariants({ size: "lg", variant: "default" }))}
      disabled={pending}
      type="submit"
    >
      {pending ? "Adding update..." : "Add Update"}
    </button>
  );
}

function SaveUpdateButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className={cn(buttonVariants({ size: "sm", variant: "default" }))}
      disabled={pending}
      type="submit"
    >
      {pending ? "Saving..." : "Save Update"}
    </button>
  );
}

function DeleteUpdateButton({ title }: { title: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      className={cn(buttonVariants({ size: "xs", variant: "destructive" }))}
      disabled={pending}
      onClick={(event) => {
        if (
          !window.confirm(
            `Delete update "${title}"? This removes the update log entry and cannot be undone.`
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
