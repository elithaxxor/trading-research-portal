"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Activity, RotateCcw } from "lucide-react";

import { AuthNotice } from "@/components/auth-notice";
import { AdminCheckbox } from "@/components/admin/forms/AdminCheckbox";
import { AdminFormSection } from "@/components/admin/forms/AdminFormSection";
import { AdminSelect } from "@/components/admin/forms/AdminSelect";
import { AdminTextInput } from "@/components/admin/forms/AdminTextInput";
import { AdminTextarea } from "@/components/admin/forms/AdminTextarea";
import { CardShell } from "@/components/card-shell";
import { buttonVariants } from "@/components/ui/button";
import type { AdminIdea } from "@/lib/admin/types";
import {
  allowedIdeaOutcomes,
  statusDisplayLabels,
} from "@/lib/lifecycle/constants";
import {
  formatIdeaOutcome,
  formatIdeaStatus,
  formatLifecycleDate,
  getOutcomeTone,
  getStatusTone,
} from "@/lib/lifecycle/format";
import type { IdeaStatus, LifecycleTone } from "@/lib/lifecycle/types";
import { cn } from "@/lib/utils";

import {
  closeIdeaWithReviewAction,
  initialLifecycleActionState,
  markTargetHitAction,
  publishReviewAction,
  reopenIdeaAction,
  transitionIdeaStatusAction,
  unpublishReviewAction,
} from "../../lifecycle-actions";

type LifecyclePanelProps = {
  idea: AdminIdea;
};

type TransitionAction = {
  bodyPlaceholder: string;
  buttonLabel: string;
  defaultTitle: string;
  nextStatus: IdeaStatus;
  title: string;
};

const statusToneClasses: Record<LifecycleTone, string> = {
  danger: "border-destructive/30 bg-destructive/10 text-destructive",
  info: "border-sky-400/30 bg-sky-400/10 text-sky-200",
  muted: "border-border bg-card text-muted-foreground",
  neutral: "border-border bg-secondary text-muted-foreground",
  success: "border-positive/30 bg-positive/10 text-positive",
  warning: "border-primary/30 bg-primary/10 text-primary",
};

function getTransitionActions(status: IdeaStatus): TransitionAction[] {
  if (status === "watching") {
    return [
      {
        bodyPlaceholder: "Optional context about why this idea is now active.",
        buttonLabel: "Activate",
        defaultTitle: "Idea activated",
        nextStatus: "active",
        title: "Activate",
      },
      {
        bodyPlaceholder: "Optional context about why the setup is no longer valid.",
        buttonLabel: "Mark Invalidated",
        defaultTitle: "Idea invalidated",
        nextStatus: "invalidated",
        title: "Mark invalidated",
      },
    ];
  }

  if (status === "active") {
    return [
      {
        bodyPlaceholder: "Optional context about the trigger condition.",
        buttonLabel: "Mark Triggered",
        defaultTitle: "Idea triggered",
        nextStatus: "triggered",
        title: "Mark triggered",
      },
      {
        bodyPlaceholder: "Optional context about the invalidation.",
        buttonLabel: "Mark Invalidated",
        defaultTitle: "Idea invalidated",
        nextStatus: "invalidated",
        title: "Mark invalidated",
      },
    ];
  }

  if (status === "triggered" || status === "target_hit") {
    return [
      {
        bodyPlaceholder: "Optional context about the invalidation.",
        buttonLabel: "Mark Invalidated",
        defaultTitle: "Idea invalidated",
        nextStatus: "invalidated",
        title: "Mark invalidated",
      },
    ];
  }

  return [];
}

function targetHitActions(idea: AdminIdea) {
  if (idea.status !== "triggered" && idea.status !== "target_hit") {
    return [];
  }

  return [
    {
      disabled: Boolean(idea.target_1_hit_at),
      number: 1,
      title: "Target 1 hit",
    },
    {
      disabled: Boolean(idea.target_2_hit_at),
      number: 2,
      title: "Target 2 hit",
    },
    {
      disabled: Boolean(idea.target_3_hit_at),
      number: 3,
      title: "Target 3 hit",
    },
  ];
}

