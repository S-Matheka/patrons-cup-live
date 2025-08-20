'use client';

import { Team, Match, Hole } from '@/types';
import { Clock, CheckCircle, Circle, TrendingUp, TrendingDown, Minus } from 'lucide-react';

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
      const strokes = teamKey === 'teamA' ? hole.teamAStrokes : hole.teamBStrokes;
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

  const getMatchStatus = () => {
    if (match.status === 'scheduled') return 'Match Not Started';
    
    let teamAWins = 0;
    let teamBWins = 0;
    let holesPlayed = 0;

    match.holes.forEach(hole => {
      if (hole.teamAScore !== null && hole.teamBScore !== null) {
        holesPlayed++;
        if (hole.teamAScore < hole.teamBScore) {
          teamAWins++;
        } else if (hole.teamBScore < hole.teamAScore) {
          teamBWins++;
        }
      }
    });

    if (holesPlayed === 0) return 'Not Started';
    
    const holesRemaining = match.holes.length - holesPlayed;
    const leadDiff = Math.abs(teamAWins - teamBWins);
    
    if (match.status === 'completed') {
      if (teamAWins > teamBWins) return `${teamA.name} Won ${leadDiff} UP`;
      if (teamBWins > teamAWins) return `${teamB?.name} Won ${leadDiff} UP`;
      return 'HALVED';
    }
    
    // Check for dormie or won situations during play
    if (leadDiff > holesRemaining && match.status === 'in-progress') {
      if (teamAWins > teamBWins) return `${teamA.name} Won ${leadDiff} UP`;
      if (teamBWins > teamAWins) return `${teamB?.name} Won ${leadDiff} UP`;
    }
    
    if (leadDiff === holesRemaining && leadDiff > 0 && match.status === 'in-progress') {
      const leader = teamAWins > teamBWins ? teamA.name : teamB?.name;
      return `${leader} Dormie ${leadDiff}`;
    }
    
    if (teamAWins > teamBWins) return `${teamA.name} ${leadDiff} UP`;
    if (teamBWins > teamAWins) return `${teamB?.name} ${leadDiff} UP`;
    return 'All Square';
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
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="text-white">
            <h2 className="text-xl font-bold">{match.type} - {match.division}</h2>
            <p className="text-green-100">{match.course} | {match.date} {match.session}</p>
          </div>
          <div className="text-right text-white">
            <div className="text-lg font-bold">{getMatchStatus()}</div>
            <div className="text-sm text-green-100">
              Hole {match.holes.filter(h => h.status === 'completed').length + 1}
            </div>
          </div>
        </div>
      </div>

      {/* Teams Header */}
      <div className="grid grid-cols-2 gap-4 p-6 border-b">
        <div className="flex items-center space-x-3">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg font-bold"
            style={{ backgroundColor: teamA.color }}
          >
            {teamA.logo}
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{teamA.name}</h3>
            <p className="text-sm text-gray-600">{teamA.description}</p>
            <div className="text-lg font-bold text-green-600">
              {calculateStrokeDifferential(match.holes, 'teamA')}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 justify-end">
          <div className="text-right">
            <h3 className="font-bold text-gray-900">{teamB.name}</h3>
            <p className="text-sm text-gray-600">{teamB.description}</p>
            <div className="text-lg font-bold text-green-600">
              {calculateStrokeDifferential(match.holes, 'teamB')}
            </div>
          </div>
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg font-bold"
            style={{ backgroundColor: teamB.color }}
          >
            {teamB.logo}
          </div>
        </div>
      </div>

      {/* Hole-by-Hole Scorecard */}
      <div className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 font-medium text-gray-600">Hole</th>
                <th className="text-center py-2 font-medium text-gray-600">Par</th>
                <th className="text-center py-2 font-medium text-gray-600">{teamA.name}</th>
                <th className="text-center py-2 font-medium text-gray-600">{teamB.name}</th>
                <th className="text-center py-2 font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {match.holes.map((hole, index) => {
                const teamAIndicator = getScoreIndicator(hole.teamAStrokes, hole.par);
                const teamBIndicator = getScoreIndicator(hole.teamBStrokes, hole.par);
                
                return (
                  <tr key={hole.number} className="border-b hover:bg-gray-50">
                    <td className="py-3 font-medium">{hole.number}</td>
                    <td className="text-center py-3">{hole.par}</td>
                    <td className="text-center py-3">
                      {hole.teamAStrokes !== null ? (
                        <div className="flex items-center justify-center space-x-2">
                          <span className="font-bold">{hole.teamAStrokes}</span>
                          {teamAIndicator && (
                            <span className={`px-2 py-1 rounded text-xs ${teamAIndicator.class}`}>
                              {teamAIndicator.symbol}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="text-center py-3">
                      {hole.teamBStrokes !== null ? (
                        <div className="flex items-center justify-center space-x-2">
                          <span className="font-bold">{hole.teamBStrokes}</span>
                          {teamBIndicator && (
                            <span className={`px-2 py-1 rounded text-xs ${teamBIndicator.class}`}>
                              {teamBIndicator.symbol}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="text-center py-3">
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
              Live - Updates every 30 seconds
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveScorecard;
