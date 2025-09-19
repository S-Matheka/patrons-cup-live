'use client';

import React, { useState, useMemo } from 'react';
import { useTournament } from '@/context/TournamentContextSwitcher';
import { Team, Player } from '@/types';
import KarenDrawDisplay from '@/components/KarenDrawDisplay';
import { BarChart3, Users, Calendar, Settings, Trophy, User } from 'lucide-react';

type AdminTabType = 'overview' | 'teams' | 'players' | 'draw' | 'leaderboard' | 'settings';

const KarenStablefordAdmin: React.FC = () => {
  const { currentTournament, teams, players, switchTournament } = useTournament();
  const [activeTab, setActiveTab] = useState<AdminTabType>('overview');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  // Filter teams and players for Karen Stableford
  const karenTeams = useMemo(() => 
    teams.filter(team => team.division === 'KAREN' || team.division === 'VISITOR'),
    [teams]
  );

  const karenPlayers = useMemo(() => 
    players.filter(player => {
      const team = teams.find(t => t.id === player.teamId);
      return team && (team.division === 'KAREN' || team.division === 'VISITOR');
    }),
    [players, teams]
  );

  const karenTeamsData = karenTeams.filter(t => t.division === 'KAREN');
  const visitorTeamsData = karenTeams.filter(t => t.division === 'VISITOR');

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Tournament Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Trophy className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Teams</p>
              <p className="text-2xl font-bold text-gray-900">{karenTeams.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Players</p>
              <p className="text-2xl font-bold text-gray-900">{karenPlayers.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Rounds</p>
              <p className="text-2xl font-bold text-gray-900">3</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Format</p>
              <p className="text-2xl font-bold text-gray-900">Stableford</p>
            </div>
          </div>
        </div>
      </div>

      {/* Team Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="w-4 h-4 bg-green-500 rounded-full mr-3"></span>
            KAREN Teams ({karenTeamsData.length})
          </h3>
          <div className="space-y-2">
            {karenTeamsData.map((team) => {
              const teamPlayers = karenPlayers.filter(p => p.teamId === team.id);
              return (
                <div key={team.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{team.name}</div>
                    <div className="text-sm text-gray-600">{teamPlayers.length} players</div>
                  </div>
                  <button
                    onClick={() => setSelectedTeam(team)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View Details
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="w-4 h-4 bg-blue-500 rounded-full mr-3"></span>
            VISITOR Teams ({visitorTeamsData.length})
          </h3>
          <div className="space-y-2">
            {visitorTeamsData.map((team) => {
              const teamPlayers = karenPlayers.filter(p => p.teamId === team.id);
              return (
                <div key={team.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{team.name}</div>
                    <div className="text-sm text-gray-600">{teamPlayers.length} players</div>
                  </div>
                  <button
                    onClick={() => setSelectedTeam(team)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View Details
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tournament Information */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tournament Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Course Details</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>Course: Karen Country Club</li>
              <li>Par: 72</li>
              <li>Holes: 18</li>
              <li>Format: Stableford</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Schedule</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>Round 1: Saturday AM</li>
              <li>Round 2: Saturday PM</li>
              <li>Round 3: Sunday AM</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTeamsTab = () => (
    <div className="space-y-6">
      {/* KAREN Teams */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <span className="w-4 h-4 bg-green-500 rounded-full mr-3"></span>
          KAREN Teams
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {karenTeamsData.map((team) => {
            const teamPlayers = karenPlayers.filter(p => p.teamId === team.id);
            return (
              <div key={team.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">{team.name}</h4>
                  <span className="text-xs text-gray-500">#{team.id}</span>
                </div>
                <div className="text-sm text-gray-600 mb-3">
                  {teamPlayers.length} players
                </div>
                <div className="space-y-2">
                  {teamPlayers.map((player) => (
                    <div key={player.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">{player.name}</span>
                      <span className="text-gray-500 font-medium">HCP {player.handicap || 0}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <button
                    onClick={() => setSelectedTeam(team)}
                    className="w-full text-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Manage Team
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* VISITOR Teams */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <span className="w-4 h-4 bg-blue-500 rounded-full mr-3"></span>
          VISITOR Teams
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visitorTeamsData.map((team) => {
            const teamPlayers = karenPlayers.filter(p => p.teamId === team.id);
            return (
              <div key={team.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">{team.name}</h4>
                  <span className="text-xs text-gray-500">#{team.id}</span>
                </div>
                <div className="text-sm text-gray-600 mb-3">
                  {teamPlayers.length} players
                </div>
                <div className="space-y-2">
                  {teamPlayers.map((player) => (
                    <div key={player.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">{player.name}</span>
                      <span className="text-gray-500 font-medium">HCP {player.handicap || 0}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <button
                    onClick={() => setSelectedTeam(team)}
                    className="w-full text-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Manage Team
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderPlayersTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">All Players</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Player
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Team
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Division
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Handicap
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {karenPlayers.map((player) => {
                const team = teams.find(t => t.id === player.teamId);
                return (
                  <tr key={player.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="h-5 w-5 text-gray-400 mr-3" />
                        <div className="text-sm font-medium text-gray-900">{player.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {team?.name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        team?.division === 'KAREN' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {team?.division || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {player.handicap || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900">
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderDrawTab = () => (
    <div className="space-y-6">
      <KarenDrawDisplay />
    </div>
  );

  const renderLeaderboardTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Leaderboard Management</h3>
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-4">📊</div>
          <h4 className="text-xl font-medium text-gray-900 mb-2">Live Leaderboard</h4>
          <p className="text-gray-600">
            Real-time leaderboard updates and scoring management.
          </p>
        </div>
      </div>
    </div>
  );

  const renderSettingsTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tournament Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tournament Status
            </label>
            <select className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
              <option value="upcoming">Upcoming</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Scoring System
            </label>
            <div className="text-sm text-gray-600">
              Stableford Points: Albatross (5), Eagle (4), Birdie (3), Par (2), Bogey (1), Double+ (0)
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course Information
            </label>
            <div className="text-sm text-gray-600">
              Karen Country Club - 72 Par, 18 Holes
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (!currentTournament || currentTournament.slug !== 'karen-stableford-2025') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Karen Country Club Stableford - Admin
            </h1>
            <p className="text-gray-600 mb-6">
              Please select the Karen Stableford tournament from the tournament selector.
            </p>
            <button
              onClick={() => switchTournament?.(2)} // Assuming Karen Stableford has ID 2
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Switch to Karen Stableford
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Karen Country Club Stableford - Admin
          </h1>
          <p className="text-gray-600">
            Tournament Management • {currentTournament.startDate} - {currentTournament.endDate}
          </p>
        </div>

        {/* Tabbed Navigation */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'overview', name: 'Overview', icon: BarChart3 },
                { id: 'teams', name: 'Teams', icon: Users },
                { id: 'players', name: 'Players', icon: User },
                { id: 'draw', name: 'Draw', icon: Calendar },
                { id: 'leaderboard', name: 'Leaderboard', icon: BarChart3 },
                { id: 'settings', name: 'Settings', icon: Settings }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as AdminTabType)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="h-4 w-4 mr-2" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'teams' && renderTeamsTab()}
        {activeTab === 'players' && renderPlayersTab()}
        {activeTab === 'draw' && renderDrawTab()}
        {activeTab === 'leaderboard' && renderLeaderboardTab()}
        {activeTab === 'settings' && renderSettingsTab()}
      </div>
    </div>
  );
};

export default KarenStablefordAdmin;