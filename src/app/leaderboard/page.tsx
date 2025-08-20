'use client';

import { useTournament } from '@/context/TournamentContext';
import { useState } from 'react';
import Leaderboard from '@/components/Leaderboard';
import { Trophy, Medal } from 'lucide-react';

export default function LeaderboardPage() {
  const { teams } = useTournament();
  const [activeDivision, setActiveDivision] = useState<'Trophy' | 'Shield' | 'Plaque' | 'Bowl' | 'Mug'>('Trophy');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center px-4">
        <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">Tournament Leaderboard</h1>
        <p className="text-sm md:text-lg text-gray-600">Current tournament seedings and team standings</p>
      </div>

      {/* Leaderboard Section */}
      <div className="max-w-6xl mx-auto">
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
                  className={`flex-shrink-0 px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                    activeDivision === division
                      ? 'bg-white text-green-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
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
      </div>

      {/* Tournament Info */}
      <div className="max-w-6xl mx-auto">
        <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">{teams.length}</div>
              <div className="text-sm text-gray-600">Teams Participating</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">5</div>
              <div className="text-sm text-gray-600">Divisions</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">Aug 22-24</div>
              <div className="text-sm text-gray-600">Tournament Dates</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
