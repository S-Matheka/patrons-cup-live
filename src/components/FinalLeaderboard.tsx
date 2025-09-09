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
  const { teams, matches, scores, loading } = useTournament();
  const [activeDivision, setActiveDivision] = useState<'Trophy' | 'Shield' | 'Plaque' | 'Bowl' | 'Mug'>(defaultDivision);
  const [isClient, setIsClient] = useState(false);

  // Only run on client side to prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Get leaderboard data using the corrected calculation function
  const leaderboardData = useMemo(() => {
    if (!isClient || !teams || !matches) return [];
    
    try {
      // Use the corrected calculation function instead of scores table
      const entries = calculateFinalLeaderboard(matches, teams, activeDivision);
      
      // Add recent results to each entry
      const entriesWithRecent = entries.map(entry => {
      const team = entry.team;
      
      // Calculate recent results for this team
      const teamMatches = matches
        .filter(match => 
          match.division === activeDivision && 
          match.status === 'completed' &&
          (match.teamAId === entry.team.id || match.teamBId === entry.team.id || match.teamCId === entry.team.id)
        )
        .sort((a, b) => b.gameNumber - a.gameNumber) // Most recent first
        .slice(0, 5); // Last 5 matches
      
      const recentResults = teamMatches.map(match => {
        if (match.isThreeWay) {
          // For 3-way matches, determine result based on individual head-to-head
          const holes = match.holes || [];
          // Use same logic as leaderboard calculation: count holes where any two teams have scores
          const holesWithScores = holes; // Process all holes, filter within the logic
          
          if (holesWithScores.length >= 15) {
            let teamWins = 0;
            let teamLosses = 0;
            
            // Check against each opponent
            if (match.teamAId === entry.team.id) {
              // Team A vs B
              let aWins = 0, bWins = 0;
              holesWithScores.forEach(hole => {
                if (hole.teamAScore !== null && hole.teamAScore !== undefined && 
                    hole.teamBScore !== null && hole.teamBScore !== undefined) {
                  if (hole.teamAScore < hole.teamBScore) aWins++;
                  else if (hole.teamBScore < hole.teamAScore) bWins++;
                }
              });
              if (aWins > bWins) teamWins++;
              else if (bWins > aWins) teamLosses++;
              
              // Team A vs C
              let aWinsC = 0, cWins = 0;
              holesWithScores.forEach(hole => {
                if (hole.teamAScore !== null && hole.teamAScore !== undefined && 
                    hole.teamCScore !== null && hole.teamCScore !== undefined) {
                  if (hole.teamAScore < hole.teamCScore) aWinsC++;
                  else if (hole.teamCScore < hole.teamAScore) cWins++;
                }
              });
              if (aWinsC > cWins) teamWins++;
              else if (cWins > aWinsC) teamLosses++;
            } else if (match.teamBId === entry.team.id) {
              // Team B vs A
              let bWins = 0, aWins = 0;
              holesWithScores.forEach(hole => {
                if (hole.teamBScore !== null && hole.teamBScore !== undefined && 
                    hole.teamAScore !== null && hole.teamAScore !== undefined) {
                  if (hole.teamBScore < hole.teamAScore) bWins++;
                  else if (hole.teamAScore < hole.teamBScore) aWins++;
                }
              });
              if (bWins > aWins) teamWins++;
              else if (aWins > bWins) teamLosses++;
              
              // Team B vs C
              let bWinsC = 0, cWins = 0;
              holesWithScores.forEach(hole => {
                if (hole.teamBScore !== null && hole.teamBScore !== undefined && 
                    hole.teamCScore !== null && hole.teamCScore !== undefined) {
                  if (hole.teamBScore < hole.teamCScore) bWinsC++;
                  else if (hole.teamCScore < hole.teamBScore) cWins++;
                }
              });
              if (bWinsC > cWins) teamWins++;
              else if (cWins > bWinsC) teamLosses++;
            } else if (match.teamCId === entry.team.id) {
              // Team C vs A
              let cWins = 0, aWins = 0;
              holesWithScores.forEach(hole => {
                if (hole.teamCScore !== null && hole.teamCScore !== undefined && 
                    hole.teamAScore !== null && hole.teamAScore !== undefined) {
                  if (hole.teamCScore < hole.teamAScore) cWins++;
                  else if (hole.teamAScore < hole.teamCScore) aWins++;
                }
              });
              if (cWins > aWins) teamWins++;
              else if (aWins > cWins) teamLosses++;
              
              // Team C vs B
              let cWinsB = 0, bWins = 0;
              holesWithScores.forEach(hole => {
                if (hole.teamCScore !== null && hole.teamCScore !== undefined && 
                    hole.teamBScore !== null && hole.teamBScore !== undefined) {
                  if (hole.teamCScore < hole.teamBScore) cWinsB++;
                  else if (hole.teamBScore < hole.teamCScore) bWins++;
                }
              });
              if (cWinsB > bWins) teamWins++;
              else if (bWins > cWinsB) teamLosses++;
            }
            
            if (teamWins > teamLosses) return 'W';
            else if (teamLosses > teamWins) return 'L';
            else return 'T';
          }
        } else {
          // For 2-way matches
          const holes = match.holes || [];
          // Use same logic as leaderboard calculation: count holes where both teams have scores
          const holesWithScores = holes; // Process all holes, filter within the logic
          
          if (holesWithScores.length >= 15) {
            let teamAHolesWon = 0;
            let teamBHolesWon = 0;
            
            holesWithScores.forEach(hole => {
              if (hole.teamAScore !== null && hole.teamAScore !== undefined && 
                  hole.teamBScore !== null && hole.teamBScore !== undefined) {
                if (hole.teamAScore < hole.teamBScore) teamAHolesWon++;
                else if (hole.teamBScore < hole.teamAScore) teamBHolesWon++;
              }
            });
            
            if (match.teamAId === entry.team.id) {
              if (teamAHolesWon > teamBHolesWon) return 'W';
              else if (teamBHolesWon > teamAHolesWon) return 'L';
              else return 'T';
            } else {
              if (teamBHolesWon > teamAHolesWon) return 'W';
              else if (teamAHolesWon > teamBHolesWon) return 'L';
              else return 'T';
            }
          }
        }
        return '?'; // Unknown result
      }).join('');
      
      return {
        team: entry.team,
        position: entry.position,
        points: entry.points,
        wins: entry.wins,
        losses: entry.losses,
        ties: entry.ties,
        played: entry.wins + entry.losses + entry.ties,
        recentResults: recentResults || 'N/A'
      };
    });
    
      // Sort by points (descending), then by wins
      return entriesWithRecent
        .sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          return b.wins - a.wins;
        })
        .map((entry, index) => ({
          ...entry,
          position: index + 1
        }));
    } catch (error) {
      console.error('❌ Error calculating leaderboard:', error);
      return [];
    }
  }, [isClient, teams, matches, activeDivision]);

  // Don't render anything until client-side and data is loaded
  if (!isClient || loading) {
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

  // Check if we have data to display
  const hasData = teams && Array.isArray(teams) && teams.length > 0 && 
                  matches && Array.isArray(matches) && matches.length > 0;
  
  // Show loading state if no data yet
  if (!hasData) {
    return (
      <div className={`bg-white rounded-lg shadow-md ${className}`}>
        <div className="px-6 py-4 bg-gradient-to-r from-green-600 to-green-700">
          <h2 className="text-xl font-bold text-white flex items-center">
            <Trophy className="w-5 h-5 mr-2" />
            Tournament Leaderboard
          </h2>
        </div>
        <div className="p-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading tournament data...</p>
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
                        <div className="font-medium text-gray-900 text-xs sm:text-sm">{entry.team.name}</div>
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
