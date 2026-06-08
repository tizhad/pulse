// Auto-generate this file by running:
//   npx supabase gen types typescript --project-id <YOUR_PROJECT_ID> > src/app/core/models/database.types.ts
// Hand-written version until the Supabase project is provisioned.

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type Database = {
  public: {
    Tables: {
      study_subjects: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          summary: string | null;
          category: string;
          priority: string;
          status: string;
          confidence_score: number;
          estimated_read_time: number | null;
          tags: string[];
          qa: Json;
          source_url: string | null;
          ai_summary: string | null;
          interviewed_on: string[];
          last_reviewed_at: string | null;
          next_review_at: string | null;
          is_archived: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          summary?: string | null;
          category: string;
          priority: string;
          status?: string;
          confidence_score?: number;
          estimated_read_time?: number | null;
          tags?: string[];
          qa?: Json;
          source_url?: string | null;
          ai_summary?: string | null;
          interviewed_on?: string[];
          last_reviewed_at?: string | null;
          next_review_at?: string | null;
          is_archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['study_subjects']['Insert']>;
        Relationships: [];
      };
      subject_companies: {
        Row: {
          id: string;
          subject_id: string;
          user_id: string;
          name: string;
          frequency: string;
          notes: string | null;
        };
        Insert: {
          id?: string;
          subject_id: string;
          user_id: string;
          name: string;
          frequency?: string;
          notes?: string | null;
        };
        Update: Partial<Database['public']['Tables']['subject_companies']['Insert']>;
        Relationships: [];
      };
      subject_notes: {
        Row: {
          id: string;
          subject_id: string;
          user_id: string;
          content: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          subject_id: string;
          user_id: string;
          content: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['subject_notes']['Insert']>;
        Relationships: [];
      };
      subject_code_samples: {
        Row: {
          id: string;
          subject_id: string;
          user_id: string;
          title: string;
          language: string;
          code: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          subject_id: string;
          user_id: string;
          title: string;
          language?: string;
          code: string;
          description?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['subject_code_samples']['Insert']>;
        Relationships: [];
      };
      subject_resources: {
        Row: {
          id: string;
          subject_id: string;
          user_id: string;
          title: string;
          url: string;
          type: string;
          read: boolean;
        };
        Insert: {
          id?: string;
          subject_id: string;
          user_id: string;
          title: string;
          url: string;
          type?: string;
          read?: boolean;
        };
        Update: Partial<Database['public']['Tables']['subject_resources']['Insert']>;
        Relationships: [];
      };
      companies: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          category: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          category: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['companies']['Insert']>;
        Relationships: [];
      };
      applications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          company: string;
          date: string;
          location: string | null;
          status: string;
          salary: string | null;
          url: string | null;
          tags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          company: string;
          date: string;
          location?: string | null;
          url?: string | null;
          status?: string;
          salary?: string | null;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['applications']['Insert']>;
        Relationships: [];
      };
      user_settings: {
        Row: {
          id: string;
          user_id: string;
          display_name: string | null;
          accent: string;
          resume: Json | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          display_name?: string | null;
          accent?: string;
          resume?: Json | null;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['user_settings']['Insert']>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

// Convenience row type aliases
export type SubjectRow = Database['public']['Tables']['study_subjects']['Row'];
export type CompanyTagRow = Database['public']['Tables']['subject_companies']['Row'];
export type StudyNoteRow = Database['public']['Tables']['subject_notes']['Row'];
export type CodeSampleRow = Database['public']['Tables']['subject_code_samples']['Row'];
export type ResourceRow = Database['public']['Tables']['subject_resources']['Row'];
export type CompanyRow = Database['public']['Tables']['companies']['Row'];
export type ApplicationRow = Database['public']['Tables']['applications']['Row'];
export type UserSettingsRow = Database['public']['Tables']['user_settings']['Row'];
