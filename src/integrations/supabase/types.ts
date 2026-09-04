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
      announcements: {
        Row: {
          body: string | null
          created_at: string
          created_by: string
          cta_label: string | null
          cta_url: string | null
          id: string
          published: boolean
          title: string
          updated_at: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          created_by: string
          cta_label?: string | null
          cta_url?: string | null
          id?: string
          published?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          created_by?: string
          cta_label?: string | null
          cta_url?: string | null
          id?: string
          published?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      app_user_connections: {
        Row: {
          connection_key_ciphertext: string
          connector_id: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          connection_key_ciphertext: string
          connector_id: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          connection_key_ciphertext?: string
          connector_id?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cycle_periods: {
        Row: {
          created_at: string
          end_date: string | null
          flow: string | null
          id: string
          notes: string | null
          start_date: string
          symptoms: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          flow?: string | null
          id?: string
          notes?: string | null
          start_date: string
          symptoms?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          flow?: string | null
          id?: string
          notes?: string | null
          start_date?: string
          symptoms?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_checkins: {
        Row: {
          anxiety: number | null
          bloating: number | null
          calm: number | null
          checkin_date: string
          cramps: number | null
          created_at: string
          energy: number | null
          focus: number | null
          fulfillment: number | null
          happiness: number | null
          id: string
          mindfulness_minutes: number | null
          mood_swings: number | null
          stress: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          anxiety?: number | null
          bloating?: number | null
          calm?: number | null
          checkin_date: string
          cramps?: number | null
          created_at?: string
          energy?: number | null
          focus?: number | null
          fulfillment?: number | null
          happiness?: number | null
          id?: string
          mindfulness_minutes?: number | null
          mood_swings?: number | null
          stress?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          anxiety?: number | null
          bloating?: number | null
          calm?: number | null
          checkin_date?: string
          cramps?: number | null
          created_at?: string
          energy?: number | null
          focus?: number | null
          fulfillment?: number | null
          happiness?: number | null
          id?: string
          mindfulness_minutes?: number | null
          mood_swings?: number | null
          stress?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_metrics: {
        Row: {
          created_at: string
          hrv: number | null
          id: string
          metric_date: string
          readiness: number | null
          resting_hr: number | null
          sleep_minutes: number | null
          sleep_score: number | null
          source: string
          steps: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          hrv?: number | null
          id?: string
          metric_date: string
          readiness?: number | null
          resting_hr?: number | null
          sleep_minutes?: number | null
          sleep_score?: number | null
          source?: string
          steps?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          hrv?: number | null
          id?: string
          metric_date?: string
          readiness?: number | null
          resting_hr?: number | null
          sleep_minutes?: number | null
          sleep_score?: number | null
          source?: string
          steps?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      device_connections: {
        Row: {
          created_at: string
          id: string
          last_synced_at: string | null
          provider: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_synced_at?: string | null
          provider: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_synced_at?: string | null
          provider?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      feedback: {
        Row: {
          category: string
          created_at: string
          id: string
          message: string
          page_path: string | null
          resolved: boolean
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          message: string
          page_path?: string | null
          resolved?: boolean
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          message?: string
          page_path?: string | null
          resolved?: boolean
          user_id?: string
        }
        Relationships: []
      }
      horoscopes: {
        Row: {
          created_at: string
          horoscope_date: string
          id: string
          sign: string
          text: string
        }
        Insert: {
          created_at?: string
          horoscope_date: string
          id?: string
          sign: string
          text: string
        }
        Update: {
          created_at?: string
          horoscope_date?: string
          id?: string
          sign?: string
          text?: string
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          created_at: string
          energy: number | null
          entry_date: string
          id: string
          mood: string | null
          note: string | null
          symptoms: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          energy?: number | null
          entry_date: string
          id?: string
          mood?: string | null
          note?: string | null
          symptoms?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          energy?: number | null
          entry_date?: string
          id?: string
          mood?: string | null
          note?: string | null
          symptoms?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      medication_logs: {
        Row: {
          id: string
          medication_id: string
          taken_at: string
          taken_on: string
          user_id: string
        }
        Insert: {
          id?: string
          medication_id: string
          taken_at?: string
          taken_on?: string
          user_id: string
        }
        Update: {
          id?: string
          medication_id?: string
          taken_at?: string
          taken_on?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medication_logs_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
        ]
      }
      medications: {
        Row: {
          active: boolean
          created_at: string
          days_of_week: number[]
          dose: string | null
          frequency: string
          id: string
          name: string
          schedule_note: string | null
          time_of_day: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          days_of_week?: number[]
          dose?: string | null
          frequency?: string
          id?: string
          name: string
          schedule_note?: string | null
          time_of_day?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          days_of_week?: number[]
          dose?: string | null
          frequency?: string
          id?: string
          name?: string
          schedule_note?: string | null
          time_of_day?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          birth_date: string | null
          birth_time: string | null
          checkin_frequency: string | null
          contact_phone: string | null
          created_at: string
          display_name: string | null
          focus_areas: string[]
          id: string
          life_stage: string | null
          life_stage_notes: string | null
          onboarded_at: string | null
          onboarding_notes: string | null
          preferred_channel: string | null
          reminder_time: string | null
          updated_at: string
          zodiac_sign: string | null
        }
        Insert: {
          birth_date?: string | null
          birth_time?: string | null
          checkin_frequency?: string | null
          contact_phone?: string | null
          created_at?: string
          display_name?: string | null
          focus_areas?: string[]
          id: string
          life_stage?: string | null
          life_stage_notes?: string | null
          onboarded_at?: string | null
          onboarding_notes?: string | null
          preferred_channel?: string | null
          reminder_time?: string | null
          updated_at?: string
          zodiac_sign?: string | null
        }
        Update: {
          birth_date?: string | null
          birth_time?: string | null
          checkin_frequency?: string | null
          contact_phone?: string | null
          created_at?: string
          display_name?: string | null
          focus_areas?: string[]
          id?: string
          life_stage?: string | null
          life_stage_notes?: string | null
          onboarded_at?: string | null
          onboarding_notes?: string | null
          preferred_channel?: string | null
          reminder_time?: string | null
          updated_at?: string
          zodiac_sign?: string | null
        }
        Relationships: []
      }
      roots_content: {
        Row: {
          approximate_year: number | null
          body: string | null
          collection: string | null
          content_type: string | null
          created_at: string
          culture: string | null
          day: number | null
          editorial_notes: string | null
          exact_date: string | null
          featured: boolean
          geography: string | null
          historical_accuracy_status: string
          historical_period: string | null
          id: string
          legacy_lens: string | null
          medical_context_required: boolean
          modern_context: string | null
          month: number | null
          persecution_type: string | null
          published: boolean
          quote: string | null
          quote_attribution: string | null
          region_group: string | null
          secondary_source_url: string | null
          short_body: string | null
          short_title: string | null
          source_name: string | null
          source_url: string | null
          title: string
          topic: string | null
          tree_branch: string | null
          updated_at: string
          visual_asset_credit: string | null
          visual_asset_rights_status: string
          visual_asset_source: string | null
          visual_asset_type: string | null
          visual_asset_url: string | null
          visual_template: string | null
          why_it_matters: string | null
          woman_lifespan: string | null
          woman_name: string | null
        }
        Insert: {
          approximate_year?: number | null
          body?: string | null
          collection?: string | null
          content_type?: string | null
          created_at?: string
          culture?: string | null
          day?: number | null
          editorial_notes?: string | null
          exact_date?: string | null
          featured?: boolean
          geography?: string | null
          historical_accuracy_status?: string
          historical_period?: string | null
          id: string
          legacy_lens?: string | null
          medical_context_required?: boolean
          modern_context?: string | null
          month?: number | null
          persecution_type?: string | null
          published?: boolean
          quote?: string | null
          quote_attribution?: string | null
          region_group?: string | null
          secondary_source_url?: string | null
          short_body?: string | null
          short_title?: string | null
          source_name?: string | null
          source_url?: string | null
          title: string
          topic?: string | null
          tree_branch?: string | null
          updated_at?: string
          visual_asset_credit?: string | null
          visual_asset_rights_status?: string
          visual_asset_source?: string | null
          visual_asset_type?: string | null
          visual_asset_url?: string | null
          visual_template?: string | null
          why_it_matters?: string | null
          woman_lifespan?: string | null
          woman_name?: string | null
        }
        Update: {
          approximate_year?: number | null
          body?: string | null
          collection?: string | null
          content_type?: string | null
          created_at?: string
          culture?: string | null
          day?: number | null
          editorial_notes?: string | null
          exact_date?: string | null
          featured?: boolean
          geography?: string | null
          historical_accuracy_status?: string
          historical_period?: string | null
          id?: string
          legacy_lens?: string | null
          medical_context_required?: boolean
          modern_context?: string | null
          month?: number | null
          persecution_type?: string | null
          published?: boolean
          quote?: string | null
          quote_attribution?: string | null
          region_group?: string | null
          secondary_source_url?: string | null
          short_body?: string | null
          short_title?: string | null
          source_name?: string | null
          source_url?: string | null
          title?: string
          topic?: string | null
          tree_branch?: string | null
          updated_at?: string
          visual_asset_credit?: string | null
          visual_asset_rights_status?: string
          visual_asset_source?: string | null
          visual_asset_type?: string | null
          visual_asset_url?: string | null
          visual_template?: string | null
          why_it_matters?: string | null
          woman_lifespan?: string | null
          woman_name?: string | null
        }
        Relationships: []
      }
      roots_saves: {
        Row: {
          created_at: string
          id: string
          root_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          root_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          root_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roots_saves_root_id_fkey"
            columns: ["root_id"]
            isOneToOne: false
            referencedRelation: "roots_content"
            referencedColumns: ["id"]
          },
        ]
      }
      share_access_log: {
        Row: {
          grant_id: string
          id: string
          owner_id: string
          user_agent: string | null
          viewed_at: string
        }
        Insert: {
          grant_id: string
          id?: string
          owner_id: string
          user_agent?: string | null
          viewed_at?: string
        }
        Update: {
          grant_id?: string
          id?: string
          owner_id?: string
          user_agent?: string | null
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "share_access_log_grant_id_fkey"
            columns: ["grant_id"]
            isOneToOne: false
            referencedRelation: "share_grants"
            referencedColumns: ["id"]
          },
        ]
      }
      share_grants: {
        Row: {
          consent_signature: string
          consent_signed_at: string
          consent_statement: string
          consent_version: string
          created_at: string
          expires_at: string | null
          id: string
          last_viewed_at: string | null
          owner_id: string
          recipient_email: string | null
          recipient_name: string
          relationship: string
          revoked_at: string | null
          scopes: string[]
          token: string
          updated_at: string
          view_count: number
        }
        Insert: {
          consent_signature: string
          consent_signed_at?: string
          consent_statement: string
          consent_version?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          last_viewed_at?: string | null
          owner_id: string
          recipient_email?: string | null
          recipient_name: string
          relationship?: string
          revoked_at?: string | null
          scopes?: string[]
          token: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          consent_signature?: string
          consent_signed_at?: string
          consent_statement?: string
          consent_version?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          last_viewed_at?: string | null
          owner_id?: string
          recipient_email?: string | null
          recipient_name?: string
          relationship?: string
          revoked_at?: string | null
          scopes?: string[]
          token?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: { Args: { _role: string; _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "editor" | "user"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "editor", "user"],
    },
  },
} as const
