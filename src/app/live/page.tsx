'use client';

import { useTournament } from '@/context/TournamentContext';
import { Match, Hole } from '@/types';
import { useState } from 'react';
import { Zap, Clock, CheckCircle, Circle, ExternalLink, Filter } from 'lucide-react';
import Leaderboard from '@/components/Leaderboard';
import Link from 'next/link';

export default function LiveScoring() {
  const { teams, scores, matches } = useTournament();
  const [selectedDivision, setSelectedDivision] = useState<'Trophy' | 'Plate' | 'Bowl' | 'Mug' | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'in-progress' | 'scheduled' | 'completed'>('all');

  const filteredMatches = matches.filter(match => {
    const divisionMatch = selectedDivision === 'all' || match.division === selectedDivision;
    const statusMatch = selectedStatus === 'all' || match.status === selectedStatus;
    return divisionMatch && statusMatch;
  });

  const activeMatches = matches.filter(match => match.status === 'in-progress');
  const scheduledMatches = matches.filter(match => match.status === 'scheduled');
  const completedMatches = matches.filter(match => match.status === 'completed');

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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Live Scoring</h1>
          <p className="text-gray-600">Real-time tournament updates and match tracking</p>
        </div>
        <div className="flex items-center space-x-2">
          <Zap className="w-6 h-6 text-green-600 animate-pulse" />
          <span className="text-sm font-medium text-green-600">LIVE</span>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Matches</p>
              <p className="text-2xl font-bold text-gray-900">{activeMatches.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Circle className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Scheduled</p>
              <p className="text-2xl font-bold text-gray-900">{scheduledMatches.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{completedMatches.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Zap className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Matches</p>
              <p className="text-2xl font-bold text-gray-900">{matches.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          <select
            value={selectedDivision}
            onChange={(e) => setSelectedDivision(e.target.value as 'Trophy' | 'Plate' | 'Bowl' | 'Mug' | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="all">All Divisions</option>
            <option value="Trophy">Trophy Division</option>
            <option value="Plate">Plate Division</option>
            <option value="Bowl">Bowl Division</option>
            <option value="Mug">Mug Division</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as 'all' | 'in-progress' | 'scheduled' | 'completed')}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="all">All Status</option>
            <option value="in-progress">In Progress</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Live Leaderboard */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 bg-gradient-to-r from-green-600 to-green-700">
          <h2 className="text-xl font-bold text-white">Live Leaderboard</h2>
        </div>
        <div className="p-6">
          <Leaderboard teams={teams} scores={scores} />
        </div>
      </div>

      {/* Matches List */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700">
          <h2 className="text-xl font-bold text-white">Match Updates</h2>
        </div>
        <div className="p-6">
          {filteredMatches.length === 0 ? (
            <div className="text-center py-8">
              <Circle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No matches found with the selected filters</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMatches.map(match => {
                const teamA = teams.find(t => t.id === match.teamAId);
                const teamB = teams.find(t => t.id === match.teamBId);
                
                if (!teamA || !teamB) return null;

                return (
                  <div key={match.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        {getMatchStatusIcon(match.status)}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMatchStatusColor(match.status)}`}>
                          {match.status}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMatchTypeColor(match.type)}`}>
                          {match.type}
                        </span>
                        <span className="text-sm text-gray-600">Match #{match.id}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">{match.date}</div>
                        <div className="text-sm text-gray-600">{match.teeTime}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg font-bold"
                          style={{ backgroundColor: teamA.color }}
                        >
                          {teamA.logo}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{teamA.name}</div>
                          <div className="text-sm text-gray-600">{teamA.description}</div>
                          <div className="text-xs text-gray-500">
                            Players: {match.players?.teamA?.join(', ') || 'TBD'}
                          </div>
                        </div>
                      </div>

                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-900">vs</div>
                        <div className="text-sm text-gray-600">{match.course}</div>
                        <div className="text-xs text-gray-500">{match.type}</div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <div className="font-medium text-gray-900">{teamB.name}</div>
                          <div className="text-sm text-gray-600">{teamB.description}</div>
                          <div className="text-xs text-gray-500">
                            Players: {match.players?.teamB?.join(', ') || 'TBD'}
                          </div>
                        </div>
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg font-bold"
                          style={{ backgroundColor: teamB.color }}
                        >
                          {teamB.logo}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        Result: <span className="font-medium text-gray-900">{calculateMatchResult(match)}</span>
                      </div>
                      <Link
                        href={`/match/${match.id}`}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                      >
                        <span>View Match</span>
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 