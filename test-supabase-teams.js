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
    console.log('🔍 TESTING SUPABASE TEAM DATA LOADING\n');
    
    // Test teams loading
    console.log('Loading teams...');
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('*')
      .order('seed');
      
    if (teamsError) {
      console.error('Error fetching teams:', teamsError);
      return;
    }
    
    console.log(`✅ Teams loaded: ${teams.length}`);
    teams.forEach(team => {
      console.log(`  Team ${team.id}: "${team.name}" (${team.division})`);
    });
    
    // Test match #111 loading
    console.log('\nLoading Match #111...');
    const { data: match111, error: match111Error } = await supabase
      .from('matches')
      .select(`
        *,
        holes (
          hole_number,
          par,
          team_a_score,
          team_b_score,
          team_c_score
        )
      `)
      .eq('game_number', 111)
      .single();
      
    if (match111Error) {
      console.error('Error fetching Match #111:', match111Error);
      return;
    }
    
    console.log(`✅ Match #111 loaded:`);
    console.log(`  Teams: ${match111.team_a_id} vs ${match111.team_b_id} vs ${match111.team_c_id}`);
    console.log(`  Type: ${match111.match_type}`);
    console.log(`  Status: ${match111.status}`);
    console.log(`  Holes: ${match111.holes?.length || 0}`);
    
    // Get team names for Match #111
    const teamIds = [match111.team_a_id, match111.team_b_id, match111.team_c_id].filter(id => id !== null);
    const { data: matchTeams, error: matchTeamsError } = await supabase
      .from('teams')
      .select('id, name')
      .in('id', teamIds);
      
    if (matchTeamsError) {
      console.error('Error fetching match teams:', matchTeamsError);
      return;
    }
    
    console.log('\nMatch #111 Team Names:');
    matchTeams.forEach(team => {
      console.log(`  Team ${team.id}: "${team.name}"`);
    });
    
    // Test the exact query that the frontend uses
    console.log('\nTesting frontend-style query...');
    const { data: frontendTeams, error: frontendError } = await supabase
      .from('teams')
      .select('*')
      .order('seed');
      
    if (frontendError) {
      console.error('Frontend query error:', frontendError);
      return;
    }
    
    console.log(`✅ Frontend query successful: ${frontendTeams.length} teams`);
    
    // Check if the specific teams for Match #111 are in the results
    const match111TeamNames = matchTeams.map(t => t.name);
    const allTeamNames = frontendTeams.map(t => t.name);
    
    console.log('\nVerification:');
    match111TeamNames.forEach(teamName => {
      const found = allTeamNames.includes(teamName);
      console.log(`  "${teamName}": ${found ? '✅ Found' : '❌ Missing'}`);
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

main();
