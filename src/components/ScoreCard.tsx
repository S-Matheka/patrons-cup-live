'use client';

import { Match, Team, Hole } from '@/types';
import { Save, Edit, CheckCircle, Circle, Clock, Play, AlertTriangle, Lock, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { calculateMatchPlayResult, getMatchStatusDescription, formatMatchPlayScore, calculateThreeWayResult, ThreeWayResult } from '@/utils/matchPlayScoring';
import { canScoreMatch, MatchTimingInfo } from '@/utils/matchTiming';
import { useAuth } from '@/context/AuthContext';
import { useTournament } from '@/context/TournamentContextSwitcher';
import { supabase } from '@/lib/supabase';
import { getAdminClient } from '@/lib/supabase-admin';

interface ScoreCardProps {
  match: Match;
  teamA: Team;
  teamB: Team;
  teamC?: Team | null; // For 3-way matches
  onSave: (updatedMatch: Match) => void;
}

const ScoreCard: React.FC<ScoreCardProps> = ({ match, teamA, teamB, teamC, onSave }) => {
  const { refreshMatchData } = useTournament();
  
  // Debug logging to see what data we're receiving
  console.log('🎯 ScoreCard received match data:', {
    matchId: match.id,
    holesCount: match.holes?.length || 0,
    holesWithScores: match.holes?.filter(h => h.teamAScore !== null || h.teamBScore !== null).length || 0,
    firstFewHoles: match.holes?.slice(0, 3).map(h => ({
      hole: h.number,
      teamA: h.teamAScore,
      teamB: h.teamBScore,
      status: h.status
    }))
  });
  const [editingHole, setEditingHole] = useState<number | null>(null);
  const [tempScores, setTempScores] = useState<{ 
    teamA: number | null; 
    teamB: number | null; 
    teamC?: number | null;
  }>({
    teamA: null,
    teamB: null,
    ...(match.isThreeWay && { teamC: null })
  });
  const [isStartingMatch, setIsStartingMatch] = useState(false);
  
  const { isAdmin } = useAuth();
  const { updateMatch } = useTournament();

  // Check if scoring is allowed
  const timingInfo: MatchTimingInfo = canScoreMatch(
    match.status,
    match.date,
    match.teeTime,
    isAdmin
  );

  const calculateMatchStatus = () => {
    if (match.isThreeWay && teamC) {
      // 3-team match play scoring (hole-by-hole wins)
      const holesData = match.holes.map(hole => ({
        holeNumber: hole.number,
        par: hole.par || 4,
        teamAScore: hole.teamAScore,
        teamBScore: hole.teamBScore,
        teamCScore: hole.teamCScore
      }));

      const result = calculateThreeWayResult(holesData, 18);
      
      if (result.status === 'completed') {
        if (result.leader === 'tied') {
          return result.result; // "All Teams Tied" or "Team A & Team B Tied for Lead"
        } else {
          const winnerName = result.leader === 'teamA' ? teamA.name : 
                           result.leader === 'teamB' ? teamB.name : 
                           teamC.name;
          const opponents = [teamA.name, teamB.name, teamC.name]
            .filter(name => name !== winnerName)
            .join(' & ');
          return `${winnerName} wins against ${opponents} (${result.result})`;
        }
      } else {
        // For 3-way matches in progress, show who the leader is leading against
        if (result.leader === 'tied') {
          return result.result; // "All Square" or "Team A & Team B Tied for Lead"
        } else {
          const leaderName = result.leader === 'teamA' ? teamA.name : 
                            result.leader === 'teamB' ? teamB.name : 
                            teamC.name;
          const opponents = [teamA.name, teamB.name, teamC.name]
            .filter(name => name !== leaderName)
            .join(' & ');
          return `${leaderName} leads against ${opponents} (${result.result})`;
        }
      }
    } else {
      // 2-team match play scoring
      const holesData = match.holes.map(hole => ({
        holeNumber: hole.number,
        par: hole.par || 4,
        teamAStrokes: hole.teamAScore ?? 0,
        teamBStrokes: hole.teamBScore ?? 0
      }));

      const result = calculateMatchPlayResult(holesData, 18);
      
      // Format the match play result for display with actual team names
      const score = formatMatchPlayScore(result);
      
      if (result.status === 'completed') {
        if (result.winner === 'halved') {
          return `${teamA.name} & ${teamB.name} Match Halved (AS)`;
        } else {
          const winnerName = result.winner === 'teamA' ? teamA.name : teamB.name;
          const loserName = result.winner === 'teamA' ? teamB.name : teamA.name;
          return `${winnerName} wins against ${loserName} ${score}`;
        }
      } else {
        // Match in progress
        if (result.result === 'AS') {
          return `${teamA.name} & ${teamB.name} All Square`;
        } else {
          const leaderName = result.teamAHolesWon > result.teamBHolesWon ? teamA.name : teamB.name;
          const trailingName = result.teamAHolesWon > result.teamBHolesWon ? teamB.name : teamA.name;
          return `${leaderName} leads against ${trailingName} ${score}`;
        }
      }
    }
  };

  const handleEditHole = (holeNumber: number) => {
    // Prevent editing if scoring is not allowed
    if (!timingInfo.canScore) {
      return;
    }
    
    const hole = match.holes.find(h => h.number === holeNumber);
    setTempScores({
      teamA: hole?.teamAScore || null,
      teamB: hole?.teamBScore || null,
      ...(match.isThreeWay && { teamC: hole?.teamCScore || null })
    });
    setEditingHole(holeNumber);
  };

  const handleStartMatch = async () => {
    if (!isAdmin || isStartingMatch) return;
    
    setIsStartingMatch(true);
    try {
      const updatedMatch = {
        ...match,
        status: 'in-progress'
      };
      
      await updateMatch(updatedMatch);
      onSave(updatedMatch);
    } catch (error) {
      console.error('Failed to start match:', error);
    } finally {
      setIsStartingMatch(false);
    }
  };

  const handleSaveHole = async () => {
    if (editingHole !== null) {
      console.log('💾 Saving hole scores:', {
        holeNumber: editingHole,
        teamAScore: tempScores.teamA,
        teamBScore: tempScores.teamB,
        ...(match.isThreeWay && { teamCScore: tempScores.teamC }),
        matchId: match.id
      });
      
      const updatedHoles = match.holes.map(hole => 
        hole.number === editingHole 
          ? {
                          ...hole,
            teamAScore: tempScores.teamA,
            teamBScore: tempScores.teamB,
            ...(match.isThreeWay && { teamCScore: tempScores.teamC }),
            status: 'completed' as const
            }
          : hole
      );

      // Check if match is automatically completed based on match type
      let isMatchComplete = false;
      
      if (match.isThreeWay) {
        // 3-team stroke play (Foursomes)
        const holesData = updatedHoles.map(hole => ({
          holeNumber: hole.number,
          par: hole.par || 4,
          teamAScore: hole.teamAScore,
          teamBScore: hole.teamBScore,
          teamCScore: hole.teamCScore
        }));
        
        const threeWayResult = calculateThreeWayResult(holesData, 18);
        isMatchComplete = threeWayResult.status === 'completed';
      } else {
        // 2-team match play (4BBB, Singles)
        const holesData = updatedHoles.map(hole => ({
          holeNumber: hole.number,
          par: hole.par || 4,
          teamAStrokes: hole.teamAScore ?? 0,
          teamBStrokes: hole.teamBScore ?? 0
        }));
        
        const matchPlayResult = calculateMatchPlayResult(holesData, 18);
        isMatchComplete = matchPlayResult.status === 'completed';
      }

      const updatedMatch: Match = {
        ...match,
        holes: updatedHoles,
        status: isMatchComplete ? 'completed' : 'in-progress'
      };

      // Save the hole score to database using admin client
      console.log('🔄 Saving hole score to database...');
      try {
        const adminClient = getAdminClient();
        if (!adminClient) {
          throw new Error('Admin client not available');
        }

        // Get the current hole to preserve the par value
        const currentHole = match.holes.find(h => h.number === editingHole);
        const parValue = currentHole?.par || 4; // Default to par 4 if not found

        // Update the specific hole
        const { data, error } = await adminClient
          .from('holes')
          .upsert({
            match_id: match.id,
            hole_number: editingHole,
            par: parValue, // Include the par value
            team_a_score: tempScores.teamA,
            team_b_score: tempScores.teamB,
            team_c_score: match.isThreeWay ? tempScores.teamC : null,
            team_a_strokes: tempScores.teamA, // Add strokes for match play calculation
            team_b_strokes: tempScores.teamB, // Add strokes for match play calculation
            team_c_strokes: match.isThreeWay ? tempScores.teamC : null, // Add strokes for match play calculation
            status: 'completed',
            last_updated: new Date().toISOString()
          }, {
            onConflict: 'match_id,hole_number'
          })
          .select()
          .single();

        if (error) {
          throw new Error(`Database error: ${error.message}`);
        }

        // If match is complete, update the match status in database
        if (isMatchComplete) {
          console.log(`🏆 Match ${match.id} completed! Updating match status to 'completed'`);
          
          const { error: matchStatusError } = await adminClient
            .from('matches')
            .update({ 
              status: 'completed'
            })
            .eq('id', match.id);

          if (matchStatusError) {
            console.error('❌ Failed to update match status:', matchStatusError);
          } else {
            console.log('✅ Match status updated to completed');
          }
        }

        console.log('✅ Hole score saved successfully:', data);
        
        // Update local state immediately for better UX while real-time subscription catches up
        console.log('🔄 Updating parent component with new match data:', {
          matchId: updatedMatch.id,
          holesCount: updatedMatch.holes.length,
          holesWithScores: updatedMatch.holes.filter(h => h.teamAScore !== null || h.teamBScore !== null).length,
          updatedHole: editingHole,
          updatedHoleData: updatedMatch.holes.find(h => h.number === editingHole)
        });
        onSave(updatedMatch);
        
        // Close the editing mode and reset temp scores
        setEditingHole(null);
        setTempScores({ 
          teamA: null, 
          teamB: null,
          ...(match.isThreeWay && { teamC: null })
        });
        
        // Force a small delay to ensure the state update is processed
        setTimeout(() => {
          console.log('🔄 Forcing state refresh after save...');
          // This will trigger a re-render and should show the updated scores
        }, 100);
        
        // Real-time subscription will also update when it receives the change
        // If real-time fails, the context will need to be refreshed manually
      } catch (error) {
        console.error('❌ Failed to save hole score to database:', error);
        
        // Provide user-friendly error message
        const errorMessage = error instanceof Error ? error.message : String(error);
        alert(`Warning: Failed to save to database. Your changes may not be visible to other users.\n\nError: ${errorMessage}`);
      }

      // If match is complete, update tournament standings
      if (isMatchComplete) {
        console.log(`🏆 Match ${match.id} completed automatically!`);
        
        if (match.isThreeWay) {
          // 3-team stroke play result
          const holesData = updatedHoles.map(hole => ({
            holeNumber: hole.number,
            par: hole.par || 4,
            teamAScore: hole.teamAScore,
            teamBScore: hole.teamBScore,
            teamCScore: hole.teamCScore
          }));
          
          const threeWayResult = calculateThreeWayResult(holesData, 18);
          console.log(`3-team result: ${threeWayResult.result}, Leader: ${threeWayResult.leader}`);
          
          // Update tournament standings for 3-team match
          await updateTournamentStandings(updatedMatch, threeWayResult);
        } else {
          // 2-team match play result
          const holesData = updatedHoles.map(hole => ({
            holeNumber: hole.number,
            par: hole.par || 4,
            teamAStrokes: hole.teamAScore ?? 0,
            teamBStrokes: hole.teamBScore ?? 0
          }));
          
          const matchPlayResult = calculateMatchPlayResult(holesData, 18);
          console.log(`2-team result: ${matchPlayResult.result}, Winner: ${matchPlayResult.winner}`);
          
          // Update tournament standings for 2-team match
          await updateTournamentStandings(updatedMatch, matchPlayResult);
        }
      }
    }
  };



  const updateTournamentStandings = async (completedMatch: Match, result: any) => {
    try {
      console.log('📊 Updating tournament standings...');
      
      if (completedMatch.isThreeWay) {
        // Handle 3-team stroke play (Foursomes)
        const teamAId = completedMatch.teamAId;
        const teamBId = completedMatch.teamBId;
        const teamCId = completedMatch.teamCId;
        
        if (!teamAId || !teamBId || !teamCId) return;

        // For 3-team stroke play, determine positions based on total scores
        const scores = [
          { teamId: teamAId, total: result.teamATotal },
          { teamId: teamBId, total: result.teamBTotal },
          { teamId: teamCId, total: result.teamCTotal }
        ].sort((a, b) => a.total - b.total);

        // 1st place (winner) gets win points, 2nd place gets tie points, 3rd place gets 0
        const winnerId = scores[0].teamId;
        const secondPlaceId = scores[1].teamId;
        const thirdPlaceId = scores[2].teamId;

        // Update standings for all three teams
        await updateTeamStandings(winnerId, {
          points: 1, // Win
          matchesPlayed: 1,
          matchesWon: 1,
          matchesLost: 0,
          matchesHalved: 0
        });

        await updateTeamStandings(secondPlaceId, {
          points: 0.5, // Tie for second
          matchesPlayed: 1,
          matchesWon: 0,
          matchesLost: 0,
          matchesHalved: 1
        });

        await updateTeamStandings(thirdPlaceId, {
          points: 0, // Loss
          matchesPlayed: 1,
          matchesWon: 0,
          matchesLost: 1,
          matchesHalved: 0
        });

      } else {
        // Handle 2-team match play (4BBB, Singles)
        const teamAId = completedMatch.teamAId;
        const teamBId = completedMatch.teamBId;
        
        if (!teamAId || !teamBId) return;

        // Determine points based on result
        let teamAPoints = 0;
        let teamBPoints = 0;
        let teamAWon = 0;
        let teamBWon = 0;
        let teamALost = 0;
        let teamBLost = 0;
        let teamAHalved = 0;
        let teamBHalved = 0;

        if (result.winner === 'teamA') {
          teamAPoints = 1;
          teamAWon = 1;
          teamBLost = 1;
        } else if (result.winner === 'teamB') {
          teamBPoints = 1;
          teamBWon = 1;
          teamALost = 1;
        } else if (result.winner === 'halved') {
          teamAPoints = 0.5;
          teamBPoints = 0.5;
          teamAHalved = 1;
          teamBHalved = 1;
        }

        // Update both teams' standings
        await updateTeamStandings(teamAId, {
          points: teamAPoints,
          matchesPlayed: 1,
          matchesWon: teamAWon,
          matchesLost: teamALost,
          matchesHalved: teamAHalved,
          holesWon: result.teamAHolesWon,
          holesLost: result.teamBHolesWon
        });

        await updateTeamStandings(teamBId, {
          points: teamBPoints,
          matchesPlayed: 1,
          matchesWon: teamBWon,
          matchesLost: teamBLost,
          matchesHalved: teamBHalved,
          holesWon: result.teamBHolesWon,
          holesLost: result.teamAHolesWon
        });
      }

      console.log('✅ Tournament standings updated successfully');
      
    } catch (error) {
      console.error('❌ Failed to update tournament standings:', error);
    }
  };

  const updateTeamStandings = async (teamId: number, matchResult: any) => {
    try {
      // Get current standings
      const { data: currentStandings } = await supabase
        .from('scores')
        .select('*')
        .eq('team_id', teamId)
        .single();

      if (currentStandings) {
        // Update existing standings
        const updatedStandings = {
          points: currentStandings.points + matchResult.points,
          matches_played: currentStandings.matches_played + matchResult.matchesPlayed,
          matches_won: currentStandings.matches_won + matchResult.matchesWon,
          matches_lost: currentStandings.matches_lost + matchResult.matchesLost,
          matches_halved: currentStandings.matches_halved + matchResult.matchesHalved,
          holes_won: currentStandings.holes_won + matchResult.holesWon,
          holes_lost: currentStandings.holes_lost + matchResult.holesLost,
          last_updated: new Date().toISOString()
        };

        await supabase
          .from('scores')
          .update(updatedStandings)
          .eq('team_id', teamId);
      }
    } catch (error) {
      console.error(`Failed to update standings for team ${teamId}:`, error);
    }
  };

  const handleClearAllScores = async () => {
    if (!isAdmin) return;
    
    if (!confirm('Clear all scores for this match and reset to scheduled?')) {
      return;
    }
    
    try {
      const clearedHoles = match.holes.map(hole => ({
        ...hole,
        teamAScore: null,
        teamBScore: null,
        status: 'not-started' as const
      }));

      const clearedMatch: Match = {
        ...match,
        holes: clearedHoles,
        status: 'scheduled'
      };

      await updateMatch(clearedMatch);
      onSave(clearedMatch);
      
      // Force immediate UI refresh
      setTimeout(() => {
        window.location.reload();
      }, 500);
      
    } catch (error) {
      console.error('Failed to clear scores:', error);
      alert('Failed to clear scores. Please try again.');
    }
  };

  const getHoleStatusIcon = (hole: Hole) => {
    switch (hole.status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'in-progress':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <Circle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getHoleWinner = (hole: Hole) => {
    if (hole.teamAScore === null || hole.teamBScore === null) return null;
    if (hole.teamAScore < hole.teamBScore) return 'A';
    if (hole.teamBScore < hole.teamAScore) return 'B';
    return 'TIE';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Match Status Alert */}
      {!timingInfo.canScore && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center">
            <div className="flex items-center mb-2 sm:mb-0 sm:flex-shrink-0">
              {timingInfo.hasStarted ? (
                <AlertTriangle className="h-5 w-5 text-yellow-400 mr-2" />
              ) : (
                <Lock className="h-5 w-5 text-yellow-400 mr-2" />
              )}
              <p className="text-sm font-medium text-yellow-800">
                {timingInfo.hasStarted ? 'Match Status Update Required' : 'Match Not Started'}
              </p>
            </div>
            {isAdmin && !timingInfo.hasStarted && (
              <div className="w-full sm:w-auto sm:ml-4">
                <button
                  onClick={handleStartMatch}
                  disabled={isStartingMatch}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {isStartingMatch ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Start Match
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
          <p className="text-sm text-yellow-700 mt-1">
            {timingInfo.reason}
          </p>
        </div>
      )}

      {/* Mobile-Optimized Match Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 p-4 sm:p-6 text-white">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-2 sm:space-y-0">
          <h2 className="text-xl sm:text-2xl font-bold">Match #{match.id}</h2>
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
            {isAdmin && (
              <button
                onClick={handleClearAllScores}
                className="inline-flex items-center px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                title="Clear all scores and reset to scheduled"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Clear All
              </button>
            )}
            <div className="text-left sm:text-right">
              <div className="text-sm opacity-90">{match.teeTime}</div>
              <div className="text-xs opacity-75 capitalize">
                {match.status.replace('-', ' ')}
                {timingInfo.isOverdue && ' (Overdue)'}
              </div>
              {match.status === 'in-progress' && (
                <div className="text-xs opacity-75 mt-1">
                  🏆 Auto-completes when won
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Mobile-Optimized Team Display */}
        <div className="space-y-4 sm:space-y-0 sm:flex sm:justify-between sm:items-center">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div 
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white text-lg sm:text-xl font-bold"
              style={{ backgroundColor: teamA.color }}
            >
              {teamA.logo}
            </div>
            <div>
              <div className="font-bold text-base sm:text-lg">{teamA.name}</div>
              <div className="text-xs sm:text-sm opacity-90">{teamA.description}</div>
            </div>
          </div>
          
          <div className="text-center py-2">
            <div className="text-xl sm:text-3xl font-bold">{calculateMatchStatus()}</div>
            <div className="text-xs sm:text-sm opacity-90">Match Status</div>
          </div>
          
          <div className="flex items-center space-x-3 sm:space-x-4 sm:flex-row-reverse">
            <div 
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white text-lg sm:text-xl font-bold"
              style={{ backgroundColor: teamB.color }}
            >
              {teamB.logo}
            </div>
            <div className="text-left sm:text-right">
              <div className="font-bold text-base sm:text-lg">{teamB.name}</div>
              <div className="text-xs sm:text-sm opacity-90">{teamB.description}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Hole-by-Hole Table */}
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Hole-by-Hole Scores</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hole</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Par</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{teamA.name}</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{teamB.name}</th>
                {match.isThreeWay && teamC && (
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{teamC.name}</th>
                )}
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {match.holes.map((hole) => (
                <tr key={hole.number} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    {hole.number}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-500">
                    {hole.par}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                    {hole.teamAScore !== null ? (
                      <span className="font-medium text-gray-900">{hole.teamAScore}</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                    {hole.teamBScore !== null ? (
                      <span className="font-medium text-gray-900">{hole.teamBScore}</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  {match.isThreeWay && teamC && (
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                      {hole.teamCScore !== null ? (
                        <span className="font-medium text-gray-900">{hole.teamCScore}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  )}
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                    {getHoleStatusIcon(hole)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hole Cards for Scoring */}
      <div className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {match.holes.map((hole) => (
            <div key={hole.number} className={`border rounded-lg p-4 ${editingHole === hole.number ? 'border-green-500 ring-1 ring-green-500' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {hole.number}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Hole {hole.number}</div>
                    <div className="text-xs text-gray-600">Par {hole.par}</div>
                  </div>
                </div>
                {getHoleStatusIcon(hole)}
              </div>

              {editingHole === hole.number ? (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {teamA.name} Score
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={tempScores.teamA === null ? '' : tempScores.teamA}
                        onChange={(e) => setTempScores(prev => ({
                          ...prev,
                          teamA: e.target.value === '' ? null : parseInt(e.target.value)
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {teamB.name} Score
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={tempScores.teamB === null ? '' : tempScores.teamB}
                        onChange={(e) => setTempScores(prev => ({
                          ...prev,
                          teamB: e.target.value === '' ? null : parseInt(e.target.value)
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    {match.isThreeWay && teamC && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {teamC.name} Score
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={tempScores.teamC === null ? '' : tempScores.teamC}
                          onChange={(e) => setTempScores(prev => ({
                            ...prev,
                            teamC: e.target.value === '' ? null : parseInt(e.target.value)
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSaveHole}
                      className="flex-1 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </button>
                    <button
                      onClick={() => setEditingHole(null)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm font-medium">{teamA.name}:</span>
                      <span className="text-lg font-bold text-blue-600">{hole.teamAScore !== null ? hole.teamAScore : '-'}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm font-medium">{teamB.name}:</span>
                      <span className="text-lg font-bold text-red-600">{hole.teamBScore !== null ? hole.teamBScore : '-'}</span>
                    </div>
                    {match.isThreeWay && teamC && (
                      <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm font-medium">{teamC.name}:</span>
                        <span className="text-lg font-bold text-purple-600">{hole.teamCScore !== null ? hole.teamCScore : '-'}</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleEditHole(hole.number)}
                    disabled={!timingInfo.canScore}
                    className={`w-full flex items-center justify-center px-4 py-2 border rounded-md transition-colors ${
                      timingInfo.canScore 
                        ? 'text-gray-700 hover:bg-gray-50 border-green-300 hover:border-green-500' 
                        : 'text-gray-400 cursor-not-allowed bg-gray-100'
                    }`}
                  >
                    {timingInfo.canScore ? (
                      <>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Scores
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 mr-2" />
                        Locked
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Scoring Status Footer */}
      {!timingInfo.canScore && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
          <div className="flex items-start text-sm text-gray-600">
            <Lock className="w-4 h-4 mr-2 text-gray-500 mt-0.5 flex-shrink-0" />
            <div>
              <span className="block">
                {timingInfo.hasStarted 
                  ? 'Match status needs to be updated to enable scoring'
                  : `Scoring will be enabled when the match starts${timingInfo.timeUntilStart ? ` (in ${timingInfo.timeUntilStart})` : ''}`
                }
              </span>
              {!timingInfo.hasStarted && timingInfo.timeUntilStart && (
                <div className="mt-2 text-xs text-gray-500">
                  Tee time: {match.teeTime} on {match.date}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScoreCard; 