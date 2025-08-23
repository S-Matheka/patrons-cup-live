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
      // 3-team stroke play scoring
      const holesData = match.holes.map(hole => ({
        holeNumber: hole.number,
        par: hole.par || 4,
        teamAStrokes: hole.teamAScore,
        teamBStrokes: hole.teamBScore,
        teamCStrokes: hole.teamCScore
      }));

      const result = calculateThreeWayResult(holesData, 18);
      
      if (result.status === 'completed') {
        if (result.leader === 'tied') {
          return result.result; // "All Teams Tied" or "Team A & Team B Tied for Lead"
        } else {
          const winnerName = result.leader === 'teamA' ? teamA.name : 
                           result.leader === 'teamB' ? teamB.name : 
                           teamC.name;
          return `${winnerName} wins (${result.result})`;
        }
      } else {
        return result.result; // "Team A leads by 2" etc.
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
          return 'Match Halved (AS)';
        } else {
          const winnerName = result.winner === 'teamA' ? teamA.name : teamB.name;
          return `${winnerName} wins ${score}`;
        }
      } else {
        // Match in progress
        if (result.result === 'AS') {
          return 'All Square';
        } else {
          const leaderName = result.teamAHolesWon > result.teamBHolesWon ? teamA.name : teamB.name;
          return `${leaderName} ${score}`;
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
    // Allow saving even with empty/zero values for holes that weren't played
    const hasAnyInput = tempScores.teamA !== null || tempScores.teamB !== null || 
                       (match.isThreeWay && tempScores.teamC !== null);
    
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
              status: 'completed' as const // Allow saving with null values for holes not played
            }
          : hole
      );

      // Check if match is automatically completed due to match play rules
      const holesData = updatedHoles.map(hole => ({
        holeNumber: hole.number,
        par: hole.par || 4,
        teamAStrokes: hole.teamAScore ?? 0, // Use teamAScore (null coalescing for proper null check)
        teamBStrokes: hole.teamBScore ?? 0  // Use teamBScore (null coalescing for proper null check)
      }));

      const matchPlayResult = calculateMatchPlayResult(holesData, 18);
      const isMatchComplete = matchPlayResult.status === 'completed';

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
        console.log(`Result: ${matchPlayResult.result}, Winner: ${matchPlayResult.winner}`);
        
        // Update tournament standings
        await updateTournamentStandings(updatedMatch, matchPlayResult);
      }
    }
  };



  const updateTournamentStandings = async (completedMatch: Match, result: any) => {
    try {
      console.log('📊 Updating tournament standings...');
      
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

      {/* Mobile-Optimized Score Grid */}
      <div className="p-3 sm:p-6">
        {/* Hide desktop scorecard on mobile, show simplified version */}
        <div className="hidden sm:block">
          <div className="overflow-x-auto">
            <div className="grid grid-cols-11 gap-2 mb-4 min-w-max">
              <div className="text-center font-medium text-gray-600">Hole</div>
              {match.holes
                .sort((a, b) => a.number - b.number)
                .map(hole => (
                <div key={hole.number} className="text-center font-medium text-gray-600 min-w-8">
                  {hole.number}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-11 gap-2 mb-4 min-w-max">
              <div className="text-center font-medium text-gray-600">Team A</div>
              {match.holes
                .sort((a, b) => a.number - b.number)
                .map(hole => (
                <div key={hole.number} className="text-center min-w-8">
                  {hole.teamAScore !== null ? hole.teamAScore : '-'}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-11 gap-2 mb-4 min-w-max">
              <div className="text-center font-medium text-gray-600">Team B</div>
              {match.holes
                .sort((a, b) => a.number - b.number)
                .map(hole => (
                <div key={hole.number} className="text-center min-w-8">
                  {hole.teamBScore !== null ? hole.teamBScore : '-'}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-11 gap-2 mb-6 min-w-max">
              <div className="text-center font-medium text-gray-600">Winner</div>
              {match.holes.map(hole => {
                const winner = getHoleWinner(hole);
                return (
                  <div key={hole.number} className="text-center min-w-8">
                    {winner === 'A' ? (
                      <span className="text-blue-600 font-bold">A</span>
                    ) : winner === 'B' ? (
                      <span className="text-red-600 font-bold">B</span>
                    ) : winner === 'TIE' ? (
                      <span className="text-gray-500">T</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mobile Quick Score Summary */}
        <div className="sm:hidden mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-800 mb-3 text-center">Current Scores</h3>
            <div className="grid grid-cols-6 gap-1 text-xs">
              <div className="text-center font-medium text-gray-600 py-1">Hole</div>
              {match.holes
                .sort((a, b) => a.number - b.number)
                .slice(0, 5)
                .map(hole => (
                <div key={hole.number} className="text-center font-medium text-gray-600 py-1">
                  {hole.number}
                </div>
              ))}
              
              <div className="text-center font-medium text-gray-600 py-1">A</div>
              {match.holes
                .sort((a, b) => a.number - b.number)
                .slice(0, 5)
                .map(hole => (
                <div key={hole.number} className="text-center py-1">
                  {hole.teamAScore !== null ? hole.teamAScore : '-'}
                </div>
              ))}
              
              <div className="text-center font-medium text-gray-600 py-1">B</div>
              {match.holes
                .sort((a, b) => a.number - b.number)
                .slice(0, 5)
                .map(hole => (
                <div key={hole.number} className="text-center py-1">
                  {hole.teamBScore !== null ? hole.teamBScore : '-'}
                </div>
              ))}
            </div>
            <div className="text-center text-xs text-gray-500 mt-2">
              Showing holes 1-5 • Scroll down to edit individual holes
            </div>
          </div>
        </div>

        {/* Mobile-Optimized Hole-by-Hole Editing */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">Edit Scores</h3>
            <button
              onClick={() => refreshMatchData(match.id)}
              className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              title="Refresh match data if scores are not showing"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Refresh
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {match.holes
              .sort((a, b) => a.number - b.number)
              .map(hole => (
              <div key={hole.number} className={`border rounded-lg p-4 ${!timingInfo.canScore ? 'opacity-60 bg-gray-50' : 'bg-white'}`}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-lg">Hole {hole.number}</h4>
                  {getHoleStatusIcon(hole)}
                </div>
                
                {editingHole === hole.number && timingInfo.canScore ? (
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
                          placeholder="Score or leave blank"
                          value={tempScores.teamA === null ? '' : tempScores.teamA}
                          onChange={(e) => setTempScores(prev => ({ 
                            ...prev, 
                            teamA: e.target.value === '' ? null : parseInt(e.target.value) || 0
                          }))}
                          className="w-full px-4 py-3 text-lg border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                          placeholder="Score or leave blank"
                          value={tempScores.teamB === null ? '' : tempScores.teamB}
                          onChange={(e) => setTempScores(prev => ({ 
                            ...prev, 
                            teamB: e.target.value === '' ? null : parseInt(e.target.value) || 0
                          }))}
                          className="w-full px-4 py-3 text-lg border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                            placeholder="Score or leave blank"
                            value={tempScores.teamC === null ? '' : tempScores.teamC}
                            onChange={(e) => setTempScores(prev => ({ 
                              ...prev, 
                              teamC: e.target.value === '' ? null : parseInt(e.target.value) || 0
                            }))}
                            className="w-full px-4 py-3 text-lg border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          />
                        </div>
                      )}
                    </div>
                    
                    {/* Helper text for empty/zero values */}
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-700">
                      <p className="font-medium mb-1">💡 Scoring Tips:</p>
                      <ul className="text-xs space-y-1">
                        <li>• <strong>Leave blank</strong> for holes not played (match ended early)</li>
                        <li>• <strong>Enter 0</strong> for holes where no score was recorded</li>
                        <li>• <strong>Enter actual score</strong> for completed holes</li>
                      </ul>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSaveHole}
                        className="flex-1 flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-base font-medium"
                      >
                        <Save className="w-5 h-5 mr-2" />
                        Save
                      </button>
                      <button
                        onClick={() => setEditingHole(null)}
                        className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-base font-medium"
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
                      className={`w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md transition-colors text-base font-medium ${
                        timingInfo.canScore 
                          ? 'text-gray-700 hover:bg-gray-50 border-green-300 hover:border-green-500' 
                          : 'text-gray-400 cursor-not-allowed bg-gray-100'
                      }`}
                      title={timingInfo.canScore ? "Edit scores for this hole" : timingInfo.reason}
                    >
                      {timingInfo.canScore ? (
                        <>
                          <Edit className="w-5 h-5 mr-2" />
                          Edit Hole {hole.number}
                        </>
                      ) : (
                        <>
                          <Lock className="w-5 h-5 mr-2" />
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
    </div>
  );
};

export default ScoreCard; 