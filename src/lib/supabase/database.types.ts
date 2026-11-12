export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type BusinessRole = "owner" | "manager" | "editor";
export type FeatureType =
  "boolean" | "number" | "select" | "multi_select" | "text";
export type ListingStatus =
  "draft" | "pending_review" | "published" | "rejected";
export type LeadStatus =
  "new" | "contacted" | "qualified" | "won" | "lost" | "spam";

type Table<Row, Insert = Partial<Row>, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<{
        id: string;
        full_name: string | null;
        avatar_url: string | null;
        locale: string;
        created_at: string;
        updated_at: string;
      }>;
      platform_admins: Table<{
        user_id: string;
        created_at: string;
        created_by: string | null;
      }>;
      businesses: Table<{
        id: string;
        name: string;
        slug: string;
        created_by: string;
        created_at: string;
        updated_at: string;
      }>;
      business_members: Table<{
        business_id: string;
        user_id: string;
        role: BusinessRole;
        created_at: string;
        updated_at: string;
      }>;
      business_invitations: Table<{
        id: string;
        business_id: string;
        email: string;
        role: BusinessRole;
        token_hash: string;
        invited_by: string;
        accepted_by: string | null;
        expires_at: string;
        accepted_at: string | null;
        revoked_at: string | null;
        created_at: string;
      }>;
      categories: Table<{
        id: string;
        slug: string;
        name_tr: string;
        name_en: string;
        description_tr: string | null;
        description_en: string | null;
        is_active: boolean;
        sort_order: number;
        created_at: string;
        updated_at: string;
      }>;
      feature_definitions: Table<{
        id: string;
        key: string;
        name_tr: string;
        name_en: string;
        feature_type: FeatureType;
        unit: string | null;
        options: Json | null;
        validation: Json;
        created_at: string;
        updated_at: string;
      }>;
      category_features: Table<{
        category_id: string;
        feature_definition_id: string;
        is_required: boolean;
        is_filterable: boolean;
        sort_order: number;
        created_at: string;
      }>;
      listings: Table<{
        id: string;
        business_id: string;
        category_id: string;
        name: string;
        slug: string;
        description: string | null;
        status: ListingStatus;
        address_line: string;
        district: string;
        city: string;
        country_code: string;
        latitude: number | null;
        longitude: number | null;
        area_sqm: number | null;
        capacity: number | null;
        price_amount: number | null;
        currency: string;
        rejection_reason: string | null;
        published_at: string | null;
        created_at: string;
        updated_at: string;
      }>;
      listing_feature_values: Table<{
        listing_id: string;
        feature_definition_id: string;
        value_boolean: boolean | null;
        value_number: number | null;
        value_text: string | null;
        value_json: Json | null;
        created_at: string;
        updated_at: string;
      }>;
      listing_images: Table<{
        id: string;
        listing_id: string;
        storage_path: string;
        alt_text: string | null;
        width: number | null;
        height: number | null;
        blurhash: string | null;
        sort_order: number;
        is_cover: boolean;
        created_at: string;
      }>;
      leads: Table<{
        id: string;
        listing_id: string;
        business_id: string;
        customer_id: string | null;
        name: string;
        email: string;
        phone: string;
        preferred_date: string | null;
        message: string;
        status: LeadStatus;
        source: string;
        utm_source: string | null;
        utm_medium: string | null;
        utm_campaign: string | null;
        created_at: string;
        updated_at: string;
      }>;
      lead_rate_limits: Table<{
        abuse_key_hash: string;
        window_started_at: string;
        submission_count: number;
        updated_at: string;
      }>;
      lead_notification_jobs: Table<{
        id: string;
        lead_id: string;
        recipient_email: string;
        status: "pending" | "processing" | "sent" | "failed";
        attempts: number;
        next_attempt_at: string;
        last_error: string | null;
        locked_at: string | null;
        sent_at: string | null;
        created_at: string;
        updated_at: string;
      }>;
      review_notification_jobs: Table<{
        id: string;
        listing_id: string;
        submission_id: string;
        submitted_at: string;
        admin_user_id: string;
        status: "pending" | "processing" | "sent" | "failed" | "cancelled";
        attempts: number;
        next_attempt_at: string;
        locked_at: string | null;
        sent_at: string | null;
        last_error: string | null;
        created_at: string;
        updated_at: string;
      }>;
      favorites: Table<{
        user_id: string;
        listing_id: string;
        created_at: string;
      }>;
      listing_views: Table<{
        id: number;
        listing_id: string;
        viewer_id: string | null;
        session_hash: string | null;
        referrer: string | null;
        created_at: string;
      }>;
      audit_logs: Table<{
        id: number;
        actor_id: string | null;
        business_id: string | null;
        action: string;
        entity_type: string;
        entity_id: string | null;
        old_values: Json | null;
        new_values: Json | null;
        created_at: string;
      }>;
    };
    Views: Record<string, never>;
    Functions: {
      create_business_with_owner: {
        Args: { business_name: string; business_slug: string };
        Returns: {
          id: string;
          name: string;
          slug: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
      };
      get_business_members: {
        Args: { target_business_id: string };
        Returns: Array<{
          member_user_id: string;
          member_full_name: string | null;
          member_email: string;
          member_role: BusinessRole;
          joined_at: string;
        }>;
      };
      get_business_invitations: {
        Args: { target_business_id: string };
        Returns: Array<{
          invitation_id: string;
          invitation_email: string;
          invitation_role: BusinessRole;
          invitation_status: string;
          invitation_expires_at: string;
          invitation_created_at: string;
        }>;
      };
      create_business_invitation: {
        Args: {
          target_business_id: string;
          invite_email: string;
          invite_role: BusinessRole;
          invite_token_hash: string;
        };
        Returns: Database["public"]["Tables"]["business_invitations"]["Row"];
      };
      get_business_invitation_preview: {
        Args: { invite_token_hash: string };
        Returns: Array<{
          invitation_business_id: string;
          invitation_business_name: string;
          invitation_role: BusinessRole;
          invitation_expires_at: string;
        }>;
      };
      accept_business_invitation: {
        Args: { invite_token_hash: string };
        Returns: Database["public"]["Tables"]["business_members"]["Row"];
      };
      update_business_member_role: {
        Args: {
          target_business_id: string;
          target_user_id: string;
          next_role: BusinessRole;
        };
        Returns: Database["public"]["Tables"]["business_members"]["Row"];
      };
      remove_business_member: {
        Args: { target_business_id: string; target_user_id: string };
        Returns: undefined;
      };
      revoke_business_invitation: {
        Args: {
          target_business_id: string;
          target_invitation_id: string;
        };
        Returns: undefined;
      };
      is_platform_admin: { Args: Record<string, never>; Returns: boolean };
      has_business_role: {
        Args: { target_business_id: string; allowed_roles: BusinessRole[] };
        Returns: boolean;
      };
      validate_listing_feature_value: {
        Args: {
          target_listing_id: string;
          target_feature_definition_id: string;
          target_boolean: boolean | null;
          target_number: number | null;
          target_text: string | null;
          target_json: Json | null;
        };
        Returns: boolean;
      };
      review_listing: {
        Args: {
          target_listing_id: string;
          review_decision: "publish" | "reject";
          review_reason?: string | null;
        };
        Returns: Database["public"]["Tables"]["listings"]["Row"];
      };
      submit_listing_for_review: {
        Args: {
          target_business_id: string;
          target_listing_id: string;
        };
        Returns: string[];
      };
      reopen_listing_for_editing: {
        Args: {
          target_business_id: string;
          target_listing_id: string;
        };
        Returns: Database["public"]["Tables"]["listings"]["Row"];
      };
      reorder_listing_images: {
        Args: {
          target_listing_id: string;
          ordered_image_ids: string[];
        };
        Returns: undefined;
      };
      set_listing_image_cover: {
        Args: {
          target_listing_id: string;
          target_image_id: string;
        };
        Returns: undefined;
      };
      delete_listing_image: {
        Args: {
          target_listing_id: string;
          target_image_id: string;
        };
        Returns: string;
      };
      create_public_lead: {
        Args: {
          target_listing_id: string;
          lead_name: string;
          lead_email: string;
          lead_phone: string;
          lead_preferred_date: string | null;
          lead_message: string;
          lead_source: string;
          lead_utm_source: string | null;
          lead_utm_medium: string | null;
          lead_utm_campaign: string | null;
          abuse_key_hash: string;
        };
        Returns: string;
      };
      claim_lead_notification_jobs: {
        Args: {
          max_jobs?: number;
          target_lead_id?: string | null;
        };
        Returns: Database["public"]["Tables"]["lead_notification_jobs"]["Row"][];
      };
      claim_review_notification_jobs: {
        Args: { max_jobs?: number; target_listing_id?: string | null };
        Returns: Array<{
          id: string;
          listing_id: string;
          admin_user_id: string;
          submitted_at: string;
          recipient_email: string;
          recipient_locale: string;
          attempts: number;
        }>;
      };
      update_business_lead_status: {
        Args: {
          target_lead_id: string;
          next_status: LeadStatus;
        };
        Returns: Database["public"]["Tables"]["leads"]["Row"];
      };
      record_listing_view: {
        Args: {
          target_listing_id: string;
          viewer_session_hash: string;
          view_referrer?: string | null;
        };
        Returns: boolean;
      };
      get_business_analytics: {
        Args: { target_business_id: string; days_back?: number };
        Returns: Json;
      };
      purge_expired_operational_data: {
        Args: {
          view_retention_days?: number;
          sent_job_retention_days?: number;
          rate_limit_retention_hours?: number;
        };
        Returns: Json;
      };
    };
    Enums: {
      business_role: BusinessRole;
      feature_type: FeatureType;
      listing_status: ListingStatus;
      lead_status: LeadStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
