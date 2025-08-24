require('dotenv').config({ path: '.env.local' });

console.log('🔍 TESTING SUPABASE CONNECTION\n');

console.log('Environment Variables:');
console.log(`NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET'}`);
console.log(`NEXT_PUBLIC_SUPABASE_ANON_KEY: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET'}`);

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testConnection() {
  try {
    console.log('\nTesting Supabase connection...');
    
    // Test basic connection by fetching a single team
    const { data: teams, error } = await supabase
      .from('teams')
      .select('id, name')
      .limit(1);
      
    if (error) {
      console.error('❌ Supabase connection failed:', error);
      return;
    }
    
    console.log('✅ Supabase connection successful');
    console.log('Sample team data:', teams[0]);
    
    // Test Match #88 specifically
    console.log('\nTesting Match #88 data...');
    const { data: match88, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .eq('game_number', 88)
      .single();
      
    if (matchError) {
      console.error('❌ Error fetching Match #88:', matchError);
      return;
    }
    
    console.log('✅ Match #88 data retrieved successfully');
    console.log('Match details:', {
      id: match88.id,
      game_number: match88.game_number,
      status: match88.status,
      team_a_id: match88.team_a_id,
      team_b_id: match88.team_b_id,
      team_c_id: match88.team_c_id
    });
    
    // Get team names separately
    const { data: teamData, error: teamError } = await supabase
      .from('teams')
      .select('id, name')
      .in('id', [match88.team_a_id, match88.team_b_id, match88.team_c_id]);
      
    if (teamError) {
      console.error('❌ Error fetching teams:', teamError);
      return;
    }
    
    const teamA = teamData.find(t => t.id === match88.team_a_id);
    const teamB = teamData.find(t => t.id === match88.team_b_id);
    const teamC = teamData.find(t => t.id === match88.team_c_id);
    
    console.log('\nTeam Names:');
    console.log(`Team A (${match88.team_a_id}): "${teamA?.name}"`);
    console.log(`Team B (${match88.team_b_id}): "${teamB?.name}"`);
    console.log(`Team C (${match88.team_c_id}): "${teamC?.name}"`);
    
    // Check if this matches what the frontend should display
    console.log('\nExpected Frontend Display:');
    console.log(`Should show: ${teamA?.name} vs ${teamB?.name} vs ${teamC?.name}`);
    console.log(`You're seeing: "Vet & Vet Lab halved • Vet & Vet Lab halved • Kiambu 1up against Sigona"`);
    
    // Check if there are any issues with team assignments
    console.log('\nIssues Analysis:');
    if (teamA?.name === teamB?.name) {
      console.log('❌ Issue: Team A and Team B are the same team');
    }
    if (teamA?.name === teamC?.name) {
      console.log('❌ Issue: Team A and Team C are the same team');
    }
    if (teamB?.name === teamC?.name) {
      console.log('❌ Issue: Team B and Team C are the same team');
    }
    
    // Check for truncation issues
    if (teamA?.name && teamA.name.length > 4) {
      console.log(`❌ Issue: Team A name "${teamA.name}" might be truncated to "Vet"`);
    }
    if (teamB?.name && teamB.name.length > 4) {
      console.log(`❌ Issue: Team B name "${teamB.name}" might be truncated to "Vet Lab"`);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testConnection();
