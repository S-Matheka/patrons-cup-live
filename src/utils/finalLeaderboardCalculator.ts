/**
 * Final Leaderboard Calculator
 * 
 * This is the production-ready implementation of the leaderboard calculation logic
 * that strictly follows the Tournament Terms of Competition (TOCs).
 * 
 * Key features:
 * - Accurate point calculations based on match type, day, and division
 * - Handles 2-way and 3-way matches correctly
 * - Only counts completed matches for the leaderboard
 * - Robust error handling and logging
 * - Uses team seed ordering (1, 2, 3) for display
 */

import { Match, Team } from '@/types';
import { calculateThreeWayResult } from './matchPlayScoring';

export interface LeaderboardEntry {
  team: Team;
  position: number;
  points: number;
  wins: number;
  losses: number;
  ties: number;
  played: number;
  recentResults: string;
}

/**
 * Calculate points for a match based on TOCs rules
 * 
 * Points system:
 * 
 * Trophy, Shield & Plaque:
 * - Friday AM 4BBB: 5pts win, 2.5pts tie
 * - Friday PM Foursomes: 3pts win, 1.5pts tie
 * - Saturday AM 4BBB: 5pts win, 2.5pts tie
 * - Saturday PM Foursomes: 3pts win, 1.5pts tie
 * - Sunday Singles: 3pts win, 1.5pts tie
 * 
 * Bowl & Mug:
 * - Friday AM 4BBB: 5pts win, 2.5pts tie
 * - Friday PM Foursomes: 4pts win, 2pts tie
 * - Saturday AM 4BBB: 5pts win, 2.5pts tie
 * - Saturday PM Foursomes: 4pts win, 2pts tie
 * - Sunday Singles: 3pts win, 1.5pts tie
 */
function getMatchPoints(match: Match, result: 'win' | 'tie' | 'loss'): number {
  if (result === 'loss') return 0;
  
  // Support both match_type and type properties
  const type = match.match_type || match.type;
  const { session, division } = match;
  
  // Determine day from date (support both match_date and date)
  const matchDate = new Date(match.match_date || match.date || '');
  const day = matchDate.getDay(); // 0=Sunday, 5=Friday, 6=Saturday
  
  // Points based on division type
  const isBowlMug = division === 'Bowl' || division === 'Mug';
  
  // Friday matches
  if (day === 5) {
    if (session === 'AM' && type === '4BBB') {
      return result === 'win' ? 5 : 2.5; // All divisions: 5pts win, 2.5pts tie
    } 
    if (session === 'PM' && type === 'Foursomes') {
      if (isBowlMug) {
        return result === 'win' ? 4 : 2; // Bowl/Mug: 4pts win, 2pts tie
      } else {
        return result === 'win' ? 3 : 1.5; // Trophy/Shield/Plaque: 3pts win, 1.5pts tie
      }
    }
  }
  
  // Saturday matches
  if (day === 6) {
    if (session === 'AM' && type === '4BBB') {
      return result === 'win' ? 5 : 2.5; // All divisions: 5pts win, 2.5pts tie
    }
    if (session === 'PM' && type === 'Foursomes') {
      if (isBowlMug) {
        return result === 'win' ? 4 : 2; // Bowl/Mug: 4pts win, 2pts tie
      } else {
        return result === 'win' ? 3 : 1.5; // Trophy/Shield/Plaque: 3pts win, 1.5pts tie
      }
    }
  }
  
  // Sunday matches (Singles)
  if (day === 0 && type === 'Singles') {
    return result === 'win' ? 3 : 1.5; // All divisions: 3pts win, 1.5pts tie
  }
  
  // Default fallback (should not reach here with valid data)
  console.warn(`Unknown match format: day=${day}, session=${session}, type=${type}, division=${division}`);
  return result === 'win' ? 1 : 0.5;
}

/**
 * Calculate accurate leaderboard standings based on completed matches only
 * Uses official team ordering for display but calculates points from database
 */
