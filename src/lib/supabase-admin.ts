import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Create admin Supabase client with service role key for admin operations
// Only create if both URL and service key are available
let supabaseAdmin: any = null;

if (supabaseUrl && supabaseServiceKey) {
  try {
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    console.log('✅ Admin client created successfully');
  } catch (error) {
    console.error('❌ Failed to create admin client:', error);
    supabaseAdmin = null;
  }
} else {
  console.warn('⚠️ Admin client not created - missing environment variables');
}

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
    return supabaseAdmin;
  }
  
  if (supabase) {
    console.warn('⚠️ Using fallback client - some operations may fail');
    return supabase;
  }
  
  throw new Error('Admin client not available - check environment variables');
}
