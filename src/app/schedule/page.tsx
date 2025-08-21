'use client';

import { useTournament } from '@/context/TournamentContext';
import { useState } from 'react';
import { Calendar, Clock, MapPin, Trophy, Medal } from 'lucide-react';

export default function Schedule() {
  const { teams, matches, players } = useTournament();
  const [selectedDate, setSelectedDate] = useState<string>('2025-08-22');

  // Get unique dates from matches
  const matchDates = [...new Set(matches.map(match => match.date))].sort();

  const getMatchesByDate = (date: string) => {
    return matches.filter(match => match.date === date);
  };

  const getTeamById = (teamId: number) => {
    return teams.find(team => team.id === teamId);
  };

  const getDivisionIcon = (division: string) => {
    return division === 'Trophy' ? Trophy : Medal;
  };

  const getMatchStatusColor = (status: string) => {
    switch (status) {
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTimeSlot = (teeTime: string) => {
    // teeTime is already in format like "7:30 AM"
    return teeTime;
  };

  const getDayFromDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long' });
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
      <div className="text-center px-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Tournament Schedule</h1>
        <p className="text-sm sm:text-lg text-gray-600">Match schedule and tee times</p>
      </div>

      {/* Date Navigation */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Select Date:</span>
          </div>
          <div className="flex space-x-2 overflow-x-auto pb-2 sm:pb-0">
            {matchDates.map(date => (
              <button
                key={date}
                onClick={() => setSelectedDate(date)}
                className={`px-3 sm:px-4 py-2 rounded-md font-medium whitespace-nowrap text-xs sm:text-sm ${
                  selectedDate === date
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="sm:hidden">{getDayFromDate(date)}</span>
                <span className="hidden sm:inline">{getDayFromDate(date)} - {formatDate(date)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Schedule for Selected Date */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700">
          <h2 className="text-xl font-bold text-white">
            Schedule for {formatDate(selectedDate)}
          </h2>
        </div>
        <div className="p-6">
          {getMatchesByDate(selectedDate).length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No matches scheduled for this date</p>
            </div>
          ) : (
            <div className="space-y-6">
              {getMatchesByDate(selectedDate)
                .sort((a, b) => {
                  // Convert time strings to comparable format
                  const convertTimeToMinutes = (timeStr: string) => {
                    const [time, period] = timeStr.split(' ');
                    const [hours, minutes] = time.split(':').map(Number);
                    let totalMinutes = hours * 60 + minutes;
                    
                    // Convert to 24-hour format
                    if (period === 'PM' && hours !== 12) {
                      totalMinutes += 12 * 60;
                    } else if (period === 'AM' && hours === 12) {
                      totalMinutes -= 12 * 60;
                    }
                    
                    return totalMinutes;
                  };
                  
                  return convertTimeToMinutes(a.teeTime) - convertTimeToMinutes(b.teeTime);
                })
                .map(match => {
                  const teamA = getTeamById(match.teamAId);
                  const teamB = getTeamById(match.teamBId);
                  const teamC = match.teamCId ? getTeamById(match.teamCId) : null;
                  const DivisionIcon = getDivisionIcon(match.division);

                  // Get sample players for each team
                  const teamAPlayers = getMatchPlayers(match, match.teamAId, match.type === 'Singles' ? 1 : 2);
                  const teamBPlayers = getMatchPlayers(match, match.teamBId, match.type === 'Singles' ? 1 : 2);
                  const teamCPlayers = getMatchPlayers(match, match.teamCId, match.type === 'Singles' ? 1 : 2);

                  if (!teamA || !teamB) return null;

                  return (
                    <div key={match.id} className="border rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow overflow-hidden">
                      <div className="mb-4 space-y-3">
                        {/* First row - Time and basic info */}
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="flex items-center space-x-1 sm:space-x-2">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span className="font-medium text-gray-900 text-sm sm:text-base">
                              {getTimeSlot(match.teeTime)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1 sm:space-x-2">
                            <MapPin className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-600 text-sm">{match.tee} Tee</span>
                          </div>
                          <span className="text-xs sm:text-sm text-gray-600">Game #{match.gameNumber}</span>
                        </div>
                        
                        {/* Second row - Division, type, and status */}
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="flex items-center space-x-1 sm:space-x-2">
                            <DivisionIcon className="w-4 h-4 text-gray-500" />
                            <span className="text-xs sm:text-sm text-gray-600">{match.division}</span>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMatchTypeColor(match.type)}`}>
                            {match.type}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            match.session === 'AM' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {match.session}
                          </span>
                          {match.isPro && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              PRO
                            </span>
                          )}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMatchStatusColor(match.status)}`}>
                            {match.status}
                          </span>
                        </div>
                      </div>

                      <div className={`grid grid-cols-1 gap-4 sm:gap-6 ${match.isThreeWay ? 'md:grid-cols-1 lg:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-3'}`}>
                        {/* Team A */}
                        <div className="flex items-center space-x-3 sm:space-x-4">
                          <div 
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white text-base sm:text-lg font-bold flex-shrink-0"
                            style={{ backgroundColor: teamA.color }}
                          >
                            {teamA.logo}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-gray-900 text-sm sm:text-base">{teamA.name}</div>
                            <div className="text-xs sm:text-sm text-gray-600 truncate">{teamA.description}</div>
                            <div className="text-xs text-gray-500 mt-1 break-words">
                              Players: {teamAPlayers.length > 0 
                                ? teamAPlayers.map(p => `${p.name}${p.isPro ? ' (Pro)' : ''}${p.isJunior ? ' (Jnr)' : ''}`).join(', ')
                                : 'TBD'
                              }
                            </div>
                          </div>
                        </div>

                        {/* VS or Center */}
                        <div className="flex items-center justify-center lg:order-none order-last">
                          <div className="text-center">
                            <div className="text-xl sm:text-2xl font-bold text-gray-400">{match.isThreeWay ? '3-WAY' : 'vs'}</div>
                            <div className="text-xs text-gray-500 mt-1">{match.type}</div>
                          </div>
                        </div>

                        {/* Team B */}
                        <div className="flex items-center space-x-3 sm:space-x-4 lg:justify-end">
                          <div className="min-w-0 flex-1 lg:text-right">
                            <div className="font-medium text-gray-900 text-sm sm:text-base">{teamB.name}</div>
                            <div className="text-xs sm:text-sm text-gray-600 truncate">{teamB.description}</div>
                            <div className="text-xs text-gray-500 mt-1 break-words">
                              Players: {teamBPlayers.length > 0 
                                ? teamBPlayers.map(p => `${p.name}${p.isPro ? ' (Pro)' : ''}${p.isJunior ? ' (Jnr)' : ''}`).join(', ')
                                : 'TBD'
                              }
                            </div>
                          </div>
                          <div 
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white text-base sm:text-lg font-bold flex-shrink-0 lg:order-last"
                            style={{ backgroundColor: teamB.color }}
                          >
                            {teamB.logo}
                          </div>
                        </div>

                        {/* Team C for 3-way matches */}
                        {match.isThreeWay && teamC && (
                          <div className="md:col-span-3 flex items-center justify-center space-x-4 pt-4 border-t">
                            <div 
                              className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold"
                              style={{ backgroundColor: teamC.color }}
                            >
                              {teamC.logo}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{teamC.name}</div>
                              <div className="text-sm text-gray-600">{teamC.description}</div>
                              <div className="text-xs text-gray-500 mt-1">
                                Players: {teamCPlayers.length > 0 
                                  ? teamCPlayers.map(p => `${p.name}${p.isPro ? ' (Pro)' : ''}${p.isJunior ? ' (Jnr)' : ''}`).join(', ')
                                  : 'TBD'
                                }
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Match Progress */}
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex flex-col space-y-2 text-sm">
                          <span className="text-gray-600">Match Progress:</span>
                          <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                            {match.holes.map(hole => (
                              <div
                                key={hole.number}
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                                  hole.status === 'completed'
                                    ? 'bg-green-500 text-white'
                                    : hole.status === 'in-progress'
                                    ? 'bg-yellow-500 text-white'
                                    : 'bg-gray-200 text-gray-600'
                                }`}
                                title={`Hole ${hole.number}: ${hole.status}`}
                              >
                                {hole.number}
                              </div>
                            ))}
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

      {/* Tournament Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Trophy className="w-6 h-6 text-yellow-600" />
            <h3 className="text-lg font-semibold text-gray-900">Trophy Division</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Matches:</span>
              <span className="font-medium">
                {matches.filter(m => m.division === 'Trophy').length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Completed:</span>
              <span className="font-medium">
                {matches.filter(m => m.division === 'Trophy' && m.status === 'completed').length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">In Progress:</span>
              <span className="font-medium">
                {matches.filter(m => m.division === 'Trophy' && m.status === 'in-progress').length}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Medal className="w-6 h-6 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Shield Division</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Matches:</span>
              <span className="font-medium">
                {matches.filter(m => m.division === 'Shield').length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Completed:</span>
              <span className="font-medium">
                {matches.filter(m => m.division === 'Shield' && m.status === 'completed').length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">In Progress:</span>
              <span className="font-medium">
                {matches.filter(m => m.division === 'Shield' && m.status === 'in-progress').length}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Medal className="w-6 h-6 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Plaque Division</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Matches:</span>
              <span className="font-medium">
                {matches.filter(m => m.division === 'Plaque').length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Completed:</span>
              <span className="font-medium">
                {matches.filter(m => m.division === 'Plaque' && m.status === 'completed').length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">In Progress:</span>
              <span className="font-medium">
                {matches.filter(m => m.division === 'Plaque' && m.status === 'in-progress').length}
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
              <span className="text-gray-600">Matches:</span>
              <span className="font-medium">
                {matches.filter(m => m.division === 'Bowl').length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Completed:</span>
              <span className="font-medium">
                {matches.filter(m => m.division === 'Bowl' && m.status === 'completed').length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">In Progress:</span>
              <span className="font-medium">
                {matches.filter(m => m.division === 'Bowl' && m.status === 'in-progress').length}
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
              <span className="text-gray-600">Matches:</span>
              <span className="font-medium">
                {matches.filter(m => m.division === 'Mug').length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Completed:</span>
              <span className="font-medium">
                {matches.filter(m => m.division === 'Mug' && m.status === 'completed').length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">In Progress:</span>
              <span className="font-medium">
                {matches.filter(m => m.division === 'Mug' && m.status === 'in-progress').length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 