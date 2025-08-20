'use client';

import { useTournament } from '@/context/TournamentContext';
import { useParams } from 'next/navigation';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import LiveScorecard from '@/components/LiveScorecard';
import Link from 'next/link';

export default function MatchDetail() {
  const params = useParams();
  const matchId = parseInt(params.id as string);
  
  const { getMatchById, getTeamById } = useTournament();

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

  const teamA = getTeamById(match.teamAId);
  const teamB = getTeamById(match.teamBId);

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
    <div className="space-y-6 px-4 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <Link
            href="/live"
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm sm:text-base">Back to Live Scoring</span>
          </Link>
        </div>
        <div className="text-left sm:text-right">
          <div className="text-sm text-gray-600">Match #{match.id}</div>
          <div className="text-sm text-gray-600">{match.date} at {match.teeTime}</div>
        </div>
      </div>

      {/* Match Info Banner */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-4 sm:p-6 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div 
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white text-lg sm:text-xl font-bold flex-shrink-0"
                style={{ backgroundColor: teamA.color }}
              >
                {teamA.logo}
              </div>
              <div className="min-w-0">
                <div className="font-bold text-base sm:text-lg truncate">{teamA.name}</div>
                <div className="text-xs sm:text-sm opacity-90 truncate">{teamA.description}</div>
              </div>
            </div>
            
            <div className="text-center sm:text-left lg:text-center">
              <div className="text-xl sm:text-2xl font-bold">vs</div>
              <div className="text-sm opacity-90">{match.course}</div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="font-bold text-lg">{teamB.name}</div>
                <div className="text-sm opacity-90">{teamB.description}</div>
              </div>
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold"
                style={{ backgroundColor: teamB.color }}
              >
                {teamB.logo}
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-sm opacity-90">Status</div>
            <div className="text-lg font-bold capitalize">{match.status}</div>
          </div>
        </div>
      </div>

      {/* Live Professional Scorecard */}
      <LiveScorecard 
        match={match}
        teamA={teamA}
        teamB={teamB}
      />
    </div>
  );
}
