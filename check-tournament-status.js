const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('Supabase environment variables not found');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTournamentStatus() {
  try {
    console.log('🔍 Checking Tournament Status in Database...\n');

    // Check match status distribution
    const { data: matches, error: matchError } = await supabase
      .from('matches')
      .select('id, game_number, division, match_date, session, match_type, status, team_a_id, team_b_id, team_c_id')
      .order('game_number');

    if (matchError) throw matchError;

    const statusCounts = matches.reduce((acc, match) => {
      acc[match.status] = (acc[match.status] || 0) + 1;
      return acc;
    }, {});

    console.log('📊 Match Status Distribution:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count} matches`);
    });

    // Check by session
    const sessionCounts = {};
    matches.forEach(match => {
      const sessionKey = `${match.match_date}-${match.session}-${match.match_type}`;
      if (!sessionCounts[sessionKey]) sessionCounts[sessionKey] = { total: 0, completed: 0, inProgress: 0, scheduled: 0 };
      sessionCounts[sessionKey].total++;
      sessionCounts[sessionKey][match.status.replace('-', '')]++;
    });

    console.log('\n📅 Session Status:');
    Object.entries(sessionCounts).forEach(([session, counts]) => {
      console.log(`  ${session}: ${counts.completed} completed, ${counts.inProgress || 0} live, ${counts.scheduled} scheduled`);
    });

    // Check MGC matches specifically (assuming MGC is team_id 1)
    const mgcMatches = matches.filter(m => m.team_a_id === 1 || m.team_b_id === 1);
    console.log(`\n🏌️ MGC Total Matches: ${mgcMatches.length}`);
    
    const mgcByStatus = mgcMatches.reduce((acc, match) => {
      acc[match.status] = (acc[match.status] || 0) + 1;
      return acc;
    }, {});
    
    Object.entries(mgcByStatus).forEach(([status, count]) => {
      console.log(`  MGC ${status}: ${count}`);
    });

    // Check teams
    const { data: teams, error: teamError } = await supabase
      .from('teams')
      .select('id, name, division')
      .order('id');

    if (teamError) throw teamError;

    console.log('\n👥 Teams:');
    teams.forEach(team => {
      console.log(`  ${team.id}: ${team.name} (${team.division})`);
    });

    // Sample some completed matches to see hole data
    const completedMatches = matches.filter(m => m.status === 'completed').slice(0, 3);
    console.log(`\n🕳️ Sample Completed Matches (showing first 3):`);
    
    for (const match of completedMatches) {
      const { data: holes, error: holeError } = await supabase
        .from('holes')
        .select('hole_number, team_a_score, team_b_score, team_c_score, status')
        .eq('match_id', match.id)
        .order('hole_number');

      if (holeError) throw holeError;

      console.log(`  Match ${match.game_number} (${match.division}): ${holes.length} holes`);
      const completedHoles = holes.filter(h => h.status === 'completed').length;
      console.log(`    Completed holes: ${completedHoles}/${holes.length}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkTournamentStatus();
