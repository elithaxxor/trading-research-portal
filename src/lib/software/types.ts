import type { Database } from "@/types/database.types";

export type SoftwareAccessTier =
  Database["public"]["Enums"]["software_access_tier"];
export type SoftwareType = Database["public"]["Enums"]["software_type"];
export type SoftwareDeliveryType =
  Database["public"]["Enums"]["software_delivery_type"];
export type SoftwareAccessRequestStatus =
  Database["public"]["Enums"]["software_access_request_status"];
export type SubscriptionTier =
  Database["public"]["Enums"]["subscription_tier"];

export type SoftwareProduct =
  Database["public"]["Tables"]["software_products"]["Row"];
export type SoftwareProductInsert =
  Database["public"]["Tables"]["software_products"]["Insert"];
export type SoftwareProductUpdate =
  Database["public"]["Tables"]["software_products"]["Update"];
export type SoftwareAccessRequest =
  Database["public"]["Tables"]["software_access_requests"]["Row"];
export type SoftwareAccessRequestUpdate =
  Database["public"]["Tables"]["software_access_requests"]["Update"];

export type SoftwareProductPreview = Pick<
  SoftwareProduct,
  | "access_tier"
  | "delivery_type"
  | "id"
  | "individual_purchase_enabled"
  | "member_download_enabled"
  | "published_at"
  | "short_description"
  | "slug"
  | "software_type"
  | "title"
  | "updated_at"
  | "version"
>;

export type PublicPineScriptPreview = Pick<
  SoftwareProduct,
  | "id"
  | "individual_purchase_enabled"
  | "published_at"
  | "short_description"
  | "slug"
  | "title"
  | "updated_at"
  | "version"
>;

export type SoftwareAccessState =
  | {
      canAccess: true;
      isAdmin: boolean;
      requiredTier: SoftwareAccessTier;
      userTier: SubscriptionTier;
    }
  | {
      canAccess: false;
      isAdmin: boolean;
      reason: string;
      requiredTier: SoftwareAccessTier;
      userTier: SubscriptionTier | null;
    };

export type SoftwareProductPageData =
  | {
      kind: "full";
      product: SoftwareProduct;
    }
  | {
      kind: "locked";
      reason: string;
    }
  | {
      kind: "not_found";
    };

export type SoftwareProductListParams = {
  accessTier?: SoftwareAccessTier;
  limit?: number;
  offset?: number;
  published?: boolean;
  search?: string;
  softwareType?: SoftwareType;
};

export type SoftwareAccessRequestInput = {
  tradingviewUsername?: string | null;
  userNote?: string | null;
};

export type AdminSoftwareAccessRequestUpdateInput = {
  adminNote?: string | null;
  status: SoftwareAccessRequestStatus;
};

export type SoftwareListResult<TItem> = {
  count: number | null;
  items: TItem[];
};
