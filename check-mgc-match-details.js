const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMGCMatchDetails() {
  console.log('🔍 Checking detailed MGC match data...\n');
  
  try {
    // Get one specific match with ALL hole data fields
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select(`
        *,
        holes (*)
      `)
      .eq('id', 3) // Match 3 from the previous output
      .single();
    
    if (matchesError) throw matchesError;
    
    console.log('🎯 Match 3 Details:');
    console.log('   ID:', matches.id);
    console.log('   Game Number:', matches.game_number);
    console.log('   Status:', matches.status);
    console.log('   Match Type:', matches.match_type);
    console.log('   Session:', matches.session);
    console.log('   Is Three Way:', matches.is_three_way);
    console.log('   Team A ID:', matches.team_a_id);
    console.log('   Team B ID:', matches.team_b_id);
    console.log('   Team C ID:', matches.team_c_id);
    
    console.log('\n📊 All Hole Data Fields:');
    if (matches.holes && matches.holes.length > 0) {
      const firstHole = matches.holes[0];
      console.log('   Available fields in holes:', Object.keys(firstHole));
      
      console.log('\n🏌️  First 3 holes detailed data:');
      matches.holes.slice(0, 3).forEach(hole => {
        console.log(`   Hole ${hole.hole_number}:`);
        console.log('     team_a_score:', hole.team_a_score);
        console.log('     team_b_score:', hole.team_b_score);
        console.log('     team_c_score:', hole.team_c_score);
        console.log('     team_a_strokes:', hole.team_a_strokes);
        console.log('     team_b_strokes:', hole.team_b_strokes);
        console.log('     team_c_strokes:', hole.team_c_strokes);
        console.log('     status:', hole.status);
        console.log('     par:', hole.par);
        console.log('     ---');
      });
    } else {
      console.log('   No holes data found');
    }
    
  } catch (error) {
    console.error('❌ Error checking match details:', error);
  }
}

checkMGCMatchDetails();

