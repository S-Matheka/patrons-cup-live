require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key for admin access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Verify leaderboard calculation accuracy against actual database data
 */
async function verifyLeaderboardAccuracy() {
  console.log('=== VERIFYING LEADERBOARD ACCURACY ===');
  
  try {
    // Step 1: Fetch all teams
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('*')
      .order('division');
    
    if (teamsError) {
      throw new Error(`Error fetching teams: ${teamsError.message}`);
    }
    
    console.log(`Fetched ${teams.length} teams`);
    
    // Step 2: Fetch all completed matches with their holes
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select(`
        id,
        team_a_id,
        team_b_id,
        team_c_id,
        is_three_way,
        division,
        match_type,
        session,
        match_date,
        status,
        holes (
          hole_number,
          par,
          team_a_score,
          team_b_score,
          team_c_score
        )
      `)
      .eq('status', 'completed');
    
    if (matchesError) {
      throw new Error(`Error fetching matches: ${matchesError.message}`);
    }
    
    console.log(`Fetched ${matches.length} completed matches`);
    
    // Group matches by division
    const divisionMatches = {};
    matches.forEach(match => {
      if (!divisionMatches[match.division]) {
        divisionMatches[match.division] = [];
      }
      divisionMatches[match.division].push(match);
    });
    
    // Calculate standings for each division
    for (const division of ['Trophy', 'Shield', 'Plaque', 'Bowl', 'Mug']) {
      const divTeams = teams.filter(team => team.division === division);
      const divMatches = divisionMatches[division] || [];
      
      console.log(`\n=== ${division} Division ===`);
      console.log(`Teams: ${divTeams.map(t => t.name).join(', ')}`);
      console.log(`Completed matches: ${divMatches.length}`);
      
      // Initialize team statistics
      const teamStats = {};
      divTeams.forEach(team => {
        teamStats[team.id] = {
          name: team.name,
          points: 0,
          matchesPlayed: 0,
          wins: 0,
          losses: 0,
          ties: 0
        };
      });
      
      // Process each match
      divMatches.forEach(match => {
        const matchDate = new Date(match.match_date);
        const day = matchDate.getDay(); // 0=Sunday, 5=Friday, 6=Saturday
        const dayName = day === 5 ? 'Friday' : day === 6 ? 'Saturday' : 'Sunday';
        
        console.log(`\nMatch: ${match.id} (${dayName} ${match.session} ${match.match_type})`);
        
        // Calculate points based on match type, day, session, and division
        const isBowlMug = division === 'Bowl' || division === 'Mug';
        
        let winPoints, tiePoints;
        
        if (dayName === 'Friday') {
          if (match.session === 'AM' && match.match_type === '4BBB') {
            winPoints = 5;
            tiePoints = 2.5;
          } else if (match.session === 'PM' && match.match_type === 'Foursomes') {
            if (isBowlMug) {
              winPoints = 4;
              tiePoints = 2;
            } else {
              winPoints = 3;
              tiePoints = 1.5;
            }
          }
        } else if (dayName === 'Saturday') {
          if (match.session === 'AM' && match.match_type === '4BBB') {
            winPoints = 5;
            tiePoints = 2.5;
          } else if (match.session === 'PM' && match.match_type === 'Foursomes') {
            if (isBowlMug) {
              winPoints = 4;
              tiePoints = 2;
            } else {
              winPoints = 3;
              tiePoints = 1.5;
            }
          }
        } else if (dayName === 'Sunday' && match.match_type === 'Singles') {
          winPoints = 3;
          tiePoints = 1.5;
        } else {
          winPoints = 1;
          tiePoints = 0.5;
        }
        
        console.log(`Points: Win=${winPoints}, Tie=${tiePoints}`);
        
        if (match.is_three_way && match.team_c_id) {
          // Process 3-way match
          processThreeWayMatch(match, teamStats, winPoints, tiePoints);
        } else {
          // Process 2-way match
          processTwoWayMatch(match, teamStats, winPoints, tiePoints);
        }
      });
      
      // Display team statistics
      console.log(`\n${division} Division Standings:`);
      const standings = Object.values(teamStats)
        .sort((a, b) => b.points - a.points)
        .map((stats, index) => ({
          ...stats,
          position: index + 1
        }));
      
      standings.forEach(team => {
        console.log(`${team.position}. ${team.name}: ${team.points.toFixed(1)} points (${team.wins}W-${team.losses}L-${team.ties}T)`);
      });
    }
    
  } catch (error) {
    console.error('Error verifying leaderboard accuracy:', error);
  }
}

/**
 * Process a 2-way match and update team statistics
 */
