const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function debugCurrentStandings() {
  console.log('🔍 Debugging Current Tournament Standings...\n');

  try {
    // Get all matches with their holes data
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
      `);

    if (matchesError) {
      console.error('❌ Error fetching matches:', matchesError);
      return;
    }

    console.log(`📊 Found ${matches.length} matches with hole data\n`);

    // Get all teams
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('*');

    if (teamsError) {
      console.error('❌ Error fetching teams:', teamsError);
      return;
    }

    console.log(`👥 Found ${teams.length} teams\n`);

    // Group matches by status
    const scheduled = matches.filter(m => m.status === 'scheduled');
    const inProgress = matches.filter(m => m.status === 'in-progress');
    const completed = matches.filter(m => m.status === 'completed');

    console.log('📈 MATCH STATUS SUMMARY:');
    console.log(`   Scheduled: ${scheduled.length}`);
    console.log(`   In Progress: ${inProgress.length}`);
    console.log(`   Completed: ${completed.length}\n`);

    // Show current date matches
    const today = new Date().toISOString().split('T')[0];
    const todayMatches = matches.filter(m => m.match_date === today);
    
    console.log(`📅 TODAY'S MATCHES (${today}): ${todayMatches.length}`);
    todayMatches.forEach(match => {
      const teamA = teams.find(t => t.id === match.team_a_id);
      const teamB = teams.find(t => t.id === match.team_b_id);
      const teamC = match.team_c_id ? teams.find(t => t.id === match.team_c_id) : null;
      
      console.log(`   Game ${match.game_number}: ${teamA?.name || 'Unknown'} vs ${teamB?.name || 'Unknown'}${teamC ? ` vs ${teamC.name}` : ''}`);
      console.log(`      ${match.division} ${match.match_type} ${match.session} - ${match.status}`);
      console.log(`      Holes with data: ${match.holes?.length || 0}`);
    });

    // Show completed matches and their potential points
    console.log('\n🏆 COMPLETED MATCHES AND POINTS:');
    completed.forEach(match => {
      const teamA = teams.find(t => t.id === match.team_a_id);
      const teamB = teams.find(t => t.id === match.team_b_id);
      
      // Calculate points for this match
      const points = calculateMatchPoints(match);
      
      console.log(`   Game ${match.game_number}: ${teamA?.name || 'Unknown'} vs ${teamB?.name || 'Unknown'}`);
      console.log(`      ${match.division} ${match.match_type} ${match.session} on ${match.match_date}`);
      console.log(`      Potential points: Win=${points.win}, Tie=${points.tie}, Loss=0`);
    });

    // Show in-progress matches
    if (inProgress.length > 0) {
      console.log('\n⚡ IN-PROGRESS MATCHES:');
      inProgress.forEach(match => {
        const teamA = teams.find(t => t.id === match.team_a_id);
        const teamB = teams.find(t => t.id === match.team_b_id);
        
        console.log(`   Game ${match.game_number}: ${teamA?.name || 'Unknown'} vs ${teamB?.name || 'Unknown'}`);
        console.log(`      ${match.division} ${match.match_type} ${match.session}`);
        console.log(`      Holes with scores: ${match.holes?.filter(h => h.team_a_score !== null).length || 0}/18`);
      });
    }

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

debugCurrentStandings();
