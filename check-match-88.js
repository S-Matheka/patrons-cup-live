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
    console.log('🔍 INVESTIGATING MATCH #88\n');
    
    // Get Match #88
    const { data: match88, error: match88Error } = await supabase
      .from('matches')
      .select('*')
      .eq('game_number', 88)
      .single();
      
    if (match88Error) {
      console.error('Error fetching Match #88:', match88Error);
      return;
    }
    
    console.log('Match #88 Details:');
    console.log(`ID: ${match88.id}`);
    console.log(`Type: ${match88.match_type}`);
    console.log(`Division: ${match88.division}`);
    console.log(`Teams: ${match88.team_a_id} vs ${match88.team_b_id} vs ${match88.team_c_id}`);
    console.log(`Status: ${match88.status}`);
    
    // Get team names
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
    
    console.log('\nTeam Names:');
    console.log(`Team A (${match88.team_a_id}): "${teamA?.name || 'Unknown'}"`);
    console.log(`Team B (${match88.team_b_id}): "${teamB?.name || 'Unknown'}"`);
    console.log(`Team C (${match88.team_c_id}): "${teamC?.name || 'Unknown'}"`);
    
    // Check for duplicate teams
    const teamIds = [match88.team_a_id, match88.team_b_id, match88.team_c_id];
    const uniqueTeamIds = [...new Set(teamIds)];
    console.log(`\nTeam ID Analysis:`);
    console.log(`All team IDs: ${teamIds.join(', ')}`);
    console.log(`Unique team IDs: ${uniqueTeamIds.join(', ')}`);
    console.log(`Duplicate teams: ${teamIds.length !== uniqueTeamIds.length ? 'YES' : 'NO'}`);
    
    // Get holes data
    const { data: holes, error: holesError } = await supabase
      .from('holes')
      .select('*')
      .eq('match_id', match88.id)
      .order('hole_number');
      
    if (holesError) {
      console.error('Error fetching holes:', holesError);
      return;
    }
    
    const holesWithScores = holes.filter(h => 
      h.team_a_score !== null && h.team_b_score !== null && h.team_c_score !== null
    );
    
    console.log(`\nHoles with scores: ${holesWithScores.length}`);
    
    // Calculate individual matchups
    console.log('\n=== INDIVIDUAL MATCHUP ANALYSIS ===');
    
    // Team A vs Team B
    let teamAvsBWins = { teamA: 0, teamB: 0 };
    holesWithScores.forEach(hole => {
      if (hole.team_a_score < hole.team_b_score) {
        teamAvsBWins.teamA++;
      } else if (hole.team_b_score < hole.team_a_score) {
        teamAvsBWins.teamB++;
      }
    });
    console.log(`Team A vs Team B: ${teamAvsBWins.teamA}-${teamAvsBWins.teamB}`);
    
    // Team A vs Team C
    let teamAvsCWins = { teamA: 0, teamC: 0 };
    holesWithScores.forEach(hole => {
      if (hole.team_a_score < hole.team_c_score) {
        teamAvsCWins.teamA++;
      } else if (hole.team_c_score < hole.team_a_score) {
        teamAvsCWins.teamC++;
      }
    });
    console.log(`Team A vs Team C: ${teamAvsCWins.teamA}-${teamAvsCWins.teamC}`);
    
    // Team B vs Team C
    let teamBvsCWins = { teamB: 0, teamC: 0 };
    holesWithScores.forEach(hole => {
      if (hole.team_b_score < hole.team_c_score) {
        teamBvsCWins.teamB++;
      } else if (hole.team_c_score < hole.team_b_score) {
        teamBvsCWins.teamC++;
      }
    });
    console.log(`Team B vs Team C: ${teamBvsCWins.teamB}-${teamBvsCWins.teamC}`);
    
    // Check what the frontend should display
    console.log('\n=== EXPECTED FRONTEND DISPLAY ===');
    console.log('What you\'re seeing: "Vet 3/1 against Vet Lab • Vet 3/1 against Vet Lab • Sigona & Kiambu halved"');
    
    // Identify the issues
    console.log('\n=== ISSUES IDENTIFIED ===');
    
    // Issue 1: Check if team names are being truncated
    if (teamA?.name && teamA.name.length > 4) {
      console.log(`❌ Issue 1: Team A name "${teamA.name}" might be truncated to "Vet"`);
    }
    
    if (teamB?.name && teamB.name.length > 4) {
      console.log(`❌ Issue 2: Team B name "${teamB.name}" might be truncated to "Vet Lab"`);
    }
    
    // Issue 2: Check for duplicate teams
    if (match88.team_a_id === match88.team_b_id) {
      console.log(`❌ Issue 3: Team A and Team B are the same team (ID: ${match88.team_a_id})`);
    }
    
    if (match88.team_a_id === match88.team_c_id) {
      console.log(`❌ Issue 4: Team A and Team C are the same team (ID: ${match88.team_a_id})`);
    }
    
    if (match88.team_b_id === match88.team_c_id) {
      console.log(`❌ Issue 5: Team B and Team C are the same team (ID: ${match88.team_b_id})`);
    }
    
    // Issue 3: Check if the third matchup is correct
    console.log(`\nExpected third matchup: ${teamB?.name} vs ${teamC?.name}`);
    console.log(`You're seeing: "Sigona & Kiambu halved"`);
    
    // Check if there's a mismatch in team assignments
    console.log('\n=== TEAM ASSIGNMENT VERIFICATION ===');
    console.log(`Match #88 teams: ${teamA?.name} vs ${teamB?.name} vs ${teamC?.name}`);
    console.log(`Expected teams for this division: Vet Lab, Sigona, Kiambu`);
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

main();
