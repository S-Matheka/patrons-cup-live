/**
 * Live Tournament Standings Calculator
 * Calculates team standings from live match data as holes are played
 * Updates in real-time for audience engagement
 * Uses proper tournament point allocation system
 */

import { Match, Team, Score } from '@/types';
import { calculateMatchPlayResult, calculateThreeWayResult } from './matchPlayScoring';
import { calculateSessionBasedStandings, LiveStandingEntry } from './sessionBasedScoring';

/**
 * Get points for match based on tournament rules
 */
function getMatchPoints(match: Match, result: 'win' | 'tie' | 'loss'): number {
  const { type, session, division, date } = match;
  
  // Determine day from date
  const matchDate = new Date(date);
  const dayOfWeek = matchDate.getDay(); // 0=Sunday, 5=Friday, 6=Saturday
  
  let day: 'Friday' | 'Saturday' | 'Sunday';
  if (dayOfWeek === 5) day = 'Friday';
  else if (dayOfWeek === 6) day = 'Saturday';
  else day = 'Sunday';
  
  // Points based on division type
  const isBowlMug = division === 'Bowl' || division === 'Mug';
  
  // Calculate points based on match type, day, session, and division
  if (day === 'Friday') {
    if (session === 'AM' && type === '4BBB') {
      // Friday AM 4BBB: 5pts win, 2.5pts tie (all divisions)
      return result === 'win' ? 5 : result === 'tie' ? 2.5 : 0;
    } else if (session === 'PM' && type === 'Foursomes') {
      // Friday PM Foursomes: Trophy/Shield/Plaque = 3pts win, 1.5pts tie | Bowl/Mug = 4pts win, 2pts tie
      if (isBowlMug) {
        return result === 'win' ? 4 : result === 'tie' ? 2 : 0;
      } else {
        return result === 'win' ? 3 : result === 'tie' ? 1.5 : 0;
      }
    }
  } else if (day === 'Saturday') {
    if (session === 'AM' && type === '4BBB') {
      // Saturday AM 4BBB: 5pts win, 2.5pts tie (all divisions)
      return result === 'win' ? 5 : result === 'tie' ? 2.5 : 0;
    } else if (session === 'PM' && type === 'Foursomes') {
      // Saturday PM Foursomes: Trophy/Shield/Plaque = 3pts win, 1.5pts tie | Bowl/Mug = 4pts win, 2pts tie
      if (isBowlMug) {
        return result === 'win' ? 4 : result === 'tie' ? 2 : 0;
      } else {
        return result === 'win' ? 3 : result === 'tie' ? 1.5 : 0;
      }
    }
  } else if (day === 'Sunday' && type === 'Singles') {
    // Sunday Singles: 3pts win, 1.5pts tie (all divisions)
    return result === 'win' ? 3 : result === 'tie' ? 1.5 : 0;
  }
  
  // Default fallback
  return result === 'win' ? 1 : result === 'tie' ? 0.5 : 0;
}



/**
 * Calculate live standings from current match data
 * This runs in real-time as holes are scored
 * Uses SESSION-BASED scoring to prevent over-awarding points
 */
export function calculateLiveStandings(
  matches: Match[], 
  teams: Team[], 
  division?: string
): LiveStandingEntry[] {
  // Use session-based scoring to prevent teams getting multiple points per session
  if (division) {
    return calculateSessionBasedStandings(matches, teams, division);
  }

  // If no division specified, calculate for all divisions
  const allDivisions = ['Trophy', 'Shield', 'Plaque', 'Bowl', 'Mug'];
  const allStandings: LiveStandingEntry[] = [];
  
  allDivisions.forEach(div => {
    const divisionStandings = calculateSessionBasedStandings(matches, teams, div);
    allStandings.push(...divisionStandings);
  });
  
  return allStandings;
}

/**
 * Calculate sessions played for a team (not individual matches)
 * This is used for the "Played" column in standings
 */
export function calculateSessionsPlayed(teamId: number, matches: Match[]): number {
  const teamMatches = matches.filter(m => 
    (m.teamAId === teamId || m.teamBId === teamId || m.teamCId === teamId) && 
    (m.status === 'completed' || m.status === 'in-progress')
  );

  // Get unique sessions this team has participated in
  const sessions = new Set<string>();
  teamMatches.forEach(match => {
    const sessionKey = `${match.date}-${match.session}-${match.type}`;
    sessions.add(sessionKey);
  });

  return sessions.size;
}

/**
 * Calculate tournament progress statistics
 */
export function calculateTournamentProgress(matches: Match[]) {
  const totalMatches = matches.length;
  const completedMatches = matches.filter(m => m.status === 'completed').length;
  const inProgressMatches = matches.filter(m => m.status === 'in-progress').length;
  const scheduledMatches = matches.filter(m => m.status === 'scheduled').length;

  return {
    totalMatches,
    completedMatches,
    inProgressMatches,
    scheduledMatches,
    completionPercentage: totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0,
    livePercentage: totalMatches > 0 ? Math.round((inProgressMatches / totalMatches) * 100) : 0
  };
}