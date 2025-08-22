'use client';

import { Match, Team, Hole } from '@/types';
import { Save, Edit, CheckCircle, Circle, Clock, Play, AlertTriangle, Lock, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { calculateMatchPlayResult, getMatchStatusDescription, formatMatchPlayScore } from '@/utils/matchPlayScoring';
import { canScoreMatch, MatchTimingInfo } from '@/utils/matchTiming';
import { useAuth } from '@/context/AuthContext';
import { useTournament } from '@/context/TournamentContext';
import { supabase } from '@/lib/supabase';

interface ScoreCardProps {
  match: Match;
  teamA: Team;
  teamB: Team;
  onSave: (updatedMatch: Match) => void;
}

const ScoreCard: React.FC<ScoreCardProps> = ({ match, teamA, teamB, onSave }) => {
  const [editingHole, setEditingHole] = useState<number | null>(null);
  const [tempScores, setTempScores] = useState<{ teamA: number | null; teamB: number | null }>({
    teamA: null,
    teamB: null
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
    // Convert holes to the format expected by the match play calculator
    const holesData = match.holes.map(hole => ({
      holeNumber: hole.number,
      par: hole.par || 4, // Default to par 4 if not specified
      teamAStrokes: hole.teamAScore || 0, // Use teamAScore instead of teamAStrokes
      teamBStrokes: hole.teamBScore || 0  // Use teamBScore instead of teamBStrokes
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
  };

  const handleEditHole = (holeNumber: number) => {
    // Prevent editing if scoring is not allowed
    if (!timingInfo.canScore) {
      return;
    }
    
    const hole = match.holes.find(h => h.number === holeNumber);
    setEditingHole(holeNumber);
    setTempScores({
      teamA: hole?.teamAScore || null,
      teamB: hole?.teamBScore || null
    });
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
    if (editingHole && (tempScores.teamA !== null || tempScores.teamB !== null)) {
      console.log('💾 Saving hole scores:', {
        holeNumber: editingHole,
        teamAScore: tempScores.teamA,
        teamBScore: tempScores.teamB,
        matchId: match.id
      });
      const updatedHoles = match.holes.map(hole => 
        hole.number === editingHole 
          ? {
              ...hole,
              teamAScore: tempScores.teamA,
              teamBScore: tempScores.teamB,
              status: tempScores.teamA !== null && tempScores.teamB !== null ? 'completed' as const : 'in-progress' as const
            }
          : hole
      );

      // Check if match is automatically completed due to match play rules
      const holesData = updatedHoles.map(hole => ({
        holeNumber: hole.number,
        par: hole.par || 4,
        teamAStrokes: hole.teamAScore || 0, // Use teamAScore
        teamBStrokes: hole.teamBScore || 0  // Use teamBScore
      }));

      const matchPlayResult = calculateMatchPlayResult(holesData, 18);
      const isMatchComplete = matchPlayResult.status === 'completed';

      const updatedMatch: Match = {
        ...match,
        holes: updatedHoles,
        status: isMatchComplete ? 'completed' : 'in-progress'
      };

      // Save the match to database first
      console.log('🔄 Updating match in database...');
      try {
        await updateMatch(updatedMatch.id, updatedMatch);
        console.log('✅ Match updated in database successfully');
        onSave(updatedMatch); // This updates local state
      } catch (error) {
        console.error('❌ Failed to save match to database:', error);
        // Still update local state to provide immediate feedback
        onSave(updatedMatch);
        alert('Warning: Failed to save to database. Your changes may not be visible to other users.');
      }

      // If match is complete, update tournament standings
      if (isMatchComplete) {
        console.log(`🏆 Match ${match.id} completed automatically!`);
        console.log(`Result: ${matchPlayResult.result}, Winner: ${matchPlayResult.winner}`);
        
        // Update tournament standings
        await updateTournamentStandings(updatedMatch, matchPlayResult);
      }

      setEditingHole(null);
      setTempScores({ teamA: null, teamB: null });
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
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {timingInfo.hasStarted ? (
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
              ) : (
                <Lock className="h-5 w-5 text-yellow-400" />
              )}
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-yellow-800">
                {timingInfo.hasStarted ? 'Match Status Update Required' : 'Match Not Started'}
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                {timingInfo.reason}
              </p>
            </div>
            {isAdmin && !timingInfo.hasStarted && (
              <div className="ml-4">
                <button
                  onClick={handleStartMatch}
                  disabled={isStartingMatch}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
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
        </div>
      )}

      {/* Match Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 text-white">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Match #{match.id}</h2>
          <div className="flex items-center space-x-3">
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
            <div className="text-right">
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
        
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold"
              style={{ backgroundColor: teamA.color }}
            >
              {teamA.logo}
            </div>
            <div>
              <div className="font-bold">{teamA.name}</div>
              <div className="text-sm opacity-90">{teamA.description}</div>
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold">{calculateMatchStatus()}</div>
            <div className="text-sm opacity-90">Match Status</div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="font-bold">{teamB.name}</div>
              <div className="text-sm opacity-90">{teamB.description}</div>
            </div>
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold"
              style={{ backgroundColor: teamB.color }}
            >
              {teamB.logo}
            </div>
          </div>
        </div>
      </div>

      {/* Score Grid */}
      <div className="p-6">
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

        {/* Hole-by-Hole Editing */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Edit Scores</h3>
          <div className="grid grid-cols-3 gap-4">
            {match.holes
              .sort((a, b) => a.number - b.number)
              .map(hole => (
              <div key={hole.number} className={`border rounded-lg p-4 ${!timingInfo.canScore ? 'opacity-60 bg-gray-50' : ''}`}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">Hole {hole.number}</h4>
                  {getHoleStatusIcon(hole)}
                </div>
                
                {editingHole === hole.number && timingInfo.canScore ? (
                  <div className="space-y-3">
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        min="1"
                        max="10"
                        placeholder="Team A"
                        value={tempScores.teamA || ''}
                        onChange={(e) => setTempScores(prev => ({ 
                          ...prev, 
                          teamA: e.target.value ? parseInt(e.target.value) : null 
                        }))}
                        className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <input
                        type="number"
                        min="1"
                        max="10"
                        placeholder="Team B"
                        value={tempScores.teamB || ''}
                        onChange={(e) => setTempScores(prev => ({ 
                          ...prev, 
                          teamB: e.target.value ? parseInt(e.target.value) : null 
                        }))}
                        className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSaveHole}
                        className="flex-1 flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                      >
                        <Save className="w-4 h-4 mr-1" />
                        Save
                      </button>
                      <button
                        onClick={() => setEditingHole(null)}
                        className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Team A: {hole.teamAScore || '-'}</span>
                      <span>Team B: {hole.teamBScore || '-'}</span>
                    </div>
                    <button
                      onClick={() => handleEditHole(hole.number)}
                      disabled={!timingInfo.canScore}
                      className={`w-full flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md transition-colors ${
                        timingInfo.canScore 
                          ? 'text-gray-700 hover:bg-gray-50' 
                          : 'text-gray-400 cursor-not-allowed bg-gray-100'
                      }`}
                      title={timingInfo.canScore ? "Edit scores for this hole" : timingInfo.reason}
                    >
                      {timingInfo.canScore ? (
                        <>
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4 mr-1" />
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
            <div className="flex items-center text-sm text-gray-600">
              <Lock className="w-4 h-4 mr-2 text-gray-500" />
              <span>
                {timingInfo.hasStarted 
                  ? 'Match status needs to be updated to enable scoring'
                  : `Scoring will be enabled when the match starts${timingInfo.timeUntilStart ? ` (in ${timingInfo.timeUntilStart})` : ''}`
                }
              </span>
            </div>
            {!timingInfo.hasStarted && timingInfo.timeUntilStart && (
              <div className="mt-2 text-xs text-gray-500">
                Tee time: {match.teeTime} on {match.date}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScoreCard; 