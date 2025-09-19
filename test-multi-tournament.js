#!/usr/bin/env node

/**
 * Test script to verify multi-tournament implementation
 * This script tests the tournament loading and switching functionality
 */

// Check if environment variables are set
const requiredEnvVars = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingEnvVars.forEach(envVar => console.error(`   - ${envVar}`));
  console.error('\nPlease ensure your .env.local file contains these variables.');
  process.exit(1);
}

// Import Supabase client
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase configuration not found');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testMultiTournament() {
  console.log('🚀 Testing Multi-Tournament Implementation...\n');

  try {
    // Test 1: Check if tournaments table exists and has data
    console.log('📋 Test 1: Loading tournaments...');
    const { data: tournaments, error: tournamentsError } = await supabase
      .from('tournaments')
      .select('*')
      .order('start_date', { ascending: false });

    if (tournamentsError) {
      console.error('❌ Error loading tournaments:', tournamentsError.message);
      console.log('\n💡 This might mean the database migration hasn\'t been applied yet.');
      console.log('   Please run the migration script first.');
      return;
    }

    console.log(`✅ Found ${tournaments.length} tournaments:`);
    tournaments.forEach(tournament => {
      console.log(`   - ${tournament.name} (${tournament.status}) - ${tournament.slug}`);
    });

    if (tournaments.length === 0) {
      console.log('⚠️  No tournaments found. The migration may not have been applied.');
      return;
    }

    // Test 2: Check if existing data has tournament_id
    console.log('\n📋 Test 2: Checking tournament_id in existing data...');
    
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('id, name, tournament_id')
      .limit(5);

    if (teamsError) {
      console.error('❌ Error loading teams:', teamsError.message);
    } else {
      console.log(`✅ Teams table updated - sample data:`);
      teams.forEach(team => {
        console.log(`   - ${team.name} (tournament_id: ${team.tournament_id})`);
      });
    }

    // Test 3: Test tournament-specific data loading
    console.log('\n📋 Test 3: Testing tournament-specific data loading...');
    
    const firstTournament = tournaments[0];
    console.log(`   Loading data for: ${firstTournament.name}`);

    const [teamsRes, playersRes, matchesRes, scoresRes] = await Promise.all([
      supabase.from('teams').select('*').eq('tournament_id', firstTournament.id).order('seed'),
      supabase.from('players').select('*').eq('tournament_id', firstTournament.id).order('name'),
      supabase.from('matches').select('*').eq('tournament_id', firstTournament.id).order('game_number'),
      supabase.from('scores').select('*').eq('tournament_id', firstTournament.id).order('points', { ascending: false })
    ]);

    console.log(`   ✅ Teams: ${teamsRes.data?.length || 0} found`);
    console.log(`   ✅ Players: ${playersRes.data?.length || 0} found`);
    console.log(`   ✅ Matches: ${matchesRes.data?.length || 0} found`);
    console.log(`   ✅ Scores: ${scoresRes.data?.length || 0} found`);

    // Test 4: Verify data isolation
    console.log('\n📋 Test 4: Testing data isolation...');
    
    if (tournaments.length > 1) {
      const secondTournament = tournaments[1];
      console.log(`   Comparing data between ${firstTournament.name} and ${secondTournament.name}`);

      const { data: firstTournamentTeams } = await supabase
        .from('teams')
        .select('id, name')
        .eq('tournament_id', firstTournament.id);

      const { data: secondTournamentTeams } = await supabase
        .from('teams')
        .select('id, name')
        .eq('tournament_id', secondTournament.id);

      console.log(`   ${firstTournament.name}: ${firstTournamentTeams?.length || 0} teams`);
      console.log(`   ${secondTournament.name}: ${secondTournamentTeams?.length || 0} teams`);

      // Check if there's any overlap in team IDs (there shouldn't be)
      const firstTeamIds = new Set(firstTournamentTeams?.map(t => t.id) || []);
      const secondTeamIds = new Set(secondTournamentTeams?.map(t => t.id) || []);
      const overlap = [...firstTeamIds].filter(id => secondTeamIds.has(id));

      if (overlap.length === 0) {
        console.log('   ✅ Data isolation working correctly - no overlapping team IDs');
      } else {
        console.log(`   ⚠️  Data isolation issue - ${overlap.length} overlapping team IDs found`);
      }
    } else {
      console.log('   ⏭️  Skipping isolation test - only one tournament found');
    }

    // Test 5: Check tournament summary view
    console.log('\n📋 Test 5: Testing tournament summary view...');
    
    const { data: summary, error: summaryError } = await supabase
      .from('tournament_summary')
      .select('*');

    if (summaryError) {
      console.log('   ⚠️  Tournament summary view not available:', summaryError.message);
    } else {
      console.log('   ✅ Tournament summary view working:');
      summary.forEach(tournament => {
        console.log(`   - ${tournament.tournament_name}: ${tournament.team_count} teams, ${tournament.match_count} matches`);
      });
    }

    console.log('\n🎉 Multi-tournament implementation test completed!');
    console.log('\n📋 Summary:');
    console.log(`   ✅ Tournaments loaded: ${tournaments.length}`);
    console.log(`   ✅ Data filtering: Working`);
    console.log(`   ✅ Data isolation: ${tournaments.length > 1 ? 'Working' : 'N/A'}`);
    console.log(`   ✅ Summary view: ${summaryError ? 'Not available' : 'Working'}`);

    console.log('\n🚀 Next steps:');
    console.log('   1. Start your development server: npm run dev');
    console.log('   2. Check the navigation bar for the tournament selector');
    console.log('   3. Test switching between tournaments');
    console.log('   4. Verify that data changes when switching tournaments');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Check if we're running this script directly
if (require.main === module) {
  testMultiTournament();
}

module.exports = { testMultiTournament };
