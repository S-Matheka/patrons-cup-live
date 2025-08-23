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
 * Calculate 3-team match play result (for Foursomes)
 * This treats 3-way Foursomes as 3 separate head-to-head matches
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
  // Calculate individual head-to-head matches
  let teamAvsB = { teamAWins: 0, teamBWins: 0, holesPlayed: 0 };
  let teamAvsC = { teamAWins: 0, teamCWins: 0, holesPlayed: 0 };
  let teamBvsC = { teamBWins: 0, teamCWins: 0, holesPlayed: 0 };

  holes.forEach(hole => {
    // Handle both camelCase and snake_case property names for compatibility
    const teamAScore = hole.teamAScore !== undefined ? hole.teamAScore : (hole.team_a_score !== undefined ? hole.team_a_score : null);
    const teamBScore = hole.teamBScore !== undefined ? hole.teamBScore : (hole.team_b_score !== undefined ? hole.team_b_score : null);
    const teamCScore = hole.teamCScore !== undefined ? hole.teamCScore : (hole.team_c_score !== undefined ? hole.team_c_score : null);
    
    // Team A vs Team B
    if (teamAScore && teamBScore && teamAScore > 0 && teamBScore > 0) {
      teamAvsB.holesPlayed++;
      if (teamAScore < teamBScore) {
        teamAvsB.teamAWins++;
      } else if (teamBScore < teamAScore) {
        teamAvsB.teamBWins++;
      }
    }

    // Team A vs Team C
    if (teamAScore && teamCScore && teamAScore > 0 && teamCScore > 0) {
      teamAvsC.holesPlayed++;
      if (teamAScore < teamCScore) {
        teamAvsC.teamAWins++;
      } else if (teamCScore < teamAScore) {
        teamAvsC.teamCWins++;
      }
    }

    // Team B vs Team C
    if (teamBScore && teamCScore && teamBScore > 0 && teamCScore > 0) {
      teamBvsC.holesPlayed++;
      if (teamBScore < teamCScore) {
        teamBvsC.teamBWins++;
      } else if (teamCScore < teamBScore) {
        teamBvsC.teamCWins++;
      }
    }
  });

  // Calculate individual match results
  const teamAWins = (teamAvsB.teamAWins > teamAvsB.teamBWins ? 1 : 0) + 
                   (teamAvsC.teamAWins > teamAvsC.teamCWins ? 1 : 0);
  const teamBWins = (teamAvsB.teamBWins > teamAvsB.teamAWins ? 1 : 0) + 
                   (teamBvsC.teamBWins > teamBvsC.teamCWins ? 1 : 0);
  const teamCWins = (teamAvsC.teamCWins > teamAvsC.teamAWins ? 1 : 0) + 
                   (teamBvsC.teamCWins > teamBvsC.teamBWins ? 1 : 0);

  // Determine match completion - match is complete when all individual matches are complete
  const maxHolesPlayed = Math.max(teamAvsB.holesPlayed, teamAvsC.holesPlayed, teamBvsC.holesPlayed);
  const isMatchComplete = maxHolesPlayed === totalHoles;
  
  const status: 'in-progress' | 'completed' = isMatchComplete ? 'completed' : 'in-progress';
  
  // Determine result string
  let leader: 'teamA' | 'teamB' | 'teamC' | 'tied' | null = null;
  let result = '';

  if (maxHolesPlayed === 0) {
    result = 'Not Started';
    leader = null;
  } else {
    // Find the team with the most wins
    const results = [
      { team: 'teamA', wins: teamAWins },
      { team: 'teamB', wins: teamBWins },
      { team: 'teamC', wins: teamCWins }
    ];
    
    results.sort((a, b) => b.wins - a.wins);
    
    if (results[0].wins === results[1].wins && results[1].wins === results[2].wins) {
      // All teams tied
      leader = 'tied';
      result = 'All Teams Tied';
    } else if (results[0].wins === results[1].wins) {
      // Two teams tied for first
      leader = 'tied';
      result = 'Teams Tied for Lead';
    } else {
      // Single winner
      leader = results[0].team as 'teamA' | 'teamB' | 'teamC';
      
      if (status === 'completed') {
        result = `${results[0].team.toUpperCase()} won ${results[0].wins}-${results[1].wins}`;
      } else {
        result = `${results[0].team.toUpperCase()} leads ${results[0].wins}-${results[1].wins}`;
      }
    }
  }

  return {
    status,
    result,
    leader,
    teamATotal: teamAWins,
    teamBTotal: teamBWins,
    teamCTotal: teamCWins,
    holesCompleted: maxHolesPlayed
  };
}
