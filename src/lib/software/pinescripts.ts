import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import type { PublicPineScriptPreview, SoftwareProduct } from "./types";

export async function listPublicPineScriptCatalog(): Promise<PublicPineScriptPreview[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("list_public_pinescripts");

  if (error) {
    throw new Error("Unable to load the Pine Script catalog.");
  }

  return data ?? [];
}

export async function listMemberPineScripts(): Promise<SoftwareProduct[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("software_products")
    .select("*")
    .eq("software_type", "pinescript")
    .eq("published", true)
    .order("published_at", { ascending: false, nullsFirst: false });

  if (error) {
    throw new Error("Unable to load member Pine Scripts.");
  }

  return data ?? [];
}