function processTwoWayMatch(match, teamStats, winPoints, tiePoints) {
  // Skip if team IDs are missing or not in our stats
  if (!match.team_a_id || !match.team_b_id) return;
  if (!teamStats[match.team_a_id] || !teamStats[match.team_b_id]) return;
  
  // Count holes won by each team
  let teamAWins = 0;
  let teamBWins = 0;
  let halvedHoles = 0;
  
  match.holes.forEach(hole => {
    if (hole.team_a_score === null || hole.team_b_score === null) return;
    
    if (hole.team_a_score < hole.team_b_score) {
      teamAWins++;
    } else if (hole.team_b_score < hole.team_a_score) {
      teamBWins++;
    } else {
      halvedHoles++;
    }
  });
  
  // Update match statistics
  teamStats[match.team_a_id].matchesPlayed++;
  teamStats[match.team_b_id].matchesPlayed++;
  
  const teamAName = teamStats[match.team_a_id].name;
  const teamBName = teamStats[match.team_b_id].name;
  
  // Determine winner
  if (teamAWins > teamBWins) {
    // Team A wins
    teamStats[match.team_a_id].points += winPoints;
    teamStats[match.team_a_id].wins++;
    teamStats[match.team_b_id].losses++;
    console.log(`${teamAName} defeats ${teamBName} (${teamAWins}-${teamBWins}) - ${winPoints} points`);
  } 
  else if (teamBWins > teamAWins) {
    // Team B wins
    teamStats[match.team_b_id].points += winPoints;
    teamStats[match.team_b_id].wins++;
    teamStats[match.team_a_id].losses++;
    console.log(`${teamBName} defeats ${teamAName} (${teamBWins}-${teamAWins}) - ${winPoints} points`);
  } 
  else {
    // Match tied
    teamStats[match.team_a_id].points += tiePoints;
    teamStats[match.team_b_id].points += tiePoints;
    teamStats[match.team_a_id].ties++;
    teamStats[match.team_b_id].ties++;
    console.log(`${teamAName} ties with ${teamBName} - ${tiePoints} points each`);
  }
}

/**
 * Process a 3-way match and update team statistics
 */
function processThreeWayMatch(match, teamStats, winPoints, tiePoints) {
  // Skip if team IDs are missing or not in our stats
  if (!match.team_a_id || !match.team_b_id || !match.team_c_id) return;
  if (!teamStats[match.team_a_id] || !teamStats[match.team_b_id] || !teamStats[match.team_c_id]) return;
  
  const teamAName = teamStats[match.team_a_id].name;
  const teamBName = teamStats[match.team_b_id].name;
  const teamCName = teamStats[match.team_c_id].name;
  
  console.log(`3-way match between ${teamAName}, ${teamBName}, and ${teamCName}`);
  
  // Process each head-to-head matchup
  // Team A vs Team B
  processHeadToHead(match, teamStats, match.team_a_id, match.team_b_id, winPoints, tiePoints);
  
  // Team A vs Team C
  processHeadToHead(match, teamStats, match.team_a_id, match.team_c_id, winPoints, tiePoints);
  
  // Team B vs Team C
  processHeadToHead(match, teamStats, match.team_b_id, match.team_c_id, winPoints, tiePoints);
}

/**
 * Process head-to-head results for a pair of teams in a 3-way match
 */
function processHeadToHead(match, teamStats, teamId1, teamId2, winPoints, tiePoints) {
  const team1Name = teamStats[teamId1].name;
  const team2Name = teamStats[teamId2].name;
  
  // Get holes with scores for both teams
  const validHoles = match.holes.filter(hole => {
    const score1 = getTeamScore(hole, teamId1, match);
    const score2 = getTeamScore(hole, teamId2, match);
    return score1 !== null && score2 !== null;
  });
  
  if (validHoles.length === 0) return;
  
  // Count holes won by each team
  let team1Wins = 0;
  let team2Wins = 0;
  let halvedHoles = 0;
  
  validHoles.forEach(hole => {
    const score1 = getTeamScore(hole, teamId1, match);
    const score2 = getTeamScore(hole, teamId2, match);
    
    if (score1 < score2) {
      team1Wins++;
    } else if (score2 < score1) {
      team2Wins++;
    } else {
      halvedHoles++;
    }
  });
  
  // Update match statistics
  teamStats[teamId1].matchesPlayed++;
  teamStats[teamId2].matchesPlayed++;
  
  // Determine winner
  if (team1Wins > team2Wins) {
    // Team 1 wins
    teamStats[teamId1].points += winPoints;
    teamStats[teamId1].wins++;
    teamStats[teamId2].losses++;
    console.log(`${team1Name} defeats ${team2Name} (${team1Wins}-${team2Wins}) - ${winPoints} points`);
  } 
  else if (team2Wins > team1Wins) {
    // Team 2 wins
    teamStats[teamId2].points += winPoints;
    teamStats[teamId2].wins++;
    teamStats[teamId1].losses++;
    console.log(`${team2Name} defeats ${team1Name} (${team2Wins}-${team1Wins}) - ${winPoints} points`);
  } 
  else {
    // Match tied
    teamStats[teamId1].points += tiePoints;
    teamStats[teamId2].points += tiePoints;
    teamStats[teamId1].ties++;
    teamStats[teamId2].ties++;
    console.log(`${team1Name} ties with ${team2Name} - ${tiePoints} points each`);
  }
}

/**
 * Get the score for a specific team in a hole
 */
function getTeamScore(hole, teamId, match) {
  if (match.team_a_id === teamId) return hole.team_a_score;
  if (match.team_b_id === teamId) return hole.team_b_score;
  if (match.team_c_id === teamId) return hole.team_c_score;
  return null;
}

// Run the verification
verifyLeaderboardAccuracy();
