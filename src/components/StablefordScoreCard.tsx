'use client';

import { Match, Team, Hole } from '@/types';
import { Save, Edit, CheckCircle, Circle, Clock, Play, AlertTriangle, Lock, RefreshCw, Calculator } from 'lucide-react';
import { useState } from 'react';
import { canScoreMatch, MatchTimingInfo } from '@/utils/matchTiming';
import { useAuth } from '@/context/AuthContext';
import { useTournament } from '@/context/TournamentContextSwitcher';
import { supabase } from '@/lib/supabase';
import { KAREN_COURSE_DATA } from '@/utils/stablefordScoring';

interface StablefordScoreCardProps {
  match: Match;
  teamA: Team;
  teamB: Team;
  onSave: (updatedMatch: Match) => void;
}

const StablefordScoreCard: React.FC<StablefordScoreCardProps> = ({ match, teamA, teamB, onSave }) => {
  const { refreshMatchData } = useTournament();
  
  const [editingHole, setEditingHole] = useState<number | null>(null);
  const [tempScores, setTempScores] = useState<{ 
    teamA: number | null; 
    teamB: number | null; 
  }>({
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
    if (!match.holes || match.holes.length === 0) return { teamA: 0, teamB: 0 };
    
    let teamATotal = 0;
    let teamBTotal = 0;
    
    match.holes.forEach(hole => {
      if (hole.teamAScore !== null && hole.teamBScore !== null) {
        const courseData = KAREN_COURSE_DATA[hole.number - 1];
        const par = courseData.par;
        const strokeIndex = courseData.strokeIndex;
        
        // For now, assume handicap of 18 for both teams (will be updated with actual handicaps)
        const handicap = 18;
        
        const teamAPoints = calculateStablefordPoints(hole.teamAScore, par, handicap, strokeIndex);
        const teamBPoints = calculateStablefordPoints(hole.teamBScore, par, handicap, strokeIndex);
        
        teamATotal += teamAPoints;
        teamBTotal += teamBPoints;
      }
    });
    
    return { teamA: teamATotal, teamB: teamBTotal };
  };

  const handleStartMatch = async () => {
    setIsStartingMatch(true);
    try {
      const { error } = await supabase
        .from('matches')
        .update({ status: 'in-progress' })
        .eq('id', match.id);

      if (error) throw error;

      await refreshMatchData();
      onSave({ ...match, status: 'in-progress' });
    } catch (error) {
      console.error('Error starting match:', error);
      alert('Failed to start match');
    } finally {
      setIsStartingMatch(false);
    }
  };

  const handleSaveHole = async (holeNumber: number) => {
    if (tempScores.teamA === null || tempScores.teamB === null) {
      alert('Please enter scores for both teams');
      return;
    }

    try {
      const { error } = await supabase
        .from('holes')
        .update({
          team_a_score: tempScores.teamA,
          team_b_score: tempScores.teamB,
          team_a_strokes: tempScores.teamA,
          team_b_strokes: tempScores.teamB,
          status: 'completed'
        })
        .eq('match_id', match.id)
        .eq('hole_number', holeNumber);

      if (error) throw error;

      await refreshMatchData();
      setEditingHole(null);
      setTempScores({ teamA: null, teamB: null });
    } catch (error) {
      console.error('Error saving hole:', error);
      alert('Failed to save hole scores');
    }
  };

  const handleEditHole = (holeNumber: number) => {
    const hole = match.holes?.find(h => h.number === holeNumber);
    if (hole) {
      setTempScores({
        teamA: hole.teamAScore,
        teamB: hole.teamBScore
      });
      setEditingHole(holeNumber);
    }
  };

  const totals = calculateMatchTotal();

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Stableford Scoring</h2>
          <p className="text-gray-600">Foursomes Stableford - The Nancy Millar Trophy</p>
        </div>
        <div className="flex items-center space-x-4">
          {match.status === 'scheduled' && timingInfo.canScore && (
            <button
              onClick={handleStartMatch}
              disabled={isStartingMatch}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              <Play className="w-4 h-4" />
              <span>{isStartingMatch ? 'Starting...' : 'Start Match'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Match Status */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-blue-900">Match Status</h3>
            <p className="text-blue-700">
              {match.status === 'scheduled' && 'Match scheduled'}
              {match.status === 'in-progress' && 'Match in progress'}
              {match.status === 'completed' && 'Match completed'}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-900">
              {totals.teamA} - {totals.teamB}
            </div>
            <div className="text-sm text-blue-700">Stableford Points</div>
          </div>
        </div>
      </div>

      {/* Teams */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">{teamA.name}</h3>
          <div className="text-3xl font-bold text-blue-600">{totals.teamA}</div>
          <div className="text-sm text-gray-600">Stableford Points</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">{teamB.name}</h3>
          <div className="text-3xl font-bold text-red-600">{totals.teamB}</div>
          <div className="text-sm text-gray-600">Stableford Points</div>
        </div>
      </div>

      {/* Scoring Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2 text-left">Hole</th>
              <th className="border border-gray-300 px-4 py-2 text-center">Par</th>
              <th className="border border-gray-300 px-4 py-2 text-center">SI</th>
              <th className="border border-gray-300 px-4 py-2 text-center">{teamA.name}</th>
              <th className="border border-gray-300 px-4 py-2 text-center">{teamB.name}</th>
              <th className="border border-gray-300 px-4 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {match.holes?.map((hole) => {
              const courseData = KAREN_COURSE_DATA[hole.number - 1];
              const isEditing = editingHole === hole.number;
              
              return (
                <tr key={hole.number} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2 font-medium">{hole.number}</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">{courseData.par}</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">{courseData.strokeIndex}</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">
                    {isEditing ? (
                      <input
                        type="number"
                        value={tempScores.teamA || ''}
                        onChange={(e) => setTempScores(prev => ({ ...prev, teamA: parseInt(e.target.value) || null }))}
                        className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                        min="1"
                        max="15"
                      />
                    ) : (
                      <span className={hole.teamAScore ? 'font-semibold' : 'text-gray-400'}>
                        {hole.teamAScore || '-'}
                      </span>
                    )}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-center">
                    {isEditing ? (
                      <input
                        type="number"
                        value={tempScores.teamB || ''}
                        onChange={(e) => setTempScores(prev => ({ ...prev, teamB: parseInt(e.target.value) || null }))}
                        className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                        min="1"
                        max="15"
                      />
                    ) : (
                      <span className={hole.teamBScore ? 'font-semibold' : 'text-gray-400'}>
                        {hole.teamBScore || '-'}
                      </span>
                    )}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-center">
                    {isEditing ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleSaveHole(hole.number)}
                          className="text-green-600 hover:text-green-800"
                          title="Save"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingHole(null);
                            setTempScores({ teamA: null, teamB: null });
                          }}
                          className="text-gray-600 hover:text-gray-800"
                          title="Cancel"
                        >
                          <Circle className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEditHole(hole.number)}
                        disabled={!timingInfo.canScore}
                        className="text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Stableford Points Legend */}
      <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
        <h4 className="font-semibold text-yellow-900 mb-2">Stableford Points System</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-yellow-800">
          <div>Net Albatross (Par -3): 5 pts</div>
          <div>Net Eagle (Par -2): 4 pts</div>
          <div>Net Birdie (Par -1): 3 pts</div>
          <div>Net Par: 2 pts</div>
          <div>Net Bogey (Par +1): 1 pt</div>
          <div>Net Double Bogey or Worse: 0 pts</div>
        </div>
      </div>
    </div>
  );
};

export default StablefordScoreCard;
