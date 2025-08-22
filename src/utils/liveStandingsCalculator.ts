/**
 * REAL-TIME LIVE STANDINGS CALCULATOR
 * Calculates team standings from live match data as holes are played
 * Updates in real-time for audience engagement
 */

import { Match, Team, Score } from '@/types';
import { calculateMatchPlayResult } from './matchPlayScoring';

export interface LiveStandingEntry {
  teamId: number;
  team: Team;
  division: string;
  points: number;
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
  matchesHalved: number;
  matchesInProgress: number;
  holesWon: number;
  holesLost: number;
  currentStatus: string; // "Leading 2 matches", "Down 1 match", "All square"
  liveMatchStatus: string[]; // ["2up vs Nyali", "AS vs Railway"]
  position: number;
  positionChange: 'up' | 'down' | 'same';
  trend: string; // Recent form like "W-L-H-W"
}

/**
 * Calculate live standings from current match data
 * This runs in real-time as holes are scored
 */
export function calculateLiveStandings(
  matches: Match[], 
  teams: Team[], 
  division?: string
): LiveStandingEntry[] {
  const teamStats: Record<number, {
    points: number;
    matchesPlayed: number;
    matchesWon: number;
    matchesLost: number;
    matchesHalved: number;
    matchesInProgress: number;
    holesWon: number;
    holesLost: number;
    liveMatchStatus: string[];
    recentResults: ('W' | 'L' | 'H' | 'IP')[];
  }> = {};

  // Initialize stats for all teams in division
  const divisionTeams = division ? teams.filter(t => t.division === division) : teams;
  
  divisionTeams.forEach(team => {
    teamStats[team.id] = {
      points: 0,
      matchesPlayed: 0,
      matchesWon: 0,
      matchesLost: 0,
      matchesHalved: 0,
      matchesInProgress: 0,
      holesWon: 0,
      holesLost: 0,
      liveMatchStatus: [],
      recentResults: []
    };
  });

  // Process all matches for this division
  const divisionMatches = division 
    ? matches.filter(m => m.division === division)
    : matches;

  divisionMatches.forEach(match => {
    if (!match.teamAId || !match.teamBId) return; // Skip BYE matches

    const teamAStats = teamStats[match.teamAId];
    const teamBStats = teamStats[match.teamBId];
    
    if (!teamAStats || !teamBStats) return; // Team not in this division

    if (match.status === 'completed') {
      // Completed match - count full points
      const holesData = match.holes.map(hole => ({
        holeNumber: hole.number,
        par: hole.par || 4,
        teamAStrokes: hole.teamAScore ?? 0,
        teamBStrokes: hole.teamBScore ?? 0
      }));

      const result = calculateMatchPlayResult(holesData, 18);
      
      // Update match counts
      teamAStats.matchesPlayed++;
      teamBStats.matchesPlayed++;

      // Update points and wins/losses
      if (result.winner === 'teamA') {
        teamAStats.points += 1;
        teamAStats.matchesWon++;
        teamBStats.matchesLost++;
        teamAStats.recentResults.unshift('W');
        teamBStats.recentResults.unshift('L');
      } else if (result.winner === 'teamB') {
        teamBStats.points += 1;
        teamBStats.matchesWon++;
        teamAStats.matchesLost++;
        teamAStats.recentResults.unshift('L');
        teamBStats.recentResults.unshift('W');
      } else {
        // Halved
        teamAStats.points += 0.5;
        teamBStats.points += 0.5;
        teamAStats.matchesHalved++;
        teamBStats.matchesHalved++;
        teamAStats.recentResults.unshift('H');
        teamBStats.recentResults.unshift('H');
      }

      // Count holes won/lost
      teamAStats.holesWon += result.teamAHolesWon;
      teamAStats.holesLost += result.teamBHolesWon;
      teamBStats.holesWon += result.teamBHolesWon;
      teamBStats.holesLost += result.teamAHolesWon;

    } else if (match.status === 'in-progress') {
      // Live match - show current status
      teamAStats.matchesInProgress++;
      teamBStats.matchesInProgress++;
      teamAStats.recentResults.unshift('IP');
      teamBStats.recentResults.unshift('IP');

      // Calculate current match status
      const completedHoles = match.holes.filter(h => 
        h.teamAScore !== null && h.teamBScore !== null
      );

      if (completedHoles.length > 0) {
        const holesData = completedHoles.map(hole => ({
          holeNumber: hole.number,
          par: hole.par || 4,
          teamAStrokes: hole.teamAScore ?? 0,
          teamBStrokes: hole.teamBScore ?? 0
        }));

        const liveResult = calculateMatchPlayResult(holesData, 18);
        const teamAName = teams.find(t => t.id === match.teamAId)?.name || 'TeamA';
        const teamBName = teams.find(t => t.id === match.teamBId)?.name || 'TeamB';

        // Create live status strings
        if (liveResult.winner === 'teamA') {
          teamAStats.liveMatchStatus.push(`${liveResult.result} vs ${teamBName}`);
          teamBStats.liveMatchStatus.push(`${liveResult.result.replace('up', 'down')} vs ${teamAName}`);
        } else if (liveResult.winner === 'teamB') {
          teamBStats.liveMatchStatus.push(`${liveResult.result} vs ${teamAName}`);
          teamAStats.liveMatchStatus.push(`${liveResult.result.replace('up', 'down')} vs ${teamBName}`);
        } else {
          teamAStats.liveMatchStatus.push(`AS vs ${teamBName}`);
          teamBStats.liveMatchStatus.push(`AS vs ${teamAName}`);
        }

        // Count holes won/lost so far
        teamAStats.holesWon += liveResult.teamAHolesWon;
        teamAStats.holesLost += liveResult.teamBHolesWon;
        teamBStats.holesWon += liveResult.teamBHolesWon;
        teamBStats.holesLost += liveResult.teamAHolesWon;
      }
    }

    // Keep only last 5 results
    teamAStats.recentResults = teamAStats.recentResults.slice(0, 5);
    teamBStats.recentResults = teamBStats.recentResults.slice(0, 5);
  });

  // Convert to standings entries and sort
  const standings: LiveStandingEntry[] = divisionTeams.map(team => {
    const stats = teamStats[team.id];
    
    return {
      teamId: team.id,
      team,
      division: team.division,
      points: stats.points,
      matchesPlayed: stats.matchesPlayed,
      matchesWon: stats.matchesWon,
      matchesLost: stats.matchesLost,
      matchesHalved: stats.matchesHalved,
      matchesInProgress: stats.matchesInProgress,
      holesWon: stats.holesWon,
      holesLost: stats.holesLost,
      currentStatus: generateCurrentStatus(stats),
      liveMatchStatus: stats.liveMatchStatus,
      position: 0, // Will be set after sorting
      positionChange: 'same',
      trend: stats.recentResults.join('-') || '-'
    };
  });

  // Sort by points (desc), then matches played (asc), then holes differential (desc)
  standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (a.matchesPlayed !== b.matchesPlayed) return a.matchesPlayed - b.matchesPlayed;
    return (b.holesWon - b.holesLost) - (a.holesWon - a.holesLost);
  });

  // Set positions
  standings.forEach((entry, index) => {
    entry.position = index + 1;
  });

  return standings;
}

