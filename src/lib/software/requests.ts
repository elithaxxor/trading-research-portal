import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import type {
  AdminSoftwareAccessRequestUpdateInput,
  SoftwareAccessRequestInput,
  SoftwareAccessRequestStatus,
} from "./types";
import {
  validateSoftwareAccessRequestStatus,
  validateSoftwareDescription,
  validateTradingViewUsername,
} from "./validation";

async function getAuthenticatedUserContext() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("You must be signed in to manage software access requests.");
  }

  return {
    supabase,
    user,
  };
}

export async function listMySoftwareAccessRequests() {
  const { supabase, user } = await getAuthenticatedUserContext();
  const { data, error } = await supabase
    .from("software_access_requests")
    .select("*,software_products(title,slug,access_tier,delivery_type,software_type)")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error("Unable to load software access requests.");
  }

  return data ?? [];
}

export async function getMySoftwareAccessRequest(productId: string) {
  const { supabase, user } = await getAuthenticatedUserContext();
  const { data, error } = await supabase
    .from("software_access_requests")
    .select("*")
    .eq("user_id", user.id)
    .eq("software_product_id", productId)
    .maybeSingle();

  if (error) {
    throw new Error("Unable to load software access request.");
  }

  return data;
}

export async function requestSoftwareAccess(
  productId: string,
  tradingviewUsername?: string | null,
  userNote?: string | null
) {
  const { supabase, user } = await getAuthenticatedUserContext();
  const { data, error } = await supabase
    .from("software_access_requests")
    .upsert(
      {
        software_product_id: productId,
        status: "requested",
        tradingview_username: validateTradingViewUsername(tradingviewUsername),
        user_id: user.id,
        user_note: validateSoftwareDescription(userNote),
      },
      {
        onConflict: "user_id,software_product_id",
      }
    )
    .select("*")
    .single();

  if (error) {
    throw new Error("Unable to request software access.");
  }

  return data;
}

export async function updateMySoftwareAccessRequest(
  productId: string,
  input: SoftwareAccessRequestInput
) {
  const { supabase, user } = await getAuthenticatedUserContext();
  const { data, error } = await supabase
    .from("software_access_requests")
    .update({
      tradingview_username: validateTradingViewUsername(
        input.tradingviewUsername
      ),
      user_note: validateSoftwareDescription(input.userNote),
    })
    .eq("user_id", user.id)
    .eq("software_product_id", productId)
    .select("*")
    .single();

  if (error) {
    throw new Error("Unable to update software access request.");
  }

  return data;
}

export async function listAdminSoftwareAccessRequests() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("software_access_requests")
    .select("*,software_products(title,slug,access_tier,delivery_type,software_type)")
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error("Unable to load admin software access requests.");
  }

  return data ?? [];
}

export async function updateSoftwareAccessRequestStatus(
  requestId: string,
  status: SoftwareAccessRequestStatus,
  adminNote?: string | null
) {
  const { supabase, user } = await getAuthenticatedUserContext();
  const nextStatus = validateSoftwareAccessRequestStatus(status);
  const payload: AdminSoftwareAccessRequestUpdateInput & {
    reviewed_at: string;
    reviewed_by: string;
  } = {
    adminNote: validateSoftwareDescription(adminNote),
    reviewed_at: new Date().toISOString(),
    reviewed_by: user.id,
    status: nextStatus,
  };
  const { data, error } = await supabase
    .from("software_access_requests")
    .update({
      admin_note: payload.adminNote,
      reviewed_at: payload.reviewed_at,
      reviewed_by: payload.reviewed_by,
      status: payload.status,
    })
    .eq("id", requestId)
    .select("*")
    .single();

  if (error) {
    throw new Error("Unable to update software access request status.");
  }

  return data;
}
