export interface Team {
  id: number;
  name: string;
  division: 'Trophy' | 'Shield' | 'Plaque' | 'Bowl' | 'Mug' | 'KAREN' | 'VISITOR';
  color: string;
  logo: string;
  description: string;
  seed: number;
  totalPlayers: number;
  maxPointsAvailable: number;
  sessionPoints: {
    friAM4BBB: number;
    friPMFoursomes: number;
    satAM4BBB: number;
    satPMFoursomes: number;
    sunSingles: number;
  };
  playersPerSession: {
    friAM4BBB: number;
    friPMFoursomes: number;
    satAM4BBB: number;
    satPMFoursomes: number;
    sunSingles: number;
  };
  restingPerSession: {
    friAM4BBB: number;
    friPMFoursomes: number;
    satAM4BBB: number;
    satPMFoursomes: number;
    sunSingles: number;
  };
  pointsPerMatch: {
    friAM4BBB: number;
    friPMFoursomes: number;
    satAM4BBB: number;
    satPMFoursomes: number;
    sunSingles: number;
  };
}

export interface Player {
  id: number;
  name: string;
  teamId: number;
  handicap?: number;
  email?: string;
  phone?: string;
  isPro?: boolean;
  isExOfficio?: boolean;
  isJunior?: boolean;
}

export interface Hole {
  number: number;
  par: number;
  teamAScore: number | null;
  teamBScore: number | null;
  teamCScore?: number | null; // For 3-way matches
  teamAStrokes: number | null; // Individual strokes taken
  teamBStrokes: number | null;
  teamCStrokes?: number | null; // For 3-way matches
  status: 'not-started' | 'in-progress' | 'completed';
  lastUpdated?: string; // For real-time tracking
  
  // Individual player scoring for Nancy Millar Trophy (Foursomes Stableford)
  player1Score?: number | null; // Team A, Player 1
  player2Score?: number | null; // Team A, Player 2
  player3Score?: number | null; // Team B, Player 1
  player4Score?: number | null; // Team B, Player 2
  player1Handicap?: number | null;
  player2Handicap?: number | null;
  player3Handicap?: number | null;
  player4Handicap?: number | null;
  player1Points?: number | null;
  player2Points?: number | null;
  player3Points?: number | null;
  player4Points?: number | null;
  player1Id?: number | null;
  player2Id?: number | null;
  player3Id?: number | null;
  player4Id?: number | null;
}

export interface Match {
  id: number;
  teamAId: number | null; // null for BYE matches
  teamBId: number | null; // null for BYE matches
  teamCId?: number; // For 3-way matches (Foursomes and Singles)
  division: 'Trophy' | 'Shield' | 'Plaque' | 'Bowl' | 'Mug';
  date?: string;
  match_date?: string;
  teeTime: string;
  tee: string; // Tee assignment (1st, 2nd, 10th, etc.)
  course: string;
  type?: '4BBB' | 'Foursomes' | 'Singles';
  match_type?: '4BBB' | 'Foursomes' | 'Singles';
  session: 'AM' | 'PM';
  status: 'scheduled' | 'in-progress' | 'completed';
  players: {
    teamA: string[];
    teamB: string[];
    teamC?: string[]; // For 3-way matches
  };
  holes: Hole[];
  gameNumber: number; // Official game number from schedule
  isThreeWay?: boolean; // True for Foursomes and Singles matches
  isPro?: boolean; // True for matches with PRO designation
  isBye?: boolean;
  tournamentId?: number; // Tournament ID for multi-tournament support
  tournament_id?: number; // Database field name
}

export interface Score {
  teamId: number;
  division: 'Trophy' | 'Shield' | 'Plaque' | 'Bowl' | 'Mug';
  points: number;
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
  matchesHalved: number;
  holesWon: number;
  holesLost: number;
  totalStrokes?: number;
  strokesDifferential?: number; // Relative to par (+2, -1, E)
  currentRound?: number;
  position?: number;
  positionChange?: 'up' | 'down' | 'same';
  lastUpdated?: string;
}

export interface TournamentContextType {
  teams: Team[];
  players: Player[];
  matches: Match[];
  scores: Score[];
  loading?: boolean;
  updateMatch: (matchId: number, updatedMatch: Match) => void;
  updateScore: (teamId: number, updatedScore: Score) => void;
  refreshMatchData: (matchId: number) => Promise<void>;
  getTeamById: (id: number) => Team | undefined;
  getPlayersByTeamId: (teamId: number) => Player[];
  getMatchById: (id: number) => Match | undefined;
  getScoreByTeamId: (teamId: number) => Score | undefined;
  
  // Multi-tournament support
  currentTournament?: import('./tournament').Tournament | null;
  tournaments?: import('./tournament').Tournament[];
  isSwitching?: boolean;
  switchTournament?: (tournamentId: number) => Promise<void>;
}

// Stableford-specific types
export interface StablefordHole {
  number: number;
  par: number;
  strokeIndex: number;
  playerScore: number | null;
  netScore: number | null;
  points: number | null;
  handicap: number;
}

export interface StablefordRound {
  roundNumber: number;
  date: string;
  holes: StablefordHole[];
  totalPoints: number;
  totalGross: number;
  totalNet: number;
}

export interface StablefordPlayer {
  id: number;
  name: string;
  teamId: number;
  handicap: number;
  rounds: StablefordRound[];
  aggregatePoints: number;
  aggregateGross: number;
  aggregateNet: number;
  position: number;
}

export interface StablefordTeam {
  id: number;
  name: string;
  division: string;
  color: string;
  players: StablefordPlayer[];
  teamPoints: number;
  teamGross: number;
  teamNet: number;
  position: number;
} 