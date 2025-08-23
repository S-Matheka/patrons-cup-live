'use client';

import { useState, useEffect } from 'react';

import { Match, Team, Player } from '@/types';
import { useTournament } from '@/context/TournamentContextSwitcher';
import { X, Save, Calendar, Clock, Users, MapPin, UserPlus, UserMinus, AlertCircle } from 'lucide-react';

interface MatchEditModalProps {
  match: Match | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (match: Match) => void;
}

export default function MatchEditModal({ match, isOpen, onClose, onSave }: MatchEditModalProps) {
  const { teams, players } = useTournament();

  // Helper function to get the same players that the schedule displays
  const getScheduleDisplayPlayers = (match: Match, teamId: number | null, count: number = 2) => {
    if (!teamId) return [];
    const teamPlayers = players.filter(player => player.teamId === teamId);
    
    if (teamPlayers.length === 0) return [];
    
    // Use the same logic as the schedule page to show consistent players
    const startIndex = (match.id * teamId) % teamPlayers.length;
    const selectedPlayers = [];
    
    for (let i = 0; i < count && i < teamPlayers.length; i++) {
      const playerIndex = (startIndex + i) % teamPlayers.length;
      selectedPlayers.push(teamPlayers[playerIndex]);
    }
    
    return selectedPlayers;
  };
  const [formData, setFormData] = useState<Partial<Match>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedPlayers, setSelectedPlayers] = useState<{
    teamA: string[];
    teamB: string[];
    teamC: string[];
  }>({ teamA: [], teamB: [], teamC: [] });

  useEffect(() => {
    if (match) {
      setFormData({
        ...match,
        players: match.players || { teamA: [], teamB: [], teamC: [] }
      });
      
      // Initialize selected players to show the same players as the schedule
      const playersPerTeam = match.type === 'Singles' ? 1 : 2;
      
      // Get the display players (same as schedule shows)
      const teamADisplayPlayers = getScheduleDisplayPlayers(match, match.teamAId, playersPerTeam);
      const teamBDisplayPlayers = getScheduleDisplayPlayers(match, match.teamBId, playersPerTeam);
      const teamCDisplayPlayers = match.teamCId ? getScheduleDisplayPlayers(match, match.teamCId, playersPerTeam) : [];
      
      // Check if match has real player assignments already, otherwise use display players
      const getPlayerIds = (matchPlayers: string[] | undefined, displayPlayers: any[]) => {
        if (matchPlayers && matchPlayers.length > 0) {
          // Try to resolve existing assignments
          const resolvedIds = matchPlayers.map(playerIdentifier => {
            const existingPlayer = players.find(p => p.id.toString() === playerIdentifier || p.name === playerIdentifier);
            return existingPlayer ? existingPlayer.id.toString() : '';
          }).filter(id => id !== '');
          
          // If we successfully resolved some players, use them; otherwise fall back to display players
          if (resolvedIds.length > 0) {
            return resolvedIds;
          }
        }
        // Use display players as default (same as schedule shows)
        return displayPlayers.map(p => p.id.toString());
      };
      
      setSelectedPlayers({
        teamA: getPlayerIds(match.players?.teamA, teamADisplayPlayers),
        teamB: getPlayerIds(match.players?.teamB, teamBDisplayPlayers),
        teamC: getPlayerIds(match.players?.teamC, teamCDisplayPlayers)
      });
    } else {
      // New match defaults
      setFormData({
        gameNumber: 0,
        division: 'Trophy',
        type: '4BBB',
        session: 'Friday AM',
        date: '2025-08-22',
        teeTime: '07:00 AM',
        tee: 1,
        status: 'scheduled',
        teamAId: null,
        teamBId: null,
        teamCId: null,
        isBye: false,
        isThreeWay: false,
        isPro: false,
        players: { teamA: [], teamB: [], teamC: [] }
      });
      setSelectedPlayers({ teamA: [], teamB: [], teamC: [] });
    }
    setErrors({});
  }, [match, players]);

  // Helper functions for player management
  const getTeamPlayers = (teamId: number | null): Player[] => {
    if (!teamId) return [];
    return players.filter(player => player.teamId === teamId);
  };

  const getPlayersPerTeam = (): number => {
    return formData.type === 'Singles' ? 1 : 2;
  };

  const addPlayerToTeam = (team: 'teamA' | 'teamB' | 'teamC', playerId: string) => {
    const maxPlayers = getPlayersPerTeam();
    const currentPlayers = selectedPlayers[team];
    
    if (currentPlayers.length >= maxPlayers) {
      setErrors({ ...errors, [`${team}Players`]: `Maximum ${maxPlayers} players allowed for ${formData.type}` });
      return;
    }
    
    if (currentPlayers.includes(playerId)) return;
    
    const newSelectedPlayers = {
      ...selectedPlayers,
      [team]: [...currentPlayers, playerId]
    };
    
    setSelectedPlayers(newSelectedPlayers);
    setFormData({
      ...formData,
      players: newSelectedPlayers
    });
    
    // Clear any existing error
    const newErrors = { ...errors };
    delete newErrors[`${team}Players`];
    setErrors(newErrors);
  };

  const removePlayerFromTeam = (team: 'teamA' | 'teamB' | 'teamC', playerId: string) => {
    const newSelectedPlayers = {
      ...selectedPlayers,
      [team]: selectedPlayers[team].filter(id => id !== playerId)
    };
    
    setSelectedPlayers(newSelectedPlayers);
    setFormData({
      ...formData,
      players: newSelectedPlayers
    });
  };

  const getPlayerName = (playerId: string): string => {
    // First try to find by ID
    const playerById = players.find(p => p.id.toString() === playerId);
    if (playerById) return playerById.name;
    
    // If not found by ID, try to find by name (for legacy data)
    const playerByName = players.find(p => p.name === playerId);
    if (playerByName) return playerByName.name;
    
    // If still not found, return the playerId as-is (might be a placeholder)
    return playerId || 'Unknown Player';
  };

  const isPlayerSelected = (playerId: string): boolean => {
    return Object.values(selectedPlayers).some(teamPlayers => 
      teamPlayers.includes(playerId) || 
      teamPlayers.includes(playerId.toString())
    );
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.gameNumber || formData.gameNumber <= 0) {
      newErrors.gameNumber = 'Game number is required';
    }
    if (!formData.division) {
      newErrors.division = 'Division is required';
    }
    if (!formData.type) {
      newErrors.type = 'Match type is required';
    }
    if (!formData.date) {
      newErrors.date = 'Date is required';
    }
    if (!formData.teeTime) {
      newErrors.teeTime = 'Tee time is required';
    }
    if (!formData.teamAId && !formData.isBye) {
      newErrors.teamAId = 'Team A is required';
    }
    if (!formData.teamBId && !formData.isBye) {
      newErrors.teamBId = 'Team B is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Prepare player data - use selected players (can be empty arrays to show blank)
      const updatedPlayers = {
        teamA: selectedPlayers.teamA || [],
        teamB: selectedPlayers.teamB || [],
        teamC: selectedPlayers.teamC || []
      };

      // Prepare match data - exclude ID for new records
      const matchData = {
        game_number: formData.gameNumber,
        division: formData.division,
        match_type: formData.type, // Correct column name
        session: formData.session,
        match_date: formData.date, // Correct column name
        tee_time: formData.teeTime, // Now expects TIME format (HH:MM:SS or HH:MM)
        tee: formData.tee,
        course: formData.course || 'Muthaiga Golf Club', // Default course
        status: formData.status,
        team_a_id: formData.teamAId,
        team_b_id: formData.teamBId,
        team_c_id: formData.teamCId,
        is_bye: formData.isBye,
        is_three_way: formData.isThreeWay,
        is_pro: formData.isPro,
        players: updatedPlayers,
        updated_at: new Date().toISOString()
        // Note: ID is intentionally excluded - it should be auto-generated for new records
      };

      // Use server-side API for admin operations
      let result;
      if (match?.id) {
        // Update existing match
        const response = await fetch('/api/admin/matches', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: match.id, ...matchData })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('❌ API Error Response:', errorData);
          throw new Error(errorData.error || `HTTP ${response.status}: Failed to update match`);
        }
        
        result = await response.json();
      } else {
        // Create new match
        const response = await fetch('/api/admin/matches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(matchData)
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('❌ API Error Response:', errorData);
          throw new Error(errorData.error || `HTTP ${response.status}: Failed to create match`);
        }
        
        result = await response.json();
      }

      // Convert back to frontend format
      const savedMatch: Match = {
        id: result.data.id,
        gameNumber: result.data.game_number,
        division: result.data.division,
        type: result.data.match_type, // Correct column name
        session: result.data.session,
        date: result.data.match_date, // Correct column name
        teeTime: result.data.tee_time,
        tee: result.data.tee,
        course: result.data.course, // Add course field
        status: result.data.status,
        teamAId: result.data.team_a_id,
        teamBId: result.data.team_b_id,
        teamCId: result.data.team_c_id,
        isBye: result.data.is_bye,
        isThreeWay: result.data.is_three_way,
        isPro: result.data.is_pro,
        players: result.data.players,
        holes: match?.holes || []
      };

      onSave(savedMatch);
      
      // Force a UI refresh to ensure the changes are visible
      console.log('✅ Match saved successfully, refreshing UI...');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
      onClose();
    } catch (error) {
      console.error('Error saving match:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      let errorMessage = 'Failed to save match. Please try again.';
      if (error && typeof error === 'object') {
        if ('message' in error && error.message) {
          errorMessage = `Failed to save match: ${error.message}`;
        } else if ('details' in error && error.details) {
          errorMessage = `Failed to save match: ${error.details}`;
        }
      }
      
      setErrors({ general: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!match?.id) return;
    
    if (!confirm('Are you sure you want to delete this match? This action cannot be undone.')) {
      return;
    }

    setIsLoading(true);
    try {
      const adminClient = getAdminClient();
      if (!adminClient) {
        throw new Error('Admin client not available');
      }

      const { error } = await adminClient
        .from('matches')
        .delete()
        .eq('id', match.id);

      if (error) throw error;

      onClose();
      // The real-time subscription will handle updating the UI
    } catch (error) {
      console.error('Error deleting match:', error);
      setErrors({ general: 'Failed to delete match. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {match ? 'Edit Match' : 'Add New Match'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {errors.general && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {errors.general}
          </div>
        )}

        <div className="space-y-4 max-h-[600px] overflow-y-auto">
          {/* Game Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Game Number</label>
            <input
              type="number"
              className={`mt-1 block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                errors.gameNumber ? 'border-red-300' : 'border-gray-300'
              }`}
              value={formData.gameNumber || ''}
              onChange={(e) => setFormData({ ...formData, gameNumber: parseInt(e.target.value) || 0 })}
            />
            {errors.gameNumber && <p className="text-red-500 text-sm mt-1">{errors.gameNumber}</p>}
          </div>

          {/* Division */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Division</label>
            <select
              className={`mt-1 block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                errors.division ? 'border-red-300' : 'border-gray-300'
              }`}
              value={formData.division || ''}
              onChange={(e) => setFormData({ ...formData, division: e.target.value })}
            >
              <option value="">Select Division</option>
              <option value="Trophy">Trophy</option>
              <option value="Shield">Shield</option>
              <option value="Plaque">Plaque</option>
              <option value="Bowl">Bowl</option>
              <option value="Mug">Mug</option>
            </select>
            {errors.division && <p className="text-red-500 text-sm mt-1">{errors.division}</p>}
          </div>

          {/* Match Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Match Type</label>
            <select
              className={`mt-1 block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                errors.type ? 'border-red-300' : 'border-gray-300'
              }`}
              value={formData.type || ''}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              <option value="">Select Type</option>
              <option value="4BBB">4BBB</option>
              <option value="Foursomes">Foursomes</option>
              <option value="Singles">Singles</option>
            </select>
            {errors.type && <p className="text-red-500 text-sm mt-1">{errors.type}</p>}
          </div>

          {/* Session */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Session</label>
            <select
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              value={formData.session || ''}
              onChange={(e) => setFormData({ ...formData, session: e.target.value })}
            >
              <option value="Friday AM">Friday AM</option>
              <option value="Friday PM">Friday PM</option>
              <option value="Saturday AM">Saturday AM</option>
              <option value="Saturday PM">Saturday PM</option>
              <option value="Sunday AM">Sunday AM</option>
              <option value="Sunday PM">Sunday PM</option>
            </select>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <input
                type="date"
                className={`mt-1 block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.date ? 'border-red-300' : 'border-gray-300'
                }`}
                value={formData.date || ''}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
              {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Tee Time</label>
              <input
                type="text"
                placeholder="07:00 AM"
                className={`mt-1 block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.teeTime ? 'border-red-300' : 'border-gray-300'
                }`}
                value={formData.teeTime || ''}
                onChange={(e) => setFormData({ ...formData, teeTime: e.target.value })}
              />
              {errors.teeTime && <p className="text-red-500 text-sm mt-1">{errors.teeTime}</p>}
            </div>
          </div>

          {/* Tee */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Tee</label>
            <select
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              value={formData.tee || 1}
              onChange={(e) => setFormData({ ...formData, tee: parseInt(e.target.value) })}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(tee => (
                <option key={tee} value={tee}>Tee {tee}</option>
              ))}
            </select>
          </div>

          {/* Teams */}
          <div className={`grid gap-4 ${formData.isThreeWay ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-2'}`}>
            <div>
              <label className="block text-sm font-medium text-gray-700">Team A</label>
              <select
                className={`mt-1 block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.teamAId ? 'border-red-300' : 'border-gray-300'
                }`}
                value={formData.teamAId || ''}
                onChange={(e) => setFormData({ ...formData, teamAId: parseInt(e.target.value) || null })}
                disabled={formData.isBye}
              >
                <option value="">Select Team A</option>
                {teams.filter(t => t.division === formData.division).map(team => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
              {errors.teamAId && <p className="text-red-500 text-sm mt-1">{errors.teamAId}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Team B</label>
              <select
                className={`mt-1 block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.teamBId ? 'border-red-300' : 'border-gray-300'
                }`}
                value={formData.teamBId || ''}
                onChange={(e) => setFormData({ ...formData, teamBId: parseInt(e.target.value) || null })}
                disabled={formData.isBye}
              >
                <option value="">Select Team B</option>
                {teams.filter(t => t.division === formData.division).map(team => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
              {errors.teamBId && <p className="text-red-500 text-sm mt-1">{errors.teamBId}</p>}
            </div>
            {formData.isThreeWay && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Team C</label>
                <select
                  className={`mt-1 block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    errors.teamCId ? 'border-red-300' : 'border-gray-300'
                  }`}
                  value={formData.teamCId || ''}
                  onChange={(e) => setFormData({ ...formData, teamCId: parseInt(e.target.value) || null })}
                  disabled={formData.isBye}
                >
                  <option value="">Select Team C</option>
                  {teams.filter(t => t.division === formData.division).map(team => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
                {errors.teamCId && <p className="text-red-500 text-sm mt-1">{errors.teamCId}</p>}
              </div>
            )}
          </div>

                  {/* Player Selection Section */}
        {!formData.isBye && (
          <div className="border-t pt-4">
            <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Player Selection ({getPlayersPerTeam()} players per team for {formData.type})
            </h4>

            {/* Current Assignments Display - Show same players as schedule */}
            {match && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h5 className="text-sm font-medium text-blue-800 mb-3 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Current Player Assignments (as shown in schedule)
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {formData.teamAId && (
                    <div>
                      <span className="font-medium text-gray-700">
                        {teams.find(t => t.id === formData.teamAId)?.name || 'Team A'}:
                      </span>
                      <span className="ml-2 text-gray-600">
                        {getScheduleDisplayPlayers(match, formData.teamAId, formData.type === 'Singles' ? 1 : 2)
                          .map(p => p.name).join(', ') || 'None assigned'}
                      </span>
                    </div>
                  )}
                  {formData.teamBId && (
                    <div>
                      <span className="font-medium text-gray-700">
                        {teams.find(t => t.id === formData.teamBId)?.name || 'Team B'}:
                      </span>
                      <span className="ml-2 text-gray-600">
                        {getScheduleDisplayPlayers(match, formData.teamBId, formData.type === 'Singles' ? 1 : 2)
                          .map(p => p.name).join(', ') || 'None assigned'}
                      </span>
                    </div>
                  )}
                  {formData.isThreeWay && formData.teamCId && (
                    <div>
                      <span className="font-medium text-gray-700">
                        {teams.find(t => t.id === formData.teamCId)?.name || 'Team C'}:
                      </span>
                      <span className="ml-2 text-gray-600">
                        {getScheduleDisplayPlayers(match, formData.teamCId, formData.type === 'Singles' ? 1 : 2)
                          .map(p => p.name).join(', ') || 'None assigned'}
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-blue-700 mt-2">
                  💡 These are the players currently shown in the schedule. You can modify them below.
                </p>
              </div>
            )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Team A Players */}
                {formData.teamAId && (
                  <div className="space-y-3">
                    <h5 className="font-medium text-gray-800">
                      {teams.find(t => t.id === formData.teamAId)?.name || 'Team A'} Players
                    </h5>
                    
                    {/* Selected Players */}
                    <div className="bg-green-50 rounded-lg p-3 min-h-[60px]">
                      <div className="text-sm font-medium text-green-800 mb-2">
                        Selected ({selectedPlayers.teamA.length}/{getPlayersPerTeam()})
                      </div>
                      {selectedPlayers.teamA.length > 0 ? (
                        <div className="space-y-2">
                          {selectedPlayers.teamA.map(playerId => (
                            <div key={playerId} className="flex items-center justify-between bg-white rounded px-3 py-2">
                              <span className="text-sm font-medium">{getPlayerName(playerId)}</span>
                              <button
                                type="button"
                                onClick={() => removePlayerFromTeam('teamA', playerId)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <UserMinus className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-green-600 italic">
                          {getTeamPlayers(formData.teamAId).length > 0 
                            ? 'Click + to add players from available list below' 
                            : 'No players available for this team'}
                        </div>
                      )}
                    </div>
                    
                    {/* Available Players */}
                                                <div>
                                <div className="text-sm font-medium text-gray-700 mb-2">
                                    All Team Players ({getTeamPlayers(formData.teamAId).length} total)
                                </div>
                                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                                    {getTeamPlayers(formData.teamAId).map(player => {
                                        const isSelected = isPlayerSelected(player.id.toString());
                                        const canAdd = selectedPlayers.teamA.length < getPlayersPerTeam();
                                        const canRemove = isSelected && selectedPlayers.teamA.includes(player.id.toString());
                                        
                                        return (
                                            <div
                                                key={player.id}
                                                className={`flex items-center justify-between px-3 py-2 text-sm border-b border-gray-100 last:border-b-0 ${
                                                    isSelected ? 'bg-green-50' : 'bg-white hover:bg-gray-50'
                                                }`}
                                            >
                                                <div className="flex items-center space-x-2 flex-1">
                                                    <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                                    <span className={`font-medium ${isSelected ? 'text-green-800' : 'text-gray-700'}`}>
                                                        {player.name}
                                                    </span>
                                                    {player.isPro && <span className="text-yellow-600 text-xs">(Pro)</span>}
                                                    {player.isJunior && <span className="text-blue-600 text-xs">(Jnr)</span>}
                                                </div>
                                                <div className="flex items-center space-x-1">
                                                    {isSelected ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => removePlayerFromTeam('teamA', player.id.toString())}
                                                            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                                                            title="Remove from match"
                                                        >
                                                            <UserMinus className="w-4 h-4" />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => addPlayerToTeam('teamA', player.id.toString())}
                                                            disabled={!canAdd}
                                                            className={`p-1 rounded ${
                                                                canAdd 
                                                                    ? 'text-green-600 hover:text-green-800 hover:bg-green-50' 
                                                                    : 'text-gray-400 cursor-not-allowed'
                                                            }`}
                                                            title={canAdd ? "Add to match" : "Maximum players selected"}
                                                        >
                                                            <UserPlus className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {getTeamPlayers(formData.teamAId).length === 0 && (
                                        <div className="px-3 py-4 text-center text-gray-500 text-sm">
                                            No players found for this team
                                        </div>
                                    )}
                                </div>
                            </div>
                    
                    {errors.teamAPlayers && (
                      <p className="text-red-500 text-sm">{errors.teamAPlayers}</p>
                    )}
                  </div>
                )}

                {/* Team B Players */}
                {formData.teamBId && (
                  <div className="space-y-3">
                    <h5 className="font-medium text-gray-800">
                      {teams.find(t => t.id === formData.teamBId)?.name || 'Team B'} Players
                    </h5>
                    
                    {/* Selected Players */}
                    <div className="bg-blue-50 rounded-lg p-3 min-h-[60px]">
                      <div className="text-sm font-medium text-blue-800 mb-2">
                        Selected ({selectedPlayers.teamB.length}/{getPlayersPerTeam()})
                      </div>
                      {selectedPlayers.teamB.length > 0 ? (
                        <div className="space-y-2">
                          {selectedPlayers.teamB.map(playerId => (
                            <div key={playerId} className="flex items-center justify-between bg-white rounded px-3 py-2">
                              <span className="text-sm font-medium">{getPlayerName(playerId)}</span>
                              <button
                                type="button"
                                onClick={() => removePlayerFromTeam('teamB', playerId)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <UserMinus className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-blue-600 italic">
                          {getTeamPlayers(formData.teamBId).length > 0 
                            ? 'Click + to add players from available list below' 
                            : 'No players available for this team'}
                        </div>
                      )}
                    </div>
                    
                    {/* Available Players */}
                                                <div>
                                <div className="text-sm font-medium text-gray-700 mb-2">
                                    All Team Players ({getTeamPlayers(formData.teamBId).length} total)
                                </div>
                                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                                    {getTeamPlayers(formData.teamBId).map(player => {
                                        const isSelected = isPlayerSelected(player.id.toString());
                                        const canAdd = selectedPlayers.teamB.length < getPlayersPerTeam();
                                        const canRemove = isSelected && selectedPlayers.teamB.includes(player.id.toString());
                                        
                                        return (
                                            <div
                                                key={player.id}
                                                className={`flex items-center justify-between px-3 py-2 text-sm border-b border-gray-100 last:border-b-0 ${
                                                    isSelected ? 'bg-blue-50' : 'bg-white hover:bg-gray-50'
                                                }`}
                                            >
                                                <div className="flex items-center space-x-2 flex-1">
                                                    <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                                                    <span className={`font-medium ${isSelected ? 'text-blue-800' : 'text-gray-700'}`}>
                                                        {player.name}
                                                    </span>
                                                    {player.isPro && <span className="text-yellow-600 text-xs">(Pro)</span>}
                                                    {player.isJunior && <span className="text-blue-600 text-xs">(Jnr)</span>}
                                                </div>
                                                <div className="flex items-center space-x-1">
                                                    {isSelected ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => removePlayerFromTeam('teamB', player.id.toString())}
                                                            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                                                            title="Remove from match"
                                                        >
                                                            <UserMinus className="w-4 h-4" />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => addPlayerToTeam('teamB', player.id.toString())}
                                                            disabled={!canAdd}
                                                            className={`p-1 rounded ${
                                                                canAdd 
                                                                    ? 'text-blue-600 hover:text-blue-800 hover:bg-blue-50' 
                                                                    : 'text-gray-400 cursor-not-allowed'
                                                            }`}
                                                            title={canAdd ? "Add to match" : "Maximum players selected"}
                                                        >
                                                            <UserPlus className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {getTeamPlayers(formData.teamBId).length === 0 && (
                                        <div className="px-3 py-4 text-center text-gray-500 text-sm">
                                            No players found for this team
                                        </div>
                                    )}
                                </div>
                            </div>
                    
                    {errors.teamBPlayers && (
                      <p className="text-red-500 text-sm">{errors.teamBPlayers}</p>
                    )}
                  </div>
                )}

                {/* Team C Players (for three-way matches) */}
                {formData.isThreeWay && formData.teamCId && (
                  <div className="space-y-3 md:col-span-2">
                    <h5 className="font-medium text-gray-800">
                      {teams.find(t => t.id === formData.teamCId)?.name || 'Team C'} Players
                    </h5>
                    
                    {/* Selected Players */}
                    <div className="bg-purple-50 rounded-lg p-3 min-h-[60px]">
                      <div className="text-sm font-medium text-purple-800 mb-2">
                        Selected ({selectedPlayers.teamC.length}/{getPlayersPerTeam()})
                      </div>
                      {selectedPlayers.teamC.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {selectedPlayers.teamC.map(playerId => (
                            <div key={playerId} className="flex items-center justify-between bg-white rounded px-3 py-2">
                              <span className="text-sm font-medium">{getPlayerName(playerId)}</span>
                              <button
                                type="button"
                                onClick={() => removePlayerFromTeam('teamC', playerId)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <UserMinus className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-purple-600 italic">
                          {getTeamPlayers(formData.teamCId).length > 0 
                            ? 'Click + to add players from available list below' 
                            : 'No players available for this team'}
                        </div>
                      )}
                    </div>
                    
                    {/* Available Players */}
                                                <div>
                                <div className="text-sm font-medium text-gray-700 mb-2">
                                    All Team Players ({getTeamPlayers(formData.teamCId).length} total)
                                </div>
                                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                                    {getTeamPlayers(formData.teamCId).map(player => {
                                        const isSelected = isPlayerSelected(player.id.toString());
                                        const canAdd = selectedPlayers.teamC.length < getPlayersPerTeam();
                                        const canRemove = isSelected && selectedPlayers.teamC.includes(player.id.toString());
                                        
                                        return (
                                            <div
                                                key={player.id}
                                                className={`flex items-center justify-between px-3 py-2 text-sm border-b border-gray-100 last:border-b-0 ${
                                                    isSelected ? 'bg-purple-50' : 'bg-white hover:bg-gray-50'
                                                }`}
                                            >
                                                <div className="flex items-center space-x-2 flex-1">
                                                    <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-purple-500' : 'bg-gray-300'}`}></div>
                                                    <span className={`font-medium ${isSelected ? 'text-purple-800' : 'text-gray-700'}`}>
                                                        {player.name}
                                                    </span>
                                                    {player.isPro && <span className="text-yellow-600 text-xs">(Pro)</span>}
                                                    {player.isJunior && <span className="text-blue-600 text-xs">(Jnr)</span>}
                                                </div>
                                                <div className="flex items-center space-x-1">
                                                    {isSelected ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => removePlayerFromTeam('teamC', player.id.toString())}
                                                            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                                                            title="Remove from match"
                                                        >
                                                            <UserMinus className="w-4 h-4" />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => addPlayerToTeam('teamC', player.id.toString())}
                                                            disabled={!canAdd}
                                                            className={`p-1 rounded ${
                                                                canAdd 
                                                                    ? 'text-purple-600 hover:text-purple-800 hover:bg-purple-50' 
                                                                    : 'text-gray-400 cursor-not-allowed'
                                                            }`}
                                                            title={canAdd ? "Add to match" : "Maximum players selected"}
                                                        >
                                                            <UserPlus className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {getTeamPlayers(formData.teamCId).length === 0 && (
                                        <div className="px-3 py-4 text-center text-gray-500 text-sm">
                                            No players found for this team
                                        </div>
                                    )}
                                </div>
                            </div>
                    
                    {errors.teamCPlayers && (
                      <p className="text-red-500 text-sm">{errors.teamCPlayers}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Checkboxes */}
          <div className="flex space-x-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                checked={formData.isBye || false}
                onChange={(e) => setFormData({ ...formData, isBye: e.target.checked })}
              />
              <span className="ml-2 text-sm text-gray-700">BYE Match</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                checked={formData.isPro || false}
                onChange={(e) => setFormData({ ...formData, isPro: e.target.checked })}
              />
              <span className="ml-2 text-sm text-gray-700">Pro Match</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                checked={formData.isThreeWay || false}
                onChange={(e) => setFormData({ ...formData, isThreeWay: e.target.checked })}
              />
              <span className="ml-2 text-sm text-gray-700">Three-way Match</span>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between mt-6">
          <div>
            {match?.id && (
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                Delete Match
              </button>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center"
            >
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save Match'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
