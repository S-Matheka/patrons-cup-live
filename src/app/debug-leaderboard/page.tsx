'use client';

import { useState, useEffect } from 'react';
import { useTournament } from '@/context/TournamentContextSwitcher';
import FinalLeaderboard from '@/components/FinalLeaderboard';

export default function DebugLeaderboardPage() {
  const { matches } = useTournament();
  const [isClient, setIsClient] = useState(false);
  const [matchStats, setMatchStats] = useState<any>({});

  // Only run on client side to prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
    if (matches) {
      calculateMatchStats();
    }
  }, [matches]);

  const calculateMatchStats = () => {
    if (!matches) return;

    const stats: any = {
      total: matches.length,
      completed: 0,
      inProgress: 0,
      scheduled: 0,
      byDivision: {},
      byDay: {},
      byType: {},
      bySession: {}
    };

    // Initialize division stats
    ['Trophy', 'Shield', 'Plaque', 'Bowl', 'Mug'].forEach(division => {
      stats.byDivision[division] = {
        total: 0,
        completed: 0,
        inProgress: 0,
        scheduled: 0
      };
    });

    // Process each match
    matches.forEach(match => {
      // Count by status
      if (match.status === 'completed') stats.completed++;
      else if (match.status === 'in-progress') stats.inProgress++;
      else stats.scheduled++;

      // Count by division
      if (match.division && stats.byDivision[match.division]) {
        stats.byDivision[match.division].total++;
        if (match.status === 'completed') stats.byDivision[match.division].completed++;
        else if (match.status === 'in-progress') stats.byDivision[match.division].inProgress++;
        else stats.byDivision[match.division].scheduled++;
      }

      // Count by day
      const day = match.match_date || match.date;
      if (day) {
        if (!stats.byDay[day]) {
          stats.byDay[day] = {
            total: 0,
            completed: 0,
            inProgress: 0,
            scheduled: 0
          };
        }
        stats.byDay[day].total++;
        if (match.status === 'completed') stats.byDay[day].completed++;
        else if (match.status === 'in-progress') stats.byDay[day].inProgress++;
        else stats.byDay[day].scheduled++;
      }

      // Count by match type
      const type = match.match_type || match.type;
      if (type) {
        if (!stats.byType[type]) {
          stats.byType[type] = {
            total: 0,
            completed: 0,
            inProgress: 0,
            scheduled: 0
          };
        }
        stats.byType[type].total++;
        if (match.status === 'completed') stats.byType[type].completed++;
        else if (match.status === 'in-progress') stats.byType[type].inProgress++;
        else stats.byType[type].scheduled++;
      }

      // Count by session
      const session = match.session;
      if (session) {
        if (!stats.bySession[session]) {
          stats.bySession[session] = {
            total: 0,
            completed: 0,
            inProgress: 0,
            scheduled: 0
          };
        }
        stats.bySession[session].total++;
        if (match.status === 'completed') stats.bySession[session].completed++;
        else if (match.status === 'in-progress') stats.bySession[session].inProgress++;
        else stats.bySession[session].scheduled++;
      }
    });

    setMatchStats(stats);
  };

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
    <div className="space-y-8 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900">Leaderboard Debug Page</h1>
        <p className="mt-2 text-gray-600">
          This page shows detailed information about the leaderboard calculations.
        </p>
      </div>

      {/* Match Statistics */}
      <div className="max-w-7xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Match Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Overall</h3>
            <div className="bg-gray-100 p-4 rounded-md">
              <p>Total Matches: {matchStats.total}</p>
              <p>Completed: {matchStats.completed}</p>
              <p>In Progress: {matchStats.inProgress}</p>
              <p>Scheduled: {matchStats.scheduled}</p>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-2">By Division</h3>
            <div className="bg-gray-100 p-4 rounded-md">
              {matchStats.byDivision && Object.entries(matchStats.byDivision).map(([division, stats]: [string, any]) => (
                <div key={division} className="mb-2">
                  <p className="font-medium">{division}</p>
                  <p className="pl-4 text-sm">Total: {stats.total}, Completed: {stats.completed}, In Progress: {stats.inProgress}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-2">By Day</h3>
            <div className="bg-gray-100 p-4 rounded-md">
              {matchStats.byDay && Object.entries(matchStats.byDay).map(([day, stats]: [string, any]) => (
                <div key={day} className="mb-2">
                  <p className="font-medium">{day}</p>
                  <p className="pl-4 text-sm">Total: {stats.total}, Completed: {stats.completed}, In Progress: {stats.inProgress}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-2">By Match Type</h3>
            <div className="bg-gray-100 p-4 rounded-md">
              {matchStats.byType && Object.entries(matchStats.byType).map(([type, stats]: [string, any]) => (
                <div key={type} className="mb-2">
                  <p className="font-medium">{type}</p>
                  <p className="pl-4 text-sm">Total: {stats.total}, Completed: {stats.completed}, In Progress: {stats.inProgress}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-2">By Session</h3>
            <div className="bg-gray-100 p-4 rounded-md">
              {matchStats.bySession && Object.entries(matchStats.bySession).map(([session, stats]: [string, any]) => (
                <div key={session} className="mb-2">
                  <p className="font-medium">{session}</p>
                  <p className="pl-4 text-sm">Total: {stats.total}, Completed: {stats.completed}, In Progress: {stats.inProgress}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Trophy Division */}
      <div className="max-w-7xl mx-auto">
        <h2 className="text-xl font-bold mb-4">Trophy Division</h2>
        <FinalLeaderboard defaultDivision="Trophy" showTabs={false} showDebug={true} />
      </div>

      {/* Shield Division */}
      <div className="max-w-7xl mx-auto">
        <h2 className="text-xl font-bold mb-4">Shield Division</h2>
        <FinalLeaderboard defaultDivision="Shield" showTabs={false} showDebug={true} />
      </div>

      {/* Plaque Division */}
      <div className="max-w-7xl mx-auto">
        <h2 className="text-xl font-bold mb-4">Plaque Division</h2>
        <FinalLeaderboard defaultDivision="Plaque" showTabs={false} showDebug={true} />
      </div>

      {/* Bowl Division */}
      <div className="max-w-7xl mx-auto">
        <h2 className="text-xl font-bold mb-4">Bowl Division</h2>
        <FinalLeaderboard defaultDivision="Bowl" showTabs={false} showDebug={true} />
      </div>

      {/* Mug Division */}
      <div className="max-w-7xl mx-auto mb-8">
        <h2 className="text-xl font-bold mb-4">Mug Division</h2>
        <FinalLeaderboard defaultDivision="Mug" showTabs={false} showDebug={true} />
      </div>
    </div>
  );
}
