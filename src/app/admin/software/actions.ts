"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { generateSlug, normalizeEmptyString, parsePublishedAt } from "@/lib/admin/validation";
import { requireAdmin } from "@/lib/auth/admin";
import { captureSafeException } from "@/lib/monitoring/sentry";
import { recordOpsEventSafely } from "@/lib/ops/events";
import type {
  SoftwareProductInsert,
  SoftwareProductUpdate,
} from "@/lib/software/types";
import {
  sanitizeSoftwareUrl,
  validateSoftwareAccessTier,
  validateSoftwareDeliveryType,
  validateSoftwareDescription,
  validateSoftwareDocumentation,
  validateSoftwareSlug,
  validateSoftwareType,
} from "@/lib/software/validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SoftwareProductActionState = {
  fieldErrors?: Record<string, string>;
  message?: string;
  status: "idle" | "error";
};

export const initialSoftwareProductActionState: SoftwareProductActionState = {
  status: "idle",
};

function getFormValue(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function getRequiredId(formData: FormData, key = "id") {
  const value = getFormValue(formData, key);

  if (!value) {
    throw new Error(`${key} is required.`);
  }

  return value;
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
): SoftwareProductActionState {
  return {
    fieldErrors,
    message,
    status: "error",
  };
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
    return null;
  }

  return parsedPublishedAt ?? currentPublishedAt ?? new Date().toISOString();
}

function getOptionalValidatedText({
  fieldErrors,
  fieldName,
  formData,
  key,
  maxLength = "description",
  required = false,
}: {
  fieldErrors: Record<string, string>;
  fieldName: string;
  formData: FormData;
  key: string;
  maxLength?: "description" | "documentation";
  required?: boolean;
}) {
  try {
    const value = getFormValue(formData, key);

    if (maxLength === "documentation") {
      return validateSoftwareDocumentation(value, { required });
    }

    return validateSoftwareDescription(value, { required });
  } catch (error) {
    addFieldError(
      fieldErrors,
      key,
      error instanceof Error ? error.message : `${fieldName} is invalid.`
    );
    return null;
  }
}

function getOptionalUrl(
  formData: FormData,
  key: string,
  fieldErrors: Record<string, string>
) {
  try {
    return sanitizeSoftwareUrl(getFormValue(formData, key));
  } catch (error) {
    addFieldError(
      fieldErrors,
      key,
      error instanceof Error ? error.message : "Enter a safe http or https URL."
    );
    return null;
  }
}

async function getSoftwareProductById(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("software_products")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error("Unable to load software product.");
  }

  return data;
}

async function getSoftwareProductBySlug(slug: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("software_products")
    .select("id,slug")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw new Error("Unable to check software slug.");
  }

  return data;
}

function revalidateSoftwarePaths(slugs: (string | null | undefined)[] = []) {
  revalidatePath("/admin/software");
  revalidatePath("/admin/software/requests");
  revalidatePath("/dashboard/software");

  for (const slug of new Set(slugs.filter(Boolean))) {
    revalidatePath(`/dashboard/software/${slug}`);
  }
}

