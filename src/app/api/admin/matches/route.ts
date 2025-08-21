import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Helper function to get admin client
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log('🔍 Environment check:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseServiceKey,
    urlLength: supabaseUrl?.length || 0,
    keyLength: supabaseServiceKey?.length || 0
  });
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables:', {
      NEXT_PUBLIC_SUPABASE_URL: supabaseUrl ? 'SET' : 'MISSING',
      SUPABASE_SERVICE_ROLE_KEY: supabaseServiceKey ? 'SET' : 'MISSING'
    });
    throw new Error(`Missing Supabase environment variables: URL=${!!supabaseUrl}, KEY=${!!supabaseServiceKey}`);
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export async function PUT(request: NextRequest) {
  try {
    console.log('🚀 PUT request received');
    const { id, ...matchData } = await request.json();
    
    console.log('🔧 Server-side admin match update:', { id, matchData });
    
    const supabaseAdmin = getSupabaseAdmin();
    console.log('✅ Supabase admin client created successfully');
    
    const { data, error } = await supabaseAdmin
      .from('matches')
      .update(matchData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase update error:', JSON.stringify(error, null, 2));
      return NextResponse.json({ 
        error: error.message,
        details: error.details || 'No additional details',
        hint: error.hint || 'No hint provided'
      }, { status: 400 });
    }

    console.log('✅ Server admin success:', data);
    return NextResponse.json({ data });
  } catch (error) {
    console.error('❌ Server admin API error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      type: 'API_ERROR'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 POST request received');
    const matchData = await request.json();
    
    console.log('🔧 Server-side admin match create:', matchData);
    
    const supabaseAdmin = getSupabaseAdmin();
    console.log('✅ Supabase admin client created successfully');
    
    const { data, error } = await supabaseAdmin
      .from('matches')
      .insert(matchData)
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase insert error:', JSON.stringify(error, null, 2));
      return NextResponse.json({ 
        error: error.message,
        details: error.details || 'No additional details',
        hint: error.hint || 'No hint provided'
      }, { status: 400 });
    }

    console.log('✅ Server admin success:', data);
    return NextResponse.json({ data });
  } catch (error) {
    console.error('❌ Server admin API error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      type: 'API_ERROR'
    }, { status: 500 });
  }
}
