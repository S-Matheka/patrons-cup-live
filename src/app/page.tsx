'use client';

import { useTournament } from '@/context/TournamentContext';
// import { useState } from 'react';
import Leaderboard from '@/components/Leaderboard';
import { Calendar, Clock, CheckCircle, Circle, Trophy, Medal, Zap } from 'lucide-react';


export default function Dashboard() {
  const { teams, scores, matches } = useTournament();

  const activeMatches = []; // No matches are currently in progress
  const upcomingMatches = matches.filter(match => match.status === 'scheduled');
  const completedMatches = []; // No matches have been completed yet

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

  const getMatchStatusEmoji = (status: string) => {
    switch (status) {
      case 'in-progress':
        return '🟢 Live';
      case 'completed':
        return '✅ Completed';
      case 'scheduled':
        return '🔜 Upcoming';
      default:
        return '⏳ TBD';
    }
  };

  const calculateMatchResult = (match: Match) => {
    if (match.isBye) return 'BYE';
    if (match.status === 'scheduled') return 'Not Started';
    
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
    
    if (match.status === 'completed') {
      if (teamAWins > teamBWins) return `Match Won ${teamAWins - teamBWins} UP`;
      if (teamBWins > teamAWins) return `Match Won ${teamBWins - teamAWins} UP`;
      return 'HALVED';
    }
    
    // For in-progress matches
    if (teamAWins > teamBWins) return `${teamAWins - teamBWins} UP`;
    if (teamBWins > teamAWins) return `${teamBWins - teamAWins} UP`;
    return 'All Square';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center px-4">
        <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">Patron's Cup Tournament</h1>
        <p className="text-sm md:text-lg text-gray-600">Live scoring and tournament dashboard</p>
      </div>

      {/* Desktop 3-Column Layout */}
      <div className="hidden lg:grid lg:grid-cols-3 lg:gap-6">
        
        {/* Left Column - Schedule/Fixtures */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-md">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700">
              <h2 className="text-xl font-bold text-white flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Schedule / Fixtures
              </h2>
            </div>
            <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
              {[...activeMatches, ...upcomingMatches, ...completedMatches.slice(-3)].map(match => {
                const teamA = teams.find(t => t.id === match.teamAId);
                const teamB = teams.find(t => t.id === match.teamBId);
                
                return (
                  <div key={match.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium text-gray-900">
                        {formatDate(match.date)} {match.session} ({match.teeTime})
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMatchStatusColor(match.status)}`}>
                        {getMatchStatusEmoji(match.status)}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-2">
                      {match.type} | {match.division} Division
                    </div>
                    
                    {match.isBye ? (
                      <div className="text-center py-2">
                        <div className="font-medium text-gray-900">{teamA?.name} (BYE)</div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {teamA && (
                            <>
                              <div 
                                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs"
                                style={{ backgroundColor: teamA.color }}
                              >
                                {teamA.logo}
                              </div>
                              <span className="text-sm font-medium">{teamA.name}</span>
                            </>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">vs</span>
                        <div className="flex items-center space-x-2">
                          {teamB && (
                            <>
                              <span className="text-sm font-medium">{teamB.name}</span>
                              <div 
                                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs"
                                style={{ backgroundColor: teamB.color }}
                              >
                                {teamB.logo}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-2 text-xs text-gray-500">
                      {match.course} | {calculateMatchResult(match)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Center Column - Leaderboard */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-md">
            <div className="px-6 py-4 bg-gradient-to-r from-green-600 to-green-700">
              <h2 className="text-xl font-bold text-white flex items-center">
                <Trophy className="w-5 h-5 mr-2" />
                Leaderboard
              </h2>
            </div>
            <div className="p-6 space-y-6 max-h-96 overflow-y-auto">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Medal className="w-5 h-5 text-yellow-500 mr-2" />
                  Trophy Division
                </h3>
                <Leaderboard teams={teams} scores={scores.filter(s => s.division === 'Trophy')} division="Trophy" />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Medal className="w-5 h-5 text-gray-400 mr-2" />
                  Shield Division
                </h3>
                <Leaderboard teams={teams} scores={scores.filter(s => s.division === 'Shield')} division="Shield" />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Medal className="w-5 h-5 text-amber-600 mr-2" />
                  Plaque Division
                </h3>
                <Leaderboard teams={teams} scores={scores.filter(s => s.division === 'Plaque')} division="Plaque" />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Medal className="w-5 h-5 text-bronze-500 mr-2" />
                  Bowl Division
                </h3>
                <Leaderboard teams={teams} scores={scores.filter(s => s.division === 'Bowl')} division="Bowl" />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Medal className="w-5 h-5 text-purple-500 mr-2" />
                  Mug Division
                </h3>
                <Leaderboard teams={teams} scores={scores.filter(s => s.division === 'Mug')} division="Mug" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Live Scoring & Tournament Feed */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-md">
            <div className="px-6 py-4 bg-gradient-to-r from-red-600 to-red-700">
              <h2 className="text-xl font-bold text-white flex items-center">
                <Zap className="w-5 h-5 mr-2" />
                Live Scoring
              </h2>
            </div>
            <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Tournament Starts Soon!</h3>
                <p className="text-gray-600 mb-4">4th Edition Patron&apos;s Cup 2025</p>
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-sm text-blue-800">
                    <div className="font-medium mb-1">First Round</div>
                    <div>Friday, August 22nd at 7:30 AM</div>
                    <div className="text-xs mt-1">4BBB Shotgun Start</div>
                  </div>
                </div>
              </div>
              
              {/* Tournament Stats */}
              <div className="border-t pt-4 mt-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-blue-600">15</div>
                    <div className="text-xs text-gray-500">Teams Ready</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-purple-600">5</div>
                    <div className="text-xs text-gray-500">Divisions</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile/Tablet Stacked Layout */}
      <div className="lg:hidden space-y-6">
        {/* Mobile Tournament Info */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700">
            <h2 className="text-xl font-bold text-white">Tournament Information</h2>
          </div>
          <div className="p-6">
            <div className="text-center mb-6">
              <Calendar className="w-16 h-16 text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">4th Edition Patron&apos;s Cup 2025</h3>
              <p className="text-gray-600 mb-4">Muthaiga Golf Club</p>
            </div>
            
            <div className="space-y-3">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="font-medium text-blue-900 mb-1">Tournament Dates</div>
                <div className="text-sm text-blue-800">August 22-24, 2025</div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4">
                <div className="font-medium text-green-900 mb-1">First Round</div>
                <div className="text-sm text-green-800">Friday, August 22nd at 7:30 AM</div>
                <div className="text-xs text-green-700">4BBB Shotgun Start</div>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="font-medium text-purple-900 mb-1">Participating Teams</div>
                <div className="text-sm text-purple-800">15 clubs across 5 divisions</div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Leaderboard */}
        <Leaderboard teams={teams} scores={scores} />
      </div>
    </div>
  );
}