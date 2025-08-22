import { NextRequest, NextResponse } from 'next/server';

let supabaseAdmin: any = null;

function getSupabaseAdmin() {
  if (supabaseAdmin) return supabaseAdmin;
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log('🔧 Admin API Environment Check:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseServiceKey,
    urlValue: supabaseUrl?.substring(0, 20) + '...'
  });
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables');
    return null;
  }
  
  try {
    const { createClient } = require('@supabase/supabase-js');
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    console.log('✅ Admin Supabase client created successfully');
    return supabaseAdmin;
  } catch (error) {
    console.error('❌ Failed to create admin Supabase client:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  console.log('🔄 POST /api/admin/players - Creating new player');
  
  try {
    const adminClient = getSupabaseAdmin();
    if (!adminClient) {
      return NextResponse.json(
        { error: 'Admin client not available' },
        { status: 500 }
      );
    }

    const body = await request.json();
    console.log('📊 Received player data:', body);
    
    // Prepare clean player data - NEVER include ID
    const playerData = {
      name: body.name?.trim(),
      team_id: body.team_id,
      is_pro: body.is_pro || false,
      is_ex_officio: body.is_ex_officio || false,
      is_junior: body.is_junior || false,
      position: body.position || 'Regular Player',
      updated_at: new Date().toISOString()
    };
    
    console.log('📊 Clean player data for insert:', playerData);
    
    // Insert new player - let database auto-generate ID
    const { data, error } = await adminClient
      .from('players')
      .insert(playerData)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Database error:', error);
      return NextResponse.json(
        { 
          error: `Database error: ${error.message}`,
          details: error.message,
          hint: error.hint,
          code: error.code,
          fullError: error
        },
        { status: 400 }
      );
    }
    
    console.log('✅ Player created successfully:', data);
    return NextResponse.json({ data });
    
  } catch (error: any) {
    console.error('❌ API Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  console.log('🔄 PUT /api/admin/players - Updating existing player');
  
  try {
    const adminClient = getSupabaseAdmin();
    if (!adminClient) {
      return NextResponse.json(
        { error: 'Admin client not available' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const playerId = body.id;
    
    if (!playerId) {
      return NextResponse.json(
        { error: 'Player ID is required for updates' },
        { status: 400 }
      );
    }
    
    console.log('📊 Updating player ID:', playerId, 'with data:', body);
    
    // Prepare update data - exclude ID from the update payload
    const updateData = {
      name: body.name?.trim(),
      team_id: body.team_id,
      is_pro: body.is_pro || false,
      is_ex_officio: body.is_ex_officio || false,
      is_junior: body.is_junior || false,
      position: body.position || 'Regular Player',
      updated_at: new Date().toISOString()
    };
    
    console.log('📊 Clean update data:', updateData);
    
    const { data, error } = await adminClient
      .from('players')
      .update(updateData)
      .eq('id', playerId)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Database error:', error);
      return NextResponse.json(
        { 
          error: 'Failed to update player',
          details: error.message,
          hint: error.hint,
          code: error.code
        },
        { status: 400 }
      );
    }
    
    console.log('✅ Player updated successfully:', data);
    return NextResponse.json({ data });
    
  } catch (error: any) {
    console.error('❌ API Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
}
