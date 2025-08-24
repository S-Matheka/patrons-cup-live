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
    console.log('🔍 FETCHING HOLE DATA FOR MATCH #88\n');
    
    // Get Match #88
    const { data: match88, error: match88Error } = await supabase
      .from('matches')
      .select('id')
      .eq('game_number', 88)
      .single();
      
    if (match88Error) {
      console.error('Error fetching Match #88:', match88Error);
      return;
    }
    
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
    
    console.log('Hole data for Match #88:');
    console.log(JSON.stringify(holes, null, 2));
    
    // Convert to the format expected by matches.json
    const convertedHoles = holes.map(hole => ({
      number: hole.hole_number,
      par: hole.par,
      teamAScore: hole.team_a_score,
      teamBScore: hole.team_b_score,
      teamCScore: hole.team_c_score,
      teamAStrokes: hole.team_a_strokes,
      teamBStrokes: hole.team_b_strokes,
      teamCStrokes: hole.team_c_strokes,
      status: hole.status
    }));
    
    console.log('\nConverted hole data:');
    console.log(JSON.stringify(convertedHoles, null, 2));
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

main();
