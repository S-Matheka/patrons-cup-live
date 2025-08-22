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

    // Check the actual table structure
    const { data: columns, error } = await adminClient
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'players')
      .order('ordinal_position');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Also get a sample record to see the actual data structure
    const { data: sampleRecord } = await adminClient
      .from('players')
      .select('*')
      .limit(1);

    return NextResponse.json({
      columns,
      sampleRecord: sampleRecord?.[0] || 'No records found',
      message: 'Players table schema information'
    });

  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
}
