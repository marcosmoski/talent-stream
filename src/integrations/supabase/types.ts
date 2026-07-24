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
      business_units: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      jobs: {
        Row: {
          business_unit_id: string
          client_company: string
          closed_at: string | null
          created_at: string
          created_by: string | null
          id: string
          is_urgent: boolean
          keywork_url: string | null
          location: string
          notes: string | null
          opened_at: string
          priority: Database["public"]["Enums"]["priority_level"]
          project_context: string | null
          role_name: string
          seniority: Database["public"]["Enums"]["seniority_level"]
          status: Database["public"]["Enums"]["job_status"]
          tech_stack: string[]
          updated_at: string
          working_model: Database["public"]["Enums"]["work_model"]
          years_experience: number | null
        }
        Insert: {
          business_unit_id: string
          client_company: string
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_urgent?: boolean
          keywork_url?: string | null
          location: string
          notes?: string | null
          opened_at?: string
          priority?: Database["public"]["Enums"]["priority_level"]
          project_context?: string | null
          role_name: string
          seniority?: Database["public"]["Enums"]["seniority_level"]
          status?: Database["public"]["Enums"]["job_status"]
          tech_stack?: string[]
          updated_at?: string
          working_model?: Database["public"]["Enums"]["work_model"]
          years_experience?: number | null
        }
        Update: {
          business_unit_id?: string
          client_company?: string
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_urgent?: boolean
          keywork_url?: string | null
          location?: string
          notes?: string | null
          opened_at?: string
          priority?: Database["public"]["Enums"]["priority_level"]
          project_context?: string | null
          role_name?: string
          seniority?: Database["public"]["Enums"]["seniority_level"]
          status?: Database["public"]["Enums"]["job_status"]
          tech_stack?: string[]
          updated_at?: string
          working_model?: Database["public"]["Enums"]["work_model"]
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_business_unit_id_fkey"
            columns: ["business_unit_id"]
            isOneToOne: false
            referencedRelation: "business_units"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      top_candidates: {
        Row: {
          availability: string | null
          business_unit_id: string
          created_at: string
          created_by: string | null
          full_name: string
          headline: string | null
          id: string
          job_id: string | null
          keywork_url: string | null
          location: string | null
          notes: string | null
          recruiter: string | null
          seniority: Database["public"]["Enums"]["seniority_level"]
          tech_stack: string[]
          updated_at: string
        }
        Insert: {
          availability?: string | null
          business_unit_id: string
          created_at?: string
          created_by?: string | null
          full_name: string
          headline?: string | null
          id?: string
          job_id?: string | null
          keywork_url?: string | null
          location?: string | null
          notes?: string | null
          recruiter?: string | null
          seniority?: Database["public"]["Enums"]["seniority_level"]
          tech_stack?: string[]
          updated_at?: string
        }
        Update: {
          availability?: string | null
          business_unit_id?: string
          created_at?: string
          created_by?: string | null
          full_name?: string
          headline?: string | null
          id?: string
          job_id?: string | null
          keywork_url?: string | null
          location?: string | null
          notes?: string | null
          recruiter?: string | null
          seniority?: Database["public"]["Enums"]["seniority_level"]
          tech_stack?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "top_candidates_business_unit_id_fkey"
            columns: ["business_unit_id"]
            isOneToOne: false
            referencedRelation: "business_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "top_candidates_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          role: Database["public"]["Enums"]["app_role"]
          status: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "recruiter"
      job_status: "open" | "on_hold" | "closed" | "closed_primeit" | "closed_client"
      priority_level: "asap" | "p1" | "p2" | "p3"
      seniority_level:
        | "intern"
        | "junior"
        | "mid"
        | "senior"
        | "lead"
        | "principal"
      work_model: "remote" | "hybrid" | "onsite"
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
      app_role: ["admin", "recruiter"],
      job_status: ["open", "on_hold", "closed", "closed_primeit", "closed_client"],
      priority_level: ["asap", "p1", "p2", "p3"],
      seniority_level: [
        "intern",
        "junior",
        "mid",
        "senior",
        "lead",
        "principal",
      ],
      work_model: ["remote", "hybrid", "onsite"],
    },
  },
} as const
