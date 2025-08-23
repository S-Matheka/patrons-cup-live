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
  console.log('🧪 Testing Hole Persistence...\n');

  try {
    const matchId = 81; // Use the match from the screenshot

    // Get the current match with all holes
    console.log('📋 Fetching current match data...');
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

    // Display current hole scores
    console.log('\n📊 Current Hole Scores:');
    if (match.holes && match.holes.length > 0) {
      match.holes
        .sort((a, b) => a.hole_number - b.hole_number)
        .forEach(hole => {
          console.log(`Hole ${hole.hole_number}: Team A: ${hole.team_a_score !== null ? hole.team_a_score : '-'}, Team B: ${hole.team_b_score !== null ? hole.team_b_score : '-'}, Status: ${hole.status}`);
        });
    }

    // Test updating holes 10, 11, 12
    console.log('\n🔄 Testing hole updates for holes 10, 11, 12...');
    
    const testHoles = [
      { holeNumber: 10, teamAScore: 4, teamBScore: 5 },
      { holeNumber: 11, teamAScore: 3, teamBScore: 4 },
      { holeNumber: 12, teamAScore: 4, teamBScore: 4 }
    ];

    for (const testHole of testHoles) {
      console.log(`\n📝 Updating Hole ${testHole.holeNumber}...`);
      
      const { data: updateResult, error: updateError } = await adminClient
        .from('holes')
        .upsert({
          match_id: matchId,
          hole_number: testHole.holeNumber,
          par: 4,
          team_a_score: testHole.teamAScore,
          team_b_score: testHole.teamBScore,
          team_c_score: null,
          status: 'completed',
          last_updated: new Date().toISOString()
        }, {
          onConflict: 'match_id,hole_number'
        })
        .select()
        .single();

      if (updateError) {
        console.error(`❌ Error updating hole ${testHole.holeNumber}:`, updateError);
      } else {
        console.log(`✅ Hole ${testHole.holeNumber} updated successfully:`, {
          teamA: updateResult.team_a_score,
          teamB: updateResult.team_b_score,
          status: updateResult.status
        });
      }
    }

    // Fetch the match again to see all updates
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
      
      // Display all hole scores after updates
      console.log('\n📊 Final Hole Scores:');
      if (updatedMatch.holes && updatedMatch.holes.length > 0) {
        updatedMatch.holes
          .sort((a, b) => a.hole_number - b.hole_number)
          .forEach(hole => {
            console.log(`Hole ${hole.hole_number}: Team A: ${hole.team_a_score !== null ? hole.team_a_score : '-'}, Team B: ${hole.team_b_score !== null ? hole.team_b_score : '-'}, Status: ${hole.status}`);
          });
      }

      // Check specific test holes
      console.log('\n🎯 Test Results:');
      testHoles.forEach(testHole => {
        const hole = updatedMatch.holes?.find(h => h.hole_number === testHole.holeNumber);
        if (hole) {
          const success = hole.team_a_score === testHole.teamAScore && hole.team_b_score === testHole.teamBScore;
          console.log(`Hole ${testHole.holeNumber}: ${success ? '✅ PASS' : '❌ FAIL'} (Expected: A=${testHole.teamAScore}, B=${testHole.teamBScore}, Got: A=${hole.team_a_score}, B=${hole.team_b_score})`);
        } else {
          console.log(`Hole ${testHole.holeNumber}: ❌ FAIL (Hole not found)`);
        }
      });
    }

  } catch (error) {
    console.error('❌ Error testing hole persistence:', error);
  }
}

testHolePersistence();