async function buildSoftwarePayload({
  currentId,
  currentPublished,
  currentPublishedAt,
  currentSlug,
  formData,
}: {
  currentId?: string;
  currentPublished?: boolean;
  currentPublishedAt?: string | null;
  currentSlug?: string;
  formData: FormData;
}) {
  const fieldErrors: Record<string, string> = {};
  const title = getFormValue(formData, "title");
  const slugValue = getFormValue(formData, "slug") || generateSlug(title);
  const published = getPublishedValue(formData, currentPublished);

  if (!title) {
    addFieldError(fieldErrors, "title", "Title is required.");
  }

  let slug: string | null = null;

  try {
    slug = validateSoftwareSlug(slugValue);
  } catch (error) {
    addFieldError(
      fieldErrors,
      "slug",
      error instanceof Error ? error.message : "Slug is invalid."
    );
  }

  if (slug && slug !== currentSlug) {
    const existing = await getSoftwareProductBySlug(slug);

    if (existing && existing.id !== currentId) {
      addFieldError(fieldErrors, "slug", "Another software product already uses this slug.");
    }
  }

  let softwareType: SoftwareProductInsert["software_type"] | null = null;
  let accessTier: SoftwareProductInsert["access_tier"] | null = null;
  let deliveryType: SoftwareProductInsert["delivery_type"] | null = null;

  try {
    softwareType = validateSoftwareType(getFormValue(formData, "software_type"));
  } catch (error) {
    addFieldError(fieldErrors, "software_type", error instanceof Error ? error.message : "Software type is invalid.");
  }

  try {
    accessTier = validateSoftwareAccessTier(getFormValue(formData, "access_tier"));
  } catch (error) {
    addFieldError(fieldErrors, "access_tier", error instanceof Error ? error.message : "Access tier is invalid.");
  }

  try {
    deliveryType = validateSoftwareDeliveryType(getFormValue(formData, "delivery_type"));
  } catch (error) {
    addFieldError(fieldErrors, "delivery_type", error instanceof Error ? error.message : "Delivery type is invalid.");
  }

  const shortDescription = getOptionalValidatedText({
    fieldErrors,
    fieldName: "Short description",
    formData,
    key: "short_description",
    required: true,
  });
  const fullDescription = getOptionalValidatedText({
    fieldErrors,
    fieldName: "Full description",
    formData,
    key: "full_description",
  });
  const version = normalizeEmptyString(getFormValue(formData, "version"));

  if (!version) {
    addFieldError(fieldErrors, "version", "Version is required.");
  }

  const releaseNotes = getOptionalValidatedText({
    fieldErrors,
    fieldName: "Release notes",
    formData,
    key: "release_notes",
    maxLength: "documentation",
  });
  const documentation = getOptionalValidatedText({
    fieldErrors,
    fieldName: "Documentation",
    formData,
    key: "documentation",
    maxLength: "documentation",
  });
  const setupInstructions = getOptionalValidatedText({
    fieldErrors,
    fieldName: "Setup instructions",
    formData,
    key: "setup_instructions",
    maxLength: "documentation",
  });
  const riskDisclosure = getOptionalValidatedText({
    fieldErrors,
    fieldName: "Risk disclosure",
    formData,
    key: "risk_disclosure",
    maxLength: "documentation",
  });
  const parsedPublishedAt = parsePublishedAt(getFormValue(formData, "published_at"));

  if (!parsedPublishedAt.ok) {
    addFieldError(fieldErrors, "published_at", parsedPublishedAt.error);
  }

  if (
    Object.keys(fieldErrors).length > 0 ||
    !slug ||
    !softwareType ||
    !accessTier ||
    !deliveryType ||
    !shortDescription ||
    !version ||
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
      access_tier: accessTier,
      delivery_type: deliveryType,
      documentation,
      download_url: getOptionalUrl(formData, "download_url", fieldErrors),
      external_url: getOptionalUrl(formData, "external_url", fieldErrors),
      full_description: fullDescription,
      published,
      published_at: getPublishedAtValue({
        currentPublishedAt,
        parsedPublishedAt: parsedPublishedAt.value,
        published,
      }),
      release_notes: releaseNotes,
      risk_disclosure: riskDisclosure,
      setup_instructions: setupInstructions,
      short_description: shortDescription,
      slug,
      software_type: softwareType,
      title,
      tradingview_script_name: normalizeEmptyString(
        getFormValue(formData, "tradingview_script_name")
      ),
      tradingview_script_url: getOptionalUrl(
        formData,
        "tradingview_script_url",
        fieldErrors
      ),
      version,
    } satisfies SoftwareProductInsert | SoftwareProductUpdate,
  };
}

