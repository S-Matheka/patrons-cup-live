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
    console.log('🔍 CHECKING MATCH RESULT TERMINOLOGY IN SUPABASE\n');
    
    // Get all completed matches
    const { data: matches, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .eq('status', 'completed');
      
    if (matchError) {
      console.error('Error fetching matches:', matchError);
      return;
    }
    
    console.log(`Found ${matches.length} completed matches`);
    
    // Check the VALID_RESULTS constant in the code
    const VALID_RESULTS = {
      18: ['AS', '1up', '2up'],
      17: ['2/1', '2up', '3/1'],
      16: ['3/2', '4/2'],
      15: ['4/3', '5/3'],
      14: ['5/4', '6/4'],
      13: ['6/5', '7/5'],
      12: ['7/6', '8/6'],
      11: ['8/7', '9/7'],
      10: ['9/8', '10/8']
    };
    
    console.log('\nValid Results in code:');
    console.log('For 18 holes:', VALID_RESULTS[18]);
    console.log('Note: "AS" is used in the VALID_RESULTS constant\n');
    
    // Get holes data for completed matches
    const { data: holes, error: holesError } = await supabase
      .from('holes')
      .select('*')
      .in('match_id', matches.map(m => m.id));
      
    if (holesError) {
      console.error('Error fetching holes:', holesError);
      return;
    }
    
    // Group holes by match
    const matchHoles = {};
    holes.forEach(hole => {
      if (!matchHoles[hole.match_id]) {
        matchHoles[hole.match_id] = [];
      }
      matchHoles[hole.match_id].push(hole);
    });
    
    console.log('Analyzing match results...\n');
    
    // Analyze each completed match
    matches.forEach(match => {
      const matchHoleData = matchHoles[match.id] || [];
      const holesWithScores = matchHoleData.filter(h => 
        h.team_a_score !== null && h.team_b_score !== null
      );
      
      if (holesWithScores.length === 0) return;
      
      let teamAWins = 0;
      let teamBWins = 0;
      
      holesWithScores.forEach(hole => {
        if (hole.team_a_score < hole.team_b_score) {
          teamAWins++;
        } else if (hole.team_b_score < hole.team_a_score) {
          teamBWins++;
        }
      });
      
      if (teamAWins === teamBWins) {
        console.log(`Match ${match.id} (Game ${match.game_number}): Teams tied after ${holesWithScores.length} holes`);
        console.log('Result in database:', 'AS');
      }
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

main();
