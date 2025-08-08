'use client';

import { Team, Score } from '@/types';
import { Trophy, Medal, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface LeaderboardProps {
  teams: Team[];
  scores: Score[];
  division?: 'Trophy' | 'Plate' | 'Bowl' | 'Mug';
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
    // Sort by points first
    if (b.points !== a.points) {
      return b.points - a.points;
    }
    // Then by matches won
    if (b.matchesWon !== a.matchesWon) {
      return b.matchesWon - a.matchesWon;
    }
    // Then by holes won
    return b.holesWon - a.holesWon;
  });

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Medal className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="text-gray-500 font-medium">{position}</span>;
    }
  };

  const getTrendIcon = (score: Score, previousScore?: Score) => {
    if (!previousScore) return <Minus className="w-4 h-4 text-gray-400" />;
    
    if (score.points > previousScore.points) {
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    } else if (score.points < previousScore.points) {
      return <TrendingDown className="w-4 h-4 text-red-500" />;
    }
    return <Minus className="w-4 h-4 text-gray-400" />;
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
                Points
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Matches
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Wins
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Holes Won
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trend
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
                    <span className="text-lg font-bold text-green-600">{score.points || 0}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-sm text-gray-900">{score.matchesPlayed || 0}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-sm text-blue-600 font-medium">{score.matchesWon || 0}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-sm text-gray-900">{score.holesWon || 0}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {getTrendIcon(score)}
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