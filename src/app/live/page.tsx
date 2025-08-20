'use client';

import { useTournament } from '@/context/TournamentContext';
import { Match, Hole } from '@/types';
import { useState } from 'react';
import { Clock, CheckCircle, Circle, ExternalLink, Filter, Calendar, Users, Trophy } from 'lucide-react';
import Leaderboard from '@/components/Leaderboard';
import Link from 'next/link';

export default function LiveScoring() {
  const { teams, scores, matches, players } = useTournament();
  const [selectedDivision, setSelectedDivision] = useState<'Trophy' | 'Shield' | 'Plaque' | 'Bowl' | 'Mug' | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'in-progress' | 'scheduled' | 'completed'>('all');



  const filteredMatches = matches.filter(match => {
    const divisionMatch = selectedDivision === 'all' || match.division === selectedDivision;
    const statusMatch = selectedStatus === 'all' || match.status === selectedStatus;
    return divisionMatch && statusMatch;
  });

  // const activeMatches = []; // No matches are currently in progress
  // const scheduledMatches = matches.filter(match => match.status === 'scheduled');
  // const completedMatches = []; // No matches have been completed yet

  const getMatchStatusIcon = (status: string) => {
    switch (status) {
      case 'in-progress':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'scheduled':
        return <Circle className="w-4 h-4 text-gray-400" />;
      default:
        return <Circle className="w-4 h-4 text-gray-400" />;
    }
  };

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
        return 'bg-purple-100 text-purple-800';
      case 'Foursomes':
        return 'bg-orange-100 text-orange-800';
      case 'Singles':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateMatchResult = (match: Match) => {
    let teamAWins = 0;
    let teamBWins = 0;
    let holesPlayed = 0;

    match.holes.forEach((hole: Hole) => {
      if (hole.teamAScore !== null && hole.teamBScore !== null) {
        holesPlayed++;
        if (hole.teamAScore < hole.teamBScore) {
          teamAWins++;
        } else if (hole.teamBScore < hole.teamAScore) {
          teamBWins++;
        }
      }
    });

    if (holesPlayed === 0) return 'Not Started';
    if (holesPlayed === 9 || holesPlayed === 18) {
      if (teamAWins > teamBWins) return `${teamAWins - teamBWins} UP`;
      if (teamBWins > teamAWins) return `${teamBWins - teamAWins} UP`;
      return 'HALVED';
    }
    return `${teamAWins > teamBWins ? teamAWins - teamBWins : teamBWins - teamAWins} UP`;
  };

  // Helper function to get sample players for a match
  const getMatchPlayers = (match: Match, teamId: number | null, count: number = 2) => {
    if (!teamId) return [];
    const teamPlayers = players.filter(player => player.teamId === teamId);
    
    if (teamPlayers.length === 0) return [];
    
    // For pre-tournament display, show a consistent sample of players based on match ID
    // This ensures the same players are always shown for the same match
    const startIndex = (match.id * teamId) % teamPlayers.length;
    const selectedPlayers = [];
    
    for (let i = 0; i < count && i < teamPlayers.length; i++) {
      const playerIndex = (startIndex + i) % teamPlayers.length;
      selectedPlayers.push(teamPlayers[playerIndex]);
    }
    
    return selectedPlayers;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 px-4 sm:px-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Tournament Scoring</h1>
          <p className="text-sm sm:text-base text-gray-600">4th Edition Patron's Cup 2025 - Pre-Tournament</p>
        </div>
        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
          <span className="text-xs sm:text-sm font-medium text-blue-600">STARTS AUG 22</span>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Teams Ready</p>
              <p className="text-2xl font-bold text-gray-900">15</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Trophy className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Divisions</p>
              <p className="text-2xl font-bold text-gray-900">5</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Days to Play</p>
              <p className="text-2xl font-bold text-gray-900">3</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">First Tee</p>
              <p className="text-2xl font-bold text-gray-900">7:30 AM</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
            <select
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value as 'Trophy' | 'Shield' | 'Plaque' | 'Bowl' | 'Mug' | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 w-full sm:w-auto"
            >
              <option value="all">All Divisions</option>
              <option value="Trophy">Trophy Division</option>
              <option value="Shield">Shield Division</option>
              <option value="Plaque">Plaque Division</option>
              <option value="Bowl">Bowl Division</option>
              <option value="Mug">Mug Division</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as 'all' | 'in-progress' | 'scheduled' | 'completed')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 w-full sm:w-auto"
            >
              <option value="all">All Status</option>
              <option value="in-progress">In Progress</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Pre-Tournament Leaderboard */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 bg-gradient-to-r from-green-600 to-green-700">
          <h2 className="text-xl font-bold text-white">Tournament Seedings</h2>
        </div>
        <div className="p-6">
          <Leaderboard teams={teams} scores={scores} />
        </div>
      </div>

      {/* Matches List */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-700">
          <h2 className="text-xl font-bold text-white">
            Tournament Matches 
            <span className="text-purple-200 ml-2">({filteredMatches.length} matches)</span>
          </h2>
        </div>
        <div className="p-6">
          {filteredMatches.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Circle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No matches found for the selected filters.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMatches.slice(0, 20).map((match) => {
                const teamA = teams.find(t => t.id === match.teamAId);
                const teamB = teams.find(t => t.id === match.teamBId);
                const teamC = teams.find(t => t.id === match.teamCId);
                
                // Get sample players for each team
                const teamAPlayers = getMatchPlayers(match, match.teamAId, match.type === 'Singles' ? 1 : 2);
                const teamBPlayers = getMatchPlayers(match, match.teamBId, match.type === 'Singles' ? 1 : 2);
                const teamCPlayers = getMatchPlayers(match, match.teamCId, match.type === 'Singles' ? 1 : 2);
                
                return (
                  <div key={match.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span className="text-sm font-medium text-gray-600">Game {match.gameNumber}</span>
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
                        
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            {match.isBye ? (
                              <div>
                                <div className="text-lg font-semibold text-gray-900 mb-1">
                                  {teamA?.name || 'Team A'} - BYE Match
                                </div>
                              </div>
                            ) : match.isThreeWay ? (
                              <div>
                                <div className="text-lg font-semibold text-gray-900 mb-2">
                                  {teamA?.name || 'Team A'} vs {teamB?.name || 'Team B'} vs {teamC?.name || 'Team C'}
                                </div>
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <div className="font-medium text-gray-700">{teamA?.name}</div>
                                    {teamAPlayers.map(player => (
                                      <div key={player.id} className="text-gray-600">
                                        {player.name}
                                        {player.isPro && <span className="text-yellow-600 ml-1">(Pro)</span>}
                                      </div>
                                    ))}
                                  </div>
                                  <div>
                                    <div className="font-medium text-gray-700">{teamB?.name}</div>
                                    {teamBPlayers.map(player => (
                                      <div key={player.id} className="text-gray-600">
                                        {player.name}
                                        {player.isPro && <span className="text-yellow-600 ml-1">(Pro)</span>}
                                      </div>
                                    ))}
                                  </div>
                                  <div>
                                    <div className="font-medium text-gray-700">{teamC?.name}</div>
                                    {teamCPlayers.map(player => (
                                      <div key={player.id} className="text-gray-600">
                                        {player.name}
                                        {player.isPro && <span className="text-yellow-600 ml-1">(Pro)</span>}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="text-lg font-semibold text-gray-900 mb-2">
                                  {teamA?.name || 'Team A'} vs {teamB?.name || 'Team B'}
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <div className="font-medium text-gray-700">{teamA?.name}</div>
                                    {teamAPlayers.map(player => (
                                      <div key={player.id} className="text-gray-600">
                                        {player.name}
                                        {player.isPro && <span className="text-yellow-600 ml-1">(Pro)</span>}
                                        {player.isJunior && <span className="text-blue-600 ml-1">(Jnr)</span>}
                                      </div>
                                    ))}
                                  </div>
                                  <div>
                                    <div className="font-medium text-gray-700">{teamB?.name}</div>
                                    {teamBPlayers.map(player => (
                                      <div key={player.id} className="text-gray-600">
                                        {player.name}
                                        {player.isPro && <span className="text-yellow-600 ml-1">(Pro)</span>}
                                        {player.isJunior && <span className="text-blue-600 ml-1">(Jnr)</span>}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            <div className="text-sm text-gray-600 mt-3">
                              {match.date} • {match.teeTime} • Tee {match.tee} • {match.division} Division
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <div className="text-sm font-medium text-gray-900">
                                {match.isBye ? 'BYE' : calculateMatchResult(match)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {match.session} Session
                              </div>
                            </div>
                            
                            <Link 
                              href={`/match/${match.id}`}
                              className="flex items-center space-x-1 text-blue-600 hover:text-blue-800"
                            >
                              <ExternalLink className="w-4 h-4" />
                              <span className="text-sm">View</span>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {filteredMatches.length > 20 && (
                <div className="text-center pt-4">
                  <p className="text-sm text-gray-500">
                    Showing first 20 of {filteredMatches.length} matches. Use filters to narrow down results.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tournament Information */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700">
          <h2 className="text-xl font-bold text-white">Tournament Schedule</h2>
        </div>
        <div className="p-6">
          <div className="text-center py-8">
            <Calendar className="w-16 h-16 text-blue-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-4">Tournament Starts Soon!</h3>
            
            <div className="grid gap-4 md:grid-cols-3">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="font-medium text-blue-900 mb-2">Friday, Aug 22</div>
                <div className="text-sm text-blue-800">
                  <div>7:30 AM - 4BBB</div>
                  <div>1:30 PM - Foursomes</div>
                </div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4">
                <div className="font-medium text-green-900 mb-2">Saturday, Aug 23</div>
                <div className="text-sm text-green-800">
                  <div>7:30 AM - 4BBB</div>
                  <div>1:30 PM - Foursomes</div>
                </div>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="font-medium text-purple-900 mb-2">Sunday, Aug 24</div>
                <div className="text-sm text-purple-800">
                  <div>6:38 AM - Singles</div>
                  <div>11:30 AM - Trophy/Shield</div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 bg-yellow-50 rounded-lg p-4">
              <div className="text-sm text-yellow-800">
                <div className="font-medium mb-1">🏌️ All matches will be played at Muthaiga Golf Club</div>
                <div>Live scoring will begin when the first match starts on Friday morning</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 