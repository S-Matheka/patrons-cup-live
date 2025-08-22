'use client';

import { Team, Match, Hole } from '@/types';
import { Clock, CheckCircle, Circle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { calculateMatchPlayResult, getMatchStatusDescription, formatMatchPlayScore } from '@/utils/matchPlayScoring';

interface LiveScorecardProps {
  match: Match;
  teamA: Team;
  teamB: Team | null;
}

const LiveScorecard: React.FC<LiveScorecardProps> = ({ match, teamA, teamB }) => {
  const getScoreIndicator = (strokes: number | null, par: number) => {
    if (strokes === null) return null;
    
    const diff = strokes - par;
    if (diff === -3) return { symbol: '🦅', label: 'Albatross', class: 'bg-purple-100 text-purple-800' };
    if (diff === -2) return { symbol: '🦅', label: 'Eagle', class: 'bg-blue-100 text-blue-800' };
    if (diff === -1) return { symbol: '🐦', label: 'Birdie', class: 'bg-green-100 text-green-800' };
    if (diff === 0) return { symbol: '⚪', label: 'Par', class: 'bg-gray-100 text-gray-800' };
    if (diff === 1) return { symbol: '🔴', label: 'Bogey', class: 'bg-yellow-100 text-yellow-800' };
    if (diff === 2) return { symbol: '🔴🔴', label: 'Double Bogey', class: 'bg-orange-100 text-orange-800' };
    return { symbol: '❌', label: `+${diff}`, class: 'bg-red-100 text-red-800' };
  };

  const getHoleStatus = (hole: Hole) => {
    switch (hole.status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'in-progress':
        return <Clock className="w-4 h-4 text-yellow-500 animate-pulse" />;
      default:
        return <Circle className="w-4 h-4 text-gray-400" />;
    }
  };

  const calculateStrokeDifferential = (holes: Hole[], teamKey: 'teamA' | 'teamB') => {
    let totalStrokes = 0;
    let totalPar = 0;
    
    holes.forEach(hole => {
      const strokes = teamKey === 'teamA' ? hole.teamAScore : hole.teamBScore;
      if (strokes !== null) {
        totalStrokes += strokes;
        totalPar += hole.par;
      }
    });
    
    if (totalPar === 0) return 'E';
    const diff = totalStrokes - totalPar;
    if (diff === 0) return 'E';
    return diff > 0 ? `+${diff}` : `${diff}`;
  };

  const getMatchPlayResult = () => {
    if (match.status === 'scheduled') return null;
    
    // Convert holes to the format expected by the match play calculator
    const holesData = match.holes.map(hole => ({
      holeNumber: hole.number,
      par: hole.par || 4, // Default to par 4 if not specified
      teamAStrokes: hole.teamAScore ?? 0,
      teamBStrokes: hole.teamBScore ?? 0
    }));

    return calculateMatchPlayResult(holesData, 18);
  };

  const getMatchStatus = () => {
    if (match.status === 'scheduled') return 'Match Not Started';
    
    const result = getMatchPlayResult();
    if (!result) return 'Starting Soon';

    // Format the match play result for display
    const score = formatMatchPlayScore(result);
    
    if (result.status === 'completed') {
      if (result.winner === 'halved') {
        return 'Match Halved (AS)';
      } else {
        const winnerName = result.winner === 'teamA' ? teamA.name : teamB?.name;
        return `${winnerName} wins ${score}`;
      }
    } else {
      // Match in progress
      if (result.result === 'AS') {
        return 'All Square';
      } else {
        const leaderName = result.teamAHolesWon > result.teamBHolesWon ? teamA.name : teamB?.name;
        return `${leaderName} ${score}`;
      }
    }
  };

  if (match.isBye || !teamB) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold"
              style={{ backgroundColor: teamA.color }}
            >
              {teamA.logo}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{teamA.name}</h3>
              <p className="text-sm text-gray-600">{teamA.description}</p>
            </div>
          </div>
          <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-lg font-bold">
            BYE - Automatic Win
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Mobile-Optimized Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <div className="text-white">
            <h2 className="text-lg sm:text-xl font-bold">Live Scorecard</h2>
            <p className="text-blue-100 text-sm">{match.date}</p>
          </div>
          <div className="text-center sm:text-right text-white">
            <div className="text-base sm:text-lg font-bold">{getMatchStatus()}</div>
            <div className="text-sm text-blue-100">
              {(() => {
                const completedHoles = match.holes.filter(h => h.status === 'completed').length;
                const nextHole = completedHoles + 1;
                
                if (match.status === 'completed') {
                  return `Match completed after ${completedHoles} holes`;
                } else if (nextHole > 18) {
                  return 'All holes completed';
                } else {
                  return `Playing Hole ${nextHole}`;
                }
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile-First Teams Summary */}
      <div className="p-4 border-b bg-gray-50">
        {/* Mobile Layout */}
        <div className="block sm:hidden space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                style={{ backgroundColor: teamA.color }}
              >
                {teamA.logo}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-gray-900 text-sm truncate">{teamA.name}</h3>
                <p className="text-xs text-gray-600 truncate">{teamA.description}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-green-600">
                {calculateStrokeDifferential(match.holes, 'teamA')}
              </div>
              <div className="text-xs text-gray-500">Score</div>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                style={{ backgroundColor: teamB.color }}
              >
                {teamB.logo}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-gray-900 text-sm truncate">{teamB.name}</h3>
                <p className="text-xs text-gray-600 truncate">{teamB.description}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-green-600">
                {calculateStrokeDifferential(match.holes, 'teamB')}
              </div>
              <div className="text-xs text-gray-500">Score</div>
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden sm:grid sm:grid-cols-2 gap-6">
          <div className="flex items-center space-x-4">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
              style={{ backgroundColor: teamA.color }}
            >
              {teamA.logo}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-gray-900">{teamA.name}</h3>
              <p className="text-sm text-gray-600 truncate">{teamA.description}</p>
              <div className="text-xl font-bold text-green-600">
                {calculateStrokeDifferential(match.holes, 'teamA')}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4 justify-end">
            <div className="text-right min-w-0">
              <h3 className="font-bold text-gray-900">{teamB.name}</h3>
              <p className="text-sm text-gray-600 truncate">{teamB.description}</p>
              <div className="text-xl font-bold text-green-600">
                {calculateStrokeDifferential(match.holes, 'teamB')}
              </div>
            </div>
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
              style={{ backgroundColor: teamB.color }}
            >
              {teamB.logo}
            </div>
          </div>
        </div>
      </div>

      {/* Hole-by-Hole Scorecard */}
      <div className="p-3 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Hole-by-Hole Scores</h3>
        
        {/* Mobile: Card Layout */}
        <div className="block sm:hidden space-y-3">
          {match.holes.map((hole, index) => {
            const teamAIndicator = getScoreIndicator(hole.teamAScore, hole.par);
            const teamBIndicator = getScoreIndicator(hole.teamBScore, hole.par);
            
            return (
              <div key={hole.number} className="border rounded-lg p-3 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {hole.number}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">Hole {hole.number}</div>
                      <div className="text-xs text-gray-600">Par {hole.par}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    {getHoleStatus(hole)}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-xs text-gray-600 mb-1">{teamA.name}</div>
                    <div className="flex items-center justify-center space-x-2">
                      {hole.teamAScore !== null ? (
                        <>
                          <span className="text-lg font-bold text-gray-900">{hole.teamAScore}</span>
                          {teamAIndicator && (
                            <span className={`px-1.5 py-0.5 rounded text-xs ${teamAIndicator.class}`}>
                              {teamAIndicator.symbol}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-gray-400 text-lg">-</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-xs text-gray-600 mb-1">{teamB.name}</div>
                    <div className="flex items-center justify-center space-x-2">
                      {hole.teamBScore !== null ? (
                        <>
                          <span className="text-lg font-bold text-gray-900">{hole.teamBScore}</span>
                          {teamBIndicator && (
                            <span className={`px-1.5 py-0.5 rounded text-xs ${teamBIndicator.class}`}>
                              {teamBIndicator.symbol}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-gray-400 text-lg">-</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop: Table Layout */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-2 font-semibold text-gray-700">Hole</th>
                <th className="text-center py-3 px-2 font-semibold text-gray-700">Par</th>
                <th className="text-center py-3 px-2 font-semibold text-gray-700">{teamA.name}</th>
                <th className="text-center py-3 px-2 font-semibold text-gray-700">{teamB.name}</th>
                <th className="text-center py-3 px-2 font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {match.holes
                .sort((a, b) => a.number - b.number) // Ensure holes are sorted by number
                .map((hole, index) => {
                const teamAIndicator = getScoreIndicator(hole.teamAScore, hole.par);
                const teamBIndicator = getScoreIndicator(hole.teamBScore, hole.par);
                
                return (
                  <tr key={hole.number} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                    <td className="py-4 px-2 font-semibold text-gray-900">{hole.number}</td>
                    <td className="text-center py-4 px-2 font-medium text-gray-600">{hole.par}</td>
                    <td className="text-center py-4 px-2">
                      {hole.teamAScore !== null ? (
                        <div className="flex items-center justify-center space-x-2">
                          <span className="font-bold text-lg">{hole.teamAScore}</span>
                          {teamAIndicator && (
                            <span className={`px-2 py-1 rounded text-xs font-medium ${teamAIndicator.class}`}>
                              {teamAIndicator.symbol}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-lg">-</span>
                      )}
                    </td>
                    <td className="text-center py-4 px-2">
                      {hole.teamBScore !== null ? (
                        <div className="flex items-center justify-center space-x-2">
                          <span className="font-bold text-lg">{hole.teamBScore}</span>
                          {teamBIndicator && (
                            <span className={`px-2 py-1 rounded text-xs font-medium ${teamBIndicator.class}`}>
                              {teamBIndicator.symbol}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-lg">-</span>
                      )}
                    </td>
                    <td className="text-center py-4 px-2">
                      {getHoleStatus(hole)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Updates Footer */}
      {match.status === 'in-progress' && (
        <div className="bg-yellow-50 px-6 py-3 border-t">
          <div className="flex items-center justify-center space-x-2">
            <Clock className="w-4 h-4 text-yellow-600 animate-pulse" />
            <span className="text-sm font-medium text-yellow-800">
              Live - Updates every 10 seconds
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveScorecard;
