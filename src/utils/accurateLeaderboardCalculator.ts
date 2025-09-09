/**
 * Accurate Leaderboard Calculator
 * Implements the exact point calculation logic based on the Tournament Terms of Competition (TOCs)
 */

import { Match, Team } from '@/types';
import { calculateMatchPlayResult, calculateThreeWayResult } from './matchPlayScoring';

export interface LeaderboardEntry {
  team: Team;
  position: number;
  points: number;
  wins: number;
  losses: number;
  ties: number;
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
  
  const { match_type, session, division } = match;
  const type = match_type || match.type; // Support both match_type and type properties
  
  // Determine day from date
  const matchDate = new Date(match.match_date || match.date || new Date());
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
 */
export function calculateAccurateLeaderboard(
  matches: Match[], 
  teams: Team[], 
  division: string
): LeaderboardEntry[] {
  // Safety checks
  if (!matches || !Array.isArray(matches)) {
    console.error("Invalid matches data in calculateAccurateLeaderboard");
    return [];
  }
  
  if (!teams || !Array.isArray(teams)) {
    console.error("Invalid teams data in calculateAccurateLeaderboard");
    return [];
  }
  
  if (!division) {
    console.error("No division specified in calculateAccurateLeaderboard");
    return [];
  }
  
  // Filter for the specified division
  const divisionTeams = teams.filter(team => team && team.division === division);
  
  // Initialize team statistics with proper cumulative tracking
  const teamStats: Record<number, {
    team: Team;
    points: number;
    wins: number;
    losses: number;
    ties: number;
    recentResults: string[];
    matchTypeBreakdown: {
      foursomes: { points: number; wins: number; losses: number; ties: number };
      singles: { points: number; wins: number; losses: number; ties: number };
    };
  }> = {};
  
  divisionTeams.forEach(team => {
    teamStats[team.id] = {
      team,
      points: 0,
      wins: 0,
      losses: 0,
      ties: 0,
      recentResults: [],
      matchTypeBreakdown: {
        foursomes: { points: 0, wins: 0, losses: 0, ties: 0 },
        singles: { points: 0, wins: 0, losses: 0, ties: 0 }
      }
    };
  });
  
  // Check if we have any teams in this division
  if (divisionTeams.length === 0) {
    console.warn(`No teams found for division: ${division}`);
    return [];
  }
  
  // Process only completed matches for the specified division
  const completedMatches = matches.filter(match => 
    match && match.division === division && 
    match.status === 'completed'
  );
  
  console.log(`🔍 Processing ${division} division: ${completedMatches.length} completed matches`);
  
  // Process each match and accumulate points correctly
  completedMatches.forEach((match, index) => {
    // Skip if not enough data
    if (!match.holes || match.holes.length === 0) {
      console.log(`⚠️  Match ${match.id} (${match.gameNumber}) has no holes data`);
      return;
    }
    
    console.log(`🎯 Processing match ${match.id} (${match.gameNumber}): ${match.session} ${match.match_type} - ${match.holes.length} holes`);
    
    if (match.isThreeWay && match.teamCId) {
      // Process 3-way match (Foursomes/Singles) - FIXED: Proper cumulative addition
      console.log(`   📊 3-way match: Team A (${match.teamAId}), Team B (${match.teamBId}), Team C (${match.teamCId})`);
      processThreeWayMatchFixed(match, teamStats);
    } else {
      // Process 2-way match (4BBB) - FIXED: Proper cumulative addition
      console.log(`   📊 2-way match: Team A (${match.teamAId}), Team B (${match.teamBId})`);
      processTwoWayMatchFixed(match, teamStats);
    }
  });
  
  // Log final team stats before sorting
  console.log(`📈 Final team stats for ${division}:`);
  Object.values(teamStats).forEach(stats => {
    console.log(`   ${stats.team.name}: ${stats.points}pts (${stats.wins}W-${stats.losses}L-${stats.ties}T)`);
  });
  
  // Convert to leaderboard entries and sort
  return Object.values(teamStats)
    .map(stats => ({
      team: stats.team,
      position: 0, // Will be set after sorting
      points: Math.round(stats.points * 10) / 10, // Round to 1 decimal place
      wins: stats.wins,
      losses: stats.losses,
      ties: stats.ties,
      recentResults: stats.recentResults.slice(0, 5).join('')
    }))
    .sort((a, b) => {
      // Sort by points (descending), then by wins
      if (b.points !== a.points) return b.points - a.points;
      return b.wins - a.wins;
    })
    .map((entry, index) => ({
      ...entry,
      position: index + 1
    }));
}

/**
 * Process a 2-way match and update team statistics - FIXED: Proper cumulative addition
 */
function processTwoWayMatchFixed(
  match: Match,
  teamStats: Record<number, any>
) {
  // Skip if team IDs are missing
  if (!match.teamAId || !match.teamBId) return;
  if (!teamStats[match.teamAId] || !teamStats[match.teamBId]) return;
  
  // Calculate match result
  const holesData = match.holes.map(hole => ({
    holeNumber: hole.number,
    par: hole.par || 4,
    teamAStrokes: hole.teamAScore,
    teamBStrokes: hole.teamBScore
  }));
  
  const result = calculateMatchPlayResult(holesData, 18);
  
  // Skip if match isn't completed
  if (result.status !== 'completed') return;
  
  // Determine points based on match result - FIXED: Proper cumulative addition
  if (result.winner === 'teamA') {
    // Team A wins
    const points = getMatchPoints(match, 'win');
    teamStats[match.teamAId].points += points; // FIXED: Cumulative addition
    teamStats[match.teamAId].wins += 1;
    teamStats[match.teamAId].recentResults.unshift('W');
    
    teamStats[match.teamBId].losses += 1;
    teamStats[match.teamBId].recentResults.unshift('L');
  } 
  else if (result.winner === 'teamB') {
    // Team B wins
    const points = getMatchPoints(match, 'win');
    teamStats[match.teamBId].points += points; // FIXED: Cumulative addition
    teamStats[match.teamBId].wins += 1;
    teamStats[match.teamBId].recentResults.unshift('W');
    
    teamStats[match.teamAId].losses += 1;
    teamStats[match.teamAId].recentResults.unshift('L');
  } 
  else if (result.winner === 'halved') {
    // Match tied
    const points = getMatchPoints(match, 'tie');
    teamStats[match.teamAId].points += points; // FIXED: Cumulative addition
    teamStats[match.teamBId].points += points; // FIXED: Cumulative addition
    teamStats[match.teamAId].ties += 1;
    teamStats[match.teamBId].ties += 1;
    teamStats[match.teamAId].recentResults.unshift('T');
    teamStats[match.teamBId].recentResults.unshift('T');
  }
}

/**
 * Process a 3-team match and update team statistics - FIXED: Individual head-to-head matches
 */
function processThreeWayMatchFixed(
  match: Match,
  teamStats: Record<number, any>
) {
  // Skip if team IDs are missing
  if (!match.teamAId || !match.teamBId || !match.teamCId) return;
  if (!teamStats[match.teamAId] || !teamStats[match.teamBId] || !teamStats[match.teamCId]) return;
  
  // Calculate individual head-to-head match results
  const holesData = match.holes.map(hole => ({
    holeNumber: hole.number,
    par: hole.par || 4,
    teamAScore: hole.teamAScore,
    teamBScore: hole.teamBScore,
    teamCScore: hole.teamCScore
  }));
  
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
  
  // Award points based on individual head-to-head matches (CORRECT TOCs approach)
  
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
    
    if (score1 !== null && score2 !== null) {
      if (score1 < score2) {
        team1Wins++;
      } else if (score2 < score1) {
        team2Wins++;
      } else {
        halvedHoles++;
      }
    }
  });
  
  // Determine match result - FIXED: Proper cumulative addition
  if (team1Wins > team2Wins) {
    // Team 1 wins
    const points = getMatchPoints(match, 'win');
    teamStats[teamId1].points += points; // FIXED: Cumulative addition
    teamStats[teamId1].wins += 1;
    teamStats[teamId1].recentResults.unshift('W');
    
    teamStats[teamId2].losses += 1;
    teamStats[teamId2].recentResults.unshift('L');
  } 
  else if (team2Wins > team1Wins) {
    // Team 2 wins
    const points = getMatchPoints(match, 'win');
    teamStats[teamId2].points += points; // FIXED: Cumulative addition
    teamStats[teamId2].wins += 1;
    teamStats[teamId2].recentResults.unshift('W');
    
    teamStats[teamId1].losses += 1;
    teamStats[teamId1].recentResults.unshift('L');
  } 
  else {
    // Match tied
    const points = getMatchPoints(match, 'tie');
    teamStats[teamId1].points += points; // FIXED: Cumulative addition
    teamStats[teamId2].points += points; // FIXED: Cumulative addition
    teamStats[teamId1].ties += 1;
    teamStats[teamId2].ties += 1;
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