export function LifecyclePanel({ idea }: LifecyclePanelProps) {
  const transitionActions = getTransitionActions(idea.status);
  const targetActions = targetHitActions(idea);
  const canClose = idea.status !== "closed";
  const canReopen = idea.status === "closed";

  return (
    <div className="space-y-6">
      <CardShell padding="lg" tone="elevated">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Activity aria-hidden className="size-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">
                  Lifecycle
                </h2>
              </div>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                Lifecycle actions update the research timeline. They do not
                execute trades or connect to a broker.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span
                className={cn(
                  "inline-flex rounded-md border px-2.5 py-1 text-xs font-medium",
                  statusToneClasses[getStatusTone(idea.status)]
                )}
              >
                {formatIdeaStatus(idea.status)}
              </span>
              <span
                className={cn(
                  "inline-flex rounded-md border px-2.5 py-1 text-xs font-medium",
                  statusToneClasses[getOutcomeTone(idea.outcome)]
                )}
              >
                {formatIdeaOutcome(idea.outcome)}
              </span>
            </div>
          </div>

          <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <LifecycleMetric label="Current status" value={formatIdeaStatus(idea.status)} />
            <LifecycleMetric label="Current outcome" value={formatIdeaOutcome(idea.outcome)} />
            <LifecycleMetric label="Triggered at" value={formatLifecycleDate(idea.triggered_at)} />
            <LifecycleMetric label="Target 1 hit at" value={formatLifecycleDate(idea.target_1_hit_at)} />
            <LifecycleMetric label="Target 2 hit at" value={formatLifecycleDate(idea.target_2_hit_at)} />
            <LifecycleMetric label="Target 3 hit at" value={formatLifecycleDate(idea.target_3_hit_at)} />
            <LifecycleMetric label="Invalidated at" value={formatLifecycleDate(idea.invalidated_at)} />
            <LifecycleMetric label="Closed at" value={formatLifecycleDate(idea.closed_at)} />
            <LifecycleMetric label="Last lifecycle event" value={formatLifecycleDate(idea.last_lifecycle_event_at)} />
            <LifecycleMetric label="Review published" value={idea.review_published ? "Yes" : "No"} />
            <LifecycleMetric label="Review published at" value={formatLifecycleDate(idea.review_published_at)} />
          </dl>
        </div>
      </CardShell>

      <div className="grid gap-6 xl:grid-cols-2">
        {transitionActions.map((action) => (
          <StatusTransitionForm
            action={action}
            idea={idea}
            key={action.nextStatus}
          />
        ))}

        {targetActions.map((action) => (
          <TargetHitForm
            disabled={action.disabled}
            idea={idea}
            key={action.number}
            targetNumber={action.number}
            title={action.title}
          />
        ))}

        {canClose ? <CloseReviewForm idea={idea} /> : null}
        {canReopen ? <ReopenIdeaForm idea={idea} /> : null}
        {idea.review_published ? (
          <ReviewToggleForm
            actionKind="unpublish"
            buttonLabel="Unpublish Review"
            idea={idea}
            title="Unpublish review"
          />
        ) : (
          <ReviewToggleForm
            actionKind="publish"
            buttonLabel="Publish Review"
            idea={idea}
            title="Publish review"
          />
        )}
      </div>
    </div>
  );
}

function LifecycleMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background/50 p-3">
      <dt className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-2 text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}

function ActionNotice({ state }: { state: { message?: string; status: string } }) {
  if (!state.message) {
    return null;
  }

  return (
    <AuthNotice
      message={state.message}
      tone={state.status === "error" ? "error" : "success"}
    />
  );
}

function HiddenIdeaFields({ idea }: { idea: AdminIdea }) {
  return <input name="idea_id" type="hidden" value={idea.id} />;
}

