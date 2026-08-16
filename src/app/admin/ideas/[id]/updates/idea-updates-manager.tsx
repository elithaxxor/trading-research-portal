"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Trash2 } from "lucide-react";

import { AuthNotice } from "@/components/auth-notice";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminCheckbox } from "@/components/admin/forms/AdminCheckbox";
import { AdminFormSection } from "@/components/admin/forms/AdminFormSection";
import { AdminSelect } from "@/components/admin/forms/AdminSelect";
import { AdminTextInput } from "@/components/admin/forms/AdminTextInput";
import { AdminTextarea } from "@/components/admin/forms/AdminTextarea";
import { Badge } from "@/components/badge";
import { CardShell } from "@/components/card-shell";
import { buttonVariants } from "@/components/ui/button";
import type { AdminIdea, AdminIdeaUpdateRecord } from "@/lib/admin/types";
import { ideaStatusValues } from "@/lib/admin/validation";
import { formatDate } from "@/lib/content/format";
import {
  allowedIdeaOutcomes,
  allowedLifecycleEventTypes,
} from "@/lib/lifecycle/constants";
import {
  formatIdeaOutcome,
  formatIdeaStatus,
  formatLifecycleDate,
  formatLifecycleEventType,
} from "@/lib/lifecycle/format";
import { cn } from "@/lib/utils";

import {
  createIdeaUpdateAction,
  deleteIdeaUpdateAction,
  updateIdeaUpdateAction,
} from "./actions";
import type { IdeaUpdateActionState } from "./actions";

const initialIdeaUpdateActionState: IdeaUpdateActionState = {
  status: "idle",
};

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
        description="Create timestamped update-log entries. Optional email notifications use safe preview copy and protected portal links."
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
          <EventTypeSelect
            defaultValue="note"
            error={fieldError("event_type")}
            id="new-update-event-type"
            label="Event type"
            name="event_type"
          />
          <AdminTextInput
            error={fieldError("event_at")}
            id="new-update-event-at"
            label="Event at"
            name="event_at"
            type="datetime-local"
          />
          <StatusSelect
            error={fieldError("status_after_update")}
            id="new-update-status"
            label="Status after update"
            name="status_after_update"
          />
          <OutcomeSelect
            error={fieldError("outcome_after")}
            id="new-update-outcome"
            label="Outcome after update"
            name="outcome_after"
          />
          <AdminCheckbox
            error={fieldError("is_major")}
            id="new-update-major"
            label="Major update"
            name="is_major"
          />
          <AdminCheckbox
            description="Queues a safe email for opted-in members who can access this idea. The full update body stays in the protected portal."
            id="new-update-notify-email"
            label="Notify eligible members by email"
            name="notify_email"
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
            <Badge tone={update.is_major ? "gold" : "muted"}>
              {update.is_major ? "Major" : "Standard"}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Event: {formatLifecycleDate(update.event_at)}
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
          <input
            name="status_before"
            type="hidden"
            value={update.status_before ?? idea.status}
          />
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
          <div className="grid gap-4 md:grid-cols-2">
            <EventTypeSelect
              defaultValue={update.event_type}
              error={fieldError("event_type")}
              id={`update-event-type-${update.id}`}
              label="Event type"
              name="event_type"
            />
            <AdminTextInput
              defaultValue={toDateTimeLocalValue(update.event_at)}
              error={fieldError("event_at")}
              id={`update-event-at-${update.id}`}
              label="Event at"
              name="event_at"
              type="datetime-local"
            />
          </div>
          <StatusSelect
            defaultValue={update.status_after_update ?? ""}
            error={fieldError("status_after_update")}
            id={`update-status-${update.id}`}
            label="Status after update"
            name="status_after_update"
          />
          <OutcomeSelect
            defaultValue={update.outcome_after ?? ""}
            error={fieldError("outcome_after")}
            id={`update-outcome-${update.id}`}
            label="Outcome after update"
            name="outcome_after"
          />
          <AdminCheckbox
            defaultChecked={update.is_major}
            error={fieldError("is_major")}
            id={`update-major-${update.id}`}
            label="Major update"
            name="is_major"
          />
          <AdminCheckbox
            description="Queues a safe email for opted-in members who can access this idea. Default off to avoid duplicate announcements."
            id={`update-notify-email-${update.id}`}
            label="Notify eligible members by email"
            name="notify_email"
          />
          <dl className="grid gap-3 rounded-lg border border-border bg-background/50 p-3 text-sm md:grid-cols-2">
            <TimelineMeta
              label="Event type"
              value={formatLifecycleEventType(update.event_type)}
            />
            <TimelineMeta
              label="Status before"
              value={
                update.status_before
                  ? formatIdeaStatus(update.status_before)
                  : "Not recorded"
              }
            />
            <TimelineMeta
              label="Status after"
              value={
                update.status_after_update
                  ? formatIdeaStatus(update.status_after_update)
                  : "No status change"
              }
            />
            <TimelineMeta
              label="Outcome after"
              value={
                update.outcome_after
                  ? formatIdeaOutcome(update.outcome_after)
                  : "No outcome change"
              }
            />
            <TimelineMeta
              label="Created"
              value={formatDate(update.created_at)}
            />
            <TimelineMeta
              label="Major"
              value={update.is_major ? "Yes" : "No"}
            />
          </dl>
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

function toDateTimeLocalValue(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 16);
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

function EventTypeSelect({
  defaultValue = "note",
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
    >
      {allowedLifecycleEventTypes.map((eventType) => (
        <option key={eventType} value={eventType}>
          {formatLifecycleEventType(eventType)}
        </option>
      ))}
    </AdminSelect>
  );
}

function OutcomeSelect({
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
      placeholder="No outcome change"
    >
      {allowedIdeaOutcomes.map((outcome) => (
        <option key={outcome} value={outcome}>
          {formatIdeaOutcome(outcome)}
        </option>
      ))}
    </AdminSelect>
  );
}

function TimelineMeta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-foreground">{value}</dd>
    </div>
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
