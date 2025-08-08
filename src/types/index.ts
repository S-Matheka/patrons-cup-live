export interface Team {
  id: number;
  name: string;
  division: 'Trophy' | 'Plate' | 'Bowl' | 'Mug';
  color: string;
  logo: string;
  description: string;
}

export interface Player {
  id: number;
  name: string;
  teamId: number;
  handicap: number;
  email: string;
  phone: string;
}

export interface Hole {
  number: number;
  teamAScore: number | null;
  teamBScore: number | null;
  status: 'not-started' | 'in-progress' | 'completed';
}

export interface Match {
  id: number;
  teamAId: number;
  teamBId: number;
  division: 'Trophy' | 'Plate' | 'Bowl' | 'Mug';
  date: string;
  teeTime: string;
  course: string;
  type: '4BBB' | 'Foursomes' | 'Singles';
  session: 'AM' | 'PM';
  status: 'scheduled' | 'in-progress' | 'completed';
  players: {
    teamA: string[];
    teamB: string[];
  };
  holes: Hole[];
}

export interface Score {
  teamId: number;
  division: 'Trophy' | 'Plate' | 'Bowl' | 'Mug';
  points: number;
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
  holesWon: number;
  holesLost: number;
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