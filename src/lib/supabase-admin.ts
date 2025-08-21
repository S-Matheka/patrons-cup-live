import { createClient } from '@supabase/supabase-js'
import { supabase } from './supabase'

// Helper function to create admin client only when needed
function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing admin environment variables:', {
      NEXT_PUBLIC_SUPABASE_URL: supabaseUrl ? 'SET' : 'MISSING',
      SUPABASE_SERVICE_ROLE_KEY: supabaseServiceKey ? 'SET' : 'MISSING'
    });
    return null;
  }
  
  try {
    return createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  } catch (error) {
    console.error('❌ Failed to create admin client:', error);
    return null;
  }
}

// Helper function to check if admin client is configured
export const isSupabaseAdminConfigured = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return !!(supabaseUrl && 
           supabaseServiceKey && 
           supabaseUrl !== 'your_supabase_url_here' &&
           supabaseServiceKey !== 'your_supabase_service_role_key_here')
}

// Get admin client or fallback to regular client
export const getAdminClient = () => {
  const adminClient = createAdminClient();
  
  if (adminClient) {
    console.log('✅ Admin client created successfully');
    return adminClient;
  }
  
  if (supabase) {
    console.warn('⚠️ Using fallback client - some operations may fail');
    return supabase;
  }
  
  throw new Error('Admin client not available - check environment variables');
}
