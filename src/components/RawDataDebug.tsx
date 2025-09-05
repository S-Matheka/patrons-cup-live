'use client';

import { useTournament } from '@/context/TournamentContextSwitcher';

export default function RawDataDebug() {
  const { matches, teams } = useTournament();

  if (!matches || !teams) {
    return <div>Loading...</div>;
  }

  const completedMatches = matches.filter(m => m.status === 'completed');
  const completedByDivision = completedMatches.reduce((acc, match) => {
    if (!acc[match.division]) acc[match.division] = [];
    acc[match.division].push(match);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Raw Data Debug</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-2">Summary</h3>
          <p>Total matches: {matches.length}</p>
          <p>Completed matches: {completedMatches.length}</p>
          <p>Teams: {teams.length}</p>
        </div>
        
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-2">Completed by Division</h3>
          {Object.entries(completedByDivision).map(([division, matches]) => (
            <div key={division} className="mb-2">
              <strong>{division}:</strong> {matches.length} matches
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-2">Sample Completed Match</h3>
        {completedMatches.length > 0 && (
          <div className="text-xs font-mono bg-gray-100 p-2 rounded">
            <pre>{JSON.stringify(completedMatches[0], null, 2)}</pre>
          </div>
        )}
      </div>

      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-2">Sample Team</h3>
        {teams.length > 0 && (
          <div className="text-xs font-mono bg-gray-100 p-2 rounded">
            <pre>{JSON.stringify(teams[0], null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

