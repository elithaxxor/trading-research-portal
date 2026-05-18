import type { Database } from "@/types/database.types";

export type ContentVisibility =
  Database["public"]["Enums"]["content_visibility"];
export type ContentAccessState = "full" | "locked" | "not_found";
export type SubscriptionTier =
  Database["public"]["Enums"]["subscription_tier"];
export type AppRole = Database["public"]["Enums"]["app_role"];
export type AssetClass = Database["public"]["Enums"]["asset_class"];
export type IdeaBias = Database["public"]["Enums"]["idea_bias"];
export type IdeaStatus = Database["public"]["Enums"]["idea_status"];
export type IdeaOutcome = Database["public"]["Enums"]["idea_outcome"];
export type RiskLevel = Database["public"]["Enums"]["risk_level"];
export type IdeaPreviewSort = "closed" | "lifecycle" | "published" | "updated";

export type IdeaPreview =
  Database["public"]["Functions"]["get_trading_idea_previews"]["Returns"][number];
export type PostPreview =
  Database["public"]["Functions"]["get_post_previews"]["Returns"][number];

export type IdeaDetail =
  Database["public"]["Tables"]["trading_ideas"]["Row"];
export type IdeaUpdate =
  Database["public"]["Tables"]["idea_updates"]["Row"];
export type IdeaChart =
  Database["public"]["Tables"]["idea_charts"]["Row"];
export type PostDetail = Database["public"]["Tables"]["posts"]["Row"];
export type ProfileDetail =
  Database["public"]["Tables"]["profiles"]["Row"];
export type SubscriptionDetail =
  Database["public"]["Tables"]["subscriptions"]["Row"];

export type ContentListParams = {
  assetClass?: AssetClass;
  limit?: number;
  offset?: number;
  outcome?: IdeaOutcome;
  search?: string;
  sort?: IdeaPreviewSort;
  status?: IdeaStatus;
  updatedRecently?: boolean;
  visibility?: ContentVisibility;
  withClosedReviews?: boolean;
};

export type IdeaFullContent = {
  charts: IdeaChart[];
  idea: IdeaDetail;
  updates: IdeaUpdate[];
};

export type LockedContentResult<TPreview> = {
  kind: "locked";
  preview: TPreview;
};

export type FullContentResult<TContent extends Record<string, unknown>> = {
  kind: "full";
} & TContent;

export type NotFoundContentResult = {
  kind: "not_found";
};

export type IdeaPageData =
  | FullContentResult<IdeaFullContent>
  | LockedContentResult<IdeaPreview>
  | NotFoundContentResult;

export type PostPageData =
  | FullContentResult<{ post: PostDetail }>
  | LockedContentResult<PostPreview>
  | NotFoundContentResult;