function generateCurrentStatus(stats: any): string {
  const { matchesWon, matchesLost, matchesHalved, matchesInProgress } = stats;
  
  if (matchesInProgress > 0) {
    return `${matchesInProgress} live match${matchesInProgress > 1 ? 'es' : ''}`;
  }
  
  if (matchesWon === 0 && matchesLost === 0 && matchesHalved === 0) {
    return 'No matches played';
  }
  
  const total = matchesWon + matchesLost + matchesHalved;
  if (matchesWon > matchesLost) {
    return `Leading (${matchesWon}-${matchesLost}-${matchesHalved})`;
  } else if (matchesLost > matchesWon) {
    return `Behind (${matchesWon}-${matchesLost}-${matchesHalved})`;
  } else {
    return `Level (${matchesWon}-${matchesLost}-${matchesHalved})`;
  }
}

/**
 * Get live tournament statistics
 */
export function getLiveTournamentStats(matches: Match[]) {
  const totalMatches = matches.length;
  const completedMatches = matches.filter(m => m.status === 'completed').length;
  const inProgressMatches = matches.filter(m => m.status === 'in-progress').length;
  const scheduledMatches = matches.filter(m => m.status === 'scheduled').length;

  return {
    totalMatches,
    completedMatches,
    inProgressMatches,
    scheduledMatches,
    completionPercentage: totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0,
    livePercentage: totalMatches > 0 ? Math.round((inProgressMatches / totalMatches) * 100) : 0
  };
}
