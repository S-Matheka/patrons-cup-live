'use client';

import { useTournament } from '@/context/TournamentContextSwitcher';
import { useState, useMemo } from 'react';
import { Trophy, Medal, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import TournamentCountdown from '@/components/TournamentCountdown';
import { calculateLiveStandings } from '@/utils/liveStandingsCalculator';

export default function Dashboard() {
  const { teams, matches, getTeamById } = useTournament();
  const [activeDivision, setActiveDivision] = useState<'Trophy' | 'Shield' | 'Plaque' | 'Bowl' | 'Mug'>('Trophy');

  // Safety check for data availability
  if (!teams || !matches) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tournament data...</p>
        </div>
      </div>
    );
  }

  // Get recent match results for a team (last 5 matches)
  const getTeamForm = (teamId: number) => {
    if (!matches || !Array.isArray(matches)) return [];
    const teamMatches = matches
      .filter(match => 
        match && (match.teamAId === teamId || match.teamBId === teamId) && 
        match.status === 'completed' && 
        !match.isBye
      )
      .sort((a, b) => new Date(b.date || b.match_date || 0).getTime() - new Date(a.date || a.match_date || 0).getTime()) // Most recent first
      .slice(0, 5); // Last 5 matches

    return teamMatches.map(match => {
      if (!match) return 'H';
      const isTeamA = match.teamAId === teamId;
      
      // Calculate match result based on holes won
      let teamHolesWon = 0;
      let opponentHolesWon = 0;
      
      if (match.holes && Array.isArray(match.holes)) {
        match.holes.forEach(hole => {
          if (hole && hole.teamAStrokes && hole.teamBStrokes) {
            if (hole.teamAStrokes < hole.teamBStrokes) {
              if (isTeamA) teamHolesWon++; else opponentHolesWon++;
            } else if (hole.teamBStrokes < hole.teamAStrokes) {
              if (isTeamA) opponentHolesWon++; else teamHolesWon++;
            }
          }
        });
      }

      // Determine result
      if (teamHolesWon > opponentHolesWon) return 'W';
      if (opponentHolesWon > teamHolesWon) return 'L';
      return 'H'; // Halved
    });
  };

  // Get live standings for the selected division using the new calculation
  const divisionStandings = useMemo(() => {
    if (!matches || !teams) return [];
    return calculateLiveStandings(matches, teams, activeDivision);
  }, [matches, teams, activeDivision]);

  // Get tournament statistics
  const tournamentStats = useMemo(() => {
    if (!matches) return { totalMatches: 0, completedMatches: 0, inProgressMatches: 0, completionRate: 0 };
    const totalMatches = matches.length;
    const completedMatches = matches.filter(m => m.status === 'completed').length;
    const inProgressMatches = matches.filter(m => m.status === 'in-progress').length;
    const scheduledMatches = matches.filter(m => m.status === 'scheduled').length;

    return {
      totalMatches,
      completedMatches,
      inProgressMatches,
      scheduledMatches,
      completionPercentage: totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0
    };
  }, [matches]);

  const getPositionIcon = (change: string) => {
    switch (change) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getDivisionIcon = (division: string) => {
    const iconClass = "w-5 h-5";
    switch (division) {
      case 'Trophy':
        return <Trophy className={`${iconClass} text-yellow-500`} />;
      default:
        return <Medal className={`${iconClass} ${
          division === 'Shield' ? 'text-gray-400' :
          division === 'Plaque' ? 'text-amber-600' :
          division === 'Bowl' ? 'text-orange-500' :
          'text-purple-500'
        }`} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Tournament Countdown */}
      <div className="max-w-6xl mx-auto px-4">
        <TournamentCountdown />
      </div>

      {/* Tournament Progress */}
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Tournament Progress</h3>
            <span className="text-2xl font-bold text-green-600">{tournamentStats.completionPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${tournamentStats.completionPercentage}%` }}
            ></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-xl font-bold text-gray-600">{tournamentStats.completedMatches}</div>
              <div className="text-xs text-gray-500">Completed</div>
            </div>
            <div>
              <div className="text-xl font-bold text-green-600">{tournamentStats.inProgressMatches}</div>
              <div className="text-xs text-gray-500">Live</div>
            </div>
            <div>
              <div className="text-xl font-bold text-blue-600">{tournamentStats.scheduledMatches}</div>
              <div className="text-xs text-gray-500">Scheduled</div>
            </div>
            <div>
              <div className="text-xl font-bold text-purple-600">{tournamentStats.totalMatches}</div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard Section */}
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 bg-gradient-to-r from-green-600 to-green-700">
            <h2 className="text-xl font-bold text-white flex items-center">
              <Trophy className="w-5 h-5 mr-2" />
              Live Tournament Standings
            </h2>
          </div>
          <div className="p-6">
            {/* Division Tabs */}
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-1 mb-6 bg-gray-100 p-1 rounded-lg overflow-x-auto">
              {(['Trophy', 'Shield', 'Plaque', 'Bowl', 'Mug'] as const).map((division) => (
                <button
                  key={division}
                  onClick={() => setActiveDivision(division)}
                  className={`flex-shrink-0 px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                    activeDivision === division
                      ? 'bg-white text-green-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    {getDivisionIcon(division)}
                    <span>{division}</span>
                  </div>
                </button>
              ))}
            </div>
            
            {/* Live Standings Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 sm:px-4 font-medium text-gray-600 text-xs sm:text-sm">Position</th>
                    <th className="text-left py-3 px-2 sm:px-4 font-medium text-gray-600 text-xs sm:text-sm">Team</th>
                    <th className="text-center py-3 px-1 sm:px-4 font-medium text-gray-600 text-xs sm:text-sm">Points</th>

                    <th className="text-center py-3 px-1 sm:px-4 font-medium text-gray-600 text-xs sm:text-sm">Wins</th>
                    <th className="text-center py-3 px-1 sm:px-4 font-medium text-gray-600 text-xs sm:text-sm">Loss</th>
                    <th className="text-center py-3 px-1 sm:px-4 font-medium text-gray-600 text-xs sm:text-sm">Tied</th>
                    <th className="text-center py-3 px-1 sm:px-4 font-medium text-gray-600 text-xs sm:text-sm hidden sm:table-cell">Recent</th>
                  </tr>
                </thead>
                <tbody>
                  {divisionStandings.map((standing) => {
                    return (
                      <tr key={standing.team.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 sm:py-4 px-2 sm:px-4">
                          <div className="flex items-center space-x-1 sm:space-x-2">
                            <span className="text-sm sm:text-lg font-bold text-gray-900">#{standing.position}</span>
                            <div className="hidden xs:block">
                              {getPositionIcon(standing.positionChange || 'same')}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 sm:py-4 px-2 sm:px-4">
                          <div className="flex items-center space-x-2 sm:space-x-3">
                            <div className="hidden xs:block">
                              {getDivisionIcon(standing.division)}
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium text-gray-900 text-xs sm:text-sm truncate">{standing.team.name}</div>
                              <div className="text-xs text-gray-500 hidden sm:block">Seed #{standing.team.seed}</div>

                            </div>
                          </div>
                        </td>
                        <td className="py-3 sm:py-4 px-1 sm:px-4 text-center">
                          <span className="text-sm sm:text-xl font-bold text-green-600">
                            {standing.points.toFixed(1)}
                          </span>
                        </td>

                        <td className="py-3 sm:py-4 px-1 sm:px-4 text-center">
                          <span className="inline-flex px-1 sm:px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            {standing.matchesWon}
                          </span>
                        </td>
                        <td className="py-3 sm:py-4 px-1 sm:px-4 text-center">
                          <span className="inline-flex px-1 sm:px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            {standing.matchesLost}
                          </span>
                        </td>
                        <td className="py-3 sm:py-4 px-1 sm:px-4 text-center">
                          <span className="inline-flex px-1 sm:px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                            {standing.matchesHalved}
                          </span>
                        </td>
                        <td className="py-3 sm:py-4 px-1 sm:px-4 text-center hidden sm:table-cell">
                          <div className="flex items-center justify-center space-x-1">
                            {standing.trend && standing.trend !== '-' ? standing.trend.split('').slice(0, 5).map((result, idx) => (
                              <span
                                key={idx}
                                className={`inline-flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 text-xs font-bold rounded-full ${
                                  result === 'W' ? 'bg-green-100 text-green-800' :
                                  result === 'L' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {result}
                              </span>
                            )) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {divisionStandings.length === 0 && (
              <div className="text-center py-12">
                <Trophy className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No scores available</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Standings will appear here once matches are completed.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}