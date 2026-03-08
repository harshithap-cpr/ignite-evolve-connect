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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      app_feedback: {
        Row: {
          created_at: string
          feedback: string | null
          id: string
          liked: boolean | null
          rating: number
          user_id: string
        }
        Insert: {
          created_at?: string
          feedback?: string | null
          id?: string
          liked?: boolean | null
          rating: number
          user_id: string
        }
        Update: {
          created_at?: string
          feedback?: string | null
          id?: string
          liked?: boolean | null
          rating?: number
          user_id?: string
        }
        Relationships: []
      }
      course_ratings: {
        Row: {
          course_id: string
          created_at: string
          id: string
          rating: number
          review: string | null
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          rating: number
          review?: string | null
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          rating?: number
          review?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_ratings_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          avg_rating: number | null
          category: string
          created_at: string
          description: string | null
          difficulty: string | null
          duration_hours: number | null
          id: string
          image_url: string | null
          instructor: string
          is_premium: boolean | null
          lessons_count: number | null
          title: string
          total_ratings: number | null
        }
        Insert: {
          avg_rating?: number | null
          category: string
          created_at?: string
          description?: string | null
          difficulty?: string | null
          duration_hours?: number | null
          id?: string
          image_url?: string | null
          instructor: string
          is_premium?: boolean | null
          lessons_count?: number | null
          title: string
          total_ratings?: number | null
        }
        Update: {
          avg_rating?: number | null
          category?: string
          created_at?: string
          description?: string | null
          difficulty?: string | null
          duration_hours?: number | null
          id?: string
          image_url?: string | null
          instructor?: string
          is_premium?: boolean | null
          lessons_count?: number | null
          title?: string
          total_ratings?: number | null
        }
        Relationships: []
      }
      hackathon_registrations: {
        Row: {
          created_at: string
          hackathon_id: string
          id: string
          status: string | null
          team_name: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          hackathon_id: string
          id?: string
          status?: string | null
          team_name?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          hackathon_id?: string
          id?: string
          status?: string | null
          team_name?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hackathon_registrations_hackathon_id_fkey"
            columns: ["hackathon_id"]
            isOneToOne: false
            referencedRelation: "hackathons"
            referencedColumns: ["id"]
          },
        ]
      }
      hackathons: {
        Row: {
          created_at: string
          description: string | null
          difficulty: string | null
          end_date: string
          id: string
          image_url: string | null
          is_active: boolean | null
          max_team_size: number | null
          prize_pool: string | null
          registration_deadline: string | null
          start_date: string
          tags: string[] | null
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          difficulty?: string | null
          end_date: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          max_team_size?: number | null
          prize_pool?: string | null
          registration_deadline?: string | null
          start_date: string
          tags?: string[] | null
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          difficulty?: string | null
          end_date?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          max_team_size?: number | null
          prize_pool?: string | null
          registration_deadline?: string | null
          start_date?: string
          tags?: string[] | null
          title?: string
        }
        Relationships: []
      }
      idea_votes: {
        Row: {
          created_at: string
          id: string
          idea_id: string
          user_id: string
          vote_type: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          idea_id: string
          user_id: string
          vote_type?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          idea_id?: string
          user_id?: string
          vote_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "idea_votes_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      ideas: {
        Row: {
          created_at: string
          feasibility_score: number | null
          feedback: string | null
          id: string
          innovation_score: number | null
          is_public: boolean | null
          market_score: number | null
          market_size: string | null
          overall_score: number | null
          problem_statement: string | null
          proposed_solution: string | null
          stage: string | null
          tags: string[] | null
          target_audience: string | null
          title: string
          unique_value: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          feasibility_score?: number | null
          feedback?: string | null
          id?: string
          innovation_score?: number | null
          is_public?: boolean | null
          market_score?: number | null
          market_size?: string | null
          overall_score?: number | null
          problem_statement?: string | null
          proposed_solution?: string | null
          stage?: string | null
          tags?: string[] | null
          target_audience?: string | null
          title: string
          unique_value?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          feasibility_score?: number | null
          feedback?: string | null
          id?: string
          innovation_score?: number | null
          is_public?: boolean | null
          market_score?: number | null
          market_size?: string | null
          overall_score?: number | null
          problem_statement?: string | null
          proposed_solution?: string | null
          stage?: string | null
          tags?: string[] | null
          target_audience?: string | null
          title?: string
          unique_value?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      investor_connections: {
        Row: {
          created_at: string
          id: string
          idea_id: string | null
          investor_id: string
          message: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          idea_id?: string | null
          investor_id: string
          message?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          idea_id?: string | null
          investor_id?: string
          message?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "investor_connections_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investor_connections_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "investors"
            referencedColumns: ["id"]
          },
        ]
      }
      investors: {
        Row: {
          avatar_url: string | null
          bio: string | null
          company: string | null
          created_at: string
          email: string | null
          focus_areas: string[] | null
          id: string
          investment_range: string | null
          investor_type: string | null
          is_active: boolean | null
          linkedin_url: string | null
          location: string | null
          name: string
          portfolio_size: number | null
          title: string | null
          website_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          focus_areas?: string[] | null
          id?: string
          investment_range?: string | null
          investor_type?: string | null
          is_active?: boolean | null
          linkedin_url?: string | null
          location?: string | null
          name: string
          portfolio_size?: number | null
          title?: string | null
          website_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          focus_areas?: string[] | null
          id?: string
          investment_range?: string | null
          investor_type?: string | null
          is_active?: boolean | null
          linkedin_url?: string | null
          location?: string | null
          name?: string
          portfolio_size?: number | null
          title?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      mentor_bookings: {
        Row: {
          created_at: string
          duration_minutes: number | null
          id: string
          mentor_id: string
          notes: string | null
          scheduled_at: string
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_minutes?: number | null
          id?: string
          mentor_id: string
          notes?: string | null
          scheduled_at: string
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number | null
          id?: string
          mentor_id?: string
          notes?: string | null
          scheduled_at?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentor_bookings_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors"
            referencedColumns: ["id"]
          },
        ]
      }
      mentors: {
        Row: {
          avatar_url: string | null
          bio: string | null
          company: string | null
          created_at: string
          expertise: string[] | null
          hourly_rate: number | null
          id: string
          is_available: boolean | null
          name: string
          rating: number | null
          title: string | null
          total_sessions: number | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          company?: string | null
          created_at?: string
          expertise?: string[] | null
          hourly_rate?: number | null
          id?: string
          is_available?: boolean | null
          name: string
          rating?: number | null
          title?: string | null
          total_sessions?: number | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          company?: string | null
          created_at?: string
          expertise?: string[] | null
          hourly_rate?: number | null
          id?: string
          is_available?: boolean | null
          name?: string
          rating?: number | null
          title?: string | null
          total_sessions?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      patents: {
        Row: {
          application_number: string | null
          created_at: string
          description: string | null
          document_url: string | null
          filing_date: string | null
          id: string
          invention_type: string | null
          inventors: string[] | null
          keywords: string[] | null
          notes: string | null
          stage: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          application_number?: string | null
          created_at?: string
          description?: string | null
          document_url?: string | null
          filing_date?: string | null
          id?: string
          invention_type?: string | null
          inventors?: string[] | null
          keywords?: string[] | null
          notes?: string | null
          stage?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          application_number?: string | null
          created_at?: string
          description?: string | null
          document_url?: string | null
          filing_date?: string | null
          id?: string
          invention_type?: string | null
          inventors?: string[] | null
          keywords?: string[] | null
          notes?: string | null
          stage?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          full_name: string | null
          id: string
          interests: string[] | null
          role: string | null
          skills: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          interests?: string[] | null
          role?: string | null
          skills?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          interests?: string[] | null
          role?: string | null
          skills?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
