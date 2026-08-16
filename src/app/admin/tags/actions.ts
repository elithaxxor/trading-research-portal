"use server";

import { revalidatePath } from "next/cache";

import { getAdminIdeaById } from "@/lib/admin/ideas";
import {
  createTag,
  deleteTag,
  getAdminTagById,
  getAdminTagBySlug,
  getTagUsageCount,
  listTags,
  setIdeaTags,
  updateTag,
} from "@/lib/admin/tags";
import type { CreateAdminTagInput, UpdateAdminTagInput } from "@/lib/admin/types";
import { generateSlug, validateSlug } from "@/lib/admin/validation";
import { requireAdmin } from "@/lib/auth/admin";

export type TagActionState = {
  fieldErrors?: Record<string, string>;
  message?: string;
  status: "idle" | "error";
};

function getRequiredId(formData: FormData, fieldName = "id") {
  const id = formData.get(fieldName);

  if (typeof id !== "string" || !id.trim()) {
    throw new Error("A valid id is required.");
  }

  return id;
}

function getFormValue(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
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
): TagActionState {
  return {
    fieldErrors,
    message,
    status: "error",
  };
}

function successState(message: string): TagActionState {
  return {
    message,
    status: "idle",
  };
}

function revalidateTagPaths() {
  revalidatePath("/admin");
  revalidatePath("/admin/tags");
  revalidatePath("/admin/ideas");
  revalidatePath("/ideas");
}

function revalidateIdeaTagPaths({
  ideaId,
  slug,
}: {
  ideaId: string;
  slug?: string | null;
}) {
  revalidateTagPaths();
  revalidatePath(`/admin/ideas/${ideaId}/edit`);

  if (slug) {
    revalidatePath(`/ideas/${slug}`);
  }
}

async function buildTagPayload({
  currentId,
  currentSlug,
  formData,
}: {
  currentId?: string;
  currentSlug?: string;
  formData: FormData;
}) {
  const name = getFormValue(formData, "name");
  const slugValue = getFormValue(formData, "slug") || generateSlug(name);
  const fieldErrors: Record<string, string> = {};

  if (!name) {
    addFieldError(fieldErrors, "name", "Tag name is required.");
  }

  if (name.length > 80) {
    addFieldError(fieldErrors, "name", "Tag name must be 80 characters or fewer.");
  }

  const slug = validateSlug(slugValue);
  if (!slug.ok) {
    addFieldError(fieldErrors, "slug", slug.error);
  }

  if (slug.ok && slug.value !== currentSlug) {
    const existingTag = await getAdminTagBySlug(slug.value);

    if (existingTag && existingTag.id !== currentId) {
      addFieldError(fieldErrors, "slug", "Another tag already uses this slug.");
    }
  }

  if (Object.keys(fieldErrors).length > 0 || !slug.ok) {
    return {
      fieldErrors,
      payload: null,
    };
  }

  return {
    fieldErrors,
    payload: {
      name,
      slug: slug.value,
    },
  };
}

export async function createTagAction(
  _state: TagActionState,
  formData: FormData
): Promise<TagActionState> {
  await requireAdmin("/admin/tags");

  const { fieldErrors, payload } = await buildTagPayload({ formData });

  if (!payload) {
    return errorState("Review the highlighted fields and try again.", fieldErrors);
  }

  try {
    await createTag(payload as CreateAdminTagInput);
  } catch {
    return errorState("The tag could not be created. Check the slug and try again.");
  }

  revalidateTagPaths();

  return successState("Tag created.");
}

export async function updateTagAction(
  _state: TagActionState,
  formData: FormData
): Promise<TagActionState> {
  await requireAdmin("/admin/tags");

  const id = getRequiredId(formData);
  const currentTag = await getAdminTagById(id);

  if (!currentTag) {
    return errorState("That tag could not be found.");
  }

  const { fieldErrors, payload } = await buildTagPayload({
    currentId: currentTag.id,
    currentSlug: currentTag.slug,
    formData,
  });

  if (!payload) {
    return errorState("Review the highlighted fields and try again.", fieldErrors);
  }

  try {
    await updateTag(id, payload as UpdateAdminTagInput);
  } catch {
    return errorState("The tag could not be updated. Try again.");
  }

  revalidateTagPaths();

  return successState("Tag saved.");
}

export async function deleteTagAction(
  _state: TagActionState,
  formData: FormData
): Promise<TagActionState> {
  await requireAdmin("/admin/tags");

  const id = getRequiredId(formData);
  const currentTag = await getAdminTagById(id);

  if (!currentTag) {
    return errorState("That tag could not be found.");
  }

  const usageCount = await getTagUsageCount(id);

  if (usageCount > 0) {
    return errorState(
      `Remove this tag from ${usageCount} assigned idea${
        usageCount === 1 ? "" : "s"
      } before deleting it.`
    );
  }

  try {
    await deleteTag(id);
  } catch {
    return errorState("The tag could not be deleted. Try again.");
  }

  revalidateTagPaths();

  return successState("Tag deleted.");
}

export async function setIdeaTagsAction(
  _state: TagActionState,
  formData: FormData
): Promise<TagActionState> {
  await requireAdmin("/admin/ideas");

  const ideaId = getRequiredId(formData, "idea_id");
  const idea = await getAdminIdeaById(ideaId);

  if (!idea) {
    return errorState("That trading idea could not be found.");
  }

  const requestedTagIds = formData
    .getAll("tag_ids")
    .filter((value): value is string => typeof value === "string" && Boolean(value));
  const availableTags = await listTags();
  const availableTagIds = new Set(availableTags.map((tag) => tag.id));
  const tagIds = [...new Set(requestedTagIds)].filter((tagId) =>
    availableTagIds.has(tagId)
  );

  try {
    await setIdeaTags(idea.id, tagIds);
  } catch {
    return errorState("Tags could not be saved for this idea. Try again.");
  }

  revalidateIdeaTagPaths({
    ideaId: idea.id,
    slug: idea.slug,
  });

  return successState("Idea tags saved.");
}
