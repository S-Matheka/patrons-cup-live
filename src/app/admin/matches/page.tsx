'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTournament } from '@/context/TournamentContext';
import { supabase } from '@/lib/supabase';
import { Match, Team } from '@/types';
import MatchEditModal from '@/components/admin/MatchEditModal';
import RoleGuard from '@/components/admin/RoleGuard';
import { 
  Calendar, 
  Clock, 
  Users, 
  MapPin, 
  Edit, 
  Trash2, 
  Plus,
  Play,
  Pause,
  CheckCircle,
  Filter,
  Search
} from 'lucide-react';

export default function AdminMatchesPage() {
  const { user } = useAuth();
  const { matches, teams, getTeamById } = useTournament();
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([]);
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);

  useEffect(() => {
    if (!user) return;
    filterMatches();
  }, [matches, selectedDivision, selectedStatus, searchTerm]);

  const filterMatches = () => {
    let filtered = matches;

    if (selectedDivision !== 'all') {
      filtered = filtered.filter(match => match.division === selectedDivision);
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(match => match.status === selectedStatus);
    }

    if (searchTerm) {
      filtered = filtered.filter(match => {
        const teamA = getTeamById(match.teamAId || 0);
        const teamB = getTeamById(match.teamBId || 0);
        const searchLower = searchTerm.toLowerCase();
        
        return (
          match.gameNumber.toString().includes(searchLower) ||
          teamA?.name.toLowerCase().includes(searchLower) ||
          teamB?.name.toLowerCase().includes(searchLower) ||
          match.type.toLowerCase().includes(searchLower)
        );
      });
    }

    setFilteredMatches(filtered.sort((a, b) => a.gameNumber - b.gameNumber));
  };

  const updateMatchStatus = async (matchId: number, newStatus: 'scheduled' | 'in-progress' | 'completed') => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('matches')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', matchId);

      if (error) throw error;

      // The real-time subscription will update the UI automatically
      console.log(`Match ${matchId} status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating match status:', error);
      alert('Failed to update match status');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'in-progress':
        return <Play className="w-4 h-4 text-green-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-gray-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'in-progress':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const handleEditMatch = (match: Match) => {
    setEditingMatch(match);
    setShowMatchModal(true);
  };

  const handleAddMatch = () => {
    setEditingMatch(null);
    setShowMatchModal(true);
  };

  const handleSaveMatch = (match: Match) => {
    // The real-time subscription will handle updating the UI
    console.log('Match saved:', match);
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
            <h1 className="text-3xl font-bold text-gray-900">Match Management</h1>
            <p className="mt-2 text-gray-600">
              Manage tournament matches, update statuses, and monitor game progress
            </p>
          </div>
          <button
            onClick={handleAddMatch}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Match
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Scheduled</p>
                <p className="text-2xl font-bold text-gray-900">
                  {matches.filter(m => m.status === 'scheduled').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Play className="w-8 h-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">
                  {matches.filter(m => m.status === 'in-progress').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-gray-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {matches.filter(m => m.status === 'completed').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Matches</p>
                <p className="text-2xl font-bold text-gray-900">{matches.length}</p>
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
                  placeholder="Search matches, teams, or game numbers..."
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
            
            <select
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Matches Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Tournament Matches ({filteredMatches.length})
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Game #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Teams
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Division
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMatches.map((match) => {
                  const teamA = getTeamById(match.teamAId || 0);
                  const teamB = getTeamById(match.teamBId || 0);
                  
                  return (
                    <tr key={match.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{match.gameNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center space-x-2">
                          <span>{teamA?.name || 'TBD'}</span>
                          <span className="text-gray-400">vs</span>
                          <span>{teamB?.name || 'TBD'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          match.division === 'Trophy' ? 'bg-yellow-100 text-yellow-800' :
                          match.division === 'Shield' ? 'bg-gray-100 text-gray-800' :
                          match.division === 'Plaque' ? 'bg-amber-100 text-amber-800' :
                          match.division === 'Bowl' ? 'bg-orange-100 text-orange-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {match.division}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex flex-col">
                          <span>{match.date}</span>
                          <span className="text-gray-500">{match.teeTime}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {match.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(match.status)}`}>
                          {getStatusIcon(match.status)}
                          <span className="ml-1 capitalize">{match.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center space-x-2">
                          {match.status === 'scheduled' && (
                            <button
                              onClick={() => updateMatchStatus(match.id, 'in-progress')}
                              disabled={isLoading}
                              className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded hover:bg-green-200 disabled:opacity-50"
                            >
                              <Play className="w-3 h-3 mr-1" />
                              Start
                            </button>
                          )}
                          
                          {match.status === 'in-progress' && (
                            <>
                              <button
                                onClick={() => updateMatchStatus(match.id, 'scheduled')}
                                disabled={isLoading}
                                className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200 disabled:opacity-50"
                              >
                                <Pause className="w-3 h-3 mr-1" />
                                Pause
                              </button>
                              <button
                                onClick={() => updateMatchStatus(match.id, 'completed')}
                                disabled={isLoading}
                                className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Complete
                              </button>
                            </>
                          )}
                          
                          {match.status === 'completed' && (
                            <button
                              onClick={() => updateMatchStatus(match.id, 'in-progress')}
                              disabled={isLoading}
                              className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded hover:bg-green-200 disabled:opacity-50"
                            >
                              <Play className="w-3 h-3 mr-1" />
                              Reopen
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleEditMatch(match)}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium text-indigo-700 bg-indigo-100 rounded hover:bg-indigo-200 mr-1"
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </button>
                          <a
                            href={`/admin/match/${match.id}`}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium text-purple-700 bg-purple-100 rounded hover:bg-purple-200"
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Score
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {filteredMatches.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No matches found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        )}

        {/* Match Edit Modal */}
        <MatchEditModal
          match={editingMatch}
          isOpen={showMatchModal}
          onClose={() => {
            setShowMatchModal(false);
            setEditingMatch(null);
          }}
          onSave={handleSaveMatch}
        />
        </div>
      </div>
    </RoleGuard>
  );
}
