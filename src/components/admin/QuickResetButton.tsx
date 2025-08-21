'use client';

import { useState } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { getAdminClient } from '@/lib/supabase-admin';

interface QuickResetButtonProps {
  onComplete?: () => void;
}

export default function QuickResetButton({ onComplete }: QuickResetButtonProps) {
  const [isResetting, setIsResetting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleReset = async () => {
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    setIsResetting(true);
    
    try {
      const adminClient = getAdminClient();
      
      console.log('🔄 Starting quick tournament reset...');
      
      // Step 1: Reset all hole scores to null (most important)
      console.log('📝 Clearing all hole scores...');
      const { error: holesError, count: holesUpdated } = await adminClient
        .from('holes')
        .update({
          team_a_score: null,
          team_b_score: null,
          status: 'not-started'
        })
        .not('team_a_score', 'is', null); // Only update holes that have scores

      if (holesError) {
        console.error('Error resetting holes:', holesError);
        throw new Error(`Failed to reset hole scores: ${holesError.message}`);
      }

      console.log(`✅ Reset ${holesUpdated || 0} hole scores`);

      // Step 2: Reset match statuses to 'scheduled'
      console.log('📝 Resetting match statuses...');
      const { error: matchError, count: matchesUpdated } = await adminClient
        .from('matches')
        .update({ status: 'scheduled' })
        .in('status', ['in-progress', 'completed']);

      if (matchError) {
        console.error('Error resetting matches:', matchError);
        throw new Error(`Failed to reset match statuses: ${matchError.message}`);
      }

      console.log(`✅ Reset ${matchesUpdated || 0} match statuses`);

      console.log('✅ Quick tournament reset complete');
      
      const message = `🎯 Quick Reset Complete!\n\n✅ ${holesUpdated || 0} hole scores cleared\n✅ ${matchesUpdated || 0} matches reset to scheduled\n\nTournament is ready for fresh start!`;
      alert(message);
      
      // Force immediate UI refresh
      if (onComplete) {
        onComplete();
      }
      
      // Refresh the page to ensure all components sync
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('Quick reset failed:', error);
      
      let errorMessage = 'Unknown error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      alert(`❌ Quick Reset Failed: ${errorMessage}\n\nPlease check the browser console for details.`);
    } finally {
      setIsResetting(false);
      setShowConfirm(false);
    }
  };

  const handleCancel = () => {
    setShowConfirm(false);
  };

  if (showConfirm) {
    return (
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-6 h-6 text-orange-600 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-orange-900 mb-2">
              Quick Reset Tournament?
            </h3>
            <p className="text-orange-800 mb-4">
              This will immediately:
            </p>
            <ul className="list-disc list-inside text-orange-800 mb-4 space-y-1">
              <li><strong>Clear all hole scores</strong> → back to empty ("-")</li>
              <li><strong>Reset active matches</strong> → set to "scheduled"</li>
            </ul>
            <div className="bg-orange-100 p-3 rounded mb-4">
              <p className="text-sm text-orange-900 font-medium">
                ⚠️ This is a simplified reset that focuses on scores and match status only.
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleReset}
                disabled={isResetting}
                className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isResetting ? 'animate-spin' : ''}`} />
                {isResetting ? 'Resetting...' : 'Yes, Quick Reset'}
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
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <RefreshCw className="w-5 h-5 text-orange-600" />
          <div>
            <h3 className="font-semibold text-orange-900">Quick Reset</h3>
            <p className="text-sm text-orange-800">
              Clear scores and reset matches only (simplified)
            </p>
          </div>
        </div>
        <button
          onClick={handleReset}
          disabled={isResetting}
          className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isResetting ? 'animate-spin' : ''}`} />
          {isResetting ? 'Resetting...' : 'Quick Reset'}
        </button>
      </div>
    </div>
  );
}
