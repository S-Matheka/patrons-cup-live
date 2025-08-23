'use client';

import { useState, useMemo, useEffect } from 'react';
import { Trophy, Medal } from 'lucide-react';
import { useTournament } from '@/context/TournamentContextSwitcher';
import { calculateFinalLeaderboard } from '@/utils/finalLeaderboardCalculator';

interface FinalLeaderboardProps {
  className?: string;
  defaultDivision?: 'Trophy' | 'Shield' | 'Plaque' | 'Bowl' | 'Mug';
  showTabs?: boolean;
  showDebug?: boolean;
}

export default function FinalLeaderboard({ 
  className = '', 
  defaultDivision = 'Trophy',
  showTabs = true,
  showDebug = false
}: FinalLeaderboardProps) {
  const { teams, matches } = useTournament();
  const [activeDivision, setActiveDivision] = useState<'Trophy' | 'Shield' | 'Plaque' | 'Bowl' | 'Mug'>(defaultDivision);
  const [isClient, setIsClient] = useState(false);

  // Only run on client side to prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Calculate leaderboard data
  const leaderboardData = useMemo(() => {
    if (!isClient) return [];
    
    // Add safety checks for teams and matches
    if (!teams || !Array.isArray(teams) || teams.length === 0) {
      console.error("No teams loaded in FinalLeaderboard component");
      return [];
    }
    
    if (!matches || !Array.isArray(matches)) {
      console.error("No matches loaded in FinalLeaderboard component");
      return [];
    }
    
    // Filter for teams in the active division
    const divisionTeams = teams.filter(team => team.division === activeDivision);
    if (divisionTeams.length === 0) {
      console.warn(`No teams found for division: ${activeDivision}`);
      return [];
    }
    
    return calculateFinalLeaderboard(matches, teams, activeDivision);
  }, [isClient, teams, matches, activeDivision]);

  // Don't render anything until client-side
  if (!isClient) {
    return (
      <div className={`bg-white rounded-lg shadow-md ${className}`}>
        <div className="px-6 py-4 bg-gradient-to-r from-green-600 to-green-700">
          <h2 className="text-xl font-bold text-white flex items-center">
            <Trophy className="w-5 h-5 mr-2" />
            Tournament Leaderboard
          </h2>
        </div>
        <div className="p-6">
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-6 py-1">
              <div className="h-2 bg-slate-200 rounded"></div>
              <div className="space-y-3">
                <div className="grid grid-cols-4 gap-4">
                  <div className="h-2 bg-slate-200 rounded col-span-1"></div>
                  <div className="h-2 bg-slate-200 rounded col-span-3"></div>
                </div>
                <div className="h-2 bg-slate-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Get division icon
  const getDivisionIcon = (division: string) => {
    const iconClass = "w-5 h-5";
    switch (division) {
      case 'Trophy':
        return <Trophy className={`${iconClass} text-yellow-500`} />;
      case 'Shield':
        return <Medal className={`${iconClass} text-gray-400`} />;
      case 'Plaque':
        return <Medal className={`${iconClass} text-amber-600`} />;
      case 'Bowl':
        return <Medal className={`${iconClass} text-orange-500`} />;
      case 'Mug':
        return <Medal className={`${iconClass} text-purple-500`} />;
      default:
        return <Trophy className={`${iconClass} text-yellow-500`} />;
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-md ${className}`}>
      <div className="px-6 py-4 bg-gradient-to-r from-green-600 to-green-700">
        <h2 className="text-xl font-bold text-white flex items-center">
          <Trophy className="w-5 h-5 mr-2" />
          Tournament Leaderboard
        </h2>
      </div>
      <div className="p-6">
        {/* Division Tabs */}
        {showTabs && (
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
        )}
        
        {/* Leaderboard Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-2 sm:px-4 font-medium text-gray-600 text-xs sm:text-sm">Position</th>
                <th className="text-left py-3 px-2 sm:px-4 font-medium text-gray-600 text-xs sm:text-sm">Team</th>
                <th className="text-center py-3 px-1 sm:px-4 font-medium text-gray-600 text-xs sm:text-sm">Points</th>
                <th className="text-center py-3 px-1 sm:px-4 font-medium text-gray-600 text-xs sm:text-sm">Played</th>
                <th className="text-center py-3 px-1 sm:px-4 font-medium text-gray-600 text-xs sm:text-sm">Wins</th>
                <th className="text-center py-3 px-1 sm:px-4 font-medium text-gray-600 text-xs sm:text-sm">Loss</th>
                <th className="text-center py-3 px-1 sm:px-4 font-medium text-gray-600 text-xs sm:text-sm">Tied</th>
                <th className="text-center py-3 px-1 sm:px-4 font-medium text-gray-600 text-xs sm:text-sm hidden sm:table-cell">Recent</th>
              </tr>
            </thead>
            <tbody>
              {leaderboardData.map((entry) => (
                <tr key={entry.team.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 sm:py-4 px-2 sm:px-4">
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <span className="text-sm sm:text-lg font-bold text-gray-900">#{entry.position}</span>
                    </div>
                  </td>
                  <td className="py-3 sm:py-4 px-2 sm:px-4">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className="hidden xs:block">
                        {getDivisionIcon(entry.team.division)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 text-xs sm:text-sm truncate">{entry.team.name}</div>
                        <div className="text-xs text-gray-500 hidden sm:block">Seed #{entry.team.seed}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 sm:py-4 px-1 sm:px-4 text-center">
                    <span className="text-sm sm:text-xl font-bold text-green-600">
                      {entry.points.toFixed(1)}
                    </span>
                  </td>
                  <td className="py-3 sm:py-4 px-1 sm:px-4 text-center">
                    <span className="inline-flex px-1 sm:px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {entry.played}
                    </span>
                  </td>
                  <td className="py-3 sm:py-4 px-1 sm:px-4 text-center">
                    <span className="inline-flex px-1 sm:px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      {entry.wins}
                    </span>
                  </td>
                  <td className="py-3 sm:py-4 px-1 sm:px-4 text-center">
                    <span className="inline-flex px-1 sm:px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                      {entry.losses}
                    </span>
                  </td>
                  <td className="py-3 sm:py-4 px-1 sm:px-4 text-center">
                    <span className="inline-flex px-1 sm:px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                      {entry.ties}
                    </span>
                  </td>
                  <td className="py-3 sm:py-4 px-1 sm:px-4 text-center hidden sm:table-cell">
                    <div className="flex items-center justify-center space-x-1">
                      {entry.recentResults ? entry.recentResults.split('').slice(0, 5).map((result, idx) => (
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
              ))}
            </tbody>
          </table>
        </div>

        {leaderboardData.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No scores available</h3>
            <p className="mt-1 text-sm text-gray-500">
              Standings will appear here once matches are completed.
            </p>
          </div>
        )}
        
        {showDebug && (
          <div className="mt-8 p-4 bg-gray-100 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Debug Information</h3>
            <div className="text-xs font-mono overflow-x-auto">
              <p className="mb-2">Division: {activeDivision}</p>
              <p className="mb-2">Teams: {teams?.filter(t => t.division === activeDivision).length || 0}</p>
              <p className="mb-2">All Matches: {matches?.length || 0}</p>
              <p className="mb-2">Division Matches: {matches?.filter(m => m.division === activeDivision).length || 0}</p>
              <p className="mb-2">Completed Matches: {matches?.filter(m => m.status === 'completed' && m.division === activeDivision).length || 0}</p>
              <p className="mb-2">In-Progress Matches: {matches?.filter(m => m.status === 'in-progress' && m.division === activeDivision).length || 0}</p>
              <details>
                <summary className="cursor-pointer">Raw Leaderboard Data</summary>
                <pre className="mt-2 p-2 bg-gray-200 rounded text-xs">
                  {JSON.stringify(leaderboardData, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
