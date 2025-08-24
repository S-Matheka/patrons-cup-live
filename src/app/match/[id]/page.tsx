'use client';

import { useTournament } from '@/context/TournamentContextSwitcher';
import { useParams } from 'next/navigation';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import LiveScorecard from '@/components/LiveScorecard';
import Link from 'next/link';

export default function MatchDetail() {
  const params = useParams();
  const matchId = parseInt(params.id as string);
  
  const { getMatchById, getTeamById, players } = useTournament();

  const match = getMatchById(matchId);
  
  if (!match) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Match Not Found</h2>
        <p className="text-gray-600 mb-6">The requested match could not be found.</p>
        <Link
          href="/live"
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Live Scoring
        </Link>
      </div>
    );
  }

  const teamA = match.teamAId ? getTeamById(match.teamAId) : null;
  const teamB = match.teamBId ? getTeamById(match.teamBId) : null;
  const teamC = match.teamCId ? getTeamById(match.teamCId) : null;

  // Get match players using the EXACT same logic as live scoring page
  const getMatchPlayers = (teamId: number, count: number = 2) => {
    const teamPlayers = players.filter(player => player.teamId === teamId);
    
    if (teamPlayers.length === 0) return [];
    
    // First, try to get actual assigned players from match data
    let assignedPlayerIds: string[] = [];
    
    if (match.players) {
      if (teamId === match.teamAId && match.players.teamA) {
        assignedPlayerIds = match.players.teamA;
      } else if (teamId === match.teamBId && match.players.teamB) {
        assignedPlayerIds = match.players.teamB;
      } else if (teamId === match.teamCId && match.players.teamC) {
        assignedPlayerIds = match.players.teamC;
      }
    }
    
    // Check if players were explicitly assigned (even if empty)
    let hasExplicitAssignment = false;
    if (match.players) {
      if (teamId === match.teamAId && match.players.teamA !== undefined) {
        hasExplicitAssignment = true;
      } else if (teamId === match.teamBId && match.players.teamB !== undefined) {
        hasExplicitAssignment = true;
      } else if (teamId === match.teamCId && match.players.teamC !== undefined) {
        hasExplicitAssignment = true;
      }
    }
    
    // If we have explicit assignment (even empty), use it
    if (hasExplicitAssignment) {
      if (assignedPlayerIds && assignedPlayerIds.length > 0) {
        const resolvedPlayers = assignedPlayerIds
          .map(playerId => {
            // Try to find player by ID first, then by name (for legacy data)
            return teamPlayers.find(p => 
              p.id.toString() === playerId || 
              p.name === playerId
            );
          })
          .filter(player => player !== undefined);
        
        return resolvedPlayers.slice(0, count);
      } else {
        // Explicitly assigned empty array - show no players
        return [];
      }
    }
    
    // Fallback: Generate consistent sample players based on match ID
    const startIndex = (match.id * teamId) % teamPlayers.length;
    const selectedPlayers = [];
    
    for (let i = 0; i < count && i < teamPlayers.length; i++) {
      const playerIndex = (startIndex + i) % teamPlayers.length;
      selectedPlayers.push(teamPlayers[playerIndex]);
    }
    
    return selectedPlayers;
  };

  const teamAPlayers = getMatchPlayers(match.teamAId || 0, match.type === 'Singles' ? 1 : 2);
  const teamBPlayers = getMatchPlayers(match.teamBId || 0, match.type === 'Singles' ? 1 : 2);

  if (!teamA || !teamB) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Team Information Missing</h2>
        <p className="text-gray-600 mb-6">Team information could not be loaded.</p>
        <Link
          href="/live"
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Live Scoring
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
      {/* Header */}
      <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/live"
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm sm:text-base font-medium">Back to Live Scoring</span>
        </Link>
        
        <div className="text-left sm:text-right">
          <div className="text-lg sm:text-xl font-bold text-gray-900">Match #{match.gameNumber || match.id}</div>
          <div className="text-sm text-gray-600">{match.date} at {match.teeTime}</div>
        </div>
      </div>

      {/* Mobile-First Match Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg overflow-hidden">
        {/* Match Info Bar */}
        <div className="px-4 py-3 bg-black bg-opacity-20">
          <div className="flex items-center justify-between text-white text-sm">
            <span>{match.type} - {match.division} Division</span>
            <span>{match.session} Session • Tee {match.tee}</span>
          </div>
        </div>
        
        {/* Teams Display */}
        <div className="p-4 sm:p-6">
          {/* Mobile: Stacked Layout */}
          <div className="block sm:hidden space-y-4">
            {/* Team A */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
                  style={{ backgroundColor: teamA.color }}
                >
                  {teamA.logo}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-white text-lg">{teamA.name}</div>
                  <div className="text-green-100 text-sm truncate">{teamA.description}</div>
                  <div className="text-green-100 text-xs mt-1">
                    {teamAPlayers.length > 0 
                      ? teamAPlayers.map(p => `${p.name}${p.isPro ? ' (Pro)' : ''}${p.isJunior ? ' (Jnr)' : ''}`).join(', ')
                      : 'Players TBD'
                    }
                  </div>
                </div>
              </div>
            </div>
            
            {/* VS/3-WAY Divider */}
            <div className="text-center py-2">
              <div className="text-2xl font-bold text-white">{match.isThreeWay ? '3-WAY' : 'VS'}</div>
            </div>
            
            {/* Team B */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
                  style={{ backgroundColor: teamB.color }}
                >
                  {teamB.logo}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-white text-lg">{teamB.name}</div>
                  <div className="text-green-100 text-sm truncate">{teamB.description}</div>
                  <div className="text-green-100 text-xs mt-1">
                    {teamBPlayers.length > 0 
                      ? teamBPlayers.map(p => `${p.name}${p.isPro ? ' (Pro)' : ''}${p.isJunior ? ' (Jnr)' : ''}`).join(', ')
                      : 'Players TBD'
                    }
                  </div>
                </div>
              </div>
            </div>
            
            {/* Team C (for 3-way matches) */}
            {match.isThreeWay && teamC && (
              <>
                <div className="text-center py-2">
                  <div className="text-2xl font-bold text-white">VS</div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
                      style={{ backgroundColor: teamC.color }}
                    >
                      {teamC.logo}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-white text-lg">{teamC.name}</div>
                      <div className="text-green-100 text-sm truncate">{teamC.description}</div>
                      <div className="text-green-100 text-xs mt-1">
                        {match.teamCId && getMatchPlayers(match.teamCId, match.type === 'Singles' ? 1 : 2).length > 0 
                          ? getMatchPlayers(match.teamCId, match.type === 'Singles' ? 1 : 2).map(p => `${p.name}${p.isPro ? ' (Pro)' : ''}${p.isJunior ? ' (Jnr)' : ''}`).join(', ')
                          : 'Players TBD'
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
            
            {/* Status */}
            <div className="text-center pt-2 border-t border-green-500">
              <div className="text-green-200 text-sm">Status</div>
              <div className="text-white text-lg font-bold capitalize">{match.status}</div>
            </div>
          </div>
          
          {/* Desktop: Horizontal Layout */}
          <div className="hidden sm:flex sm:items-center sm:justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-4">
                <div 
                  className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
                  style={{ backgroundColor: teamA.color }}
                >
                  {teamA.logo}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-white text-xl">{teamA.name}</div>
                  <div className="text-green-100 text-sm truncate">{teamA.description}</div>
                  <div className="text-green-100 text-xs mt-1">
                    {teamAPlayers.length > 0 
                      ? teamAPlayers.map(p => `${p.name}${p.isPro ? ' (Pro)' : ''}${p.isJunior ? ' (Jnr)' : ''}`).join(', ')
                      : 'Players TBD'
                    }
                  </div>
                </div>
              </div>
              
              <div className="text-center px-6">
                <div className="text-3xl font-bold text-white">{match.isThreeWay ? '3-WAY' : 'VS'}</div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className={`${match.isThreeWay ? 'text-center' : 'text-right'} min-w-0`}>
                  <div className="font-bold text-white text-xl">{teamB.name}</div>
                  <div className="text-green-100 text-sm truncate">{teamB.description}</div>
                  <div className="text-green-100 text-xs mt-1">
                    {teamBPlayers.length > 0 
                      ? teamBPlayers.map(p => `${p.name}${p.isPro ? ' (Pro)' : ''}${p.isJunior ? ' (Jnr)' : ''}`).join(', ')
                      : 'Players TBD'
                    }
                  </div>
                </div>
                <div 
                  className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
                  style={{ backgroundColor: teamB.color }}
                >
                  {teamB.logo}
                </div>
              </div>
              
              {/* Team C (for 3-way matches) */}
              {match.isThreeWay && teamC && (
                <>
                  <div className="text-center px-6">
                    <div className="text-3xl font-bold text-white">VS</div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-center min-w-0">
                      <div className="font-bold text-white text-xl">{teamC.name}</div>
                      <div className="text-green-100 text-sm truncate">{teamC.description}</div>
                      <div className="text-green-100 text-xs mt-1">
                        {match.teamCId && getMatchPlayers(match.teamCId, match.type === 'Singles' ? 1 : 2).length > 0 
                          ? getMatchPlayers(match.teamCId, match.type === 'Singles' ? 1 : 2).map(p => `${p.name}${p.isPro ? ' (Pro)' : ''}${p.isJunior ? ' (Jnr)' : ''}`).join(', ')
                          : 'Players TBD'
                        }
                      </div>
                    </div>
                    <div 
                      className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
                      style={{ backgroundColor: teamC.color }}
                    >
                      {teamC.logo}
                    </div>
                  </div>
                </>
              )}
            </div>
            
            <div className="text-center ml-6">
              <div className="text-green-200 text-sm">Status</div>
              <div className="text-white text-xl font-bold capitalize">{match.status}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Professional Scorecard */}
      <LiveScorecard 
        match={match}
        teamA={teamA}
        teamB={teamB}
        teamC={teamC}
      />
    </div>
  );
}
