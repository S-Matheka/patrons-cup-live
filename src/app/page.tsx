'use client';

import { useTournament } from '@/context/TournamentContext';
import { useState } from 'react';
import { Trophy, Medal, Users, Calendar, BarChart3, Zap } from 'lucide-react';
import TeamCard from '@/components/TeamCard';
import Leaderboard from '@/components/Leaderboard';
import Link from 'next/link';

export default function Dashboard() {
  const { teams, scores, matches } = useTournament();
  const [activeDivision, setActiveDivision] = useState<'Trophy' | 'Plate' | 'Bowl' | 'Mug' | 'all'>('all');

  const trophyTeams = teams.filter(team => team.division === 'Trophy');
  const plateTeams = teams.filter(team => team.division === 'Plate');
  const bowlTeams = teams.filter(team => team.division === 'Bowl');
  const mugTeams = teams.filter(team => team.division === 'Mug');
  
  const trophyScores = scores.filter(score => score.division === 'Trophy');
  const plateScores = scores.filter(score => score.division === 'Plate');
  const bowlScores = scores.filter(score => score.division === 'Bowl');
  const mugScores = scores.filter(score => score.division === 'Mug');

  const activeMatches = matches.filter(match => match.status === 'in-progress');
  const todayMatches = matches.filter(match => match.date === '2024-01-15');

  const getTopTeams = (division: 'Trophy' | 'Plate' | 'Bowl' | 'Mug') => {
    const divisionScores = scores.filter(score => score.division === division);
    return divisionScores
      .sort((a, b) => b.points - a.points)
      .slice(0, 3)
      .map(score => {
        const team = teams.find(t => t.id === score.teamId);
        return team ? { team, score } : null;
      })
      .filter(Boolean);
  };

  const stats = {
    totalTeams: teams.length,
    activeMatches: activeMatches.length,
    totalMatches: matches.length,
    trophyTeams: trophyTeams.length,
    plateTeams: plateTeams.length,
    bowlTeams: bowlTeams.length,
    mugTeams: mugTeams.length,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Patrons Cup Tournament</h1>
        <p className="text-lg text-gray-600">Live scoring and tournament management</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Teams</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalTeams}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Zap className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Matches</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeMatches}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Trophy className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Trophy Division</p>
              <p className="text-2xl font-bold text-gray-900">{stats.trophyTeams}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Medal className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Other Divisions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.plateTeams + stats.bowlTeams + stats.mugTeams}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Division Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6 overflow-x-auto">
            <button
              onClick={() => setActiveDivision('all')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeDivision === 'all'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              All Divisions
            </button>
            <button
              onClick={() => setActiveDivision('Trophy')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeDivision === 'Trophy'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Trophy Division
            </button>
            <button
              onClick={() => setActiveDivision('Plate')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeDivision === 'Plate'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Plate Division
            </button>
            <button
              onClick={() => setActiveDivision('Bowl')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeDivision === 'Bowl'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Bowl Division
            </button>
            <button
              onClick={() => setActiveDivision('Mug')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeDivision === 'Mug'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Mug Division
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeDivision === 'all' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Trophy Division</h3>
                <Leaderboard teams={teams} scores={trophyScores} division="Trophy" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Plate Division</h3>
                <Leaderboard teams={teams} scores={plateScores} division="Plate" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Bowl Division</h3>
                <Leaderboard teams={teams} scores={bowlScores} division="Bowl" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Mug Division</h3>
                <Leaderboard teams={teams} scores={mugScores} division="Mug" />
              </div>
            </div>
          )}

          {activeDivision === 'Trophy' && (
            <Leaderboard teams={teams} scores={trophyScores} division="Trophy" />
          )}

          {activeDivision === 'Plate' && (
            <Leaderboard teams={teams} scores={plateScores} division="Plate" />
          )}

          {activeDivision === 'Bowl' && (
            <Leaderboard teams={teams} scores={bowlScores} division="Bowl" />
          )}

          {activeDivision === 'Mug' && (
            <Leaderboard teams={teams} scores={mugScores} division="Mug" />
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          href="/live"
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200"
        >
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Zap className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Live Scoring</h3>
              <p className="text-sm text-gray-600">View real-time match updates</p>
            </div>
          </div>
        </Link>

        <Link
          href="/teams"
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200"
        >
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Teams & Players</h3>
              <p className="text-sm text-gray-600">Browse team information</p>
            </div>
          </div>
        </Link>

        <Link
          href="/schedule"
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200"
        >
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Calendar className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Schedule</h3>
              <p className="text-sm text-gray-600">View match schedule</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Today's Matches */}
      {todayMatches.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Today&apos;s Matches</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {todayMatches.map(match => {
              const teamA = teams.find(t => t.id === match.teamAId);
              const teamB = teams.find(t => t.id === match.teamBId);
              
              if (!teamA || !teamB) return null;

              return (
                <div key={match.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">{match.teeTime}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      match.status === 'in-progress' ? 'bg-green-100 text-green-800' :
                      match.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {match.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs"
                        style={{ backgroundColor: teamA.color }}
                      >
                        {teamA.logo}
                      </div>
                      <span className="text-sm font-medium">{teamA.name}</span>
                    </div>
                    <span className="text-sm text-gray-500">vs</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">{teamB.name}</span>
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs"
                        style={{ backgroundColor: teamB.color }}
                      >
                        {teamB.logo}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">{match.course}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