function StatusTransitionForm({
  action,
  idea,
}: {
  action: TransitionAction;
  idea: AdminIdea;
}) {
  const [state, formAction] = useActionState(
    transitionIdeaStatusAction,
    initialLifecycleActionState
  );

  return (
    <AdminFormSection
      description="Records a structured status change in the idea timeline."
      title={action.title}
    >
      <form action={formAction} className="flex flex-col gap-4">
        <HiddenIdeaFields idea={idea} />
        <input name="next_status" type="hidden" value={action.nextStatus} />
        <AdminTextInput
          defaultValue={action.defaultTitle}
          error={state.fieldErrors?.update_title}
          id={`transition-title-${action.nextStatus}`}
          label="Update title"
          name="update_title"
          required
        />
        <AdminTextarea
          id={`transition-body-${action.nextStatus}`}
          label="Update body"
          name="update_body"
          placeholder={action.bodyPlaceholder}
        />
        <AdminCheckbox
          id={`transition-major-${action.nextStatus}`}
          label="Major update"
          name="is_major"
        />
        <AdminCheckbox
          description="Queues a safe lifecycle email for opted-in members who can access this idea."
          id={`transition-notify-email-${action.nextStatus}`}
          label="Notify eligible members by email"
          name="notify_email"
        />
        <ActionNotice state={state} />
        <LifecycleSubmitButton label={action.buttonLabel} />
      </form>
    </AdminFormSection>
  );
}

function TargetHitForm({
  disabled,
  idea,
  targetNumber,
  title,
}: {
  disabled: boolean;
  idea: AdminIdea;
  targetNumber: number;
  title: string;
}) {
  const [state, formAction] = useActionState(
    markTargetHitAction,
    initialLifecycleActionState
  );

  return (
    <AdminFormSection
      description={
        disabled
          ? "This target timestamp has already been recorded."
          : "Records a target-hit lifecycle event and timestamp."
      }
      title={title}
    >
      <form action={formAction} className="flex flex-col gap-4">
        <HiddenIdeaFields idea={idea} />
        <input name="target_number" type="hidden" value={targetNumber} />
        <AdminTextInput
          defaultValue={title}
          error={state.fieldErrors?.update_title}
          id={`target-title-${targetNumber}`}
          label="Update title"
          name="update_title"
          required
        />
        <AdminTextarea
          id={`target-body-${targetNumber}`}
          label="Update body"
          name="update_body"
          placeholder="Optional context for the target-hit review."
        />
        <AdminCheckbox
          description="Queues a safe lifecycle email without exact target levels."
          id={`target-notify-email-${targetNumber}`}
          label="Notify eligible members by email"
          name="notify_email"
        />
        <ActionNotice state={state} />
        <LifecycleSubmitButton disabled={disabled} label={`Mark Target ${targetNumber} Hit`} />
      </form>
    </AdminFormSection>
  );
}

function CloseReviewForm({ idea }: { idea: AdminIdea }) {
  const [state, formAction] = useActionState(
    closeIdeaWithReviewAction,
    initialLifecycleActionState
  );

  return (
    <AdminFormSection
      description="Close the idea and optionally publish a member-facing review summary."
      title="Close with review"
    >
      <form action={formAction} className="flex flex-col gap-4">
        <HiddenIdeaFields idea={idea} />
        <AdminSelect
          defaultValue={idea.outcome}
          error={state.fieldErrors?.outcome}
          id="close-outcome"
          label="Outcome"
          name="outcome"
          required
        >
          {allowedIdeaOutcomes.map((outcome) => (
            <option key={outcome} value={outcome}>
              {formatIdeaOutcome(outcome)}
            </option>
          ))}
        </AdminSelect>
        <AdminTextarea
          defaultValue={idea.outcome_summary ?? ""}
          error={state.fieldErrors?.outcome_summary}
          id="outcome-summary"
          label="Outcome summary"
          name="outcome_summary"
        />
        <AdminTextarea
          defaultValue={idea.lessons_learned ?? ""}
          error={state.fieldErrors?.lessons_learned}
          id="lessons-learned"
          label="Lessons learned"
          name="lessons_learned"
        />
        <AdminTextInput
          defaultValue="Idea closed with review"
          error={state.fieldErrors?.update_title}
          id="close-update-title"
          label="Update title"
          name="update_title"
          required
        />
        <AdminTextarea
          id="close-update-body"
          label="Update body"
          name="update_body"
          placeholder="Optional timeline note for the closeout."
        />
        <AdminCheckbox
          defaultChecked={idea.review_published}
          id="review-published"
          label="Publish review"
          name="review_published"
        />
        <AdminCheckbox id="close-major" label="Major update" name="is_major" />
        <AdminCheckbox
          description="Queues a closed-review email only for opted-in members who can access this idea. Review details stay protected in the portal."
          id="close-notify-email"
          label="Notify eligible members by email"
          name="notify_email"
        />
        <ActionNotice state={state} />
        <LifecycleSubmitButton label="Close with Review" />
      </form>
    </AdminFormSection>
  );
}

