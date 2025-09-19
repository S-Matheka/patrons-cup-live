/**
 * Tournament-related type definitions for multi-tournament support
 */

export interface Tournament {
  id: number;
  name: string;
  slug: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'active' | 'completed' | 'archived';
  format: 'patrons_cup' | 'stableford' | 'stroke_play' | 'custom';
  divisions: string[];
  pointSystem: TournamentPointSystem;
  settings: TournamentSettings;
  createdAt: string;
  updatedAt: string;
}

export interface TournamentPointSystem {
  // Patrons Cup format
  friAM4BBB?: {
    win: number;
    tie: number;
  };
  friPMFoursomes?: {
    trophy: { win: number; tie: number };
    bowl: { win: number; tie: number };
  };
  satAM4BBB?: {
    win: number;
    tie: number;
  };
  satPMFoursomes?: {
    trophy: { win: number; tie: number };
    bowl: { win: number; tie: number };
  };
  sunSingles?: {
    win: number;
    tie: number;
  };
  
  // Stableford format
  stableford?: {
    netAlbatross: number;
    netEagle: number;
    netBirdie: number;
    netPar: number;
    netBogey: number;
    netDoubleBogeyOrWorse: number;
  };
}

export interface TournamentSettings {
  course: string;
  maxPlayersPerTeam: number;
  allowThreeWayMatches: boolean;
  enableProMatches: boolean;
  rounds?: number;
  handicapBased?: boolean;
  strokeIndex?: { [holeNumber: string]: { par: number; si: number } };
  [key: string]: any; // Allow additional custom settings
}

export interface TournamentSummary {
  id: number;
  name: string;
  slug: string;
  status: string;
  startDate: string;
  endDate: string;
  teamCount: number;
  playerCount: number;
  matchCount: number;
  completedMatches: number;
}

export interface CreateTournamentRequest {
  name: string;
  slug: string;
  description: string;
  startDate: string;
  endDate: string;
  format: 'patrons_cup' | 'stableford' | 'stroke_play' | 'custom';
  divisions: string[];
  pointSystem?: Partial<TournamentPointSystem>;
  settings?: Partial<TournamentSettings>;
}

export interface TournamentContextType {
  // Current tournament
  currentTournament: Tournament | null;
  
  // Available tournaments
  tournaments: Tournament[];
  
  // Loading states
  isLoading: boolean;
  isSwitching: boolean;
  
  // Actions
  switchTournament: (tournamentId: number) => Promise<void>;
  createTournament: (tournament: CreateTournamentRequest) => Promise<void>;
  updateTournament: (tournamentId: number, updates: Partial<Tournament>) => Promise<void>;
  archiveTournament: (tournamentId: number) => Promise<void>;
  
  // Data loading (filtered by current tournament)
  loadTournamentData: () => Promise<void>;
  refreshTournamentData: () => Promise<void>;
  
  // Tournament-specific data
  teams: import('./index').Team[];
  players: import('./index').Player[];
  matches: import('./index').Match[];
  scores: import('./index').Score[];
  
  // Error handling
  error: string | null;
  clearError: () => void;
}

export interface TournamentSelectorProps {
  className?: string;
  showStatus?: boolean;
  onTournamentChange?: (tournament: Tournament) => void;
}

export interface TournamentCardProps {
  tournament: Tournament;
  isSelected?: boolean;
  onClick?: () => void;
  showStats?: boolean;
}

export interface TournamentFormProps {
  tournament?: Tournament;
  onSubmit: (tournament: CreateTournamentRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

// Database types for Supabase
export interface DatabaseTournament {
  id: number;
  name: string;
  slug: string;
  description: string;
  start_date: string;
  end_date: string;
  status: 'upcoming' | 'active' | 'completed' | 'archived';
  format: 'patrons_cup' | 'stableford' | 'stroke_play' | 'custom';
  divisions: string[];
  point_system: TournamentPointSystem;
  settings: TournamentSettings;
  created_at: string;
  updated_at: string;
}

// Utility types
export type TournamentStatus = Tournament['status'];
export type TournamentFormat = Tournament['format'];
export type TournamentDivision = 'Trophy' | 'Shield' | 'Plaque' | 'Bowl' | 'Mug';

// Constants
export const TOURNAMENT_STATUSES: TournamentStatus[] = ['upcoming', 'active', 'completed', 'archived'];
export const TOURNAMENT_FORMATS: TournamentFormat[] = ['patrons_cup', 'stableford', 'stroke_play', 'custom'];
export const DEFAULT_DIVISIONS: TournamentDivision[] = ['Trophy', 'Shield', 'Plaque', 'Bowl', 'Mug'];

// Default configurations
export const DEFAULT_POINT_SYSTEM: TournamentPointSystem = {
  friAM4BBB: { win: 5, tie: 2.5 },
  friPMFoursomes: { 
    trophy: { win: 3, tie: 1.5 }, 
    bowl: { win: 4, tie: 2 } 
  },
  satAM4BBB: { win: 5, tie: 2.5 },
  satPMFoursomes: { 
    trophy: { win: 3, tie: 1.5 }, 
    bowl: { win: 4, tie: 2 } 
  },
  sunSingles: { win: 3, tie: 1.5 }
};

export const DEFAULT_TOURNAMENT_SETTINGS: TournamentSettings = {
  course: 'Muthaiga Golf Club',
  maxPlayersPerTeam: 12,
  allowThreeWayMatches: true,
  enableProMatches: true
};
