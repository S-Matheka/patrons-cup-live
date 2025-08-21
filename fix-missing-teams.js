require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixMatches() {
  console.log('🔧 Fixing matches with missing team IDs...\n');
  
  try {
    // Find matches with null team_a_id or team_b_id
    const { data: problemMatches, error } = await supabase
      .from('matches')
      .select('id, game_number, team_a_id, team_b_id, players')
      .or('team_a_id.is.null,team_b_id.is.null');
      
    if (error) throw error;
    
    console.log('Found', problemMatches.length, 'matches with missing team IDs:');
    
    for (const match of problemMatches) {
      console.log('Game', match.game_number + ':', 'TeamA:', match.team_a_id, 'TeamB:', match.team_b_id);
      console.log('  Players TeamA:', match.players.teamA);
      console.log('  Players TeamB:', match.players.teamB);
      
      // Function to get team ID from player name
      function getTeamIdFromPlayer(playerName) {
        if (playerName.includes('Vet Lab')) return 4;
        if (playerName.includes('Sigona')) return 5;
        if (playerName.includes('Kiambu')) return 6;
        if (playerName.includes('MGC')) return 1;
        if (playerName.includes('Nyali')) return 2;
        if (playerName.includes('Railway')) return 3;
        if (playerName.includes('Limuru')) return 7;
        if (playerName.includes('Golf Park')) return 8;
        if (playerName.includes('Thika')) return 9;
        if (playerName.includes('Royal')) return 10;
        if (playerName.includes('Karen')) return 11;
        if (playerName.includes('Eldoret')) return 12;
        if (playerName.includes('Windsor')) return 13;
        if (playerName.includes('Mombasa')) return 14;
        if (playerName.includes('Ruiru')) return 15;
        return null;
      }
      
      let teamAId = match.team_a_id;
      let teamBId = match.team_b_id;
      
      if (!teamAId && match.players.teamA && match.players.teamA[0]) {
        teamAId = getTeamIdFromPlayer(match.players.teamA[0]);
      }
      
      if (!teamBId && match.players.teamB && match.players.teamB[0]) {
        teamBId = getTeamIdFromPlayer(match.players.teamB[0]);
      }
      
      if (teamAId !== match.team_a_id || teamBId !== match.team_b_id) {
        console.log('  Fixing: TeamA:', match.team_a_id, '->', teamAId, 'TeamB:', match.team_b_id, '->', teamBId);
        
        const { error: updateError } = await supabase
          .from('matches')
          .update({ 
            team_a_id: teamAId, 
            team_b_id: teamBId 
          })
          .eq('id', match.id);
          
        if (updateError) {
          console.log('  ❌ Error updating:', updateError.message);
        } else {
          console.log('  ✅ Fixed successfully');
        }
      }
      console.log('');
    }
    
    console.log('\n🎉 Finished fixing matches!');
    
  } catch (err) {
    console.error('💥 Error:', err.message);
  }
}

fixMatches();
