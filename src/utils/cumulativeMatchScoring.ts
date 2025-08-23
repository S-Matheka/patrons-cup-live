import { Match, Team } from '@/types';
import { calculateMatchPlayResult, calculateThreeWayResult } from './matchPlayScoring';

export interface CumulativeStandingEntry {
  team: Team;
  division: string;
  points: number;
  matchesPlayed: number;
  matchesInProgress: number;
  matchesWon: number;
  matchesLost: number;
  matchesHalved: number;
  holesWon: number;
  holesLost: number;
  recentResults: ('W' | 'L' | 'H' | 'IP')[];
  winRate: number;
  position: number;
  positionChange: 'up' | 'down' | 'same';
  trend: string;
}

/**
 * Calculate cumulative standings based on individual match points
 * Awards points for each individual match based on tournament rules
 */
export function calculateCumulativeStandings(matches: Match[], teams: Team[], division: string): CumulativeStandingEntry[] {
  // Handle cases where data might not be available
  if (!matches || !Array.isArray(matches) || !teams || !Array.isArray(teams)) {
    return [];
  }

  const teamStats: Record<number, {
    points: number;
    matchesWon: number;
    matchesLost: number;
    matchesHalved: number;
    matchesInProgress: number;
    holesWon: number;
    holesLost: number;
    recentResults: ('W' | 'L' | 'H' | 'IP')[];
  }> = {};

  // Initialize stats for teams in this division
  const divisionTeams = teams.filter(t => t && t.division === division);
  divisionTeams.forEach(team => {
    teamStats[team.id] = {
      points: 0,
      matchesWon: 0,
      matchesLost: 0,
      matchesHalved: 0,
      matchesInProgress: 0,
      holesWon: 0,
      holesLost: 0,
      recentResults: []
    };
  });

  // Process each individual match
  const divisionMatches = matches.filter(m => m && m.division === division);
  
  divisionMatches.forEach(match => {
    if (match.status === 'completed') {
      processCompletedMatch(match, teamStats);
    } else if (match.status === 'in-progress') {
      processInProgressMatch(match, teamStats);
    }
  });

  // Convert to standings format and sort by points
  return divisionTeams.map((team) => {
    const stats = teamStats[team.id];
    const matchesPlayed = stats.matchesWon + stats.matchesLost + stats.matchesHalved;
    const winRate = matchesPlayed > 0 ? Math.round((stats.matchesWon / matchesPlayed) * 100) : 0;
    
    return {
      team,
      division,
      points: Math.round(stats.points * 10) / 10, // Round to 1 decimal place
      matchesPlayed,
      matchesInProgress: stats.matchesInProgress,
      matchesWon: stats.matchesWon,
      matchesLost: stats.matchesLost,
      matchesHalved: stats.matchesHalved,
      holesWon: stats.holesWon,
      holesLost: stats.holesLost,
      recentResults: stats.recentResults.slice(0, 5),
      winRate,
      position: 0, // Will be set after sorting
      positionChange: 'same',
      trend: generateTrendString(stats.recentResults.slice(0, 5))
    };
  }).sort((a, b) => {
    // Sort by points (descending), then by wins, then by hole differential
    if (b.points !== a.points) return b.points - a.points;
    if (b.matchesWon !== a.matchesWon) return b.matchesWon - a.matchesWon;
    return (b.holesWon - b.holesLost) - (a.holesWon - a.holesLost);
  }).map((entry, index) => ({
    ...entry,
    position: index + 1
  }));
}

