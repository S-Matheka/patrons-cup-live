/**
 * REAL-TIME LIVE STANDINGS CALCULATOR
 * Calculates team standings from live match data as holes are played
 * Updates in real-time for audience engagement
 * Uses proper tournament point allocation system
 */

import { Match, Team, Score } from '@/types';
import { calculateMatchPlayResult, calculateThreeWayResult } from './matchPlayScoring';

/**
 * Get points for match based on tournament rules
 */
function getMatchPoints(match: Match, result: 'win' | 'tie' | 'loss'): number {
  const { type, session, division, date } = match;
  
  // Determine day from date
  const matchDate = new Date(date);
  const dayOfWeek = matchDate.getDay(); // 0=Sunday, 5=Friday, 6=Saturday
  
  let day: 'Friday' | 'Saturday' | 'Sunday';
  if (dayOfWeek === 5) day = 'Friday';
  else if (dayOfWeek === 6) day = 'Saturday';
  else day = 'Sunday';
  
  // Points based on division type
  const isBowlMug = division === 'Bowl' || division === 'Mug';
  
  // Calculate points based on match type, day, session, and division
  if (day === 'Friday') {
    if (session === 'AM' && type === '4BBB') {
      // Friday AM 4BBB: 5pts win, 2.5pts tie (all divisions)
      return result === 'win' ? 5 : result === 'tie' ? 2.5 : 0;
    } else if (session === 'PM' && type === 'Foursomes') {
      // Friday PM Foursomes: Trophy/Shield/Plaque = 3pts win, 1.5pts tie | Bowl/Mug = 4pts win, 2pts tie
      if (isBowlMug) {
        return result === 'win' ? 4 : result === 'tie' ? 2 : 0;
      } else {
        return result === 'win' ? 3 : result === 'tie' ? 1.5 : 0;
      }
    }
  } else if (day === 'Saturday') {
    if (session === 'AM' && type === '4BBB') {
      // Saturday AM 4BBB: 5pts win, 2.5pts tie (all divisions)
      return result === 'win' ? 5 : result === 'tie' ? 2.5 : 0;
    } else if (session === 'PM' && type === 'Foursomes') {
      // Saturday PM Foursomes: Trophy/Shield/Plaque = 3pts win, 1.5pts tie | Bowl/Mug = 4pts win, 2pts tie
      if (isBowlMug) {
        return result === 'win' ? 4 : result === 'tie' ? 2 : 0;
      } else {
        return result === 'win' ? 3 : result === 'tie' ? 1.5 : 0;
      }
    }
  } else if (day === 'Sunday' && type === 'Singles') {
    // Sunday Singles: 3pts win, 1.5pts tie (all divisions)
    return result === 'win' ? 3 : result === 'tie' ? 1.5 : 0;
  }
  
  // Default fallback
  return result === 'win' ? 1 : result === 'tie' ? 0.5 : 0;
}

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
    const teamCStats = match.teamCId ? teamStats[match.teamCId] : null;
    
    if (!teamAStats || !teamBStats) return; // Team not in this division
    if (match.isThreeWay && (!teamCStats || !match.teamCId)) return; // Skip incomplete 3-way matches

    if (match.status === 'completed') {
      if (match.isThreeWay && teamCStats) {
        // 3-team stroke play match
        const holesData = match.holes.map(hole => ({
          holeNumber: hole.number,
          par: hole.par || 4,
          teamAStrokes: hole.teamAScore,
          teamBStrokes: hole.teamBScore,
          teamCStrokes: hole.teamCScore ?? null
        }));

        const result = calculateThreeWayResult(holesData, 18);
        
        // Update match counts
        teamAStats.matchesPlayed++;
        teamBStats.matchesPlayed++;
        teamCStats.matchesPlayed++;

        // Award points based on finishing position in stroke play
        const scores = [
          { team: 'teamA', total: result.teamATotal, stats: teamAStats },
          { team: 'teamB', total: result.teamBTotal, stats: teamBStats },
          { team: 'teamC', total: result.teamCTotal, stats: teamCStats }
        ].sort((a, b) => a.total - b.total);

        // Award points: 1st place gets win points, 2nd gets tie points, 3rd gets 0
        const winPoints = getMatchPoints(match, 'win');
        const tiePoints = getMatchPoints(match, 'tie');

        scores[0].stats.points += winPoints; // 1st place
        scores[0].stats.matchesWon++;
        scores[0].stats.recentResults.unshift('W');

        if (scores[0].total === scores[1].total) {
          // Tie for 1st - both get tie points
          scores[1].stats.points += tiePoints;
          scores[1].stats.matchesHalved++;
          scores[1].stats.recentResults.unshift('H');
        } else {
          scores[1].stats.points += tiePoints; // 2nd place
          scores[1].stats.matchesHalved++;
          scores[1].stats.recentResults.unshift('H');
        }

        if (scores[1].total === scores[2].total) {
          // Tie for 2nd/3rd
          scores[2].stats.points += tiePoints;
          scores[2].stats.matchesHalved++;
          scores[2].stats.recentResults.unshift('H');
        } else {
          scores[2].stats.matchesLost++; // 3rd place
          scores[2].stats.recentResults.unshift('L');
        }
      } else {
        // 2-team match play
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

        // Update points and wins/losses using proper tournament point system
        if (result.winner === 'teamA') {
          const winPoints = getMatchPoints(match, 'win');
          teamAStats.points += winPoints;
          teamAStats.matchesWon++;
          teamBStats.matchesLost++;
          teamAStats.recentResults.unshift('W');
          teamBStats.recentResults.unshift('L');
        } else if (result.winner === 'teamB') {
          const winPoints = getMatchPoints(match, 'win');
          teamBStats.points += winPoints;
          teamBStats.matchesWon++;
          teamAStats.matchesLost++;
          teamAStats.recentResults.unshift('L');
          teamBStats.recentResults.unshift('W');
        } else {
          // Halved/Tied
          const tiePoints = getMatchPoints(match, 'tie');
          teamAStats.points += tiePoints;
          teamBStats.points += tiePoints;
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
      }

    } else if (match.status === 'in-progress') {
      // Live match - show current status AND award partial points for holes won
      teamAStats.matchesInProgress++;
      teamBStats.matchesInProgress++;
      teamAStats.recentResults.unshift('IP');
      teamBStats.recentResults.unshift('IP');
      
      if (match.isThreeWay && teamCStats) {
        teamCStats.matchesInProgress++;
        teamCStats.recentResults.unshift('IP');
      }

      // Calculate current match status
      const completedHoles = match.isThreeWay 
        ? match.holes.filter(h => h.teamAScore !== null && h.teamBScore !== null && h.teamCScore !== null)
        : match.holes.filter(h => h.teamAScore !== null && h.teamBScore !== null);

      if (completedHoles.length > 0) {
        if (match.isThreeWay && teamCStats) {
          // 3-team stroke play live scoring
          const holesData = completedHoles.map(hole => ({
            holeNumber: hole.number,
            par: hole.par || 4,
            teamAStrokes: hole.teamAScore,
            teamBStrokes: hole.teamBScore,
            teamCStrokes: hole.teamCScore ?? null
          }));

          const liveResult = calculateThreeWayResult(holesData, 18);
          const teamAName = teams.find(t => t.id === match.teamAId)?.name || 'TeamA';
          const teamBName = teams.find(t => t.id === match.teamBId)?.name || 'TeamB';
          const teamCName = teams.find(t => t.id === match.teamCId)?.name || 'TeamC';

          // Live status not needed for display

          // Award live points based on current position
          const scores = [
            { team: 'teamA', total: liveResult.teamATotal, stats: teamAStats },
            { team: 'teamB', total: liveResult.teamBTotal, stats: teamBStats },
            { team: 'teamC', total: liveResult.teamCTotal, stats: teamCStats }
          ].sort((a, b) => a.total - b.total);

          // DYNAMIC 3-TEAM LIVE SCORING: Current leader gets full points immediately
          const fullSessionPoints = getMatchPoints(match, 'win');
          const halfSessionPoints = getMatchPoints(match, 'tie');

          // Reset match counts for live scoring
          scores.forEach(s => {
            s.stats.matchesWon = 0;
            s.stats.matchesLost = 0;
            s.stats.matchesHalved = 0;
          });

          // Award live points: current leader gets full, others get partial/none
          scores[0].stats.points += fullSessionPoints; // 1st place (lowest score)
          scores[0].stats.matchesWon++;

          if (scores[0].total === scores[1].total) {
            // Tied for first place
            scores[1].stats.points += halfSessionPoints;
            scores[1].stats.matchesHalved++;
          } else {
            // Second place gets half points
            scores[1].stats.points += halfSessionPoints;
            scores[1].stats.matchesHalved++;
          }

          if (scores[1].total === scores[2].total) {
            // Tied for second place
            scores[2].stats.points += halfSessionPoints;
            scores[2].stats.matchesHalved++;
          } else {
            // Third place gets nothing
            scores[2].stats.matchesLost++;
          }
        } else {
          // 2-team match play live scoring
          const holesData = completedHoles.map(hole => ({
            holeNumber: hole.number,
            par: hole.par || 4,
            teamAStrokes: hole.teamAScore ?? 0,
            teamBStrokes: hole.teamBScore ?? 0
          }));

          const liveResult = calculateMatchPlayResult(holesData, 18);
          const teamAName = teams.find(t => t.id === match.teamAId)?.name || 'TeamA';
          const teamBName = teams.find(t => t.id === match.teamBId)?.name || 'TeamB';

          // Create live status strings with hole progress
          const holesPlayed = completedHoles.length;
          // Live match status not needed for display

          // Count holes won/lost so far
          teamAStats.holesWon += liveResult.teamAHolesWon;
          teamAStats.holesLost += liveResult.teamBHolesWon;
          teamBStats.holesWon += liveResult.teamBHolesWon;
          teamBStats.holesLost += liveResult.teamAHolesWon;

          // DYNAMIC LIVE SCORING: Team that is UP gets full session points immediately
          // This gives real-time visibility to the audience
          const holeAdvantage = liveResult.teamAHolesWon - liveResult.teamBHolesWon;
          const fullSessionPoints = getMatchPoints(match, 'win');
          const halfSessionPoints = getMatchPoints(match, 'tie');
          
          if (holeAdvantage > 0) {
            // Team A is UP (leading) = Gets FULL session points immediately
            teamAStats.points += fullSessionPoints;
            // Team B is DOWN (trailing) = Gets 0 points
            // Count this as Team A winning this match (live)
            teamAStats.matchesWon++;
            teamBStats.matchesLost++;
          } else if (holeAdvantage < 0) {
            // Team B is UP (leading) = Gets FULL session points immediately  
            teamBStats.points += fullSessionPoints;
            // Team A is DOWN (trailing) = Gets 0 points
            // Count this as Team B winning this match (live)
            teamBStats.matchesWon++;
            teamAStats.matchesLost++;
          } else {
            // ALL SQUARE (tied) = Both teams get HALF session points
            teamAStats.points += halfSessionPoints;
            teamBStats.points += halfSessionPoints;
            // Count this as a tie for both teams
            teamAStats.matchesHalved++;
            teamBStats.matchesHalved++;
          }
        }
      }
    }

    // Keep only last 5 results
    teamAStats.recentResults = teamAStats.recentResults.slice(0, 5);
    teamBStats.recentResults = teamBStats.recentResults.slice(0, 5);
    if (match.isThreeWay && teamCStats) {
      teamCStats.recentResults = teamCStats.recentResults.slice(0, 5);
    }
  });

  // Calculate sessions played for each team (not individual matches)
  const calculateSessionsPlayed = (teamId: number): number => {
    const teamMatches = divisionMatches.filter(m => 
      (m.teamAId === teamId || m.teamBId === teamId || m.teamCId === teamId) && 
      !m.isBye
    );
    
    // Group matches by session (date + session + type)
    const sessions = new Set<string>();
    teamMatches.forEach(match => {
      if (match.status === 'completed' || match.status === 'in-progress') {
        const sessionKey = `${match.date}-${match.session}-${match.type}`;
        sessions.add(sessionKey);
      }
    });
    
    return sessions.size;
  };

  // Convert to standings entries and sort
  const standings: LiveStandingEntry[] = divisionTeams.map(team => {
    const stats = teamStats[team.id];
    
    return {
      teamId: team.id,
      team,
      division: team.division,
      points: Math.round(stats.points * 10) / 10, // Clean decimal display
      matchesPlayed: calculateSessionsPlayed(team.id), // Count sessions, not individual matches
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
      trend: stats.recentResults.length > 0 ? stats.recentResults.join('-') : '-'
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
