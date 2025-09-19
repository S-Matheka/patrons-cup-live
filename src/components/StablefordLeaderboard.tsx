'use client';

import React, { useState, useMemo } from 'react';
import { useTournament } from '@/context/TournamentContextSwitcher';
import { 
  StablefordTeam, 
  StablefordPlayer, 
  StablefordRound,
  formatScore,
  formatPoints,
  getPointsColor,
  getCoursePar
} from '@/utils/stablefordScoring';
import { 
  calculateStablefordLeaderboard,
  getRoundLeaderboard,
  getTeamLeaderboard,
  StablefordLeaderboardEntry
} from '@/utils/stablefordLeaderboardCalculator';

interface StablefordLeaderboardProps {
  teams?: StablefordTeam[]; // Made optional since we'll get data from context
  showRound?: number | 'aggregate';
  onRoundChange?: (round: number | 'aggregate') => void;
}

const StablefordLeaderboard: React.FC<StablefordLeaderboardProps> = ({
  teams: propTeams,
  showRound = 'aggregate',
  onRoundChange
}) => {
  const { matches, players, teams: contextTeams } = useTournament();
  const [selectedRound, setSelectedRound] = useState<number | 'aggregate'>(showRound);
  const [viewMode, setViewMode] = useState<'individual' | 'team'>('individual');

  // Calculate leaderboard data from real matches and players
  const leaderboardData = useMemo(() => {
    if (!matches || !players || !contextTeams) return [];
    
    try {
      return calculateStablefordLeaderboard(matches, players, contextTeams);
    } catch (error) {
      console.error('Error calculating leaderboard:', error);
      return [];
    }
  }, [matches, players, contextTeams]);

  // Get round-specific leaderboard data
  const roundLeaderboardData = useMemo(() => {
    if (selectedRound === 'aggregate') return leaderboardData;
    return getRoundLeaderboard(leaderboardData, selectedRound);
  }, [leaderboardData, selectedRound]);

  // Get team leaderboard data
  const teamLeaderboardData = useMemo(() => {
    if (!contextTeams) return [];
    return getTeamLeaderboard(leaderboardData, contextTeams);
  }, [leaderboardData, contextTeams]);

  // Sort teams by total points (descending)
  const sortedTeams = useMemo(() => {
    if (viewMode === 'team') {
      return teamLeaderboardData.sort((a, b) => b.teamPoints - a.teamPoints);
    }
    return teamLeaderboardData; // Individual sorting handled by roundLeaderboardData
  }, [teamLeaderboardData, viewMode]);

  // Sort players by points for individual view
  const sortedPlayers = useMemo(() => {
    if (viewMode === 'team') return [];
    return roundLeaderboardData;
  }, [roundLeaderboardData, viewMode]);

  const handleRoundChange = (round: number | 'aggregate') => {
    setSelectedRound(round);
    onRoundChange?.(round);
  };

  const getPlayerPoints = (entry: StablefordLeaderboardEntry, round: number | 'aggregate'): number => {
    if (round === 'aggregate') {
      return entry.totalPoints;
    }
    return entry.roundScores[`round${round}` as keyof typeof entry.roundScores] || 0;
  };

  const getPlayerGross = (entry: StablefordLeaderboardEntry, round: number | 'aggregate'): number | null => {
    if (round === 'aggregate') {
      return entry.totalGross;
    }
    const roundData = entry.player.rounds.find(r => r.roundNumber === round);
    return roundData?.totalGross || null;
  };

  const getPlayerNet = (entry: StablefordLeaderboardEntry, round: number | 'aggregate'): number | null => {
    if (round === 'aggregate') {
      return entry.totalNet;
    }
    const roundData = entry.player.rounds.find(r => r.roundNumber === round);
    return roundData?.totalNet || null;
  };

  const getTeamPoints = (team: StablefordTeam, round: number | 'aggregate'): number => {
    if (round === 'aggregate') {
      return team.teamPoints;
    }
    return team.players.reduce((total, player) => {
      const playerRound = player.rounds.find(r => r.roundNumber === round);
      return total + (playerRound?.totalPoints || 0);
    }, 0);
  };

  const getTeamGross = (team: StablefordTeam, round: number | 'aggregate'): number | null => {
    if (round === 'aggregate') {
      return team.teamGross;
    }
    const grossScores = team.players.map(player => {
      const playerRound = player.rounds.find(r => r.roundNumber === round);
      return playerRound?.totalGross || null;
    });
    
    if (grossScores.some(score => score === null)) return null;
    return grossScores.reduce((total, score) => total + (score || 0), 0);
  };

  const getTeamNet = (team: StablefordTeam, round: number | 'aggregate'): number | null => {
    if (round === 'aggregate') {
      return team.teamNet;
    }
    const netScores = team.players.map(player => {
      const playerRound = player.rounds.find(r => r.roundNumber === round);
      return playerRound?.totalNet || null;
    });
    
    if (netScores.some(score => score === null)) return null;
    return netScores.reduce((total, score) => total + (score || 0), 0);
  };

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Header Controls */}
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Stableford Leaderboard</h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Karen Country Club - {getCoursePar()} Par Course
            </p>
          </div>
          
          <div className="flex flex-col gap-3">
            {/* View Mode Toggle */}
            <div className="flex rounded-lg border border-gray-300 overflow-hidden">
              <button
                onClick={() => setViewMode('individual')}
                className={`flex-1 px-3 py-2 text-xs sm:text-sm font-medium transition-colors ${
                  viewMode === 'individual'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Individual
              </button>
              <button
                onClick={() => setViewMode('team')}
                className={`flex-1 px-3 py-2 text-xs sm:text-sm font-medium transition-colors ${
                  viewMode === 'team'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Team
              </button>
            </div>

            {/* Round Selector */}
            <div className="flex rounded-lg border border-gray-300 overflow-hidden">
              <button
                onClick={() => handleRoundChange('aggregate')}
                className={`flex-1 px-2 py-2 text-xs sm:text-sm font-medium transition-colors ${
                  selectedRound === 'aggregate'
                    ? 'bg-green-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Overall
              </button>
              {[1, 2, 3].map((round) => (
                <button
                  key={round}
                  onClick={() => handleRoundChange(round)}
                  className={`flex-1 px-2 py-2 text-xs sm:text-sm font-medium transition-colors ${
                    selectedRound === round
                      ? 'bg-green-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  R{round}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pos
              </th>
              <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {viewMode === 'individual' ? 'Player' : 'Team'}
              </th>
              <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Handicap
              </th>
              <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Points
              </th>
              <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Gross
              </th>
              <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Net
              </th>
              <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                To Par
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {viewMode === 'individual' ? (
              sortedPlayers.map((entry) => {
                const points = getPlayerPoints(entry, selectedRound);
                const gross = getPlayerGross(entry, selectedRound);
                const net = getPlayerNet(entry, selectedRound);
                const toPar = gross ? gross - getCoursePar() : null;

                return (
                  <tr key={entry.player.id} className="hover:bg-gray-50">
                    <td className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {entry.position}
                    </td>
                    <td className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 truncate max-w-[120px] sm:max-w-none">
                          {entry.player.name}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500 truncate max-w-[120px] sm:max-w-none">
                          {entry.player.teamName}
                        </div>
                        <div className="sm:hidden text-xs text-gray-400">
                          HCP: {entry.player.handicap}
                        </div>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.player.handicap}
                    </td>
                    <td className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <span className={`text-base sm:text-lg font-bold ${getPointsColor(points)}`}>
                        {formatPoints(points)}
                      </span>
                    </td>
                    <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatScore(gross)}
                    </td>
                    <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatScore(net)}
                    </td>
                    <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {toPar !== null ? (toPar > 0 ? `+${toPar}` : toPar.toString()) : '-'}
                    </td>
                  </tr>
                );
              })
            ) : (
              sortedTeams.map((team) => {
                const points = getTeamPoints(team, selectedRound);
                const gross = getTeamGross(team, selectedRound);
                const net = getTeamNet(team, selectedRound);
                const toPar = gross ? gross - (getCoursePar() * 4) : null; // 4 players per team

                return (
                  <tr key={team.id} className="hover:bg-gray-50">
                    <td className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {team.position}
                    </td>
                    <td className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full mr-2 sm:mr-3 ${
                          team.division === 'KAREN' ? 'bg-green-500' : 'bg-blue-500'
                        }`}></div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 truncate max-w-[100px] sm:max-w-none">
                            {team.name}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-500">
                            {team.division}
                          </div>
                          <div className="sm:hidden text-xs text-gray-400">
                            {team.players.length} players
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {team.players.length} players
                    </td>
                    <td className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <span className={`text-base sm:text-lg font-bold ${getPointsColor(points)}`}>
                        {formatPoints(points)}
                      </span>
                    </td>
                    <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatScore(gross)}
                    </td>
                    <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatScore(net)}
                    </td>
                    <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {toPar !== null ? (toPar > 0 ? `+${toPar}` : toPar.toString()) : '-'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex flex-col gap-2 text-xs sm:text-sm text-gray-600">
          <div>
            <strong>Stableford Points:</strong> Albatross (5), Eagle (4), Birdie (3), Par (2), Bogey (1), Double+ (0)
          </div>
          <div>
            Showing: {selectedRound === 'aggregate' ? 'Overall Aggregate' : `Round ${selectedRound}`} - {viewMode === 'individual' ? 'Individual' : 'Team'} View
          </div>
        </div>
      </div>
    </div>
  );
};

export default StablefordLeaderboard;