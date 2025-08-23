const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, supabaseServiceKey);

async function debugScoreDisplay() {
  console.log('🔍 Debugging Score Display...\n');

  try {
    const matchId = 1; // Use a real match ID

    // Get the current match with all holes
    console.log('📋 Fetching match data...');
    const { data: match, error: matchError } = await adminClient
      .from('matches')
      .select(`
        *,
        holes (
          hole_number,
          par,
          team_a_score,
          team_b_score,
          team_c_score,
          status,
          last_updated
        )
      `)
      .eq('id', matchId)
      .single();

    if (matchError) {
      console.error('❌ Error fetching match:', matchError);
      return;
    }

    console.log('✅ Match data:', {
      id: match.id,
      teams: `${match.team_a_id} vs ${match.team_b_id}`,
      status: match.status,
      holesCount: match.holes?.length || 0
    });

    // Display all holes with their scores
    console.log('\n📊 Hole Scores:');
    if (match.holes && match.holes.length > 0) {
      match.holes.forEach(hole => {
        console.log(`Hole ${hole.hole_number}:`);
        console.log(`  Team A: ${hole.team_a_score !== null ? hole.team_a_score : '-'}`);
        console.log(`  Team B: ${hole.team_b_score !== null ? hole.team_b_score : '-'}`);
        if (hole.team_c_score !== null) {
          console.log(`  Team C: ${hole.team_c_score}`);
        }
        console.log(`  Status: ${hole.status}`);
        console.log('');
      });
    } else {
      console.log('❌ No holes found for this match');
    }

    // Test updating a specific hole
    console.log('🔄 Testing hole update...');
    const testHoleNumber = 7;
    const { data: updateResult, error: updateError } = await adminClient
      .from('holes')
      .upsert({
        match_id: matchId,
        hole_number: testHoleNumber,
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

    if (updateError) {
      console.error('❌ Error updating hole:', updateError);
    } else {
      console.log('✅ Hole updated successfully:', updateResult);
    }

    // Fetch the match again to see if the update is reflected
    console.log('\n📋 Fetching updated match data...');
    const { data: updatedMatch, error: updatedMatchError } = await adminClient
      .from('matches')
      .select(`
        *,
        holes (
          hole_number,
          par,
          team_a_score,
          team_b_score,
          team_c_score,
          status,
          last_updated
        )
      `)
      .eq('id', matchId)
      .single();

    if (updatedMatchError) {
      console.error('❌ Error fetching updated match:', updatedMatchError);
    } else {
      console.log('✅ Updated match data retrieved');
      
      // Check if the test hole was updated
      const testHole = updatedMatch.holes?.find(h => h.hole_number === testHoleNumber);
      if (testHole) {
        console.log(`✅ Test hole ${testHoleNumber} updated correctly:`);
        console.log(`  Team A: ${testHole.team_a_score}`);
        console.log(`  Team B: ${testHole.team_b_score}`);
        console.log(`  Status: ${testHole.status}`);
      } else {
        console.log(`❌ Test hole ${testHoleNumber} not found in updated data`);
      }
    }

  } catch (error) {
    console.error('❌ Error debugging score display:', error);
  }
}

debugScoreDisplay();
