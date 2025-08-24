require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Valid match play results according to the sacred rules
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

// Helper function to get valid result
function getValidResult(holesPlayed, holesDifference, isClinched) {
  const validResults = VALID_RESULTS[holesPlayed] || [];
  
  if (holesPlayed === 18) {
    const upResult = `${holesDifference}up`;
    if (validResults.includes(upResult)) {
      return upResult;
    }
    return validResults[0] || 'AS';
  } else if (isClinched) {
    const clinchedResult = `${holesDifference}/${18 - holesPlayed}`;
    if (validResults.includes(clinchedResult)) {
      return clinchedResult;
    }
    const validClinchedResults = validResults.filter(r => r.includes('/'));
    if (validClinchedResults.length > 0) {
      let closestResult = validClinchedResults[0];
      let minDifference = Math.abs(parseInt(validClinchedResults[0].split('/')[0]) - holesDifference);
      
      for (const result of validClinchedResults) {
        const resultDiff = parseInt(result.split('/')[0]);
        const diff = Math.abs(resultDiff - holesDifference);
        if (diff < minDifference) {
          minDifference = diff;
          closestResult = result;
        }
      }
      return closestResult;
    }
    return validResults[0] || 'AS';
  } else {
    const upResult = `${holesDifference}up`;
    if (validResults.includes(upResult)) {
      return upResult;
    }
    return validResults[0] || 'AS';
  }
}

// Check if an individual matchup is complete
function isIndividualMatchComplete(team1Wins, team2Wins, holesPlayed) {
  if (holesPlayed === 0) return false;
  
  const holesRemaining = 18 - holesPlayed;
  const holesDifference = Math.abs(team1Wins - team2Wins);
  
  // Match is complete if:
  // 1. All 18 holes played, OR
  // 2. Team is up by more holes than remain (clinched)
  return holesPlayed === 18 || holesDifference > holesRemaining;
}

// Calculate individual matchup result
function calculateIndividualMatchup(holes, team1Key, team2Key) {
  let team1Wins = 0;
  let team2Wins = 0;
  let holesPlayed = 0;
  
  holes.forEach(hole => {
    const team1Score = hole[team1Key];
    const team2Score = hole[team2Key];
    
    if (team1Score && team2Score && team1Score > 0 && team2Score > 0) {
      holesPlayed++;
      if (team1Score < team2Score) {
        team1Wins++;
      } else if (team2Score < team1Score) {
        team2Wins++;
      }
    }
  });
  
  const holesRemaining = 18 - holesPlayed;
  const holesDifference = Math.abs(team1Wins - team2Wins);
  const isClinched = holesDifference > holesRemaining;
  const isComplete = isIndividualMatchComplete(team1Wins, team2Wins, holesPlayed);
  
  return {
    team1Wins,
    team2Wins,
    holesPlayed,
    holesRemaining,
    holesDifference,
    isClinched,
    isComplete,
    result: getValidResult(holesPlayed, holesDifference, isClinched)
  };
}

