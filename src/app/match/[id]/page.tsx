'use client';

import { useTournament } from '@/context/TournamentContext';
import { Match, Hole } from '@/types';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import ScoreCard from '@/components/ScoreCard';
import Link from 'next/link';

export default function MatchDetail() {
  const params = useParams();
  const router = useRouter();
  const matchId = parseInt(params.id as string);
  
  const { 
    getMatchById, 
    getTeamById, 
    updateMatch, 
    updateScore 
  } = useTournament();

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

  const handleSaveMatch = (updatedMatch: Match) => {
    updateMatch(matchId, updatedMatch);
    
    // Update team scores based on match result
    const calculateMatchResult = (match: Match) => {
      let teamAWins = 0;
      let teamBWins = 0;
      let holesPlayed = 0;

      match.holes.forEach((hole: Hole) => {
        if (hole.teamAScore !== null && hole.teamBScore !== null) {
          holesPlayed++;
          if (hole.teamAScore < hole.teamBScore) {
            teamAWins++;
          } else if (hole.teamBScore < hole.teamAScore) {
            teamBWins++;
          }
        }
      });

      return { teamAWins, teamBWins, holesPlayed };
    };

    const result = calculateMatchResult(updatedMatch);
    
    // Update team A score
    const teamAScore = updateScore(teamA.id, {
      teamId: teamA.id,
      division: teamA.division,
      points: result.teamAWins > result.teamBWins ? 3 : result.teamAWins === result.teamBWins ? 1 : 0,
      matchesPlayed: 1,
      matchesWon: result.teamAWins > result.teamBWins ? 1 : 0,
      matchesLost: result.teamAWins < result.teamBWins ? 1 : 0,
      holesWon: result.teamAWins,
      holesLost: result.teamBWins
    });

    // Update team B score
    const teamBScore = updateScore(teamB.id, {
      teamId: teamB.id,
      division: teamB.division,
      points: result.teamBWins > result.teamAWins ? 3 : result.teamBWins === result.teamAWins ? 1 : 0,
      matchesPlayed: 1,
      matchesWon: result.teamBWins > result.teamAWins ? 1 : 0,
      matchesLost: result.teamBWins < result.teamAWins ? 1 : 0,
      holesWon: result.teamBWins,
      holesLost: result.teamAWins
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/live"
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Live Scoring</span>
          </Link>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600">Match #{match.id}</div>
          <div className="text-sm text-gray-600">{match.date} at {match.teeTime}</div>
        </div>
      </div>

      {/* Match Info Banner */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-4">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold"
                style={{ backgroundColor: teamA.color }}
              >
                {teamA.logo}
              </div>
              <div>
                <div className="font-bold text-lg">{teamA.name}</div>
                <div className="text-sm opacity-90">{teamA.description}</div>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold">vs</div>
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

      {/* Score Card */}
      <ScoreCard 
        match={match}
        teamA={teamA}
        teamB={teamB}
        onSave={handleSaveMatch}
      />

      {/* Instructions */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Scoring Instructions</h3>
        <div className="space-y-2 text-sm text-blue-800">
          <p>• Click &quot;Edit&quot; on any hole to enter scores for both teams</p>
          <p>• Enter the number of strokes for each team on each hole</p>
          <p>• The team with fewer strokes wins the hole</p>
          <p>• Match status updates automatically as you save scores</p>
          <p>• All changes are saved to local storage</p>
        </div>
      </div>
    </div>
  );
} 