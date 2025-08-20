'use client';

import { useTournament } from '@/context/TournamentContext';
import { BarChart3, Trophy, Users, Target, TrendingUp } from 'lucide-react';

export default function StatsPage() {
  const { teams, scores, matches } = useTournament();

  const divisionStats = {
    Trophy: {
      teams: teams.filter(t => t.division === 'Trophy').length,
      matches: matches.filter(m => m.division === 'Trophy').length,
      completed: matches.filter(m => m.division === 'Trophy' && m.status === 'completed').length,
    },
    Shield: {
      teams: teams.filter(t => t.division === 'Shield').length,
      matches: matches.filter(m => m.division === 'Shield').length,
      completed: matches.filter(m => m.division === 'Shield' && m.status === 'completed').length,
    },
    Plaque: {
      teams: teams.filter(t => t.division === 'Plaque').length,
      matches: matches.filter(m => m.division === 'Plaque').length,
      completed: matches.filter(m => m.division === 'Plaque' && m.status === 'completed').length,
    },
    Bowl: {
      teams: teams.filter(t => t.division === 'Bowl').length,
      matches: matches.filter(m => m.division === 'Bowl').length,
      completed: matches.filter(m => m.division === 'Bowl' && m.status === 'completed').length,
    },
    Mug: {
      teams: teams.filter(t => t.division === 'Mug').length,
      matches: matches.filter(m => m.division === 'Mug').length,
      completed: matches.filter(m => m.division === 'Mug' && m.status === 'completed').length,
    },
  };

  const formatStats = {
    '4BBB': matches.filter(m => m.type === '4BBB').length,
    'Foursomes': matches.filter(m => m.type === 'Foursomes').length,
    'Singles': matches.filter(m => m.type === 'Singles').length,
  };

  const totalPoints = scores.reduce((sum, score) => sum + score.points, 0);
  const totalMatches = matches.filter(m => !m.isBye).length;
  const completedMatches = matches.filter(m => m.status === 'completed' && !m.isBye).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Tournament Statistics</h1>
        <p className="text-lg text-gray-600">Comprehensive tournament analytics and performance metrics</p>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Teams</p>
              <p className="text-2xl font-bold text-gray-900">{teams.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Target className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Matches</p>
              <p className="text-2xl font-bold text-gray-900">{totalMatches}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Trophy className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{completedMatches}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Points</p>
              <p className="text-2xl font-bold text-gray-900">{totalPoints}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Division Statistics */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 bg-gradient-to-r from-green-600 to-green-700">
          <h2 className="text-xl font-bold text-white">Division Statistics</h2>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Division
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Teams
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Matches
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Completed
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(divisionStats).map(([division, stats]) => (
                  <tr key={division} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Trophy className="w-5 h-5 text-yellow-500 mr-2" />
                        <span className="text-sm font-medium text-gray-900">{division}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm text-gray-900">{stats.teams}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm text-gray-900">{stats.matches}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm font-medium text-green-600">{stats.completed}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${stats.matches > 0 ? (stats.completed / stats.matches) * 100 : 0}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500 mt-1">
                        {stats.matches > 0 ? Math.round((stats.completed / stats.matches) * 100) : 0}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Format Statistics */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700">
          <h2 className="text-xl font-bold text-white">Match Format Distribution</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(formatStats).map(([format, count]) => (
              <div key={format} className="text-center">
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="text-3xl font-bold text-gray-900 mb-2">{count}</div>
                  <div className="text-sm font-medium text-gray-600">{format}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {totalMatches > 0 ? Math.round((count / totalMatches) * 100) : 0}% of matches
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Points Distribution */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-700">
          <h2 className="text-xl font-bold text-white">Points Distribution by Division</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {Object.keys(divisionStats).map(division => {
              const divisionScores = scores.filter(s => s.division === division);
              const divisionPoints = divisionScores.reduce((sum, s) => sum + s.points, 0);
              const percentage = totalPoints > 0 ? (divisionPoints / totalPoints) * 100 : 0;
              
              return (
                <div key={division} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Trophy className="w-4 h-4 text-yellow-500 mr-2" />
                    <span className="text-sm font-medium text-gray-900 w-16">{division}</span>
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-gray-900">{divisionPoints} pts</span>
                    <span className="text-xs text-gray-500 ml-2">({Math.round(percentage)}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
