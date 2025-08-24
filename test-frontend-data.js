require('dotenv').config({ path: '.env.local' });

console.log('🔍 TESTING FRONTEND DATA SOURCE\n');

// Simulate the frontend data loading logic
const teamsData = require('./src/data/teams.json');
const matchesData = require('./src/data/matches.json');

// Find Match #88 in local data
const localMatch88 = matchesData.find(m => m.gameNumber === 88);
const localTeamA = teamsData.find(t => t.id === localMatch88?.teamAId);
const localTeamB = teamsData.find(t => t.id === localMatch88?.teamBId);
const localTeamC = teamsData.find(t => t.id === localMatch88?.teamCId);

console.log('Local Data (matches.json):');
console.log(`Match #88: ${localMatch88 ? 'Found' : 'Not found'}`);
if (localMatch88) {
  console.log(`Status: ${localMatch88.status}`);
  console.log(`Team A ID: ${localMatch88.teamAId} -> "${localTeamA?.name}"`);
  console.log(`Team B ID: ${localMatch88.teamBId} -> "${localTeamB?.name}"`);
  console.log(`Team C ID: ${localMatch88.teamCId} -> "${localTeamC?.name}"`);
}

// Test Supabase data
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testSupabaseData() {
  try {
    console.log('\nSupabase Data:');
    
    const { data: match88, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .eq('game_number', 88)
      .single();
      
    if (matchError) {
      console.error('Error fetching Match #88:', matchError);
      return;
    }
    
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('id, name')
      .in('id', [match88.team_a_id, match88.team_b_id, match88.team_c_id]);
      
    if (teamsError) {
      console.error('Error fetching teams:', teamsError);
      return;
    }
    
    const teamA = teams.find(t => t.id === match88.team_a_id);
    const teamB = teams.find(t => t.id === match88.team_b_id);
    const teamC = teams.find(t => t.id === match88.team_c_id);
    
    console.log(`Match #88: Found`);
    console.log(`Status: ${match88.status}`);
    console.log(`Team A ID: ${match88.team_a_id} -> "${teamA?.name}"`);
    console.log(`Team B ID: ${match88.team_b_id} -> "${teamB?.name}"`);
    console.log(`Team C ID: ${match88.team_c_id} -> "${teamC?.name}"`);
    
    console.log('\nComparison:');
    console.log('Local vs Supabase:');
    console.log(`Team A: "${localTeamA?.name}" vs "${teamA?.name}"`);
    console.log(`Team B: "${localTeamB?.name}" vs "${teamB?.name}"`);
    console.log(`Team C: "${localTeamC?.name}" vs "${teamC?.name}"`);
    
    if (localTeamA?.name !== teamA?.name) {
      console.log('❌ Team A name mismatch!');
    }
    if (localTeamB?.name !== teamB?.name) {
      console.log('❌ Team B name mismatch!');
    }
    if (localTeamC?.name !== teamC?.name) {
      console.log('❌ Team C name mismatch!');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testSupabaseData();
