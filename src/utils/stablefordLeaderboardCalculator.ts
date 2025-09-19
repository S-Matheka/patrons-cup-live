/**
 * Stableford Leaderboard Calculator
 * Processes individual player scoring data from matches and holes to create leaderboard
 */

import { Match, Player, Team } from '@/types';
import { 
  StablefordPlayer, 
  StablefordTeam, 
  StablefordRound, 
  StablefordHole,
  KAREN_COURSE_DATA,
  calculateNetScore,
  calculateStablefordPoints
} from './stablefordScoring';

export interface StablefordLeaderboardEntry {
  player: StablefordPlayer;
  position: number;
  totalPoints: number;
  totalGross: number;
  totalNet: number;
  roundsPlayed: number;
  roundScores: {
    round1: number;
    round2: number;
    round3: number;
  };
}

/**
 * Process matches and players to create Stableford leaderboard data
 */
export function calculateStablefordLeaderboard(
  matches: Match[],
  players: Player[],
  teams: Team[]
): StablefordLeaderboardEntry[] {
  // Filter data for Nancy Millar Trophy (tournament_id = 6)
  const nancyMillarMatches = matches.filter(match => 
    match.tournamentId === 6 || match.tournament_id === 6
  );
  
  const nancyMillarPlayers = players.filter(player => 
    player.tournamentId === 6 || player.tournament_id === 6
  );
  
  const nancyMillarTeams = teams.filter(team => 
    team.tournamentId === 6 || team.tournament_id === 6
  );


  // Group matches by round
  const matchesByRound = {
    round1: nancyMillarMatches.filter(match => 
      match.session === 'AM' && match.matchDate === '2025-09-20'
    ),
    round2: nancyMillarMatches.filter(match => 
      match.session === 'PM' && match.matchDate === '2025-09-20'
    ),
    round3: nancyMillarMatches.filter(match => 
      match.session === 'AM' && match.matchDate === '2025-09-21'
    )
  };

  // Create player scoring data
  const playerScores = new Map<number, StablefordPlayer>();

  // Initialize all Nancy Millar Trophy players
  nancyMillarPlayers.forEach(player => {
    const team = nancyMillarTeams.find(t => t.id === player.teamId);
    if (team) {
      playerScores.set(player.id, {
        id: player.id,
        name: player.name,
        teamId: player.teamId,
        teamName: team.name,
        handicap: player.handicap || 18,
        rounds: [],
        aggregatePoints: 0,
        aggregateGross: 0,
        aggregateNet: 0,
        position: 0
      });
    }
  });

  // Process each round
  Object.entries(matchesByRound).forEach(([roundKey, roundMatches]) => {
    const roundNumber = parseInt(roundKey.replace('round', ''));
    
    roundMatches.forEach(match => {
      if (!match.holes || match.holes.length === 0) return;

      // Get player data from match.players
      const matchPlayers = match.players;
      if (!matchPlayers) return;

      // Process each player in the match
      const playerIds = [
        matchPlayers.teamA?.[0]?.id,
        matchPlayers.teamB?.[0]?.id
      ].filter(Boolean);

      playerIds.forEach(playerId => {
        const player = playerScores.get(playerId);
        if (!player) return;

        // Get holes for this player
        const playerHoles: StablefordHole[] = match.holes.map(hole => {
          // Determine which player this hole belongs to
          let grossScore: number | null = null;
          let handicap = player.handicap;

          if (hole.player1Id === playerId) {
            grossScore = hole.player1Score;
            handicap = hole.player1Handicap || player.handicap;
          } else if (hole.player2Id === playerId) {
            grossScore = hole.player2Score;
            handicap = hole.player2Handicap || player.handicap;
          }

          if (grossScore === null) {
            return {
              holeNumber: hole.number,
              par: hole.par,
              strokeIndex: KAREN_COURSE_DATA[hole.number - 1]?.si || 1,
              grossScore: null,
              netScore: null,
              points: 0,
              handicap
            };
          }

          const strokeIndex = KAREN_COURSE_DATA[hole.number - 1]?.si || 1;
          const netScore = calculateNetScore(grossScore, handicap, strokeIndex);
          const points = calculateStablefordPoints(netScore, hole.par);

          return {
            holeNumber: hole.number,
            par: hole.par,
            strokeIndex,
            grossScore,
            netScore,
            points,
            handicap
          };
        });

        // Calculate round totals
        const totalPoints = playerHoles.reduce((sum, hole) => sum + hole.points, 0);
        const totalGross = playerHoles.reduce((sum, hole) => sum + (hole.grossScore || 0), 0);
        const totalNet = playerHoles.reduce((sum, hole) => sum + (hole.netScore || 0), 0);

        // Create round data
        const roundData: StablefordRound = {
          roundNumber,
          date: match.matchDate,
          holes: playerHoles,
          totalPoints,
          totalGross,
          totalNet
        };

        // Add or update round data
        const existingRoundIndex = player.rounds.findIndex(r => r.roundNumber === roundNumber);
        if (existingRoundIndex >= 0) {
          player.rounds[existingRoundIndex] = roundData;
        } else {
          player.rounds.push(roundData);
        }
      });
    });
  });

  // Calculate aggregate totals for each player
  playerScores.forEach(player => {
    player.aggregatePoints = player.rounds.reduce((sum, round) => sum + round.totalPoints, 0);
    player.aggregateGross = player.rounds.reduce((sum, round) => sum + round.totalGross, 0);
    player.aggregateNet = player.rounds.reduce((sum, round) => sum + round.totalNet, 0);
  });

  // Create leaderboard entries
  const leaderboardEntries: StablefordLeaderboardEntry[] = Array.from(playerScores.values())
    .map(player => ({
      player,
      position: 0, // Will be set after sorting
      totalPoints: player.aggregatePoints,
      totalGross: player.aggregateGross,
      totalNet: player.aggregateNet,
      roundsPlayed: player.rounds.length,
      roundScores: {
        round1: player.rounds.find(r => r.roundNumber === 1)?.totalPoints || 0,
        round2: player.rounds.find(r => r.roundNumber === 2)?.totalPoints || 0,
        round3: player.rounds.find(r => r.roundNumber === 3)?.totalPoints || 0
      }
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints); // Sort by total points descending

  // Set positions
  leaderboardEntries.forEach((entry, index) => {
    entry.position = index + 1;
    entry.player.position = index + 1;
  });

  return leaderboardEntries;
}

/**
 * Get leaderboard data for a specific round
 */
export function getRoundLeaderboard(
  leaderboardEntries: StablefordLeaderboardEntry[],
  roundNumber: number
): StablefordLeaderboardEntry[] {
  return leaderboardEntries
    .map(entry => {
      const roundData = entry.player.rounds.find(r => r.roundNumber === roundNumber);
      return {
        ...entry,
        totalPoints: roundData?.totalPoints || 0,
        totalGross: roundData?.totalGross || 0,
        totalNet: roundData?.totalNet || 0
      };
    })
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .map((entry, index) => ({
      ...entry,
      position: index + 1
    }));
}

/**
 * Get team leaderboard data
 */
export function getTeamLeaderboard(
  leaderboardEntries: StablefordLeaderboardEntry[],
  teams: Team[]
): StablefordTeam[] {
  const teamMap = new Map<number, StablefordTeam>();

  // Filter teams for Nancy Millar Trophy (tournament_id = 6)
  const nancyMillarTeams = teams.filter(team => 
    team.tournamentId === 6 || team.tournament_id === 6
  );

  // Initialize Nancy Millar Trophy teams
  nancyMillarTeams.forEach(team => {
    if (team.division === 'Trophy' || team.division === 'Shield') {
      teamMap.set(team.id, {
        id: team.id,
        name: team.name,
        division: team.division === 'Trophy' ? 'KAREN' : 'VISITOR',
        color: team.color || '#3B82F6',
        players: [],
        teamPoints: 0,
        teamGross: 0,
        teamNet: 0,
        position: 0
      });
    }
  });

  // Add players to teams
  leaderboardEntries.forEach(entry => {
    const team = teamMap.get(entry.player.teamId);
    if (team) {
      team.players.push(entry.player);
    }
  });

  // Calculate team totals
  teamMap.forEach(team => {
    team.teamPoints = team.players.reduce((sum, player) => sum + player.aggregatePoints, 0);
    team.teamGross = team.players.reduce((sum, player) => sum + player.aggregateGross, 0);
    team.teamNet = team.players.reduce((sum, player) => sum + player.aggregateNet, 0);
  });

  // Sort teams by total points
  const sortedTeams = Array.from(teamMap.values())
    .sort((a, b) => b.teamPoints - a.teamPoints)
    .map((team, index) => ({
      ...team,
      position: index + 1
    }));

  return sortedTeams;
}
