'use client';

import { useTournament } from '@/context/TournamentContext';
import { Score, Team } from '@/types';
import { useState, useMemo } from 'react';
import { Trophy, Medal, TrendingUp, TrendingDown, Minus, Clock } from 'lucide-react';
import { calculateLiveStandings } from '@/utils/liveStandingsCalculator';

export default function Standings() {
  const { teams, matches } = useTournament();
  const [selectedDivision, setSelectedDivision] = useState<'Trophy' | 'Shield' | 'Plaque' | 'Bowl' | 'Mug' | 'all'>('all');

  // Calculate LIVE standings from current match data
  const trophyStandings = useMemo(() => calculateLiveStandings(matches, teams, 'Trophy'), [matches, teams]);
  const shieldStandings = useMemo(() => calculateLiveStandings(matches, teams, 'Shield'), [matches, teams]);
  const plaqueStandings = useMemo(() => calculateLiveStandings(matches, teams, 'Plaque'), [matches, teams]);
  const bowlStandings = useMemo(() => calculateLiveStandings(matches, teams, 'Bowl'), [matches, teams]);
  const mugStandings = useMemo(() => calculateLiveStandings(matches, teams, 'Mug'), [matches, teams]);



  const getTeamById = (teamId: number) => {
    return teams.find(team => team.id === teamId);
  };

  const getDivisionIcon = (division: string) => {
    return division === 'Trophy' ? Trophy : Medal;
  };

  const getTrendIcon = (standing: any) => {
    // Show trend based on positionChange property
    if (!standing.positionChange || standing.positionChange === 'same') {
      return <Minus className="w-4 h-4 text-gray-400" />;
    }
    
    switch (standing.positionChange) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const calculateWinRate = (matchesWon: number, matchesPlayed: number) => {
    if (matchesPlayed === 0) return 0;
    return Math.round((matchesWon / matchesPlayed) * 100);
  };

  const sortedScores = (divisionScores: Score[]) => {
    return divisionScores
      .map(score => {
        const team = getTeamById(standing.teamId);
        return team ? { ...score, team } : null;
      })
      .filter((item): item is Score & { team: Team } => item !== null)
      .sort((a, b) => {
        // Sort by points first, then by win rate, then by holes won
        if (a.points !== b.points) return b.points - a.points;
        const aWinRate = calculateWinRate(a.matchesWon, a.matchesPlayed);
        const bWinRate = calculateWinRate(b.matchesWon, b.matchesPlayed);
        if (aWinRate !== bWinRate) return bWinRate - aWinRate;
        // If win rates are equal, sort by matches won, then by matches played (fewer is better)
        if (b.matchesWon !== a.matchesWon) return b.matchesWon - a.matchesWon;
        return a.matchesPlayed - b.matchesPlayed;
      });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center px-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Tournament Standings</h1>
        <p className="text-sm sm:text-lg text-gray-600">Current rankings and performance statistics</p>
      </div>

      {/* Division Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-4 sm:space-x-8 px-4 sm:px-6 overflow-x-auto">
            <button
              onClick={() => setSelectedDivision('all')}
              className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                selectedDivision === 'all'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              All Divisions
            </button>
            <button
              onClick={() => setSelectedDivision('Trophy')}
              className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                selectedDivision === 'Trophy'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Trophy
            </button>
            <button
              onClick={() => setSelectedDivision('Shield')}
              className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                selectedDivision === 'Shield'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Shield
            </button>
            <button
              onClick={() => setSelectedDivision('Plaque')}
              className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                selectedDivision === 'Plaque'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Plaque
            </button>
            <button
              onClick={() => setSelectedDivision('Bowl')}
              className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                selectedDivision === 'Bowl'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Bowl
            </button>
            <button
              onClick={() => setSelectedDivision('Mug')}
              className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                selectedDivision === 'Mug'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Mug
            </button>
          </nav>
        </div>

        <div className="p-4 sm:p-6">
          {selectedDivision === 'all' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Trophy Division</h3>
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                        <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                        <th className="px-1 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>

                        <th className="px-1 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wins</th>
                        <th className="px-1 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loss</th>
                        <th className="px-1 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tied</th>
                        <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recent</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {trophyStandings.map((standing, index) => (
                        <tr key={standing.teamId} className="hover:bg-gray-50">
                          <td className="px-2 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{standing.position}</td>
                          <td className="px-2 sm:px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div 
                                className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold mr-2 sm:mr-3 flex-shrink-0"
                                style={{ backgroundColor: standing.team.color }}
                              >
                                {standing.team.logo}
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">{standing.team.name}</div>
                                <div className="text-xs text-gray-500 hidden sm:block truncate">{standing.team.description}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-1 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 font-bold">{standing.points}</td>

                          <td className="px-1 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">{standing.matchesWon}</td>
                          <td className="px-1 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">{standing.matchesLost}</td>
                          <td className="px-1 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">{standing.matchesHalved}</td>
                          <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getTrendIcon(standing)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Shield Division</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>

                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wins</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loss</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tied</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recent</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {shieldStandings.map((standing, index) => (
                        <tr key={standing.teamId} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{standing.position}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div 
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3"
                                style={{ backgroundColor: standing.team.color }}
                              >
                                {standing.team.logo}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">{standing.team.name}</div>
                                <div className="text-sm text-gray-500">{standing.team.description}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">{standing.points}</td>

                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{standing.matchesWon}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{standing.matchesLost}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{standing.matchesHalved}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getTrendIcon(standing)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Plaque Division</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>

                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wins</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loss</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tied</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recent</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {plaqueStandings.map((standing, index) => (
                        <tr key={standing.teamId} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{standing.position}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div 
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3"
                                style={{ backgroundColor: standing.team.color }}
                              >
                                {standing.team.logo}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">{standing.team.name}</div>
                                <div className="text-sm text-gray-500">{standing.team.description}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">{standing.points}</td>

                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{standing.matchesWon}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{standing.matchesLost}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{standing.matchesHalved}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getTrendIcon(standing)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Bowl Division</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>

                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wins</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loss</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tied</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recent</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {bowlStandings.map((standing, index) => (
                        <tr key={standing.teamId} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{standing.position}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div 
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3"
                                style={{ backgroundColor: standing.team.color }}
                              >
                                {standing.team.logo}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">{standing.team.name}</div>
                                <div className="text-sm text-gray-500">{standing.team.description}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">{standing.points}</td>

                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{standing.matchesWon}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{standing.matchesLost}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{standing.matchesHalved}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getTrendIcon(standing)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Mug Division</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>

                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wins</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loss</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tied</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recent</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {mugStandings.map((standing, index) => (
                        <tr key={standing.teamId} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{standing.position}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div 
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3"
                                style={{ backgroundColor: standing.team.color }}
                              >
                                {standing.team.logo}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">{standing.team.name}</div>
                                <div className="text-sm text-gray-500">{standing.team.description}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">{standing.points}</td>

                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{standing.matchesWon}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{standing.matchesLost}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{standing.matchesHalved}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getTrendIcon(standing)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {selectedDivision === 'Trophy' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>

                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wins</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loss</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tied</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recent</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {trophyStandings.map((standing, index) => (
                    <tr key={standing.teamId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{standing.position}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3"
                            style={{ backgroundColor: standing.team.color }}
                          >
                            {standing.team.logo}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{standing.team.name}</div>
                            <div className="text-sm text-gray-500">{standing.team.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">{standing.points}</td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{standing.matchesWon}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{standing.matchesLost}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{standing.matchesHalved}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getTrendIcon(standing)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {selectedDivision === 'Shield' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>

                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wins</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loss</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tied</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recent</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {shieldStandings.map((standing, index) => (
                    <tr key={standing.teamId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{standing.position}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3"
                            style={{ backgroundColor: standing.team.color }}
                          >
                            {standing.team.logo}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{standing.team.name}</div>
                            <div className="text-sm text-gray-500">{standing.team.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">{standing.points}</td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{standing.matchesWon}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{standing.matchesLost}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{standing.matchesHalved}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getTrendIcon(standing)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {selectedDivision === 'Plaque' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>

                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wins</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loss</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tied</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recent</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {plaqueStandings.map((standing, index) => (
                    <tr key={standing.teamId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{standing.position}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3"
                            style={{ backgroundColor: standing.team.color }}
                          >
                            {standing.team.logo}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{standing.team.name}</div>
                            <div className="text-sm text-gray-500">{standing.team.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">{standing.points}</td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{standing.matchesWon}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{standing.matchesLost}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{standing.matchesHalved}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getTrendIcon(standing)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {selectedDivision === 'Bowl' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>

                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wins</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loss</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tied</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recent</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bowlStandings.map((standing, index) => (
                    <tr key={standing.teamId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{standing.position}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3"
                            style={{ backgroundColor: standing.team.color }}
                          >
                            {standing.team.logo}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{standing.team.name}</div>
                            <div className="text-sm text-gray-500">{standing.team.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">{standing.points}</td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{standing.matchesWon}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{standing.matchesLost}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{standing.matchesHalved}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getTrendIcon(standing)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {selectedDivision === 'Mug' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>

                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wins</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loss</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tied</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recent</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {mugStandings.map((standing, index) => (
                    <tr key={standing.teamId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{standing.position}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3"
                            style={{ backgroundColor: standing.team.color }}
                          >
                            {standing.team.logo}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{standing.team.name}</div>
                            <div className="text-sm text-gray-500">{standing.team.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">{standing.points}</td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{standing.matchesWon}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{standing.matchesLost}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{standing.matchesHalved}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getTrendIcon(standing)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 