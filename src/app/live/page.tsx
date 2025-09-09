'use client';

import { useTournament } from '@/context/TournamentContextSwitcher';
import { Match, Hole } from '@/types';
import { useState, useEffect } from 'react';
import { Clock, CheckCircle, Circle, ExternalLink, Filter, Calendar, Users, Trophy, Medal } from 'lucide-react';
import FinalLeaderboard from '@/components/FinalLeaderboard';
import TournamentCountdown from '@/components/TournamentCountdown';
import { calculateThreeWayResult, calculateMatchPlayResult } from '@/utils/matchPlayScoring';
import Link from 'next/link';

export default function LiveScoring() {
  const { teams, scores, matches, players, loading, refreshMatchData } = useTournament();
  const [selectedDivision, setSelectedDivision] = useState<'Trophy' | 'Shield' | 'Plaque' | 'Bowl' | 'Mug' | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'in-progress' | 'scheduled' | 'completed'>('all');
  const [activeDivision, setActiveDivision] = useState<'Trophy' | 'Shield' | 'Plaque' | 'Bowl' | 'Mug'>('Trophy');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);



  // Filter 3-way Foursomes matches for debugging
  const threeWayFoursomesMatches = matches.filter(match => 
    match.isThreeWay && (match.type === 'Foursomes' || match.match_type === 'Foursomes')
  );

  // Show loading state during initial mount or while data is loading
  if (!isMounted || loading) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Live Tournament Scoring</h1>
              <p className="text-gray-600 mt-1">Real-time updates from the course</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Division</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="all">All Divisions</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="all">All Status</option>
              </select>
            </div>
          </div>
        </div>

        {/* Matches Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Placeholder cards */}
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-md p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const filteredMatches = matches.filter(match => {
    const divisionMatch = selectedDivision === 'all' || match.division === selectedDivision;
    const statusMatch = selectedStatus === 'all' || match.status === selectedStatus;
    return divisionMatch && statusMatch;
  });

  // const activeMatches = []; // No matches are currently in progress
  // const scheduledMatches = matches.filter(match => match.status === 'scheduled');
  // const completedMatches = []; // No matches have been completed yet

  const getMatchStatusIcon = (status: string) => {
    switch (status) {
      case 'in-progress':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'scheduled':
        return <Circle className="w-4 h-4 text-gray-400" />;
      default:
        return <Circle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getMatchStatusColor = (status: string) => {
    switch (status) {
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMatchTypeColor = (type: string) => {
    switch (type) {
      case '4BBB':
        return 'bg-purple-100 text-purple-800';
      case 'Foursomes':
        return 'bg-orange-100 text-orange-800';
      case 'Singles':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateMatchResult = (match: Match) => {

    
    // Check match status first - scheduled matches should show "Scheduled"
    if (match.status === 'scheduled') {
      return 'Scheduled';
    }
    
    if (match.isThreeWay) {
      // 3-team match play scoring (hole-by-hole wins)
      const holesData = match.holes.map(hole => {
        return {
          holeNumber: hole.number,
          par: hole.par || 4,
          teamAScore: hole.teamAScore,
          teamBScore: hole.teamBScore,
          teamCScore: hole.teamCScore || null
        };
      });

      const result = calculateThreeWayResult(holesData, 18);
      
      // Get team names for display
      const teamA = teams.find(t => t.id === match.teamAId);
      const teamB = teams.find(t => t.id === match.teamBId);
      const teamC = teams.find(t => t.id === match.teamCId);
      
      // Check if there are any scores at all
      const hasAnyScores = match.holes.some(hole => {
        return hole.teamAScore !== null || hole.teamBScore !== null || hole.teamCScore !== null;
      });
      
      if (!hasAnyScores) {
        return 'Not Started';
      }
      
      // For 3-way Foursomes, show individual match results with proper match play scores
      // Calculate individual matches
      let teamAvsB = { teamAWins: 0, teamBWins: 0, holesPlayed: 0 };
      let teamAvsC = { teamAWins: 0, teamCWins: 0, holesPlayed: 0 };
      let teamBvsC = { teamBWins: 0, teamCWins: 0, holesPlayed: 0 };

      holesData.forEach(hole => {
        // Team A vs Team B
        if (hole.teamAScore !== null && hole.teamAScore !== undefined && 
            hole.teamBScore !== null && hole.teamBScore !== undefined) {
          teamAvsB.holesPlayed++;
          if (hole.teamAScore < hole.teamBScore) {
            teamAvsB.teamAWins++;
          } else if (hole.teamBScore < hole.teamAScore) {
            teamAvsB.teamBWins++;
          }
        }

        // Team A vs Team C
        if (hole.teamAScore !== null && hole.teamAScore !== undefined && 
            hole.teamCScore !== null && hole.teamCScore !== undefined) {
          teamAvsC.holesPlayed++;
          if (hole.teamAScore < hole.teamCScore) {
            teamAvsC.teamAWins++;
          } else if (hole.teamCScore < hole.teamAScore) {
            teamAvsC.teamCWins++;
          }
        }

        // Team B vs Team C
        if (hole.teamBScore !== null && hole.teamBScore !== undefined && 
            hole.teamCScore !== null && hole.teamCScore !== undefined) {
          teamBvsC.holesPlayed++;
          if (hole.teamBScore < hole.teamCScore) {
            teamBvsC.teamBWins++;
          } else if (hole.teamCScore < hole.teamBScore) {
            teamBvsC.teamCWins++;
          }
        }
      });

                  // Valid match play results according to the exact rules provided
            const VALID_RESULTS = {
              18: ['AS', '1up', '2up'],
              17: ['2/1', '2up', '3/1'],
              16: ['3/2', '4/2'],
              15: ['4/3', '5/3'],
              14: ['5/4', '6/4'],
              13: ['6/5', '7/5'],
              12: ['7/6', '8/6'],
              11: ['8/7', '9/7'],
              10: ['9/8', '10/8']
            };

      // Format individual match results
      const formatMatchResult = (teamAWins: number, teamBWins: number, holesPlayed: number, teamAName: string, teamBName: string) => {
        if (holesPlayed === 0) return 'Not Started';
        
        const holesRemaining = 18 - holesPlayed;
        const holesDifference = Math.abs(teamAWins - teamBWins);
        
        // Check if match ended early due to clinching (team up by more holes than remain)
        const isClinched = holesDifference > holesRemaining;
        
        if (teamAWins === teamBWins) {
          return `${teamAName} & ${teamBName} halved`;
        } else if (teamAWins > teamBWins) {
          let resultFormat;
          if (holesPlayed === 18) {
            // Match went all 18 holes
            resultFormat = `${holesDifference}up`;
          } else if (isClinched) {
            // Match clinched early - use X/Y format
            resultFormat = `${holesDifference}/${holesRemaining}`;
          } else {
            // Match completed but not clinched early - use Xup format
            resultFormat = `${holesDifference}up`;
          }
          
          // Validate against the exact rules provided
          const validResults = VALID_RESULTS[holesPlayed] || [];
          if (!validResults.includes(resultFormat)) {
            // If the calculated result is not valid, use the closest valid result
            if (holesPlayed === 18) {
              resultFormat = `${holesDifference}up`;
            } else if (isClinched) {
              // Find the exact valid clinched result that matches our calculation
              const exactResult = `${holesDifference}/${18 - holesPlayed}`;
              if (validResults.includes(exactResult)) {
                resultFormat = exactResult;
              } else {
                // Find the closest valid clinched result
                const validClinchedResults = validResults.filter(r => r.includes('/'));
                if (validClinchedResults.length > 0) {
                  // Find the result with the closest holes difference
                  let closestResult = validClinchedResults[0];
                  let minDifference = Math.abs(parseInt(validClinchedResults[0].split('/')[0]) - holesDifference);
                  
                  for (const result of validClinchedResults) {
                    const resultDiff = parseInt(result.split('/')[0]);
                    const diff = Math.abs(resultDiff - holesDifference);
                    if (diff < minDifference) {
                      minDifference = diff;
                      closestResult = result;
                    }
                  }
                  resultFormat = closestResult;
                } else {
                  resultFormat = `${holesDifference}up`;
                }
              }
            } else {
              resultFormat = `${holesDifference}up`;
            }
          }
          
          return `${teamAName} won ${resultFormat}`;
        } else if (teamBWins > teamAWins) {
          let resultFormat;
          if (holesPlayed === 18) {
            // Match went all 18 holes
            resultFormat = `${holesDifference}up`;
          } else if (isClinched) {
            // Match clinched early - use X/Y format
            resultFormat = `${holesDifference}/${holesRemaining}`;
          } else {
            // Match completed but not clinched early - use Xup format
            resultFormat = `${holesDifference}up`;
          }
          
          // Validate against the exact rules provided
          const validResults = VALID_RESULTS[holesPlayed] || [];
          if (!validResults.includes(resultFormat)) {
            // If the calculated result is not valid, use the closest valid result
            if (holesPlayed === 18) {
              // For 18 holes, try to find a valid Xup result
              const upResult = `${holesDifference}up`;
              if (validResults.includes(upResult)) {
                resultFormat = upResult;
              } else {
                resultFormat = validResults[0] || 'AS';
              }
            } else if (isClinched) {
              // Find the exact valid clinched result that matches our calculation
              const exactResult = `${holesDifference}/${18 - holesPlayed}`;
              if (validResults.includes(exactResult)) {
                resultFormat = exactResult;
              } else {
                // Find the closest valid clinched result
                const validClinchedResults = validResults.filter(r => r.includes('/'));
                if (validClinchedResults.length > 0) {
                  // Find the result with the closest holes difference
                  let closestResult = validClinchedResults[0];
                  let minDifference = Math.abs(parseInt(validClinchedResults[0].split('/')[0]) - holesDifference);
                  
                  for (const result of validClinchedResults) {
                    const resultDiff = parseInt(result.split('/')[0]);
                    const diff = Math.abs(resultDiff - holesDifference);
                    if (diff < minDifference) {
                      minDifference = diff;
                      closestResult = result;
                    }
                  }
                  resultFormat = closestResult;
                } else {
                  resultFormat = validResults[0] || 'AS';
                }
              }
            } else {
              // For non-clinched matches, try to find a valid Xup result
              const upResult = `${holesDifference}up`;
              if (validResults.includes(upResult)) {
                resultFormat = upResult;
              } else {
                resultFormat = validResults[0] || 'AS';
              }
            }
          }
          
          // If resultFormat is 'AS', it means teams are tied, so show halved instead
          if (resultFormat === 'AS') {
            return `${teamAName} & ${teamBName} halved`;
          }
          
          return `${teamBName} won ${resultFormat}`;
        }
      };

      // Use the exact same logic as live scorecard for consistency
      const holesWithScores = match.holes.filter(h => 
        h.teamAScore !== null && h.teamBScore !== null && h.teamCScore !== null
      );
      
      // Calculate head-to-head results using same logic as live scorecard
      const calculateHeadToHead = (holes: Hole[], team1: string, team2: string, team1Name: string, team2Name: string) => {
        let team1Wins = 0;
        let team2Wins = 0;
        
        holes.forEach(hole => {
          const team1Score = team1 === 'teamA' ? hole.teamAScore : 
                            team1 === 'teamB' ? hole.teamBScore : 
                            hole.teamCScore;
          const team2Score = team2 === 'teamA' ? hole.teamAScore : 
                            team2 === 'teamB' ? hole.teamBScore : 
                            hole.teamCScore;
          
          if (team1Score! < team2Score!) {
            team1Wins++;
          } else if (team2Score! < team1Score!) {
            team2Wins++;
          }
        });
        
        const holesPlayed = holes.length;
        const holesDifference = Math.abs(team1Wins - team2Wins);
        const holesRemaining = 18 - holesPlayed;
        const isClinched = holesDifference > holesRemaining;
        
              if (team1Wins === team2Wins) {
        return 'AS';
      } else if (team1Wins > team2Wins) {
          const result = formatValidatedResult(holesPlayed, holesDifference, isClinched);
          return `${team1Name} won ${result}`;
        } else {
          const result = formatValidatedResult(holesPlayed, holesDifference, isClinched);
          return `${team2Name} won ${result}`;
        }
      };
      
      const formatValidatedResult = (holesPlayed: number, holesDifference: number, isClinched: boolean) => {
        const validResults = VALID_RESULTS[holesPlayed as keyof typeof VALID_RESULTS] || [];
        
        if (holesPlayed === 18) {
          const upResult = `${holesDifference}up`;
          if (validResults.includes(upResult)) {
            return upResult;
          }
          return validResults[0] || 'AS';
        } else if (isClinched) {
          const clinchedResult = `${holesDifference}/${18 - holesPlayed}`;
          if (validResults.includes(clinchedResult)) {
            return clinchedResult;
          }
          const validClinchedResults = validResults.filter((r: string) => r.includes('/'));
          if (validClinchedResults.length > 0) {
            let closestResult = validClinchedResults[0];
            let minDifference = Math.abs(parseInt(validClinchedResults[0].split('/')[0]) - holesDifference);
            
            for (const result of validClinchedResults) {
              const resultDiff = parseInt(result.split('/')[0]);
              const diff = Math.abs(resultDiff - holesDifference);
              if (diff < minDifference) {
                minDifference = diff;
                closestResult = result;
              }
            }
            return closestResult;
          }
          return validResults[0] || 'AS';
        } else {
          const upResult = `${holesDifference}up`;
          if (validResults.includes(upResult)) {
            return upResult;
          }
          return validResults[0] || 'AS';
        }
      };
      
      const teamAvsBFormatted = calculateHeadToHead(holesWithScores, 'teamA', 'teamB', teamA?.name || 'Team A', teamB?.name || 'Team B');
      const teamAvsCFormatted = calculateHeadToHead(holesWithScores, 'teamA', 'teamC', teamA?.name || 'Team A', teamC?.name || 'Team C');
      const teamBvsCFormatted = calculateHeadToHead(holesWithScores, 'teamB', 'teamC', teamB?.name || 'Team B', teamC?.name || 'Team C');

      // Always show detailed head-to-head results for both completed and in-progress matches
      const results = [];
      
      // Team A vs Team B
      const teamAvsBResult = calculateHeadToHead(holesWithScores, 'teamA', 'teamB', teamA?.name || 'Team A', teamB?.name || 'Team B');
      const [winnerAvsB, scoreAvsB] = teamAvsBResult.split(' won ');
      if (teamAvsBResult === 'AS') {
        results.push('AS');
      } else {
        results.push(`${winnerAvsB} ${scoreAvsB} against ${winnerAvsB === teamA?.name ? teamB?.name : teamA?.name}`);
      }
      
      // Team A vs Team C
      const teamAvsCResult = calculateHeadToHead(holesWithScores, 'teamA', 'teamC', teamA?.name || 'Team A', teamC?.name || 'Team C');
      const [winnerAvsC, scoreAvsC] = teamAvsCResult.split(' won ');
      if (teamAvsCResult === 'AS') {
        results.push('AS');
      } else {
        results.push(`${winnerAvsC} ${scoreAvsC} against ${winnerAvsC === teamA?.name ? teamC?.name : teamA?.name}`);
      }
      
      // Team B vs Team C
      const teamBvsCResult = calculateHeadToHead(holesWithScores, 'teamB', 'teamC', teamB?.name || 'Team B', teamC?.name || 'Team C');
      const [winnerBvsC, scoreBvsC] = teamBvsCResult.split(' won ');
      if (teamBvsCResult === 'AS') {
        results.push('AS');
      } else {
        results.push(`${winnerBvsC} ${scoreBvsC} against ${winnerBvsC === teamB?.name ? teamC?.name : teamB?.name}`);
      }
      
      return results.join(' • ');
    } else {
      // 2-team match play scoring
      let teamAWins = 0;
      let teamBWins = 0;
      let holesPlayed = 0;

      match.holes.forEach((hole: Hole) => {
        if (hole.teamAScore !== null && hole.teamBScore !== null) {
          holesPlayed++;
          if (hole.teamAScore < hole.teamBScore) {
            teamAWins++;
          } else if (hole.teamBScore < hole.teamAScore) {
            teamBWins++;
          }
        }
      });

      if (holesPlayed === 0) return 'Not Started';
      
      const teamA = teams.find(t => t.id === match.teamAId);
      const teamB = teams.find(t => t.id === match.teamBId);
      
      // Check if match is completed (18 holes played or match ended early)
      const isCompleted = holesPlayed === 18 || Math.abs(teamAWins - teamBWins) > (18 - holesPlayed);
      
      if (isCompleted) {
        // For completed matches, show final result with proper format
        const holesRemaining = 18 - holesPlayed;
        const holesDifference = Math.abs(teamAWins - teamBWins);
        const resultFormat = holesPlayed === 18 ? `${holesDifference}up` : `${holesDifference}/${holesRemaining}`;
        
        if (teamAWins > teamBWins) {
          return `${teamA?.name || 'Team A'} won ${resultFormat}`;
        } else if (teamBWins > teamAWins) {
          return `${teamB?.name || 'Team B'} won ${resultFormat}`;
        } else {
          return `${teamA?.name || 'Team A'} & ${teamB?.name || 'Team B'} halved`;
        }
      } else {
        // For in-progress matches, show current lead
        if (teamAWins > teamBWins) {
          return `${teamA?.name || 'Team A'} leads against ${teamB?.name || 'Team B'} by ${teamAWins - teamBWins}`;
        } else if (teamBWins > teamAWins) {
          return `${teamB?.name || 'Team B'} leads against ${teamA?.name || 'Team A'} by ${teamBWins - teamAWins}`;
        } else {
          return `${teamA?.name || 'Team A'} & ${teamB?.name || 'Team B'} are ALL SQUARE`;
        }
      }
    }
  };

  // Helper function to get actual assigned players or sample players for a match
  const getMatchPlayers = (match: Match, teamId: number | null, count: number = 2) => {
    if (!teamId) return [];
    const teamPlayers = players.filter(player => player.teamId === teamId);
    
    if (teamPlayers.length === 0) return [];
    
    // First, try to get actual assigned players from match data
    let assignedPlayerIds: string[] = [];
    
    if (match.players) {
      if (teamId === match.teamAId && match.players.teamA) {
        assignedPlayerIds = match.players.teamA;
      } else if (teamId === match.teamBId && match.players.teamB) {
        assignedPlayerIds = match.players.teamB;
      } else if (teamId === match.teamCId && match.players.teamC) {
        assignedPlayerIds = match.players.teamC;
      }
    }
    
    // Check if players were explicitly assigned (even if empty)
    let hasExplicitAssignment = false;
    if (match.players) {
      if (teamId === match.teamAId && match.players.teamA !== undefined) {
        hasExplicitAssignment = true;
      } else if (teamId === match.teamBId && match.players.teamB !== undefined) {
        hasExplicitAssignment = true;
      } else if (teamId === match.teamCId && match.players.teamC !== undefined) {
        hasExplicitAssignment = true;
      }
    }
    
    // If we have explicit assignment (even empty), use it
    if (hasExplicitAssignment) {
      if (assignedPlayerIds && assignedPlayerIds.length > 0) {
        const resolvedPlayers = assignedPlayerIds
          .map(playerId => {
            // Try to find player by ID first, then by name (for legacy data)
            return teamPlayers.find(p => 
              p.id.toString() === playerId || 
              p.name === playerId
            );
          })
          .filter(player => player !== undefined);
        
        return resolvedPlayers.slice(0, count);
      } else {
        // Explicitly assigned empty array - show no players
        return [];
      }
    }
    
    // Fallback: Generate consistent sample players based on match ID (original logic)
    // This ensures the same players are always shown for the same match when no assignments exist
    const startIndex = (match.id * teamId) % teamPlayers.length;
    const selectedPlayers = [];
    
    for (let i = 0; i < count && i < teamPlayers.length; i++) {
      const playerIndex = (startIndex + i) % teamPlayers.length;
      selectedPlayers.push(teamPlayers[playerIndex]);
    }
    
    return selectedPlayers;
  };

  return (
    <div className="space-y-8">
      {/* Tournament Countdown */}
      <div className="px-4 sm:px-0">
        <TournamentCountdown />
      </div>

      {/* Header */}
      <div className="text-center px-4 sm:px-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">🏆 FINAL DAY - SINGLES CHAMPIONSHIP 🏆</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-2">4th Edition Patron's Cup 2025 - The Ultimate Challenge</p>
        <div className="flex items-center justify-center space-x-2 mt-4">
          <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
          <span className="text-xs sm:text-sm font-medium text-yellow-600 font-semibold">SUNDAY AUG 24, 2025 - SINGLES</span>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Teams</p>
              <p className="text-2xl font-bold text-gray-900">15</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Trophy className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Divisions</p>
              <p className="text-2xl font-bold text-gray-900">5</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Calendar className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Final Day</p>
              <p className="text-2xl font-bold text-gray-900">SINGLES</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">First Tee</p>
              <p className="text-2xl font-bold text-gray-900">6:38 AM</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
            <select
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value as 'Trophy' | 'Shield' | 'Plaque' | 'Bowl' | 'Mug' | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 w-full sm:w-auto"
            >
              <option value="all">All Divisions</option>
              <option value="Trophy">Trophy Division</option>
              <option value="Shield">Shield Division</option>
              <option value="Plaque">Plaque Division</option>
              <option value="Bowl">Bowl Division</option>
              <option value="Mug">Mug Division</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as 'all' | 'in-progress' | 'scheduled' | 'completed')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 w-full sm:w-auto"
            >
              <option value="all">All Status</option>
              <option value="in-progress">In Progress</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
            </select>

            <button
              onClick={() => {
                // Force refresh all 3-way Foursomes matches
                const threeWayFoursomesMatches = matches.filter(match => 
                  match.isThreeWay && (match.type === 'Foursomes' || match.match_type === 'Foursomes')
                );
                console.log('Refreshing matches:', threeWayFoursomesMatches.map(m => m.id));
                threeWayFoursomesMatches.forEach(match => {
                  refreshMatchData(match.id);
                });
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Refresh Data
            </button>
          </div>
        </div>
      </div>

      {/* Live Tournament Leaderboard */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 bg-gradient-to-r from-green-600 to-green-700">
          <h2 className="text-xl font-bold text-white flex items-center">
            <Trophy className="w-5 h-5 mr-2" />
            Tournament Seedings
          </h2>
        </div>
        <div className="p-6">
          {/* Division Tabs */}
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-1 mb-6 bg-gray-100 p-1 rounded-lg overflow-x-auto">
            {(['Trophy', 'Shield', 'Plaque', 'Bowl', 'Mug'] as const).map((division) => (
              <button
                key={division}
                onClick={() => setActiveDivision(division)}
                className={`flex-shrink-0 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeDivision === division
                    ? 'bg-white text-green-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                <div className="flex items-center justify-center space-x-1">
                  <Medal className={`w-4 h-4 ${
                    division === 'Trophy' ? 'text-yellow-500' :
                    division === 'Shield' ? 'text-gray-400' :
                    division === 'Plaque' ? 'text-amber-600' :
                    division === 'Bowl' ? 'text-orange-500' :
                    'text-purple-500'
                  }`} />
                  <span>{division}</span>
                </div>
              </button>
            ))}
          </div>
          
          {/* Active Division Leaderboard */}
          <FinalLeaderboard defaultDivision={activeDivision} showTabs={false} />
        </div>
      </div>

      {/* Matches List */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-700">
          <h2 className="text-xl font-bold text-white">
            Tournament Matches 
            <span className="text-purple-200 ml-2">({filteredMatches.length} matches)</span>
          </h2>
        </div>
        <div className="p-6">
          {filteredMatches.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Circle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No matches found for the selected filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMatches.map((match) => {
                const teamA = teams.find(t => t.id === match.teamAId);
                const teamB = teams.find(t => t.id === match.teamBId);
                const teamC = teams.find(t => t.id === match.teamCId);
                
                // Get sample players for each team
                const teamAPlayers = getMatchPlayers(match, match.teamAId, match.type === 'Singles' ? 1 : 2);
                const teamBPlayers = getMatchPlayers(match, match.teamBId, match.type === 'Singles' ? 1 : 2);
                const teamCPlayers = getMatchPlayers(match, match.teamCId, match.type === 'Singles' ? 1 : 2);
                
                return (
                  <div key={match.id} className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow overflow-hidden">
                    <div className="space-y-3">
                      {/* Header with badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-gray-600">Game {match.gameNumber}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMatchTypeColor(match.type)}`}>
                          {match.type}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMatchStatusColor(match.status)}`}>
                          {match.status}
                        </span>
                        {match.isBye && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            BYE
                          </span>
                        )}
                        {match.isPro && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            PRO
                          </span>
                        )}
                      </div>
                      
                      {/* Match details */}
                      <div className="space-y-2">
                        {match.isBye ? (
                          <div>
                            <div className="text-sm font-semibold text-gray-900 mb-2">
                              {teamA?.name ? `${teamA.name} - BYE Match` : teamB?.name ? `BYE vs ${teamB.name}` : 'BYE Match'}
                            </div>
                            <div className="text-xs text-gray-600">
                              {teamA?.name && teamAPlayers.map(player => (
                                <div key={player.id} className="text-gray-600">
                                  {player.name}
                                  {player.isPro && <span className="text-yellow-600 ml-1">(Pro)</span>}
                                </div>
                              ))}
                              {teamB?.name && teamBPlayers.map(player => (
                                <div key={player.id} className="text-gray-600">
                                  {player.name}
                                  {player.isPro && <span className="text-yellow-600 ml-1">(Pro)</span>}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : match.isThreeWay ? (
                          <div>
                            <div className="text-sm font-semibold text-gray-900 mb-2">
                              {teamA?.name || 'TBD'} vs {teamB?.name || 'TBD'} vs {teamC?.name || 'TBD'}
                            </div>
                            <div className="grid grid-cols-1 gap-2 text-xs">
                              <div className="min-w-0">
                                <div className="font-medium text-gray-700">{teamA?.name}</div>
                                {teamAPlayers.map(player => (
                                  <div key={player.id} className="text-gray-600 text-xs sm:text-sm">
                                    {player.name}
                                    {player.isPro && <span className="text-yellow-600 ml-1">(Pro)</span>}
                                  </div>
                                ))}
                              </div>
                              <div className="min-w-0">
                                <div className="font-medium text-gray-700">{teamB?.name}</div>
                                {teamBPlayers.map(player => (
                                  <div key={player.id} className="text-gray-600 text-xs sm:text-sm">
                                    {player.name}
                                    {player.isPro && <span className="text-yellow-600 ml-1">(Pro)</span>}
                                  </div>
                                ))}
                              </div>
                              <div className="min-w-0">
                                <div className="font-medium text-gray-700">{teamC?.name}</div>
                                {teamCPlayers.map(player => (
                                  <div key={player.id} className="text-gray-600 text-xs sm:text-sm">
                                    {player.name}
                                    {player.isPro && <span className="text-yellow-600 ml-1">(Pro)</span>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="text-sm font-semibold text-gray-900 mb-2">
                              {teamA?.name || 'TBD'} vs {teamB?.name || 'TBD'}
                            </div>
                            <div className="grid grid-cols-1 gap-2 text-xs">
                              <div className="min-w-0">
                                <div className="font-medium text-gray-700">{teamA?.name}</div>
                                {teamAPlayers.map(player => (
                                  <div key={player.id} className="text-gray-600 text-xs sm:text-sm">
                                    {player.name}
                                    {player.isPro && <span className="text-yellow-600 ml-1">(Pro)</span>}
                                    {player.isJunior && <span className="text-blue-600 ml-1">(Jnr)</span>}
                                  </div>
                                ))}
                              </div>
                              <div className="min-w-0">
                                <div className="font-medium text-gray-700">{teamB?.name}</div>
                                {teamBPlayers.map(player => (
                                  <div key={player.id} className="text-gray-600 text-xs sm:text-sm">
                                    {player.name}
                                    {player.isPro && <span className="text-yellow-600 ml-1">(Pro)</span>}
                                    {player.isJunior && <span className="text-blue-600 ml-1">(Jnr)</span>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Match info and actions */}
                      <div className="flex flex-col space-y-2 pt-2 border-t border-gray-100">
                        <div className="text-xs text-gray-600 text-center">
                          {match.date} • {match.teeTime} • Tee {match.tee}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="text-left">
                            <div className="text-xs font-medium text-gray-900">
                              {match.isBye ? 'BYE' : calculateMatchResult(match)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {match.session} Session
                            </div>
                          </div>
                          
                          <Link 
                            href={`/match/${match.id}`}
                            className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-xs"
                          >
                            <span className="font-medium">View</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Tournament Information */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700">
          <h2 className="text-xl font-bold text-white">Tournament Schedule</h2>
        </div>
        <div className="p-6">
          <div className="text-center py-8">
            <Calendar className="w-16 h-16 text-blue-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-4">Tournament Dates</h3>
            
            <div className="grid gap-4 md:grid-cols-3">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="font-medium text-blue-900 mb-2">Friday, Aug 22</div>
                <div className="text-sm text-blue-800">
                  <div>7:30 AM - 4BBB</div>
                  <div>1:30 PM - Foursomes</div>
                </div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4">
                <div className="font-medium text-green-900 mb-2">Saturday, Aug 23</div>
                <div className="text-sm text-green-800">
                  <div>7:30 AM - 4BBB</div>
                  <div>1:30 PM - Foursomes</div>
                </div>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="font-medium text-purple-900 mb-2">Sunday, Aug 24</div>
                <div className="text-sm text-purple-800">
                  <div>6:38 AM - Singles</div>
                  <div>11:30 AM - Trophy/Shield</div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 bg-yellow-50 rounded-lg p-4">
              <div className="text-sm text-yellow-800">
                <div className="font-medium mb-1">🏌️ All matches are being played at Muthaiga Golf Club</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}