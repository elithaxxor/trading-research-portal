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
      followed_tickers: {
        Row: {
          created_at: string
          id: string
          note: string | null
          ticker: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          ticker: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          ticker?: string
          updated_at?: string
          user_id?: string
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
          event_at: string
          event_type: Database["public"]["Enums"]["idea_lifecycle_event_type"]
          id: string
          idea_id: string
          is_major: boolean
          outcome_after: Database["public"]["Enums"]["idea_outcome"] | null
          status_after_update: Database["public"]["Enums"]["idea_status"] | null
          status_before: Database["public"]["Enums"]["idea_status"] | null
          title: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          created_by?: string | null
          event_at?: string
          event_type?: Database["public"]["Enums"]["idea_lifecycle_event_type"]
          id?: string
          idea_id: string
          is_major?: boolean
          outcome_after?: Database["public"]["Enums"]["idea_outcome"] | null
          status_after_update?:
            | Database["public"]["Enums"]["idea_status"]
            | null
          status_before?: Database["public"]["Enums"]["idea_status"] | null
          title: string
        }
        Update: {
          body?: string | null
          created_at?: string
          created_by?: string | null
          event_at?: string
          event_type?: Database["public"]["Enums"]["idea_lifecycle_event_type"]
          id?: string
          idea_id?: string
          is_major?: boolean
          outcome_after?: Database["public"]["Enums"]["idea_outcome"] | null
          status_after_update?:
            | Database["public"]["Enums"]["idea_status"]
            | null
          status_before?: Database["public"]["Enums"]["idea_status"] | null
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
      member_dashboard_preferences: {
        Row: {
          created_at: string
          default_sort: Database["public"]["Enums"]["member_sort_preference"]
          default_view: Database["public"]["Enums"]["member_dashboard_view"]
          preferred_asset_classes: Database["public"]["Enums"]["asset_class"][]
          preferred_statuses: Database["public"]["Enums"]["idea_status"][]
          preferred_visibility: Database["public"]["Enums"]["content_visibility"][]
          show_charts_on_dashboard: boolean
          show_closed_reviews: boolean
          show_locked_previews: boolean
          show_software_section: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          default_sort?: Database["public"]["Enums"]["member_sort_preference"]
          default_view?: Database["public"]["Enums"]["member_dashboard_view"]
          preferred_asset_classes?: Database["public"]["Enums"]["asset_class"][]
          preferred_statuses?: Database["public"]["Enums"]["idea_status"][]
          preferred_visibility?: Database["public"]["Enums"]["content_visibility"][]
          show_charts_on_dashboard?: boolean
          show_closed_reviews?: boolean
          show_locked_previews?: boolean
          show_software_section?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          default_sort?: Database["public"]["Enums"]["member_sort_preference"]
          default_view?: Database["public"]["Enums"]["member_dashboard_view"]
          preferred_asset_classes?: Database["public"]["Enums"]["asset_class"][]
          preferred_statuses?: Database["public"]["Enums"]["idea_status"][]
          preferred_visibility?: Database["public"]["Enums"]["content_visibility"][]
          show_charts_on_dashboard?: boolean
          show_closed_reviews?: boolean
          show_locked_previews?: boolean
          show_software_section?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      member_idea_notes: {
        Row: {
          created_at: string
          id: string
          idea_id: string
          note: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          idea_id: string
          note: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          idea_id?: string
          note?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_idea_notes_idea_id_fkey"
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
      saved_ideas: {
        Row: {
          created_at: string
          id: string
          idea_id: string
          note: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          idea_id: string
          note?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          idea_id?: string
          note?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_ideas_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "trading_ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      software_access_requests: {
        Row: {
          admin_note: string | null
          created_at: string
          id: string
          requested_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          software_product_id: string
          status: Database["public"]["Enums"]["software_access_request_status"]
          tradingview_username: string | null
          updated_at: string
          user_id: string
          user_note: string | null
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          id?: string
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          software_product_id: string
          status?: Database["public"]["Enums"]["software_access_request_status"]
          tradingview_username?: string | null
          updated_at?: string
          user_id: string
          user_note?: string | null
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          id?: string
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          software_product_id?: string
          status?: Database["public"]["Enums"]["software_access_request_status"]
          tradingview_username?: string | null
          updated_at?: string
          user_id?: string
          user_note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "software_access_requests_software_product_id_fkey"
            columns: ["software_product_id"]
            isOneToOne: false
            referencedRelation: "software_products"
            referencedColumns: ["id"]
          },
        ]
      }
      software_products: {
        Row: {
          access_tier: Database["public"]["Enums"]["software_access_tier"]
          created_at: string
          created_by: string | null
          delivery_type: Database["public"]["Enums"]["software_delivery_type"]
          documentation: string | null
          download_url: string | null
          external_url: string | null
          full_description: string | null
          id: string
          published: boolean
          published_at: string | null
          release_notes: string | null
          risk_disclosure: string | null
          setup_instructions: string | null
          short_description: string | null
          slug: string
          software_type: Database["public"]["Enums"]["software_type"]
          title: string
          tradingview_script_name: string | null
          tradingview_script_url: string | null
          updated_at: string
          version: string | null
        }
        Insert: {
          access_tier: Database["public"]["Enums"]["software_access_tier"]
          created_at?: string
          created_by?: string | null
          delivery_type?: Database["public"]["Enums"]["software_delivery_type"]
          documentation?: string | null
          download_url?: string | null
          external_url?: string | null
          full_description?: string | null
          id?: string
          published?: boolean
          published_at?: string | null
          release_notes?: string | null
          risk_disclosure?: string | null
          setup_instructions?: string | null
          short_description?: string | null
          slug: string
          software_type?: Database["public"]["Enums"]["software_type"]
          title: string
          tradingview_script_name?: string | null
          tradingview_script_url?: string | null
          updated_at?: string
          version?: string | null
        }
        Update: {
          access_tier?: Database["public"]["Enums"]["software_access_tier"]
          created_at?: string
          created_by?: string | null
          delivery_type?: Database["public"]["Enums"]["software_delivery_type"]
          documentation?: string | null
          download_url?: string | null
          external_url?: string | null
          full_description?: string | null
          id?: string
          published?: boolean
          published_at?: string | null
          release_notes?: string | null
          risk_disclosure?: string | null
          setup_instructions?: string | null
          short_description?: string | null
          slug?: string
          software_type?: Database["public"]["Enums"]["software_type"]
          title?: string
          tradingview_script_name?: string | null
          tradingview_script_url?: string | null
          updated_at?: string
          version?: string | null
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
          closed_at: string | null
          created_at: string
          created_by: string | null
          educational_purpose_only: boolean
          entry_zone: string | null
          id: string
          invalidated_at: string | null
          invalidation_level: string | null
          last_lifecycle_event_at: string | null
          lessons_learned: string | null
          outcome: Database["public"]["Enums"]["idea_outcome"]
          outcome_summary: string | null
          position_disclosure: string | null
          public_preview: string | null
          published: boolean
          published_at: string | null
          review_published: boolean
          review_published_at: string | null
          risk_disclosure: string | null
          risk_level: Database["public"]["Enums"]["risk_level"]
          setup_type: string | null
          slug: string
          status: Database["public"]["Enums"]["idea_status"]
          summary: string | null
          target_1: string | null
          target_1_hit_at: string | null
          target_2: string | null
          target_2_hit_at: string | null
          target_3: string | null
          target_3_hit_at: string | null
          thesis: string | null
          ticker: string
          timeframe: string | null
          title: string
          trigger_level: string | null
          triggered_at: string | null
          updated_at: string
          visibility: Database["public"]["Enums"]["content_visibility"]
        }
        Insert: {
          asset_class?: Database["public"]["Enums"]["asset_class"]
          bias?: Database["public"]["Enums"]["idea_bias"]
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          educational_purpose_only?: boolean
          entry_zone?: string | null
          id?: string
          invalidated_at?: string | null
          invalidation_level?: string | null
          last_lifecycle_event_at?: string | null
          lessons_learned?: string | null
          outcome?: Database["public"]["Enums"]["idea_outcome"]
          outcome_summary?: string | null
          position_disclosure?: string | null
          public_preview?: string | null
          published?: boolean
          published_at?: string | null
          review_published?: boolean
          review_published_at?: string | null
          risk_disclosure?: string | null
          risk_level?: Database["public"]["Enums"]["risk_level"]
          setup_type?: string | null
          slug: string
          status?: Database["public"]["Enums"]["idea_status"]
          summary?: string | null
          target_1?: string | null
          target_1_hit_at?: string | null
          target_2?: string | null
          target_2_hit_at?: string | null
          target_3?: string | null
          target_3_hit_at?: string | null
          thesis?: string | null
          ticker: string
          timeframe?: string | null
          title: string
          trigger_level?: string | null
          triggered_at?: string | null
          updated_at?: string
          visibility?: Database["public"]["Enums"]["content_visibility"]
        }
        Update: {
          asset_class?: Database["public"]["Enums"]["asset_class"]
          bias?: Database["public"]["Enums"]["idea_bias"]
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          educational_purpose_only?: boolean
          entry_zone?: string | null
          id?: string
          invalidated_at?: string | null
          invalidation_level?: string | null
          last_lifecycle_event_at?: string | null
          lessons_learned?: string | null
          outcome?: Database["public"]["Enums"]["idea_outcome"]
          outcome_summary?: string | null
          position_disclosure?: string | null
          public_preview?: string | null
          published?: boolean
          published_at?: string | null
          review_published?: boolean
          review_published_at?: string | null
          risk_disclosure?: string | null
          risk_level?: Database["public"]["Enums"]["risk_level"]
          setup_type?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["idea_status"]
          summary?: string | null
          target_1?: string | null
          target_1_hit_at?: string | null
          target_2?: string | null
          target_2_hit_at?: string | null
          target_3?: string | null
          target_3_hit_at?: string | null
          thesis?: string | null
          ticker?: string
          timeframe?: string | null
          title?: string
          trigger_level?: string | null
          triggered_at?: string | null
          updated_at?: string
          visibility?: Database["public"]["Enums"]["content_visibility"]
        }
        Relationships: []
      }
      user_activity_state: {
        Row: {
          created_at: string
          last_dashboard_seen_at: string | null
          last_ideas_seen_at: string | null
          last_lifecycle_seen_at: string | null
          last_research_seen_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          last_dashboard_seen_at?: string | null
          last_ideas_seen_at?: string | null
          last_lifecycle_seen_at?: string | null
          last_research_seen_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          last_dashboard_seen_at?: string | null
          last_ideas_seen_at?: string | null
          last_lifecycle_seen_at?: string | null
          last_research_seen_at?: string | null
          updated_at?: string
          user_id?: string
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
      can_access_software: {
        Args: {
          required_tier: Database["public"]["Enums"]["software_access_tier"]
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
          has_major_update: boolean
          id: string
          is_locked: boolean
          last_lifecycle_event_at: string
          outcome: Database["public"]["Enums"]["idea_outcome"]
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
          p_closed_reviews?: boolean
          p_limit?: number
          p_offset?: number
          p_outcome?: Database["public"]["Enums"]["idea_outcome"]
          p_search?: string
          p_sort?: string
          p_status?: Database["public"]["Enums"]["idea_status"]
          p_updated_recently?: boolean
          p_visibility?: Database["public"]["Enums"]["content_visibility"]
        }
        Returns: {
          asset_class: Database["public"]["Enums"]["asset_class"]
          bias: Database["public"]["Enums"]["idea_bias"]
          has_major_update: boolean
          id: string
          is_locked: boolean
          last_lifecycle_event_at: string
          outcome: Database["public"]["Enums"]["idea_outcome"]
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
      idea_lifecycle_event_type:
        | "note"
        | "status_change"
        | "activated"
        | "triggered"
        | "target_hit"
        | "invalidated"
        | "closed"
        | "review_posted"
      idea_outcome:
        | "pending"
        | "no_trade"
        | "invalidated"
        | "stopped_out"
        | "target_1_hit"
        | "target_2_hit"
        | "target_3_hit"
        | "partial_win"
        | "win"
        | "loss"
        | "breakeven"
        | "closed_manual"
      idea_status:
        | "watching"
        | "active"
        | "triggered"
        | "invalidated"
        | "target_hit"
        | "closed"
      member_dashboard_view:
        | "overview"
        | "watchlist"
        | "saved"
        | "following"
        | "recent"
        | "closed"
        | "software"
      member_sort_preference:
        | "recently_updated"
        | "newest_published"
        | "lifecycle_recent"
        | "status"
        | "ticker"
      notification_status: "pending" | "sent" | "failed"
      notification_type:
        | "new_idea"
        | "idea_update"
        | "new_post"
        | "weekly_digest"
      risk_level: "low" | "medium" | "high"
      software_access_request_status:
        | "requested"
        | "approved"
        | "rejected"
        | "granted"
        | "revoked"
        | "needs_info"
      software_access_tier: "premium_lite" | "pro"
      software_delivery_type:
        | "tradingview_invite_only"
        | "protected_download"
        | "documentation_only"
        | "external_link"
        | "manual_access"
      software_type:
        | "pinescript"
        | "indicator"
        | "strategy"
        | "template"
        | "tool"
        | "guide"
        | "other"
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
      idea_lifecycle_event_type: [
        "note",
        "status_change",
        "activated",
        "triggered",
        "target_hit",
        "invalidated",
        "closed",
        "review_posted",
      ],
      idea_outcome: [
        "pending",
        "no_trade",
        "invalidated",
        "stopped_out",
        "target_1_hit",
        "target_2_hit",
        "target_3_hit",
        "partial_win",
        "win",
        "loss",
        "breakeven",
        "closed_manual",
      ],
      idea_status: [
        "watching",
        "active",
        "triggered",
        "invalidated",
        "target_hit",
        "closed",
      ],
      member_dashboard_view: [
        "overview",
        "watchlist",
        "saved",
        "following",
        "recent",
        "closed",
        "software",
      ],
      member_sort_preference: [
        "recently_updated",
        "newest_published",
        "lifecycle_recent",
        "status",
        "ticker",
      ],
      notification_status: ["pending", "sent", "failed"],
      notification_type: [
        "new_idea",
        "idea_update",
        "new_post",
        "weekly_digest",
      ],
      risk_level: ["low", "medium", "high"],
      software_access_request_status: [
        "requested",
        "approved",
        "rejected",
        "granted",
        "revoked",
        "needs_info",
      ],
      software_access_tier: ["premium_lite", "pro"],
      software_delivery_type: [
        "tradingview_invite_only",
        "protected_download",
        "documentation_only",
        "external_link",
        "manual_access",
      ],
      software_type: [
        "pinescript",
        "indicator",
        "strategy",
        "template",
        "tool",
        "guide",
        "other",
      ],
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
