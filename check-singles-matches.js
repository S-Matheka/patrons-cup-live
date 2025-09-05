const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSinglesMatches() {
  console.log('🔍 Checking Sunday Singles matches...\n');
  
  try {
    // Get all singles matches
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select(`
        *,
        holes (*)
      `)
      .eq('match_type', 'Singles');
    
    if (matchesError) throw matchesError;
    
    console.log(`📊 Found ${matches.length} Singles matches\n`);
    
    matches.forEach(match => {
      console.log(`🎯 Match ${match.game_number}: ${match.session} ${match.match_type}`);
      console.log(`   Status: ${match.status}`);
      console.log(`   Is Three Way: ${match.is_three_way}`);
      console.log(`   Team A ID: ${match.team_a_id}`);
      console.log(`   Team B ID: ${match.team_b_id}`);
      console.log(`   Team C ID: ${match.team_c_id}`);
      
      if (match.holes && match.holes.length > 0) {
        const firstHole = match.holes[0];
        console.log(`   First hole sample: A=${firstHole.team_a_score}, B=${firstHole.team_b_score}, C=${firstHole.team_c_score}`);
      }
      console.log('   ---');
    });
    
    // Check if there are any 3-way singles matches
    const threeWaySingles = matches.filter(m => m.is_three_way);
    console.log(`\n📊 3-way Singles matches: ${threeWaySingles.length}`);
    
    // Check if there are any 2-way singles matches  
    const twoWaySingles = matches.filter(m => !m.is_three_way);
    console.log(`📊 2-way Singles matches: ${twoWaySingles.length}`);
    
  } catch (error) {
    console.error('❌ Error checking singles matches:', error);
  }
}

checkSinglesMatches();

