'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTournament } from '@/context/TournamentContextSwitcher';
import { supabase } from '@/lib/supabase';
import { Score, Team } from '@/types';
import ScoreEditModal from '@/components/admin/ScoreEditModal';
import RoleGuard from '@/components/admin/RoleGuard';
import { 
  Trophy, 
  Medal, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  RefreshCw,
  Download,
  Settings,
  Edit,
  Calculator
} from 'lucide-react';

export default function AdminLeaderboardPage() {
  const { user } = useAuth();
  const { teams, scores, getTeamById } = useTournament();
  const [selectedDivision, setSelectedDivision] = useState<'Trophy' | 'Shield' | 'Plaque' | 'Bowl' | 'Mug'>('Trophy');
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [editingScore, setEditingScore] = useState<Score | null>(null);

  const getDivisionScores = () => {
    return scores
      .filter(score => score.division === selectedDivision)
      .sort((a, b) => {
        // Sort by points (descending), then by matches played (ascending), then by holes won (descending)
        if (b.points !== a.points) return b.points - a.points;
        if (a.matchesPlayed !== b.matchesPlayed) return a.matchesPlayed - b.matchesPlayed;
        return b.holesWon - a.holesWon;
      });
  };

  const recalculateLeaderboard = async () => {
    setIsRecalculating(true);
    try {
      console.log('Recalculating leaderboard from completed matches...');
      
      // Get all completed matches with their holes data
      const { data: completedMatches, error: matchError } = await supabase
        .from('matches')
        .select(`
          *,
          holes (*)
        `)
        .eq('status', 'completed');

      if (matchError) throw matchError;

      // Calculate scores for each team
      const teamStats: Record<number, {
        points: number;
        matchesPlayed: number;
        matchesWon: number;
        matchesLost: number;
        matchesHalved: number;
        holesWon: number;
        holesLost: number;
        totalStrokes: number;
      }> = {};

      // Initialize stats for all teams
      teams.forEach(team => {
        teamStats[team.id] = {
          points: 0,
          matchesPlayed: 0,
          matchesWon: 0,
          matchesLost: 0,
          matchesHalved: 0,
          holesWon: 0,
          holesLost: 0,
          totalStrokes: 0
        };
      });

      // Process each completed match
      completedMatches?.forEach(match => {
        if (match.team_a_id && match.team_b_id && !match.is_bye) {
          const teamAStats = teamStats[match.team_a_id];
          const teamBStats = teamStats[match.team_b_id];

          if (teamAStats && teamBStats) {
            teamAStats.matchesPlayed++;
            teamBStats.matchesPlayed++;

            // Calculate hole results
            let teamAHolesWon = 0;
            let teamBHolesWon = 0;

            match.holes?.forEach((hole: any) => {
              const teamAStrokes = hole.team_a_strokes;
              const teamBStrokes = hole.team_b_strokes;

              // Only count holes where both teams have valid scores
              if (teamAStrokes !== null && teamAStrokes !== undefined && 
                  teamBStrokes !== null && teamBStrokes !== undefined) {
                teamAStats.totalStrokes += teamAStrokes;
                teamBStats.totalStrokes += teamBStrokes;

                if (teamAStrokes < teamBStrokes) {
                  teamAHolesWon++;
                } else if (teamBStrokes < teamAStrokes) {
                  teamBHolesWon++;
                }
              }
            });

            teamAStats.holesWon += teamAHolesWon;
            teamAStats.holesLost += teamBHolesWon;
            teamBStats.holesWon += teamBHolesWon;
            teamBStats.holesLost += teamAHolesWon;

            // Determine match winner
            if (teamAHolesWon > teamBHolesWon) {
              teamAStats.matchesWon++;
              teamAStats.points += 1;
              teamBStats.matchesLost++;
            } else if (teamBHolesWon > teamAHolesWon) {
              teamBStats.matchesWon++;
              teamBStats.points += 1;
              teamAStats.matchesLost++;
            } else {
              teamAStats.matchesHalved++;
              teamBStats.matchesHalved++;
              teamAStats.points += 0.5;
              teamBStats.points += 0.5;
            }
          }
        }
      });

      // Update scores in database
      const updates = Object.entries(teamStats).map(([teamId, stats]) => ({
        team_id: parseInt(teamId),
        points: stats.points,
        matches_played: stats.matchesPlayed,
        matches_won: stats.matchesWon,
        matches_lost: stats.matchesLost,
        matches_halved: stats.matchesHalved,
        holes_won: stats.holesWon,
        holes_lost: stats.holesLost,
        total_strokes: stats.totalStrokes,
        strokes_differential: stats.holesWon - stats.holesLost,
        last_updated: new Date().toISOString()
      }));

      // Batch update scores
      for (const update of updates) {
        await supabase
          .from('scores')
          .update(update)
          .eq('team_id', update.team_id);
      }

      console.log('Leaderboard recalculated successfully');
      alert('Leaderboard has been recalculated based on completed matches!');
    } catch (error) {
      console.error('Error recalculating leaderboard:', error);
      alert('Failed to recalculate leaderboard. Please try again.');
    } finally {
      setIsRecalculating(false);
    }
  };

  const updateTeamScore = async (teamId: number, updatedScore: Partial<Score>) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('scores')
        .update({
          ...updatedScore,
          last_updated: new Date().toISOString()
        })
        .eq('team_id', teamId);

      if (error) throw error;

      console.log(`Team ${teamId} score updated`);
    } catch (error) {
      console.error('Error updating team score:', error);
      alert('Failed to update team score');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditScore = (score: Score) => {
    setEditingScore(score);
    setShowScoreModal(true);
  };

  const handleSaveScore = (score: Score) => {
    // The real-time subscription will handle updating the UI
    console.log('Score saved:', score);
  };

  const getPositionIcon = (change: string) => {
    switch (change) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getDivisionIcon = (division: string) => {
    const iconClass = "w-5 h-5";
    switch (division) {
      case 'Trophy':
        return <Trophy className={`${iconClass} text-yellow-500`} />;
      case 'Shield':
        return <Medal className={`${iconClass} text-gray-400`} />;
      case 'Plaque':
        return <Medal className={`${iconClass} text-amber-600`} />;
      case 'Bowl':
        return <Medal className={`${iconClass} text-orange-500`} />;
      case 'Mug':
        return <Medal className={`${iconClass} text-purple-500`} />;
      default:
        return <Medal className={`${iconClass} text-gray-400`} />;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You must be logged in to access this page.</p>
        </div>
      </div>
    );
  }

  const divisionScores = getDivisionScores();

  return (
    <RoleGuard adminOnly>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Leaderboard Management</h1>
              <p className="mt-2 text-gray-600 text-sm sm:text-base">
                Manage tournament standings, scores, and position tracking
              </p>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={recalculateLeaderboard}
                disabled={isRecalculating}
                className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRecalculating ? 'animate-spin' : ''}`} />
                {isRecalculating ? 'Recalculating...' : 'Recalculate'}
              </button>
              <button className="inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Division Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="px-6 py-4 bg-gradient-to-r from-green-600 to-green-700">
            <h2 className="text-xl font-bold text-white flex items-center">
              <Trophy className="w-5 h-5 mr-2" />
              Tournament Leaderboard
            </h2>
          </div>
          <div className="p-6">
            {/* Division Tabs */}
            <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
              {(['Trophy', 'Shield', 'Plaque', 'Bowl', 'Mug'] as const).map((division) => (
                <button
                  key={division}
                  onClick={() => setSelectedDivision(division)}
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    selectedDivision === division
                      ? 'bg-white text-green-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-1">
                    {getDivisionIcon(division)}
                    <span className="truncate">{division}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Leaderboard Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Position</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Team</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-600">Points</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-600">Played</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-600">Wins</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-600">Loss</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-600">Tied</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-600">Holes +/-</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {divisionScores.map((score, index) => {
                    const team = getTeamById(score.teamId);
                    const position = index + 1;
                    
                    return (
                      <tr key={score.teamId} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg font-bold text-gray-900">#{position}</span>
                            {getPositionIcon(score.positionChange || 'same')}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            {getDivisionIcon(score.division)}
                            <div>
                              <div className="font-medium text-gray-900">{team?.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="text-xl font-bold text-green-600">
                            {score.points.toFixed(1)}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center text-gray-900">
                          {score.matchesPlayed}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            {score.matchesWon}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            {score.matchesLost}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                            {score.matchesHalved}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="text-sm">
                            <div className="text-green-600">+{score.holesWon}</div>
                            <div className="text-red-600">-{score.holesLost}</div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <button
                            onClick={() => handleEditScore(score)}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium text-indigo-700 bg-indigo-100 rounded hover:bg-indigo-200"
                            title="Edit Score"
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {divisionScores.length === 0 && (
              <div className="text-center py-12">
                <Trophy className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No scores available</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Scores will appear here once matches are completed.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Division Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Trophy className="w-8 h-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Points</p>
                <p className="text-2xl font-bold text-gray-900">
                  {divisionScores.reduce((sum, score) => sum + score.points, 0).toFixed(1)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Calculator className="w-8 h-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Matches Played</p>
                <p className="text-2xl font-bold text-gray-900">
                  {divisionScores.reduce((sum, score) => sum + score.matchesPlayed, 0)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Wins</p>
                <p className="text-2xl font-bold text-gray-900">
                  {divisionScores.reduce((sum, score) => sum + score.matchesWon, 0)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Medal className="w-8 h-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Teams</p>
                <p className="text-2xl font-bold text-gray-900">
                  {divisionScores.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Score Edit Modal */}
        <ScoreEditModal
          score={editingScore}
          isOpen={showScoreModal}
          onClose={() => {
            setShowScoreModal(false);
            setEditingScore(null);
          }}
          onSave={handleSaveScore}
        />
        </div>
      </div>
    </RoleGuard>
  );
}
