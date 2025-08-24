'use client';

import { useState, useMemo, useEffect } from 'react';
import { useTournament } from '@/context/TournamentContextSwitcher';
import { Trophy, Medal } from 'lucide-react';
import TournamentCountdown from '@/components/TournamentCountdown';
import FinalLeaderboard from '@/components/FinalLeaderboard';

export default function StandingsPage() {
  const [isClient, setIsClient] = useState(false);

  // Only run on client side to prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Show minimal loading state during SSR
  if (!isClient) {
    return (
      <div className="space-y-8">
        {/* Tournament Countdown */}
        <div className="max-w-7xl mx-auto px-4">
          <TournamentCountdown />
        </div>

        {/* Page Header */}
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Trophy className="w-8 h-8 mr-3 text-yellow-500" />
            Tournament Standings
          </h1>
          <p className="mt-2 text-gray-600">
            Current standings for all divisions based on completed matches.
          </p>
        </div>

        {/* Trophy Division */}
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-2 flex items-center">
            <Trophy className="w-6 h-6 mr-2 text-yellow-500" />
            <h2 className="text-xl font-bold text-gray-900">Trophy Division</h2>
          </div>
          <FinalLeaderboard defaultDivision="Trophy" showTabs={false} />
        </div>

        {/* Shield Division */}
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-2 flex items-center">
            <Medal className="w-6 h-6 mr-2 text-gray-400" />
            <h2 className="text-xl font-bold text-gray-900">Shield Division</h2>
          </div>
          <FinalLeaderboard defaultDivision="Shield" showTabs={false} />
        </div>

        {/* Plaque Division */}
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-2 flex items-center">
            <Medal className="w-6 h-6 mr-2 text-amber-600" />
            <h2 className="text-xl font-bold text-gray-900">Plaque Division</h2>
          </div>
          <FinalLeaderboard defaultDivision="Plaque" showTabs={false} />
        </div>

        {/* Bowl Division */}
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-2 flex items-center">
            <Medal className="w-6 h-6 mr-2 text-orange-500" />
            <h2 className="text-xl font-bold text-gray-900">Bowl Division</h2>
          </div>
          <FinalLeaderboard defaultDivision="Bowl" showTabs={false} />
        </div>

        {/* Mug Division */}
        <div className="max-w-7xl mx-auto px-4 mb-8">
          <div className="mb-2 flex items-center">
            <Medal className="w-6 h-6 mr-2 text-purple-500" />
            <h2 className="text-xl font-bold text-gray-900">Mug Division</h2>
          </div>
          <FinalLeaderboard defaultDivision="Mug" showTabs={false} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Tournament Countdown */}
      <div className="max-w-7xl mx-auto px-4">
        <TournamentCountdown />
      </div>

      {/* Page Header */}
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Trophy className="w-8 h-8 mr-3 text-yellow-500" />
          Tournament Standings
        </h1>
        <p className="mt-2 text-gray-600">
          Current standings for all divisions based on completed matches.
        </p>
      </div>

      {/* Trophy Division */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-2 flex items-center">
          <Trophy className="w-6 h-6 mr-2 text-yellow-500" />
          <h2 className="text-xl font-bold text-gray-900">Trophy Division</h2>
        </div>
        <FinalLeaderboard defaultDivision="Trophy" showTabs={false} />
      </div>

      {/* Shield Division */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-2 flex items-center">
          <Medal className="w-6 h-6 mr-2 text-gray-400" />
          <h2 className="text-xl font-bold text-gray-900">Shield Division</h2>
        </div>
        <FinalLeaderboard defaultDivision="Shield" showTabs={false} />
      </div>

      {/* Plaque Division */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-2 flex items-center">
          <Medal className="w-6 h-6 mr-2 text-amber-600" />
          <h2 className="text-xl font-bold text-gray-900">Plaque Division</h2>
        </div>
        <FinalLeaderboard defaultDivision="Plaque" showTabs={false} />
      </div>

      {/* Bowl Division */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-2 flex items-center">
          <Medal className="w-6 h-6 mr-2 text-orange-500" />
          <h2 className="text-xl font-bold text-gray-900">Bowl Division</h2>
        </div>
        <FinalLeaderboard defaultDivision="Bowl" showTabs={false} />
      </div>

      {/* Mug Division */}
      <div className="max-w-7xl mx-auto px-4 mb-8">
        <div className="mb-2 flex items-center">
          <Medal className="w-6 h-6 mr-2 text-purple-500" />
          <h2 className="text-xl font-bold text-gray-900">Mug Division</h2>
        </div>
        <FinalLeaderboard defaultDivision="Mug" showTabs={false} />
      </div>
    </div>
  );
}