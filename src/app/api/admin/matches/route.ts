import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Server-side admin client with service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function PUT(request: NextRequest) {
  try {
    const { id, ...matchData } = await request.json();
    
    console.log('🔧 Server-side admin match update:', { id, matchData });
    
    const { data, error } = await supabaseAdmin
      .from('matches')
      .update(matchData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Server admin error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.log('✅ Server admin success:', data);
    return NextResponse.json({ data });
  } catch (error) {
    console.error('❌ Server admin API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const matchData = await request.json();
    
    console.log('🔧 Server-side admin match create:', matchData);
    
    const { data, error } = await supabaseAdmin
      .from('matches')
      .insert(matchData)
      .select()
      .single();

    if (error) {
      console.error('❌ Server admin error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.log('✅ Server admin success:', data);
    return NextResponse.json({ data });
  } catch (error) {
    console.error('❌ Server admin API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