export function calculateFinalLeaderboard(
  matches: Match[], 
  teams: Team[], 
  division: string
): LeaderboardEntry[] {
  // Safety checks
  if (!matches || !Array.isArray(matches)) {
    console.error("Invalid matches data in calculateFinalLeaderboard");
    return [];
  }
  
  if (!teams || !Array.isArray(teams)) {
    console.error("Invalid teams data in calculateFinalLeaderboard");
    return [];
  }
  
  if (!division) {
    console.error("No division specified in calculateFinalLeaderboard");
    return [];
  }
  
  // Filter for the specified division
  const divisionTeams = teams.filter(team => team && team.division === division);
  
  // Check if we have any teams in this division
  if (divisionTeams.length === 0) {
    console.warn(`No teams found for division: ${division}`);
    return [];
  }

  // Initialize team statistics
  const teamStats: Record<number, {
    team: Team;
    points: number;
    wins: number;
    losses: number;
    ties: number;
    played: number;
    recentResults: string[];
  }> = {};
  
  divisionTeams.forEach(team => {
    teamStats[team.id] = {
      team,
      points: 0,
      wins: 0,
      losses: 0,
      ties: 0,
      played: 0,
      recentResults: []
    };
  });
  
  // Process only completed matches for the specified division
  const completedMatches = matches.filter(match => 
    match && match.division === division && 
    match.status === 'completed'
  );
  
  // Process each match
  completedMatches.forEach(match => {
    try {
      // Skip if not enough data
      if (!match.holes || match.holes.length === 0) return;
      
      if (match.isThreeWay && match.teamCId) {
        // Process 3-way match (Foursomes/Singles) - FIXED: Proper cumulative addition
        processThreeWayMatchFixed(match, teamStats);
      } else {
        // Process 2-way match (4BBB) - FIXED: Proper cumulative addition
        processTwoWayMatchFixed(match, teamStats);
      }
    } catch (error) {
      console.error(`Error processing match ${match.id}:`, error);
    }
  });


  // Convert to leaderboard entries and sort by seed (1, 2, 3)
  const leaderboardEntries: LeaderboardEntry[] = [];
  
  // Sort teams by seed (1, 2, 3) and then by points for tiebreakers
  const sortedTeams = divisionTeams
    .sort((a, b) => {
      // First sort by seed (1, 2, 3)
      const seedA = a.seed || 999;
      const seedB = b.seed || 999;
      if (seedA !== seedB) {
        return seedA - seedB;
      }
      
      // If same seed, sort by points (descending)
      const statsA = teamStats[a.id];
      const statsB = teamStats[b.id];
      if (statsA && statsB) {
        return statsB.points - statsA.points;
      }
      return 0;
    });

  // Create leaderboard entries in seed order
  sortedTeams.forEach((team, index) => {
    const stats = teamStats[team.id];
    if (!stats) {
      console.warn(`No stats found for team ${team.name} in division ${division}`);
      return;
    }

    leaderboardEntries.push({
      team: stats.team,
      position: index + 1,
      points: Math.round(stats.points * 10) / 10, // Round to 1 decimal place
      wins: stats.wins,
      losses: stats.losses,
      ties: stats.ties,
      played: stats.played,
      recentResults: stats.recentResults.slice(0, 5).join('')
    });
  });

  return leaderboardEntries;
}

/**
 * Process a 2-way match and update team statistics - FIXED: Proper cumulative addition
 */
