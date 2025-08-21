require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTeamData() {
  console.log('🔍 Checking team and match data consistency...\n');
  
  try {
    // Get all teams
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('id, name, division')
      .order('id');
      
    if (teamsError) throw teamsError;
    
    console.log('📊 Teams in database (' + teams.length + '):');
    teams.forEach(team => {
      console.log('   - ID:', team.id, 'Name:', team.name, 'Division:', team.division);
    });
    
    // Get sample matches
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select('id, game_number, team_a_id, team_b_id, team_c_id, is_bye, division')
      .order('game_number')
      .limit(10);
      
    if (matchesError) throw matchesError;
    
    console.log('\n🏌️ Sample matches (' + matches.length + '):');
    matches.forEach(match => {
      const teamA = teams.find(t => t.id === match.team_a_id);
      const teamB = teams.find(t => t.id === match.team_b_id);
      const teamC = match.team_c_id ? teams.find(t => t.id === match.team_c_id) : null;
      
      console.log('   Game', match.game_number + ':');
      console.log('     TeamA ID:', match.team_a_id, teamA ? '(' + teamA.name + ') ✅' : '❌ NOT FOUND');
      console.log('     TeamB ID:', match.team_b_id, teamB ? '(' + teamB.name + ') ✅' : '❌ NOT FOUND');
      if (match.team_c_id) {
        console.log('     TeamC ID:', match.team_c_id, teamC ? '(' + teamC.name + ') ✅' : '❌ NOT FOUND');
      }
      console.log('     BYE:', match.is_bye);
      console.log('');
    });
    
  } catch (err) {
    console.error('💥 Error:', err.message);
  }
}

checkTeamData();
