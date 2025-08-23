require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyDatabase() {
  console.log('=== DATABASE VERIFICATION ===');
  
  // Check environment variables
  console.log('Checking environment variables...');
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL is not set');
    return;
  }
  
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY is not set');
    return;
  }
  
  console.log('✅ Environment variables are set');
  
  try {
    // Check database connection
    console.log('\nTesting database connection...');
    const { data: healthCheck, error: healthError } = await supabase.from('teams').select('id').limit(1);
    
    if (healthError) {
      console.error('❌ Database connection failed:', healthError.message);
      return;
    }
    
    console.log('✅ Database connection successful');
    
    // Check teams table
    console.log('\nChecking teams table...');
    const { data: teams, error: teamsError } = await supabase.from('teams').select('*');
    
    if (teamsError) {
      console.error('❌ Failed to fetch teams:', teamsError.message);
      return;
    }
    
    console.log(`✅ Teams table: ${teams.length} records found`);
    console.log('Teams by division:');
    const divisionCounts = {};
    teams.forEach(team => {
      if (!divisionCounts[team.division]) {
        divisionCounts[team.division] = [];
      }
      divisionCounts[team.division].push(team.name);
    });
    
    Object.entries(divisionCounts).forEach(([division, teamNames]) => {
      console.log(`  - ${division}: ${teamNames.length} teams (${teamNames.join(', ')})`);
    });
    
    // Check matches table
    console.log('\nChecking matches table...');
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select('*');
      
    const matchesCount = matches ? matches.length : 0;
    
    if (matchesError) {
      console.error('❌ Failed to fetch matches:', matchesError.message);
      return;
    }
    
    console.log(`✅ Matches table: ${matchesCount} records found`);
    
    // Calculate match status counts manually
    const statusCounts = {};
    matches.forEach(match => {
      if (!statusCounts[match.status]) {
        statusCounts[match.status] = 0;
      }
      statusCounts[match.status]++;
    });
    
    console.log('Matches by status:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  - ${status}: ${count} matches`);
    });
    
    // Check holes table
    console.log('\nChecking holes table...');
    const { data: holes, error: holesError } = await supabase
      .from('holes')
      .select('*')
      .limit(1000); // Limit to avoid excessive data transfer
    
    if (holesError) {
      console.error('❌ Failed to fetch holes:', holesError.message);
      return;
    }
    
    console.log(`✅ Holes table: ${holes.length} records found (limited to 1000)`);
    
    // Check scores table
    console.log('\nChecking scores table...');
    const { data: scores, error: scoresError } = await supabase.from('scores').select('*');
    
    if (scoresError) {
      console.error('❌ Failed to fetch scores:', scoresError.message);
      return;
    }
    
    console.log(`✅ Scores table: ${scores.length} records found`);
    
    // Check for completed matches with holes data
    console.log('\nChecking completed matches with holes data...');
    const { data: completedMatches, error: completedError } = await supabase
      .from('matches')
      .select(`
        id,
        division,
        match_type,
        session,
        match_date,
        holes (
          hole_number,
          team_a_score,
          team_b_score,
          team_c_score
        )
      `)
      .eq('status', 'completed')
      .limit(5);
    
    if (completedError) {
      console.error('❌ Failed to fetch completed matches:', completedError.message);
      return;
    }
    
    console.log(`✅ Found ${completedMatches.length} completed matches (showing first 5)`);
    completedMatches.forEach(match => {
      const holesWithScores = match.holes.filter(h => 
        h.team_a_score !== null || h.team_b_score !== null || h.team_c_score !== null
      ).length;
      
      console.log(`  - Match ${match.id} (${match.division}, ${match.match_type}, ${match.session}): ${match.holes.length} holes, ${holesWithScores} with scores`);
    });
    
    console.log('\n=== VERIFICATION COMPLETE ===');
    console.log('Database connection and tables verified successfully.');
    
  } catch (error) {
    console.error('❌ Unexpected error during verification:', error);
  }
}

verifyDatabase();
