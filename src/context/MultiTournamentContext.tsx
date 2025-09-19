import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Tournament, 
  TournamentContextType, 
  CreateTournamentRequest,
  TournamentSummary,
  DEFAULT_POINT_SYSTEM,
  DEFAULT_TOURNAMENT_SETTINGS
} from '@/types/tournament';
import { Team, Player, Match, Score } from '@/types';

const MultiTournamentContext = createContext<TournamentContextType | undefined>(undefined);

interface MultiTournamentProviderProps {
  children: ReactNode;
}

export const MultiTournamentProvider: React.FC<MultiTournamentProviderProps> = ({ children }) => {
  // State
  const [currentTournament, setCurrentTournament] = useState<Tournament | null>(null);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSwitching, setIsSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tournament-specific data
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [scores, setScores] = useState<Score[]>([]);

  // Load all tournaments
  const loadTournaments = async () => {
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .order('start_date', { ascending: false });

      if (error) throw error;

      const transformedTournaments = data.map(transformTournament);
      setTournaments(transformedTournaments);

      // Set current tournament to the first active one, or first available
      const activeTournament = transformedTournaments.find(t => t.status === 'active');
      if (activeTournament) {
        setCurrentTournament(activeTournament);
      } else if (transformedTournaments.length > 0) {
        setCurrentTournament(transformedTournaments[0]);
      }
    } catch (err) {
      console.error('Error loading tournaments:', err);
      setError('Failed to load tournaments');
    }
  };

  // Load tournament-specific data
  const loadTournamentData = async (tournamentId?: number) => {
    const targetTournamentId = tournamentId || currentTournament?.id;
    if (!targetTournamentId) return;

    try {
      setIsLoading(true);

      // Load all data in parallel
      const [teamsRes, playersRes, matchesRes, scoresRes] = await Promise.all([
        supabase.from('teams').select('*').eq('tournament_id', targetTournamentId).order('seed'),
        supabase.from('players').select('*').eq('tournament_id', targetTournamentId).order('name'),
        supabase
          .from('matches')
          .select(`
            *,
            holes (
              hole_number,
              par,
              team_a_score,
              team_b_score,
              team_c_score,
              team_a_strokes,
              team_b_strokes,
              team_c_strokes,
              status,
              last_updated
            )
          `)
          .eq('tournament_id', targetTournamentId)
          .order('game_number')
          .order('hole_number', { referencedTable: 'holes' }),
        supabase.from('scores').select('*').eq('tournament_id', targetTournamentId).order('points', { ascending: false })
      ]);

      if (teamsRes.error) throw teamsRes.error;
      if (playersRes.error) throw playersRes.error;
      if (matchesRes.error) throw matchesRes.error;
      if (scoresRes.error) throw scoresRes.error;

      // Transform data
      const transformedTeams = teamsRes.data.map(transformTeam);
      const transformedPlayers = playersRes.data.map(transformPlayer);
      const transformedMatches = matchesRes.data.map(transformMatch);
      const transformedScores = scoresRes.data.map(transformScore);

      setTeams(transformedTeams);
      setPlayers(transformedPlayers);
      setMatches(transformedMatches);
      setScores(transformedScores);

    } catch (err) {
      console.error('Error loading tournament data:', err);
      setError('Failed to load tournament data');
    } finally {
      setIsLoading(false);
    }
  };

  // Switch tournament
  const switchTournament = async (tournamentId: number) => {
    try {
      setIsSwitching(true);
      setError(null);

      const tournament = tournaments.find(t => t.id === tournamentId);
      if (!tournament) {
        throw new Error('Tournament not found');
      }

      setCurrentTournament(tournament);
      await loadTournamentData(tournamentId);

      // Store current tournament in localStorage for persistence
      localStorage.setItem('currentTournamentId', tournamentId.toString());

    } catch (err) {
      console.error('Error switching tournament:', err);
      setError('Failed to switch tournament');
    } finally {
      setIsSwitching(false);
    }
  };

  // Create new tournament
  const createTournament = async (tournamentData: CreateTournamentRequest) => {
    try {
      setError(null);

      const { data, error } = await supabase
        .from('tournaments')
        .insert([{
          name: tournamentData.name,
          slug: tournamentData.slug,
          description: tournamentData.description,
          start_date: tournamentData.startDate,
          end_date: tournamentData.endDate,
          format: tournamentData.format,
          divisions: tournamentData.divisions,
          point_system: tournamentData.pointSystem || DEFAULT_POINT_SYSTEM,
          settings: tournamentData.settings || DEFAULT_TOURNAMENT_SETTINGS,
          status: 'upcoming'
        }])
        .select()
        .single();

      if (error) throw error;

      const newTournament = transformTournament(data);
      setTournaments(prev => [newTournament, ...prev]);

      return newTournament;
    } catch (err) {
      console.error('Error creating tournament:', err);
      setError('Failed to create tournament');
      throw err;
    }
  };

  // Update tournament
  const updateTournament = async (tournamentId: number, updates: Partial<Tournament>) => {
    try {
      setError(null);

      const { data, error } = await supabase
        .from('tournaments')
        .update({
          name: updates.name,
          description: updates.description,
          start_date: updates.startDate,
          end_date: updates.endDate,
          status: updates.status,
          point_system: updates.pointSystem,
          settings: updates.settings
        })
        .eq('id', tournamentId)
        .select()
        .single();

      if (error) throw error;

      const updatedTournament = transformTournament(data);
      setTournaments(prev => prev.map(t => t.id === tournamentId ? updatedTournament : t));

      if (currentTournament?.id === tournamentId) {
        setCurrentTournament(updatedTournament);
      }
    } catch (err) {
      console.error('Error updating tournament:', err);
      setError('Failed to update tournament');
      throw err;
    }
  };

  // Archive tournament
  const archiveTournament = async (tournamentId: number) => {
    try {
      setError(null);

      const { error } = await supabase
        .from('tournaments')
        .update({ status: 'archived' })
        .eq('id', tournamentId);

      if (error) throw error;

      setTournaments(prev => prev.map(t => 
        t.id === tournamentId ? { ...t, status: 'archived' } : t
      ));

      if (currentTournament?.id === tournamentId) {
        setCurrentTournament(prev => prev ? { ...prev, status: 'archived' } : null);
      }
    } catch (err) {
      console.error('Error archiving tournament:', err);
      setError('Failed to archive tournament');
      throw err;
    }
  };

  // Refresh tournament data
  const refreshTournamentData = async () => {
    if (currentTournament) {
      await loadTournamentData(currentTournament.id);
    }
  };

  // Clear error
  const clearError = () => setError(null);

  // Initialize
  useEffect(() => {
    const initialize = async () => {
      await loadTournaments();
    };

    initialize();
  }, []);

  // Load tournament data when current tournament changes
  useEffect(() => {
    if (currentTournament) {
      loadTournamentData(currentTournament.id);
    }
  }, [currentTournament]);

  // Restore last selected tournament from localStorage
  useEffect(() => {
    const savedTournamentId = localStorage.getItem('currentTournamentId');
    if (savedTournamentId && tournaments.length > 0) {
      const tournament = tournaments.find(t => t.id === parseInt(savedTournamentId));
      if (tournament) {
        setCurrentTournament(tournament);
      }
    }
  }, [tournaments]);

  // Data transformation functions
  const transformTournament = (data: any): Tournament => ({
    id: data.id,
    name: data.name,
    slug: data.slug,
    description: data.description,
    startDate: data.start_date,
    endDate: data.end_date,
    status: data.status,
    format: data.format,
    divisions: data.divisions,
    pointSystem: data.point_system,
    settings: data.settings,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  });

  const transformTeam = (data: any): Team => ({
    id: data.id,
    name: data.name,
    division: data.division,
    color: data.color,
    logo: data.logo || '',
    description: data.description || '',
    seed: data.seed,
    totalPlayers: data.total_players,
    maxPointsAvailable: data.max_points_available,
    sessionPoints: data.session_points,
    playersPerSession: data.players_per_session,
    restingPerSession: data.resting_per_session,
    pointsPerMatch: data.points_per_match
  });

  const transformPlayer = (data: any): Player => ({
    id: data.id,
    name: data.name,
    teamId: data.team_id
  });

  const transformMatch = (data: any): Match => ({
    id: data.id,
    teamAId: data.team_a_id,
    teamBId: data.team_b_id,
    teamCId: data.team_c_id,
    division: data.division,
    date: data.match_date,
    match_date: data.match_date,
    teeTime: data.tee_time,
    tee: data.tee,
    course: data.course,
    type: data.match_type,
    match_type: data.match_type,
    session: data.session,
    status: data.status,
    players: data.players,
    holes: data.holes?.map((hole: any) => ({
      number: hole.hole_number,
      par: hole.par,
      teamAScore: hole.team_a_score,
      teamBScore: hole.team_b_score,
      teamCScore: hole.team_c_score,
      teamAStrokes: hole.team_a_strokes,
      teamBStrokes: hole.team_b_strokes,
      teamCStrokes: hole.team_c_strokes,
      status: hole.status,
      lastUpdated: hole.last_updated
    })) || [],
    gameNumber: data.game_number,
    isThreeWay: data.is_three_way,
    isPro: data.is_pro,
    isBye: data.is_bye,
    tournamentId: data.tournament_id,
    tournament_id: data.tournament_id
  });

  const transformScore = (data: any): Score => ({
    teamId: data.team_id,
    points: data.points,
    wins: data.wins,
    losses: data.losses,
    ties: data.ties,
    played: data.played,
    recentResults: data.recent_results || []
  });

  const contextValue: TournamentContextType = {
    currentTournament,
    tournaments,
    isLoading,
    isSwitching,
    switchTournament,
    createTournament,
    updateTournament,
    archiveTournament,
    loadTournamentData,
    refreshTournamentData,
    teams,
    players,
    matches,
    scores,
    error,
    clearError
  };

  return (
    <MultiTournamentContext.Provider value={contextValue}>
      {children}
    </MultiTournamentContext.Provider>
  );
};

export const useTournament = (): TournamentContextType => {
  const context = useContext(MultiTournamentContext);
  if (context === undefined) {
    throw new Error('useTournament must be used within a MultiTournamentProvider');
  }
  return context;
};
