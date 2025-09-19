// Test script to verify tournament loading fix
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing Supabase environment variables');
  console.log('Please ensure your .env.local file contains:');
  console.log('  - NEXT_PUBLIC_SUPABASE_URL');
  console.log('  - NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTournamentLoading() {
  console.log('🧪 Testing tournament loading...\n');

  try {
    // Test 1: Check if tournaments table exists
    console.log('1️⃣ Testing tournaments table...');
    const { data: tournaments, error: tournamentsError } = await supabase
      .from('tournaments')
      .select('*')
      .order('start_date', { ascending: false });

    if (tournamentsError) {
      if (tournamentsError.message.includes('relation "tournaments" does not exist')) {
        console.log('   ✅ Tournaments table does not exist (expected)');
        console.log('   📝 This will trigger the fallback to default tournament');
      } else {
        console.log('   ❌ Unexpected error:', tournamentsError.message);
      }
    } else {
      console.log(`   ✅ Tournaments table exists with ${tournaments.length} tournaments`);
      tournaments.forEach(t => {
        console.log(`      - ${t.name} (${t.status})`);
      });
    }

    // Test 2: Check if tournament_id columns exist
    console.log('\n2️⃣ Testing tournament_id columns...');
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('id, name, tournament_id')
      .limit(1);

    if (teamsError) {
      if (teamsError.message.includes('column "tournament_id" does not exist')) {
        console.log('   ✅ tournament_id column does not exist (expected)');
        console.log('   📝 This will trigger the fallback to load all data');
      } else {
        console.log('   ❌ Unexpected error:', teamsError.message);
      }
    } else {
      console.log('   ✅ tournament_id column exists');
      if (teams.length > 0) {
        console.log(`      Sample team: ${teams[0].name} (tournament_id: ${teams[0].tournament_id})`);
      }
    }

    // Test 3: Check if we can load teams data
    console.log('\n3️⃣ Testing teams data loading...');
    const { data: allTeams, error: allTeamsError } = await supabase
      .from('teams')
      .select('*')
      .order('seed');

    if (allTeamsError) {
      console.log('   ❌ Error loading teams:', allTeamsError.message);
    } else {
      console.log(`   ✅ Successfully loaded ${allTeams.length} teams`);
      console.log(`      Divisions: ${[...new Set(allTeams.map(t => t.division))].join(', ')}`);
    }

    // Test 4: Check if we can load matches data
    console.log('\n4️⃣ Testing matches data loading...');
    const { data: allMatches, error: allMatchesError } = await supabase
      .from('matches')
      .select(`
        *,
        holes (
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

    if (allMatchesError) {
      console.log('   ❌ Error loading matches:', allMatchesError.message);
    } else {
      console.log(`   ✅ Successfully loaded ${allMatches.length} matches`);
      const matchesWithHoles = allMatches.filter(m => m.holes && m.holes.length > 0);
      console.log(`      Matches with holes: ${matchesWithHoles.length}`);
    }

    console.log('\n🎯 Summary:');
    console.log('   The application should now:');
    console.log('   ✅ Create a default "Patrons Cup 2025" tournament');
    console.log('   ✅ Load all existing data without tournament filtering');
    console.log('   ✅ Show the tournament selector in navigation');
    console.log('   ✅ Stop showing "Loading tournament data..."');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testTournamentLoading();
