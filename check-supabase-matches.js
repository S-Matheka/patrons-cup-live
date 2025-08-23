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
    // First, check the schema of the matches table
    console.log('\nChecking matches table schema...');
    const { data: matchColumns, error: schemaError } = await supabase
      .from('matches')
      .select()
      .limit(1);
      
    if (schemaError) {
      console.error('Error fetching matches schema:', schemaError);
      return;
    }
    
    if (matchColumns && matchColumns.length > 0) {
      console.log('Matches table columns:', Object.keys(matchColumns[0]));
    }
    
    // Check if there are any 3-way matches (with team_c_id not null)
    console.log('\nChecking for 3-way matches (team_c_id not null)...');
    const { data: threeWayMatches, error: threeWayError } = await supabase
      .from('matches')
      .select('*')
      .not('team_c_id', 'is', null)
      .eq('match_type', 'Foursomes');
      
    if (threeWayError) {
      console.error('Error fetching 3-way Foursomes matches:', threeWayError);
      return;
    }
    
    console.log(`Found ${threeWayMatches.length} 3-way Foursomes matches`);
    
    // Count by status
    const statusCounts = threeWayMatches.reduce((acc, match) => {
      acc[match.status] = (acc[match.status] || 0) + 1;
      return acc;
    }, {});
    
    console.log('Status counts:', statusCounts);
    
    // Show details for non-scheduled matches
    const nonScheduledMatches = threeWayMatches.filter(m => m.status !== 'scheduled');
    console.log(`\nNon-scheduled 3-way Foursomes matches: ${nonScheduledMatches.length}`);
    
    for (const match of nonScheduledMatches) {
      console.log(`\nMatch ${match.id}: ${match.status}, date: ${match.match_date}`);
      console.log(`Teams: ${match.team_a_id}, ${match.team_b_id}, ${match.team_c_id}`);
      
      // Get holes for this match
      const { data: holes, error: holesError } = await supabase
        .from('holes')
        .select('*')
        .eq('match_id', match.id);
        
      if (holesError) {
        console.error(`Error fetching holes for match ${match.id}:`, holesError);
        continue;
      }
      
      const holesWithScores = holes.filter(h => 
        h.team_a_score !== null && h.team_b_score !== null && h.team_c_score !== null
      );
      
      console.log(`Holes with scores: ${holesWithScores.length} out of ${holes.length}`);
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

main();
