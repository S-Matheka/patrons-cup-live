'use client';

import { useTournament } from '@/context/TournamentContextSwitcher';
import { useState, useMemo } from 'react';
import { Trophy, Medal, TrendingUp, TrendingDown, Minus, Clock, CheckCircle } from 'lucide-react';
import TournamentCountdown from '@/components/TournamentCountdown';
import { calculateLiveStandings, getLiveTournamentStats } from '@/utils/liveStandingsCalculator';

export default function LeaderboardPage() {
  const { teams, matches, getTeamById } = useTournament();
  const [activeDivision, setActiveDivision] = useState<'Trophy' | 'Shield' | 'Plaque' | 'Bowl' | 'Mug'>('Trophy');

  // Get LIVE standings calculated from current match data (CUMULATIVE)
  const divisionStandings = useMemo(() => {
    if (!matches || !teams) return [];
    return calculateLiveStandings(matches, teams, activeDivision);
  }, [matches, teams, activeDivision]);

  // Get LIVE tournament statistics
  const tournamentStats = useMemo(() => {
    if (!matches) return { completed: 0, inProgress: 0, scheduled: 0, total: 0 };
    return getLiveTournamentStats(matches);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tournament Countdown */}
        <div className="mb-8">
          <TournamentCountdown />
        </div>

        {/* Tournament Progress */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Tournament Progress</h3>
            <span className="text-2xl font-bold text-green-600">
              {tournamentStats.total > 0 ? Math.round((tournamentStats.completed / tournamentStats.total) * 100) : 0}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${tournamentStats.total > 0 ? (tournamentStats.completed / tournamentStats.total) * 100 : 0}%` 
              }}
            ></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-xl font-bold text-gray-600">{tournamentStats.completed}</div>
              <div className="text-xs text-gray-500">Completed</div>
            </div>
            <div>
              <div className="text-xl font-bold text-green-600">{tournamentStats.inProgress}</div>
              <div className="text-xs text-gray-500">Live</div>
            </div>
            <div>
              <div className="text-xl font-bold text-blue-600">{tournamentStats.scheduled}</div>
              <div className="text-xs text-gray-500">Scheduled</div>
            </div>
            <div>
              <div className="text-xl font-bold text-purple-600">{tournamentStats.total}</div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
          </div>
        </div>

        {/* Division Selector */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {(['Trophy', 'Shield', 'Plaque', 'Bowl', 'Mug'] as const).map((division) => (
              <button
                key={division}
                onClick={() => setActiveDivision(division)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeDivision === division
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {division}
              </button>
            ))}
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700">
            <h2 className="text-xl font-bold text-white flex items-center">
              <Trophy className="w-5 h-5 mr-2" />
              {activeDivision} Division - Live Leaderboard
            </h2>
            <p className="text-blue-100 text-sm mt-1">
              Cumulative points from all matches (Friday + Saturday live)
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Position</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Team</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">Points</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">Won</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">Lost</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">Tied</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">Recent</th>
                </tr>
              </thead>
              <tbody>
                {divisionStandings && Array.isArray(divisionStandings) ? divisionStandings.map((standing) => (
                  <tr key={standing.team.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold text-gray-900">#{standing.position}</span>
                        {getPositionIcon(standing.positionChange)}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{standing.team.logo}</span>
                        <div>
                          <div className="font-medium text-gray-900">{standing.team.name}</div>
                          <div className="text-sm text-gray-500">{standing.team.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="text-xl font-bold text-blue-600">
                        {standing.points}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {standing.matchesWon}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {standing.matchesLost}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        {standing.matchesHalved}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        {standing.trend && standing.trend !== '-' ? standing.trend.split('').slice(0, 5).map((result, idx) => (
                          <span
                            key={idx}
                            className={`inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full ${
                              result === 'W' ? 'bg-green-100 text-green-800' :
                              result === 'L' ? 'bg-red-100 text-red-800' :
                              result === 'H' ? 'bg-yellow-100 text-yellow-800' :
                              result === 'P' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {result === 'P' ? '●' : result}
                          </span>
                        )) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-500">
                      Loading live tournament data...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {(!divisionStandings || divisionStandings.length === 0) && (
            <div className="text-center py-12">
              <Trophy className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Loading standings...</h3>
              <p className="mt-1 text-sm text-gray-500">
                Cumulative standings will appear here with live data from Supabase.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}