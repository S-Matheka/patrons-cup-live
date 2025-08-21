import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    env_check: {
      NEXT_PUBLIC_SUPABASE_URL: {
        exists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        length: process.env.NEXT_PUBLIC_SUPABASE_URL?.length || 0,
        value: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING'
      },
      NEXT_PUBLIC_SUPABASE_ANON_KEY: {
        exists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        length: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
        value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING'
      },
      SUPABASE_SERVICE_ROLE_KEY: {
        exists: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        length: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
        value: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING'
      }
    },
    all_env_vars: Object.keys(process.env).filter(key => key.includes('SUPABASE'))
  });
}
