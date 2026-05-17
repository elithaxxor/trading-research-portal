import "server-only";

import type { Database } from "@/types/database.types";

export type AdminTableRow<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type AdminTableInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type AdminTableUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

export type AdminIdea = AdminTableRow<"trading_ideas">;
export type AdminIdeaInsert = AdminTableInsert<"trading_ideas">;
export type AdminIdeaUpdate = AdminTableUpdate<"trading_ideas">;
export type AdminPost = AdminTableRow<"posts">;
export type AdminPostInsert = AdminTableInsert<"posts">;
export type AdminPostUpdate = AdminTableUpdate<"posts">;
export type AdminTag = AdminTableRow<"tags">;
export type AdminTagInsert = AdminTableInsert<"tags">;
export type AdminTagUpdate = AdminTableUpdate<"tags">;
export type AdminIdeaUpdateRecord = AdminTableRow<"idea_updates">;
export type AdminIdeaUpdateInsert = AdminTableInsert<"idea_updates">;
export type AdminIdeaUpdateUpdate = AdminTableUpdate<"idea_updates">;
export type AdminIdeaChart = AdminTableRow<"idea_charts">;
export type AdminIdeaChartInsert = AdminTableInsert<"idea_charts">;
export type AdminIdeaChartUpdate = AdminTableUpdate<"idea_charts">;
export type AdminIdeaTag = AdminTableRow<"idea_tags">;

export type AdminTagWithUsage = AdminTag & {
  ideaCount: number;
};

export type AdminContentVisibility =
  Database["public"]["Enums"]["content_visibility"];
export type AdminIdeaStatus = Database["public"]["Enums"]["idea_status"];
export type AdminAssetClass = Database["public"]["Enums"]["asset_class"];
export type AdminChartType = Database["public"]["Enums"]["chart_type"];

export type AdminListParams = {
  assetClass?: AdminAssetClass;
  limit?: number;
  offset?: number;
  published?: boolean;
  search?: string;
  status?: AdminIdeaStatus;
  visibility?: AdminContentVisibility;
};

export type AdminListResult<TItem> = {
  count: number | null;
  items: TItem[];
};

export type CreateAdminIdeaInput = Omit<
  AdminIdeaInsert,
  "created_at" | "created_by" | "id" | "updated_at"
>;

export type UpdateAdminIdeaInput = Omit<
  AdminIdeaUpdate,
  "created_at" | "created_by" | "id" | "updated_at"
>;

export type CreateAdminPostInput = Omit<
  AdminPostInsert,
  "created_at" | "created_by" | "id" | "updated_at"
>;

export type UpdateAdminPostInput = Omit<
  AdminPostUpdate,
  "created_at" | "created_by" | "id" | "updated_at"
>;

export type CreateAdminTagInput = Omit<AdminTagInsert, "created_at" | "id">;
export type UpdateAdminTagInput = Omit<AdminTagUpdate, "created_at" | "id">;

export type CreateIdeaUpdateInput = Omit<
  AdminIdeaUpdateInsert,
  "created_at" | "created_by" | "id" | "idea_id"
>;

export type UpdateIdeaUpdateInput = Omit<
  AdminIdeaUpdateUpdate,
  "created_at" | "created_by" | "id" | "idea_id"
>;

export type CreateIdeaChartInput = Omit<
  AdminIdeaChartInsert,
  "created_at" | "created_by" | "id" | "idea_id" | "updated_at"
>;

export type UpdateIdeaChartInput = Omit<
  AdminIdeaChartUpdate,
  "created_at" | "created_by" | "id" | "idea_id" | "updated_at"
>;

export type AdminOverviewStats = {
  draftIdeas: number;
  latestUpdates: AdminIdeaUpdateRecord[];
  publishedIdeas: number;
  publishedPosts: number;
  totalIdeas: number;
  totalPosts: number;
  totalTags: number;
};

export const DEFAULT_ADMIN_LIST_LIMIT = 25;
export const MAX_ADMIN_LIST_LIMIT = 100;

export function getAdminListRange(params: AdminListParams = {}) {
  const safeLimit = Math.min(
    Math.max(Math.floor(params.limit ?? DEFAULT_ADMIN_LIST_LIMIT), 1),
    MAX_ADMIN_LIST_LIMIT
  );
  const safeOffset = Math.max(Math.floor(params.offset ?? 0), 0);

  return {
    from: safeOffset,
    limit: safeLimit,
    to: safeOffset + safeLimit - 1,
  };
}

export function normalizeAdminSearch(search?: string) {
  const normalized = search?.trim().replace(/\s+/g, " ");

  if (!normalized) {
    return null;
  }

  return normalized.replace(/[%(),]/g, " ").trim().slice(0, 100);
}
