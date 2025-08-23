const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugHoleData() {
  console.log('🔍 Debugging Hole Data...\n');

  try {
    // Get a few matches with hole data
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select(`
        *,
        holes (
          hole_number,
          par,
          team_a_score,
          team_b_score,
          team_c_score,
          team_a_strokes,
          team_b_strokes,
          team_c_strokes,
          status,
          last_updated
        )
      `)
      .eq('division', 'Trophy')
      .limit(3);

    if (matchesError) {
      console.error('❌ Error fetching matches:', matchesError);
      return;
    }

    matches.forEach((match, index) => {
      console.log(`\n📋 Match ${match.game_number}: ${match.match_type} ${match.session} (${match.status})`);
      console.log(`Teams: ${match.team_a_id}, ${match.team_b_id}${match.team_c_id ? ', ' + match.team_c_id : ''}`);
      console.log(`Holes: ${match.holes.length}`);
      
      // Show first few holes
      match.holes.slice(0, 5).forEach(hole => {
        console.log(`  Hole ${hole.hole_number}:`);
        console.log(`    Par: ${hole.par}`);
        console.log(`    Team A Score: ${hole.team_a_score}, Strokes: ${hole.team_a_strokes}`);
        console.log(`    Team B Score: ${hole.team_b_score}, Strokes: ${hole.team_b_strokes}`);
        if (hole.team_c_score !== null) {
          console.log(`    Team C Score: ${hole.team_c_score}, Strokes: ${hole.team_c_strokes}`);
        }
        console.log(`    Status: ${hole.status}`);
      });

      // Calculate totals
      let teamATotal = 0;
      let teamBTotal = 0;
      let teamCTotal = 0;
      let teamAHolesWon = 0;
      let teamBHolesWon = 0;

      match.holes.forEach(hole => {
        if (hole.team_a_strokes) teamATotal += hole.team_a_strokes;
        if (hole.team_b_strokes) teamBTotal += hole.team_b_strokes;
        if (hole.team_c_strokes) teamCTotal += hole.team_c_strokes;

        if (hole.team_a_strokes && hole.team_b_strokes) {
          if (hole.team_a_strokes < hole.team_b_strokes) {
            teamAHolesWon++;
          } else if (hole.team_b_strokes < hole.team_a_strokes) {
            teamBHolesWon++;
          }
        }
      });

      console.log(`\n📊 Match Totals:`);
      console.log(`  Team A Total Strokes: ${teamATotal}`);
      console.log(`  Team B Total Strokes: ${teamBTotal}`);
      if (match.team_c_id) {
        console.log(`  Team C Total Strokes: ${teamCTotal}`);
      }
      console.log(`  Holes Won - Team A: ${teamAHolesWon}, Team B: ${teamBHolesWon}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugHoleData();
