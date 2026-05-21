"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth/admin";
import {
  createAdminIdea,
  deleteAdminIdea,
  getAdminIdeaById,
  getAdminIdeaBySlug,
  publishAdminIdea,
  unpublishAdminIdea,
  updateAdminIdea,
} from "@/lib/admin/ideas";
import type { CreateAdminIdeaInput, UpdateAdminIdeaInput } from "@/lib/admin/types";
import {
  generateSlug,
  getSensitivePreviewTerm,
  normalizeEmptyString,
  parsePublishedAt,
  validateAssetClass,
  validateContentVisibility,
  validateIdeaBias,
  validateIdeaStatus,
  validateRiskLevel,
  validateSlug,
  validateTicker,
} from "@/lib/admin/validation";
import {
  formatQueueResultMessage,
  queueNewIdeaEmailNotifications,
  shouldNotifyEligibleMembers,
} from "@/lib/email/content-notifications";

export type TradingIdeaActionState = {
  fieldErrors?: Record<string, string>;
  message?: string;
  status: "idle" | "error";
};

export const initialTradingIdeaActionState: TradingIdeaActionState = {
  status: "idle",
};

function getRequiredId(formData: FormData) {
  const id = formData.get("id");

  if (typeof id !== "string" || !id.trim()) {
    throw new Error("Trading idea id is required.");
  }

  return id;
}

