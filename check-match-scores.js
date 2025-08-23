require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Get a specific 3-way Foursomes match
    const matchId = 94; // An in-progress match from previous output
    
    console.log(`\nChecking details for match ${matchId}...`);
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single();
      
    if (matchError) {
      console.error(`Error fetching match ${matchId}:`, matchError);
      return;
    }
    
    console.log('Match details:', {
      id: match.id,
      status: match.status,
      match_type: match.match_type,
      is_three_way: match.is_three_way,
      teams: [match.team_a_id, match.team_b_id, match.team_c_id]
    });
    
    // Get team names
    const teamIds = [match.team_a_id, match.team_b_id, match.team_c_id].filter(Boolean);
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('id, name')
      .in('id', teamIds);
      
    if (teamsError) {
      console.error('Error fetching teams:', teamsError);
    } else {
      console.log('Teams:', teams);
    }
    
    // Get holes for this match
    const { data: holes, error: holesError } = await supabase
      .from('holes')
      .select('*')
      .eq('match_id', match.id);
      
    if (holesError) {
      console.error(`Error fetching holes for match ${match.id}:`, holesError);
      return;
    }
    
    console.log(`\nHoles for match ${match.id}:`);
    
    // Calculate total scores
    let teamATotal = 0;
    let teamBTotal = 0;
    let teamCTotal = 0;
    let holesCompleted = 0;
    
    holes.sort((a, b) => a.number - b.number).forEach(hole => {
      console.log(`Hole ${hole.number}: A=${hole.team_a_score}, B=${hole.team_b_score}, C=${hole.team_c_score}`);
      
      if (hole.team_a_score !== null && hole.team_b_score !== null && hole.team_c_score !== null) {
        teamATotal += hole.team_a_score;
        teamBTotal += hole.team_b_score;
        teamCTotal += hole.team_c_score;
        holesCompleted++;
      }
    });
    
    console.log(`\nTotal scores after ${holesCompleted} holes:`);
    console.log(`Team A: ${teamATotal}`);
    console.log(`Team B: ${teamBTotal}`);
    console.log(`Team C: ${teamCTotal}`);
    
    // Check if scores are tied
    if (teamATotal === teamBTotal && teamBTotal === teamCTotal) {
      console.log('All three teams are tied!');
    } else if (teamATotal === teamBTotal) {
      console.log('Teams A and B are tied!');
    } else if (teamATotal === teamCTotal) {
      console.log('Teams A and C are tied!');
    } else if (teamBTotal === teamCTotal) {
      console.log('Teams B and C are tied!');
    } else {
      const lowestScore = Math.min(teamATotal, teamBTotal, teamCTotal);
      const leader = lowestScore === teamATotal ? 'A' : lowestScore === teamBTotal ? 'B' : 'C';
      console.log(`Team ${leader} is leading!`);
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

main();
