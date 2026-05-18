"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  getMySoftwareAccessRequest,
  requestSoftwareAccess,
  updateMySoftwareAccessRequest,
} from "@/lib/software/requests";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function validateUuid(value: string, fieldName: string) {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value
    )
  ) {
    throw new Error(`${fieldName} is invalid.`);
  }

  return value;
}

function validateSlug(value: string) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
    throw new Error("A valid software slug is required.");
  }

  return value;
}

export async function requestSoftwareAccessAction(formData: FormData) {
  const productId = validateUuid(
    getFormString(formData, "software_product_id"),
    "Software product id"
  );
  const slug = validateSlug(getFormString(formData, "slug"));
  const tradingviewUsername = getFormString(formData, "tradingview_username");
  const userNote = getFormString(formData, "user_note");
  let notice = "software-requested";

  try {
    const supabase = await createSupabaseServerClient();
    const { data: product, error } = await supabase
      .from("software_products")
      .select("id,delivery_type,published")
      .eq("id", productId)
      .eq("published", true)
      .maybeSingle();

    if (error || !product) {
      throw new Error("Software access is unavailable for this product.");
    }

    if (
      product.delivery_type !== "tradingview_invite_only" &&
      product.delivery_type !== "manual_access"
    ) {
      throw new Error("This software product does not require a manual request.");
    }

    const existingRequest = await getMySoftwareAccessRequest(productId);

    if (existingRequest) {
      await updateMySoftwareAccessRequest(productId, {
        tradingviewUsername,
        userNote,
      });
      notice = "software-request-updated";
    } else {
      await requestSoftwareAccess(productId, tradingviewUsername, userNote);
    }
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.toLowerCase().includes("signed in")
    ) {
      redirect(
        `/login?redirectedFrom=${encodeURIComponent(`/dashboard/software/${slug}`)}`
      );
    }

    throw error;
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/software");
  revalidatePath(`/dashboard/software/${slug}`);
  redirect(`/dashboard/software/${slug}?notice=${notice}`);
}
