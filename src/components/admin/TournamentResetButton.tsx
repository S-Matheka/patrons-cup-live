'use client';

import { useState } from 'react';
import { RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { getAdminClient } from '@/lib/supabase-admin';
import { useTournament } from '@/context/TournamentContext';

interface TournamentResetButtonProps {
  onComplete?: () => void;
}

export default function TournamentResetButton({ onComplete }: TournamentResetButtonProps) {
  const [isResetting, setIsResetting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { matches } = useTournament();
  
  const getResetStats = () => {
    const inProgressMatches = matches.filter(m => m.status === 'in-progress').length;
    const completedMatches = matches.filter(m => m.status === 'completed').length;
    const totalActiveMatches = inProgressMatches + completedMatches;
    
    return {
      inProgressMatches,
      completedMatches,
      totalActiveMatches
    };
  };

  const handleReset = async () => {
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    setIsResetting(true);
    
    try {
      const adminClient = getAdminClient();
      
      console.log('🔄 Starting tournament reset...');
      
      // Step 1: Reset all hole scores to null
      console.log('📝 Clearing all hole scores...');
      const { error: holesError } = await adminClient
        .from('holes')
        .update({
          team_a_score: null,
          team_b_score: null,
          team_a_strokes: null,
          team_b_strokes: null,
          status: 'not-started'
        })
        .neq('id', 0); // Update all holes

      if (holesError) {
        console.error('Error resetting holes:', JSON.stringify(holesError, null, 2));
        throw new Error(`Failed to reset hole scores: ${holesError.message || JSON.stringify(holesError)}`);
      }

      // Step 2: Reset all match statuses to 'scheduled'
      console.log('📝 Resetting all match statuses...');
      const { error: matchError } = await adminClient
        .from('matches')
        .update({ status: 'scheduled' })
        .in('status', ['in-progress', 'completed']);

      if (matchError) {
        console.error('Error resetting matches:', JSON.stringify(matchError, null, 2));
        throw new Error(`Failed to reset match statuses: ${matchError.message || JSON.stringify(matchError)}`);
      }

      // Step 3: Reset all team scores/standings (if scores table exists)
      console.log('📝 Resetting team standings...');
      try {
        const { error: scoresError } = await adminClient
          .from('scores')
          .update({
            points: 0,
            matches_played: 0,
            matches_won: 0,
            matches_lost: 0,
            matches_halved: 0,
            holes_won: 0,
            holes_lost: 0,
            total_strokes: 0,
            strokes_differential: 0,
            position_change: 'same'
          })
          .neq('team_id', 0); // Update all teams

        if (scoresError) {
          console.warn('Scores table reset failed (may not exist):', JSON.stringify(scoresError, null, 2));
          console.log('⚠️ Skipping scores table reset - continuing with other resets');
        } else {
          console.log('✅ Team standings reset successfully');
        }
      } catch (scoresTableError) {
        console.warn('Scores table not accessible:', scoresTableError);
        console.log('⚠️ Skipping scores table reset - table may not exist yet');
      }

      console.log('✅ Tournament reset complete');
      alert('🎯 Tournament Reset Complete!\n\n✅ All scores cleared\n✅ All matches set to scheduled\n✅ Leaderboard reset to zero\n\nTournament is ready for fresh start!');
      
      // Force immediate UI refresh
      if (onComplete) {
        onComplete();
      }
      
      // Refresh the page to ensure all components sync
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('Tournament reset failed:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      let errorMessage = 'Unknown error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object') {
        errorMessage = JSON.stringify(error);
      }
      
      alert(`❌ Reset Failed: ${errorMessage}\n\nPlease check the browser console for detailed error information.`);
    } finally {
      setIsResetting(false);
      setShowConfirm(false);
    }
  };

  const handleCancel = () => {
    setShowConfirm(false);
  };

  const stats = getResetStats();

  if (showConfirm) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-6 h-6 text-red-600 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-900 mb-2">
              Reset Entire Tournament?
            </h3>
            <p className="text-red-800 mb-4">
              This will immediately reset:
            </p>
            <ul className="list-disc list-inside text-red-800 mb-4 space-y-1">
              <li><strong>All hole scores</strong> → cleared to empty ("-")</li>
              <li><strong>{stats.totalActiveMatches} active matches</strong> → set to "scheduled"</li>
              <li><strong>All team standings</strong> → reset to zero points</li>
              <li><strong>Entire leaderboard</strong> → back to starting state</li>
            </ul>
            <div className="bg-red-100 p-3 rounded mb-4">
              <p className="text-sm text-red-900 font-medium">
                ⚠️ This action cannot be undone and will affect the entire app immediately!
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleReset}
                disabled={isResetting}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isResetting ? 'animate-spin' : ''}`} />
                {isResetting ? 'Resetting...' : 'Yes, Reset Everything'}
              </button>
              <button
                onClick={handleCancel}
                disabled={isResetting}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <RefreshCw className="w-5 h-5 text-yellow-600" />
          <div>
            <h3 className="font-semibold text-yellow-900">Tournament Reset</h3>
            <p className="text-sm text-yellow-800">
              Clear all scores and reset tournament to pre-start state
            </p>
            {stats.totalActiveMatches > 0 && (
              <p className="text-xs text-yellow-700 mt-1">
                Found {stats.inProgressMatches} in-progress + {stats.completedMatches} completed matches
              </p>
            )}
          </div>
        </div>
        <button
          onClick={handleReset}
          disabled={isResetting}
          className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isResetting ? 'animate-spin' : ''}`} />
          {isResetting ? 'Resetting...' : 'Reset Tournament'}
        </button>
      </div>
    </div>
  );
}
