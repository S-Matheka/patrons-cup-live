/**
 * Golf Match Play Scoring Utilities
 * 
 * Match play scoring is based on holes won/lost, not total strokes.
 * A match ends when one team is up by more holes than remain.
 */

export interface MatchPlayResult {
  status: 'in-progress' | 'completed';
  result: string; // e.g., "2up", "3/2", "AS", "1up"
  winner: 'teamA' | 'teamB' | 'halved' | null;
  holesRemaining: number;
  teamAHolesWon: number;
  teamBHolesWon: number;
  holesHalved: number;
}

export interface ThreeWayResult {
  status: 'in-progress' | 'completed';
  result: string; // e.g., "Team A leads by 2", "All teams tied"
  leader: 'teamA' | 'teamB' | 'teamC' | 'tied' | null;
  teamATotal: number;
  teamBTotal: number;
  teamCTotal: number;
  holesCompleted: number;
}

/**
 * Calculate match play result based on hole-by-hole scores
 */
export function calculateMatchPlayResult(
  holes: Array<{
    holeNumber: number;
    par: number;
    teamAStrokes: number;
    teamBStrokes: number;
  }>,
  totalHoles: number = 18
): MatchPlayResult {
  let teamAHolesWon = 0;
  let teamBHolesWon = 0;
  let holesHalved = 0;
  let holesPlayed = 0;

  // Count holes won by each team
  for (const hole of holes) {
    // Only count holes where both teams have valid scores (not null/undefined/0)
    if (hole.teamAStrokes && hole.teamBStrokes && hole.teamAStrokes > 0 && hole.teamBStrokes > 0) {
      holesPlayed++;
      
      if (hole.teamAStrokes < hole.teamBStrokes) {
        teamAHolesWon++;
      } else if (hole.teamBStrokes < hole.teamAStrokes) {
        teamBHolesWon++;
      } else {
        holesHalved++;
      }
    }
  }

  const holesRemaining = totalHoles - holesPlayed;
  const leadingTeam = teamAHolesWon > teamBHolesWon ? 'teamA' : 
                     teamBHolesWon > teamAHolesWon ? 'teamB' : null;
  const holesDifference = Math.abs(teamAHolesWon - teamBHolesWon);

  // Determine if match is completed
  // Match ends when: 1) All 18 holes played, OR 2) Team is up by more holes than remain
  const isMatchComplete = holesPlayed === totalHoles || holesDifference > holesRemaining;

  let result: string;
  let winner: 'teamA' | 'teamB' | 'halved' | null = null;
  let status: 'in-progress' | 'completed' = isMatchComplete ? 'completed' : 'in-progress';

  if (isMatchComplete) {
    if (teamAHolesWon === teamBHolesWon) {
      // Match is tied after all holes - only possible if played to hole 18
      result = 'AS';
      winner = 'halved';
    } else if (holesPlayed === totalHoles) {
      // Match went to the final hole (hole 18)
      result = `${holesDifference}up`;
      winner = leadingTeam!;
    } else {
      // Match ended early - team is up by more holes than remain
      // Format: holes_up/holes_remaining (e.g., 3/2, 4/3, etc.)
      result = `${holesDifference}/${holesRemaining}`;
      winner = leadingTeam!;
    }
  } else {
    // Match still in progress
    if (holesDifference === 0) {
      result = 'AS';
    } else {
      result = `${holesDifference}up`;
    }
    winner = null;
  }

  return {
    status,
    result,
    winner,
    holesRemaining,
    teamAHolesWon,
    teamBHolesWon,
    holesHalved
  };
}

/**
 * Get match status description for display
 */
export function getMatchStatusDescription(result: MatchPlayResult): string {
  if (result.status === 'in-progress') {
    if (result.result === 'AS') {
      return 'All Square';
    } else {
      const leadingTeam = result.teamAHolesWon > result.teamBHolesWon ? 'Team A' : 'Team B';
      return `${leadingTeam} ${result.result}`;
    }
  } else {
    // Match completed
    if (result.winner === 'halved') {
      return 'Match Halved (AS)';
    } else {
      const winningTeam = result.winner === 'teamA' ? 'Team A' : 'Team B';
      return `${winningTeam} wins ${result.result}`;
    }
  }
}

/**
 * Calculate points awarded based on match result
 */
