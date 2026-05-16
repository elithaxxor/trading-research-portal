export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Temporary placeholder. Replace by running Supabase CLI type generation after
// applying migrations. The npm shortcut is `npm run supabase:types`.
export type Database = {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: {
      can_access_content: {
        Args: {
          required_visibility: Database["public"]["Enums"]["content_visibility"];
        };
        Returns: boolean;
      };
      get_user_tier: {
        Args: Record<string, never>;
        Returns: Database["public"]["Enums"]["subscription_tier"];
      };
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: {
      app_role: "user" | "admin";
      subscription_tier: "free" | "premium" | "pro";
      subscription_status:
        | "none"
        | "trialing"
        | "active"
        | "past_due"
        | "canceled"
        | "unpaid"
        | "incomplete"
        | "incomplete_expired";
      content_visibility: "free" | "premium" | "pro";
      asset_class:
        | "stock"
        | "etf"
        | "option"
        | "crypto"
        | "forex"
        | "futures"
        | "index"
        | "macro"
        | "other";
      idea_bias: "long" | "short" | "neutral" | "watch";
      idea_status:
        | "watching"
        | "active"
        | "triggered"
        | "invalidated"
        | "target_hit"
        | "closed";
      risk_level: "low" | "medium" | "high";
      chart_type: "tradingview_embed" | "image" | "lightweight_chart";
      notification_type:
        | "new_idea"
        | "idea_update"
        | "new_post"
        | "weekly_digest";
      notification_status: "pending" | "sent" | "failed";
    };
    CompositeTypes: Record<string, never>;
  };
};