function processTwoWayMatchFixed(
  match: Match,
  teamStats: Record<number, any>
) {
  
  if (!match.teamAId || !match.teamBId) return;
  if (!teamStats[match.teamAId] || !teamStats[match.teamBId]) return;
  
  // Count holes won by each team
  let teamAWins = 0;
  let teamBWins = 0;
  let halvedHoles = 0;
  
  
  match.holes.forEach(hole => {
    if (hole.teamAScore === null || hole.teamBScore === null) return;
    
    if (hole.teamAScore < hole.teamBScore) {
      teamAWins++;
    } else if (hole.teamBScore < hole.teamAScore) {
      teamBWins++;
    } else {
      halvedHoles++;
    }
  });
  
  // Update match statistics
  teamStats[match.teamAId].played++;
  teamStats[match.teamBId].played++;
  
  // Determine match result
  if (teamAWins > teamBWins) {
    // Team A wins
    const points = getMatchPoints(match, 'win');
    teamStats[match.teamAId].points += points;
    teamStats[match.teamAId].wins++;
    teamStats[match.teamAId].recentResults.unshift('W');
    
    teamStats[match.teamBId].losses++;
    teamStats[match.teamBId].recentResults.unshift('L');
  } 
  else if (teamBWins > teamAWins) {
    // Team B wins
    const points = getMatchPoints(match, 'win');
    teamStats[match.teamBId].points += points;
    teamStats[match.teamBId].wins++;
    teamStats[match.teamBId].recentResults.unshift('W');
    
    teamStats[match.teamAId].losses++;
    teamStats[match.teamAId].recentResults.unshift('L');
  } 
  else {
    // Match tied
    const points = getMatchPoints(match, 'tie');
    teamStats[match.teamAId].points += points;
    teamStats[match.teamBId].points += points;
    teamStats[match.teamAId].ties++;
    teamStats[match.teamBId].ties++;
    teamStats[match.teamAId].recentResults.unshift('T');
    teamStats[match.teamBId].recentResults.unshift('T');
  }
}

/**
 * Process a 3-team match and update team statistics - FIXED: Proper cumulative addition
 */
