'use client';

import { useState, useEffect } from 'react';
import { getAdminClient } from '@/lib/supabase-admin';
import { Team } from '@/types';
import { useTournament } from '@/context/TournamentContext';
import { X, Save, Users, Trophy } from 'lucide-react';

interface TeamEditModalProps {
  team: Team | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (team: Team) => void;
}

export default function TeamEditModal({ team, isOpen, onClose, onSave }: TeamEditModalProps) {
  const { teams } = useTournament();
  const [formData, setFormData] = useState<Partial<Team>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (team) {
      setFormData(team);
    } else {
      // New team defaults
      setFormData({
        name: '',
        division: 'Trophy',
        seed: 1,
        totalPlayers: 12,
        maxPointsAvailable: 36,
        sessionPoints: {
          friAM4BBB: 6,
          friPMFoursomes: 6,
          satAM4BBB: 6,
          satPMFoursomes: 6,
          sunAMSingles: 6,
          sunPMSingles: 6
        },
        playersPerSession: {
          friAM4BBB: 4,
          friPMFoursomes: 4,
          satAM4BBB: 4,
          satPMFoursomes: 4,
          sunAMSingles: 6,
          sunPMSingles: 6
        },
        restingPerSession: {
          friAM4BBB: 8,
          friPMFoursomes: 8,
          satAM4BBB: 8,
          satPMFoursomes: 8,
          sunAMSingles: 6,
          sunPMSingles: 6
        },
        pointsPerMatch: {
          friAM4BBB: 1,
          friPMFoursomes: 1,
          satAM4BBB: 1,
          satPMFoursomes: 1,
          sunAMSingles: 1,
          sunPMSingles: 1
        }
      });
    }
    setErrors({});
  }, [team]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Team name is required';
    }
    if (!formData.division) {
      newErrors.division = 'Division is required';
    }
    if (!formData.seed || formData.seed <= 0) {
      newErrors.seed = 'Seed must be a positive number';
    }
    if (!formData.totalPlayers || formData.totalPlayers <= 0) {
      newErrors.totalPlayers = 'Total players must be a positive number';
    }

    // Check if seed is unique within division
    const existingTeam = teams.find(t => 
      t.division === formData.division && 
      t.seed === formData.seed && 
      t.id !== team?.id
    );
    if (existingTeam) {
      newErrors.seed = `Seed ${formData.seed} is already taken in ${formData.division} division`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Prepare team data - exclude ID for new records
      const teamData = {
        name: formData.name,
        division: formData.division,
        color: formData.color || '#10B981', // Default color if not provided
        logo: formData.logo || formData.name?.substring(0, 2).toUpperCase() || 'TM', // Default logo
        description: formData.description || null,
        seed: formData.seed,
        total_players: formData.totalPlayers,
        max_points_available: formData.maxPointsAvailable,
        session_points: formData.sessionPoints,
        players_per_session: formData.playersPerSession,
        resting_per_session: formData.restingPerSession,
        points_per_match: formData.pointsPerMatch,
        updated_at: new Date().toISOString()
        // Note: ID is intentionally excluded - it should be auto-generated for new records
      };

      const adminClient = getAdminClient();
      if (!adminClient) {
        throw new Error('Admin client not available');
      }

      let result;
      if (team?.id) {
        // Update existing team
        result = await adminClient
          .from('teams')
          .update(teamData)
          .eq('id', team.id)
          .select()
          .single();
      } else {
        // Create new team
        result = await adminClient
          .from('teams')
          .insert(teamData)
          .select()
          .single();
      }

      if (result.error) throw result.error;

      // Convert back to frontend format
      const savedTeam: Team = {
        id: result.data.id,
        name: result.data.name,
        division: result.data.division,
        color: result.data.color,
        logo: result.data.logo,
        description: result.data.description,
        seed: result.data.seed,
        totalPlayers: result.data.total_players,
        maxPointsAvailable: result.data.max_points_available,
        sessionPoints: result.data.session_points,
        playersPerSession: result.data.players_per_session,
        restingPerSession: result.data.resting_per_session,
        pointsPerMatch: result.data.points_per_match
      };

      onSave(savedTeam);
      onClose();
    } catch (error) {
      console.error('Error saving team:', error);
      setErrors({ general: 'Failed to save team. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!team?.id) return;
    
    if (!confirm('Are you sure you want to delete this team? This will also delete all associated players and matches. This action cannot be undone.')) {
      return;
    }

    setIsLoading(true);
    try {
          const adminClient = getAdminClient();
    if (!adminClient) {
      throw new Error('Admin client not available');
    }

    const { error } = await adminClient
      .from('teams')
      .delete()
      .eq('id', team.id);

      if (error) throw error;

      onClose();
      // The real-time subscription will handle updating the UI
    } catch (error) {
      console.error('Error deleting team:', error);
      setErrors({ general: 'Failed to delete team. Please try again.' });
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
            {team ? 'Edit Team' : 'Add New Team'}
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

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {/* Team Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Team Name</label>
            <input
              type="text"
              className={`mt-1 block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter team name"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
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

          {/* Seed and Total Players */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Seed</label>
              <input
                type="number"
                min="1"
                className={`mt-1 block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.seed ? 'border-red-300' : 'border-gray-300'
                }`}
                value={formData.seed || ''}
                onChange={(e) => setFormData({ ...formData, seed: parseInt(e.target.value) || 0 })}
              />
              {errors.seed && <p className="text-red-500 text-sm mt-1">{errors.seed}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Total Players</label>
              <input
                type="number"
                min="1"
                className={`mt-1 block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.totalPlayers ? 'border-red-300' : 'border-gray-300'
                }`}
                value={formData.totalPlayers || ''}
                onChange={(e) => setFormData({ ...formData, totalPlayers: parseInt(e.target.value) || 0 })}
              />
              {errors.totalPlayers && <p className="text-red-500 text-sm mt-1">{errors.totalPlayers}</p>}
            </div>
          </div>

          {/* Max Points Available */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Max Points Available</label>
            <input
              type="number"
              min="0"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              value={formData.maxPointsAvailable || ''}
              onChange={(e) => setFormData({ ...formData, maxPointsAvailable: parseInt(e.target.value) || 0 })}
            />
          </div>

          {/* Session Points */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Session Points Distribution</label>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <label className="block text-xs text-gray-600">Friday AM 4BBB</label>
                <input
                  type="number"
                  min="0"
                  className="block w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                  value={formData.sessionPoints?.friAM4BBB || 0}
                  onChange={(e) => setFormData({
                    ...formData,
                    sessionPoints: {
                      ...formData.sessionPoints!,
                      friAM4BBB: parseInt(e.target.value) || 0
                    }
                  })}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600">Friday PM Foursomes</label>
                <input
                  type="number"
                  min="0"
                  className="block w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                  value={formData.sessionPoints?.friPMFoursomes || 0}
                  onChange={(e) => setFormData({
                    ...formData,
                    sessionPoints: {
                      ...formData.sessionPoints!,
                      friPMFoursomes: parseInt(e.target.value) || 0
                    }
                  })}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600">Saturday AM 4BBB</label>
                <input
                  type="number"
                  min="0"
                  className="block w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                  value={formData.sessionPoints?.satAM4BBB || 0}
                  onChange={(e) => setFormData({
                    ...formData,
                    sessionPoints: {
                      ...formData.sessionPoints!,
                      satAM4BBB: parseInt(e.target.value) || 0
                    }
                  })}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600">Saturday PM Foursomes</label>
                <input
                  type="number"
                  min="0"
                  className="block w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                  value={formData.sessionPoints?.satPMFoursomes || 0}
                  onChange={(e) => setFormData({
                    ...formData,
                    sessionPoints: {
                      ...formData.sessionPoints!,
                      satPMFoursomes: parseInt(e.target.value) || 0
                    }
                  })}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600">Sunday AM Singles</label>
                <input
                  type="number"
                  min="0"
                  className="block w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                  value={formData.sessionPoints?.sunAMSingles || 0}
                  onChange={(e) => setFormData({
                    ...formData,
                    sessionPoints: {
                      ...formData.sessionPoints!,
                      sunAMSingles: parseInt(e.target.value) || 0
                    }
                  })}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600">Sunday PM Singles</label>
                <input
                  type="number"
                  min="0"
                  className="block w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                  value={formData.sessionPoints?.sunPMSingles || 0}
                  onChange={(e) => setFormData({
                    ...formData,
                    sessionPoints: {
                      ...formData.sessionPoints!,
                      sunPMSingles: parseInt(e.target.value) || 0
                    }
                  })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between mt-6">
          <div>
            {team?.id && (
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                Delete Team
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
              {isLoading ? 'Saving...' : 'Save Team'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
