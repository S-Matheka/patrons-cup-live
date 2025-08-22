/**
 * Timezone utilities for EAT (Eastern Africa Time) - Nairobi, Kenya (UTC+3)
 */

/**
 * Get current time in EAT (Eastern Africa Time - Nairobi, Kenya)
 */
export function getCurrentEAT(): Date {
  return new Date(new Date().toLocaleString("en-US", {timeZone: "Africa/Nairobi"}));
}

/**
 * Format a date/time for display in EAT timezone
 */
export function formatEATDateTime(date: Date): string {
  return date.toLocaleString('en-KE', { 
    timeZone: 'Africa/Nairobi',
    year: 'numeric',
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
}

/**
 * Format time only in EAT timezone
 */
export function formatEATTime(date: Date): string {
  return date.toLocaleString('en-KE', { 
    timeZone: 'Africa/Nairobi',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Format date only in EAT timezone
 */
export function formatEATDate(date: Date): string {
  return date.toLocaleDateString('en-KE', { 
    timeZone: 'Africa/Nairobi',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Parse tee time string and create EAT Date object
 */
export function parseTeeTimeEAT(matchDate: string, teeTime: string): Date | null {
  try {
    // Parse date (expected format: YYYY-MM-DD)
    const dateMatch = matchDate.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (!dateMatch) return null;

    const [, year, month, day] = dateMatch;

    // Parse time (expected formats: "HH:MM AM/PM" or "HH:MM")
    const timeMatch = teeTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (!timeMatch) return null;

    let [, hourStr, minuteStr, ampm] = timeMatch;
    let hour = parseInt(hourStr);
    const minute = parseInt(minuteStr);

    // Convert 12-hour to 24-hour format
    if (ampm) {
      const isAM = ampm.toUpperCase() === 'AM';
      if (hour === 12 && isAM) {
        hour = 0;
      } else if (hour !== 12 && !isAM) {
        hour += 12;
      }
    }

    // Create date in EAT timezone
    const eatDate = new Date(
      parseInt(year),
      parseInt(month) - 1, // Month is 0-indexed
      parseInt(day),
      hour,
      minute
    );

    return eatDate;
  } catch (error) {
    console.error('Error parsing tee time:', error);
    return null;
  }
}

/**
 * Check if a tee time has been reached in EAT
 */
export function hasTeeTimeArrived(matchDate: string, teeTime: string): boolean {
  const currentTime = getCurrentEAT();
  const teeDateTime = parseTeeTimeEAT(matchDate, teeTime);
  
  if (!teeDateTime) return false;
  
  return currentTime >= teeDateTime;
}

/**
 * Get time until tee time in EAT
 */
export function getTimeUntilTeeTime(matchDate: string, teeTime: string): {
  hasArrived: boolean;
  timeUntil: string;
  minutesUntil: number;
} {
  const currentTime = getCurrentEAT();
  const teeDateTime = parseTeeTimeEAT(matchDate, teeTime);
  
  if (!teeDateTime) {
    return { hasArrived: false, timeUntil: 'Invalid time', minutesUntil: 0 };
  }
  
  const timeDiff = teeDateTime.getTime() - currentTime.getTime();
  const hasArrived = timeDiff <= 0;
  const minutesUntil = Math.round(timeDiff / (1000 * 60));
  
  if (hasArrived) {
    return { hasArrived: true, timeUntil: 'Started', minutesUntil: 0 };
  }
  
  const totalMinutes = Math.abs(minutesUntil);
  
  if (totalMinutes < 60) {
    return { 
      hasArrived: false, 
      timeUntil: `${totalMinutes} minute${totalMinutes !== 1 ? 's' : ''}`,
      minutesUntil 
    };
  }
  
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  if (hours < 24) {
    const timeStr = minutes > 0 ? `${hours}h ${minutes}m` : `${hours} hour${hours !== 1 ? 's' : ''}`;
    return { hasArrived: false, timeUntil: timeStr, minutesUntil };
  }
  
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  
  const timeStr = remainingHours > 0 
    ? `${days}d ${remainingHours}h`
    : `${days} day${days !== 1 ? 's' : ''}`;
    
  return { hasArrived: false, timeUntil: timeStr, minutesUntil };
}

/**
 * Tournament constants for EAT timezone
 */
export const TOURNAMENT_CONFIG = {
  TIMEZONE: 'Africa/Nairobi',
  TIMEZONE_OFFSET: '+03:00',
  TIMEZONE_NAME: 'EAT',
  TOURNAMENT_START: '2025-08-22T07:30:00+03:00', // 7:30 AM EAT on August 22nd
  LOCATION: 'Nairobi, Kenya'
};

/**
 * Get tournament start time in EAT
 */
export function getTournamentStartEAT(): Date {
  return new Date(TOURNAMENT_CONFIG.TOURNAMENT_START);
}
