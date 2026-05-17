export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      email_notifications: {
        Row: {
          content_id: string | null
          content_type: string | null
          created_at: string
          id: string
          notification_type: Database["public"]["Enums"]["notification_type"]
          provider_message_id: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["notification_status"]
          subject: string | null
          user_id: string | null
        }
        Insert: {
          content_id?: string | null
          content_type?: string | null
          created_at?: string
          id?: string
          notification_type: Database["public"]["Enums"]["notification_type"]
          provider_message_id?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          subject?: string | null
          user_id?: string | null
        }
        Update: {
          content_id?: string | null
          content_type?: string | null
          created_at?: string
          id?: string
          notification_type?: Database["public"]["Enums"]["notification_type"]
          provider_message_id?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          subject?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      idea_charts: {
        Row: {
          caption: string | null
          chart_type: Database["public"]["Enums"]["chart_type"]
          created_at: string
          created_by: string | null
          embed_url: string | null
          id: string
          idea_id: string
          image_url: string | null
          interval: string | null
          symbol: string | null
          tradingview_symbol: string | null
          updated_at: string
        }
        Insert: {
          caption?: string | null
          chart_type?: Database["public"]["Enums"]["chart_type"]
          created_at?: string
          created_by?: string | null
          embed_url?: string | null
          id?: string
          idea_id: string
          image_url?: string | null
          interval?: string | null
          symbol?: string | null
          tradingview_symbol?: string | null
          updated_at?: string
        }
        Update: {
          caption?: string | null
          chart_type?: Database["public"]["Enums"]["chart_type"]
          created_at?: string
          created_by?: string | null
          embed_url?: string | null
          id?: string
          idea_id?: string
          image_url?: string | null
          interval?: string | null
          symbol?: string | null
          tradingview_symbol?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "idea_charts_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "trading_ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      idea_tags: {
        Row: {
          idea_id: string
          tag_id: string
        }
        Insert: {
          idea_id: string
          tag_id: string
        }
        Update: {
          idea_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "idea_tags_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "trading_ideas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "idea_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      idea_updates: {
        Row: {
          body: string | null
          created_at: string
          created_by: string | null
          id: string
          idea_id: string
          status_after_update: Database["public"]["Enums"]["idea_status"] | null
          title: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          idea_id: string
          status_after_update?:
            | Database["public"]["Enums"]["idea_status"]
            | null
          title: string
        }
        Update: {
          body?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          idea_id?: string
          status_after_update?:
            | Database["public"]["Enums"]["idea_status"]
            | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "idea_updates_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "trading_ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          body: string | null
          created_at: string
          created_by: string | null
          excerpt: string | null
          id: string
          published: boolean
          published_at: string | null
          slug: string
          title: string
          updated_at: string
          visibility: Database["public"]["Enums"]["content_visibility"]
        }
        Insert: {
          body?: string | null
          created_at?: string
          created_by?: string | null
          excerpt?: string | null
          id?: string
          published?: boolean
          published_at?: string | null
          slug: string
          title: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["content_visibility"]
        }
        Update: {
          body?: string | null
          created_at?: string
          created_by?: string | null
          excerpt?: string | null
          id?: string
          published?: boolean
          published_at?: string | null
          slug?: string
          title?: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["content_visibility"]
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          price_id: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          price_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          price_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      trading_ideas: {
        Row: {
          asset_class: Database["public"]["Enums"]["asset_class"]
          bias: Database["public"]["Enums"]["idea_bias"]
          created_at: string
          created_by: string | null
          educational_purpose_only: boolean
          entry_zone: string | null
          id: string
          invalidation_level: string | null
          position_disclosure: string | null
          public_preview: string | null
          published: boolean
          published_at: string | null
          risk_disclosure: string | null
          risk_level: Database["public"]["Enums"]["risk_level"]
          setup_type: string | null
          slug: string
          status: Database["public"]["Enums"]["idea_status"]
          summary: string | null
          target_1: string | null
          target_2: string | null
          target_3: string | null
          thesis: string | null
          ticker: string
          timeframe: string | null
          title: string
          updated_at: string
          visibility: Database["public"]["Enums"]["content_visibility"]
        }
        Insert: {
          asset_class?: Database["public"]["Enums"]["asset_class"]
          bias?: Database["public"]["Enums"]["idea_bias"]
          created_at?: string
          created_by?: string | null
          educational_purpose_only?: boolean
          entry_zone?: string | null
          id?: string
          invalidation_level?: string | null
          position_disclosure?: string | null
          public_preview?: string | null
          published?: boolean
          published_at?: string | null
          risk_disclosure?: string | null
          risk_level?: Database["public"]["Enums"]["risk_level"]
          setup_type?: string | null
          slug: string
          status?: Database["public"]["Enums"]["idea_status"]
          summary?: string | null
          target_1?: string | null
          target_2?: string | null
          target_3?: string | null
          thesis?: string | null
          ticker: string
          timeframe?: string | null
          title: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["content_visibility"]
        }
        Update: {
          asset_class?: Database["public"]["Enums"]["asset_class"]
          bias?: Database["public"]["Enums"]["idea_bias"]
          created_at?: string
          created_by?: string | null
          educational_purpose_only?: boolean
          entry_zone?: string | null
          id?: string
          invalidation_level?: string | null
          position_disclosure?: string | null
          public_preview?: string | null
          published?: boolean
          published_at?: string | null
          risk_disclosure?: string | null
          risk_level?: Database["public"]["Enums"]["risk_level"]
          setup_type?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["idea_status"]
          summary?: string | null
          target_1?: string | null
          target_2?: string | null
          target_3?: string | null
          thesis?: string | null
          ticker?: string
          timeframe?: string | null
          title?: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["content_visibility"]
        }
        Relationships: []
      }
      watchlist_items: {
        Row: {
          created_at: string
          id: string
          idea_id: string | null
          note: string | null
          ticker: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          idea_id?: string | null
          note?: string | null
          ticker: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          idea_id?: string | null
          note?: string | null
          ticker?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "watchlist_items_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "trading_ideas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_content: {
        Args: {
          required_visibility: Database["public"]["Enums"]["content_visibility"]
        }
        Returns: boolean
      }
      get_post_preview_by_slug: {
        Args: { p_slug: string }
        Returns: {
          excerpt: string
          id: string
          is_locked: boolean
          published_at: string
          slug: string
          title: string
          updated_at: string
          visibility: Database["public"]["Enums"]["content_visibility"]
        }[]
      }
      get_post_previews: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_search?: string
          p_visibility?: Database["public"]["Enums"]["content_visibility"]
        }
        Returns: {
          excerpt: string
          id: string
          is_locked: boolean
          published_at: string
          slug: string
          title: string
          updated_at: string
          visibility: Database["public"]["Enums"]["content_visibility"]
        }[]
      }
      get_trading_idea_preview_by_slug: {
        Args: { p_slug: string }
        Returns: {
          asset_class: Database["public"]["Enums"]["asset_class"]
          bias: Database["public"]["Enums"]["idea_bias"]
          id: string
          is_locked: boolean
          public_preview: string
          published_at: string
          risk_level: Database["public"]["Enums"]["risk_level"]
          setup_type: string
          slug: string
          status: Database["public"]["Enums"]["idea_status"]
          ticker: string
          timeframe: string
          title: string
          updated_at: string
          visibility: Database["public"]["Enums"]["content_visibility"]
        }[]
      }
      get_trading_idea_previews: {
        Args: {
          p_asset_class?: Database["public"]["Enums"]["asset_class"]
          p_limit?: number
          p_offset?: number
          p_search?: string
          p_sort?: string
          p_status?: Database["public"]["Enums"]["idea_status"]
          p_visibility?: Database["public"]["Enums"]["content_visibility"]
        }
        Returns: {
          asset_class: Database["public"]["Enums"]["asset_class"]
          bias: Database["public"]["Enums"]["idea_bias"]
          id: string
          is_locked: boolean
          public_preview: string
          published_at: string
          risk_level: Database["public"]["Enums"]["risk_level"]
          setup_type: string
          slug: string
          status: Database["public"]["Enums"]["idea_status"]
          ticker: string
          timeframe: string
          title: string
          updated_at: string
          visibility: Database["public"]["Enums"]["content_visibility"]
        }[]
      }
      get_user_tier: {
        Args: never
        Returns: Database["public"]["Enums"]["subscription_tier"]
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "user" | "admin"
      asset_class:
        | "stock"
        | "etf"
        | "option"
        | "crypto"
        | "forex"
        | "futures"
        | "index"
        | "macro"
        | "other"
      chart_type: "tradingview_embed" | "image" | "lightweight_chart"
      content_visibility: "free" | "premium" | "pro"
      idea_bias: "long" | "short" | "neutral" | "watch"
      idea_status:
        | "watching"
        | "active"
        | "triggered"
        | "invalidated"
        | "target_hit"
        | "closed"
      notification_status: "pending" | "sent" | "failed"
      notification_type:
        | "new_idea"
        | "idea_update"
        | "new_post"
        | "weekly_digest"
      risk_level: "low" | "medium" | "high"
      subscription_status:
        | "none"
        | "trialing"
        | "active"
        | "past_due"
        | "canceled"
        | "unpaid"
        | "incomplete"
        | "incomplete_expired"
      subscription_tier: "free" | "premium" | "pro"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["user", "admin"],
      asset_class: [
        "stock",
        "etf",
        "option",
        "crypto",
        "forex",
        "futures",
        "index",
        "macro",
        "other",
      ],
      chart_type: ["tradingview_embed", "image", "lightweight_chart"],
      content_visibility: ["free", "premium", "pro"],
      idea_bias: ["long", "short", "neutral", "watch"],
      idea_status: [
        "watching",
        "active",
        "triggered",
        "invalidated",
        "target_hit",
        "closed",
      ],
      notification_status: ["pending", "sent", "failed"],
      notification_type: [
        "new_idea",
        "idea_update",
        "new_post",
        "weekly_digest",
      ],
      risk_level: ["low", "medium", "high"],
      subscription_status: [
        "none",
        "trialing",
        "active",
        "past_due",
        "canceled",
        "unpaid",
        "incomplete",
        "incomplete_expired",
      ],
      subscription_tier: ["free", "premium", "pro"],
    },
  },
} as const
