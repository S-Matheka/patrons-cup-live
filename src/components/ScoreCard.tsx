'use client';

import { Match, Team, Hole } from '@/types';
import { Save, Edit, CheckCircle, Circle, Clock } from 'lucide-react';
import { useState } from 'react';
import { calculateMatchPlayResult, getMatchStatusDescription, formatMatchPlayScore } from '@/utils/matchPlayScoring';

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

  const calculateMatchStatus = () => {
    // Convert holes to the format expected by the match play calculator
    const holesData = match.holes.map(hole => ({
      holeNumber: hole.holeNumber,
      par: hole.par || 4, // Default to par 4 if not specified
      teamAStrokes: hole.teamAStrokes || 0,
      teamBStrokes: hole.teamBStrokes || 0
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
    const hole = match.holes.find(h => h.number === holeNumber);
    setEditingHole(holeNumber);
    setTempScores({
      teamA: hole?.teamAScore || null,
      teamB: hole?.teamBScore || null
    });
  };

  const handleSaveHole = () => {
    if (editingHole && (tempScores.teamA !== null || tempScores.teamB !== null)) {
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

      const updatedMatch: Match = {
        ...match,
        holes: updatedHoles,
        status: updatedHoles.every(h => h.status === 'completed') ? 'completed' : 'in-progress'
      };

      onSave(updatedMatch);
      setEditingHole(null);
      setTempScores({ teamA: null, teamB: null });
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
      {/* Match Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 text-white">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Match #{match.id}</h2>
          <div className="text-right">
            <div className="text-sm opacity-90">{match.teeTime}</div>
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
              <div key={hole.number} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">Hole {hole.number}</h4>
                  {getHoleStatusIcon(hole)}
                </div>
                
                {editingHole === hole.number ? (
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
                      className="w-full flex items-center justify-center px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScoreCard; 