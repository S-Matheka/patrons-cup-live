export interface Team {
  id: number;
  name: string;
  division: 'Trophy' | 'Shield' | 'Plaque' | 'Bowl' | 'Mug';
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
}

export interface Match {
  id: number;
  teamAId: number | null; // null for BYE matches
  teamBId: number | null; // null for BYE matches
  teamCId?: number; // For 3-way matches (Foursomes and Singles)
  division: 'Trophy' | 'Shield' | 'Plaque' | 'Bowl' | 'Mug';
  date: string;
  teeTime: string;
  tee: string; // Tee assignment (1st, 2nd, 10th, etc.)
  course: string;
  type: '4BBB' | 'Foursomes' | 'Singles';
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
  updateMatch: (matchId: number, updatedMatch: Match) => void;
  updateScore: (teamId: number, updatedScore: Score) => void;
  getTeamById: (id: number) => Team | undefined;
  getPlayersByTeamId: (teamId: number) => Player[];
  getMatchById: (id: number) => Match | undefined;
  getScoreByTeamId: (teamId: number) => Score | undefined;
} 