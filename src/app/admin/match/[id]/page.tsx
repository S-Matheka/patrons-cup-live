'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTournament } from '@/context/TournamentContext';
import { Match } from '@/types';
import { ArrowLeft, AlertCircle, Shield, Lock, Clock, Play, CheckCircle } from 'lucide-react';
import ScoreCard from '@/components/ScoreCard';
import LiveScorecard from '@/components/LiveScorecard';
import { canScoreMatch } from '@/utils/matchTiming';
import Link from 'next/link';

export default function AdminMatchDetail() {
  const params = useParams();
  const router = useRouter();
  const matchId = parseInt(params.id as string);
  const { isAuthenticated, isOfficial, isAdmin } = useAuth();
  
  const { 
    getMatchById, 
    getTeamById, 
    updateMatch 
  } = useTournament();

  const [isLoading, setIsLoading] = useState(true);
  const [isStartingMatch, setIsStartingMatch] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !isOfficial) {
      router.push('/admin/login');
      return;
    }
    setIsLoading(false);
  }, [isAuthenticated, isOfficial, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isOfficial) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <Lock className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-gray-600 mb-6">This scoring interface is only available to tournament officials.</p>
          <Link
            href="/admin/login"
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <Shield className="w-4 h-4 mr-2" />
            Official Login
          </Link>
        </div>
      </div>
    );
  }

  const match = getMatchById(matchId);
  
  if (!match) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center py-4">
              <Link
                href="/admin/scoring"
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Scoring</span>
              </Link>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Match Not Found</h2>
            <p className="text-gray-600 mb-6">The requested match could not be found.</p>
            <Link
              href="/admin/scoring"
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Scoring
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const teamA = getTeamById(match.teamAId);
  const teamB = getTeamById(match.teamBId);

  if (!teamA || !teamB) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center py-4">
              <Link
                href="/admin/scoring"
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Scoring</span>
              </Link>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Team Information Missing</h2>
            <p className="text-gray-600 mb-6">Team information could not be loaded.</p>
            <Link
              href="/admin/scoring"
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Scoring
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleSaveMatch = (updatedMatch: Match) => {
    updateMatch(matchId, updatedMatch);
  };

  const handleStartMatch = async () => {
    if (!isAdmin || isStartingMatch) return;
    
    setIsStartingMatch(true);
    try {
      const updatedMatch = {
        ...match,
        status: 'in-progress'
      };
      
      await updateMatch(matchId, updatedMatch);
    } catch (error) {
      console.error('Failed to start match:', error);
    } finally {
      setIsStartingMatch(false);
    }
  };

  // Get match timing information
  const timingInfo = canScoreMatch(
    match.status,
    match.date,
    match.teeTime,
    isAdmin
  );

  const getStatusIcon = () => {
    switch (match.status) {
      case 'scheduled':
        return <Clock className="w-5 h-5" />;
      case 'in-progress':
        return <Play className="w-5 h-5" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const getStatusColor = () => {
    switch (match.status) {
      case 'scheduled':
        return timingInfo.isOverdue ? 'text-red-600' : 'text-yellow-600';
      case 'in-progress':
        return 'text-green-600';
      case 'completed':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link
                href="/admin/scoring"
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Scoring</span>
              </Link>
            </div>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2 text-green-600">
                <Shield className="w-5 h-5" />
                <span className="text-sm font-medium">Official Access</span>
              </div>
              
              {/* Match Status */}
              <div className={`flex items-center space-x-2 ${getStatusColor()}`}>
                {getStatusIcon()}
                <span className="text-sm font-medium capitalize">
                  {match.status.replace('-', ' ')}
                  {timingInfo.isOverdue && ' (Overdue)'}
                </span>
              </div>
              
              {/* Start Match Button */}
              {isAdmin && match.status === 'scheduled' && !timingInfo.canScore && (
                <button
                  onClick={handleStartMatch}
                  disabled={isStartingMatch}
                  className="inline-flex items-center px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {isStartingMatch ? (
                    <>
                      <Clock className="w-4 h-4 mr-1 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-1" />
                      Start Early
                    </>
                  )}
                </button>
              )}
              
              <div className="text-right">
                <div className="text-sm text-gray-600">Match #{match.id}</div>
                <div className="text-sm text-gray-600">{match.date} at {match.teeTime}</div>
                {!timingInfo.canScore && timingInfo.timeUntilStart && (
                  <div className="text-xs text-gray-500">Starts in {timingInfo.timeUntilStart}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Match Info Banner */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-6 text-white mb-8">
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
            
            <div className="text-right">
              <div className="text-sm opacity-75">Game #{match.gameNumber}</div>
              <div className="font-medium">{match.type} • {match.division}</div>
              <div className="text-sm opacity-90">{match.session} Session</div>
            </div>
          </div>
        </div>

        {/* Live Scorecard (Read-only view) */}
        <div className="mb-8">
          <LiveScorecard match={match} teamA={teamA} teamB={teamB} />
        </div>

        {/* Official Scoring Interface */}
        <div className="bg-white rounded-lg shadow-lg">
          <div className="px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 rounded-t-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Tournament Official Scoring Interface
              </h2>
              <div className="text-red-100 text-sm">
                🔒 Authorized Personnel Only
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                <div className="text-sm text-yellow-800">
                  <strong>Official Use Only:</strong> This interface is for authorized tournament officials to input and update match scores. 
                  All changes are logged and tracked.
                </div>
              </div>
            </div>
            
            <ScoreCard 
              match={match} 
              teamA={teamA} 
              teamB={teamB} 
              onSave={handleSaveMatch}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
