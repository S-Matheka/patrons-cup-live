import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Create admin Supabase client with service role key for admin operations
export const supabaseAdmin = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null

// Helper function to check if admin client is configured
export const isSupabaseAdminConfigured = () => {
  return !!(supabaseUrl && 
           supabaseServiceKey && 
           supabaseUrl !== 'your_supabase_url_here' &&
           supabaseServiceKey !== 'your_supabase_service_role_key_here')
}

// Import regular supabase client for fallback
import { supabase } from './supabase'

// Fallback to regular supabase client if admin is not configured
export const getAdminClient = () => {
  if (supabaseAdmin) {
    return supabaseAdmin
  }
  
  // Fallback to regular client (will need RLS policies to be permissive)
  return supabase
}
