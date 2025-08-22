'use client';

import { useTournament } from '@/context/TournamentContext';
import { useState, useMemo } from 'react';
import { Trophy, Medal, TrendingUp, TrendingDown, Minus, Clock, CheckCircle } from 'lucide-react';
import TournamentCountdown from '@/components/TournamentCountdown';
import { calculateLiveStandings, getLiveTournamentStats } from '@/utils/liveStandingsCalculator';

export default function LeaderboardPage() {
  const { teams, scores, matches, getTeamById } = useTournament();
  const [activeDivision, setActiveDivision] = useState<'Trophy' | 'Shield' | 'Plaque' | 'Bowl' | 'Mug'>('Trophy');

  // Get recent match results for a team (last 5 matches)
  const getTeamForm = (teamId: number) => {
    const teamMatches = matches
      .filter(match => 
        (match.teamAId === teamId || match.teamBId === teamId) && 
        match.status === 'completed' && 
        !match.isBye
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Most recent first
      .slice(0, 5); // Last 5 matches

    return teamMatches.map(match => {
      const isTeamA = match.teamAId === teamId;
      
      // Calculate match result based on holes won
      let teamHolesWon = 0;
      let opponentHolesWon = 0;
      
      match.holes?.forEach(hole => {
        if (hole.teamAStrokes && hole.teamBStrokes) {
          if (hole.teamAStrokes < hole.teamBStrokes) {
            if (isTeamA) teamHolesWon++; else opponentHolesWon++;
          } else if (hole.teamBStrokes < hole.teamAStrokes) {
            if (isTeamA) opponentHolesWon++; else teamHolesWon++;
          }
        }
      });

      // Determine result
      if (teamHolesWon > opponentHolesWon) return 'W';
      if (opponentHolesWon > teamHolesWon) return 'L';
      return 'H'; // Halved
    });
  };

  // Get LIVE standings calculated from current match data
  const divisionStandings = useMemo(() => {
    return calculateLiveStandings(matches, teams, activeDivision);
  }, [matches, teams, activeDivision]);

  // Get LIVE tournament statistics
  const tournamentStats = useMemo(() => {
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
      {/* Header */}
      <div className="text-center px-4">
        <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">Live Tournament Leaderboard</h1>
        <p className="text-sm md:text-lg text-gray-600">Dynamic standings updated in real-time</p>
      </div>

      {/* Tournament Countdown */}
      <div className="max-w-6xl mx-auto">
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
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Position</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Team</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-600">Points</th>

                    <th className="text-center py-3 px-4 font-medium text-gray-600">Wins</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-600">Loss</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-600">Tied</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-600">Recent</th>
                  </tr>
                </thead>
                <tbody>
                  {divisionStandings.map((standing) => {
                    return (
                      <tr key={standing.teamId} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg font-bold text-gray-900">#{standing.position}</span>
                            {getPositionIcon(standing.positionChange)}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            {getDivisionIcon(standing.division)}
                            <div>
                              <div className="font-medium text-gray-900">{standing.team.name}</div>
                              <div className="text-sm text-gray-500">Seed #{standing.team.seed}</div>
                              {/* Show live match status */}
                              {standing.liveMatchStatus.length > 0 && (
                                <div className="text-xs text-blue-600 font-medium mt-1">
                                  <Clock className="w-3 h-3 inline mr-1" />
                                  {standing.liveMatchStatus[0]}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="text-xl font-bold text-green-600">
                            {standing.points.toFixed(1)}
                          </span>
                        </td>

                        <td className="py-4 px-4 text-center">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            {standing.matchesWon}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            {standing.matchesLost}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                            {standing.matchesHalved}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            {standing.trend !== '-' ? standing.trend.split('-').slice(0, 5).map((result, idx) => (
                              <span
                                key={idx}
                                className={`inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full ${
                                  result === 'W' ? 'bg-green-100 text-green-800' :
                                  result === 'L' ? 'bg-red-100 text-red-800' :
                                  result === 'H' ? 'bg-gray-100 text-gray-800' :
                                  result === 'IP' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {result === 'IP' ? '●' : result}
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

      {/* Tournament Info */}
      <div className="max-w-6xl mx-auto">
        <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">{teams.length}</div>
              <div className="text-sm text-gray-600">Teams Participating</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">5</div>
              <div className="text-sm text-gray-600">Divisions</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">Aug 22-24</div>
              <div className="text-sm text-gray-600">Tournament Dates</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
