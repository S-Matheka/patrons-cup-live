import { NextResponse } from 'next/server';

let supabaseAdmin: any = null;

function getSupabaseAdmin() {
  if (supabaseAdmin) return supabaseAdmin;
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }
  
  try {
    const { createClient } = require('@supabase/supabase-js');
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    return supabaseAdmin;
  } catch (error) {
    return null;
  }
}

export async function GET() {
  try {
    const adminClient = getSupabaseAdmin();
    if (!adminClient) {
      return NextResponse.json({ error: 'Admin client not available' }, { status: 500 });
    }

    // Get a sample record to see the actual data structure
    const { data: sampleRecord, error: selectError } = await adminClient
      .from('players')
      .select('*')
      .limit(1);

    // Try a test insert to see what columns are expected
    const testData = {
      name: 'TEST_PLAYER_DELETE_ME',
      team_id: 1,
      is_pro: false,
      is_ex_officio: false,
      is_junior: false,
      position: 'Regular Player'
    };

    const { data: insertTest, error: insertError } = await adminClient
      .from('players')
      .insert(testData)
      .select();

    // If insert worked, delete the test record
    if (insertTest && insertTest[0]) {
      await adminClient
        .from('players')
        .delete()
        .eq('id', insertTest[0].id);
    }

    return NextResponse.json({
      sampleRecord: sampleRecord?.[0] || 'No records found',
      testInsert: insertTest?.[0] || 'Insert failed',
      selectError: selectError?.message || null,
      insertError: insertError?.message || null,
      insertErrorDetails: insertError || null,
      message: 'Players table debug information'
    });

  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
}
