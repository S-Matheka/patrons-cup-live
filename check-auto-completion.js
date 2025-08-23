require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with admin privileges
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Function to check if a match should be completed based on match play rules
function shouldBeCompleted(match, holes) {
  // Skip if already completed
  if (match.status === 'completed') return false;
  
  // Skip if not enough holes have scores
  const holesWithScores = holes.filter(h => 
    h.team_a_score !== null && h.team_b_score !== null
  );
  
  if (holesWithScores.length === 0) return false;
  
  // For 3-way matches, only complete if all 18 holes are played
  if (match.is_three_way) {
    return holesWithScores.length === 18;
  }
  
  // For 2-way matches, calculate if one team has won
  let teamAWins = 0;
  let teamBWins = 0;
  let holesPlayed = 0;
  
  holesWithScores.forEach(hole => {
    holesPlayed++;
    if (hole.team_a_score < hole.team_b_score) {
      teamAWins++;
    } else if (hole.team_b_score < hole.team_a_score) {
      teamBWins++;
    }
  });
  
  const holesRemaining = 18 - holesPlayed;
  const holesDifference = Math.abs(teamAWins - teamBWins);
  
  // Match is completed if:
  // 1. All 18 holes are played, OR
  // 2. One team is up by more holes than remain
  return holesPlayed === 18 || holesDifference > holesRemaining;
}

async function checkMatches() {
  console.log('=== CHECKING FOR MATCHES THAT SHOULD BE COMPLETED ===');
  
  try {
    // Get all in-progress matches from AM session
    const { data: matches, error } = await supabase
      .from('matches')
      .select('*')
      .eq('status', 'in-progress')
      .eq('session', 'AM');
    
    if (error) {
      console.error('Error fetching matches:', error);
      return;
    }
    
    console.log(`Found ${matches.length} in-progress AM matches`);
    
    // Check each match
    for (const match of matches) {
      const { data: holes, error: holesError } = await supabase
        .from('holes')
        .select('*')
        .eq('match_id', match.id)
        .order('hole_number');
      
      if (holesError) {
        console.error(`Error fetching holes for match ${match.id}:`, holesError);
        continue;
      }
      
      if (shouldBeCompleted(match, holes)) {
        console.log(`Match ${match.id} (${match.match_type} ${match.division}) should be completed!`);
        
        // Calculate hole statistics
        const holesWithScores = holes.filter(h => h.team_a_score !== null && h.team_b_score !== null);
        let teamAWins = 0;
        let teamBWins = 0;
        
        holesWithScores.forEach(hole => {
          if (hole.team_a_score < hole.team_b_score) {
            teamAWins++;
          } else if (hole.team_b_score < hole.team_a_score) {
            teamBWins++;
          }
        });
        
        const holesPlayed = holesWithScores.length;
        const holesRemaining = 18 - holesPlayed;
        const holesDifference = Math.abs(teamAWins - teamBWins);
        
        console.log(`  - Holes played: ${holesPlayed}, Remaining: ${holesRemaining}`);
        console.log(`  - Team A wins: ${teamAWins}, Team B wins: ${teamBWins}, Difference: ${holesDifference}`);
        
        // Update match status to completed
        const { error: updateError } = await supabase
          .from('matches')
          .update({ status: 'completed' })
          .eq('id', match.id);
        
        if (updateError) {
          console.error(`  ❌ Error updating match ${match.id}:`, updateError);
        } else {
          console.log(`  ✅ Match ${match.id} updated to completed`);
        }
      }
    }
    
    console.log('=== CHECK COMPLETE ===');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the check
checkMatches();
