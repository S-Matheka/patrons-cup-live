'use client';

import { Match, Team, Player, Hole } from '@/types';
import { Save, Edit, CheckCircle, Circle, Clock, Play, AlertTriangle, Lock, RefreshCw, Calculator } from 'lucide-react';
import { useState } from 'react';
import { canScoreMatch, MatchTimingInfo } from '@/utils/matchTiming';
import { useAuth } from '@/context/AuthContext';
import { useTournament } from '@/context/TournamentContextSwitcher';
import { supabase } from '@/lib/supabase';
import { 
  KAREN_COURSE_DATA, 
  calculateStablefordPoints,
  calculateNetScore
} from '@/utils/stablefordScoring';

interface IndividualPlayerScoreCardProps {
  match: Match;
  teamA: Team;
  teamB: Team;
  onSave: (updatedMatch: Match) => void;
}

const IndividualPlayerScoreCard: React.FC<IndividualPlayerScoreCardProps> = ({ match, teamA, teamB, onSave }) => {
  const { refreshMatchData } = useTournament();
  const { players } = useTournament();
  
  const [editingHole, setEditingHole] = useState<number | null>(null);
  const [tempScores, setTempScores] = useState<{ 
    player1: number | null; 
    player2: number | null; 
  }>({
    player1: null,
    player2: null
  });
  const [isStartingMatch, setIsStartingMatch] = useState(false);
  
  const { isAdmin } = useAuth();
  const { updateMatch } = useTournament();

  // Get individual player names from match data for Nancy Millar Trophy
  // The players field should contain: { teamA: ['Player Name'], teamB: ['Player Name'] }
  const player1Name = match.players?.teamA?.[0] || 'Player 1';
  const player2Name = match.players?.teamB?.[0] || 'Player 2';
  
  // Get players for each team (fallback for other tournaments)
  const teamAPlayers = players.filter(p => p.teamId === teamA.id);
  const teamBPlayers = players.filter(p => p.teamId === teamB.id);

  // Check if scoring is allowed
  const timingInfo: MatchTimingInfo = canScoreMatch(
    match.status,
    match.date,
    match.teeTime,
    isAdmin
  );

  const calculateStablefordPoints = (grossScore: number, par: number, handicap: number, strokeIndex: number) => {
    // Apply handicap stroke if stroke index <= handicap
    const netScore = grossScore - (strokeIndex <= handicap ? 1 : 0);
    const netToPar = netScore - par;
    
    // Calculate Stableford points
    if (netToPar <= -3) return 5; // Net Albatross
    if (netToPar === -2) return 4; // Net Eagle
    if (netToPar === -1) return 3; // Net Birdie
    if (netToPar === 0) return 2;  // Net Par
    if (netToPar === 1) return 1;  // Net Bogey
    return 0; // Net Double Bogey or worse
  };

  const calculateMatchTotal = () => {
    if (!match.holes || match.holes.length === 0) return { 
      player1: 0, player2: 0,
      teamA: 0, teamB: 0
    };
    
    let player1Total = 0, player2Total = 0;
    
    match.holes.forEach(hole => {
      const courseData = KAREN_COURSE_DATA[hole.number - 1];
      const par = courseData.par;
      const strokeIndex = courseData.si;
      
      // Calculate points for each player
      if (hole.player1Score !== null && hole.player1Handicap !== null) {
        player1Total += calculateStablefordPoints(hole.player1Score, par, hole.player1Handicap, strokeIndex);
      }
      if (hole.player2Score !== null && hole.player2Handicap !== null) {
        player2Total += calculateStablefordPoints(hole.player2Score, par, hole.player2Handicap, strokeIndex);
      }
    });
    
    return { 
      player1: player1Total, 
      player2: player2Total,
      teamA: player1Total,
      teamB: player2Total
    };
  };

  const handleStartMatch = async () => {
    if (!isAdmin || isStartingMatch) return;
    setIsStartingMatch(true);
    try {
      const { error } = await supabase
        .from('matches')
        .update({ status: 'in-progress' })
        .eq('id', match.id);

      if (error) throw error;
      await refreshMatchData(match.id);
      onSave({ ...match, status: 'in-progress' });
    } catch (error) {
      console.error('Error starting match:', error);
      alert('Failed to start match');
    } finally {
      setIsStartingMatch(false);
    }
  };

  const handleSaveHole = async (holeNumber: number) => {
    if (tempScores.player1 === null || tempScores.player2 === null) {
      alert('Please enter scores for both players');
      return;
    }

    try {
      const courseData = KAREN_COURSE_DATA[holeNumber - 1];
      const par = courseData.par;
      const strokeIndex = courseData.si;

      // Get player data
      const player1Data = players.find(p => p.name === player1Name);
      const player2Data = players.find(p => p.name === player2Name);

      // Calculate Stableford points for each player
      const player1NetScore = calculateNetScore(tempScores.player1, player1Data?.handicap || 18, strokeIndex);
      const player2NetScore = calculateNetScore(tempScores.player2, player2Data?.handicap || 18, strokeIndex);
      const player1Points = calculateStablefordPoints(player1NetScore, par);
      const player2Points = calculateStablefordPoints(player2NetScore, par);

      const { error } = await supabase
        .from('holes')
        .update({
          player1_score: tempScores.player1,
          player2_score: tempScores.player2,
          player1_handicap: player1Data?.handicap || 18,
          player2_handicap: player2Data?.handicap || 18,
          player1_points: player1Points,
          player2_points: player2Points,
          player1_id: player1Data?.id,
          player2_id: player2Data?.id,
          status: 'completed'
        })
        .eq('match_id', match.id)
        .eq('hole_number', holeNumber);

      if (error) throw error;

      await refreshMatchData(match.id);
      setEditingHole(null);
      setTempScores({ player1: null, player2: null });
    } catch (error) {
      console.error('Error saving hole:', error);
      alert('Failed to save hole scores');
    }
  };

  const handleEditHole = (holeNumber: number) => {
    const hole = match.holes?.find(h => h.number === holeNumber);
    if (hole) {
      setTempScores({
        player1: hole.player1Score,
        player2: hole.player2Score
      });
      setEditingHole(holeNumber);
    }
  };

  const totals = calculateMatchTotal();

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
      <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-gray-800">Individual Player Stableford Scoring</h3>
      
      {/* Match Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-gray-200 gap-3">
        <div>
          <p className="text-base sm:text-lg font-semibold text-gray-700 truncate">{player1Name} vs {player2Name}</p>
          <p className="text-xs sm:text-sm text-gray-500">{match.date} • {match.teeTime} • Tee {match.tee}</p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-xl sm:text-2xl font-bold text-green-700">
            {totals.player1} - {totals.player2}
          </p>
          <p className="text-xs sm:text-sm text-gray-600">Individual Player Points</p>
        </div>
      </div>

      {/* Player Information */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-green-50 p-3 sm:p-4 rounded-lg">
          <h4 className="text-sm sm:text-base font-semibold text-green-800 mb-2">Player 1</h4>
          <div className="text-xs sm:text-sm text-green-700 truncate">
            {player1Name} (HCP {players.find(p => p.name === player1Name)?.handicap || 18})
          </div>
        </div>
        <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
          <h4 className="text-sm sm:text-base font-semibold text-blue-800 mb-2">Player 2</h4>
          <div className="text-xs sm:text-sm text-blue-700 truncate">
            {player2Name} (HCP {players.find(p => p.name === player2Name)?.handicap || 18})
          </div>
        </div>
      </div>

      {/* Match Status and Actions */}
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
        <div className="flex items-center space-x-2 text-gray-600">
          {timingInfo.canScore ? (
            match.status === 'scheduled' ? (
              <Clock className="w-5 h-5 text-yellow-600" />
            ) : match.status === 'in-progress' ? (
              <Play className="w-5 h-5 text-green-600" />
            ) : (
              <CheckCircle className="w-5 h-5 text-blue-600" />
            )
          ) : (
            <Lock className="w-5 h-5 text-gray-400" />
          )}
          <span className="font-medium capitalize">
            {match.status.replace('-', ' ')}
            {timingInfo.isOverdue && ' (Overdue)'}
          </span>
        </div>

        {match.status === 'scheduled' && timingInfo.canScore && (
          <button
            onClick={handleStartMatch}
            disabled={isStartingMatch}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition-colors flex items-center space-x-2"
          >
            <Play className="w-5 h-5" />
            <span>{isStartingMatch ? 'Starting...' : 'Start Match'}</span>
          </button>
        )}
      </div>

      {/* Individual Player Scoring Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead>
            <tr className="bg-gray-100 text-gray-600 uppercase text-xs sm:text-sm leading-normal">
              <th className="py-2 sm:py-3 px-2 sm:px-6 text-left">Hole</th>
              <th className="py-2 sm:py-3 px-2 sm:px-6 text-center">Par</th>
              <th className="py-2 sm:py-3 px-2 sm:px-6 text-center">SI</th>
              <th className="py-2 sm:py-3 px-2 sm:px-6 text-center truncate max-w-[100px] sm:max-w-none">{player1Name}</th>
              <th className="py-2 sm:py-3 px-2 sm:px-6 text-center truncate max-w-[100px] sm:max-w-none">{player2Name}</th>
              <th className="py-2 sm:py-3 px-2 sm:px-6 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="text-gray-700 text-xs sm:text-sm font-light">
            {match.holes?.map((hole) => {
              const courseHoleData = KAREN_COURSE_DATA.find(h => h.hole === hole.number);
              const par = courseHoleData?.par || 4;
              const si = courseHoleData?.si || 10;

              return (
                <tr key={hole.number} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-2 sm:py-3 px-2 sm:px-6 text-left whitespace-nowrap font-medium text-xs sm:text-sm">Hole {hole.number}</td>
                  <td className="py-2 sm:py-3 px-2 sm:px-6 text-center text-xs sm:text-sm">{par}</td>
                  <td className="py-2 sm:py-3 px-2 sm:px-6 text-center text-xs sm:text-sm">{si}</td>
                  
                  {/* Player 1 Score */}
                  <td className="py-2 sm:py-3 px-2 sm:px-6 text-center">
                    <div className="text-xs text-gray-500 mb-1 truncate max-w-[80px] sm:max-w-none">{player1Name}</div>
                    {editingHole === hole.number ? (
                      <input
                        type="number"
                        value={tempScores.player1 === null ? '' : tempScores.player1}
                        onChange={(e) => setTempScores(prev => ({ ...prev, player1: parseInt(e.target.value) || null }))}
                        className="w-12 sm:w-16 p-1 border rounded text-center text-xs sm:text-sm"
                        min="1"
                        max="15"
                        placeholder="Score"
                      />
                    ) : (
                      <div>
                        <div className="font-semibold text-sm sm:text-lg">{hole.player1Score || '-'}</div>
                        <div className="text-xs text-green-600 font-medium">{hole.player1Points || '-'} pts</div>
                      </div>
                    )}
                  </td>
                  
                  {/* Player 2 Score */}
                  <td className="py-2 sm:py-3 px-2 sm:px-6 text-center">
                    <div className="text-xs text-gray-500 mb-1 truncate max-w-[80px] sm:max-w-none">{player2Name}</div>
                    {editingHole === hole.number ? (
                      <input
                        type="number"
                        value={tempScores.player2 === null ? '' : tempScores.player2}
                        onChange={(e) => setTempScores(prev => ({ ...prev, player2: parseInt(e.target.value) || null }))}
                        className="w-12 sm:w-16 p-1 border rounded text-center text-xs sm:text-sm"
                        min="1"
                        max="15"
                        placeholder="Score"
                      />
                    ) : (
                      <div>
                        <div className="font-semibold text-sm sm:text-lg">{hole.player2Score || '-'}</div>
                        <div className="text-xs text-blue-600 font-medium">{hole.player2Points || '-'} pts</div>
                      </div>
                    )}
                  </td>
                  
                  
                  <td className="py-2 sm:py-3 px-2 sm:px-6 text-center">
                    {timingInfo.canScore && (
                      editingHole === hole.number ? (
                        <button
                          onClick={() => handleSaveHole(hole.number)}
                          className="bg-green-500 hover:bg-green-600 text-white py-1 px-2 sm:px-3 rounded-md text-xs flex items-center space-x-1 mx-auto"
                        >
                          <Save className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline">Save</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleEditHole(hole.number)}
                          disabled={match.status === 'completed'}
                          className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-2 sm:px-3 rounded-md text-xs flex items-center space-x-1 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline">Edit</span>
                        </button>
                      )
                    )}
                  </td>
                </tr>
              );
            })}
            
            {/* Totals Row */}
            <tr className="bg-gray-100 font-semibold">
              <td className="py-3 px-6 text-left">TOTAL</td>
              <td className="py-3 px-6 text-center">-</td>
              <td className="py-3 px-6 text-center">-</td>
              <td className="py-3 px-6 text-center">
                <div className="text-xs text-gray-500 mb-1">{player1Name}</div>
                <div className="text-lg text-green-700">{totals.player1} pts</div>
              </td>
              <td className="py-3 px-6 text-center">
                <div className="text-xs text-gray-500 mb-1">{player2Name}</div>
                <div className="text-lg text-blue-700">{totals.player2} pts</div>
              </td>
              <td className="py-3 px-6 text-center">-</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Individual Player Totals */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="font-semibold text-green-800 mb-2">Player 1</h4>
          <div className="text-sm text-green-700">
            <div className="font-medium">{player1Name}</div>
            <div className="text-lg font-bold mt-2">{totals.player1} Stableford Points</div>
          </div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">Player 2</h4>
          <div className="text-sm text-blue-700">
            <div className="font-medium">{player2Name}</div>
            <div className="text-lg font-bold mt-2">{totals.player2} Stableford Points</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IndividualPlayerScoreCard;
