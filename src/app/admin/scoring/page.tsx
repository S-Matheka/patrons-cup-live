'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTournament } from '@/context/TournamentContextSwitcher';
import { Shield, ArrowLeft, Search, Filter, Edit3, Clock, Play, CheckCircle, Lock, AlertTriangle } from 'lucide-react';
import { canScoreMatch } from '@/utils/matchTiming';
import Link from 'next/link';

export default function AdminScoring() {
  const { isAuthenticated, isOfficial, isAdmin } = useAuth();
  const { teams, matches, currentTournament } = useTournament();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'scheduled' | 'in-progress' | 'completed'>('all');

  useEffect(() => {
    if (!isAuthenticated || !isOfficial) {
      router.push('/admin/login');
    }
  }, [isAuthenticated, isOfficial, router]);

  // Get available divisions based on current tournament
  const getAvailableDivisions = () => {
    if (!teams || teams.length === 0) return [];
    
    // For Nancy Millar Trophy, show KAREN and VISITOR
    if (currentTournament?.slug === 'nancy-millar-trophy-2025') {
      const uniqueDivisions = [...new Set(teams.map(t => t.division))];
      return uniqueDivisions.map(div => {
        // Map database divisions to display names
        if (div === 'Trophy') return { value: 'Trophy', label: 'KAREN' };
        if (div === 'Shield') return { value: 'Shield', label: 'VISITOR' };
        return { value: div, label: div };
      });
    }
    
    // For other tournaments, use standard divisions
    return [
      { value: 'Trophy', label: 'Trophy' },
      { value: 'Shield', label: 'Shield' },
      { value: 'Plaque', label: 'Plaque' },
      { value: 'Bowl', label: 'Bowl' },
      { value: 'Mug', label: 'Mug' }
    ];
  };

  const availableDivisions = getAvailableDivisions();

  if (!isAuthenticated || !isOfficial) {
    return <div>Loading...</div>;
  }

  const getScoreabilityInfo = (match: any) => {
    return canScoreMatch(match.status, match.date, match.teeTime, isAdmin);
  };

  const getScoreabilityIcon = (match: any) => {
    const info = getScoreabilityInfo(match);
    
    if (info.canScore) {
      if (match.status === 'in-progress') {
        return <Play className="w-4 h-4 text-green-600" />;
      } else if (match.status === 'completed') {
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      } else {
        return <Clock className="w-4 h-4 text-yellow-600" />;
      }
    } else {
      if (info.hasStarted && info.isOverdue) {
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      } else {
        return <Lock className="w-4 h-4 text-gray-400" />;
      }
    }
  };

  const getScoreabilityText = (match: any) => {
    const info = getScoreabilityInfo(match);
    
    if (info.canScore) {
      if (match.status === 'in-progress') {
        return 'Ready to Score';
      } else if (match.status === 'completed') {
        return 'Completed';
      } else {
        return 'Tee Time Reached';
      }
    } else {
      if (info.hasStarted && info.isOverdue) {
        return 'Overdue to Start';
      } else {
        return `Starts in ${info.timeUntilStart || 'Unknown'}`;
      }
    }
  };

  const filteredMatches = matches.filter(match => {
    const matchesSearch = !searchTerm || 
      match.id.toString().includes(searchTerm) ||
      match.gameNumber?.toString().includes(searchTerm) ||
      teams.find(t => t.id === match.teamAId)?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teams.find(t => t.id === match.teamBId)?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      // Search by individual player names for Nancy Millar Trophy
      ((match.tournamentId === 6 || match.tournament_id === 6) && match.players?.teamA?.[0]?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      ((match.tournamentId === 6 || match.tournament_id === 6) && match.players?.teamB?.[0]?.toLowerCase().includes(searchTerm.toLowerCase()));
    
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
      {/* Mobile-Optimized Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 space-y-2 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <Link
                href="/admin/dashboard"
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm sm:text-base">Back to Dashboard</span>
              </Link>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
                {currentTournament?.slug === 'nancy-millar-trophy-2025' 
                  ? 'Nancy Millar Trophy - Live Scoring Management' 
                  : 'Live Scoring Management'
                }
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Mobile-Optimized Filters */}
        <div className="bg-white rounded-lg shadow mb-6 p-4 sm:p-6">
          <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Matches</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Match ID, Game #, or Team..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full px-3 py-3 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Division</label>
              <select
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
                className="w-full px-3 py-3 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Divisions</option>
                {availableDivisions.map((division) => (
                  <option key={division.value} value={division.value}>
                    {division.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as any)}
                className="w-full px-3 py-3 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
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
                className="w-full px-4 py-3 sm:py-2 text-base sm:text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Mobile-Optimized Matches List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
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
                  <div key={match.id} className="p-4 sm:p-6 hover:bg-gray-50">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                      <div className="flex-1">
                        {/* Mobile-optimized badges */}
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span className="text-sm font-medium text-gray-900 bg-gray-100 px-2 py-1 rounded">
                            Game #{match.gameNumber}
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

                        {/* Scoring Status Indicator - More prominent on mobile */}
                        <div className="flex items-center space-x-2 mb-4 p-2 bg-gray-50 rounded-lg sm:bg-transparent sm:p-0 sm:mb-3">
                          {getScoreabilityIcon(match)}
                          <span className="text-sm font-medium text-gray-700">
                            {getScoreabilityText(match)}
                          </span>
                        </div>

                        {/* Mobile-optimized team layout */}
                        <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-4">
                          {/* Team A */}
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-10 h-10 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                              style={{ backgroundColor: teamA?.color }}
                            >
                              {teamA?.logo}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-gray-900">
                                {(match.tournamentId === 6 || match.tournament_id === 6) && match.players?.teamA?.[0] 
                                  ? match.players.teamA[0] 
                                  : teamA?.name}
                              </div>
                              <div className="text-sm text-gray-600 truncate">
                                {(match.tournamentId === 6 || match.tournament_id === 6) && match.players?.teamA?.[0] 
                                  ? `Player 1` 
                                  : teamA?.description}
                              </div>
                            </div>
                          </div>

                          {/* VS/3-WAY */}
                          <div className="flex items-center justify-center sm:justify-center">
                            <div className="text-center">
                              <div className="font-bold text-gray-400 text-lg sm:text-base">
                                {match.isThreeWay ? '3-WAY' : 'vs'}
                              </div>
                              <div className="text-xs text-gray-500">
                                {match.division}
                                {(match.tournamentId === 6 || match.tournament_id === 6) && match.session && (
                                  <div className="text-xs text-blue-600 font-medium">
                                    {match.session} • {match.date}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Team B */}
                          <div className="flex items-center space-x-3 sm:justify-end">
                            <div className="min-w-0 flex-1 sm:text-right">
                              <div className="font-medium text-gray-900">
                                {(match.tournamentId === 6 || match.tournament_id === 6) && match.players?.teamB?.[0] 
                                  ? match.players.teamB[0] 
                                  : teamB?.name}
                              </div>
                              <div className="text-sm text-gray-600 truncate">
                                {(match.tournamentId === 6 || match.tournament_id === 6) && match.players?.teamB?.[0] 
                                  ? `Player 2` 
                                  : teamB?.description}
                              </div>
                            </div>
                            <div 
                              className="w-10 h-10 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
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

                        {/* Match details */}
                        <div className="mt-3 text-sm text-gray-600 flex flex-wrap gap-2">
                          <span>{match.date}</span>
                          <span>•</span>
                          <span>{match.teeTime}</span>
                          <span>•</span>
                          <span>Tee {match.tee}</span>
                        </div>
                      </div>

                      {/* Mobile-optimized action button */}
                      <div className="w-full sm:w-auto sm:ml-6">
                        {(() => {
                          const info = getScoreabilityInfo(match);
                          const canScore = info.canScore;
                          
                          return (
                            <Link
                              href={`/admin/match/${match.id}`}
                              className={`w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 sm:px-4 sm:py-2 rounded-md transition-colors text-base sm:text-sm font-medium ${
                                canScore 
                                  ? 'bg-green-600 text-white hover:bg-green-700' 
                                  : 'bg-gray-300 text-gray-600 hover:bg-gray-400'
                              }`}
                              title={canScore ? "Open scoring interface" : info.reason}
                            >
                              {canScore ? (
                                <Edit3 className="w-5 h-5 sm:w-4 sm:h-4" />
                              ) : (
                                <Lock className="w-5 h-5 sm:w-4 sm:h-4" />
                              )}
                              <span>
                                {canScore ? 'Score Match' : 'View Match'}
                              </span>
                            </Link>
                          );
                        })()}
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
