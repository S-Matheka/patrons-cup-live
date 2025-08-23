'use client';

import { useState, useMemo, useEffect } from 'react';
import { useTournament } from '@/context/TournamentContextSwitcher';
import { Trophy } from 'lucide-react';
import TournamentCountdown from '@/components/TournamentCountdown';
import FinalLeaderboard from '@/components/FinalLeaderboard';

export default function LeaderboardPage() {
  const { matches } = useTournament();
  const [isClient, setIsClient] = useState(false);

  // Only run on client side to prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Get tournament statistics
  const tournamentStats = useMemo(() => {
    if (!isClient || !matches) return { 
      totalMatches: 0, 
      completedMatches: 0, 
      inProgressMatches: 0, 
      scheduledMatches: 0,
      completionPercentage: 0 
    };
    
    const totalMatches = matches.length;
    const completedMatches = matches.filter(m => m.status === 'completed').length;
    const inProgressMatches = matches.filter(m => m.status === 'in-progress').length;
    const scheduledMatches = matches.filter(m => m.status === 'scheduled').length;

    return {
      totalMatches,
      completedMatches,
      inProgressMatches,
      scheduledMatches,
      completionPercentage: totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0
    };
  }, [isClient, matches]);

  // Show loading state during SSR
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tournament data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tournament Countdown */}
      <div className="max-w-6xl mx-auto px-4">
        <TournamentCountdown />
      </div>

      {/* Tournament Progress */}
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Tournament Progress</h3>
            <span className="text-2xl font-bold text-green-600">{tournamentStats.completionPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${tournamentStats.completionPercentage}%` }}
            ></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-xl font-bold text-gray-600">{tournamentStats.completedMatches}</div>
              <div className="text-xs text-gray-500">Completed</div>
            </div>
            <div>
              <div className="text-xl font-bold text-green-600">{tournamentStats.inProgressMatches}</div>
              <div className="text-xs text-gray-500">Live</div>
            </div>
            <div>
              <div className="text-xl font-bold text-blue-600">{tournamentStats.scheduledMatches}</div>
              <div className="text-xs text-gray-500">Scheduled</div>
            </div>
            <div>
              <div className="text-xl font-bold text-purple-600">{tournamentStats.totalMatches}</div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard Section */}
      <div className="max-w-6xl mx-auto">
        <FinalLeaderboard />
      </div>
    </div>
  );
}