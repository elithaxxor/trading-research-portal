import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import { getCurrentSoftwareAccessTier, getSoftwareLockedReason } from "./access";
import type {
  SoftwareListResult,
  SoftwareProduct,
  SoftwareProductListParams,
  SoftwareProductPageData,
  SoftwareProductPreview,
} from "./types";
import {
  validateSoftwareAccessTier,
  validateSoftwareSlug,
  validateSoftwareType,
} from "./validation";

const DEFAULT_SOFTWARE_LIST_LIMIT = 24;
const MAX_SOFTWARE_LIST_LIMIT = 100;

function getListRange(params: SoftwareProductListParams = {}) {
  const safeLimit = Math.min(
    Math.max(Math.floor(params.limit ?? DEFAULT_SOFTWARE_LIST_LIMIT), 1),
    MAX_SOFTWARE_LIST_LIMIT
  );
  const safeOffset = Math.max(Math.floor(params.offset ?? 0), 0);

  return {
    from: safeOffset,
    to: safeOffset + safeLimit - 1,
  };
}

function normalizeSearch(search?: string) {
  const normalized = search?.trim().replace(/\s+/g, " ");

  if (!normalized) {
    return null;
  }

  return normalized.replace(/[%(),]/g, " ").trim().slice(0, 100);
}

function toSoftwareProductPreview(
  product: SoftwareProduct
): SoftwareProductPreview {
  return {
    access_tier: product.access_tier,
    delivery_type: product.delivery_type,
    id: product.id,
    individual_purchase_enabled: product.individual_purchase_enabled,
    member_download_enabled: product.member_download_enabled,
    published_at: product.published_at,
    short_description: product.short_description,
    slug: product.slug,
    software_type: product.software_type,
    title: product.title,
    updated_at: product.updated_at,
    version: product.version,
  };
}

export async function listAccessibleSoftwareProducts(
  params: SoftwareProductListParams = {}
): Promise<SoftwareListResult<SoftwareProduct>> {
  const supabase = await createSupabaseServerClient();
  const { from, to } = getListRange(params);
  const search = normalizeSearch(params.search);
  let query = supabase
    .from("software_products")
    .select("*", { count: "exact" })
    .eq("published", params.published ?? true);

  if (params.accessTier) {
    query = query.eq("access_tier", validateSoftwareAccessTier(params.accessTier));
  }

  if (params.softwareType) {
    query = query.eq("software_type", validateSoftwareType(params.softwareType));
  }

  if (search) {
    const pattern = `%${search}%`;
    query = query.or(
      `title.ilike.${pattern},slug.ilike.${pattern},short_description.ilike.${pattern},version.ilike.${pattern}`
    );
  }

  const { count, data, error } = await query
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("updated_at", { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error("Unable to load accessible software products.");
  }

  return {
    count,
    items: data ?? [],
  };
}

export async function listSoftwareProductPreviews(
  params: SoftwareProductListParams = {}
): Promise<SoftwareListResult<SoftwareProductPreview>> {
  const result = await listAccessibleSoftwareProducts(params);

  return {
    count: result.count,
    items: result.items.map(toSoftwareProductPreview),
  };
}

export async function getSoftwareProductBySlug(slug: string) {
  const normalizedSlug = validateSoftwareSlug(slug);
  const { isAdmin } = await getCurrentSoftwareAccessTier();
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("software_products")
    .select("*")
    .eq("slug", normalizedSlug);

  if (!isAdmin) {
    query = query.eq("published", true);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error("Unable to load software product.");
  }

  return data;
}

export async function getSoftwareProductPageData(
  slug: string
): Promise<SoftwareProductPageData> {
  const product = await getSoftwareProductBySlug(slug);

  if (product) {
    return {
      kind: "full",
      product,
    };
  }

  const { isAdmin, userTier } = await getCurrentSoftwareAccessTier();

  if (!isAdmin && (!userTier || userTier === "free" || userTier === "premium")) {
    return {
      kind: "locked",
      reason: getSoftwareLockedReason(
        userTier === "premium" ? "pro" : "premium_lite",
        userTier,
        isAdmin
      ),
    };
  }

  return {
    kind: "not_found",
  };
}

export async function listAdminSoftwareProducts(
  params: SoftwareProductListParams = {}
): Promise<SoftwareListResult<SoftwareProduct>> {
  const supabase = await createSupabaseServerClient();
  const { from, to } = getListRange(params);
  const search = normalizeSearch(params.search);
  let query = supabase.from("software_products").select("*", { count: "exact" });

  if (params.published !== undefined) {
    query = query.eq("published", params.published);
  }

  if (params.accessTier) {
    query = query.eq("access_tier", validateSoftwareAccessTier(params.accessTier));
  }

  if (params.softwareType) {
    query = query.eq("software_type", validateSoftwareType(params.softwareType));
  }

  if (search) {
    const pattern = `%${search}%`;
    query = query.or(
      `title.ilike.${pattern},slug.ilike.${pattern},short_description.ilike.${pattern},version.ilike.${pattern}`
    );
  }

  const { count, data, error } = await query
    .order("updated_at", { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error("Unable to load admin software products.");
  }

  return {
    count,
    items: data ?? [],
  };
}

export async function getAdminSoftwareProductById(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("software_products")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error("Unable to load admin software product.");
  }

  return data;
}