function ReopenIdeaForm({ idea }: { idea: AdminIdea }) {
  const [state, formAction] = useActionState(
    reopenIdeaAction,
    initialLifecycleActionState
  );

  return (
    <AdminFormSection
      description="Reopens a closed idea while preserving historical outcome fields."
      title="Reopen idea"
    >
      <form action={formAction} className="flex flex-col gap-4">
        <HiddenIdeaFields idea={idea} />
        <AdminSelect
          defaultValue="active"
          error={state.fieldErrors?.next_status}
          id="reopen-next-status"
          label="Reopen as"
          name="next_status"
        >
          <option value="active">{statusDisplayLabels.active}</option>
          <option value="watching">{statusDisplayLabels.watching}</option>
        </AdminSelect>
        <AdminTextInput
          defaultValue="Idea reopened"
          error={state.fieldErrors?.update_title}
          id="reopen-title"
          label="Update title"
          name="update_title"
          required
        />
        <AdminTextarea
          id="reopen-body"
          label="Update body"
          name="update_body"
          placeholder="Optional correction note for reopening this idea."
        />
        <AdminCheckbox
          description="Queues a safe lifecycle email for opted-in members who can access this idea."
          id="reopen-notify-email"
          label="Notify eligible members by email"
          name="notify_email"
        />
        <ActionNotice state={state} />
        <LifecycleSubmitButton icon="reopen" label="Reopen Idea" />
      </form>
    </AdminFormSection>
  );
}

function ReviewToggleForm({
  actionKind,
  buttonLabel,
  idea,
  title,
}: {
  actionKind: "publish" | "unpublish";
  buttonLabel: string;
  idea: AdminIdea;
  title: string;
}) {
  const [state, formAction] = useActionState(
    actionKind === "publish" ? publishReviewAction : unpublishReviewAction,
    initialLifecycleActionState
  );

  return (
    <AdminFormSection
      description="Toggles whether the closed review is visible on member-facing idea pages."
      title={title}
    >
      <form action={formAction} className="flex flex-col gap-4">
        <HiddenIdeaFields idea={idea} />
        <p className="text-sm leading-6 text-muted-foreground">
          {idea.review_published
            ? "The review is currently published."
            : "The review is currently not published."}
        </p>
        {actionKind === "publish" ? (
          <AdminCheckbox
            description="Queues a closed-review email for opted-in members who can access this idea."
            id="review-toggle-notify-email"
            label="Notify eligible members by email"
            name="notify_email"
          />
        ) : null}
        <ActionNotice state={state} />
        <LifecycleSubmitButton
          label={buttonLabel}
          variant={actionKind === "publish" ? "default" : "outline"}
        />
      </form>
    </AdminFormSection>
  );
}

function LifecycleSubmitButton({
  disabled = false,
  icon,
  label,
  variant = "default",
}: {
  disabled?: boolean;
  icon?: "reopen";
  label: string;
  variant?: "default" | "outline";
}) {
  const { pending } = useFormStatus();

  return (
    <button
      className={cn(buttonVariants({ size: "lg", variant }))}
      disabled={disabled || pending}
      type="submit"
    >
      {icon === "reopen" ? <RotateCcw data-icon="inline-start" /> : null}
      {pending ? "Saving..." : label}
    </button>
  );
}
