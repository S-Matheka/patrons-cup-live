// =====================================================
// DEBUG: Check why standings aren't syncing with live data
// =====================================================

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugStandingsSync() {
  console.log('🔍 DEBUGGING STANDINGS SYNC ISSUE...\n');

  try {
    // 1. Check completed matches
    console.log('1️⃣ CHECKING COMPLETED MATCHES:');
    const { data: completedMatches, error: matchError } = await supabase
      .from('matches')
      .select('id, game_number, status, team_a_id, team_b_id, division')
      .eq('status', 'completed');

    if (matchError) throw matchError;
    
    console.log(`   Found ${completedMatches?.length || 0} completed matches:`);
    completedMatches?.forEach(match => {
      console.log(`   - Match ${match.game_number}: Team ${match.team_a_id} vs Team ${match.team_b_id} (${match.division})`);
    });

    // 2. Check scores table
    console.log('\n2️⃣ CHECKING SCORES TABLE:');
    const { data: scores, error: scoresError } = await supabase
      .from('scores')
      .select('team_id, division, points, matches_played, matches_won, matches_lost, matches_halved')
      .order('points', { ascending: false });

    if (scoresError) throw scoresError;
    
    console.log(`   Found ${scores?.length || 0} score records:`);
    scores?.forEach(score => {
      console.log(`   - Team ${score.team_id}: ${score.points} pts, ${score.matches_played} played, ${score.matches_won}W-${score.matches_lost}L-${score.matches_halved}H`);
    });

    // 3. Check if scores table has any non-zero data
    const nonZeroScores = scores?.filter(s => s.points > 0 || s.matches_played > 0) || [];
    console.log(`\n   📊 Teams with non-zero data: ${nonZeroScores.length}`);

    // 4. Check matches with holes data
    console.log('\n3️⃣ CHECKING MATCHES WITH HOLE DATA:');
    const { data: matchesWithHoles, error: holesError } = await supabase
      .from('matches')
      .select(`
        id,
        game_number,
        status,
        team_a_id,
        team_b_id,
        holes (
          hole_number,
          team_a_score,
          team_b_score,
          status
        )
      `)
      .limit(5);

    if (holesError) throw holesError;

    console.log(`   Sample matches with holes data:`);
    matchesWithHoles?.forEach(match => {
      const completedHoles = match.holes?.filter(h => h.status === 'completed').length || 0;
      const totalHoles = match.holes?.length || 0;
      console.log(`   - Match ${match.game_number}: ${completedHoles}/${totalHoles} holes completed`);
      
      if (completedHoles > 0) {
        console.log(`     Sample hole data:`, match.holes?.slice(0, 2));
      }
    });

    // 5. Final diagnosis
    console.log('\n🎯 DIAGNOSIS:');
    if (completedMatches?.length === 0) {
      console.log('   ❌ NO COMPLETED MATCHES - This is why standings show 0');
      console.log('   📝 Matches need status="completed" to update standings');
    } else if (nonZeroScores.length === 0) {
      console.log('   ❌ COMPLETED MATCHES EXIST BUT SCORES NOT UPDATED');
      console.log('   📝 The updateTournamentStandings function may have errors');
    } else {
      console.log('   ✅ Data looks good - may be a frontend display issue');
    }

  } catch (error) {
    console.error('❌ Error during diagnosis:', error);
  }
}

debugStandingsSync();
