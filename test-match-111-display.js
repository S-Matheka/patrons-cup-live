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

// Helper function to get valid result (same as frontend)
function formatValidatedResult(holesPlayed, holesDifference, isClinched) {
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

// Calculate head-to-head matchup (same as frontend)
function calculateHeadToHead(holes, team1Key, team2Key, team1Name, team2Name) {
  let team1Wins = 0;
  let team2Wins = 0;
  
  holes.forEach(hole => {
    const team1Score = hole[team1Key];
    const team2Score = hole[team2Key];
    
    if (team1Score && team2Score && team1Score > 0 && team2Score > 0) {
      if (team1Score < team2Score) {
        team1Wins++;
      } else if (team2Score < team1Score) {
        team2Wins++;
      }
    }
  });
  
  const holesPlayed = holes.length;
  const holesDifference = Math.abs(team1Wins - team2Wins);
  const holesRemaining = 18 - holesPlayed;
  const isClinched = holesDifference > holesRemaining;
  
  if (team1Wins === team2Wins) {
    return `${team1Name} & ${team2Name} halved`;
  } else if (team1Wins > team2Wins) {
    const result = formatValidatedResult(holesPlayed, holesDifference, isClinched);
    return `${team1Name} won ${result}`;
  } else {
    const result = formatValidatedResult(holesPlayed, holesDifference, isClinched);
    return `${team2Name} won ${result}`;
  }
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
    console.log('🔍 TESTING MATCH #111 DISPLAY LOGIC\n');
    
    // Get Match #111
    const { data: match111, error: match111Error } = await supabase
      .from('matches')
      .select('*')
      .eq('game_number', 111)
      .single();
      
    if (match111Error) {
      console.error('Error fetching Match #111:', match111Error);
      return;
    }
    
    // Get team names
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('id, name')
      .in('id', [match111.team_a_id, match111.team_b_id, match111.team_c_id]);
      
    if (teamsError) {
      console.error('Error fetching teams:', teamsError);
      return;
    }
    
    const teamA = teams.find(t => t.id === match111.team_a_id);
    const teamB = teams.find(t => t.id === match111.team_b_id);
    const teamC = teams.find(t => t.id === match111.team_c_id);
    
    console.log('Team Names:');
    console.log(`Team A (${match111.team_a_id}): ${teamA?.name || 'Unknown'}`);
    console.log(`Team B (${match111.team_b_id}): ${teamB?.name || 'Unknown'}`);
    console.log(`Team C (${match111.team_c_id}): ${teamC?.name || 'Unknown'}`);
    
    // Get holes
    const { data: holes, error: holesError } = await supabase
      .from('holes')
      .select('*')
      .eq('match_id', match111.id)
      .order('hole_number');
      
    if (holesError) {
      console.error('Error fetching holes:', holesError);
      return;
    }
    
    // Filter holes with scores
    const holesWithScores = holes.filter(h => 
      h.team_a_score !== null && h.team_b_score !== null && h.team_c_score !== null
    );
    
    console.log(`\nHoles with scores: ${holesWithScores.length}`);
    
    // Detailed hole-by-hole analysis
    console.log('\n=== DETAILED HOLE-BY-HOLE ANALYSIS ===');
    holesWithScores.forEach((hole, index) => {
      console.log(`Hole ${hole.hole_number}: A=${hole.team_a_score}, B=${hole.team_b_score}, C=${hole.team_c_score}`);
    });
    
    // Calculate individual matchups using frontend logic
    console.log('\n=== FRONTEND LOGIC CALCULATION ===');
    
    // Team A vs Team B (Limuru vs Golf Park)
    console.log('\n--- Team A vs Team B (Limuru vs Golf Park) ---');
    let teamAvsBWins = { teamA: 0, teamB: 0 };
    holesWithScores.forEach(hole => {
      if (hole.team_a_score < hole.team_b_score) {
        teamAvsBWins.teamA++;
        console.log(`Hole ${hole.hole_number}: Limuru wins (${hole.team_a_score} < ${hole.team_b_score})`);
      } else if (hole.team_b_score < hole.team_a_score) {
        teamAvsBWins.teamB++;
        console.log(`Hole ${hole.hole_number}: Golf Park wins (${hole.team_b_score} < ${hole.team_a_score})`);
      } else {
        console.log(`Hole ${hole.hole_number}: Halved (${hole.team_a_score} = ${hole.team_b_score})`);
      }
    });
    console.log(`Final: Limuru ${teamAvsBWins.teamA}, Golf Park ${teamAvsBWins.teamB}`);
    
    // Team A vs Team C (Limuru vs Thika)
    console.log('\n--- Team A vs Team C (Limuru vs Thika) ---');
    let teamAvsCWins = { teamA: 0, teamC: 0 };
    holesWithScores.forEach(hole => {
      if (hole.team_a_score < hole.team_c_score) {
        teamAvsCWins.teamA++;
        console.log(`Hole ${hole.hole_number}: Limuru wins (${hole.team_a_score} < ${hole.team_c_score})`);
      } else if (hole.team_c_score < hole.team_a_score) {
        teamAvsCWins.teamC++;
        console.log(`Hole ${hole.hole_number}: Thika wins (${hole.team_c_score} < ${hole.team_a_score})`);
      } else {
        console.log(`Hole ${hole.hole_number}: Halved (${hole.team_a_score} = ${hole.team_c_score})`);
      }
    });
    console.log(`Final: Limuru ${teamAvsCWins.teamA}, Thika ${teamAvsCWins.teamC}`);
    
    // Team B vs Team C (Golf Park vs Thika)
    console.log('\n--- Team B vs Team C (Golf Park vs Thika) ---');
    let teamBvsCWins = { teamB: 0, teamC: 0 };
    holesWithScores.forEach(hole => {
      if (hole.team_b_score < hole.team_c_score) {
        teamBvsCWins.teamB++;
        console.log(`Hole ${hole.hole_number}: Golf Park wins (${hole.team_b_score} < ${hole.team_c_score})`);
      } else if (hole.team_c_score < hole.team_b_score) {
        teamBvsCWins.teamC++;
        console.log(`Hole ${hole.hole_number}: Thika wins (${hole.team_c_score} < ${hole.team_b_score})`);
      } else {
        console.log(`Hole ${hole.hole_number}: Halved (${hole.team_b_score} = ${hole.team_c_score})`);
      }
    });
    console.log(`Final: Golf Park ${teamBvsCWins.teamB}, Thika ${teamBvsCWins.teamC}`);
    
    // Team A vs Team B
    const teamAvsBResult = calculateHeadToHead(holesWithScores, 'team_a_score', 'team_b_score', teamA?.name || 'Team A', teamB?.name || 'Team B');
    console.log(`Team A vs Team B: ${teamAvsBResult}`);
    
    // Team A vs Team C
    const teamAvsCResult = calculateHeadToHead(holesWithScores, 'team_a_score', 'team_c_score', teamA?.name || 'Team A', teamC?.name || 'Team C');
    console.log(`Team A vs Team C: ${teamAvsCResult}`);
    
    // Team B vs Team C
    const teamBvsCResult = calculateHeadToHead(holesWithScores, 'team_b_score', 'team_c_score', teamB?.name || 'Team B', teamC?.name || 'Team C');
    console.log(`Team B vs Team C: ${teamBvsCResult}`);
    
    // Format results like the frontend
    console.log('\n=== FRONTEND FORMATTED RESULTS ===');
    const results = [];
    
    // Team A vs Team B
    if (teamAvsBResult.includes('halved')) {
      results.push(`${teamA?.name || 'Team A'} & ${teamB?.name || 'Team B'} halved`);
    } else {
      const winnerName = teamAvsBResult.split(' ')[0];
      const score = teamAvsBResult.split(' ').slice(-1)[0];
      const loserName = winnerName === (teamA?.name || 'Team A') ? (teamB?.name || 'Team B') : (teamA?.name || 'Team A');
      if (score === 'AS') {
        results.push(`${winnerName} & ${loserName} halved`);
      } else {
        results.push(`${winnerName} ${score} against ${loserName}`);
      }
    }
    
    // Team A vs Team C
    if (teamAvsCResult.includes('halved')) {
      results.push(`${teamA?.name || 'Team A'} & ${teamC?.name || 'Team C'} halved`);
    } else {
      const winnerName = teamAvsCResult.split(' ')[0];
      const score = teamAvsCResult.split(' ').slice(-1)[0];
      const loserName = winnerName === (teamA?.name || 'Team A') ? (teamC?.name || 'Team C') : (teamA?.name || 'Team A');
      if (score === 'AS') {
        results.push(`${winnerName} & ${loserName} halved`);
      } else {
        results.push(`${winnerName} ${score} against ${loserName}`);
      }
    }
    
    // Team B vs Team C
    if (teamBvsCResult.includes('halved')) {
      results.push(`${teamB?.name || 'Team B'} & ${teamC?.name || 'Team C'} halved`);
    } else {
      const winnerName = teamBvsCResult.split(' ')[0];
      const score = teamBvsCResult.split(' ').slice(-1)[0];
      const loserName = winnerName === (teamB?.name || 'Team B') ? (teamC?.name || 'Team C') : (teamB?.name || 'Team B');
      if (score === 'AS') {
        results.push(`${winnerName} & ${loserName} halved`);
      } else {
        results.push(`${winnerName} ${score} against ${loserName}`);
      }
    }
    
    const finalResult = results.join(' • ');
    console.log(`\nFINAL DISPLAY RESULT:`);
    console.log(finalResult);
    
    // Compare with what you're seeing
    console.log('\n=== COMPARISON ===');
    console.log('What you should see:', finalResult);
    console.log('What you\'re seeing: "Golf 3/2 against Limuru • Limuru 4/2 against Thika • Golf 3/2 against Golf Park"');
    
    // Check for issues
    console.log('\n=== ISSUE ANALYSIS ===');
    if (finalResult.includes('Golf 3/2 against Limuru')) {
      console.log('❌ Issue: "Golf" should be "Golf Park"');
    }
    if (finalResult.includes('4/2')) {
      console.log('❌ Issue: "4/2" should be "3/1"');
    }
    if (finalResult.includes('Golf 3/2 against Golf Park')) {
      console.log('❌ Issue: "Golf 3/2 against Golf Park" should be "Golf Park 3/2 against Thika"');
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

main();
