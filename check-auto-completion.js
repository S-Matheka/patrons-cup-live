const fs = require('fs');
const path = require('path');

// Load matches data
const matchesPath = path.join(__dirname, 'src/data/matches.json');
const matches = JSON.parse(fs.readFileSync(matchesPath, 'utf8'));

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
function checkThreeWayMatchCompletion(match) {
  if (!match.isThreeWay || match.type !== 'Singles') {
    return null;
  }
  
  console.log(`\n🔍 Checking Match #${match.gameNumber || match.id} (${match.type} - ${match.division})`);
  console.log(`Teams: ${match.teamAId} vs ${match.teamBId} vs ${match.teamCId}`);
  console.log(`Current Status: ${match.status}`);
  
  // Calculate individual matchups
  const teamAvsB = calculateIndividualMatchup(match.holes, 'teamAScore', 'teamBScore');
  const teamAvsC = calculateIndividualMatchup(match.holes, 'teamAScore', 'teamCScore');
  const teamBvsC = calculateIndividualMatchup(match.holes, 'teamBScore', 'teamCScore');
  
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
      gameNumber: match.gameNumber,
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

// Main execution
console.log('🚀 Checking for 3-way Singles matches that should be auto-completed...\n');

let matchesToComplete = [];

// Check all matches
matches.forEach(match => {
  if (match.isThreeWay && match.type === 'Singles') {
    const result = checkThreeWayMatchCompletion(match);
    if (result && result.shouldComplete) {
      matchesToComplete.push(result);
    }
  }
});

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

console.log('\n✨ Auto-completion check complete!');
