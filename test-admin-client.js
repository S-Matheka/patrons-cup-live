const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🧪 Testing Admin Client...\n');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testAdminClient() {
  try {
    console.log('📋 Testing hole update...');
    
    // Test updating a hole score
    const { data, error } = await adminClient
      .from('holes')
      .upsert({
        match_id: 1,
        hole_number: 1,
        par: 4, // Add the required par field
        team_a_score: 4,
        team_b_score: 5,
        team_c_score: null,
        status: 'completed',
        last_updated: new Date().toISOString()
      }, {
        onConflict: 'match_id,hole_number'
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating hole:', error);
    } else {
      console.log('✅ Hole updated successfully:', data);
    }

    // Test reading holes
    console.log('\n📋 Testing hole read...');
    const { data: holes, error: readError } = await adminClient
      .from('holes')
      .select('*')
      .eq('match_id', 1)
      .limit(5);

    if (readError) {
      console.error('❌ Error reading holes:', readError);
    } else {
      console.log('✅ Holes read successfully:', holes?.length || 0, 'holes found');
    }

  } catch (error) {
    console.error('❌ Error testing admin client:', error);
  }
}

testAdminClient();
