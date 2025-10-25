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
      integrations: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          provider: string
          provider_account_id: string | null
          access_token: string
          refresh_token: string | null
          token_expires_at: string | null
          settings: Json
          status: 'active' | 'expired' | 'revoked' | 'error'
          last_sync_at: string | null
          last_error: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          provider: string
          provider_account_id?: string | null
          access_token: string
          refresh_token?: string | null
          token_expires_at?: string | null
          settings?: Json
          status?: 'active' | 'expired' | 'revoked' | 'error'
          last_sync_at?: string | null
          last_error?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          provider?: string
          provider_account_id?: string | null
          access_token?: string
          refresh_token?: string | null
          token_expires_at?: string | null
          settings?: Json
          status?: 'active' | 'expired' | 'revoked' | 'error'
          last_sync_at?: string | null
          last_error?: string | null
        }
      }
      leads: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          status: string
          email: string | null
          phone: string | null
          first_name: string | null
          last_name: string | null
          value: number | null
          facebook_sent: boolean
          custom_data: Json
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          status: string
          email?: string | null
          phone?: string | null
          first_name?: string | null
          last_name?: string | null
          value?: number | null
          facebook_sent?: boolean
          custom_data?: Json
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          status?: string
          email?: string | null
          phone?: string | null
          first_name?: string | null
          last_name?: string | null
          value?: number | null
          facebook_sent?: boolean
          custom_data?: Json
        }
      }
      lead_events: {
        Row: {
          id: string
          created_at: string
          lead_id: string
          event_type: string
          event_data: Json
        }
        Insert: {
          id?: string
          created_at?: string
          lead_id: string
          event_type: string
          event_data?: Json
        }
        Update: {
          id?: string
          created_at?: string
          lead_id?: string
          event_type?: string
          event_data?: Json
        }
      }
      import_logs: {
        Row: {
          id: string
          created_at: string
          integration_id: string
          status: string
          records_processed: number
          records_imported: number
          records_skipped: number
          error_message: string | null
          metadata: Json
        }
        Insert: {
          id?: string
          created_at?: string
          integration_id: string
          status: string
          records_processed: number
          records_imported: number
          records_skipped: number
          error_message?: string | null
          metadata?: Json
        }
        Update: {
          id?: string
          created_at?: string
          integration_id?: string
          status?: string
          records_processed?: number
          records_imported?: number
          records_skipped?: number
          error_message?: string | null
          metadata?: Json
        }
      }
    }
    Views: {
      mv_contacts_by_source: {
        Row: {
          source: string | null
          lifecycle_stage: string | null
          date: string
          count: number
          unique_companies: number
        }
        Insert: {
          source?: string | null
          lifecycle_stage?: string | null
          date?: string
          count?: number
          unique_companies?: number
        }
        Update: {
          source?: string | null
          lifecycle_stage?: string | null
          date?: string
          count?: number
          unique_companies?: number
        }
      }
      mv_deals_pipeline: {
        Row: {
          stage: string
          date: string
          deal_count: number
          total_value: number
          avg_deal_size: number
          avg_probability: number
          weighted_value: number
        }
        Insert: {
          stage?: string
          date?: string
          deal_count?: number
          total_value?: number
          avg_deal_size?: number
          avg_probability?: number
          weighted_value?: number
        }
        Update: {
          stage?: string
          date?: string
          deal_count?: number
          total_value?: number
          avg_deal_size?: number
          avg_probability?: number
          weighted_value?: number
        }
      }
      mv_conversion_funnel: {
        Row: {
          date: string
          leads: number
          mql: number
          sql: number
          opportunities: number
          customers: number
        }
        Insert: {
          date?: string
          leads?: number
          mql?: number
          sql?: number
          opportunities?: number
          customers?: number
        }
        Update: {
          date?: string
          leads?: number
          mql?: number
          sql?: number
          opportunities?: number
          customers?: number
        }
      }
      mv_revenue_by_month: {
        Row: {
          month: string
          stage: string
          deals_closed: number
          revenue: number
          avg_deal_size: number
        }
        Insert: {
          month?: string
          stage?: string
          deals_closed?: number
          revenue?: number
          avg_deal_size?: number
        }
        Update: {
          month?: string
          stage?: string
          deals_closed?: number
          revenue?: number
          avg_deal_size?: number
        }
      }
      mv_top_sources: {
        Row: {
          source: string
          total_contacts: number
          converted_contacts: number
          conversion_rate: number
          total_deals: number
          revenue: number
          revenue_per_contact: number
        }
        Insert: {
          source?: string
          total_contacts?: number
          converted_contacts?: number
          conversion_rate?: number
          total_deals?: number
          revenue?: number
          revenue_per_contact?: number
        }
        Update: {
          source?: string
          total_contacts?: number
          converted_contacts?: number
          conversion_rate?: number
          total_deals?: number
          revenue?: number
          revenue_per_contact?: number
        }
      }
      mv_activity_timeline: {
        Row: {
          date: string
          activity_type: string
          activity_count: number
          unique_contacts: number
          unique_users: number
        }
        Insert: {
          date?: string
          activity_type?: string
          activity_count?: number
          unique_contacts?: number
          unique_users?: number
        }
        Update: {
          date?: string
          activity_type?: string
          activity_count?: number
          unique_contacts?: number
          unique_users?: number
        }
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'admin' | 'analyst' | 'viewer'
    }
  }
}

