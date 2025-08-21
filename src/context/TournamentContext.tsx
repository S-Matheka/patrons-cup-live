'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { TournamentContextType, Team, Player, Match, Score } from '@/types';
import teamsData from '@/data/teams.json';
import playersData from '@/data/players.json';
import matchesData from '@/data/matches.json';
import scoresData from '@/data/scores.json';
import { supabase } from '@/lib/supabase';

const TournamentContext = createContext<TournamentContextType | undefined>(undefined);

export const useTournament = () => {
  const context = useContext(TournamentContext);
  if (context === undefined) {
    throw new Error('useTournament must be used within a TournamentProvider');
  }
  return context;
};

interface TournamentProviderProps {
  children: React.ReactNode;
}

export const TournamentProvider: React.FC<TournamentProviderProps> = ({ children }) => {
  const [teams, setTeams] = useState<Team[]>(teamsData as Team[]);
  const [players, setPlayers] = useState<Player[]>(playersData as Player[]);
  const [matches, setMatches] = useState<Match[]>(matchesData as Match[]);
  const [scores, setScores] = useState<Score[]>(scoresData as Score[]);
  const [useSupabase, setUseSupabase] = useState(false);

  // Check if Supabase is configured
  useEffect(() => {
    const supabaseConfigured = 
      process.env.NEXT_PUBLIC_SUPABASE_URL && 
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_url_here';
    
    if (supabaseConfigured) {
      setUseSupabase(true);
      loadFromSupabase();
      setupRealtimeSubscriptions();
    }
  }, []);

  // Load data from localStorage on mount
  useEffect(() => {
    if (useSupabase) return; // Skip localStorage if using Supabase
    const savedMatches = localStorage.getItem('tournament-matches');
    const savedScores = localStorage.getItem('tournament-scores');
    
    // Check if we have the new match structure (158 matches vs old structure)
    if (savedMatches) {
      const parsedMatches = JSON.parse(savedMatches);
      // Check if we have old data with incorrect status or structure
      const hasInProgressMatches = parsedMatches.some((match: Match) => match.status === 'in-progress');
      const hasCorrectStructure = parsedMatches.length === 158 && parsedMatches[0]?.gameNumber;
      
      // If we dondon'tapos;t have 158 matches, missing gameNumber, or have in-progress matches, use fresh data
      if (!hasCorrectStructure || hasInProgressMatches) {
        console.log('Loading fresh match data - old localStorage data detected');
        setMatches(matchesData as Match[]);
        localStorage.setItem('tournament-matches', JSON.stringify(matchesData));
      } else {
        setMatches(parsedMatches);
      }
    }
    
    // Always use fresh scores data for pre-tournament state
    // Clear any old score data that might have points
    console.log('Loading fresh scores data - ensuring pre-tournament state');
    setScores(scoresData as Score[]);
    localStorage.setItem('tournament-scores', JSON.stringify(scoresData));
  }, []);

  // Save matches to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('tournament-matches', JSON.stringify(matches));
  }, [matches]);

  // Save scores to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('tournament-scores', JSON.stringify(scores));
  }, [scores]);

  // Supabase functions
  const loadFromSupabase = async () => {
    try {
      console.log('Loading data from Supabase...');
      
      // Load all data in parallel
      const [teamsRes, playersRes, matchesRes, scoresRes] = await Promise.all([
        supabase.from('teams').select('*').order('seed'),
        supabase.from('players').select('*').order('name'),
        supabase.from('matches').select(`
          *,
          holes (
            hole_number,
            par,
            team_a_score,
            team_b_score,
            team_a_strokes,
            team_b_strokes,
            status,
            last_updated
          )
        `).order('game_number'),
        supabase.from('scores').select('*').order('points', { ascending: false })
      ]);

      if (teamsRes.error) throw teamsRes.error;
      if (playersRes.error) throw playersRes.error;
      if (matchesRes.error) throw matchesRes.error;
      if (scoresRes.error) throw scoresRes.error;

      // Transform Supabase data to match our types
      const transformedTeams = teamsRes.data.map((team: any) => ({
        id: team.id,
        name: team.name,
        division: team.division,
        color: team.color,
        logo: team.logo || '',
        description: team.description || '',
        seed: team.seed,
        totalPlayers: team.total_players,
        maxPointsAvailable: team.max_points_available,
        sessionPoints: team.session_points,
        playersPerSession: team.players_per_session,
        restingPerSession: team.resting_per_session,
        pointsPerMatch: team.points_per_match
      }));

      const transformedPlayers = playersRes.data.map((player: any) => ({
        id: player.id,
        name: player.name,
        teamId: player.team_id,
        handicap: player.handicap,
        email: player.email || '',
        phone: player.phone || '',
        isPro: player.is_pro,
        isExOfficio: player.is_ex_officio,
        isJunior: player.is_junior
      }));

      const transformedMatches = matchesRes.data.map((match: any) => ({
        id: match.id,
        teamAId: match.team_a_id,
        teamBId: match.team_b_id,
        teamCId: match.team_c_id,
        division: match.division,
        date: match.match_date,
        teeTime: match.tee_time,
        tee: match.tee,
        course: match.course,
        type: match.match_type,
        session: match.session,
        status: match.status,
        players: match.players,
        gameNumber: match.game_number,
        isThreeWay: match.is_three_way,
        isPro: match.is_pro,
        isBye: match.is_bye,
        holes: (match.holes || []).map((hole: any) => ({
          number: hole.hole_number,
          par: hole.par,
          teamAScore: hole.team_a_score,
          teamBScore: hole.team_b_score,
          teamAStrokes: hole.team_a_strokes,
          teamBStrokes: hole.team_b_strokes,
          status: hole.status,
          lastUpdated: hole.last_updated
        }))
      }));

      const transformedScores = scoresRes.data.map((score: any) => ({
        teamId: score.team_id,
        division: score.division,
        points: score.points,
        matchesPlayed: score.matches_played,
        matchesWon: score.matches_won,
        matchesLost: score.matches_lost,
        matchesHalved: score.matches_halved,
        holesWon: score.holes_won,
        holesLost: score.holes_lost,
        totalStrokes: score.total_strokes,
        strokesDifferential: score.strokes_differential,
        currentRound: score.current_round,
        position: score.position,
        positionChange: score.position_change,
        lastUpdated: score.last_updated
      }));

      setTeams(transformedTeams);
      setPlayers(transformedPlayers);
      setMatches(transformedMatches);
      setScores(transformedScores);

      console.log('✅ Data loaded from Supabase successfully');
    } catch (error) {
      console.error('Error loading from Supabase:', error);
      console.log('Falling back to localStorage/JSON data');
    }
  };

  const setupRealtimeSubscriptions = () => {
    if (!supabase) return;
    
    // Subscribe to matches changes
    const matchesChannel = supabase
      .channel('matches-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'matches' },
        (payload) => {
          console.log('Match updated:', payload);
          // Reload matches data
          loadFromSupabase();
        }
      )
      .subscribe();

    // Subscribe to scores changes
    const scoresChannel = supabase
      .channel('scores-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'scores' },
        (payload) => {
          console.log('Score updated:', payload);
          // Reload scores data
          loadFromSupabase();
        }
      )
      .subscribe();

    // Subscribe to teams changes
    const teamsChannel = supabase
      .channel('teams-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'teams' },
        (payload) => {
          console.log('Team updated:', payload);
          // Reload teams data
          loadFromSupabase();
        }
      )
      .subscribe();

    // Subscribe to players changes
    const playersChannel = supabase
      .channel('players-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'players' },
        (payload) => {
          console.log('Player updated:', payload);
          // Reload players data
          loadFromSupabase();
        }
      )
      .subscribe();
  };

  const updateMatch = async (matchId: number, updatedMatch: Match) => {
    if (useSupabase) {
      try {
        // Update in Supabase
        const { error } = await supabase
          .from('matches')
          .update({
            team_a_id: updatedMatch.teamAId,
            team_b_id: updatedMatch.teamBId,
            team_c_id: updatedMatch.teamCId,
            division: updatedMatch.division,
            match_date: updatedMatch.date,
            tee_time: updatedMatch.teeTime,
            tee: updatedMatch.tee,
            course: updatedMatch.course,
            match_type: updatedMatch.type,
            session: updatedMatch.session,
            status: updatedMatch.status,
            players: updatedMatch.players,
            game_number: updatedMatch.gameNumber,
            is_three_way: updatedMatch.isThreeWay,
            is_pro: updatedMatch.isPro,
            is_bye: updatedMatch.isBye,
            updated_at: new Date().toISOString()
          })
          .eq('id', matchId);

        if (error) throw error;

        // Update holes if they exist
        if (updatedMatch.holes && updatedMatch.holes.length > 0) {
          const holesData = updatedMatch.holes.map(hole => ({
            match_id: matchId,
            hole_number: hole.number,
            par: hole.par,
            team_a_score: hole.teamAScore,
            team_b_score: hole.teamBScore,
            team_a_strokes: hole.teamAStrokes,
            team_b_strokes: hole.teamBStrokes,
            status: hole.status,
            last_updated: new Date().toISOString()
          }));

          const { error: holesError } = await supabase
            .from('holes')
            .upsert(holesData, { onConflict: 'match_id,hole_number' });

          if (holesError) throw holesError;
        }
      } catch (error) {
        console.error('Error updating match in Supabase:', error);
      }
    } else {
      // Update locally
      setMatches(prevMatches => 
        prevMatches.map(match => 
          match.id === matchId ? updatedMatch : match
        )
      );
    }
  };

  const updateScore = async (teamId: number, updatedScore: Score) => {
    if (useSupabase) {
      try {
        const { error } = await supabase
          .from('scores')
          .update({
            division: updatedScore.division,
            points: updatedScore.points,
            matches_played: updatedScore.matchesPlayed,
            matches_won: updatedScore.matchesWon,
            matches_lost: updatedScore.matchesLost,
            matches_halved: updatedScore.matchesHalved,
            holes_won: updatedScore.holesWon,
            holes_lost: updatedScore.holesLost,
            total_strokes: updatedScore.totalStrokes,
            strokes_differential: updatedScore.strokesDifferential,
            current_round: updatedScore.currentRound,
            position: updatedScore.position,
            position_change: updatedScore.positionChange,
            last_updated: new Date().toISOString()
          })
          .eq('team_id', teamId);

        if (error) throw error;
      } catch (error) {
        console.error('Error updating score in Supabase:', error);
      }
    } else {
      // Update locally
      setScores(prevScores => 
        prevScores.map(score => 
          score.teamId === teamId ? updatedScore : score
        )
      );
    }
  };

  const getTeamById = (id: number): Team | undefined => {
    return teams.find(team => team.id === id);
  };

  const getPlayersByTeamId = (teamId: number): Player[] => {
    return players.filter(player => player.teamId === teamId);
  };

  const getMatchById = (id: number): Match | undefined => {
    return matches.find(match => match.id === id);
  };

  const getScoreByTeamId = (teamId: number): Score | undefined => {
    return scores.find(score => score.teamId === teamId);
  };

  const value: TournamentContextType = {
    teams,
    players,
    matches,
    scores,
    updateMatch,
    updateScore,
    getTeamById,
    getPlayersByTeamId,
    getMatchById,
    getScoreByTeamId,
  };

  return (
    <TournamentContext.Provider value={value}>
      {children}
    </TournamentContext.Provider>
  );
}; 