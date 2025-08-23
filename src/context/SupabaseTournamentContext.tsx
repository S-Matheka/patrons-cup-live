'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { TournamentContextType, Team, Player, Match, Score, Hole } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { matchStatusManager } from '@/utils/matchStatusManager';

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
  // Start with JSON data to match localStorage provider behavior
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(false); // Start without loading to prevent hydration issues
  const [channels, setChannels] = useState<RealtimeChannel[]>([]);

  // Load initial data from Supabase
  useEffect(() => {
    // Only load data if Supabase is configured and we're on the client
    if (typeof window !== 'undefined' && isSupabaseConfigured() && supabase) {
      loadInitialData();
      setupRealtimeSubscriptions();
      
      // Start automatic match status monitoring
      matchStatusManager.startMonitoring();

      // Cleanup subscriptions on unmount
      return () => {
        channels.forEach(channel => {
          supabase.removeChannel(channel);
        });
        
        // Stop match status monitoring
        matchStatusManager.stopMonitoring();
      };
    }
  }, []);

  const loadInitialData = async () => {
    if (!supabase || typeof window === 'undefined') {
      console.log('Supabase not available or running on server');
      return;
    }
    
    try {

      // Load all data in parallel
      const [teamsRes, playersRes, matchesRes, scoresRes] = await Promise.all([
        supabase.from('teams').select('*').order('seed'),
        supabase.from('players').select('*').order('name'),
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
          .order('game_number')
          .order('hole_number', { referencedTable: 'holes' }),
        supabase.from('scores').select('*').order('points', { ascending: false })
      ]);

      if (teamsRes.error) throw teamsRes.error;
      if (playersRes.error) throw playersRes.error;
      if (matchesRes.error) throw matchesRes.error;
      if (scoresRes.error) throw scoresRes.error;

      // Transform Supabase data to match our types
      const transformedTeams: Team[] = teamsRes.data.map(team => ({
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

      const transformedPlayers: Player[] = playersRes.data.map(player => ({
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

      console.log('📊 Loading matches data:', {
        totalMatches: matchesRes.data.length,
        matchesWithHoles: matchesRes.data.filter(m => m.holes && m.holes.length > 0).length
      });

      const transformedMatches: Match[] = matchesRes.data.map(match => ({
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
          teamCScore: hole.team_c_score,
          teamAStrokes: hole.team_a_strokes,
          teamBStrokes: hole.team_b_strokes,
          teamCStrokes: hole.team_c_strokes,
          status: hole.status,
          lastUpdated: hole.last_updated
        })).sort((a, b) => a.number - b.number) // Sort holes by number
      }));

      // Debug: Log a sample match to see the transformed data
      if (transformedMatches.length > 0) {
        const sampleMatch = transformedMatches[0];
        console.log('🎯 Sample match data:', {
          id: sampleMatch.id,
          holesCount: sampleMatch.holes?.length || 0,
          holesWithScores: sampleMatch.holes?.filter(h => h.teamAScore !== null || h.teamBScore !== null).length || 0,
          firstFewHoles: sampleMatch.holes?.slice(0, 3).map(h => ({
            hole: h.number,
            teamA: h.teamAScore,
            teamB: h.teamBScore,
            status: h.status
          }))
        });
      }

      const transformedScores: Score[] = scoresRes.data.map(score => ({
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

    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const setupRealtimeSubscriptions = () => {
    const newChannels: RealtimeChannel[] = [];

    // Subscribe to matches changes
    const matchesChannel = supabase
      .channel('matches-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'matches' },
        (payload) => {
          console.log('Match updated:', payload);
          handleMatchUpdate(payload);
        }
      )
      .subscribe();

    // Subscribe to holes changes
    const holesChannel = supabase
      .channel('holes-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'holes' },
        (payload) => {
          console.log('🔄 Real-time hole update received:', {
            eventType: payload.eventType,
            matchId: payload.new?.match_id || payload.old?.match_id,
            holeNumber: payload.new?.hole_number || payload.old?.hole_number,
            teamAScore: payload.new?.team_a_score,
            teamBScore: payload.new?.team_b_score,
            status: payload.new?.status
          });
          handleHoleUpdate(payload);
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
          handleScoreUpdate(payload);
        }
      )
      .subscribe();

    newChannels.push(matchesChannel, holesChannel, scoresChannel);
    setChannels(newChannels);
  };

  const handleMatchUpdate = (payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    setMatches(currentMatches => {
      switch (eventType) {
        case 'INSERT':
          return [...currentMatches, transformSupabaseMatch(newRecord)];
        case 'UPDATE':
          return currentMatches.map(match =>
            match.id === newRecord.id ? transformSupabaseMatch(newRecord) : match
          );
        case 'DELETE':
          return currentMatches.filter(match => match.id !== oldRecord.id);
        default:
          return currentMatches;
      }
    });
  };

  const handleHoleUpdate = (payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    console.log('🔄 Real-time hole update received:', {
      eventType,
      matchId: newRecord?.match_id || oldRecord?.match_id,
      holeNumber: newRecord?.hole_number || oldRecord?.hole_number,
      teamAScore: newRecord?.team_a_score,
      teamBScore: newRecord?.team_b_score,
      status: newRecord?.status
    });

    setMatches(currentMatches => {
      return currentMatches.map(match => {
        if (match.id === (newRecord?.match_id || oldRecord?.match_id)) {
          console.log('📋 Updating match:', match.id, 'Current holes:', match.holes.length);
          
          // Create a new array to avoid mutation
          let updatedHoles = [...match.holes];
          const holeNumber = newRecord?.hole_number || oldRecord?.hole_number;
          const holeIndex = updatedHoles.findIndex(h => h.number === holeNumber);

          console.log('🔍 Hole index found:', holeIndex, 'for hole number:', holeNumber);

          switch (eventType) {
            case 'INSERT':
            case 'UPDATE':
              if (holeIndex >= 0) {
                // Update existing hole while preserving other properties
                const existingHole = updatedHoles[holeIndex];
                const transformedHole = transformSupabaseHole(newRecord);
                console.log('🔄 Updating existing hole:', {
                  existing: existingHole,
                  new: transformedHole
                });
                updatedHoles[holeIndex] = {
                  ...existingHole,
                  ...transformedHole
                };
              } else {
                const transformedHole = transformSupabaseHole(newRecord);
                console.log('➕ Adding new hole:', transformedHole);
                updatedHoles.push(transformedHole);
              }
              break;
            case 'DELETE':
              if (holeIndex >= 0) {
                console.log('🗑️ Deleting hole at index:', holeIndex);
                updatedHoles.splice(holeIndex, 1);
              }
              break;
          }

          // Sort holes by number to maintain consistent order
          updatedHoles.sort((a, b) => a.number - b.number);

          console.log('✅ Updated holes count:', updatedHoles.length, 'Holes with scores:', updatedHoles.filter(h => h.teamAScore !== null || h.teamBScore !== null).length);
          
          const updatedMatch = { ...match, holes: updatedHoles };
          console.log('🎯 Final match state:', {
            matchId: updatedMatch.id,
            holesCount: updatedMatch.holes.length,
            holesWithScores: updatedHoles.filter(h => h.teamAScore !== null || h.teamBScore !== null).length,
            sampleHoles: updatedHoles.slice(0, 3).map(h => ({ hole: h.number, teamA: h.teamAScore, teamB: h.teamBScore }))
          });
          
          return updatedMatch;
        }
        return match;
      });
    });
  };

  const handleScoreUpdate = (payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    setScores(currentScores => {
      switch (eventType) {
        case 'INSERT':
          return [...currentScores, transformSupabaseScore(newRecord)];
        case 'UPDATE':
          return currentScores.map(score =>
            score.teamId === newRecord.team_id ? transformSupabaseScore(newRecord) : score
          );
        case 'DELETE':
          return currentScores.filter(score => score.teamId !== oldRecord.team_id);
        default:
          return currentScores;
      }
    });
  };

  // Transform functions
  const transformSupabaseMatch = (supabaseMatch: any): Match => ({
    id: supabaseMatch.id,
    teamAId: supabaseMatch.team_a_id,
    teamBId: supabaseMatch.team_b_id,
    teamCId: supabaseMatch.team_c_id,
    division: supabaseMatch.division,
    date: supabaseMatch.match_date,
    teeTime: supabaseMatch.tee_time,
    tee: supabaseMatch.tee,
    course: supabaseMatch.course,
    type: supabaseMatch.match_type,
    session: supabaseMatch.session,
    status: supabaseMatch.status,
    players: supabaseMatch.players,
    gameNumber: supabaseMatch.game_number,
    isThreeWay: supabaseMatch.is_three_way,
    isPro: supabaseMatch.is_pro,
    isBye: supabaseMatch.is_bye,
    holes: [] // Holes are loaded separately
  });

  const transformSupabaseHole = (supabaseHole: any): Hole => ({
    number: supabaseHole.hole_number,
    par: supabaseHole.par,
    teamAScore: supabaseHole.team_a_score,
    teamBScore: supabaseHole.team_b_score,
    teamCScore: supabaseHole.team_c_score,
    teamAStrokes: supabaseHole.team_a_strokes,
    teamBStrokes: supabaseHole.team_b_strokes,
    teamCStrokes: supabaseHole.team_c_strokes,
    status: supabaseHole.status,
    lastUpdated: supabaseHole.last_updated
  });

  const transformSupabaseScore = (supabaseScore: any): Score => ({
    teamId: supabaseScore.team_id,
    division: supabaseScore.division,
    points: supabaseScore.points,
    matchesPlayed: supabaseScore.matches_played,
    matchesWon: supabaseScore.matches_won,
    matchesLost: supabaseScore.matches_lost,
    matchesHalved: supabaseScore.matches_halved,
    holesWon: supabaseScore.holes_won,
    holesLost: supabaseScore.holes_lost,
    totalStrokes: supabaseScore.total_strokes,
    strokesDifferential: supabaseScore.strokes_differential,
    currentRound: supabaseScore.current_round,
    position: supabaseScore.position,
    positionChange: supabaseScore.position_change,
    lastUpdated: supabaseScore.last_updated
  });

  // Update functions
  const updateMatch = async (matchId: number, updatedMatch: Match) => {
    try {
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
          team_c_score: hole.teamCScore,
          team_a_strokes: hole.teamAStrokes,
          team_b_strokes: hole.teamBStrokes,
          team_c_strokes: hole.teamCStrokes,
          status: hole.status,
          last_updated: new Date().toISOString()
        }));

        const { error: holesError } = await supabase
          .from('holes')
          .upsert(holesData, { onConflict: 'match_id,hole_number' });

        if (holesError) throw holesError;
      }

    } catch (error) {
      console.error('Error updating match:', error);
    }
  };

  const updateScore = async (teamId: number, updatedScore: Score) => {
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
      console.error('Error updating score:', error);
    }
  };

  // Helper functions
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

  // Manual refresh function for when real-time fails
  const refreshMatchData = async (matchId: number) => {
    try {
      console.log('🔄 Manually refreshing match data for match:', matchId);
      
      const { data: match, error } = await supabase
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
        .eq('id', matchId)
        .single();

      if (error) throw error;

      const transformedMatch: Match = {
        ...transformSupabaseMatch(match),
        holes: (match.holes || []).map((hole: any) => ({
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
        })).sort((a, b) => a.number - b.number)
      };

      setMatches(currentMatches => 
        currentMatches.map(m => 
          m.id === matchId ? transformedMatch : m
        )
      );

      console.log('✅ Match data refreshed successfully:', {
        matchId: transformedMatch.id,
        holesCount: transformedMatch.holes.length,
        holesWithScores: transformedMatch.holes.filter(h => h.teamAScore !== null || h.teamBScore !== null).length
      });
    } catch (error) {
      console.error('❌ Error refreshing match data:', error);
    }
  };

  const value: TournamentContextType = {
    teams,
    players,
    matches,
    scores,
    loading,
    updateMatch,
    updateScore,
    refreshMatchData,
    getTeamById,
    getPlayersByTeamId,
    getMatchById,
    getScoreByTeamId
  };

  return (
    <TournamentContext.Provider value={value}>
      {children}
    </TournamentContext.Provider>
  );
};
