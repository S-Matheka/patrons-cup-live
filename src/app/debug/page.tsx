'use client';

import { useState, useEffect } from 'react';
import { useTournament } from '@/context/TournamentContextSwitcher';

export default function DebugPage() {
  const context = useTournament();
  const [isClient, setIsClient] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
    
    try {
      // Validate context
      if (!context) {
        setError('Tournament context is undefined');
      }
    } catch (err) {
      setError(`Error accessing context: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [context]);

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading debug data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-red-50 p-8">
        <h1 className="text-3xl font-bold text-red-600 mb-4">Error</h1>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <p className="text-red-600 font-mono">{error}</p>
        </div>
      </div>
    );
  }

  const { teams, matches, players, scores } = context;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Debug Information</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <DebugCard
          title="Teams"
          count={teams?.length || 0}
          items={teams?.map(team => ({
            id: team.id,
            name: team.name,
            division: team.division
          }))}
        />
        
        <DebugCard
          title="Matches"
          count={matches?.length || 0}
          summary={{
            'By Status': {
              'Completed': matches?.filter(m => m.status === 'completed').length || 0,
              'In Progress': matches?.filter(m => m.status === 'in-progress').length || 0,
              'Scheduled': matches?.filter(m => m.status === 'scheduled').length || 0
            },
            'By Division': Object.fromEntries(
              ['Trophy', 'Shield', 'Plaque', 'Bowl', 'Mug'].map(div => [
                div, 
                matches?.filter(m => m.division === div).length || 0
              ])
            )
          }}
        />
        
        <DebugCard
          title="Players"
          count={players?.length || 0}
          summary={{
            'By Team': Object.fromEntries(
              teams?.map(team => [
                team.name,
                players?.filter(p => p.teamId === team.id).length || 0
              ]) || []
            )
          }}
        />
        
        <DebugCard
          title="Scores"
          count={scores?.length || 0}
          items={scores?.map(score => ({
            teamId: score.teamId,
            teamName: teams?.find(t => t.id === score.teamId)?.name || 'Unknown',
            points: score.points,
            matchesPlayed: score.matchesPlayed
          }))}
        />
      </div>
      
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Environment</h2>
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Supabase Configuration</h3>
            <p>URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Not set'}</p>
            <p>Anon Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Not set'}</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Next.js</h3>
            <p>Environment: {process.env.NODE_ENV}</p>
            <p>Client Side: {typeof window !== 'undefined' ? 'Yes' : 'No'}</p>
          </div>
        </div>
      </div>
      
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Raw Context Data</h2>
      <div className="bg-white p-6 rounded-lg shadow-md overflow-auto">
        <pre className="text-xs font-mono">
          {JSON.stringify({
            teamsCount: teams?.length || 0,
            matchesCount: matches?.length || 0,
            playersCount: players?.length || 0,
            scoresCount: scores?.length || 0,
            teamsByDivision: teams ? Object.fromEntries(
              ['Trophy', 'Shield', 'Plaque', 'Bowl', 'Mug'].map(div => [
                div, 
                teams.filter(t => t.division === div).map(t => t.name)
              ])
            ) : 'No teams data',
            matchesByDivision: matches ? Object.fromEntries(
              ['Trophy', 'Shield', 'Plaque', 'Bowl', 'Mug'].map(div => [
                div, 
                matches.filter(m => m.division === div).length
              ])
            ) : 'No matches data',
          }, null, 2)}
        </pre>
      </div>
    </div>
  );
}

function DebugCard({ title, count, items, summary }: { 
  title: string, 
  count: number, 
  items?: any[],
  summary?: Record<string, any>
}) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        <span className="text-2xl font-bold text-green-600">{count}</span>
      </div>
      
      {summary && Object.entries(summary).map(([category, data]) => (
        <div key={category} className="mb-4">
          <h3 className="text-md font-semibold text-gray-700 mb-2">{category}</h3>
          <div className="bg-gray-50 p-3 rounded">
            {Object.entries(data).map(([key, value]) => (
              <div key={key} className="flex justify-between text-sm">
                <span>{key}</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
      
      {items && items.length > 0 && (
        <div className="mt-4">
          <h3 className="text-md font-semibold text-gray-700 mb-2">Sample Data</h3>
          <div className="bg-gray-50 p-3 rounded overflow-auto max-h-60">
            <pre className="text-xs">{JSON.stringify(items.slice(0, 5), null, 2)}</pre>
            {items.length > 5 && (
              <p className="text-xs text-gray-500 mt-2">
                ...and {items.length - 5} more items
              </p>
            )}
          </div>
        </div>
      )}
      
      {count === 0 && (
        <div className="bg-red-50 p-3 rounded mt-4">
          <p className="text-red-600 text-sm">No data available!</p>
        </div>
      )}
    </div>
  );
}
