import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseAnonKey = process.env.SUPABASE_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

/**
 * Supabase client for client-side operations
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Supabase client for server-side operations with service role key
 * Note: In production, use a service role key for server operations
 */
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

/**
 * Database types for TypeScript
 */
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
        }
      }
      events: {
        Row: {
          id: string
          user_id: string
          input_params: any
          actuals: any
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          input_params: any
          actuals?: any
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          input_params?: any
          actuals?: any
          created_at?: string
        }
      }
      agent_results: {
        Row: {
          id: string
          event_id: string
          agent_name: string
          response_text: string
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          agent_name: string
          response_text: string
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          agent_name?: string
          response_text?: string
          created_at?: string
        }
      }
    }
  }
}
