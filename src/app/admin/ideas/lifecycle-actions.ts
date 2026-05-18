"use server";

import { revalidatePath } from "next/cache";

import { getAdminIdeaById, updateAdminIdea } from "@/lib/admin/ideas";
import { createIdeaUpdate } from "@/lib/admin/updates";
import { requireAdmin } from "@/lib/auth/admin";
import {
  canTransitionIdeaStatus,
  getLifecycleEventTypeForStatusChange,
  shouldSetClosedAt,
  shouldSetInvalidatedAt,
  shouldSetTargetHitAt,
  shouldSetTriggeredAt,
} from "@/lib/lifecycle/transitions";
import type {
  IdeaLifecycleEventType,
  IdeaOutcome,
  IdeaStatus,
} from "@/lib/lifecycle/types";
import {
  validateLifecycleStatus,
  validateLifecycleUpdateInput,
  validateOutcome,
  validateOutcomeSummary,
  validateLessonsLearned,
} from "@/lib/lifecycle/validation";

export type LifecycleActionState = {
  fieldErrors?: Record<string, string>;
  message?: string;
  status: "idle" | "error";
};

export const initialLifecycleActionState: LifecycleActionState = {
  status: "idle",
};

function getFormValue(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function getRequiredId(formData: FormData, key = "idea_id") {
  const id = getFormValue(formData, key);

  if (!id) {
    throw new Error(`${key} is required.`);
  }

  return id;
}

function addFieldError(
  fieldErrors: Record<string, string>,
  key: string,
  message: string
) {
  if (!fieldErrors[key]) {
    fieldErrors[key] = message;
  }
}

function errorState(
  message: string,
  fieldErrors: Record<string, string> = {}
): LifecycleActionState {
  return {
    fieldErrors,
    message,
    status: "error",
  };
}

async function getRequiredIdea(ideaId: string) {
  const idea = await getAdminIdeaById(ideaId);

  if (!idea) {
    throw new Error("Trading idea not found.");
  }

  return idea;
}

function getLifecycleUpdateValidation({
  eventAt,
  eventType,
  formData,
  outcomeAfter,
  statusAfterUpdate,
  statusBefore,
}: {
  eventAt?: string;
  eventType: IdeaLifecycleEventType;
  formData: FormData;
  outcomeAfter?: IdeaOutcome | null;
  statusAfterUpdate?: IdeaStatus | null;
  statusBefore?: IdeaStatus | null;
}) {
  return validateLifecycleUpdateInput({
    body: getFormValue(formData, "update_body"),
    event_at: eventAt ?? getFormValue(formData, "event_at"),
    event_type: eventType,
    is_major: formData.get("is_major"),
    outcome_after: outcomeAfter ?? null,
    status_after_update: statusAfterUpdate ?? null,
    status_before: statusBefore ?? null,
    title: getFormValue(formData, "update_title"),
  });
}

function revalidateLifecyclePaths(ideaId: string, slug: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/ideas");
  revalidatePath(`/admin/ideas/${ideaId}/edit`);
  revalidatePath(`/admin/ideas/${ideaId}/updates`);
  revalidatePath("/ideas");
  revalidatePath(`/ideas/${slug}`);
  revalidatePath("/dashboard");
}

function successState(message: string): LifecycleActionState {
  return {
    message,
    status: "idle",
  };
}

function getTargetHitColumn(targetNumber: number) {
  if (!shouldSetTargetHitAt(targetNumber)) {
    return null;
  }

  return `target_${targetNumber}_hit_at` as
    | "target_1_hit_at"
    | "target_2_hit_at"
    | "target_3_hit_at";
}

export async function transitionIdeaStatusAction(
  _state: LifecycleActionState,
  formData: FormData
): Promise<LifecycleActionState> {
  await requireAdmin("/admin/ideas");
  const ideaId = getRequiredId(formData);
  const idea = await getRequiredIdea(ideaId);
  const fieldErrors: Record<string, string> = {};
  const nextStatusResult = validateLifecycleStatus(
    getFormValue(formData, "next_status")
  );

  if (!nextStatusResult.ok) {
    addFieldError(fieldErrors, "next_status", nextStatusResult.error);
  }

  if (!nextStatusResult.ok) {
    return errorState("Review the lifecycle fields and try again.", fieldErrors);
  }

  const transition = canTransitionIdeaStatus(idea.status, nextStatusResult.value);

  if (!transition.allowed) {
    addFieldError(
      fieldErrors,
      "next_status",
      transition.reason ?? "That lifecycle transition is not allowed."
    );
    return errorState("Review the lifecycle fields and try again.", fieldErrors);
  }

  const eventType =
    transition.eventType ??
    getLifecycleEventTypeForStatusChange(idea.status, nextStatusResult.value);
  const updateResult = getLifecycleUpdateValidation({
    eventType,
    formData,
    statusAfterUpdate: nextStatusResult.value,
    statusBefore: idea.status,
  });

  if (!updateResult.ok) {
    return errorState("Review the lifecycle update and try again.", {
      update_title: updateResult.error,
    });
  }

  const eventAt = updateResult.value.event_at;

  try {
    await updateAdminIdea(ideaId, {
      closed_at: shouldSetClosedAt(idea.status, nextStatusResult.value)
        ? eventAt
        : idea.closed_at,
      invalidated_at: shouldSetInvalidatedAt(idea.status, nextStatusResult.value)
        ? eventAt
        : idea.invalidated_at,
      last_lifecycle_event_at: eventAt,
      status: nextStatusResult.value,
      triggered_at: shouldSetTriggeredAt(idea.status, nextStatusResult.value)
        ? eventAt
        : idea.triggered_at,
    });

    await createIdeaUpdate(ideaId, {
      body: updateResult.value.body,
      event_at: eventAt,
      event_type: eventType,
      is_major: updateResult.value.is_major,
      outcome_after: null,
      status_after_update: nextStatusResult.value,
      status_before: idea.status,
      title: updateResult.value.title,
    });
  } catch {
    return errorState("The lifecycle transition could not be saved.");
  }

  revalidateLifecyclePaths(ideaId, idea.slug);

  return successState("Lifecycle status updated.");
}

export async function markTargetHitAction(
  _state: LifecycleActionState,
  formData: FormData
): Promise<LifecycleActionState> {
  await requireAdmin("/admin/ideas");
  const ideaId = getRequiredId(formData);
  const idea = await getRequiredIdea(ideaId);
  const targetNumber = Number(getFormValue(formData, "target_number"));
  const targetColumn = getTargetHitColumn(targetNumber);

  if (!targetColumn) {
    return errorState("Choose target 1, 2, or 3.", {
      target_number: "Choose target 1, 2, or 3.",
    });
  }

  const updateResult = getLifecycleUpdateValidation({
    eventType: "target_hit",
    formData,
    statusAfterUpdate: "target_hit",
    statusBefore: idea.status,
  });

  if (!updateResult.ok) {
    return errorState("Review the target-hit update and try again.", {
      update_title: updateResult.error,
    });
  }

  const eventAt = updateResult.value.event_at;

  try {
    await updateAdminIdea(ideaId, {
      last_lifecycle_event_at: eventAt,
      status: "target_hit",
      [targetColumn]: eventAt,
    });

    await createIdeaUpdate(ideaId, {
      body: updateResult.value.body,
      event_at: eventAt,
      event_type: "target_hit",
      is_major: updateResult.value.is_major,
      outcome_after: null,
      status_after_update: "target_hit",
      status_before: idea.status,
      title: updateResult.value.title,
    });
  } catch {
    return errorState("The target-hit update could not be saved.");
  }

  revalidateLifecyclePaths(ideaId, idea.slug);

  return successState("Target hit recorded.");
}

export async function closeIdeaWithReviewAction(
  _state: LifecycleActionState,
  formData: FormData
): Promise<LifecycleActionState> {
  await requireAdmin("/admin/ideas");
  const ideaId = getRequiredId(formData);
  const idea = await getRequiredIdea(ideaId);
  const fieldErrors: Record<string, string> = {};
  const outcomeResult = validateOutcome(getFormValue(formData, "outcome"));
  const outcomeSummaryResult = validateOutcomeSummary(
    getFormValue(formData, "outcome_summary")
  );
  const lessonsLearnedResult = validateLessonsLearned(
    getFormValue(formData, "lessons_learned")
  );

  if (!outcomeResult.ok) {
    addFieldError(fieldErrors, "outcome", outcomeResult.error);
  }

  if (!outcomeSummaryResult.ok) {
    addFieldError(fieldErrors, "outcome_summary", outcomeSummaryResult.error);
  }

  if (!lessonsLearnedResult.ok) {
    addFieldError(fieldErrors, "lessons_learned", lessonsLearnedResult.error);
  }

  if (!outcomeResult.ok || !outcomeSummaryResult.ok || !lessonsLearnedResult.ok) {
    return errorState("Review the outcome fields and try again.", fieldErrors);
  }

  const reviewPublished = formData.get("review_published") === "on";
  const eventType: IdeaLifecycleEventType = reviewPublished
    ? "review_posted"
    : "closed";
  const updateResult = getLifecycleUpdateValidation({
    eventType,
    formData,
    outcomeAfter: outcomeResult.value,
    statusAfterUpdate: "closed",
    statusBefore: idea.status,
  });

  if (!updateResult.ok) {
    return errorState("Review the closeout update and try again.", {
      update_title: updateResult.error,
    });
  }

  const eventAt = updateResult.value.event_at;

  try {
    await updateAdminIdea(ideaId, {
      closed_at: idea.closed_at ?? eventAt,
      last_lifecycle_event_at: eventAt,
      lessons_learned: lessonsLearnedResult.value,
      outcome: outcomeResult.value,
      outcome_summary: outcomeSummaryResult.value,
      review_published: reviewPublished,
      review_published_at: reviewPublished ? eventAt : null,
      status: "closed",
    });

    await createIdeaUpdate(ideaId, {
      body: updateResult.value.body,
      event_at: eventAt,
      event_type: eventType,
      is_major: updateResult.value.is_major,
      outcome_after: outcomeResult.value,
      status_after_update: "closed",
      status_before: idea.status,
      title: updateResult.value.title,
    });
  } catch {
    return errorState("The idea review could not be saved.");
  }

  revalidateLifecyclePaths(ideaId, idea.slug);

  return successState("Idea closed with review.");
}

export async function reopenIdeaAction(
  _state: LifecycleActionState,
  formData: FormData
): Promise<LifecycleActionState> {
  await requireAdmin("/admin/ideas");
  const ideaId = getRequiredId(formData);
  const idea = await getRequiredIdea(ideaId);
  const requestedStatus = getFormValue(formData, "next_status") || "active";

  if (idea.status !== "closed") {
    return errorState("Only closed ideas can be reopened.");
  }

  if (requestedStatus !== "active" && requestedStatus !== "watching") {
    return errorState("Reopened ideas must move to active or watching.", {
      next_status: "Choose active or watching.",
    });
  }

  const updateResult = getLifecycleUpdateValidation({
    eventAt: new Date().toISOString(),
    eventType: "status_change",
    formData,
    statusAfterUpdate: requestedStatus,
    statusBefore: idea.status,
  });

  if (!updateResult.ok) {
    return errorState("Review the reopen update and try again.", {
      update_title: updateResult.error,
    });
  }

  const eventAt = updateResult.value.event_at;

  try {
    await updateAdminIdea(ideaId, {
      last_lifecycle_event_at: eventAt,
      status: requestedStatus,
    });

    await createIdeaUpdate(ideaId, {
      body: updateResult.value.body,
      event_at: eventAt,
      event_type: "status_change",
      is_major: updateResult.value.is_major,
      outcome_after: idea.outcome,
      status_after_update: requestedStatus,
      status_before: idea.status,
      title: updateResult.value.title,
    });
  } catch {
    return errorState("The idea could not be reopened.");
  }

  revalidateLifecyclePaths(ideaId, idea.slug);

  return successState("Idea reopened.");
}

export async function publishReviewAction(
  _state: LifecycleActionState,
  formData: FormData
): Promise<LifecycleActionState> {
  await requireAdmin("/admin/ideas");
  const ideaId = getRequiredId(formData);
  const idea = await getRequiredIdea(ideaId);
  const publishedAt = idea.review_published_at ?? new Date().toISOString();

  try {
    await updateAdminIdea(ideaId, {
      last_lifecycle_event_at: publishedAt,
      review_published: true,
      review_published_at: publishedAt,
    });
  } catch {
    return errorState("The review could not be published.");
  }

  revalidateLifecyclePaths(ideaId, idea.slug);

  return successState("Review published.");
}

export async function unpublishReviewAction(
  _state: LifecycleActionState,
  formData: FormData
): Promise<LifecycleActionState> {
  await requireAdmin("/admin/ideas");
  const ideaId = getRequiredId(formData);
  const idea = await getRequiredIdea(ideaId);

  try {
    await updateAdminIdea(ideaId, {
      review_published: false,
      review_published_at: null,
    });
  } catch {
    return errorState("The review could not be unpublished.");
  }

  revalidateLifecyclePaths(ideaId, idea.slug);

  return successState("Review unpublished.");
}