// Check if a 3-way match should be auto-completed
function checkThreeWayMatchCompletion(match, holes) {
  if (!match.is_three_way || match.match_type !== 'Singles') {
    return null;
  }
  
  console.log(`\n🔍 Checking Match #${match.game_number || match.id} (${match.match_type} - ${match.division})`);
  console.log(`Teams: ${match.team_a_id} vs ${match.team_b_id} vs ${match.team_c_id}`);
  console.log(`Current Status: ${match.status}`);
  
  // Calculate individual matchups
  const teamAvsB = calculateIndividualMatchup(holes, 'team_a_score', 'team_b_score');
  const teamAvsC = calculateIndividualMatchup(holes, 'team_a_score', 'team_c_score');
  const teamBvsC = calculateIndividualMatchup(holes, 'team_b_score', 'team_c_score');
  
  console.log(`\nIndividual Matchup Results:`);
  console.log(`Team A vs Team B: ${teamAvsB.team1Wins}-${teamAvsB.team2Wins} (${teamAvsB.holesPlayed} holes) - ${teamAvsB.isComplete ? '✅ COMPLETE' : '⏳ IN PROGRESS'} - ${teamAvsB.result}`);
  console.log(`Team A vs Team C: ${teamAvsC.team1Wins}-${teamAvsC.team2Wins} (${teamAvsC.holesPlayed} holes) - ${teamAvsC.isComplete ? '✅ COMPLETE' : '⏳ IN PROGRESS'} - ${teamAvsC.result}`);
  console.log(`Team B vs Team C: ${teamBvsC.team1Wins}-${teamBvsC.team2Wins} (${teamBvsC.holesPlayed} holes) - ${teamBvsC.isComplete ? '✅ COMPLETE' : '⏳ IN PROGRESS'} - ${teamBvsC.result}`);
  
  // Check if all individual matchups are complete
  const allComplete = teamAvsB.isComplete && teamAvsC.isComplete && teamBvsC.isComplete;
  
  if (allComplete && match.status !== 'completed') {
    console.log(`\n🎯 AUTO-COMPLETION NEEDED: All three matchups are complete!`);
    console.log(`Match should be marked as 'completed'`);
    return {
      matchId: match.id,
      gameNumber: match.game_number,
      shouldComplete: true,
      reason: 'All three individual matchups meet completion criteria',
      teamAvsB,
      teamAvsC,
      teamBvsC
    };
  } else if (match.status === 'completed') {
    console.log(`\n✅ Match already completed`);
  } else {
    console.log(`\n⏳ Match still in progress - waiting for all matchups to complete`);
  }
  
  return null;
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    console.log('🚀 Checking for 3-way Singles matches that should be auto-completed...\n');
    
    // First, let's specifically check Match #111
    console.log('🔍 SPECIFIC CHECK FOR MATCH #111:');
    const { data: match111, error: match111Error } = await supabase
      .from('matches')
      .select('*')
      .eq('game_number', 111)
      .single();
      
    if (match111Error) {
      console.error('Error fetching Match #111:', match111Error);
    } else if (match111) {
      console.log(`Match #111 found: ${match111.match_type} - ${match111.division}`);
      console.log(`Teams: ${match111.team_a_id} vs ${match111.team_b_id} vs ${match111.team_c_id}`);
      console.log(`Status: ${match111.status}`);
      
      // Get team names
      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select('id, name')
        .in('id', [match111.team_a_id, match111.team_b_id, match111.team_c_id]);
        
      if (teamsError) {
        console.error('Error fetching teams:', teamsError);
      } else {
        const teamA = teams.find(t => t.id === match111.team_a_id);
        const teamB = teams.find(t => t.id === match111.team_b_id);
        const teamC = teams.find(t => t.id === match111.team_c_id);
        
        console.log(`Team Names:`);
        console.log(`Team A (${match111.team_a_id}): ${teamA?.name || 'Unknown'}`);
        console.log(`Team B (${match111.team_b_id}): ${teamB?.name || 'Unknown'}`);
        console.log(`Team C (${match111.team_c_id}): ${teamC?.name || 'Unknown'}`);
      }
      
      // Get holes for Match #111
      const { data: holes111, error: holes111Error } = await supabase
        .from('holes')
        .select('*')
        .eq('match_id', match111.id)
        .order('hole_number');
        
      if (holes111Error) {
        console.error('Error fetching holes for Match #111:', holes111Error);
      } else {
        console.log(`\nHoles data for Match #111:`);
        holes111.forEach((hole, index) => {
          if (hole.team_a_score || hole.team_b_score || hole.team_c_score) {
            console.log(`Hole ${hole.hole_number}: A=${hole.team_a_score}, B=${hole.team_b_score}, C=${hole.team_c_score}`);
          }
        });
        
        // Calculate individual matchups for Match #111
        const teamAvsB = calculateIndividualMatchup(holes111, 'team_a_score', 'team_b_score');
        const teamAvsC = calculateIndividualMatchup(holes111, 'team_a_score', 'team_c_score');
        const teamBvsC = calculateIndividualMatchup(holes111, 'team_b_score', 'team_c_score');
        
        console.log(`\nDetailed Matchup Analysis for Match #111:`);
        console.log(`Team A vs Team B: ${teamAvsB.team1Wins}-${teamAvsB.team2Wins} (${teamAvsB.holesPlayed} holes) - ${teamAvsB.isComplete ? '✅ COMPLETE' : '⏳ IN PROGRESS'} - ${teamAvsB.result}`);
        console.log(`Team A vs Team C: ${teamAvsC.team1Wins}-${teamAvsC.team2Wins} (${teamAvsC.holesPlayed} holes) - ${teamAvsC.isComplete ? '✅ COMPLETE' : '⏳ IN PROGRESS'} - ${teamAvsC.result}`);
        console.log(`Team B vs Team C: ${teamBvsC.team1Wins}-${teamBvsC.team2Wins} (${teamBvsC.holesPlayed} holes) - ${teamBvsC.isComplete ? '✅ COMPLETE' : '⏳ IN PROGRESS'} - ${teamBvsC.result}`);
        
        // Check completion logic
        const allComplete = teamAvsB.isComplete && teamAvsC.isComplete && teamBvsC.isComplete;
        console.log(`\nAll matchups complete: ${allComplete}`);
        console.log(`Should be completed: ${allComplete && match111.status !== 'completed'}`);
      }
    } else {
      console.log('Match #111 not found');
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('GENERAL CHECK FOR ALL MATCHES:');
    console.log('='.repeat(80));
    
    // Get all 3-way Singles matches
    const { data: singlesMatches, error: singlesError } = await supabase
      .from('matches')
      .select('*')
      .eq('match_type', 'Singles')
      .not('team_c_id', 'is', null);
      
    if (singlesError) {
      console.error('Error fetching 3-way Singles matches:', singlesError);
      return;
    }
    
    console.log(`Found ${singlesMatches.length} 3-way Singles matches`);
    
    // Count by status
    const statusCounts = singlesMatches.reduce((acc, match) => {
      acc[match.status] = (acc[match.status] || 0) + 1;
      return acc;
    }, {});
    
    console.log('Status counts:', statusCounts);
    
    let matchesToComplete = [];
    
    // Check each match for auto-completion
    for (const match of singlesMatches) {
      // Get holes for this match
      const { data: holes, error: holesError } = await supabase
        .from('holes')
        .select('*')
        .eq('match_id', match.id)
        .order('hole_number');
        
      if (holesError) {
        console.error(`Error fetching holes for match ${match.id}:`, holesError);
        continue;
      }
      
      const result = checkThreeWayMatchCompletion(match, holes);
      if (result && result.shouldComplete) {
        matchesToComplete.push(result);
      }
    }
    
    console.log('\n📊 SUMMARY:');
    console.log(`Found ${matchesToComplete.length} matches that should be auto-completed`);
    
    if (matchesToComplete.length > 0) {
      console.log('\n🎯 MATCHES TO AUTO-COMPLETE:');
      matchesToComplete.forEach(match => {
        console.log(`Match #${match.gameNumber} (ID: ${match.matchId})`);
        console.log(`  Reason: ${match.reason}`);
        console.log(`  Team A vs B: ${match.teamAvsB.result}`);
        console.log(`  Team A vs C: ${match.teamAvsC.result}`);
        console.log(`  Team B vs C: ${match.teamBvsC.result}`);
      });
      
      console.log('\n💡 To auto-complete these matches, update their status to "completed" in the database');
    } else {
      console.log('✅ No matches need auto-completion');
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

main();
