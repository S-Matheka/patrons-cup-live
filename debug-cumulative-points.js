const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugCumulativePoints() {
  console.log('🔍 Debugging Cumulative Points Calculation...\n');

  try {
    // Get all matches with holes data
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
      .order('game_number');

    if (matchesError) {
      console.error('❌ Error fetching matches:', matchesError);
      return;
    }

    // Get teams
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('*')
      .order('seed');

    if (teamsError) {
      console.error('❌ Error fetching teams:', teamsError);
      return;
    }

    console.log(`📊 Found ${matches.length} matches and ${teams.length} teams\n`);

    // Check Trophy division specifically
    const trophyTeams = teams.filter(t => t.division === 'Trophy');
    const trophyMatches = matches.filter(m => m.division === 'Trophy');

    console.log('🏆 TROPHY DIVISION ANALYSIS:');
    console.log(`Teams: ${trophyTeams.map(t => t.name).join(', ')}`);
    console.log(`Total matches: ${trophyMatches.length}`);
    console.log(`Completed matches: ${trophyMatches.filter(m => m.status === 'completed').length}`);
    console.log(`In-progress matches: ${trophyMatches.filter(m => m.status === 'in-progress').length}`);
    console.log(`Scheduled matches: ${trophyMatches.filter(m => m.status === 'scheduled').length}\n`);

    // Analyze each team's matches
    trophyTeams.forEach(team => {
      const teamMatches = trophyMatches.filter(m => 
        m.team_a_id === team.id || m.team_b_id === team.id || m.team_c_id === team.id
      );

      const completedMatches = teamMatches.filter(m => m.status === 'completed');
      const inProgressMatches = teamMatches.filter(m => m.status === 'in-progress');

      console.log(`\n${team.name} (ID: ${team.id}):`);
      console.log(`  Total matches: ${teamMatches.length}`);
      console.log(`  Completed: ${completedMatches.length}`);
      console.log(`  In-progress: ${inProgressMatches.length}`);

      // Show match details
      completedMatches.forEach(match => {
        const matchDate = new Date(match.match_date);
        const dayOfWeek = matchDate.getDay();
        const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];
        
        console.log(`    ✅ ${match.match_type} ${match.session} (${dayName} ${matchDate.toLocaleDateString()}) - ${match.status}`);
        console.log(`       Teams: ${match.team_a_id}, ${match.team_b_id}${match.team_c_id ? ', ' + match.team_c_id : ''}`);
        console.log(`       Holes: ${match.holes.length}`);
      });

      inProgressMatches.forEach(match => {
        const matchDate = new Date(match.match_date);
        const dayOfWeek = matchDate.getDay();
        const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];
        
        console.log(`    🔄 ${match.match_type} ${match.session} (${dayName} ${matchDate.toLocaleDateString()}) - ${match.status}`);
        console.log(`       Teams: ${match.team_a_id}, ${match.team_b_id}${match.team_c_id ? ', ' + match.team_c_id : ''}`);
        console.log(`       Holes: ${match.holes.length}`);
      });
    });

    // Check date parsing
    console.log('\n📅 DATE PARSING CHECK:');
    const sampleMatches = trophyMatches.slice(0, 5);
    sampleMatches.forEach(match => {
      const dateValue = match.match_date;
      const parsedDate = new Date(dateValue);
      const dayOfWeek = parsedDate.getDay();
      const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];
      
      console.log(`  Match ${match.game_number}: ${dateValue} -> ${parsedDate.toISOString()} -> ${dayName} (${dayOfWeek})`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugCumulativePoints();
