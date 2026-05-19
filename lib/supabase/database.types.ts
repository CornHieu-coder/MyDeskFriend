export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      locations: {
        Row: {
          id: number;
          name: string;
          building: string;
          floor: string | null;
          description: string | null;
          qr_slug: string;
          created_at: string;
        };
        Insert: {
          id: number;
          name: string;
          building: string;
          floor?: string | null;
          description?: string | null;
          qr_slug: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          building?: string;
          floor?: string | null;
          description?: string | null;
          qr_slug?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          display_name: string;
          courses: string[];
          created_at: string;
          updated_at: string;
          last_seen: string | null;
          current_location_id: number | null;
        };
        Insert: {
          id?: string;
          display_name: string;
          courses?: string[];
          created_at?: string;
          updated_at?: string;
          last_seen?: string | null;
          current_location_id?: number | null;
        };
        Update: {
          id?: string;
          display_name?: string;
          courses?: string[];
          created_at?: string;
          updated_at?: string;
          last_seen?: string | null;
          current_location_id?: number | null;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          location_id: number;
          author_id: string | null;
          // Canonical anonymous display label. Keep pseudonym during migration only.
          author_label: string;
          pseudonym: string;
          body: string;
          tags: string[];
          course_tags: string[];
          upvotes: number;
          status: "public" | "pending" | "hidden";
          term_week_when_written: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          location_id: number;
          author_id?: string | null;
          // Canonical anonymous display label. Keep pseudonym during migration only.
          author_label?: string;
          pseudonym?: string;
          body: string;
          tags?: string[];
          course_tags?: string[];
          upvotes?: number;
          status?: "public" | "pending" | "hidden";
          term_week_when_written?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          location_id?: number;
          author_id?: string | null;
          // Canonical anonymous display label. Keep pseudonym during migration only.
          author_label?: string;
          pseudonym?: string;
          body?: string;
          tags?: string[];
          course_tags?: string[];
          upvotes?: number;
          status?: "public" | "pending" | "hidden";
          term_week_when_written?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