export function calculateMatchPoints(result: MatchPlayResult): { teamAPoints: number; teamBPoints: number } {
  if (result.status !== 'completed') {
    return { teamAPoints: 0, teamBPoints: 0 };
  }

  switch (result.winner) {
    case 'teamA':
      return { teamAPoints: 1, teamBPoints: 0 };
    case 'teamB':
      return { teamAPoints: 0, teamBPoints: 1 };
    case 'halved':
      return { teamAPoints: 0.5, teamBPoints: 0.5 };
    default:
      return { teamAPoints: 0, teamBPoints: 0 };
  }
}

/**
 * Determine if a match is one hole away from ending early
 * (leading by the same number of holes as remain - next hole wins the match)
 */
export function isOneHoleFromWinning(result: MatchPlayResult): boolean {
  if (result.status === 'completed') return false;
  
  const holesDifference = Math.abs(result.teamAHolesWon - result.teamBHolesWon);
  return holesDifference === result.holesRemaining;
}

/**
 * Format match play score for display (e.g., "3/2", "1up", "AS")
 */
export function formatMatchPlayScore(result: MatchPlayResult): string {
  return result.result;
}

/**
 * Examples of match play scoring:
 * 
 * Match ending on hole 18:
 * - AS: Match tied after 18 holes (0.5 points each)
 * - 1up: Leading by 1 after 18 holes (1 point to winner)
 * - 2up: Leading by 2 after 18 holes (1 point to winner)
 * 
 * Match ending on hole 17:
 * - 2/1: Leading by 2 with 1 hole remaining (1 point to winner)
 * - 3/1: Leading by 3 with 1 hole remaining (1 point to winner)
 * 
 * Match ending on hole 16:
 * - 3/2: Leading by 3 with 2 holes remaining (1 point to winner)
 * - 4/2: Leading by 4 with 2 holes remaining (1 point to winner)
 * 
 * And so on...
 */

/**
 * Calculate 3-team stroke play result (for Foursomes)
 */
export function calculateThreeWayResult(
  holes: Array<{
    holeNumber: number;
    par: number;
    teamAScore: number | null;
    teamBScore: number | null;
    teamCScore: number | null;
  }>,
  totalHoles: number = 18
): ThreeWayResult {
  let teamATotal = 0;
  let teamBTotal = 0;
  let teamCTotal = 0;
  let holesCompleted = 0;

  // Calculate total scores for completed holes
  holes.forEach(hole => {
    if (hole.teamAScore !== null && hole.teamBScore !== null && hole.teamCScore !== null) {
      teamATotal += hole.teamAScore;
      teamBTotal += hole.teamBScore;
      teamCTotal += hole.teamCScore;
      holesCompleted++;
    }
  });

  // For 3-way stroke play, match is completed when all holes are played
  // or when there's a clear winner with enough holes played to be statistically significant
  const status: 'in-progress' | 'completed' = holesCompleted === totalHoles ? 'completed' : 'in-progress';
  
  // Determine leader
  let leader: 'teamA' | 'teamB' | 'teamC' | 'tied' | null = null;
  let result = '';

  if (holesCompleted === 0) {
    result = 'Not Started';
    leader = null;
  } else {
    // Find the lowest score (leader in stroke play)
    const scores = [
      { team: 'teamA', total: teamATotal },
      { team: 'teamB', total: teamBTotal },
      { team: 'teamC', total: teamCTotal }
    ];
    
    scores.sort((a, b) => a.total - b.total);
    
    const lowestScore = scores[0].total;
    const leadersCount = scores.filter(s => s.total === lowestScore).length;
    
    if (leadersCount === 3) {
      leader = 'tied';
      result = 'All Teams Tied';
    } else if (leadersCount === 2) {
      const tiedTeams = scores.filter(s => s.total === lowestScore).map(s => s.team);
      result = `${tiedTeams.join(' & ')} Tied for Lead`;
      leader = 'tied';
    } else {
      leader = scores[0].team as 'teamA' | 'teamB' | 'teamC';
      const leadMargin = scores[1].total - scores[0].total;
      // Ensure leadMargin is a valid number
      const validLeadMargin = isNaN(leadMargin) ? 0 : leadMargin;
      
      // Different wording based on match status
      if (status === 'completed') {
        result = `${scores[0].team.toUpperCase()} wins by ${validLeadMargin}`;
      } else {
        result = `${scores[0].team.toUpperCase()} leads by ${validLeadMargin}`;
      }
    }
  }

  return {
    status,
    result,
    leader,
    teamATotal: teamATotal || 0,
    teamBTotal: teamBTotal || 0,
    teamCTotal: teamCTotal || 0,
    holesCompleted
  };
}
