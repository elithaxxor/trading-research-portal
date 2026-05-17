"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createAdminPost,
  deleteAdminPost,
  getAdminPostById,
  getAdminPostBySlug,
  publishAdminPost,
  unpublishAdminPost,
  updateAdminPost,
} from "@/lib/admin/posts";
import type { CreateAdminPostInput, UpdateAdminPostInput } from "@/lib/admin/types";
import {
  generateSlug,
  getSensitivePreviewTerm,
  normalizeEmptyString,
  parsePublishedAt,
  validateContentVisibility,
  validateSlug,
} from "@/lib/admin/validation";
import { requireAdmin } from "@/lib/auth/admin";

export type ResearchPostActionState = {
  fieldErrors?: Record<string, string>;
  message?: string;
  status: "idle" | "error";
};

export const initialResearchPostActionState: ResearchPostActionState = {
  status: "idle",
};

function getRequiredId(formData: FormData) {
  const id = formData.get("id");

  if (typeof id !== "string" || !id.trim()) {
    throw new Error("Research post id is required.");
  }

  return id;
}

function getFormValue(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function getPublishedValue(formData: FormData, currentPublished = false) {
  const intent = getFormValue(formData, "intent");

  if (intent === "publish") {
    return true;
  }

  if (intent === "draft" || intent === "unpublish") {
    return false;
  }

  if (formData.has("published")) {
    return formData.get("published") === "on";
  }

  return currentPublished;
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
): ResearchPostActionState {
  return {
    fieldErrors,
    message,
    status: "error",
  };
}

function revalidatePostPaths(slugs: (string | null | undefined)[] = []) {
  revalidatePath("/admin");
  revalidatePath("/admin/posts");
  revalidatePath("/research");

  for (const slug of new Set(slugs.filter(Boolean))) {
    revalidatePath(`/research/${slug}`);
  }
}

async function publishPostRecord(formData: FormData) {
  await requireAdmin("/admin/posts");
  const post = await getAdminPostById(getRequiredId(formData));

  if (!post) {
    throw new Error("Research post not found.");
  }

  await publishAdminPost(post.id);
  revalidatePostPaths([post.slug]);
}

async function unpublishPostRecord(formData: FormData) {
  await requireAdmin("/admin/posts");
  const post = await getAdminPostById(getRequiredId(formData));

  if (!post) {
    throw new Error("Research post not found.");
  }

  await unpublishAdminPost(post.id);
  revalidatePostPaths([post.slug]);
}

async function deletePostRecord(formData: FormData) {
  await requireAdmin("/admin/posts");
  const post = await getAdminPostById(getRequiredId(formData));

  if (!post) {
    throw new Error("Research post not found.");
  }

  await deleteAdminPost(post.id);
  revalidatePostPaths([post.slug]);
}

function validateExcerptSafety({
  body,
  excerpt,
  fieldErrors,
  visibility,
}: {
  body: string | null;
  excerpt: string | null;
  fieldErrors: Record<string, string>;
  visibility: "free" | "premium" | "pro";
}) {
  if (visibility === "free") {
    return;
  }

  if (!excerpt) {
    addFieldError(
      fieldErrors,
      "excerpt",
      "Premium and pro posts need a safe public excerpt."
    );
    return;
  }

  if (excerpt.length > 320) {
    addFieldError(
      fieldErrors,
      "excerpt",
      "Premium/pro excerpts should be 320 characters or fewer."
    );
  }

  const sensitiveTerm = getSensitivePreviewTerm(excerpt);

  if (sensitiveTerm) {
    addFieldError(
      fieldErrors,
      "excerpt",
      `Premium/pro excerpts cannot include sensitive terms such as "${sensitiveTerm}". Keep exact entries, invalidation, targets, full thesis, and proprietary details in the protected body.`
    );
  }

  if (!body) {
    return;
  }

  const normalizedExcerpt = excerpt.trim().toLowerCase();
  const normalizedBody = body.trim().toLowerCase();

  if (
    normalizedExcerpt === normalizedBody ||
    (normalizedBody.length > 120 &&
      normalizedExcerpt.length > normalizedBody.length * 0.7)
  ) {
    addFieldError(
      fieldErrors,
      "excerpt",
      "Premium/pro excerpts cannot reveal the full body content."
    );
  }
}

function getPublishedAtValue({
  currentPublishedAt,
  parsedPublishedAt,
  published,
}: {
  currentPublishedAt?: string | null;
  parsedPublishedAt: string | null;
  published: boolean;
}) {
  if (!published) {
    // Phase 5 decision: unpublishing clears published_at so the post returns to
    // a clean draft state.
    return null;
  }

  return parsedPublishedAt ?? currentPublishedAt ?? new Date().toISOString();
}

async function buildPostPayload({
  currentId,
  currentPublishedAt,
  currentSlug,
  formData,
}: {
  currentId?: string;
  currentPublishedAt?: string | null;
  currentSlug?: string;
  formData: FormData;
}) {
  const title = getFormValue(formData, "title");
  const slugValue = getFormValue(formData, "slug") || generateSlug(title);
  const published = getPublishedValue(formData, formData.get("current_published") === "true");
  const fieldErrors: Record<string, string> = {};

  if (!title) {
    addFieldError(fieldErrors, "title", "Title is required.");
  }

  const slug = validateSlug(slugValue);
  if (!slug.ok) {
    addFieldError(fieldErrors, "slug", slug.error);
  }

  if (slug.ok && slug.value !== currentSlug) {
    const existingPost = await getAdminPostBySlug(slug.value);

    if (existingPost && existingPost.id !== currentId) {
      addFieldError(fieldErrors, "slug", "Another post already uses this slug.");
    }
  }

  const visibility = validateContentVisibility(
    getFormValue(formData, "visibility")
  );
  if (!visibility.ok) {
    addFieldError(fieldErrors, "visibility", visibility.error);
  }

  const parsedPublishedAt = parsePublishedAt(
    getFormValue(formData, "published_at")
  );
  if (!parsedPublishedAt.ok) {
    addFieldError(fieldErrors, "published_at", parsedPublishedAt.error);
  }

  const excerpt = normalizeEmptyString(getFormValue(formData, "excerpt"));
  const body = normalizeEmptyString(getFormValue(formData, "body"));

  if (visibility.ok) {
    validateExcerptSafety({
      body,
      excerpt,
      fieldErrors,
      visibility: visibility.value,
    });
  }

  if (
    Object.keys(fieldErrors).length > 0 ||
    !slug.ok ||
    !visibility.ok ||
    !parsedPublishedAt.ok
  ) {
    return {
      fieldErrors,
      payload: null,
    };
  }

  return {
    fieldErrors,
    payload: {
      body,
      excerpt,
      published,
      published_at: getPublishedAtValue({
        currentPublishedAt,
        parsedPublishedAt: parsedPublishedAt.value,
        published,
      }),
      slug: slug.value,
      title,
      visibility: visibility.value,
    },
  };
}

export async function createResearchPostAction(
  _state: ResearchPostActionState,
  formData: FormData
): Promise<ResearchPostActionState> {
  await requireAdmin("/admin/posts/new");

  const { fieldErrors, payload } = await buildPostPayload({ formData });

  if (!payload) {
    return errorState("Review the highlighted fields and try again.", fieldErrors);
  }

  let createdId: string;
  let createdSlug: string;

  try {
    const created = await createAdminPost(payload as CreateAdminPostInput);
    createdId = created.id;
    createdSlug = created.slug;
  } catch {
    return errorState(
      "The research post could not be created. Check for duplicate slugs and try again."
    );
  }

  revalidatePostPaths([createdSlug]);
  redirect(`/admin/posts/${createdId}/edit`);
}

export async function updateResearchPostAction(
  _state: ResearchPostActionState,
  formData: FormData
): Promise<ResearchPostActionState> {
  await requireAdmin("/admin/posts");

  const id = getRequiredId(formData);
  const currentPost = await getAdminPostById(id);

  if (!currentPost) {
    return errorState("That research post could not be found.");
  }

  const { fieldErrors, payload } = await buildPostPayload({
    currentId: currentPost.id,
    currentPublishedAt: currentPost.published_at,
    currentSlug: currentPost.slug,
    formData,
  });

  if (!payload) {
    return errorState("Review the highlighted fields and try again.", fieldErrors);
  }

  try {
    await updateAdminPost(id, payload as UpdateAdminPostInput);
  } catch {
    return errorState("The research post could not be updated. Try again.");
  }

  revalidatePostPaths([currentPost.slug, payload.slug]);

  return {
    message: "Research post saved.",
    status: "idle",
  };
}

export async function publishPostAction(formData: FormData) {
  await publishPostRecord(formData);
  redirect("/admin/posts?notice=published");
}

export async function unpublishPostAction(formData: FormData) {
  await unpublishPostRecord(formData);
  redirect("/admin/posts?notice=unpublished");
}

export async function deletePostAction(formData: FormData) {
  await deletePostRecord(formData);
  redirect("/admin/posts?notice=deleted");
}

export async function publishResearchPostAction(formData: FormData) {
  await publishPostRecord(formData);
}

export async function unpublishResearchPostAction(formData: FormData) {
  await unpublishPostRecord(formData);
}

export async function deleteResearchPostAction(formData: FormData) {
  await deletePostRecord(formData);
  redirect("/admin/posts?notice=deleted");
}
