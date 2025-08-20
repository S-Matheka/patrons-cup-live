'use client';

import { Team, Score } from '@/types';
import { Trophy, Medal, TrendingUp, TrendingDown, Minus, Clock } from 'lucide-react';

interface LeaderboardProps {
  teams: Team[];
  scores: Score[];
  division?: 'Trophy' | 'Shield' | 'Plaque' | 'Bowl' | 'Mug';
  showAll?: boolean;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ 
  teams, 
  scores, 
  division, 
  showAll = false 
}) => {
  const filteredScores = division 
    ? scores.filter(score => score.division === division)
    : scores;

  const sortedScores = [...filteredScores].sort((a, b) => {
    const teamA = teams.find(t => t.id === a.teamId);
    const teamB = teams.find(t => t.id === b.teamId);
    
    // Pre-tournament: Sort by seeding (lower seed = higher position)
    if (teamA && teamB) {
      return teamA.seed - teamB.seed;
    }
    
    // Fallback to points if teams not found
    return b.points - a.points;
  });

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <span className="text-2xl">🥇</span>;
      case 2:
        return <span className="text-2xl">🥈</span>;
      case 3:
        return <span className="text-2xl">🥉</span>;
      default:
        return <span className="text-gray-500 font-medium text-lg">{position}</span>;
    }
  };

  const getTrendIcon = (score: Score) => {
    if (!score.positionChange) return <Minus className="w-4 h-4 text-gray-400" />;
    
    switch (score.positionChange) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatStrokeDifferential = (differential?: number) => {
    if (differential === undefined) return 'E';
    if (differential === 0) return 'E';
    return differential > 0 ? `+${differential}` : `${differential}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 bg-gradient-to-r from-green-600 to-green-700">
        <h2 className="text-xl font-bold text-white">
          {division ? `${division} Division` : 'Overall'} Leaderboard
        </h2>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Position
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Team
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Players
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Max Points
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Points Distribution
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedScores.map((score, index) => {
              const team = teams.find(t => t.id === score.teamId);
              if (!team) return null;

              return (
                <tr key={score.teamId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getPositionIcon(index + 1)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3"
                        style={{ backgroundColor: team.color }}
                      >
                        {team.logo}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{team.name}</div>
                        <div className="text-sm text-gray-500">{team.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="text-lg font-bold text-blue-600">{team.totalPlayers}</div>
                    <div className="text-xs text-gray-500">Total Squad</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="text-lg font-bold text-green-600">{team.maxPointsAvailable}</div>
                    <div className="text-xs text-gray-500">Maximum Available</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="text-xs space-y-1">
                      <div>4BBB: <span className="font-medium text-blue-600">{team.sessionPoints.friAM4BBB + team.sessionPoints.satAM4BBB}</span></div>
                      <div>Foursomes: <span className="font-medium text-purple-600">{team.sessionPoints.friPMFoursomes + team.sessionPoints.satPMFoursomes}</span></div>
                      <div>Singles: <span className="font-medium text-orange-600">{team.sessionPoints.sunSingles}</span></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                        Ready
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Leaderboard; 