/**
 * Utility functions for match timing and status validation
 */

import { getCurrentEAT, parseTeeTimeEAT as parseMatchDateTime } from './timezone';

export interface MatchTimingInfo {
  canScore: boolean;
  reason: string;
  timeUntilStart?: string;
  hasStarted: boolean;
  isOverdue: boolean;
}

/**
 * Determines if a match can be scored based on its status and tee time
 */
export function canScoreMatch(
  status: string,
  matchDate: string,
  teeTime: string,
  isAdmin: boolean = false
): MatchTimingInfo {
  // Always allow scoring if match is in-progress or completed
  if (status === 'in-progress' || status === 'completed') {
    return {
      canScore: true,
      reason: status === 'in-progress' ? 'Match is in progress' : 'Match is completed',
      hasStarted: true,
      isOverdue: false
    };
  }

  // For scheduled matches, check tee time
  if (status === 'scheduled') {
    const now = getCurrentEAT(); // Use EAT time
    const matchDateTime = parseMatchDateTime(matchDate, teeTime);
    
    if (!matchDateTime) {
      return {
        canScore: isAdmin, // Allow admins to score if date parsing fails
        reason: isAdmin ? 'Admin override available' : 'Invalid match time',
        hasStarted: false,
        isOverdue: false
      };
    }

    const timeDiff = matchDateTime.getTime() - now.getTime();
    const hasStarted = timeDiff <= 0;
    const isOverdue = timeDiff < -30 * 60 * 1000; // 30 minutes past tee time

    if (hasStarted) {
      return {
        canScore: true,
        reason: isOverdue ? 'Match is overdue to start' : 'Tee time has been reached',
        hasStarted: true,
        isOverdue
      };
    }

    // Match hasn't started yet
    const timeUntilStart = formatTimeUntilStart(timeDiff);
    return {
      canScore: isAdmin, // Allow admin override
      reason: isAdmin 
        ? `Match starts in ${timeUntilStart} (Admin can override)`
        : `Match starts in ${timeUntilStart}`,
      timeUntilStart,
      hasStarted: false,
      isOverdue: false
    };
  }

  // Unknown status
  return {
    canScore: isAdmin,
    reason: isAdmin ? 'Unknown status (Admin can override)' : 'Unknown match status',
    hasStarted: false,
    isOverdue: false
  };
}



/**
 * Format time difference into human-readable string
 */
export function formatTimeUntilStart(timeDiffMs: number): string {
  const totalMinutes = Math.abs(Math.floor(timeDiffMs / (1000 * 60)));
  
  if (totalMinutes < 60) {
    return `${totalMinutes} minute${totalMinutes !== 1 ? 's' : ''}`;
  }
  
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  if (hours < 24) {
    return minutes > 0 
      ? `${hours}h ${minutes}m`
      : `${hours} hour${hours !== 1 ? 's' : ''}`;
  }
  
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  
  return remainingHours > 0
    ? `${days}d ${remainingHours}h`
    : `${days} day${days !== 1 ? 's' : ''}`;
}