function getFormValue(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function getPublishedValue(formData: FormData) {
  const intent = getFormValue(formData, "intent");

  if (intent === "publish") {
    return true;
  }

  if (intent === "draft") {
    return false;
  }

  return formData.get("published") === "on";
}

function getCurrentPublishedValue(formData: FormData, currentPublished = false) {
  const intent = getFormValue(formData, "intent");

  if (intent === "publish") {
    return true;
  }

  if (intent === "unpublish" || intent === "draft") {
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

function validatePremiumPreviewSafety(
  publicPreview: string | null,
  visibility: "free" | "premium" | "pro",
  fieldErrors: Record<string, string>
) {
  if (visibility === "free") {
    return;
  }

  if (!publicPreview) {
    addFieldError(
      fieldErrors,
      "public_preview",
      "Premium and pro ideas need a safe public preview."
    );
    return;
  }

  const sensitiveTerm = getSensitivePreviewTerm(publicPreview);

  if (sensitiveTerm) {
    addFieldError(
      fieldErrors,
      "public_preview",
      `Public previews for premium/pro content cannot include sensitive terms such as "${sensitiveTerm}". Keep exact entries, invalidation, targets, full thesis, and proprietary setup details in the protected fields.`
    );
  }
}

function errorState(
  message: string,
  fieldErrors: Record<string, string> = {}
): TradingIdeaActionState {
  return {
    fieldErrors,
    message,
    status: "error",
  };
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
    // Phase 5 decision: unpublishing clears the publish timestamp so the record
    // returns to a clean draft state.
    return null;
  }

  return parsedPublishedAt ?? currentPublishedAt ?? new Date().toISOString();
}

function revalidateIdeaPaths(slugs: (string | null | undefined)[] = []) {
  revalidatePath("/admin");
  revalidatePath("/admin/ideas");
  revalidatePath("/ideas");

  for (const slug of new Set(slugs.filter(Boolean))) {
    revalidatePath(`/ideas/${slug}`);
  }
}

export async function createTradingIdeaAction(
  _state: TradingIdeaActionState,
  formData: FormData
): Promise<TradingIdeaActionState> {
  await requireAdmin("/admin/ideas/new");

  const title = getFormValue(formData, "title");
  const slugValue = getFormValue(formData, "slug") || generateSlug(title);
  const published = getPublishedValue(formData);
  const notifyByEmail = shouldNotifyEligibleMembers(formData);
  const fieldErrors: Record<string, string> = {};

  if (!title) {
    addFieldError(fieldErrors, "title", "Title is required.");
  }

  const slug = validateSlug(slugValue);
  if (!slug.ok) {
    addFieldError(fieldErrors, "slug", slug.error);
  }

  const ticker = validateTicker(getFormValue(formData, "ticker"));
  if (!ticker.ok) {
    addFieldError(fieldErrors, "ticker", ticker.error);
  }

  const assetClass = validateAssetClass(getFormValue(formData, "asset_class"));
  if (!assetClass.ok) {
    addFieldError(fieldErrors, "asset_class", assetClass.error);
  }

  const bias = validateIdeaBias(getFormValue(formData, "bias"));
  if (!bias.ok) {
    addFieldError(fieldErrors, "bias", bias.error);
  }

  const status = validateIdeaStatus(getFormValue(formData, "status"));
  if (!status.ok) {
    addFieldError(fieldErrors, "status", status.error);
  }

  const visibility = validateContentVisibility(
    getFormValue(formData, "visibility")
  );
  if (!visibility.ok) {
    addFieldError(fieldErrors, "visibility", visibility.error);
  }

  const riskLevel = validateRiskLevel(getFormValue(formData, "risk_level"));
  if (!riskLevel.ok) {
    addFieldError(fieldErrors, "risk_level", riskLevel.error);
  }

  const parsedPublishedAt = parsePublishedAt(
    getFormValue(formData, "published_at")
  );
  if (!parsedPublishedAt.ok) {
    addFieldError(fieldErrors, "published_at", parsedPublishedAt.error);
  }

  const publicPreview = normalizeEmptyString(
    getFormValue(formData, "public_preview")
  );

  if (visibility.ok) {
    validatePremiumPreviewSafety(publicPreview, visibility.value, fieldErrors);
  }

  if (Object.keys(fieldErrors).length > 0) {
    return errorState("Review the highlighted fields and try again.", fieldErrors);
  }

  if (
    !slug.ok ||
    !ticker.ok ||
    !assetClass.ok ||
    !bias.ok ||
    !status.ok ||
    !visibility.ok ||
    !riskLevel.ok ||
    !parsedPublishedAt.ok
  ) {
    return errorState("Review the highlighted fields and try again.");
  }

  const payload: CreateAdminIdeaInput = {
    asset_class: assetClass.value,
    bias: bias.value,
    educational_purpose_only: true,
    entry_zone: normalizeEmptyString(getFormValue(formData, "entry_zone")),
    invalidation_level: normalizeEmptyString(
      getFormValue(formData, "invalidation_level")
    ),
    position_disclosure: normalizeEmptyString(
      getFormValue(formData, "position_disclosure")
    ),
    public_preview: publicPreview,
    published,
    published_at: published ? parsedPublishedAt.value : null,
    risk_disclosure: normalizeEmptyString(
      getFormValue(formData, "risk_disclosure")
    ),
    risk_level: riskLevel.value,
    setup_type: normalizeEmptyString(getFormValue(formData, "setup_type")),
    slug: slug.value,
    status: status.value,
    summary: normalizeEmptyString(getFormValue(formData, "summary")),
    target_1: normalizeEmptyString(getFormValue(formData, "target_1")),
    target_2: normalizeEmptyString(getFormValue(formData, "target_2")),
    target_3: normalizeEmptyString(getFormValue(formData, "target_3")),
    thesis: normalizeEmptyString(getFormValue(formData, "thesis")),
    ticker: ticker.value,
    timeframe: normalizeEmptyString(getFormValue(formData, "timeframe")),
    title,
    visibility: visibility.value,
  };

  let createdSlug = payload.slug;

  try {
    const created = await createAdminIdea(payload);
    createdSlug = created.slug;

    if (notifyByEmail && created.published) {
      await queueNewIdeaEmailNotifications(created);
    }
  } catch {
    return errorState(
      "The trading idea could not be created. Check for duplicate slugs and try again."
    );
  }

  revalidateIdeaPaths([createdSlug]);
  redirect("/admin/ideas");
}

export async function updateTradingIdeaAction(
  _state: TradingIdeaActionState,
  formData: FormData
): Promise<TradingIdeaActionState> {
  await requireAdmin("/admin/ideas");

  const id = getRequiredId(formData);
  const currentIdea = await getAdminIdeaById(id);

  if (!currentIdea) {
    return errorState("That trading idea could not be found.");
  }

  const title = getFormValue(formData, "title");
  const slugValue = getFormValue(formData, "slug") || generateSlug(title);
  const published = getCurrentPublishedValue(formData, currentIdea.published);
  const notifyByEmail = shouldNotifyEligibleMembers(formData);
  const fieldErrors: Record<string, string> = {};

  if (!title) {
    addFieldError(fieldErrors, "title", "Title is required.");
  }

  const slug = validateSlug(slugValue);
  if (!slug.ok) {
    addFieldError(fieldErrors, "slug", slug.error);
  }

  if (slug.ok && slug.value !== currentIdea.slug) {
    const existingIdea = await getAdminIdeaBySlug(slug.value);

    if (existingIdea && existingIdea.id !== id) {
      addFieldError(fieldErrors, "slug", "Another idea already uses this slug.");
    }
  }

  const ticker = validateTicker(getFormValue(formData, "ticker"));
  if (!ticker.ok) {
    addFieldError(fieldErrors, "ticker", ticker.error);
  }

  const assetClass = validateAssetClass(getFormValue(formData, "asset_class"));
  if (!assetClass.ok) {
    addFieldError(fieldErrors, "asset_class", assetClass.error);
  }

  const bias = validateIdeaBias(getFormValue(formData, "bias"));
  if (!bias.ok) {
    addFieldError(fieldErrors, "bias", bias.error);
  }

  const status = validateIdeaStatus(getFormValue(formData, "status"));
  if (!status.ok) {
    addFieldError(fieldErrors, "status", status.error);
  }

  const visibility = validateContentVisibility(
    getFormValue(formData, "visibility")
  );
  if (!visibility.ok) {
    addFieldError(fieldErrors, "visibility", visibility.error);
  }

  const riskLevel = validateRiskLevel(getFormValue(formData, "risk_level"));
  if (!riskLevel.ok) {
    addFieldError(fieldErrors, "risk_level", riskLevel.error);
  }

  const parsedPublishedAt = parsePublishedAt(
    getFormValue(formData, "published_at")
  );
  if (!parsedPublishedAt.ok) {
    addFieldError(fieldErrors, "published_at", parsedPublishedAt.error);
  }

  const publicPreview = normalizeEmptyString(
    getFormValue(formData, "public_preview")
  );

  if (visibility.ok) {
    validatePremiumPreviewSafety(publicPreview, visibility.value, fieldErrors);
  }

  if (Object.keys(fieldErrors).length > 0) {
    return errorState("Review the highlighted fields and try again.", fieldErrors);
  }

  if (
    !slug.ok ||
    !ticker.ok ||
    !assetClass.ok ||
    !bias.ok ||
    !status.ok ||
    !visibility.ok ||
    !riskLevel.ok ||
    !parsedPublishedAt.ok
  ) {
    return errorState("Review the highlighted fields and try again.");
  }

  const payload: UpdateAdminIdeaInput = {
    asset_class: assetClass.value,
    bias: bias.value,
    educational_purpose_only: true,
    entry_zone: normalizeEmptyString(getFormValue(formData, "entry_zone")),
    invalidation_level: normalizeEmptyString(
      getFormValue(formData, "invalidation_level")
    ),
    position_disclosure: normalizeEmptyString(
      getFormValue(formData, "position_disclosure")
    ),
    public_preview: publicPreview,
    published,
    published_at: getPublishedAtValue({
      currentPublishedAt: currentIdea.published_at,
      parsedPublishedAt: parsedPublishedAt.value,
      published,
    }),
    risk_disclosure: normalizeEmptyString(
      getFormValue(formData, "risk_disclosure")
    ),
    risk_level: riskLevel.value,
    setup_type: normalizeEmptyString(getFormValue(formData, "setup_type")),
    slug: slug.value,
    status: status.value,
    summary: normalizeEmptyString(getFormValue(formData, "summary")),
    target_1: normalizeEmptyString(getFormValue(formData, "target_1")),
    target_2: normalizeEmptyString(getFormValue(formData, "target_2")),
    target_3: normalizeEmptyString(getFormValue(formData, "target_3")),
    thesis: normalizeEmptyString(getFormValue(formData, "thesis")),
    ticker: ticker.value,
    timeframe: normalizeEmptyString(getFormValue(formData, "timeframe")),
    title,
    visibility: visibility.value,
  };

  let notificationMessage = "";

  try {
    const updated = await updateAdminIdea(id, payload);

    if (notifyByEmail && !currentIdea.published && updated.published) {
      const queueResult = await queueNewIdeaEmailNotifications(updated);
      notificationMessage = formatQueueResultMessage(queueResult);
    }
  } catch {
    return errorState("The trading idea could not be updated. Try again.");
  }

  revalidateIdeaPaths([currentIdea.slug, slug.value]);

  return {
    message: `Trading idea saved.${notificationMessage}`,
    status: "idle",
  };
}

export async function publishTradingIdeaAction(formData: FormData) {
  await requireAdmin("/admin/ideas");
  const idea = await getAdminIdeaById(getRequiredId(formData));

  if (!idea) {
    throw new Error("Trading idea not found.");
  }

  const published = await publishAdminIdea(idea.id);

  if (shouldNotifyEligibleMembers(formData)) {
    await queueNewIdeaEmailNotifications(published);
  }

  revalidateIdeaPaths([idea.slug]);
}

export async function unpublishTradingIdeaAction(formData: FormData) {
  await requireAdmin("/admin/ideas");
  const idea = await getAdminIdeaById(getRequiredId(formData));

  if (!idea) {
    throw new Error("Trading idea not found.");
  }

  await unpublishAdminIdea(idea.id);
  revalidateIdeaPaths([idea.slug]);
}

export async function deleteTradingIdeaAction(formData: FormData) {
  await requireAdmin("/admin/ideas");
  const idea = await getAdminIdeaById(getRequiredId(formData));

  if (!idea) {
    throw new Error("Trading idea not found.");
  }

  await deleteAdminIdea(idea.id);
  revalidateIdeaPaths([idea.slug]);
  redirect("/admin/ideas?notice=deleted");
}

export async function publishIdeaAction(formData: FormData) {
  await publishTradingIdeaAction(formData);
  redirect("/admin/ideas?notice=published");
}

export async function unpublishIdeaAction(formData: FormData) {
  await unpublishTradingIdeaAction(formData);
  redirect("/admin/ideas?notice=unpublished");
}

export async function deleteIdeaAction(formData: FormData) {
  await deleteTradingIdeaAction(formData);
}
