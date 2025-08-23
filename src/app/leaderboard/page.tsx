'use client';

import { useTournament } from '@/context/TournamentContext';
import { useState, useMemo } from 'react';
import { Trophy, Medal, TrendingUp, TrendingDown, Minus, Clock, CheckCircle } from 'lucide-react';
import TournamentCountdown from '@/components/TournamentCountdown';
import { calculateLiveStandings, getLiveTournamentStats } from '@/utils/liveStandingsCalculator';

export default function LeaderboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Leaderboard</h1>
        <p className="mt-4 text-gray-600">Cumulative scoring system implemented. Enable Supabase for live data.</p>
      </div>
    </div>
  );
}