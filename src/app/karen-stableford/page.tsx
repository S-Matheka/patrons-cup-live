'use client';

import React, { useState, useMemo } from 'react';
import { useTournament } from '@/context/TournamentContextSwitcher';
import StablefordLeaderboard from '@/components/StablefordLeaderboard';
import KarenDrawDisplay from '@/components/KarenDrawDisplay';
import { StablefordTeam, StablefordPlayer, StablefordRound } from '@/utils/stablefordScoring';

type TabType = 'leaderboard' | 'draw' | 'teams' | 'toc';

const KarenStablefordPage: React.FC = () => {
  const { currentTournament, teams, players } = useTournament();
  const [activeTab, setActiveTab] = useState<TabType>('leaderboard');
  const [selectedRound, setSelectedRound] = useState<number | 'aggregate'>('aggregate');

  // Convert teams to Stableford format
  const stablefordTeams = useMemo((): StablefordTeam[] => {
    return teams
      .filter(team => team.division === 'Trophy' || team.division === 'Shield') // Database uses Trophy/Shield
      .map(team => {
        const teamPlayers = players.filter(p => p.teamId === team.id);
        
        const stablefordPlayers: StablefordPlayer[] = teamPlayers.map(player => ({
          id: player.id,
          name: player.name,
          teamId: player.teamId,
          teamName: team.name,
          handicap: player.handicap || 0,
          rounds: [], // Will be populated when scoring data is available
          aggregatePoints: 0,
          aggregateGross: 0,
          aggregateNet: 0,
          position: 0,
        }));

        // Map database divisions to display divisions
        const displayDivision = team.division === 'Trophy' ? 'KAREN' : 'VISITOR';

        return {
          id: team.id,
          name: team.name,
          division: displayDivision as 'KAREN' | 'VISITOR',
          color: team.color,
          players: stablefordPlayers,
          teamPoints: 0,
          teamGross: 0,
          teamNet: 0,
          position: 0,
        };
      });
  }, [teams, players]);

  const karenTeams = stablefordTeams.filter(t => t.division === 'KAREN');
  const visitorTeams = stablefordTeams.filter(t => t.division === 'VISITOR');

  const renderLeaderboardTab = () => (
    <div className="space-y-6">
      <StablefordLeaderboard
        showRound={selectedRound}
        onRoundChange={setSelectedRound}
      />
    </div>
  );

  const renderDrawTab = () => (
    <div className="space-y-6">
      <KarenDrawDisplay />
    </div>
  );

  const renderTeamsTab = () => (
    <div className="space-y-4 sm:space-y-6">
      {/* KAREN Teams */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center">
            <span className="w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full mr-2 sm:mr-3"></span>
            KAREN Teams
          </h3>
          <span className="px-2 sm:px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs sm:text-sm font-medium">
            {karenTeams.length} Teams
          </span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {karenTeams.map((team) => (
            <div key={team.id} className="p-3 sm:p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm sm:text-base font-medium text-gray-900 truncate">{team.name}</h4>
                <span className="text-xs text-gray-500">#{team.id}</span>
              </div>
              <div className="text-xs sm:text-sm text-gray-600 mb-2">
                {team.players.length} players
              </div>
              <div className="space-y-1">
                {team.players.map((player) => (
                  <div key={player.id} className="text-xs text-gray-500 flex justify-between">
                    <span className="truncate">{player.name}</span>
                    <span className="font-medium ml-2">HCP {player.handicap}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* VISITOR Teams */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center">
            <span className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-500 rounded-full mr-2 sm:mr-3"></span>
            VISITOR Teams
          </h3>
          <span className="px-2 sm:px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs sm:text-sm font-medium">
            {visitorTeams.length} Teams
          </span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {visitorTeams.map((team) => (
            <div key={team.id} className="p-3 sm:p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm sm:text-base font-medium text-gray-900 truncate">{team.name}</h4>
                <span className="text-xs text-gray-500">#{team.id}</span>
              </div>
              <div className="text-xs sm:text-sm text-gray-600 mb-2">
                {team.players.length} players
              </div>
              <div className="space-y-1">
                {team.players.map((player) => (
                  <div key={player.id} className="text-xs text-gray-500 flex justify-between">
                    <span className="truncate">{player.name}</span>
                    <span className="font-medium ml-2">HCP {player.handicap}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTocTab = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Terms & Conditions</h3>
        <div className="prose max-w-none">
          <div className="space-y-4 sm:space-y-6 text-gray-700">
            <div>
              <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">1. GENERAL</h4>
              <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm">
                <li>The Nancy Millar trophy is a Team Competition, where each team consists of four players holding valid WHS handicaps</li>
                <li>Combined handicap index must be no more than 115.9</li>
                <li>Format is Foursomes, Stableford, played off 50% of combined Course Handicap per pair</li>
                <li>Winners will be the team with the highest overall Stableford score over 54 holes</li>
                <li>Ties will be decided by countback over the final 18 holes, then 9,6,3, etc.</li>
                <li>Competition is played over three rounds with different team player pairings each round</li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">2. LIMITED ENTRY</h4>
              <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm">
                <li>Maximum number of teams: 32</li>
                <li>Preference given to teams with lowest combined handicaps if oversubscribed</li>
                <li>Entries must be received by Monday 8th September 2025 at 5.00 PM</li>
                <li>Team Captain to sign up through: https://forms.office.com/r/A9g9dHnG13</li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">3. TEAM STRUCTURE</h4>
              <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm">
                <li>Draw done according to names entered on entry form under A, B, C and D</li>
                <li>No changes permitted once draw has been done</li>
                <li>Captain must be nominated for each team</li>
                <li>Substitutes permitted only in exceptional circumstances until start of play</li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">4. ROUND PAIRINGS</h4>
              <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm">
                <li><strong>Round 1 (Saturday AM):</strong> A plays with C, B plays with D</li>
                <li><strong>Round 2 (Saturday PM):</strong> A plays with D, B plays with C</li>
                <li><strong>Round 3 (Sunday AM):</strong> A plays with B, C plays with D</li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">5. ENTRY FEE</h4>
              <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm">
                <li>KShs. 2,500/- per person</li>
                <li>Payment via Mpesa paybill 570900, Acc. No 9222-C</li>
                <li>Optional ball pool: KShs. 200/- per pair per round</li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">6. STARTING TIMES</h4>
              <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm">
                <li>Both players must be present on the tee at appointed starting time</li>
                <li>Lateness within 5 minutes: 2-stroke penalty at first hole</li>
                <li>More than 5 minutes late: disqualification for the pair from that round</li>
                <li>Starter's clock is deemed to denote official tournament time</li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">7. PRIZES</h4>
              <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm">
                <li>Overall team winners over 54 holes: Individual prizes to Winning, Runner-up, Third and Fourth teams</li>
                <li>Best pair over 18 holes: Individual prizes in priority of Sat AM, Sat PM and Sun AM</li>
                <li>Winners of overall team prizes are not eligible for individual round prizes</li>
                <li>No player will win more than one prize (except individual round prize)</li>
                <li>Prize-giving after lunch on Sunday afternoon at Karen Country Club</li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">8. SCORING SYSTEM</h4>
              <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm">
                <li>Net Albatross (3 under par): 5 points</li>
                <li>Net Eagle (2 under par): 4 points</li>
                <li>Net Birdie (1 under par): 3 points</li>
                <li>Net Par: 2 points</li>
                <li>Net Bogey (1 over par): 1 point</li>
                <li>Net Double Bogey or worse: 0 points</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Debug logging
  console.log('Nancy Millar Trophy Page Debug:', {
    currentTournament: currentTournament?.name,
    slug: currentTournament?.slug,
    teamsCount: teams.length,
    playersCount: players.length,
    stablefordTeamsCount: stablefordTeams.length
  });

  if (!currentTournament || currentTournament.slug !== 'nancy-millar-trophy-2025') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              The Nancy Millar Trophy
            </h1>
            <p className="text-gray-600">
              Please select The Nancy Millar Trophy tournament from the tournament selector.
            </p>
            <div className="mt-4 text-sm text-gray-500">
              <p>Current tournament: {currentTournament?.name || 'None'}</p>
              <p>Slug: {currentTournament?.slug || 'None'}</p>
              <p>Teams loaded: {teams.length}</p>
              <p>Players loaded: {players.length}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            The Nancy Millar Trophy 2025
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Foursomes Stableford Team Competition • {currentTournament.startDate} - {currentTournament.endDate}
          </p>
        </div>

        {/* Team Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center">
                <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                KAREN Teams
              </h3>
              <span className="px-2 sm:px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs sm:text-sm font-medium">
                {karenTeams.length} Teams
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900">
              {karenTeams.reduce((total, team) => total + team.players.length, 0)} Players
            </div>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Home Club Members</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center">
                <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                VISITOR Teams
              </h3>
              <span className="px-2 sm:px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs sm:text-sm font-medium">
                {visitorTeams.length} Teams
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900">
              {visitorTeams.reduce((total, team) => total + team.players.length, 0)} Players
            </div>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Visiting Teams</p>
          </div>
        </div>

        {/* Course Information */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Course Information</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-gray-900">72</div>
              <div className="text-xs sm:text-sm text-gray-600">Par</div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-gray-900">18</div>
              <div className="text-xs sm:text-sm text-gray-600">Holes</div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-gray-900">3</div>
              <div className="text-xs sm:text-sm text-gray-600">Rounds</div>
            </div>
          </div>
        </div>

        {/* Tabbed Navigation */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-2 sm:space-x-8 px-4 sm:px-6 overflow-x-auto">
              {[
                { id: 'leaderboard', name: 'Leaderboard' },
                { id: 'draw', name: 'Draw' },
                { id: 'teams', name: 'Teams' },
                { id: 'toc', name: 'TOC' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'leaderboard' && renderLeaderboardTab()}
        {activeTab === 'draw' && renderDrawTab()}
        {activeTab === 'teams' && renderTeamsTab()}
        {activeTab === 'toc' && renderTocTab()}
      </div>
    </div>
  );
};

export default KarenStablefordPage;