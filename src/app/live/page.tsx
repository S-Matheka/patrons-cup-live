'use client';

import { useTournament } from '@/context/TournamentContextSwitcher';
import { Match, Hole } from '@/types';
import { useState } from 'react';
import { Clock, CheckCircle, Circle, ExternalLink, Filter, Calendar, Users, Trophy, Medal } from 'lucide-react';
import Leaderboard from '@/components/Leaderboard';
import TournamentCountdown from '@/components/TournamentCountdown';
import { calculateThreeWayResult } from '@/utils/matchPlayScoring';
import Link from 'next/link';

export default function LiveScoring() {
  const { teams, scores, matches, players, loading, refreshMatchData } = useTournament();
  const [selectedDivision, setSelectedDivision] = useState<'Trophy' | 'Shield' | 'Plaque' | 'Bowl' | 'Mug' | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'in-progress' | 'scheduled' | 'completed'>('all');
  const [activeDivision, setActiveDivision] = useState<'Trophy' | 'Shield' | 'Plaque' | 'Bowl' | 'Mug'>('Trophy');



  // Filter 3-way Foursomes matches for debugging
  const threeWayFoursomesMatches = matches.filter(match => 
    match.isThreeWay && (match.type === 'Foursomes' || match.match_type === 'Foursomes')
  );

  // Show loading state while data is being fetched (only on client)
  if (typeof window !== 'undefined' && loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <div className="text-lg font-medium text-gray-900 mb-2">Loading tournament data...</div>
            <div className="text-sm text-gray-500">Please wait while we fetch the latest scores and standings.</div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if no data is loaded (only on client)
  if (typeof window !== 'undefined' && (teams.length === 0 || matches.length === 0)) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-red-600 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="text-lg font-medium text-gray-900 mb-2">Unable to load tournament data</div>
            <div className="text-sm text-gray-500 mb-4">Please check your connection and refresh the page.</div>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

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

    
    // Check match status first - scheduled matches should show "Scheduled"
    if (match.status === 'scheduled') {
      return 'Scheduled';
    }
    
    if (match.isThreeWay) {
      // 3-team match play scoring (hole-by-hole wins)
      const holesData = match.holes.map(hole => {
        // Handle both camelCase and snake_case property names for compatibility
        const teamAScore = hole.teamAScore !== undefined ? hole.teamAScore : (hole.team_a_score !== undefined ? hole.team_a_score : null);
        const teamBScore = hole.teamBScore !== undefined ? hole.teamBScore : (hole.team_b_score !== undefined ? hole.team_b_score : null);
        const teamCScore = hole.teamCScore !== undefined ? hole.teamCScore : (hole.team_c_score !== undefined ? hole.team_c_score : null);
        
        return {
          holeNumber: hole.number,
          par: hole.par || 4,
          teamAScore: teamAScore,
          teamBScore: teamBScore,
          teamCScore: teamCScore
        };
      });

      const result = calculateThreeWayResult(holesData, 18);
      
      // Get team names for display
      const teamA = teams.find(t => t.id === match.teamAId);
      const teamB = teams.find(t => t.id === match.teamBId);
      const teamC = teams.find(t => t.id === match.teamCId);
      
      // Check if there are any scores at all
      const hasAnyScores = match.holes.some(hole => {
        const teamAScore = hole.teamAScore !== undefined ? hole.teamAScore : (hole.team_a_score !== undefined ? hole.team_a_score : null);
        const teamBScore = hole.teamBScore !== undefined ? hole.teamBScore : (hole.team_b_score !== undefined ? hole.team_b_score : null);
        const teamCScore = hole.teamCScore !== undefined ? hole.teamCScore : (hole.team_c_score !== undefined ? hole.team_c_score : null);
        return teamAScore !== null || teamBScore !== null || teamCScore !== null;
      });
      
      if (!hasAnyScores) {
        return 'Not Started';
      }
      
      // Use the result from calculateThreeWayResult which now returns match play results
      if (result.leader === 'tied') {
        // All teams tied or two teams tied for lead
        return result.result;
      } else {
        // Single leader
        const leaderName = result.leader === 'teamA' ? teamA?.name : 
                          result.leader === 'teamB' ? teamB?.name : 
                          teamC?.name;
        
        if (match.status === 'completed') {
          return `${leaderName} won ${result.result}`;
        } else {
          return `${leaderName} leads ${result.result}`;
        }
      }
    } else {
      // 2-team match play scoring
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
      
      const teamA = teams.find(t => t.id === match.teamAId);
      const teamB = teams.find(t => t.id === match.teamBId);
      
      // Check if match is completed (18 holes played or match ended early)
      const isCompleted = holesPlayed === 18 || Math.abs(teamAWins - teamBWins) > (18 - holesPlayed);
      
      if (isCompleted) {
        // For completed matches, show final result with proper format
        const holesRemaining = 18 - holesPlayed;
        const holesDifference = Math.abs(teamAWins - teamBWins);
        const resultFormat = holesPlayed === 18 ? `${holesDifference}up` : `${holesDifference}/${holesRemaining}`;
        
        if (teamAWins > teamBWins) {
          return `${teamA?.name || 'Team A'} wins by ${resultFormat}`;
        } else if (teamBWins > teamAWins) {
          return `${teamB?.name || 'Team B'} wins by ${resultFormat}`;
        } else {
          return `${teamA?.name || 'Team A'} & ${teamB?.name || 'Team B'} halved`;
        }
      } else {
        // For in-progress matches, show current lead
        if (teamAWins > teamBWins) {
          return `${teamA?.name || 'Team A'} leads against ${teamB?.name || 'Team B'} by ${teamAWins - teamBWins}`;
        } else if (teamBWins > teamAWins) {
          return `${teamB?.name || 'Team B'} leads against ${teamA?.name || 'Team A'} by ${teamBWins - teamAWins}`;
        } else {
          return `${teamA?.name || 'Team A'} & ${teamB?.name || 'Team B'} are ALL SQUARE`;
        }
      }
    }
  };

  // Helper function to get actual assigned players or sample players for a match
  const getMatchPlayers = (match: Match, teamId: number | null, count: number = 2) => {
    if (!teamId) return [];
    const teamPlayers = players.filter(player => player.teamId === teamId);
    
    if (teamPlayers.length === 0) return [];
    
    // First, try to get actual assigned players from match data
    let assignedPlayerIds: string[] = [];
    
    if (match.players) {
      if (teamId === match.teamAId && match.players.teamA) {
        assignedPlayerIds = match.players.teamA;
      } else if (teamId === match.teamBId && match.players.teamB) {
        assignedPlayerIds = match.players.teamB;
      } else if (teamId === match.teamCId && match.players.teamC) {
        assignedPlayerIds = match.players.teamC;
      }
    }
    
    // Check if players were explicitly assigned (even if empty)
    let hasExplicitAssignment = false;
    if (match.players) {
      if (teamId === match.teamAId && match.players.teamA !== undefined) {
        hasExplicitAssignment = true;
      } else if (teamId === match.teamBId && match.players.teamB !== undefined) {
        hasExplicitAssignment = true;
      } else if (teamId === match.teamCId && match.players.teamC !== undefined) {
        hasExplicitAssignment = true;
      }
    }
    
    // If we have explicit assignment (even empty), use it
    if (hasExplicitAssignment) {
      if (assignedPlayerIds && assignedPlayerIds.length > 0) {
        const resolvedPlayers = assignedPlayerIds
          .map(playerId => {
            // Try to find player by ID first, then by name (for legacy data)
            return teamPlayers.find(p => 
              p.id.toString() === playerId || 
              p.name === playerId
            );
          })
          .filter(player => player !== undefined);
        
        return resolvedPlayers.slice(0, count);
      } else {
        // Explicitly assigned empty array - show no players
        return [];
      }
    }
    
    // Fallback: Generate consistent sample players based on match ID (original logic)
    // This ensures the same players are always shown for the same match when no assignments exist
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
      {/* Tournament Countdown */}
      <div className="px-4 sm:px-0">
        <TournamentCountdown />
      </div>

      {/* Header */}
      <div className="text-center px-4 sm:px-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Tournament Scoring</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-2">4th Edition Patron's Cup 2025 - Live Tournament</p>
        <div className="flex items-center justify-center space-x-2 mt-4">
          <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
          <span className="text-xs sm:text-sm font-medium text-blue-600">AUG 22-24, 2025</span>
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

            <button
              onClick={() => {
                // Force refresh all 3-way Foursomes matches
                const threeWayFoursomesMatches = matches.filter(match => 
                  match.isThreeWay && (match.type === 'Foursomes' || match.match_type === 'Foursomes')
                );
                console.log('Refreshing matches:', threeWayFoursomesMatches.map(m => m.id));
                threeWayFoursomesMatches.forEach(match => {
                  refreshMatchData(match.id);
                });
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Refresh Data
            </button>
          </div>
        </div>
      </div>

      {/* Live Tournament Leaderboard */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 bg-gradient-to-r from-green-600 to-green-700">
          <h2 className="text-xl font-bold text-white flex items-center">
            <Trophy className="w-5 h-5 mr-2" />
            Tournament Seedings
          </h2>
        </div>
        <div className="p-6">
          {/* Division Tabs */}
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-1 mb-6 bg-gray-100 p-1 rounded-lg overflow-x-auto">
            {(['Trophy', 'Shield', 'Plaque', 'Bowl', 'Mug'] as const).map((division) => (
              <button
                key={division}
                onClick={() => setActiveDivision(division)}
                className={`flex-shrink-0 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeDivision === division
                    ? 'bg-white text-green-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                <div className="flex items-center justify-center space-x-1">
                  <Medal className={`w-4 h-4 ${
                    division === 'Trophy' ? 'text-yellow-500' :
                    division === 'Shield' ? 'text-gray-400' :
                    division === 'Plaque' ? 'text-amber-600' :
                    division === 'Bowl' ? 'text-orange-500' :
                    'text-purple-500'
                  }`} />
                  <span>{division}</span>
                </div>
              </button>
            ))}
          </div>
          
          {/* Active Division Leaderboard */}
          <Leaderboard activeDivision={activeDivision} />
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMatches.map((match) => {
                const teamA = teams.find(t => t.id === match.teamAId);
                const teamB = teams.find(t => t.id === match.teamBId);
                const teamC = teams.find(t => t.id === match.teamCId);
                
                // Get sample players for each team
                const teamAPlayers = getMatchPlayers(match, match.teamAId, match.type === 'Singles' ? 1 : 2);
                const teamBPlayers = getMatchPlayers(match, match.teamBId, match.type === 'Singles' ? 1 : 2);
                const teamCPlayers = getMatchPlayers(match, match.teamCId, match.type === 'Singles' ? 1 : 2);
                
                return (
                  <div key={match.id} className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow overflow-hidden">
                    <div className="space-y-3">
                      {/* Header with badges */}
                      <div className="flex flex-wrap items-center gap-2">
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
                      
                      {/* Match details */}
                      <div className="space-y-2">
                        {match.isBye ? (
                          <div>
                            <div className="text-sm font-semibold text-gray-900 mb-1">
                              {teamA?.name || 'Team A'} - BYE Match
                            </div>
                          </div>
                        ) : match.isThreeWay ? (
                          <div>
                            <div className="text-sm font-semibold text-gray-900 mb-2">
                              {teamA?.name || 'Team A'} vs {teamB?.name || 'Team B'} vs {teamC?.name || 'Team C'}
                            </div>
                            <div className="grid grid-cols-1 gap-2 text-xs">
                              <div className="min-w-0">
                                <div className="font-medium text-gray-700 truncate">{teamA?.name}</div>
                                {teamAPlayers.map(player => (
                                  <div key={player.id} className="text-gray-600 text-xs sm:text-sm truncate">
                                    {player.name}
                                    {player.isPro && <span className="text-yellow-600 ml-1">(Pro)</span>}
                                  </div>
                                ))}
                              </div>
                              <div className="min-w-0">
                                <div className="font-medium text-gray-700 truncate">{teamB?.name}</div>
                                {teamBPlayers.map(player => (
                                  <div key={player.id} className="text-gray-600 text-xs sm:text-sm truncate">
                                    {player.name}
                                    {player.isPro && <span className="text-yellow-600 ml-1">(Pro)</span>}
                                  </div>
                                ))}
                              </div>
                              <div className="min-w-0">
                                <div className="font-medium text-gray-700 truncate">{teamC?.name}</div>
                                {teamCPlayers.map(player => (
                                  <div key={player.id} className="text-gray-600 text-xs sm:text-sm truncate">
                                    {player.name}
                                    {player.isPro && <span className="text-yellow-600 ml-1">(Pro)</span>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="text-sm font-semibold text-gray-900 mb-2">
                              {teamA?.name || 'Team A'} vs {teamB?.name || 'Team B'}
                            </div>
                            <div className="grid grid-cols-1 gap-2 text-xs">
                              <div className="min-w-0">
                                <div className="font-medium text-gray-700 truncate">{teamA?.name}</div>
                                {teamAPlayers.map(player => (
                                  <div key={player.id} className="text-gray-600 text-xs sm:text-sm truncate">
                                    {player.name}
                                    {player.isPro && <span className="text-yellow-600 ml-1">(Pro)</span>}
                                    {player.isJunior && <span className="text-blue-600 ml-1">(Jnr)</span>}
                                  </div>
                                ))}
                              </div>
                              <div className="min-w-0">
                                <div className="font-medium text-gray-700 truncate">{teamB?.name}</div>
                                {teamBPlayers.map(player => (
                                  <div key={player.id} className="text-gray-600 text-xs sm:text-sm truncate">
                                    {player.name}
                                    {player.isPro && <span className="text-yellow-600 ml-1">(Pro)</span>}
                                    {player.isJunior && <span className="text-blue-600 ml-1">(Jnr)</span>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Match info and actions */}
                      <div className="flex flex-col space-y-2 pt-2 border-t border-gray-100">
                        <div className="text-xs text-gray-600 text-center">
                          {match.date} • {match.teeTime} • Tee {match.tee}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="text-left">
                            <div className="text-xs font-medium text-gray-900">
                              {match.isBye ? 'BYE' : calculateMatchResult(match)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {match.session} Session
                            </div>
                          </div>
                          
                          <Link 
                            href={`/match/${match.id}`}
                            className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-xs"
                          >
                            <span className="font-medium">View</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
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