import { Match, Team } from '@/types';
import { calculateMatchPlayResult, calculateThreeWayResult } from './matchPlayScoring';

export interface LiveStandingEntry {
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
  liveMatchStatus: string[];
  recentResults: ('W' | 'L' | 'H' | 'IP')[];
  winRate: number;
  position: number;
  positionChange: 'up' | 'down' | 'same';
  trend: string;
}

/**
 * Calculate session-based points for teams
 * Each team gets points once per session based on their overall performance in that session
 */
export function calculateSessionBasedStandings(matches: Match[], teams: Team[], division: string) {
  const teamStats: Record<number, {
    points: number;
    matchesWon: number;
    matchesLost: number;
    matchesHalved: number;
    holesWon: number;
    holesLost: number;
    recentResults: ('W' | 'L' | 'H' | 'IP')[];
  }> = {};

  // Initialize stats for teams in this division
  const divisionTeams = teams.filter(t => t.division === division);
  divisionTeams.forEach(team => {
    teamStats[team.id] = {
      points: 0,
      matchesWon: 0,
      matchesLost: 0,
      matchesHalved: 0,
      holesWon: 0,
      holesLost: 0,
      recentResults: []
    };
  });

  // Group matches by session
  const sessions = new Map<string, Match[]>();
  const divisionMatches = matches.filter(m => m.division === division);
  
  divisionMatches.forEach(match => {
    const sessionKey = `${match.date}-${match.session}-${match.type}`;
    if (!sessions.has(sessionKey)) {
      sessions.set(sessionKey, []);
    }
    sessions.get(sessionKey)!.push(match);
  });

  // Process each session
  sessions.forEach((sessionMatches, sessionKey) => {
    console.log(`🎯 Processing session: ${sessionKey}`);
    
    // Calculate session points based on match type and division
    const sampleMatch = sessionMatches[0];
    const sessionPoints = getSessionPoints(sampleMatch);
    
    // Group session results by team
    const teamSessionResults: Record<number, {
      wins: number;
      losses: number;
      halves: number;
      holesWon: number;
      holesLost: number;
    }> = {};

    // Initialize team session results
    divisionTeams.forEach(team => {
      teamSessionResults[team.id] = {
        wins: 0,
        losses: 0,
        halves: 0,
        holesWon: 0,
        holesLost: 0
      };
    });

    // Analyze each match in the session
    sessionMatches.forEach(match => {
      if (match.status === 'completed') {
        // Process completed matches
        processCompletedMatch(match, teamSessionResults, teams);
      } else if (match.status === 'in-progress') {
        // Process in-progress matches (live scoring)
        processInProgressMatch(match, teamSessionResults, teams);
      }
    });

    // Award session points based on overall performance
    divisionTeams.forEach(team => {
      const teamId = team.id;
      const results = teamSessionResults[teamId];
      
      if (results.wins > results.losses) {
        // Team won more matches than they lost in this session
        teamStats[teamId].points += sessionPoints.win;
        teamStats[teamId].matchesWon++;
        teamStats[teamId].recentResults.unshift('W');
      } else if (results.losses > results.wins) {
        // Team lost more matches than they won in this session
        teamStats[teamId].matchesLost++;
        teamStats[teamId].recentResults.unshift('L');
      } else {
        // Team tied overall in this session
        teamStats[teamId].points += sessionPoints.tie;
        teamStats[teamId].matchesHalved++;
        teamStats[teamId].recentResults.unshift('H');
      }

      // Add hole statistics
      teamStats[teamId].holesWon += results.holesWon;
      teamStats[teamId].holesLost += results.holesLost;
    });
  });

  // Convert to standings format
  return divisionTeams.map((team, index) => {
    const stats = teamStats[team.id];
    const matchesPlayed = stats.matchesWon + stats.matchesLost + stats.matchesHalved;
    const winRate = matchesPlayed > 0 ? Math.round((stats.matchesWon / matchesPlayed) * 100) : 0;
    
    return {
      team,
      division,
      points: stats.points,
      matchesPlayed,
      matchesInProgress: 0, // Will be calculated separately if needed
      matchesWon: stats.matchesWon,
      matchesLost: stats.matchesLost,
      matchesHalved: stats.matchesHalved,
      holesWon: stats.holesWon,
      holesLost: stats.holesLost,
      liveMatchStatus: [], // Not needed in session-based scoring
      recentResults: stats.recentResults.slice(0, 5),
      winRate,
      position: index + 1, // Will be updated after sorting
      positionChange: 'same' as const,
      trend: stats.recentResults.slice(0, 5).join('-')
    };
  }).sort((a, b) => {
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
  teamSessionResults: Record<number, any>, 
  teams: Team[]
) {
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
    
    // Award wins/losses based on final position
    if (result.status === 'completed') {
      const scores = [
        { teamId: match.teamAId, total: result.teamATotal },
        { teamId: match.teamBId, total: result.teamBTotal },
        { teamId: match.teamCId!, total: result.teamCTotal }
      ].sort((a, b) => a.total - b.total);

      // Winner gets a win, others get losses (or halves if tied)
      teamSessionResults[scores[0].teamId].wins++;
      
      if (scores[0].total === scores[1].total) {
        teamSessionResults[scores[1].teamId].halves++;
      } else {
        teamSessionResults[scores[1].teamId].losses++;
      }
      
      if (scores[1].total === scores[2].total) {
        teamSessionResults[scores[2].teamId].halves++;
      } else {
        teamSessionResults[scores[2].teamId].losses++;
      }
    }
  } else {
    // 2-team match play
    const holesData = match.holes.map(hole => ({
      holeNumber: hole.number,
      par: hole.par || 4,
      teamAScore: hole.teamAScore,
      teamBScore: hole.teamBScore
    }));

    const result = calculateMatchPlayResult(holesData, 18);
    
    if (result.winner === 'teamA') {
      teamSessionResults[match.teamAId].wins++;
      teamSessionResults[match.teamBId].losses++;
    } else if (result.winner === 'teamB') {
      teamSessionResults[match.teamBId].wins++;
      teamSessionResults[match.teamAId].losses++;
    } else {
      teamSessionResults[match.teamAId].halves++;
      teamSessionResults[match.teamBId].halves++;
    }

    // Add hole statistics
    teamSessionResults[match.teamAId].holesWon += result.teamAHolesWon;
    teamSessionResults[match.teamAId].holesLost += result.teamBHolesWon;
    teamSessionResults[match.teamBId].holesWon += result.teamBHolesWon;
    teamSessionResults[match.teamBId].holesLost += result.teamAHolesWon;
  }
}

function processInProgressMatch(
  match: Match, 
  teamSessionResults: Record<number, any>, 
  teams: Team[]
) {
  const completedHoles = match.holes.filter(h => 
    h.teamAScore !== null && h.teamBScore !== null &&
    (match.isThreeWay ? h.teamCScore !== null : true)
  );

  if (completedHoles.length === 0) return;

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
    
    // Award temporary wins/losses based on current position
    const scores = [
      { teamId: match.teamAId, total: result.teamATotal },
      { teamId: match.teamBId, total: result.teamBTotal },
      { teamId: match.teamCId!, total: result.teamCTotal }
    ].sort((a, b) => a.total - b.total);

    // Current leader gets a win, others get losses
    teamSessionResults[scores[0].teamId].wins++;
    teamSessionResults[scores[1].teamId].losses++;
    teamSessionResults[scores[2].teamId].losses++;
  } else {
    // 2-team match play (in-progress)
    const holesData = completedHoles.map(hole => ({
      holeNumber: hole.number,
      par: hole.par || 4,
      teamAScore: hole.teamAScore,
      teamBScore: hole.teamBScore
    }));

    const result = calculateMatchPlayResult(holesData, 18);
    
    // Award temporary wins/losses based on current status
    const holeAdvantage = result.teamAHolesWon - result.teamBHolesWon;
    
    if (holeAdvantage > 0) {
      teamSessionResults[match.teamAId].wins++;
      teamSessionResults[match.teamBId].losses++;
    } else if (holeAdvantage < 0) {
      teamSessionResults[match.teamBId].wins++;
      teamSessionResults[match.teamAId].losses++;
    } else {
      teamSessionResults[match.teamAId].halves++;
      teamSessionResults[match.teamBId].halves++;
    }

    // Add hole statistics
    teamSessionResults[match.teamAId].holesWon += result.teamAHolesWon;
    teamSessionResults[match.teamAId].holesLost += result.teamBHolesWon;
    teamSessionResults[match.teamBId].holesWon += result.teamBHolesWon;
    teamSessionResults[match.teamBId].holesLost += result.teamAHolesWon;
  }
}

function getSessionPoints(match: Match): { win: number; tie: number } {
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