function processThreeWayMatchFixed(
  match: Match,
  teamStats: Record<number, any>
) {
  // Skip if team IDs are missing
  if (!match.teamAId || !match.teamBId || !match.teamCId) return;
  if (!teamStats[match.teamAId] || !teamStats[match.teamBId] || !teamStats[match.teamCId]) return;
  
  // Calculate three-way match result using the three-way result calculator
  const holesData = match.holes.map(hole => ({
    holeNumber: hole.number,
    par: hole.par || 4,
    teamAScore: hole.teamAScore,
    teamBScore: hole.teamBScore,
    teamCScore: hole.teamCScore || null
  }));
  
  
  const result = calculateThreeWayResult(holesData, 18);
  
  // Skip if match isn't completed
  if (result.status !== 'completed') return;
  
  // FIXED: Award points based on individual head-to-head matches (CORRECT TOCs approach)
  
  // Calculate individual head-to-head results
  let teamAvsB = { teamAWins: 0, teamBWins: 0, holesPlayed: 0 };
  let teamAvsC = { teamAWins: 0, teamCWins: 0, holesPlayed: 0 };
  let teamBvsC = { teamBWins: 0, teamCWins: 0, holesPlayed: 0 };
  
  holesData.forEach(hole => {
    // Team A vs Team B
    if (hole.teamAScore !== null && hole.teamBScore !== null) {
      teamAvsB.holesPlayed++;
      if (hole.teamAScore < hole.teamBScore) {
        teamAvsB.teamAWins++;
      } else if (hole.teamBScore < hole.teamAScore) {
        teamAvsB.teamBWins++;
      }
    }
    
    // Team A vs Team C
    if (hole.teamAScore !== null && hole.teamCScore !== null && hole.teamCScore !== undefined) {
      teamAvsC.holesPlayed++;
      if (hole.teamAScore < hole.teamCScore) {
        teamAvsC.teamAWins++;
      } else if (hole.teamCScore < hole.teamAScore) {
        teamAvsC.teamCWins++;
      }
    }

    // Team B vs Team C
    if (hole.teamBScore !== null && hole.teamCScore !== null && hole.teamCScore !== undefined) {
      teamBvsC.holesPlayed++;
      if (hole.teamBScore < hole.teamCScore) {
        teamBvsC.teamBWins++;
      } else if (hole.teamCScore < hole.teamBScore) {
        teamBvsC.teamCWins++;
      }
    }
  });
  
  // Check if all individual matches are completed
  const isTeamAvsBComplete = teamAvsB.holesPlayed === 18 || Math.abs(teamAvsB.teamAWins - teamAvsB.teamBWins) > (18 - teamAvsB.holesPlayed);
  const isTeamAvsCComplete = teamAvsC.holesPlayed === 18 || Math.abs(teamAvsC.teamAWins - teamAvsC.teamCWins) > (18 - teamAvsC.holesPlayed);
  const isTeamBvsCComplete = teamBvsC.holesPlayed === 18 || Math.abs(teamBvsC.teamBWins - teamBvsC.teamCWins) > (18 - teamBvsC.holesPlayed);
  
  // Skip if not all individual matches are completed
  if (!isTeamAvsBComplete || !isTeamAvsCComplete || !isTeamBvsCComplete) return;
  
  // Get division from the match data
  const division = match.division;
  
  if (!division) {
    console.warn(`Could not determine division for match ${match.id}`);
    return;
  }
  
  const isBowlMug = division === 'Bowl' || division === 'Mug';
  
  // FIXED: Use the correct TOCs point calculation function instead of hardcoded values
  const winPoints = getMatchPoints(match, 'win');
  const tiePoints = getMatchPoints(match, 'tie');
  
  // Award points based on individual head-to-head matches
  
  // Team A vs Team B
  if (teamAvsB.teamAWins > teamAvsB.teamBWins) {
    // Team A wins
    teamStats[match.teamAId].points += winPoints;
    teamStats[match.teamAId].wins += 1;
    teamStats[match.teamAId].recentResults.unshift('W');
    
    teamStats[match.teamBId].losses += 1;
    teamStats[match.teamBId].recentResults.unshift('L');
  } else if (teamAvsB.teamBWins > teamAvsB.teamAWins) {
    // Team B wins
    teamStats[match.teamBId].points += winPoints;
    teamStats[match.teamBId].wins += 1;
    teamStats[match.teamBId].recentResults.unshift('W');
    
    teamStats[match.teamAId].losses += 1;
    teamStats[match.teamAId].recentResults.unshift('L');
  } else {
    // Tie
    teamStats[match.teamAId].points += tiePoints;
    teamStats[match.teamBId].points += tiePoints;
    teamStats[match.teamAId].ties += 1;
    teamStats[match.teamBId].ties += 1;
    teamStats[match.teamAId].recentResults.unshift('T');
    teamStats[match.teamBId].recentResults.unshift('T');
  }
  
  // Team A vs Team C
  if (teamAvsC.teamAWins > teamAvsC.teamCWins) {
    // Team A wins
    teamStats[match.teamAId].points += winPoints;
    teamStats[match.teamAId].wins += 1;
    teamStats[match.teamAId].recentResults.unshift('W');
    
    teamStats[match.teamCId].losses += 1;
    teamStats[match.teamCId].recentResults.unshift('L');
  } else if (teamAvsC.teamCWins > teamAvsC.teamAWins) {
    // Team C wins
    teamStats[match.teamCId].points += winPoints;
    teamStats[match.teamCId].wins += 1;
    teamStats[match.teamCId].recentResults.unshift('W');
    
    teamStats[match.teamAId].losses += 1;
    teamStats[match.teamAId].recentResults.unshift('L');
  } else {
    // Tie
    teamStats[match.teamAId].points += tiePoints;
    teamStats[match.teamCId].points += tiePoints;
    teamStats[match.teamAId].ties += 1;
    teamStats[match.teamCId].ties += 1;
    teamStats[match.teamAId].recentResults.unshift('T');
    teamStats[match.teamCId].recentResults.unshift('T');
  }
  
  // Team B vs Team C
  if (teamBvsC.teamBWins > teamBvsC.teamCWins) {
    // Team B wins
    teamStats[match.teamBId].points += winPoints;
    teamStats[match.teamBId].wins += 1;
    teamStats[match.teamBId].recentResults.unshift('W');
    
    teamStats[match.teamCId].losses += 1;
    teamStats[match.teamCId].recentResults.unshift('L');
  } else if (teamBvsC.teamCWins > teamBvsC.teamBWins) {
    // Team C wins
    teamStats[match.teamCId].points += winPoints;
    teamStats[match.teamCId].wins += 1;
    teamStats[match.teamCId].recentResults.unshift('W');
    
    teamStats[match.teamBId].losses += 1;
    teamStats[match.teamBId].recentResults.unshift('L');
  } else {
    // Tie
    teamStats[match.teamBId].points += tiePoints;
    teamStats[match.teamCId].points += tiePoints;
    teamStats[match.teamBId].ties += 1;
    teamStats[match.teamCId].ties += 1;
    teamStats[match.teamBId].recentResults.unshift('T');
    teamStats[match.teamCId].recentResults.unshift('T');
  }
  
  // CRITICAL FIX: Update played count for three-way matches
  // Each team plays 2 head-to-head matches in a three-way match
  teamStats[match.teamAId].played += 2;
  teamStats[match.teamBId].played += 2;
  teamStats[match.teamCId].played += 2;
}

