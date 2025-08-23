const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, supabaseServiceKey);

async function testHolePersistence() {
  console.log('🧪 Testing Hole Score Persistence...\n');

  try {
    const matchId = 1; // Use a real match ID

    // First, let's see what holes currently exist
    console.log('📋 Current holes for match:', matchId);
    const { data: currentHoles } = await adminClient
      .from('holes')
      .select('*')
      .eq('match_id', matchId)
      .order('hole_number');

    console.log('Current holes:', currentHoles?.map(h => ({
      hole: h.hole_number,
      teamA: h.team_a_score,
      teamB: h.team_b_score,
      status: h.status
    })));

    // Update hole 1
    console.log('\n🔄 Updating hole 1...');
    const { data: hole1Update, error: error1 } = await adminClient
      .from('holes')
      .upsert({
        match_id: matchId,
        hole_number: 1,
        par: 4,
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

    if (error1) {
      console.error('❌ Error updating hole 1:', error1);
    } else {
      console.log('✅ Hole 1 updated:', hole1Update);
    }

    // Update hole 2
    console.log('\n🔄 Updating hole 2...');
    const { data: hole2Update, error: error2 } = await adminClient
      .from('holes')
      .upsert({
        match_id: matchId,
        hole_number: 2,
        par: 4,
        team_a_score: 3,
        team_b_score: 4,
        team_c_score: null,
        status: 'completed',
        last_updated: new Date().toISOString()
      }, {
        onConflict: 'match_id,hole_number'
      })
      .select()
      .single();

    if (error2) {
      console.error('❌ Error updating hole 2:', error2);
    } else {
      console.log('✅ Hole 2 updated:', hole2Update);
    }

    // Check if both holes are still there
    console.log('\n📋 Checking if both holes persist...');
    const { data: finalHoles } = await adminClient
      .from('holes')
      .select('*')
      .eq('match_id', matchId)
      .order('hole_number');

    console.log('Final holes:', finalHoles?.map(h => ({
      hole: h.hole_number,
      teamA: h.team_a_score,
      teamB: h.team_b_score,
      status: h.status
    })));

    // Verify both holes are present
    const hole1 = finalHoles?.find(h => h.hole_number === 1);
    const hole2 = finalHoles?.find(h => h.hole_number === 2);

    if (hole1 && hole2) {
      console.log('\n✅ SUCCESS: Both holes persist correctly!');
      console.log('Hole 1:', hole1.team_a_score, 'vs', hole1.team_b_score);
      console.log('Hole 2:', hole2.team_a_score, 'vs', hole2.team_b_score);
    } else {
      console.log('\n❌ FAILURE: Holes are not persisting correctly');
      console.log('Hole 1 found:', !!hole1);
      console.log('Hole 2 found:', !!hole2);
    }

  } catch (error) {
    console.error('❌ Error testing hole persistence:', error);
  }
}

testHolePersistence();