function processCompletedMatch(
  match: Match, 
  teamStats: Record<number, any>
) {
  // Ensure holes array exists
  if (!match.holes || !Array.isArray(match.holes)) {
    return;
  }

  const matchPoints = getMatchPoints(match);

  if (match.isThreeWay && match.teamCId) {
    // 3-team stroke play
    const holesData = match.holes.map(hole => ({
      holeNumber: hole.number,
      par: hole.par || 4,
      teamAStrokes: hole.teamAScore,
      teamBStrokes: hole.teamBScore,
      teamCStrokes: hole.teamCScore
    }));

    const result = calculateThreeWayResult(holesData, 18);
    
    if (result.status === 'completed') {
      const scores = [
        { teamId: match.teamAId, total: result.teamATotal },
        { teamId: match.teamBId, total: result.teamBTotal },
        { teamId: match.teamCId!, total: result.teamCTotal }
      ].sort((a, b) => a.total - b.total);

      // Winner (lowest score)
      teamStats[scores[0].teamId].points += matchPoints.win;
      teamStats[scores[0].teamId].matchesWon++;
      teamStats[scores[0].teamId].recentResults.unshift('W');
      
      if (scores[0].total === scores[1].total) {
        // Tied for first
        teamStats[scores[1].teamId].points += matchPoints.tie;
        teamStats[scores[1].teamId].matchesHalved++;
        teamStats[scores[1].teamId].recentResults.unshift('H');
      } else {
        // Second place gets tie points
        teamStats[scores[1].teamId].points += matchPoints.tie;
        teamStats[scores[1].teamId].matchesHalved++;
        teamStats[scores[1].teamId].recentResults.unshift('H');
      }
      
      if (scores[1].total === scores[2].total) {
        // Tied for second
        teamStats[scores[2].teamId].points += matchPoints.tie;
        teamStats[scores[2].teamId].matchesHalved++;
        teamStats[scores[2].teamId].recentResults.unshift('H');
      } else {
        // Third place (loss)
        teamStats[scores[2].teamId].matchesLost++;
        teamStats[scores[2].teamId].recentResults.unshift('L');
      }
    }
  } else {
    // 2-team match play
    const holesData = match.holes.map(hole => ({
      holeNumber: hole.number,
      par: hole.par || 4,
      teamAStrokes: hole.teamAScore,
      teamBStrokes: hole.teamBScore
    }));

    const result = calculateMatchPlayResult(holesData, 18);

    if (result.status === 'completed') {
      if (result.teamAHolesWon > result.teamBHolesWon) {
        // Team A wins
        teamStats[match.teamAId].points += matchPoints.win;
        teamStats[match.teamAId].matchesWon++;
        teamStats[match.teamAId].recentResults.unshift('W');
        teamStats[match.teamBId].matchesLost++;
        teamStats[match.teamBId].recentResults.unshift('L');
      } else if (result.teamBHolesWon > result.teamAHolesWon) {
        // Team B wins
        teamStats[match.teamBId].points += matchPoints.win;
        teamStats[match.teamBId].matchesWon++;
        teamStats[match.teamBId].recentResults.unshift('W');
        teamStats[match.teamAId].matchesLost++;
        teamStats[match.teamAId].recentResults.unshift('L');
      } else {
        // Tie/Halved
        teamStats[match.teamAId].points += matchPoints.tie;
        teamStats[match.teamBId].points += matchPoints.tie;
        teamStats[match.teamAId].matchesHalved++;
        teamStats[match.teamBId].matchesHalved++;
        teamStats[match.teamAId].recentResults.unshift('H');
        teamStats[match.teamBId].recentResults.unshift('H');
      }

      // Add hole statistics
      teamStats[match.teamAId].holesWon += result.teamAHolesWon;
      teamStats[match.teamAId].holesLost += result.teamBHolesWon;
      teamStats[match.teamBId].holesWon += result.teamBHolesWon;
      teamStats[match.teamBId].holesLost += result.teamAHolesWon;
    }
  }
}

