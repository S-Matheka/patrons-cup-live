import { supabase } from '@/lib/supabase';
import { getCurrentEAT, parseTeeTimeEAT, formatEATDateTime } from './timezone';
import { Match } from '@/types';

/**
 * Utility to automatically manage match status transitions based on tee times
 */
export class MatchStatusManager {
  private static instance: MatchStatusManager;
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  static getInstance(): MatchStatusManager {
    if (!MatchStatusManager.instance) {
      MatchStatusManager.instance = new MatchStatusManager();
    }
    return MatchStatusManager.instance;
  }

  /**
   * Start monitoring match status transitions
   * Checks every minute for matches that should transition from scheduled to in-progress
   */
  startMonitoring() {
    if (this.isRunning) return;
    
    console.log('🔄 Starting automatic match status monitoring...');
    this.isRunning = true;
    
    // Run immediately on start
    this.checkAndUpdateMatchStatuses();
    
    // Then check every minute (60 seconds)
    this.intervalId = setInterval(() => {
      this.checkAndUpdateMatchStatuses();
    }, 60 * 1000);
  }

  /**
   * Stop monitoring match status transitions
   */
  stopMonitoring() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('⏹️ Stopped automatic match status monitoring');
  }

  /**
   * Check all scheduled matches and transition to in-progress if tee time has been reached
   */
  private async checkAndUpdateMatchStatuses() {
    try {
      if (!supabase) return;

      // Get current time in Nairobi timezone (EAT - UTC+3)
      const currentTime = getCurrentEAT();
      
      console.log(`🕐 Checking match statuses at ${formatEATDateTime(currentTime)}`);

      // Get all scheduled matches
      const { data: scheduledMatches, error } = await supabase
        .from('matches')
        .select('*')
        .eq('status', 'scheduled')
        .not('is_bye', 'eq', true); // Exclude BYE matches

      if (error) {
        console.error('Error fetching scheduled matches:', error);
        return;
      }

      if (!scheduledMatches || scheduledMatches.length === 0) {
        console.log('📋 No scheduled matches found');
        return;
      }

      console.log(`📋 Found ${scheduledMatches.length} scheduled matches to check`);

      const matchesToUpdate: number[] = [];

      for (const match of scheduledMatches) {
        const shouldTransition = this.shouldTransitionToLive(match, currentTime);
        
        if (shouldTransition) {
          matchesToUpdate.push(match.id);
          console.log(`🏌️‍♂️ Match ${match.game_number} (${match.division}) should transition to live`);
        }
      }

      // Update matches that should transition to live
      if (matchesToUpdate.length > 0) {
        await this.updateMatchesToLive(matchesToUpdate);
      } else {
        console.log('⏳ No matches ready to transition to live status');
      }

    } catch (error) {
      console.error('❌ Error in checkAndUpdateMatchStatuses:', error);
    }
  }

  /**
   * Determine if a match should transition from scheduled to in-progress
   */
  private shouldTransitionToLive(match: any, currentTime: Date): boolean {
    try {
      // Parse tee time using EAT timezone utility
      const matchDateTime = parseTeeTimeEAT(match.match_date, match.tee_time);
      
      if (!matchDateTime) {
        console.error(`❌ Could not parse tee time for match ${match.game_number}`);
        return false;
      }
      
      // Transition to live if current EAT time >= tee time
      const shouldTransition = currentTime >= matchDateTime;
      
      if (shouldTransition) {
        console.log(`✅ Match ${match.game_number}: Tee time ${match.tee_time} on ${match.match_date} has arrived (EAT)`);
      }
      
      return shouldTransition;

    } catch (error) {
      console.error(`❌ Error parsing tee time for match ${match.game_number}:`, error);
      return false;
    }
  }



  /**
   * Update multiple matches to live status
   */
  private async updateMatchesToLive(matchIds: number[]) {
    try {
      const { error } = await supabase
        .from('matches')
        .update({ 
          status: 'in-progress',
          updated_at: new Date().toISOString()
        })
        .in('id', matchIds);

      if (error) {
        console.error('❌ Error updating matches to live status:', error);
        return;
      }

      console.log(`🎯 Successfully transitioned ${matchIds.length} matches to live status`);
      
      // Log each match for clarity
      matchIds.forEach(matchId => {
        console.log(`   ✅ Match ID ${matchId} is now LIVE`);
      });

    } catch (error) {
      console.error('❌ Error in updateMatchesToLive:', error);
    }
  }

  /**
   * Manually transition a specific match to live (for testing or admin override)
   */
  async transitionMatchToLive(matchId: number): Promise<boolean> {
    try {
      if (!supabase) return false;

      const { error } = await supabase
        .from('matches')
        .update({ 
          status: 'in-progress',
          updated_at: new Date().toISOString()
        })
        .eq('id', matchId);

      if (error) {
        console.error(`❌ Error manually transitioning match ${matchId} to live:`, error);
        return false;
      }

      console.log(`🎯 Manually transitioned match ${matchId} to live status`);
      return true;

    } catch (error) {
      console.error(`❌ Error in transitionMatchToLive for match ${matchId}:`, error);
      return false;
    }
  }

  /**
   * Get status information for debugging
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      hasInterval: this.intervalId !== null
    };
  }
}

// Export singleton instance
export const matchStatusManager = MatchStatusManager.getInstance();
