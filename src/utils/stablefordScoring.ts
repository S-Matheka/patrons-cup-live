/**
 * Stableford Scoring Utility for Karen Country Club
 * Implements the Stableford points system with handicap calculations
 */

// Karen Country Club course data (Par and Stroke Index)
export const KAREN_COURSE_DATA = [
  { hole: 1, par: 4, si: 15 },
  { hole: 2, par: 5, si: 7 },
  { hole: 3, par: 5, si: 9 },
  { hole: 4, par: 4, si: 3 },
  { hole: 5, par: 3, si: 13 },
  { hole: 6, par: 4, si: 1 },
  { hole: 7, par: 3, si: 17 },
  { hole: 8, par: 4, si: 11 },
  { hole: 9, par: 4, si: 5 },
  { hole: 10, par: 4, si: 14 },
  { hole: 11, par: 4, si: 6 },
  { hole: 12, par: 4, si: 18 },
  { hole: 13, par: 4, si: 2 },
  { hole: 14, par: 3, si: 16 },
  { hole: 15, par: 5, si: 8 },
  { hole: 16, par: 3, si: 12 },
  { hole: 17, par: 4, si: 4 },
  { hole: 18, par: 5, si: 10 },
];

// Stableford points system
export const STABLEFORD_POINTS = {
  netAlbatross: 5,      // Net score 3 under par
  netEagle: 4,          // Net score 2 under par
  netBirdie: 3,         // Net score 1 under par
  netPar: 2,            // Net score equals par
  netBogey: 1,          // Net score 1 over par
  netDoubleBogeyOrWorse: 0, // Net score 2+ over par
};

export interface StablefordHole {
  holeNumber: number;
  par: number;
  strokeIndex: number;
  grossScore: number | null;
  netScore: number | null;
  points: number;
  handicap: number;
}

export interface StablefordRound {
  roundNumber: number;
  date: string;
  holes: StablefordHole[];
  totalPoints: number;
  totalGross: number;
  totalNet: number;
}

export interface StablefordPlayer {
  id: number;
  name: string;
  teamId: number;
  teamName: string;
  handicap: number;
  rounds: StablefordRound[];
  aggregatePoints: number;
  aggregateGross: number;
  aggregateNet: number;
  position: number;
}

export interface StablefordTeam {
  id: number;
  name: string;
  division: 'KAREN' | 'VISITOR';
  color: string;
  players: StablefordPlayer[];
  teamPoints: number;
  teamGross: number;
  teamNet: number;
  position: number;
}

/**
 * Calculate net score for a hole based on handicap and stroke index
 * @param grossScore - The actual score on the hole
 * @param handicap - Player's playing handicap
 * @param strokeIndex - Hole's stroke index
 * @returns Net score (gross score minus strokes received)
 */
export function calculateNetScore(
  grossScore: number,
  handicap: number,
  strokeIndex: number
): number {
  // If stroke index <= playing handicap, player gets a stroke
  const strokesReceived = strokeIndex <= handicap ? 1 : 0;
  return grossScore - strokesReceived;
}

/**
 * Calculate Stableford points for a hole
 * @param netScore - Net score for the hole
 * @param par - Par for the hole
 * @returns Points awarded (0-5)
 */
export function calculateStablefordPoints(netScore: number, par: number): number {
  const netToPar = netScore - par;
  
  if (netToPar <= -3) return STABLEFORD_POINTS.netAlbatross;      // 5 points
  if (netToPar === -2) return STABLEFORD_POINTS.netEagle;         // 4 points
  if (netToPar === -1) return STABLEFORD_POINTS.netBirdie;        // 3 points
  if (netToPar === 0) return STABLEFORD_POINTS.netPar;            // 2 points
  if (netToPar === 1) return STABLEFORD_POINTS.netBogey;          // 1 point
  return STABLEFORD_POINTS.netDoubleBogeyOrWorse;                 // 0 points
}

/**
 * Calculate Stableford points for a complete round
 * @param scores - Array of gross scores for each hole (1-18)
 * @param handicap - Player's playing handicap
 * @returns Array of StablefordHole objects with calculated points
 */
export function calculateRoundStableford(
  scores: (number | null)[],
  handicap: number
): StablefordHole[] {
  return KAREN_COURSE_DATA.map((hole, index) => {
    const grossScore = scores[index] || null;
    
    if (grossScore === null) {
      return {
        holeNumber: hole.hole,
        par: hole.par,
        strokeIndex: hole.si,
        grossScore: null,
        netScore: null,
        points: 0,
        handicap,
      };
    }
    
    const netScore = calculateNetScore(grossScore, handicap, hole.si);
    const points = calculateStablefordPoints(netScore, hole.par);
    
    return {
      holeNumber: hole.hole,
      par: hole.par,
      strokeIndex: hole.si,
      grossScore,
      netScore,
      points,
      handicap,
    };
  });
}

/**
 * Calculate total points for a round
 * @param holes - Array of StablefordHole objects
 * @returns Total points for the round
 */
export function calculateRoundTotal(holes: StablefordHole[]): number {
  return holes.reduce((total, hole) => total + hole.points, 0);
}

/**
 * Calculate total gross score for a round
 * @param holes - Array of StablefordHole objects
 * @returns Total gross score (null if any hole not played)
 */
export function calculateRoundGross(holes: StablefordHole[]): number | null {
  const hasNullScores = holes.some(hole => hole.grossScore === null);
  if (hasNullScores) return null;
  
  return holes.reduce((total, hole) => total + (hole.grossScore || 0), 0);
}

/**
 * Calculate total net score for a round
 * @param holes - Array of StablefordHole objects
 * @returns Total net score (null if any hole not played)
 */
export function calculateRoundNet(holes: StablefordHole[]): number | null {
  const hasNullScores = holes.some(hole => hole.netScore === null);
  if (hasNullScores) return null;
  
  return holes.reduce((total, hole) => total + (hole.netScore || 0), 0);
}

/**
 * Get course data for a specific hole
 * @param holeNumber - Hole number (1-18)
 * @returns Course data for the hole
 */
export function getHoleData(holeNumber: number) {
  return KAREN_COURSE_DATA.find(hole => hole.hole === holeNumber);
}

/**
 * Get total par for the course
 * @returns Total par (72 for Karen Country Club)
 */
export function getCoursePar(): number {
  return KAREN_COURSE_DATA.reduce((total, hole) => total + hole.par, 0);
}

/**
 * Format score display (handles null scores)
 * @param score - Score to format
 * @returns Formatted score string
 */
export function formatScore(score: number | null): string {
  if (score === null) return '-';
  return score.toString();
}

/**
 * Format points display with color coding
 * @param points - Points to format
 * @returns Formatted points string
 */
export function formatPoints(points: number): string {
  if (points >= 4) return `+${points}`; // Eagle or better
  if (points === 3) return `${points}`;  // Birdie
  if (points === 2) return `${points}`;  // Par
  if (points === 1) return `${points}`;  // Bogey
  return `${points}`;                    // Double bogey or worse
}

/**
 * Get color class for points display
 * @param points - Points to get color for
 * @returns Tailwind CSS color class
 */
export function getPointsColor(points: number): string {
  if (points >= 4) return 'text-green-600 font-bold'; // Eagle or better
  if (points === 3) return 'text-green-500';          // Birdie
  if (points === 2) return 'text-gray-700';           // Par
  if (points === 1) return 'text-orange-500';         // Bogey
  return 'text-red-500';                              // Double bogey or worse
}