/**
 * Process head-to-head results for a pair of teams in a 3-way match - FIXED: Proper cumulative addition
 */
function processHeadToHeadFixed(
  match: Match,
  teamStats: Record<number, any>,
  teamId1: number,
  teamId2: number
) {
  // Get holes with scores for both teams
  const validHoles = match.holes.filter(hole => {
    const score1 = getTeamScore(hole, teamId1, match);
    const score2 = getTeamScore(hole, teamId2, match);
    return score1 !== null && score2 !== null && score1 > 0 && score2 > 0;
  });
  
  if (validHoles.length === 0) return;
  
  // Count holes won by each team
  let team1Wins = 0;
  let team2Wins = 0;
  let halvedHoles = 0;
  
  validHoles.forEach(hole => {
    const score1 = getTeamScore(hole, teamId1, match);
    const score2 = getTeamScore(hole, teamId2, match);
    
    if (score1 === null || score2 === null) return;
    
    if (score1 < score2) {
      team1Wins++;
    } else if (score2 < score1) {
      team2Wins++;
    } else {
      halvedHoles++;
    }
  });
  
  // Update match statistics
  teamStats[teamId1].played++;
  teamStats[teamId2].played++;
  
  // Determine match result
  if (team1Wins > team2Wins) {
    // Team 1 wins
    const points = getMatchPoints(match, 'win');
    teamStats[teamId1].points += points;
    teamStats[teamId1].wins++;
    teamStats[teamId1].recentResults.unshift('W');
    
    teamStats[teamId2].losses++;
    teamStats[teamId2].recentResults.unshift('L');
  } 
  else if (team2Wins > team1Wins) {
    // Team 2 wins
    const points = getMatchPoints(match, 'win');
    teamStats[teamId2].points += points;
    teamStats[teamId2].wins++;
    teamStats[teamId2].recentResults.unshift('W');
    
    teamStats[teamId1].losses++;
    teamStats[teamId1].recentResults.unshift('L');
  } 
  else {
    // Match tied
    const points = getMatchPoints(match, 'tie');
    teamStats[teamId1].points += points;
    teamStats[teamId2].points += points;
    teamStats[teamId1].ties++;
    teamStats[teamId2].ties++;
    teamStats[teamId1].recentResults.unshift('T');
    teamStats[teamId2].recentResults.unshift('T');
  }
}

/**
 * Get the score for a specific team in a hole
 */
function getTeamScore(hole: any, teamId: number, match: Match): number | null {
  if (match.teamAId === teamId) return hole.teamAScore;
  if (match.teamBId === teamId) return hole.teamBScore;
  if (match.teamCId === teamId) return hole.teamCScore;
  return null;
}
