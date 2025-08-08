'use client';

import { useTournament } from '@/context/TournamentContext';
import { useState } from 'react';
import { Calendar, Clock, MapPin, Users, Trophy, Medal } from 'lucide-react';

export default function Schedule() {
  const { teams, matches } = useTournament();
  const [selectedDate, setSelectedDate] = useState<string>('2024-01-19');

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
    const time = new Date(`2000-01-01T${teeTime}`);
    return time.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getDayFromDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Tournament Schedule</h1>
        <p className="text-lg text-gray-600">Match schedule and tee times</p>
      </div>

      {/* Date Navigation */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-4">
          <Calendar className="w-5 h-5 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Select Date:</span>
          <div className="flex space-x-2 overflow-x-auto">
            {matchDates.map(date => (
              <button
                key={date}
                onClick={() => setSelectedDate(date)}
                className={`px-4 py-2 rounded-md font-medium whitespace-nowrap ${
                  selectedDate === date
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {getDayFromDate(date)} - {formatDate(date)}
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
                .sort((a, b) => a.teeTime.localeCompare(b.teeTime))
                .map(match => {
                  const teamA = getTeamById(match.teamAId);
                  const teamB = getTeamById(match.teamBId);
                  const DivisionIcon = getDivisionIcon(match.division);

                  if (!teamA || !teamB) return null;

                  return (
                    <div key={match.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span className="font-medium text-gray-900">
                              {getTimeSlot(match.teeTime)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-600">{match.course}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <DivisionIcon className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">{match.division}</span>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMatchTypeColor(match.type)}`}>
                            {match.type}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            match.session === 'AM' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {match.session}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMatchStatusColor(match.status)}`}>
                            {match.status}
                          </span>
                          <span className="text-sm text-gray-600">Match #{match.id}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Team A */}
                        <div className="flex items-center space-x-4">
                          <div 
                            className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold"
                            style={{ backgroundColor: teamA.color }}
                          >
                            {teamA.logo}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{teamA.name}</div>
                            <div className="text-sm text-gray-600">{teamA.description}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              Players: {match.players?.teamA?.join(', ') || 'TBD'}
                            </div>
                          </div>
                        </div>

                        {/* VS */}
                        <div className="flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-gray-400">vs</div>
                            <div className="text-sm text-gray-500 mt-1">{match.course}</div>
                            <div className="text-xs text-gray-500 mt-1">{match.type}</div>
                          </div>
                        </div>

                        {/* Team B */}
                        <div className="flex items-center space-x-4 justify-end">
                          <div className="text-right">
                            <div className="font-medium text-gray-900">{teamB.name}</div>
                            <div className="text-sm text-gray-600">{teamB.description}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              Players: {match.players?.teamB?.join(', ') || 'TBD'}
                            </div>
                          </div>
                          <div 
                            className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold"
                            style={{ backgroundColor: teamB.color }}
                          >
                            {teamB.logo}
                          </div>
                        </div>
                      </div>

                      {/* Match Progress */}
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Match Progress:</span>
                          <div className="flex items-center space-x-2">
                            {match.holes.map(hole => (
                              <div
                                key={hole.number}
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
            <h3 className="text-lg font-semibold text-gray-900">Plate Division</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Matches:</span>
              <span className="font-medium">
                {matches.filter(m => m.division === 'Plate').length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Completed:</span>
              <span className="font-medium">
                {matches.filter(m => m.division === 'Plate' && m.status === 'completed').length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">In Progress:</span>
              <span className="font-medium">
                {matches.filter(m => m.division === 'Plate' && m.status === 'in-progress').length}
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