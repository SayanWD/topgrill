/**
 * Database types
 * Generated via: supabase gen types typescript
 * 
 * Run `npm run db:types` after schema changes
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: 'admin' | 'analyst' | 'viewer'
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'admin' | 'analyst' | 'viewer'
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'admin' | 'analyst' | 'viewer'
        }
      }
      contacts: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          external_id: string | null
          email: string
          first_name: string | null
          last_name: string | null
          phone: string | null
          company_id: string | null
          source: string | null
          status: string
          lifecycle_stage: string | null
          metadata: Json
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          external_id?: string | null
          email: string
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          company_id?: string | null
          source?: string | null
          status?: string
          lifecycle_stage?: string | null
          metadata?: Json
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          external_id?: string | null
          email?: string
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          company_id?: string | null
          source?: string | null
          status?: string
          lifecycle_stage?: string | null
          metadata?: Json
        }
      }
      companies: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          external_id: string | null
          name: string
          domain: string | null
          industry: string | null
          size: string | null
          metadata: Json
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          external_id?: string | null
          name: string
          domain?: string | null
          industry?: string | null
          size?: string | null
          metadata?: Json
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          external_id?: string | null
          name?: string
          domain?: string | null
          industry?: string | null
          size?: string | null
          metadata?: Json
        }
      }
      deals: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          external_id: string | null
          name: string
          contact_id: string | null
          company_id: string | null
          amount: number
          currency: string
          stage: string
          probability: number
          close_date: string | null
          owner_id: string | null
          metadata: Json
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          external_id?: string | null
          name: string
          contact_id?: string | null
          company_id?: string | null
          amount: number
          currency?: string
          stage: string
          probability?: number
          close_date?: string | null
          owner_id?: string | null
          metadata?: Json
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          external_id?: string | null
          name?: string
          contact_id?: string | null
          company_id?: string | null
          amount?: number
          currency?: string
          stage?: string
          probability?: number
          close_date?: string | null
          owner_id?: string | null
          metadata?: Json
        }
      }
      activities: {
        Row: {
          id: string
          created_at: string
          activity_type: string
          contact_id: string | null
          deal_id: string | null
          user_id: string | null
          subject: string | null
          body: string | null
          metadata: Json
        }
        Insert: {
          id?: string
          created_at?: string
          activity_type: string
          contact_id?: string | null
          deal_id?: string | null
          user_id?: string | null
          subject?: string | null
          body?: string | null
          metadata?: Json
        }
        Update: {
          id?: string
          created_at?: string
          activity_type?: string
          contact_id?: string | null
          deal_id?: string | null
          user_id?: string | null
          subject?: string | null
          body?: string | null
          metadata?: Json
        }
      }
      events: {
        Row: {
          id: string
          created_at: string
          event_name: string
          event_type: string
          source: string
          contact_id: string | null
          session_id: string | null
          user_agent: string | null
          ip_address: string | null
          properties: Json
          idempotency_key: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          event_name: string
          event_type: string
          source: string
          contact_id?: string | null
          session_id?: string | null
          user_agent?: string | null
          ip_address?: string | null
          properties?: Json
          idempotency_key?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          event_name?: string
          event_type?: string
          source?: string
          contact_id?: string | null
          session_id?: string | null
          user_agent?: string | null
          ip_address?: string | null
          properties?: Json
          idempotency_key?: string | null
        }
      }
      metrics_daily: {
        Row: {
          id: string
          date: string
          metric_name: string
          metric_value: number
          dimensions: Json
          created_at: string
        }
        Insert: {
          id?: string
          date: string
          metric_name: string
          metric_value: number
          dimensions?: Json
          created_at?: string
        }
        Update: {
          id?: string
          date?: string
          metric_name?: string
          metric_value?: number
          dimensions?: Json
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'admin' | 'analyst' | 'viewer'
    }
  }
}

