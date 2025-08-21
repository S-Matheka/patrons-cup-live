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
    if (hole.teamAStrokes > 0 && hole.teamBStrokes > 0) {
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
      // Match ended early (dormie situation)
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
 * Determine if a match is in a "dormie" situation
 * (leading by the same number of holes as remain)
 */
export function isDormie(result: MatchPlayResult): boolean {
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
