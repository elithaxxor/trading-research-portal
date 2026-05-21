"use server";

import { revalidatePath } from "next/cache";

import { getAdminIdeaById, updateAdminIdea } from "@/lib/admin/ideas";
import {
  createIdeaUpdate,
  deleteIdeaUpdate,
  updateIdeaUpdate,
} from "@/lib/admin/updates";
import type {
  AdminIdeaStatus,
  AdminIdeaUpdateRecord,
  CreateIdeaUpdateInput,
  UpdateIdeaUpdateInput,
} from "@/lib/admin/types";
import { requireAdmin } from "@/lib/auth/admin";
import {
  formatQueueResultMessage,
  queueIdeaUpdateEmailNotifications,
  queueLifecycleUpdateEmailNotifications,
  shouldNotifyEligibleMembers,
} from "@/lib/email/content-notifications";
import { validateLifecycleUpdateInput } from "@/lib/lifecycle/validation";

export type IdeaUpdateActionState = {
  fieldErrors?: Record<string, string>;
  message?: string;
  status: "idle" | "error";
};

export const initialIdeaUpdateActionState: IdeaUpdateActionState = {
  status: "idle",
};

function getFormValue(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function getRequiredId(formData: FormData, key: string) {
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
): IdeaUpdateActionState {
  return {
    fieldErrors,
    message,
    status: "error",
  };
}

async function getParentIdea(ideaId: string) {
  const idea = await getAdminIdeaById(ideaId);

  if (!idea) {
    throw new Error("Trading idea not found.");
  }

  return idea;
}

function revalidateUpdatePaths(ideaId: string, slug: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/ideas");
  revalidatePath(`/admin/ideas/${ideaId}/updates`);
  revalidatePath("/ideas");
  revalidatePath(`/ideas/${slug}`);
}

async function queueUpdateNotificationIfRequested({
  formData,
  idea,
  update,
}: {
  formData: FormData;
  idea: Awaited<ReturnType<typeof getParentIdea>>;
  update: AdminIdeaUpdateRecord;
}) {
  if (!shouldNotifyEligibleMembers(formData)) {
    return "";
  }

  const queueResult =
    update.event_type !== "note" ||
    update.status_after_update ||
    update.outcome_after
      ? await queueLifecycleUpdateEmailNotifications(idea, update)
      : await queueIdeaUpdateEmailNotifications(idea, update);

  return formatQueueResultMessage(queueResult);
}

function buildIdeaUpdateInput(
  formData: FormData,
  currentStatus: AdminIdeaStatus
): {
  fieldErrors: Record<string, string>;
  input: CreateIdeaUpdateInput | UpdateIdeaUpdateInput | null;
  eventAt: string | null;
  statusAfterUpdate: AdminIdeaStatus | null;
} {
  const fieldErrors: Record<string, string> = {};
  const parsedUpdate = validateLifecycleUpdateInput({
    body: getFormValue(formData, "body"),
    event_at: getFormValue(formData, "event_at"),
    event_type: getFormValue(formData, "event_type") || "note",
    is_major: formData.get("is_major"),
    outcome_after: getFormValue(formData, "outcome_after"),
    status_after_update: getFormValue(formData, "status_after_update"),
    status_before: getFormValue(formData, "status_before") || currentStatus,
    title: getFormValue(formData, "title"),
  });

  if (!parsedUpdate.ok) {
    addFieldError(fieldErrors, "title", parsedUpdate.error);
    return {
      eventAt: null,
      fieldErrors,
      input: null,
      statusAfterUpdate: null,
    };
  }

  return {
    fieldErrors,
    input: {
      body: parsedUpdate.value.body,
      event_at: parsedUpdate.value.event_at,
      event_type: parsedUpdate.value.event_type,
      is_major: parsedUpdate.value.is_major,
      outcome_after: parsedUpdate.value.outcome_after,
      status_after_update: parsedUpdate.value.status_after_update,
      status_before: parsedUpdate.value.status_before,
      title: parsedUpdate.value.title,
    },
    eventAt: parsedUpdate.value.event_at,
    statusAfterUpdate: parsedUpdate.value.status_after_update,
  };
}

export async function createIdeaUpdateAction(
  _state: IdeaUpdateActionState,
  formData: FormData
): Promise<IdeaUpdateActionState> {
  await requireAdmin("/admin/ideas");

  const ideaId = getRequiredId(formData, "idea_id");
  const idea = await getParentIdea(ideaId);
  const { eventAt, fieldErrors, input, statusAfterUpdate } =
    buildIdeaUpdateInput(formData, idea.status);

  if (!input || Object.keys(fieldErrors).length > 0) {
    return errorState("Review the update fields and try again.", fieldErrors);
  }

  let notificationMessage = "";

  try {
    const update = await createIdeaUpdate(ideaId, input as CreateIdeaUpdateInput);

    if (statusAfterUpdate) {
      await updateAdminIdea(ideaId, {
        last_lifecycle_event_at: eventAt,
        status: statusAfterUpdate,
      });
    } else if (eventAt) {
      await updateAdminIdea(ideaId, {
        last_lifecycle_event_at: eventAt,
      });
    }

    notificationMessage = await queueUpdateNotificationIfRequested({
      formData,
      idea,
      update,
    });
  } catch {
    return errorState("The idea update could not be created.");
  }

  revalidateUpdatePaths(ideaId, idea.slug);

  return {
    message: `Idea update created.${notificationMessage}`,
    status: "idle",
  };
}

export async function updateIdeaUpdateAction(
  _state: IdeaUpdateActionState,
  formData: FormData
): Promise<IdeaUpdateActionState> {
  await requireAdmin("/admin/ideas");

  const ideaId = getRequiredId(formData, "idea_id");
  const updateId = getRequiredId(formData, "update_id");
  const idea = await getParentIdea(ideaId);
  const { eventAt, fieldErrors, input, statusAfterUpdate } =
    buildIdeaUpdateInput(formData, idea.status);

  if (!input || Object.keys(fieldErrors).length > 0) {
    return errorState("Review the update fields and try again.", fieldErrors);
  }

  let notificationMessage = "";

  try {
    const update = await updateIdeaUpdate(updateId, input);

    if (statusAfterUpdate) {
      await updateAdminIdea(ideaId, {
        last_lifecycle_event_at: eventAt,
        status: statusAfterUpdate,
      });
    } else if (eventAt) {
      await updateAdminIdea(ideaId, {
        last_lifecycle_event_at: eventAt,
      });
    }

    notificationMessage = await queueUpdateNotificationIfRequested({
      formData,
      idea,
      update,
    });
  } catch {
    return errorState("The idea update could not be saved.");
  }

  revalidateUpdatePaths(ideaId, idea.slug);

  return {
    message: `Idea update saved.${notificationMessage}`,
    status: "idle",
  };
}

export async function deleteIdeaUpdateAction(
  _state: IdeaUpdateActionState,
  formData: FormData
): Promise<IdeaUpdateActionState> {
  await requireAdmin("/admin/ideas");

  const ideaId = getRequiredId(formData, "idea_id");
  const updateId = getRequiredId(formData, "update_id");
  const idea = await getParentIdea(ideaId);

  try {
    await deleteIdeaUpdate(updateId);
  } catch {
    return errorState("The idea update could not be deleted.");
  }

  revalidateUpdatePaths(ideaId, idea.slug);

  return {
    message: "Idea update deleted.",
    status: "idle",
  };
}
