'use client';

import { useTournament } from '@/context/TournamentContextSwitcher';
import { useState } from 'react';
import { Users, Mail, Phone, Trophy, Medal } from 'lucide-react';

export default function Teams() {
  const { teams, players, scores } = useTournament();
  const [selectedDivision, setSelectedDivision] = useState<'Trophy' | 'Shield' | 'Plaque' | 'Bowl' | 'Mug' | 'all'>('all');
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);

  const filteredTeams = selectedDivision === 'all' 
    ? teams 
    : teams.filter(team => team.division === selectedDivision);

  const getTeamScore = (teamId: number) => {
    return scores.find(score => score.teamId === teamId);
  };

  const getTeamPlayers = (teamId: number) => {
    return players.filter(player => player.teamId === teamId);
  };

  const getDivisionIcon = (division: string) => {
    switch (division) {
      case 'Trophy':
        return Trophy;
      case 'Shield':
        return Medal;
      case 'Plaque':
        return Medal;
      case 'Bowl':
        return Medal;
      case 'Mug':
        return Medal;
      default:
        return Medal;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center px-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Teams & Players</h1>
        <p className="text-sm sm:text-lg text-gray-600">Browse tournament teams and player information</p>
      </div>

      {/* Division Filter */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <div className="flex items-center space-x-2 sm:space-x-4 overflow-x-auto pb-2 sm:pb-0">
          <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Filter by Division:</span>
          <button
            onClick={() => setSelectedDivision('all')}
            className={`px-4 py-2 rounded-md font-medium whitespace-nowrap ${
              selectedDivision === 'all'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Divisions
          </button>
          <button
            onClick={() => setSelectedDivision('Trophy')}
            className={`px-4 py-2 rounded-md font-medium whitespace-nowrap ${
              selectedDivision === 'Trophy'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Trophy Division
          </button>
          <button
            onClick={() => setSelectedDivision('Shield')}
            className={`px-4 py-2 rounded-md font-medium whitespace-nowrap ${
              selectedDivision === 'Shield'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Shield Division
          </button>
          <button
            onClick={() => setSelectedDivision('Plaque')}
            className={`px-4 py-2 rounded-md font-medium whitespace-nowrap ${
              selectedDivision === 'Plaque'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Plaque Division
          </button>
          <button
            onClick={() => setSelectedDivision('Bowl')}
            className={`px-4 py-2 rounded-md font-medium whitespace-nowrap ${
              selectedDivision === 'Bowl'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Bowl Division
          </button>
          <button
            onClick={() => setSelectedDivision('Mug')}
            className={`px-4 py-2 rounded-md font-medium whitespace-nowrap ${
              selectedDivision === 'Mug'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Mug Division
          </button>
        </div>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTeams.map(team => {
          const teamScore = getTeamScore(team.id);
          const teamPlayers = getTeamPlayers(team.id);
          const DivisionIcon = getDivisionIcon(team.division);

          return (
            <div key={team.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Team Header */}
              <div 
                className="p-4 text-white"
                style={{ backgroundColor: team.color }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{team.logo}</div>
                    <div>
                      <h3 className="text-lg font-bold">{team.name}</h3>
                      <p className="text-sm opacity-90">{team.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <DivisionIcon className="w-4 h-4" />
                    <span className="text-xs font-medium">{team.division}</span>
                  </div>
                </div>
              </div>

              {/* Team Stats */}
              {teamScore && (
                <div className="p-4 bg-gray-50">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-xl font-bold text-green-600">{teamScore.points || 0}</div>
                      <div className="text-xs text-gray-600">Points</div>
                    </div>
                    <div>
                                              <div className="text-xl font-bold text-blue-600">{teamScore.matchesWon || 0}</div>
                      <div className="text-xs text-gray-600">Wins</div>
                    </div>
                    <div>
                                              <div className="text-xl font-bold text-gray-600">{teamScore.matchesPlayed || 0}</div>
                      <div className="text-xs text-gray-600">Matches</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Players List */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">Players ({teamPlayers.length})</h4>
                  <button
                    onClick={() => setSelectedTeam(selectedTeam === team.id ? null : team.id)}
                    className="text-sm text-green-600 hover:text-green-700"
                  >
                    {selectedTeam === team.id ? 'Hide' : 'View'} Details
                  </button>
                </div>

                {selectedTeam === team.id && (
                  <div className="space-y-3">
                    {teamPlayers.map(player => (
                      <div key={player.id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4 text-gray-500" />
                            <span className="font-medium text-gray-900">{player.name}</span>
                          </div>
                          <span className="text-sm text-gray-600">Handicap: {player.handicap}</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Mail className="w-3 h-3" />
                            <span>{player.email}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Phone className="w-3 h-3" />
                            <span>{player.phone}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {selectedTeam !== team.id && (
                  <div className="space-y-2">
                    {teamPlayers.slice(0, 2).map(player => (
                      <div key={player.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">{player.name}</span>
                        <span className="text-gray-500">Hcp: {player.handicap}</span>
                      </div>
                    ))}
                    {teamPlayers.length > 2 && (
                      <div className="text-sm text-gray-500">
                        +{teamPlayers.length - 2} more players
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Division Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Trophy className="w-6 h-6 text-yellow-600" />
            <h3 className="text-lg font-semibold text-gray-900">Trophy Division</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Teams:</span>
              <span className="font-medium">{teams.filter(t => t.division === 'Trophy').length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Players:</span>
              <span className="font-medium">{players.filter(p => {
                const team = teams.find(t => t.id === p.teamId);
                return team?.division === 'Trophy';
              }).length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Avg Handicap:</span>
              <span className="font-medium">
                {Math.round(players.filter(p => {
                  const team = teams.find(t => t.id === p.teamId);
                  return team?.division === 'Trophy';
                }).reduce((sum, p) => sum + p.handicap, 0) / players.filter(p => {
                  const team = teams.find(t => t.id === p.teamId);
                  return team?.division === 'Trophy';
                }).length)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Medal className="w-6 h-6 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Plate Division</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Teams:</span>
              <span className="font-medium">{teams.filter(t => t.division === 'Plate').length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Players:</span>
              <span className="font-medium">{players.filter(p => {
                const team = teams.find(t => t.id === p.teamId);
                return team?.division === 'Plate';
              }).length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Avg Handicap:</span>
              <span className="font-medium">
                {Math.round(players.filter(p => {
                  const team = teams.find(t => t.id === p.teamId);
                  return team?.division === 'Plate';
                }).reduce((sum, p) => sum + p.handicap, 0) / players.filter(p => {
                  const team = teams.find(t => t.id === p.teamId);
                  return team?.division === 'Plate';
                }).length)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Medal className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Bowl Division</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Teams:</span>
              <span className="font-medium">{teams.filter(t => t.division === 'Bowl').length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Players:</span>
              <span className="font-medium">{players.filter(p => {
                const team = teams.find(t => t.id === p.teamId);
                return team?.division === 'Bowl';
              }).length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Avg Handicap:</span>
              <span className="font-medium">
                {Math.round(players.filter(p => {
                  const team = teams.find(t => t.id === p.teamId);
                  return team?.division === 'Bowl';
                }).reduce((sum, p) => sum + p.handicap, 0) / players.filter(p => {
                  const team = teams.find(t => t.id === p.teamId);
                  return team?.division === 'Bowl';
                }).length)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Medal className="w-6 h-6 text-red-600" />
            <h3 className="text-lg font-semibold text-gray-900">Mug Division</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Teams:</span>
              <span className="font-medium">{teams.filter(t => t.division === 'Mug').length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Players:</span>
              <span className="font-medium">{players.filter(p => {
                const team = teams.find(t => t.id === p.teamId);
                return team?.division === 'Mug';
              }).length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Avg Handicap:</span>
              <span className="font-medium">
                {Math.round(players.filter(p => {
                  const team = teams.find(t => t.id === p.teamId);
                  return team?.division === 'Mug';
                }).reduce((sum, p) => sum + p.handicap, 0) / players.filter(p => {
                  const team = teams.find(t => t.id === p.teamId);
                  return team?.division === 'Mug';
                }).length)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 