export async function createSoftwareProductAction(
  _state: SoftwareProductActionState,
  formData: FormData
): Promise<SoftwareProductActionState> {
  const admin = await requireAdmin("/admin/software/new");
  const { fieldErrors, payload } = await buildSoftwarePayload({ formData });

  if (!payload || Object.keys(fieldErrors).length > 0) {
    return errorState("Review the highlighted software fields and try again.", fieldErrors);
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("software_products")
    .insert({
      ...payload,
      created_by: admin.user.id,
    })
    .select("id,slug")
    .single();

  if (error) {
    captureSafeException(error, {
      area: "admin",
      extra: {
        access_tier: payload.access_tier,
        delivery_type: payload.delivery_type,
        published: payload.published,
        software_type: payload.software_type,
      },
      route: "/admin/software/new",
      stage: "admin_software_create",
      tags: {
        admin_user_present: Boolean(admin.user.id),
      },
    });
    return errorState("Software product could not be created. Check for duplicate slugs and try again.");
  }

  await recordOpsEventSafely({
    entityId: data.id,
    entityType: "software_product",
    eventName: payload.published
      ? "admin_content_published"
      : "admin_content_updated",
    metadata: {
      access_tier: payload.access_tier,
      content_type: "software_product",
      delivery_type: payload.delivery_type,
      published: payload.published,
      software_type: payload.software_type,
    },
    route: "/admin/software/new",
    source: "admin",
    userId: admin.user.id,
  });

  revalidateSoftwarePaths([data.slug]);
  redirect(`/admin/software/${data.id}/edit?notice=created`);
}

export async function updateSoftwareProductAction(
  _state: SoftwareProductActionState,
  formData: FormData
): Promise<SoftwareProductActionState> {
  const admin = await requireAdmin("/admin/software");
  const id = getRequiredId(formData);
  const currentProduct = await getSoftwareProductById(id);

  if (!currentProduct) {
    return errorState("Software product could not be found.");
  }

  const { fieldErrors, payload } = await buildSoftwarePayload({
    currentId: currentProduct.id,
    currentPublished: currentProduct.published,
    currentPublishedAt: currentProduct.published_at,
    currentSlug: currentProduct.slug,
    formData,
  });

  if (!payload || Object.keys(fieldErrors).length > 0) {
    return errorState("Review the highlighted software fields and try again.", fieldErrors);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("software_products")
    .update(payload)
    .eq("id", id);

  if (error) {
    captureSafeException(error, {
      area: "admin",
      extra: {
        access_tier: payload.access_tier,
        delivery_type: payload.delivery_type,
        next_published: payload.published,
        previous_published: currentProduct.published,
        software_type: payload.software_type,
      },
      route: `/admin/software/${id}/edit`,
      stage: "admin_software_update",
      tags: {
        admin_user_present: Boolean(admin.user.id),
      },
    });
    return errorState("Software product could not be saved.");
  }

  await recordOpsEventSafely({
    entityId: id,
    entityType: "software_product",
    eventName:
      !currentProduct.published && payload.published
        ? "admin_content_published"
        : "admin_content_updated",
    metadata: {
      access_tier: payload.access_tier,
      content_type: "software_product",
      delivery_type: payload.delivery_type,
      next_published: payload.published,
      previous_published: currentProduct.published,
      software_type: payload.software_type,
    },
    route: `/admin/software/${id}/edit`,
    source: "admin",
    userId: admin.user.id,
  });

  revalidateSoftwarePaths([currentProduct.slug, payload.slug]);

  return {
    message: "Software product saved.",
    status: "idle",
  };
}

export async function publishSoftwareProductAction(formData: FormData) {
  const admin = await requireAdmin("/admin/software");
  const product = await getSoftwareProductById(getRequiredId(formData));

  if (!product) {
    throw new Error("Software product not found.");
  }

  const supabase = await createSupabaseServerClient();
  await supabase
    .from("software_products")
    .update({
      published: true,
      published_at: product.published_at ?? new Date().toISOString(),
    })
    .eq("id", product.id)
    .throwOnError();

  await recordOpsEventSafely({
    entityId: product.id,
    entityType: "software_product",
    eventName: "admin_content_published",
    metadata: {
      access_tier: product.access_tier,
      content_type: "software_product",
      delivery_type: product.delivery_type,
      software_type: product.software_type,
    },
    route: "/admin/software",
    source: "admin",
    userId: admin.user.id,
  });

  revalidateSoftwarePaths([product.slug]);
  redirect("/admin/software?notice=published");
}

export async function unpublishSoftwareProductAction(formData: FormData) {
  const admin = await requireAdmin("/admin/software");
  const product = await getSoftwareProductById(getRequiredId(formData));

  if (!product) {
    throw new Error("Software product not found.");
  }

  const supabase = await createSupabaseServerClient();
  await supabase
    .from("software_products")
    .update({
      published: false,
      published_at: null,
    })
    .eq("id", product.id)
    .throwOnError();

  await recordOpsEventSafely({
    entityId: product.id,
    entityType: "software_product",
    eventName: "admin_content_updated",
    metadata: {
      action: "unpublished",
      access_tier: product.access_tier,
      content_type: "software_product",
      delivery_type: product.delivery_type,
      software_type: product.software_type,
    },
    route: "/admin/software",
    source: "admin",
    userId: admin.user.id,
  });

  revalidateSoftwarePaths([product.slug]);
  redirect("/admin/software?notice=unpublished");
}

export async function deleteSoftwareProductAction(formData: FormData) {
  await requireAdmin("/admin/software");
  const product = await getSoftwareProductById(getRequiredId(formData));

  if (!product) {
    throw new Error("Software product not found.");
  }

  const supabase = await createSupabaseServerClient();
  await supabase
    .from("software_products")
    .delete()
    .eq("id", product.id)
    .throwOnError();

  revalidateSoftwarePaths([product.slug]);
  redirect("/admin/software?notice=deleted");
}
