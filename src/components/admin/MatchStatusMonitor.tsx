'use client';

import { useState, useEffect } from 'react';
import { matchStatusManager } from '@/utils/matchStatusManager';
import { useTournament } from '@/context/TournamentContextSwitcher';
import { supabase } from '@/lib/supabase';
import { Play, Pause, RotateCcw, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { getCurrentEAT, parseTeeTimeEAT } from '@/utils/timezone';

export default function MatchStatusMonitor() {
  const { matches, getTeamById } = useTournament();
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [upcomingMatches, setUpcomingMatches] = useState<any[]>([]);
  const [liveMatches, setLiveMatches] = useState<any[]>([]);

  useEffect(() => {
    // Check monitoring status
    const status = matchStatusManager.getStatus();
    setIsMonitoring(status.isRunning);
    
    // Get upcoming and live matches
    updateMatchLists();
    
    // Update every minute
    const interval = setInterval(updateMatchLists, 60 * 1000);
    
    return () => clearInterval(interval);
  }, [matches]);

  const updateMatchLists = () => {
    // Get current time in EAT (Nairobi, Kenya - UTC+3)
    const currentTime = getCurrentEAT();
    
    const scheduled = matches.filter(match => 
      match.status === 'scheduled' && !match.isBye
    ).map(match => {
      const teeDateTime = parseTeeTimeEAT(match.date, match.teeTime);
      
      if (!teeDateTime) {
        return {
          ...match,
          teeDateTime: new Date(),
          minutesUntilTee: 0,
          shouldBeLive: false
        };
      }
      
      return {
        ...match,
        teeDateTime,
        minutesUntilTee: Math.round((teeDateTime.getTime() - currentTime.getTime()) / (1000 * 60)),
        shouldBeLive: currentTime >= teeDateTime
      };
    }).sort((a, b) => a.teeDateTime.getTime() - b.teeDateTime.getTime());
    
    const live = matches.filter(match => match.status === 'in-progress');
    
    setUpcomingMatches(scheduled);
    setLiveMatches(live);
  };

  const handleStartMonitoring = () => {
    matchStatusManager.startMonitoring();
    setIsMonitoring(true);
  };

  const handleStopMonitoring = async () => {
    try {
      // Stop the automatic monitoring
      matchStatusManager.stopMonitoring();
      setIsMonitoring(false);
      
      // Reset all in-progress matches back to scheduled
      const inProgressMatches = matches.filter(match => match.status === 'in-progress');
      
      if (inProgressMatches.length > 0) {
        console.log(`Resetting ${inProgressMatches.length} in-progress matches to scheduled...`);
        
        const { error } = await supabase
          .from('matches')
          .update({ status: 'scheduled' })
          .eq('status', 'in-progress');
        
        if (error) {
          console.error('Error resetting matches:', error);
          alert('Failed to reset some matches. Please refresh and try again.');
        } else {
          console.log('All in-progress matches reset to scheduled');
          // Force immediate UI update
          updateMatchLists();
        }
      }
    } catch (error) {
      console.error('Error stopping monitoring:', error);
      alert('Error stopping monitoring. Please try again.');
    }
  };

  const handleManualTransition = async (matchId: number) => {
    const success = await matchStatusManager.transitionMatchToLive(matchId);
    if (success) {
      updateMatchLists();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getMinutesDisplay = (minutes: number) => {
    if (minutes < 0) return `${Math.abs(minutes)}m overdue`;
    if (minutes === 0) return 'Now';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Clock className="w-6 h-6 mr-2 text-blue-600" />
            Match Status Monitor
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Automatically transitions matches from scheduled to live based on tee times
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            isMonitoring 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {isMonitoring ? (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                Active
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-gray-400 rounded-full mr-2" />
                Inactive
              </>
            )}
          </div>
          
          {isMonitoring ? (
            <button
              onClick={handleStopMonitoring}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Pause className="w-4 h-4 mr-2" />
              Stop
            </button>
          ) : (
            <button
              onClick={handleStartMonitoring}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Play className="w-4 h-4 mr-2" />
              Start
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Matches */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-orange-600" />
            Upcoming Matches ({upcomingMatches.length})
          </h3>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {upcomingMatches.slice(0, 10).map((match) => {
              const teamA = getTeamById(match.teamAId || 0);
              const teamB = getTeamById(match.teamBId || 0);
              
              return (
                <div
                  key={match.id}
                  className={`p-4 rounded-lg border ${
                    match.shouldBeLive 
                      ? 'border-red-200 bg-red-50' 
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          Game {match.gameNumber}
                        </span>
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                          {match.division}
                        </span>
                        <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded">
                          {match.type}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-700 mb-2">
                        {teamA?.name} vs {teamB?.name}
                      </div>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>{formatDate(match.teeDateTime)} {match.teeTime}</span>
                        <span>Tee {match.tee}</span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`text-sm font-medium mb-2 ${
                        match.shouldBeLive ? 'text-red-600' : 'text-gray-700'
                      }`}>
                        {match.shouldBeLive ? (
                          <div className="flex items-center">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            Overdue
                          </div>
                        ) : (
                          getMinutesDisplay(match.minutesUntilTee)
                        )}
                      </div>
                      
                      {match.shouldBeLive && (
                        <button
                          onClick={() => handleManualTransition(match.id)}
                          className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                          Start Now
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {upcomingMatches.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No upcoming scheduled matches</p>
              </div>
            )}
          </div>
        </div>

        {/* Live Matches */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
            Live Matches ({liveMatches.length})
          </h3>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {liveMatches.map((match) => {
              const teamA = getTeamById(match.teamAId || 0);
              const teamB = getTeamById(match.teamBId || 0);
              
              return (
                <div
                  key={match.id}
                  className="p-4 rounded-lg border border-green-200 bg-green-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          Game {match.gameNumber}
                        </span>
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                          {match.division}
                        </span>
                        <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded">
                          {match.type}
                        </span>
                        <div className="flex items-center text-xs text-green-600 font-medium">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse" />
                          LIVE
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-700 mb-2">
                        {teamA?.name} vs {teamB?.name}
                      </div>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>{formatDate(new Date(match.date))} {match.teeTime}</span>
                        <span>Tee {match.tee}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {liveMatches.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No matches currently live</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          <p className="mb-2">
            <strong>How it works:</strong> The system checks every minute for scheduled matches where the tee time has been reached. 
            When a match's tee time arrives, it automatically transitions from "scheduled" to "in-progress" status.
          </p>
          <p>
            <strong>Timezone:</strong> All times are displayed in East Africa Time (EAT, UTC+3).
            <strong className="ml-4">Current time:</strong> {formatTime(new Date(Date.now() + (3 * 60 * 60 * 1000)))}
          </p>
        </div>
      </div>
    </div>
  );
}
