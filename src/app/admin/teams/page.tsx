'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTournament } from '@/context/TournamentContext';
import { supabase } from '@/lib/supabase';
import { Team, Player } from '@/types';
import TeamEditModal from '@/components/admin/TeamEditModal';
import PlayerEditModal from '@/components/admin/PlayerEditModal';
import RoleGuard from '@/components/admin/RoleGuard';
import { 
  Users, 
  Edit, 
  Trash2, 
  Plus,
  Trophy,
  Medal,
  Search,
  UserPlus,
  Settings
} from 'lucide-react';

export default function AdminTeamsPage() {
  const { user } = useAuth();
  const { teams, players, getPlayersByTeamId } = useTournament();
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([]);
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<number | undefined>();
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    type: 'team' | 'player';
    id: number;
    name: string;
  } | null>(null);

  useEffect(() => {
    if (!user) return;
    filterTeams();
  }, [teams, selectedDivision, searchTerm]);

  const filterTeams = () => {
    let filtered = teams;

    if (selectedDivision !== 'all') {
      filtered = filtered.filter(team => team.division === selectedDivision);
    }

    if (searchTerm) {
      filtered = filtered.filter(team => 
        team.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredTeams(filtered.sort((a, b) => a.seed - b.seed));
  };

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
        return <Medal className={`${iconClass} text-gray-400`} />;
    }
  };

  const getDivisionColor = (division: string) => {
    switch (division) {
      case 'Trophy':
        return 'bg-yellow-100 text-yellow-800';
      case 'Shield':
        return 'bg-gray-100 text-gray-800';
      case 'Plaque':
        return 'bg-amber-100 text-amber-800';
      case 'Bowl':
        return 'bg-orange-100 text-orange-800';
      case 'Mug':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const handleEditTeam = (team: Team) => {
    setEditingTeam(team);
    setShowTeamModal(true);
  };

  const handleAddTeam = () => {
    setEditingTeam(null);
    setShowTeamModal(true);
  };

  const handleSaveTeam = (team: Team) => {
    // The real-time subscription will handle updating the UI
    console.log('Team saved:', team);
  };

  const handleAddPlayer = (teamId: number) => {
    setSelectedTeamId(teamId);
    setEditingPlayer(null);
    setShowPlayerModal(true);
  };

  const handleEditPlayer = (player: Player) => {
    setEditingPlayer(player);
    setSelectedTeamId(player.teamId);
    setShowPlayerModal(true);
  };

  const handleSavePlayer = (player: Player) => {
    // The real-time subscription will handle updating the UI
    console.log('Player saved:', player);
  };

  const handleDeleteTeam = async (teamId: number) => {
    try {
      setIsLoading(true);
      
      // First delete all players in the team
      const { error: playersError } = await supabase
        .from('players')
        .delete()
        .eq('team_id', teamId);

      if (playersError) throw playersError;

      // Then delete the team
      const { error: teamError } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);

      if (teamError) throw teamError;

      console.log('Team and players deleted successfully');
      setDeleteConfirmation(null);
      
      // The real-time subscription will automatically update the UI
    } catch (error) {
      console.error('Error deleting team:', error);
      alert('Failed to delete team. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePlayer = async (playerId: number) => {
    try {
      setIsLoading(true);
      
      // Delete from Supabase
      const { error } = await supabase
        .from('players')
        .delete()
        .eq('id', playerId);

      if (error) throw error;

      console.log('Player deleted successfully');
      setDeleteConfirmation(null);
      
      // The real-time subscription will automatically update the UI
    } catch (error) {
      console.error('Error deleting player:', error);
      alert('Failed to delete player. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const confirmDelete = () => {
    if (!deleteConfirmation) return;

    if (deleteConfirmation.type === 'team') {
      handleDeleteTeam(deleteConfirmation.id);
    } else {
      handleDeletePlayer(deleteConfirmation.id);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You must be logged in to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <RoleGuard adminOnly>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
            <p className="mt-2 text-gray-600">
              Manage tournament teams, players, and division assignments
            </p>
          </div>
          <button
            onClick={handleAddTeam}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Team
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Trophy className="w-8 h-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Trophy</p>
                <p className="text-2xl font-bold text-gray-900">
                  {teams.filter(t => t.division === 'Trophy').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Medal className="w-8 h-8 text-gray-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Shield</p>
                <p className="text-2xl font-bold text-gray-900">
                  {teams.filter(t => t.division === 'Shield').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Medal className="w-8 h-8 text-amber-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Plaque</p>
                <p className="text-2xl font-bold text-gray-900">
                  {teams.filter(t => t.division === 'Plaque').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Medal className="w-8 h-8 text-orange-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Bowl</p>
                <p className="text-2xl font-bold text-gray-900">
                  {teams.filter(t => t.division === 'Bowl').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Medal className="w-8 h-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Mug</p>
                <p className="text-2xl font-bold text-gray-900">
                  {teams.filter(t => t.division === 'Mug').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search teams..."
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <select
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
            >
              <option value="all">All Divisions</option>
              <option value="Trophy">Trophy</option>
              <option value="Shield">Shield</option>
              <option value="Plaque">Plaque</option>
              <option value="Bowl">Bowl</option>
              <option value="Mug">Mug</option>
            </select>
          </div>
        </div>

        {/* Teams Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {filteredTeams.map((team) => {
            const teamPlayers = getPlayersByTeamId(team.id);
            
            return (
              <div key={team.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="p-8">
                  {/* Team Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      {getDivisionIcon(team.division)}
                      <div className="ml-3">
                        <h3 className="text-lg font-semibold text-gray-900">{team.name}</h3>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDivisionColor(team.division)}`}>
                          {team.division} Division
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Seed</div>
                      <div className="text-xl font-bold text-gray-900">#{team.seed}</div>
                    </div>
                  </div>

                  {/* Team Stats */}
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-xl font-bold text-gray-900">{teamPlayers.length}</div>
                      <div className="text-sm text-gray-600">Players</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-xl font-bold text-gray-900">{team.maxPointsAvailable}</div>
                      <div className="text-sm text-gray-600">Max Points</div>
                    </div>
                  </div>

                  {/* Players List */}
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Players ({teamPlayers.length})</h4>
                    <div className="max-h-64 overflow-y-auto">
                      {teamPlayers.map((player) => (
                        <div key={player.id} className="flex items-center justify-between py-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">{player.name}</span>
                            <div className="flex space-x-1">
                              {player.isPro && (
                                <span className="inline-flex px-1 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                                  Pro
                                </span>
                              )}
                              {player.isJunior && (
                                <span className="inline-flex px-1 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded">
                                  Jnr
                                </span>
                              )}
                              {player.isExOfficio && (
                                <span className="inline-flex px-1 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 rounded">
                                  Ex
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex space-x-2 flex-shrink-0">
                            <button
                              onClick={() => handleEditPlayer(player)}
                              className="p-1.5 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded"
                              title="Edit Player"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmation({
                                type: 'player',
                                id: player.id,
                                name: player.name
                              })}
                              className="p-1.5 text-red-600 hover:text-red-900 hover:bg-red-50 rounded"
                              title="Delete Player"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                      {teamPlayers.length === 0 && (
                        <div className="text-sm text-gray-500 py-4 text-center">
                          No players added yet
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    <button
                      onClick={() => handleEditTeam(team)}
                      className="flex-1 inline-flex items-center justify-center px-4 py-3 text-sm font-medium text-indigo-700 bg-indigo-100 rounded-md hover:bg-indigo-200 transition-colors"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Team
                    </button>
                    <button 
                      onClick={() => handleAddPlayer(team.id)}
                      className="flex-1 inline-flex items-center justify-center px-4 py-3 text-sm font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 transition-colors"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Player
                    </button>
                    <button
                      onClick={() => setDeleteConfirmation({
                        type: 'team',
                        id: team.id,
                        name: team.name
                      })}
                      className="flex-1 inline-flex items-center justify-center px-4 py-3 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Team
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredTeams.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No teams found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        )}

        {/* Summary Stats */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Tournament Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">{teams.length}</div>
              <div className="text-sm text-gray-600">Total Teams</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">{players.length}</div>
              <div className="text-sm text-gray-600">Total Players</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">5</div>
              <div className="text-sm text-gray-600">Divisions</div>
            </div>
          </div>
        </div>

        {/* Team Edit Modal */}
        <TeamEditModal
          team={editingTeam}
          isOpen={showTeamModal}
          onClose={() => {
            setShowTeamModal(false);
            setEditingTeam(null);
          }}
          onSave={handleSaveTeam}
        />

        {/* Player Edit Modal */}
        <PlayerEditModal
          player={editingPlayer}
          teamId={selectedTeamId}
          isOpen={showPlayerModal}
          onClose={() => {
            setShowPlayerModal(false);
            setEditingPlayer(null);
            setSelectedTeamId(undefined);
          }}
          onSave={handleSavePlayer}
        />

        {/* Delete Confirmation Modal */}
        {deleteConfirmation && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mt-4">
                  Delete {deleteConfirmation.type === 'team' ? 'Team' : 'Player'}
                </h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-gray-500">
                    Are you sure you want to delete{' '}
                    <span className="font-medium text-gray-900">
                      {deleteConfirmation.name}
                    </span>
                    ? This action cannot be undone.
                    {deleteConfirmation.type === 'team' && (
                      <span className="block mt-2 text-red-600">
                        Warning: This will also delete all players in this team.
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center justify-center px-4 py-3 space-x-3">
                  <button
                    onClick={() => setDeleteConfirmation(null)}
                    className="px-4 py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    disabled={isLoading}
                    className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </RoleGuard>
  );
}
