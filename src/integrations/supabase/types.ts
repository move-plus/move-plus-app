export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5";
  };
  public: {
    Tables: {
      attendance: {
        Row: {
          created_at: string | null;
          date: string;
          enrollment_id: string;
          id: string;
          present: boolean | null;
        };
        Insert: {
          created_at?: string | null;
          date?: string;
          enrollment_id: string;
          id?: string;
          present?: boolean | null;
        };
        Update: {
          created_at?: string | null;
          date?: string;
          enrollment_id?: string;
          id?: string;
          present?: boolean | null;
        };
        Relationships: [
          {
            foreignKeyName: "attendance_enrollment_id_fkey";
            columns: ["enrollment_id"];
            isOneToOne: false;
            referencedRelation: "enrollments";
            referencedColumns: ["id"];
          }
        ];
      };
      classes: {
        Row: {
          id: string;
          instructor_id: string | null; // Mantém por compatibilidade
          professional_id: string; // Nova coluna
          title: string;
          description: string | null;
          date: string;
          duration: number | null;
          capacity: number;
          location: string | null;
          category: string | null;
          level: "beginner" | "intermediate" | "advanced" | null;
          activity: string | null;
          schedule: string | null;
          max_students: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          instructor_id?: string | null;
          professional_id: string;
          title: string;
          description?: string | null;
          date: string;
          duration?: number | null;
          capacity?: number;
          location?: string | null;
          category?: string | null;
          level?: "beginner" | "intermediate" | "advanced" | null;
          activity?: string | null;
          schedule?: string | null;
          max_students?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          instructor_id?: string | null;
          professional_id?: string;
          title?: string;
          description?: string | null;
          date?: string;
          duration?: number | null;
          capacity?: number;
          location?: string | null;
          category?: string | null;
          level?: "beginner" | "intermediate" | "advanced" | null;
          activity?: string | null;
          schedule?: string | null;
          max_students?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "classes_professional_id_fkey";
            columns: ["professional_id"];
            referencedRelation: "professionals";
            referencedColumns: ["user_id"];
          }
        ];
      };
      demands: {
        Row: {
          activity: string;
          created_at: string | null;
          id: string;
          location: string;
          neighborhood: string;
          num_interested: number;
          schedule: string;
        };
        Insert: {
          activity: string;
          created_at?: string | null;
          id?: string;
          location: string;
          neighborhood: string;
          num_interested?: number;
          schedule: string;
        };
        Update: {
          activity?: string;
          created_at?: string | null;
          id?: string;
          location?: string;
          neighborhood?: string;
          num_interested?: number;
          schedule?: string;
        };
        Relationships: [];
      };
      enrollments: {
        Row: {
          id: string;
          user_id: string;
          class_id: string;
          student_id: string | null;
          status: "enrolled" | "cancelled" | "completed";
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          class_id: string;
          student_id?: string | null;
          status?: "enrolled" | "cancelled" | "completed";
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          class_id?: string;
          student_id?: string | null;
          status?: "enrolled" | "cancelled" | "completed";
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "enrollments_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "enrollments_class_id_fkey";
            columns: ["class_id"];
            referencedRelation: "classes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "enrollments_student_id_fkey";
            columns: ["student_id"];
            referencedRelation: "students";
            referencedColumns: ["user_id"];
          }
        ];
      };
      forum_messages: {
        Row: {
          class_id: string;
          created_at: string | null;
          id: string;
          message: string;
          user_id: string;
        };
        Insert: {
          class_id: string;
          created_at?: string | null;
          id?: string;
          message: string;
          user_id: string;
        };
        Update: {
          class_id?: string;
          created_at?: string | null;
          id?: string;
          message?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "forum_messages_class_id_fkey";
            columns: ["class_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["id"];
          }
        ];
      };
      payments: {
        Row: {
          amount: number;
          class_id: string;
          created_at: string | null;
          enrollment_id: string;
          id: string;
          payment_date: string | null;
          status: string | null;
        };
        Insert: {
          amount: number;
          class_id: string;
          created_at?: string | null;
          enrollment_id: string;
          id?: string;
          payment_date?: string | null;
          status?: string | null;
        };
        Update: {
          amount?: number;
          class_id?: string;
          created_at?: string | null;
          enrollment_id?: string;
          id?: string;
          payment_date?: string | null;
          status?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "payments_class_id_fkey";
            columns: ["class_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_enrollment_id_fkey";
            columns: ["enrollment_id"];
            isOneToOne: false;
            referencedRelation: "enrollments";
            referencedColumns: ["id"];
          }
        ];
      };
      private_messages: {
        Row: {
          created_at: string;
          id: string;
          message: string;
          recipient_id: string;
          sender_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          message: string;
          recipient_id: string;
          sender_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          message?: string;
          recipient_id?: string;
          sender_id?: string;
        };
        Relationships: [];
      };
      professionals: {
        Row: {
          id: string;
          user_id: string;
          full_name: string;
          email: string | null;
          phone: string | null;
          cpf: string | null;
          cref: string; // ✅ Adicione
          address: string | null;
          birth_date: string | null; 
          gender: string | null; 
          specialty: string | null;
          bio: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          full_name: string;
          email?: string | null;
          phone?: string | null;
          cpf?: string | null;
          cref: string; // ✅ Adicione
          address?: string | null;
          birth_date?: string | null; 
          gender?: string | null; 
          specialty?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          full_name?: string;
          email?: string | null;
          phone?: string | null;
          cpf?: string | null;
          cref?: string; // ✅ Adicione
          address?: string | null;
          birth_date?: string | null; 
          gender?: string | null; 
          specialty?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string | null;
          full_name: string | null;
          id: string;
        };
        Insert: {
          created_at?: string | null;
          full_name?: string | null;
          id: string;
        };
        Update: {
          created_at?: string | null;
          full_name?: string | null;
          id?: string;
        };
        Relationships: [];
      };
      students: {
        Row: {
          id: string;
          user_id: string;
          full_name: string;
          gender: string;
          phone: string;
          email: string;
          cpf: string;
          address: string;
          birth_date: string;
          health_certificate_url: string | null;
          avatar_url: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          full_name: string;
          gender: string;
          phone: string;
          email: string;
          cpf: string;
          address: string;
          birth_date: string;
          health_certificate_url?: string | null;
          avatar_url?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          full_name?: string;
          gender?: string;
          phone?: string;
          email?: string;
          cpf?: string;
          address?: string;
          birth_date?: string;
          health_certificate_url?: string | null;
          avatar_url?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
      DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
      DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never;