function processInProgressMatch(
  match: Match, 
  teamStats: Record<number, any>
) {
  // Ensure holes array exists
  if (!match.holes || !Array.isArray(match.holes)) {
    return;
  }

  const completedHoles = match.holes.filter(h => 
    h.teamAScore !== null && h.teamBScore !== null &&
    (match.isThreeWay ? h.teamCScore !== null : true)
  );

  if (completedHoles.length === 0) return;

  // Count as in-progress for all teams in the match
  teamStats[match.teamAId].matchesInProgress++;
  teamStats[match.teamBId].matchesInProgress++;
  if (match.teamCId) teamStats[match.teamCId].matchesInProgress++;

  const matchPoints = getMatchPoints(match);

  if (match.isThreeWay && match.teamCId) {
    // 3-team stroke play (in-progress)
    const holesData = completedHoles.map(hole => ({
      holeNumber: hole.number,
      par: hole.par || 4,
      teamAStrokes: hole.teamAScore,
      teamBStrokes: hole.teamBScore,
      teamCStrokes: hole.teamCScore
    }));

    const result = calculateThreeWayResult(holesData, 18);
    
    // Award live points based on current position
    const scores = [
      { teamId: match.teamAId, total: result.teamATotal },
      { teamId: match.teamBId, total: result.teamBTotal },
      { teamId: match.teamCId!, total: result.teamCTotal }
    ].sort((a, b) => a.total - b.total);

    // Award live points (leader gets win points, others get partial)
    teamStats[scores[0].teamId].points += matchPoints.win;
    
    if (scores[0].total === scores[1].total) {
      teamStats[scores[1].teamId].points += matchPoints.tie;
    } else {
      teamStats[scores[1].teamId].points += matchPoints.tie;
    }
    
    if (scores[1].total === scores[2].total) {
      teamStats[scores[2].teamId].points += matchPoints.tie;
    }
    // Third place gets 0 points if not tied

    // Add recent results as in-progress
    teamStats[match.teamAId].recentResults.unshift('IP');
    teamStats[match.teamBId].recentResults.unshift('IP');
    teamStats[match.teamCId!].recentResults.unshift('IP');

  } else {
    // 2-team match play (in-progress)
    const holesData = completedHoles.map(hole => ({
      holeNumber: hole.number,
      par: hole.par || 4,
      teamAStrokes: hole.teamAScore,
      teamBStrokes: hole.teamBScore
    }));

    const result = calculateMatchPlayResult(holesData, completedHoles.length);

    // Award live points based on current status
    if (result.teamAHolesWon > result.teamBHolesWon) {
      // Team A currently leading
      teamStats[match.teamAId].points += matchPoints.win;
    } else if (result.teamBHolesWon > result.teamAHolesWon) {
      // Team B currently leading
      teamStats[match.teamBId].points += matchPoints.win;
    } else {
      // Currently tied
      teamStats[match.teamAId].points += matchPoints.tie;
      teamStats[match.teamBId].points += matchPoints.tie;
    }

    // Add hole statistics for completed holes
    teamStats[match.teamAId].holesWon += result.teamAHolesWon;
    teamStats[match.teamAId].holesLost += result.teamBHolesWon;
    teamStats[match.teamBId].holesWon += result.teamBHolesWon;
    teamStats[match.teamBId].holesLost += result.teamAHolesWon;

    // Add recent results as in-progress
    teamStats[match.teamAId].recentResults.unshift('IP');
    teamStats[match.teamBId].recentResults.unshift('IP');
  }
}

function getMatchPoints(match: Match): { win: number; tie: number } {
  const { type, session, division } = match;
  
  // Determine day from date - handle both 'date' and 'match_date' properties
  const dateValue = match.date || (match as any).match_date;
  if (!dateValue) {
    return { win: 1, tie: 0.5 }; // fallback
  }
  
  const matchDate = new Date(dateValue);
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
      return { win: 5, tie: 2.5 };
    } else if (session === 'PM' && type === 'Foursomes') {
      return isBowlMug ? { win: 4, tie: 2 } : { win: 3, tie: 1.5 };
    }
  } else if (day === 'Saturday') {
    if (session === 'AM' && type === '4BBB') {
      return { win: 5, tie: 2.5 };
    } else if (session === 'PM' && type === 'Foursomes') {
      return isBowlMug ? { win: 4, tie: 2 } : { win: 3, tie: 1.5 };
    }
  } else if (day === 'Sunday' && type === 'Singles') {
    return { win: 3, tie: 1.5 };
  }
  
  return { win: 1, tie: 0.5 };
}

function generateTrendString(results: ('W' | 'L' | 'H' | 'IP')[]): string {
      if (!results || !Array.isArray(results)) return '';
    return results.map(result => {
      switch (result) {
        case 'W': return 'W';
        case 'L': return 'L';
        case 'H': return 'H';
        case 'IP': return 'P'; // P for in-Progress
        default: return '-';
      }
    }).join('');
}
