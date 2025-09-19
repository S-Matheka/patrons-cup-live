'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { TournamentContextType, Team, Player, Match, Score, Hole } from '@/types';
import { Tournament, TournamentContextType as MultiTournamentContextType } from '@/types/tournament';
import { supabase, isSupabaseConfigured, getBrowserSupabaseClient } from '@/lib/supabase';
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
  const [loading, setLoading] = useState(true); // Start with loading to show loading state
  const [channels, setChannels] = useState<RealtimeChannel[]>([]);
  
  // Multi-tournament state
  const [currentTournament, setCurrentTournament] = useState<Tournament | null>(null);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isSwitching, setIsSwitching] = useState(false);

  // Load initial data from Supabase
  useEffect(() => {
    // Only load data if Supabase is configured and we're on the client
    if (typeof window !== 'undefined' && isSupabaseConfigured()) {
      const browserSupabase = getBrowserSupabaseClient();
      if (browserSupabase) {
        // Load tournaments first, then tournament data
        loadTournaments(browserSupabase).then(() => {
          loadTournamentData(undefined, browserSupabase);
        });
        setupRealtimeSubscriptions(browserSupabase);
        
        // Start automatic match status monitoring
        matchStatusManager.startMonitoring();

        // Cleanup subscriptions on unmount
        return () => {
          channels.forEach(channel => {
            browserSupabase.removeChannel(channel);
          });
          
          // Stop match status monitoring
          matchStatusManager.stopMonitoring();
        };
      } else {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
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

  // Load tournaments
  const loadTournaments = async (supabaseClient = supabase) => {
    if (!supabaseClient || typeof window === 'undefined') {
      console.log('No Supabase client or not in browser, creating default tournament...');
      createDefaultTournament();
      return;
    }
    
    try {
      const { data, error } = await supabaseClient
        .from('tournaments')
        .select('*')
        .order('start_date', { ascending: false });

      if (error) {
        // If tournaments table doesn't exist, create a default tournament
        if (error.message.includes('relation "tournaments" does not exist') || 
            error.message.includes('does not exist')) {
          console.log('Tournaments table not found, creating default tournament...');
          createDefaultTournament();
          return;
        }
        console.error('Error loading tournaments:', error);
        // Fallback to default tournament on any error
        createDefaultTournament();
        return;
      }

      if (data && data.length > 0) {
        const transformedTournaments = data.map(transformTournament);
        setTournaments(transformedTournaments);

        // Set current tournament to the first active one, or first available
        const activeTournament = transformedTournaments.find(t => t.status === 'active');
        if (activeTournament) {
          setCurrentTournament(activeTournament);
        } else if (transformedTournaments.length > 0) {
          setCurrentTournament(transformedTournaments[0]);
        }
      } else {
        // No tournaments found, create default
        console.log('No tournaments found in database, creating default tournament...');
        createDefaultTournament();
      }
    } catch (err) {
      console.error('Error loading tournaments:', err);
      // Fallback to default tournament on any error
      createDefaultTournament();
    }
  };

  // Create default tournament
  const createDefaultTournament = () => {
    const defaultTournament: Tournament = {
      id: 1,
      name: 'Patrons Cup 2025',
      slug: 'patrons-cup-2025',
      description: 'Annual Patrons Cup Tournament at Muthaiga Golf Club',
      startDate: '2025-08-22',
      endDate: '2025-08-24',
      status: 'active',
      format: 'patrons_cup',
      divisions: ['Trophy', 'Shield', 'Plaque', 'Bowl', 'Mug'],
      pointSystem: {
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
      },
      settings: {
        course: 'Muthaiga Golf Club',
        maxPlayersPerTeam: 12,
        allowThreeWayMatches: true,
        enableProMatches: true
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    console.log('Setting default tournament:', defaultTournament.name);
    setTournaments([defaultTournament]);
    setCurrentTournament(defaultTournament);
  };

  // Load tournament-specific data
  const loadTournamentData = async (tournamentId?: number, supabaseClient = supabase) => {
    const targetTournamentId = tournamentId || currentTournament?.id;
    if (!targetTournamentId || !supabaseClient || typeof window === 'undefined') {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      // Try to load data with tournament filtering first
      let [teamsRes, playersRes, matchesRes, scoresRes] = await Promise.all([
        supabaseClient.from('teams').select('*').eq('tournament_id', targetTournamentId).order('seed'),
        supabaseClient.from('players').select('*').eq('tournament_id', targetTournamentId).order('name'),
        supabaseClient
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
                last_updated,
                player1_score,
                player2_score,
                player3_score,
                player4_score,
                player1_handicap,
                player2_handicap,
                player3_handicap,
                player4_handicap,
                player1_points,
                player2_points,
                player3_points,
                player4_points,
                player1_id,
                player2_id,
                player3_id,
                player4_id
              )
          `)
          .eq('tournament_id', targetTournamentId)
          .order('game_number')
          .order('hole_number', { referencedTable: 'holes' }),
        supabaseClient.from('scores').select('*').eq('tournament_id', targetTournamentId).order('points', { ascending: false })
      ]);

      // If tournament_id column doesn't exist, fall back to loading all data
      if (teamsRes.error && (teamsRes.error.message.includes('column "tournament_id" does not exist') || 
                             teamsRes.error.message.includes('does not exist'))) {
        console.log('tournament_id column not found, loading all data...');
        [teamsRes, playersRes, matchesRes, scoresRes] = await Promise.all([
          supabaseClient.from('teams').select('*').order('seed'),
          supabaseClient.from('players').select('*').order('name'),
          supabaseClient
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
                last_updated,
                player1_score,
                player2_score,
                player3_score,
                player4_score,
                player1_handicap,
                player2_handicap,
                player3_handicap,
                player4_handicap,
                player1_points,
                player2_points,
                player3_points,
                player4_points,
                player1_id,
                player2_id,
                player3_id,
                player4_id
              )
            `)
            .order('game_number')
            .order('hole_number', { referencedTable: 'holes' }),
          supabaseClient.from('scores').select('*').order('points', { ascending: false })
        ]);
      }

      if (teamsRes.error) {
        console.error('Error fetching teams:', {
          message: teamsRes.error.message,
          details: teamsRes.error.details,
          hint: teamsRes.error.hint,
          code: teamsRes.error.code
        });
        throw teamsRes.error;
      }
      
      if (playersRes.error) {
        console.error('Error fetching players:', {
          message: playersRes.error.message,
          details: playersRes.error.details,
          hint: playersRes.error.hint,
          code: playersRes.error.code
        });
        throw playersRes.error;
      }
      
      if (matchesRes.error) {
        console.error('Error fetching matches:', {
          message: matchesRes.error.message,
          details: matchesRes.error.details,
          hint: matchesRes.error.hint,
          code: matchesRes.error.code
        });
        throw matchesRes.error;
      }
      
      if (scoresRes.error) {
        console.error('Error fetching scores:', {
          message: scoresRes.error.message,
          details: scoresRes.error.details,
          hint: scoresRes.error.hint,
          code: scoresRes.error.code
        });
        throw scoresRes.error;
      }
      
      // Log teams data for debugging
      console.log('📊 Teams data loaded:', {
        count: teamsRes.data.length,
        divisions: [...new Set(teamsRes.data.map(team => team.division))],
        teamNames: teamsRes.data.map(team => team.name)
      });

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
        pointsPerMatch: team.points_per_match,
        tournamentId: team.tournament_id,
        tournament_id: team.tournament_id
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
        isJunior: player.is_junior,
        tournamentId: player.tournament_id,
        tournament_id: player.tournament_id
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
      setLoading(false);

    } catch (error) {
      console.error('Error loading initial data:', error);
      setLoading(false);
    }
  };

  // Switch tournament
  const switchTournament = async (tournamentId: number) => {
    try {
      setIsSwitching(true);
      
      console.log('🔄 Switching to tournament ID:', tournamentId);
      console.log('📊 Available tournaments:', tournaments.map(t => ({ id: t.id, name: t.name, slug: t.slug })));
      
      const tournament = tournaments.find(t => t.id === tournamentId);
      if (!tournament) {
        console.error('❌ Tournament not found in tournaments array:', tournamentId);
        throw new Error(`Tournament not found: ${tournamentId}`);
      }

      console.log('✅ Found tournament:', tournament.name);
      setCurrentTournament(tournament);
      await loadTournamentData(tournamentId);

      // Store current tournament in localStorage for persistence
      localStorage.setItem('currentTournamentId', tournamentId.toString());

    } catch (err) {
      console.error('Error switching tournament:', err);
    } finally {
      setIsSwitching(false);
    }
  };

  // Tournament data transformation
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

  const setupRealtimeSubscriptions = (supabaseClient = supabase) => {
    const newChannels: RealtimeChannel[] = [];

    // Subscribe to matches changes
    const matchesChannel = supabaseClient
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
    const holesChannel = supabaseClient
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
            teamCScore: payload.new?.team_c_score,
            status: payload.new?.status
          });
          handleHoleUpdate(payload);
        }
      )
      .subscribe();

    // Subscribe to scores changes
    const scoresChannel = supabaseClient
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
    tournamentId: supabaseMatch.tournament_id,
    tournament_id: supabaseMatch.tournament_id,
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
    lastUpdated: supabaseHole.last_updated,
    // Individual player scoring for Nancy Millar Trophy (with fallbacks for missing columns)
    player1Score: supabaseHole.player1_score || null,
    player2Score: supabaseHole.player2_score || null,
    player3Score: supabaseHole.player3_score || null,
    player4Score: supabaseHole.player4_score || null,
    player1Handicap: supabaseHole.player1_handicap || null,
    player2Handicap: supabaseHole.player2_handicap || null,
    player3Handicap: supabaseHole.player3_handicap || null,
    player4Handicap: supabaseHole.player4_handicap || null,
    player1Points: supabaseHole.player1_points || null,
    player2Points: supabaseHole.player2_points || null,
    player3Points: supabaseHole.player3_points || null,
    player4Points: supabaseHole.player4_points || null,
    player1Id: supabaseHole.player1_id || null,
    player2Id: supabaseHole.player2_id || null,
    player3Id: supabaseHole.player3_id || null,
    player4Id: supabaseHole.player4_id || null
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

  // Manual refresh function for all tournament data
  const refreshAllTournamentData = async () => {
    try {
      console.log('🔄 Refreshing all tournament data...', {
        currentTournamentId: currentTournament?.id,
        currentTournamentSlug: currentTournament?.slug
      });
      await loadTournamentData(currentTournament?.id || 1);
      console.log('✅ Tournament data refreshed successfully');
    } catch (error) {
      console.error('❌ Error refreshing tournament data:', {
        error: error,
        message: error?.message,
        details: error?.details,
        code: error?.code
      });
    }
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
                last_updated,
                player1_score,
                player2_score,
                player3_score,
                player4_score,
                player1_handicap,
                player2_handicap,
                player3_handicap,
                player4_handicap,
                player1_points,
                player2_points,
                player3_points,
                player4_points,
                player1_id,
                player2_id,
                player3_id,
                player4_id
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
    refreshAllTournamentData,
    getTeamById,
    getPlayersByTeamId,
    getMatchById,
    getScoreByTeamId,
    
    // Multi-tournament support
    currentTournament,
    tournaments,
    isSwitching,
    switchTournament
  };

  return (
    <TournamentContext.Provider value={value}>
      {children}
    </TournamentContext.Provider>
  );
};
