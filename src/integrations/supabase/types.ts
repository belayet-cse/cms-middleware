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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_name: string | null
          after_data: Json | null
          before_data: Json | null
          changed_fields: string[] | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          reference_no: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_name?: string | null
          after_data?: Json | null
          before_data?: Json | null
          changed_fields?: string[] | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          reference_no?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_name?: string | null
          after_data?: Json | null
          before_data?: Json | null
          changed_fields?: string[] | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          reference_no?: string | null
        }
        Relationships: []
      }
      bulk_batches: {
        Row: {
          accepted_rows: number
          created_at: string
          errors: Json | null
          file_name: string
          id: string
          rejected_rows: number
          total_rows: number
          uploaded_by: string | null
        }
        Insert: {
          accepted_rows?: number
          created_at?: string
          errors?: Json | null
          file_name: string
          id?: string
          rejected_rows?: number
          total_rows?: number
          uploaded_by?: string | null
        }
        Update: {
          accepted_rows?: number
          created_at?: string
          errors?: Json | null
          file_name?: string
          id?: string
          rejected_rows?: number
          total_rows?: number
          uploaded_by?: string | null
        }
        Relationships: []
      }
      card_products: {
        Row: {
          bin: string
          card_type: Database["public"]["Enums"]["card_type"]
          created_at: string
          currency: string
          id: string
          is_active: boolean
          max_limit: number
          min_limit: number
          product_code: string
          product_name: string
          scheme: string
          updated_at: string
        }
        Insert: {
          bin?: string
          card_type: Database["public"]["Enums"]["card_type"]
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          max_limit?: number
          min_limit?: number
          product_code: string
          product_name: string
          scheme?: string
          updated_at?: string
        }
        Update: {
          bin?: string
          card_type?: Database["public"]["Enums"]["card_type"]
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          max_limit?: number
          min_limit?: number
          product_code?: string
          product_name?: string
          scheme?: string
          updated_at?: string
        }
        Relationships: []
      }
      card_requests: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          applicant_name: string
          approved_limit: number | null
          bulk_batch_id: string | null
          card_type: Database["public"]["Enums"]["card_type"]
          checked_at: string | null
          checker_id: string | null
          checker_remarks: string | null
          city: string | null
          company_name: string | null
          created_at: string
          credit_shield: boolean
          credit_shield_rate: number | null
          customer_id: string | null
          date_of_birth: string | null
          email: string | null
          email_tagged: boolean
          embossing_name: string | null
          existing_cif: string | null
          father_name: string | null
          fc_account_no: string | null
          fc_category: Database["public"]["Enums"]["fc_category"]
          fee_profile_id: string | null
          gender: string | null
          generated_card_number: string | null
          generated_cif: string | null
          generated_client_id: string | null
          id: string
          limit_checker1_at: string | null
          limit_checker1_id: string | null
          limit_checker2_at: string | null
          limit_checker2_id: string | null
          maker_id: string | null
          maker_remarks: string | null
          mobile: string
          mother_name: string | null
          national_id: string | null
          passport_no: string | null
          payment_instruction: Database["public"]["Enums"]["payment_instruction"]
          postal_code: string | null
          primary_card_id: string | null
          product_id: string | null
          reference_no: string
          request_type: Database["public"]["Enums"]["request_type"]
          requested_limit: number
          sms_tagged: boolean
          status: Database["public"]["Enums"]["request_status"]
          submitted_at: string | null
          tin: string | null
          updated_at: string
          use_existing_cif: boolean
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          applicant_name: string
          approved_limit?: number | null
          bulk_batch_id?: string | null
          card_type: Database["public"]["Enums"]["card_type"]
          checked_at?: string | null
          checker_id?: string | null
          checker_remarks?: string | null
          city?: string | null
          company_name?: string | null
          created_at?: string
          credit_shield?: boolean
          credit_shield_rate?: number | null
          customer_id?: string | null
          date_of_birth?: string | null
          email?: string | null
          email_tagged?: boolean
          embossing_name?: string | null
          existing_cif?: string | null
          father_name?: string | null
          fc_account_no?: string | null
          fc_category?: Database["public"]["Enums"]["fc_category"]
          fee_profile_id?: string | null
          gender?: string | null
          generated_card_number?: string | null
          generated_cif?: string | null
          generated_client_id?: string | null
          id?: string
          limit_checker1_at?: string | null
          limit_checker1_id?: string | null
          limit_checker2_at?: string | null
          limit_checker2_id?: string | null
          maker_id?: string | null
          maker_remarks?: string | null
          mobile: string
          mother_name?: string | null
          national_id?: string | null
          passport_no?: string | null
          payment_instruction?: Database["public"]["Enums"]["payment_instruction"]
          postal_code?: string | null
          primary_card_id?: string | null
          product_id?: string | null
          reference_no: string
          request_type?: Database["public"]["Enums"]["request_type"]
          requested_limit?: number
          sms_tagged?: boolean
          status?: Database["public"]["Enums"]["request_status"]
          submitted_at?: string | null
          tin?: string | null
          updated_at?: string
          use_existing_cif?: boolean
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          applicant_name?: string
          approved_limit?: number | null
          bulk_batch_id?: string | null
          card_type?: Database["public"]["Enums"]["card_type"]
          checked_at?: string | null
          checker_id?: string | null
          checker_remarks?: string | null
          city?: string | null
          company_name?: string | null
          created_at?: string
          credit_shield?: boolean
          credit_shield_rate?: number | null
          customer_id?: string | null
          date_of_birth?: string | null
          email?: string | null
          email_tagged?: boolean
          embossing_name?: string | null
          existing_cif?: string | null
          father_name?: string | null
          fc_account_no?: string | null
          fc_category?: Database["public"]["Enums"]["fc_category"]
          fee_profile_id?: string | null
          gender?: string | null
          generated_card_number?: string | null
          generated_cif?: string | null
          generated_client_id?: string | null
          id?: string
          limit_checker1_at?: string | null
          limit_checker1_id?: string | null
          limit_checker2_at?: string | null
          limit_checker2_id?: string | null
          maker_id?: string | null
          maker_remarks?: string | null
          mobile?: string
          mother_name?: string | null
          national_id?: string | null
          passport_no?: string | null
          payment_instruction?: Database["public"]["Enums"]["payment_instruction"]
          postal_code?: string | null
          primary_card_id?: string | null
          product_id?: string | null
          reference_no?: string
          request_type?: Database["public"]["Enums"]["request_type"]
          requested_limit?: number
          sms_tagged?: boolean
          status?: Database["public"]["Enums"]["request_status"]
          submitted_at?: string | null
          tin?: string | null
          updated_at?: string
          use_existing_cif?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "card_requests_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_requests_fee_profile_id_fkey"
            columns: ["fee_profile_id"]
            isOneToOne: false
            referencedRelation: "fee_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_requests_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "card_products"
            referencedColumns: ["id"]
          },
        ]
      }
      cards: {
        Row: {
          card_limit: number
          card_number: string
          card_type: Database["public"]["Enums"]["card_type"]
          cash_limit: number
          cbs_sync: Database["public"]["Enums"]["sync_status"]
          cms_sync: Database["public"]["Enums"]["sync_status"]
          created_at: string
          credit_shield: boolean
          customer_id: string | null
          embossing_name: string
          expiry_month: number
          expiry_year: number
          fee_profile_id: string | null
          id: string
          is_deleted: boolean
          masked_number: string
          parent_card_id: string | null
          product_id: string | null
          request_id: string | null
          status: Database["public"]["Enums"]["card_status"]
          updated_at: string
        }
        Insert: {
          card_limit?: number
          card_number: string
          card_type: Database["public"]["Enums"]["card_type"]
          cash_limit?: number
          cbs_sync?: Database["public"]["Enums"]["sync_status"]
          cms_sync?: Database["public"]["Enums"]["sync_status"]
          created_at?: string
          credit_shield?: boolean
          customer_id?: string | null
          embossing_name: string
          expiry_month: number
          expiry_year: number
          fee_profile_id?: string | null
          id?: string
          is_deleted?: boolean
          masked_number: string
          parent_card_id?: string | null
          product_id?: string | null
          request_id?: string | null
          status?: Database["public"]["Enums"]["card_status"]
          updated_at?: string
        }
        Update: {
          card_limit?: number
          card_number?: string
          card_type?: Database["public"]["Enums"]["card_type"]
          cash_limit?: number
          cbs_sync?: Database["public"]["Enums"]["sync_status"]
          cms_sync?: Database["public"]["Enums"]["sync_status"]
          created_at?: string
          credit_shield?: boolean
          customer_id?: string | null
          embossing_name?: string
          expiry_month?: number
          expiry_year?: number
          fee_profile_id?: string | null
          id?: string
          is_deleted?: boolean
          masked_number?: string
          parent_card_id?: string | null
          product_id?: string | null
          request_id?: string | null
          status?: Database["public"]["Enums"]["card_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cards_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cards_fee_profile_id_fkey"
            columns: ["fee_profile_id"]
            isOneToOne: false
            referencedRelation: "fee_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cards_parent_card_id_fkey"
            columns: ["parent_card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cards_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "card_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cards_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "card_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          cbs_sync: Database["public"]["Enums"]["sync_status"]
          cif_number: string | null
          city: string | null
          cms_client_id: string | null
          cms_sync: Database["public"]["Enums"]["sync_status"]
          country: string
          created_at: string
          created_by: string | null
          date_of_birth: string | null
          email: string | null
          father_name: string | null
          full_name: string
          gender: string | null
          id: string
          last_synced_at: string | null
          mobile: string
          mother_name: string | null
          national_id: string | null
          passport_no: string | null
          postal_code: string | null
          tin: string | null
          updated_at: string
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          cbs_sync?: Database["public"]["Enums"]["sync_status"]
          cif_number?: string | null
          city?: string | null
          cms_client_id?: string | null
          cms_sync?: Database["public"]["Enums"]["sync_status"]
          country?: string
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          email?: string | null
          father_name?: string | null
          full_name: string
          gender?: string | null
          id?: string
          last_synced_at?: string | null
          mobile: string
          mother_name?: string | null
          national_id?: string | null
          passport_no?: string | null
          postal_code?: string | null
          tin?: string | null
          updated_at?: string
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          cbs_sync?: Database["public"]["Enums"]["sync_status"]
          cif_number?: string | null
          city?: string | null
          cms_client_id?: string | null
          cms_sync?: Database["public"]["Enums"]["sync_status"]
          country?: string
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          email?: string | null
          father_name?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          last_synced_at?: string | null
          mobile?: string
          mother_name?: string | null
          national_id?: string | null
          passport_no?: string | null
          postal_code?: string | null
          tin?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      fee_profiles: {
        Row: {
          annual_fee: number
          cash_advance_rate: number
          created_at: string
          credit_shield_premium_rate: number
          id: string
          interest_rate: number
          is_active: boolean
          late_fee: number
          profile_code: string
          profile_name: string
          updated_at: string
        }
        Insert: {
          annual_fee?: number
          cash_advance_rate?: number
          created_at?: string
          credit_shield_premium_rate?: number
          id?: string
          interest_rate?: number
          is_active?: boolean
          late_fee?: number
          profile_code: string
          profile_name: string
          updated_at?: string
        }
        Update: {
          annual_fee?: number
          cash_advance_rate?: number
          created_at?: string
          credit_shield_premium_rate?: number
          id?: string
          interest_rate?: number
          is_active?: boolean
          late_fee?: number
          profile_code?: string
          profile_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      integration_logs: {
        Row: {
          created_at: string
          direction: string
          endpoint: string | null
          error_message: string | null
          http_status: number | null
          id: string
          latency_ms: number | null
          operation: string
          request_id: string | null
          request_payload: Json | null
          response_payload: Json | null
          success: boolean
          system: string
        }
        Insert: {
          created_at?: string
          direction: string
          endpoint?: string | null
          error_message?: string | null
          http_status?: number | null
          id?: string
          latency_ms?: number | null
          operation: string
          request_id?: string | null
          request_payload?: Json | null
          response_payload?: Json | null
          success?: boolean
          system: string
        }
        Update: {
          created_at?: string
          direction?: string
          endpoint?: string | null
          error_message?: string | null
          http_status?: number | null
          id?: string
          latency_ms?: number | null
          operation?: string
          request_id?: string | null
          request_payload?: Json | null
          response_payload?: Json | null
          success?: boolean
          system?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_logs_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "card_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          branch: string | null
          created_at: string
          designation: string | null
          email: string | null
          employee_id: string | null
          full_name: string
          id: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          branch?: string | null
          created_at?: string
          designation?: string | null
          email?: string | null
          employee_id?: string | null
          full_name?: string
          id: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          branch?: string | null
          created_at?: string
          designation?: string | null
          email?: string | null
          employee_id?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      request_approvals: {
        Row: {
          action: Database["public"]["Enums"]["approval_action"]
          actor_id: string | null
          actor_role: Database["public"]["Enums"]["app_role"] | null
          created_at: string
          from_status: Database["public"]["Enums"]["request_status"] | null
          id: string
          remarks: string | null
          request_id: string
          to_status: Database["public"]["Enums"]["request_status"] | null
        }
        Insert: {
          action: Database["public"]["Enums"]["approval_action"]
          actor_id?: string | null
          actor_role?: Database["public"]["Enums"]["app_role"] | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["request_status"] | null
          id?: string
          remarks?: string | null
          request_id: string
          to_status?: Database["public"]["Enums"]["request_status"] | null
        }
        Update: {
          action?: Database["public"]["Enums"]["approval_action"]
          actor_id?: string | null
          actor_role?: Database["public"]["Enums"]["app_role"] | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["request_status"] | null
          id?: string
          remarks?: string | null
          request_id?: string
          to_status?: Database["public"]["Enums"]["request_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "request_approvals_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "card_requests"
            referencedColumns: ["id"]
          },
        ]
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
      next_card_request_reference: { Args: never; Returns: string }
    }
    Enums: {
      app_role: "admin" | "maker" | "checker1" | "checker2" | "auditor"
      approval_action:
        | "submitted"
        | "approved"
        | "returned"
        | "rejected"
        | "limit_set"
        | "limit_approved"
        | "completed"
      card_status:
        | "requested"
        | "active"
        | "inactive"
        | "blocked"
        | "hotlisted"
        | "closed"
        | "expired"
      card_type:
        | "primary_credit"
        | "supplementary_credit"
        | "business"
        | "prepaid"
      fc_category:
        | "none"
        | "private_travel_quota"
        | "erq"
        | "fc"
        | "rfcd"
        | "other"
      payment_instruction: "none" | "fc" | "erq" | "rfcd"
      request_status:
        | "draft"
        | "pending_checker"
        | "returned"
        | "rejected"
        | "approved"
        | "limit_pending_checker1"
        | "limit_pending_checker2"
        | "completed"
      request_type:
        | "new_onboarding"
        | "amendment"
        | "replacement"
        | "renewal"
        | "card_delete"
        | "contact_delete"
      sync_status: "pending" | "synced" | "failed"
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
      app_role: ["admin", "maker", "checker1", "checker2", "auditor"],
      approval_action: [
        "submitted",
        "approved",
        "returned",
        "rejected",
        "limit_set",
        "limit_approved",
        "completed",
      ],
      card_status: [
        "requested",
        "active",
        "inactive",
        "blocked",
        "hotlisted",
        "closed",
        "expired",
      ],
      card_type: [
        "primary_credit",
        "supplementary_credit",
        "business",
        "prepaid",
      ],
      fc_category: [
        "none",
        "private_travel_quota",
        "erq",
        "fc",
        "rfcd",
        "other",
      ],
      payment_instruction: ["none", "fc", "erq", "rfcd"],
      request_status: [
        "draft",
        "pending_checker",
        "returned",
        "rejected",
        "approved",
        "limit_pending_checker1",
        "limit_pending_checker2",
        "completed",
      ],
      request_type: [
        "new_onboarding",
        "amendment",
        "replacement",
        "renewal",
        "card_delete",
        "contact_delete",
      ],
      sync_status: ["pending", "synced", "failed"],
    },
  },
} as const
