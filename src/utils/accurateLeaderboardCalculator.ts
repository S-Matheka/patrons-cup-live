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
  
  // Process each match and accumulate points correctly
  completedMatches.forEach(match => {
    // Skip if not enough data
    if (!match.holes || match.holes.length === 0) return;
    
    if (match.isThreeWay && match.teamCId) {
      // Process 3-way match (Foursomes/Singles) - FIXED: Proper cumulative addition
      processThreeWayMatchFixed(match, teamStats);
    } else {
      // Process 2-way match (4BBB) - FIXED: Proper cumulative addition
      processTwoWayMatchFixed(match, teamStats);
    }
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
    teamAStrokes: hole.teamAScore || 0,
    teamBStrokes: hole.teamBScore || 0
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
 * Process a 3-team match and update team statistics - FIXED: Proper cumulative addition
 */
function processThreeWayMatchFixed(
  match: Match,
  teamStats: Record<number, any>
) {
  // Skip if team IDs are missing
  if (!match.teamAId || !match.teamBId || !match.teamCId) return;
  if (!teamStats[match.teamAId] || !teamStats[match.teamBId] || !teamStats[match.teamCId]) return;
  
  // Calculate match result
  const holesData = match.holes.map(hole => ({
    holeNumber: hole.number,
    par: hole.par || 4,
    teamAScore: hole.teamAScore || 0,
    teamBScore: hole.teamBScore || 0,
    teamCScore: hole.teamCScore || 0
  }));
  
  const result = calculateThreeWayResult(holesData, 18);
  
  // Skip if match isn't completed
  if (result.status !== 'completed') return;
  
  // Calculate head-to-head results for each pair of teams
  // This follows the TOCs where each team plays against the other two teams
  // FIXED: Each head-to-head matchup awards points separately and cumulatively
  
  // Team A vs Team B
  processHeadToHeadFixed(match, teamStats, match.teamAId, match.teamBId);
  
  // Team A vs Team C
  processHeadToHeadFixed(match, teamStats, match.teamAId, match.teamCId);
  
  // Team B vs Team C
  processHeadToHeadFixed(match, teamStats, match.teamBId, match.teamCId);
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
