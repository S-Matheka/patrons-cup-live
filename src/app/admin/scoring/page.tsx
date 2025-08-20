'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTournament } from '@/context/TournamentContext';
import { Shield, ArrowLeft, Search, Filter, Edit3 } from 'lucide-react';
import Link from 'next/link';

export default function AdminScoring() {
  const { isAuthenticated, isOfficial } = useAuth();
  const { teams, matches } = useTournament();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDivision, setSelectedDivision] = useState<'all' | 'Trophy' | 'Shield' | 'Plaque' | 'Bowl' | 'Mug'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'scheduled' | 'in-progress' | 'completed'>('all');

  useEffect(() => {
    if (!isAuthenticated || !isOfficial) {
      router.push('/admin/login');
    }
  }, [isAuthenticated, isOfficial, router]);

  if (!isAuthenticated || !isOfficial) {
    return <div>Loading...</div>;
  }

  const filteredMatches = matches.filter(match => {
    const matchesSearch = !searchTerm || 
      match.id.toString().includes(searchTerm) ||
      match.gameNumber?.toString().includes(searchTerm) ||
      teams.find(t => t.id === match.teamAId)?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teams.find(t => t.id === match.teamBId)?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDivision = selectedDivision === 'all' || match.division === selectedDivision;
    const matchesStatus = selectedStatus === 'all' || match.status === selectedStatus;
    
    return matchesSearch && matchesDivision && matchesStatus;
  });

  const getMatchStatusColor = (status: string) => {
    switch (status) {
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMatchTypeColor = (type: string) => {
    switch (type) {
      case '4BBB':
        return 'bg-blue-100 text-blue-800';
      case 'Foursomes':
        return 'bg-purple-100 text-purple-800';
      case 'Singles':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link
                href="/admin/dashboard"
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </Link>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="w-6 h-6 text-green-600" />
              <h1 className="text-xl font-semibold text-gray-900">Live Scoring Management</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Matches</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Match ID, Game #, or Team..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Division</label>
              <select
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Divisions</option>
                <option value="Trophy">Trophy</option>
                <option value="Shield">Shield</option>
                <option value="Plaque">Plaque</option>
                <option value="Bowl">Bowl</option>
                <option value="Mug">Mug</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedDivision('all');
                  setSelectedStatus('all');
                }}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Matches List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Tournament Matches ({filteredMatches.length})
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {filteredMatches.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Filter className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No matches found matching your criteria.</p>
              </div>
            ) : (
              filteredMatches.map((match) => {
                const teamA = teams.find(t => t.id === match.teamAId);
                const teamB = teams.find(t => t.id === match.teamBId);
                const teamC = teams.find(t => t.id === match.teamCId);

                return (
                  <div key={match.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-3">
                          <span className="text-sm font-medium text-gray-900">
                            Game #{match.gameNumber} • Match ID: {match.id}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMatchTypeColor(match.type)}`}>
                            {match.type}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMatchStatusColor(match.status)}`}>
                            {match.status}
                          </span>
                          {match.isBye && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                              BYE
                            </span>
                          )}
                          {match.isPro && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              PRO
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Team A */}
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                              style={{ backgroundColor: teamA?.color }}
                            >
                              {teamA?.logo}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{teamA?.name}</div>
                              <div className="text-sm text-gray-600">{teamA?.description}</div>
                            </div>
                          </div>

                          {/* VS/3-WAY */}
                          <div className="flex items-center justify-center">
                            <div className="text-center">
                              <div className="font-bold text-gray-400">
                                {match.isThreeWay ? '3-WAY' : 'vs'}
                              </div>
                              <div className="text-xs text-gray-500">{match.division}</div>
                            </div>
                          </div>

                          {/* Team B */}
                          <div className="flex items-center space-x-3 justify-end">
                            <div className="text-right">
                              <div className="font-medium text-gray-900">{teamB?.name}</div>
                              <div className="text-sm text-gray-600">{teamB?.description}</div>
                            </div>
                            <div 
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                              style={{ backgroundColor: teamB?.color }}
                            >
                              {teamB?.logo}
                            </div>
                          </div>
                        </div>

                        {/* Team C for 3-way matches */}
                        {match.isThreeWay && teamC && (
                          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-center space-x-3">
                            <div 
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                              style={{ backgroundColor: teamC.color }}
                            >
                              {teamC.logo}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{teamC.name}</div>
                              <div className="text-sm text-gray-600">{teamC.description}</div>
                            </div>
                          </div>
                        )}

                        <div className="mt-3 text-sm text-gray-600">
                          {match.date} • {match.teeTime} • Tee {match.tee}
                        </div>
                      </div>

                      <div className="ml-6">
                        <Link
                          href={`/admin/match/${match.id}`}
                          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                          <span>Edit Score</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
