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
    console.log('🔍 TESTING TEAM NAMES\n');
    
    // Get all teams
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('id, name')
      .order('id');
      
    if (teamsError) {
      console.error('Error fetching teams:', teamsError);
      return;
    }
    
    console.log('All Teams:');
    teams.forEach(team => {
      console.log(`ID ${team.id}: "${team.name}" (length: ${team.name.length})`);
    });
    
    // Check specific teams for Match #111
    console.log('\n=== MATCH #111 TEAMS ===');
    const match111Teams = teams.filter(t => [7, 8, 9].includes(t.id));
    match111Teams.forEach(team => {
      console.log(`Team ${team.id}: "${team.name}" (length: ${team.name.length})`);
    });
    
    // Check if there are any teams with "Golf" in the name
    console.log('\n=== TEAMS WITH "GOLF" IN NAME ===');
    const golfTeams = teams.filter(t => t.name.toLowerCase().includes('golf'));
    golfTeams.forEach(team => {
      console.log(`Team ${team.id}: "${team.name}"`);
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

main();
