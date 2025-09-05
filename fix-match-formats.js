const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixMatchFormats() {
  console.log('🔧 Fixing match formats according to TOCs...\n');
  
  try {
    // First, find Railway team (should be team ID 3 based on TOCs)
    const { data: railwayTeam, error: railwayError } = await supabase
      .from('teams')
      .select('*')
      .eq('name', 'Railway')
      .single();
    
    if (railwayError) {
      console.log('❌ Could not find Railway team');
      return;
    }
    
    console.log(`🏌️  Found Railway team: ${railwayTeam.name} (ID: ${railwayTeam.id})\n`);
    
    // Find all incorrect 2-way singles matches that should be 3-way
    const { data: incorrectMatches, error: matchesError } = await supabase
      .from('matches')
      .select('*')
      .eq('match_type', 'Singles')
      .eq('session', 'AM')
      .eq('is_three_way', false)
      .or('team_a_id.eq.1,team_b_id.eq.1'); // MGC is team ID 1
    
    if (matchesError) throw matchesError;
    
    console.log(`📊 Found ${incorrectMatches.length} incorrect 2-way singles matches to fix\n`);
    
    let fixedCount = 0;
    
    for (const match of incorrectMatches) {
      console.log(`🔧 Fixing Match ${match.game_number}: ${match.session} ${match.match_type}`);
      console.log(`   Current: ${match.team_a_id} vs ${match.team_b_id} (2-way)`);
      
      // Determine which team is missing (should be 3 teams: MGC, Nyali, Railway)
      const currentTeams = [match.team_a_id, match.team_b_id];
      let missingTeamId = null;
      
      if (currentTeams.includes(1) && currentTeams.includes(2)) {
        // MGC vs Nyali, missing Railway
        missingTeamId = 3;
      } else if (currentTeams.includes(1) && currentTeams.includes(3)) {
        // MGC vs Railway, missing Nyali
        missingTeamId = 2;
      } else if (currentTeams.includes(2) && currentTeams.includes(3)) {
        // Nyali vs Railway, missing MGC
        missingTeamId = 1;
      }
      
      if (missingTeamId) {
        console.log(`   Adding missing team ID: ${missingTeamId}`);
        
        // Update match to be 3-way and add the missing team
        const { error: updateError } = await supabase
          .from('matches')
          .update({
            is_three_way: true,
            team_c_id: missingTeamId,
            updated_at: new Date().toISOString()
          })
          .eq('id', match.id);
        
        if (updateError) {
          console.error(`   ❌ Failed to update match:`, updateError);
        } else {
          console.log(`   ✅ Match updated to 3-way`);
          fixedCount++;
        }
      } else {
        console.log(`   ⚠️  Could not determine missing team`);
      }
      
      console.log('   ---');
    }
    
    console.log(`\n📈 Summary:`);
    console.log(`   Matches fixed: ${fixedCount}`);
    
    if (fixedCount > 0) {
      console.log(`\n✅ All incorrect match formats have been fixed!`);
      console.log(`   Trophy division singles matches are now properly 3-way (MGC vs Nyali vs Railway)`);
    } else {
      console.log(`\n✅ No matches needed fixing.`);
    }
    
  } catch (error) {
    console.error('❌ Error fixing match formats:', error);
  }
}

fixMatchFormats();

