'use client';

import { useTournament } from '@/context/TournamentContextSwitcher';
import { Medal, TrendingUp } from 'lucide-react';

interface LeaderboardProps {
  activeDivision: 'Trophy' | 'Shield' | 'Plaque' | 'Bowl' | 'Mug';
}

export default function Leaderboard({ activeDivision }: LeaderboardProps) {
  const { teams, scores } = useTournament();
  
  // Filter scores by active division
  const divisionScores = scores.filter(score => score.division === activeDivision);
  
  // Sort teams by seed for pre-tournament display
  const sortedTeams = teams
    .filter(team => team.division === activeDivision)
    .sort((a, b) => a.seed - b.seed);

  // Debug: Check if we have any teams at all
  if (teams.length === 0) {
    console.error('No teams loaded in Leaderboard component');
    return <div className="p-4 text-red-600">Error: No teams data loaded</div>;
  }



  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 bg-gradient-to-r from-green-600 to-green-700">
        <h2 className="text-xl font-bold text-white flex items-center">
          <Medal className="w-5 h-5 mr-2" />
          Tournament Seedings - {activeDivision} Division
        </h2>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Seed
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Team
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Players
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Max Points
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Points Distribution
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedTeams.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  <div className="space-y-2">
                    <div className="text-lg font-medium">No teams found</div>
                    <div className="text-sm">
                      Division: {activeDivision} | Total teams loaded: {teams.length}
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              sortedTeams.map((team, index) => (
              <tr key={team.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-green-800">#{team.seed}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3"
                      style={{ backgroundColor: team.color }}
                    >
                      {team.logo}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{team.name}</div>
                      <div className="text-sm text-gray-500">{team.description}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {team.totalPlayers}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {team.maxPointsAvailable}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600">
                  <div className="space-y-1">
                    <div>Fri AM: {team.sessionPoints?.friAM4BBB || 0} pts</div>
                    <div>Fri PM: {team.sessionPoints?.friPMFoursomes || 0} pts</div>
                    <div>Sun Singles: {team.sessionPoints?.sunSingles || 0} pts</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Ready
                  </span>
                </td>
              </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
