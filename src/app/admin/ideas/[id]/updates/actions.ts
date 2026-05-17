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
  CreateIdeaUpdateInput,
  UpdateIdeaUpdateInput,
} from "@/lib/admin/types";
import { normalizeEmptyString, validateIdeaStatus } from "@/lib/admin/validation";
import { requireAdmin } from "@/lib/auth/admin";

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

function buildIdeaUpdateInput(
  formData: FormData
): {
  fieldErrors: Record<string, string>;
  input: CreateIdeaUpdateInput | UpdateIdeaUpdateInput | null;
  statusAfterUpdate: AdminIdeaStatus | null;
} {
  const fieldErrors: Record<string, string> = {};
  const title = getFormValue(formData, "title");
  const body = normalizeEmptyString(getFormValue(formData, "body"));
  const statusValue = getFormValue(formData, "status_after_update");

  if (!title) {
    addFieldError(fieldErrors, "title", "Update title is required.");
  }

  let statusAfterUpdate: AdminIdeaStatus | null = null;

  if (statusValue) {
    const parsedStatus = validateIdeaStatus(statusValue);

    if (!parsedStatus.ok) {
      addFieldError(
        fieldErrors,
        "status_after_update",
        parsedStatus.error
      );
    } else {
      statusAfterUpdate = parsedStatus.value;
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      fieldErrors,
      input: null,
      statusAfterUpdate,
    };
  }

  return {
    fieldErrors,
    input: {
      body,
      status_after_update: statusAfterUpdate,
      title,
    },
    statusAfterUpdate,
  };
}

export async function createIdeaUpdateAction(
  _state: IdeaUpdateActionState,
  formData: FormData
): Promise<IdeaUpdateActionState> {
  await requireAdmin("/admin/ideas");

  const ideaId = getRequiredId(formData, "idea_id");
  const idea = await getParentIdea(ideaId);
  const { fieldErrors, input, statusAfterUpdate } = buildIdeaUpdateInput(
    formData
  );

  if (!input || Object.keys(fieldErrors).length > 0) {
    return errorState("Review the update fields and try again.", fieldErrors);
  }

  try {
    await createIdeaUpdate(ideaId, input as CreateIdeaUpdateInput);

    if (statusAfterUpdate) {
      await updateAdminIdea(ideaId, {
        status: statusAfterUpdate,
      });
    }
  } catch {
    return errorState("The idea update could not be created.");
  }

  revalidateUpdatePaths(ideaId, idea.slug);

  return {
    message: "Idea update created.",
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
  const { fieldErrors, input, statusAfterUpdate } = buildIdeaUpdateInput(
    formData
  );

  if (!input || Object.keys(fieldErrors).length > 0) {
    return errorState("Review the update fields and try again.", fieldErrors);
  }

  try {
    await updateIdeaUpdate(updateId, input);

    if (statusAfterUpdate) {
      await updateAdminIdea(ideaId, {
        status: statusAfterUpdate,
      });
    }
  } catch {
    return errorState("The idea update could not be saved.");
  }

  revalidateUpdatePaths(ideaId, idea.slug);

  return {
    message: "Idea update saved.",
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
