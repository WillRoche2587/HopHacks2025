import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables. Using mock data.')
}

/**
 * Supabase client for client-side operations
 */
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

/**
 * Supabase client for server-side operations with service role key
 * Note: In production, use a service role key for server operations
 */
export const supabaseAdmin = supabaseUrl && supabaseAnonKey
  ? createClient(
      supabaseUrl,
      process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  : null

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
          event_type: string
          location: string
          date: string
          duration: string
          expected_attendance: number
          budget: number
          audience: string
          special_requirements: string
          notes?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          event_type: string
          location: string
          date: string
          duration: string
          expected_attendance: number
          budget: number
          audience: string
          special_requirements: string
          notes?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          event_type?: string
          location?: string
          date?: string
          duration?: string
          expected_attendance?: number
          budget?: number
          audience?: string
          special_requirements?: string
          notes?: string
          created_at?: string
          updated_at?: string
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
