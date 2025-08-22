const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function debugMGCPoints() {
  console.log('🔍 Debugging MGC Points Calculation...\n');

  try {
    // Get MGC team
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('*')
      .ilike('name', '%MGC%');

    if (teamsError || !teams.length) {
      console.error('❌ Error finding MGC team:', teamsError);
      return;
    }

    const mgcTeam = teams[0];
    console.log(`👥 Found MGC Team: ${mgcTeam.name} (ID: ${mgcTeam.id})\n`);

    // Get all MGC matches
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select(`
        *,
        holes!inner (
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
      .or(`team_a_id.eq.${mgcTeam.id},team_b_id.eq.${mgcTeam.id},team_c_id.eq.${mgcTeam.id}`);

    if (matchesError) {
      console.error('❌ Error fetching MGC matches:', matchesError);
      return;
    }

    console.log(`📊 Found ${matches.length} matches involving MGC\n`);

    let totalPoints = 0;
    let completedMatchPoints = 0;
    let liveMatchPoints = 0;

    matches.forEach(match => {
      const isMGCTeamA = match.team_a_id === mgcTeam.id;
      const isMGCTeamB = match.team_b_id === mgcTeam.id;
      const isMGCTeamC = match.team_c_id === mgcTeam.id;

      const points = calculateMatchPoints(match);
      
      console.log(`🎯 Game ${match.game_number}: ${match.division} ${match.match_type} ${match.session} - ${match.status}`);
      console.log(`   Date: ${match.match_date}, Tee: ${match.tee_time}`);
      console.log(`   Win: ${points.win}pts, Tie: ${points.tie}pts`);

      if (match.status === 'completed') {
        // For completed matches, we need to determine the actual result
        console.log(`   ✅ COMPLETED - Need to check actual result`);
        // This would require analyzing the hole scores to determine winner
        completedMatchPoints += points.win; // Assuming win for now
      } else if (match.status === 'in-progress') {
        console.log(`   ⚡ IN-PROGRESS - Currently getting live points`);
        console.log(`   Holes with scores: ${match.holes?.filter(h => h.team_a_score !== null).length || 0}/18`);
        
        // In the current system, in-progress matches award full points to the leader
        liveMatchPoints += points.win; // Assuming MGC is leading
      } else {
        console.log(`   📅 SCHEDULED - No points yet`);
      }

      console.log('');
    });

    console.log(`💰 POINTS BREAKDOWN FOR MGC:`);
    console.log(`   Completed Matches: ~${completedMatchPoints} points`);
    console.log(`   Live Match Bonuses: ~${liveMatchPoints} points`);
    console.log(`   Estimated Total: ~${completedMatchPoints + liveMatchPoints} points`);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

function calculateMatchPoints(match) {
  const { match_type, session, division, match_date } = match;
  
  // Determine day from date
  const matchDate = new Date(match_date);
  const dayOfWeek = matchDate.getDay(); // 0=Sunday, 5=Friday, 6=Saturday
  
  let day;
  if (dayOfWeek === 5) day = 'Friday';
  else if (dayOfWeek === 6) day = 'Saturday';
  else day = 'Sunday';
  
  // Points based on division type
  const isBowlMug = division === 'Bowl' || division === 'Mug';
  
  // Calculate points based on match type, day, session, and division
  if (day === 'Friday') {
    if (session === 'AM' && match_type === '4BBB') {
      return { win: 5, tie: 2.5 };
    } else if (session === 'PM' && match_type === 'Foursomes') {
      return isBowlMug ? { win: 4, tie: 2 } : { win: 3, tie: 1.5 };
    }
  } else if (day === 'Saturday') {
    if (session === 'AM' && match_type === '4BBB') {
      return { win: 5, tie: 2.5 };
    } else if (session === 'PM' && match_type === 'Foursomes') {
      return isBowlMug ? { win: 4, tie: 2 } : { win: 3, tie: 1.5 };
    }
  } else if (day === 'Sunday' && match_type === 'Singles') {
    return { win: 3, tie: 1.5 };
  }
  
  return { win: 1, tie: 0.5 };
}

debugMGCPoints();
