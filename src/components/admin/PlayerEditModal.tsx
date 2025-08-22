'use client';

import { useState, useEffect } from 'react';
import { getAdminClient } from '@/lib/supabase-admin';
import { Player, Team } from '@/types';
import { useTournament } from '@/context/TournamentContext';
import { X, Save, User, UserPlus } from 'lucide-react';

interface PlayerEditModalProps {
  player: Player | null;
  teamId?: number;
  isOpen: boolean;
  onClose: () => void;
  onSave: (player: Player) => void;
}

export default function PlayerEditModal({ player, teamId, isOpen, onClose, onSave }: PlayerEditModalProps) {
  const { teams } = useTournament();
  const [formData, setFormData] = useState<Partial<Player>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (player) {
      setFormData(player);
    } else {
      // New player defaults - ensure completely clean slate
      const cleanFormData = {
        name: '',
        teamId: teamId || 0,
        isPro: false,
        isExOfficio: false,
        isJunior: false,
        position: 'Regular Player'
      };
      // Explicitly ensure no ID field exists
      delete (cleanFormData as any).id;
      setFormData(cleanFormData);
    }
    setErrors({});
  }, [player, teamId]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Player name is required';
    }
    if (!formData.teamId || formData.teamId <= 0) {
      newErrors.teamId = 'Team is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    console.log('🔄 Starting save process...', { formData });
    
    if (!validateForm()) {
      console.log('❌ Validation failed', errors);
      return;
    }

    setIsLoading(true);
    try {
      // Prepare player data - NEVER include ID for new records
      const playerData = {
        name: formData.name?.trim(),
        team_id: formData.teamId,
        is_pro: formData.isPro || false,
        is_ex_officio: formData.isExOfficio || false,
        is_junior: formData.isJunior || false,
        position: formData.position || 'Regular Player',
        updated_at: new Date().toISOString()
      };
      
      // Explicitly remove any ID field that might exist
      delete (playerData as any).id;

      console.log('📊 Player data to save:', playerData);
      
      const adminClient = getAdminClient();
      if (!adminClient) {
        throw new Error('Admin client not available');
      }

      let result;
      if (player?.id) {
        // Update existing player
        console.log('🔄 Updating existing player:', player.id);
        result = await adminClient
          .from('players')
          .update(playerData)
          .eq('id', player.id)
          .select()
          .single();
      } else {
        // Create new player - ensure absolutely no ID is included
        console.log('🔄 Creating new player');
        console.log('📊 Data being inserted:', playerData);
        
        result = await adminClient
          .from('players')
          .insert(playerData)
          .select()
          .single();
      }
      
      console.log('📊 Database result:', result);

      if (result.error) throw result.error;

      // Convert back to frontend format
      const savedPlayer: Player = {
        id: result.data.id,
        name: result.data.name,
        teamId: result.data.team_id,
        isPro: result.data.is_pro || false,
        isExOfficio: result.data.is_ex_officio || false,
        isJunior: result.data.is_junior || false,
        position: result.data.position
      };

      console.log('✅ Player saved successfully:', savedPlayer);
      onSave(savedPlayer);
      onClose();
      
    } catch (error) {
      console.error('❌ Error saving player:', error);
      let errorMessage = 'Failed to save player. Please try again.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = (error as any).message;
      }
      
      setErrors({ general: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!player?.id) return;
    
    if (!confirm('Are you sure you want to delete this player? This action cannot be undone.')) {
      return;
    }

    setIsLoading(true);
    try {
          const adminClient = getAdminClient();
    if (!adminClient) {
      throw new Error('Admin client not available');
    }

    const { error } = await adminClient
      .from('players')
      .delete()
      .eq('id', player.id);

      if (error) throw error;

      onClose();
      // The real-time subscription will handle updating the UI
    } catch (error) {
      console.error('Error deleting player:', error);
      setErrors({ general: 'Failed to delete player. Please try again.' });
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
            {player ? 'Edit Player' : 'Add New Player'}
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
          {/* Player Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Player Name *</label>
            <input
              type="text"
              className={`mt-1 block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter player name"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          {/* Team */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Team *</label>
            <select
              className={`mt-1 block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                errors.teamId ? 'border-red-300' : 'border-gray-300'
              }`}
              value={formData.teamId || ''}
              onChange={(e) => setFormData({ ...formData, teamId: parseInt(e.target.value) || 0 })}
            >
              <option value="">Select Team</option>
              {teams.map(team => (
                <option key={team.id} value={team.id}>
                  {team.name} ({team.division})
                </option>
              ))}
            </select>
            {errors.teamId && <p className="text-red-500 text-sm mt-1">{errors.teamId}</p>}
          </div>





          {/* Position/Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Position/Role</label>
            <select
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              value={formData.position || ''}
              onChange={(e) => {
                const position = e.target.value;
                setFormData({ 
                  ...formData, 
                  position,
                  // Auto-set designations based on position
                  isPro: position === 'Professional Player (Pro)',
                  isExOfficio: position === 'Ex-Officio Member',
                  isJunior: position === 'Junior Player'
                });
              }}
            >
              <option value="">Select Position</option>
              <option value="Captain">Captain</option>
              <option value="Vice Captain">Vice Captain</option>
              <option value="Lady Player">Lady Player</option>
              <option value="Medical Professional">Medical Professional</option>
              <option value="Professional Player (Pro)">Professional Player (Pro)</option>
              <option value="Ex-Officio Member">Ex-Officio Member</option>
              <option value="Junior Player">Junior Player</option>
              <option value="Regular Player">Regular Player</option>
            </select>
          </div>


        </div>

        {/* Action Buttons */}
        <div className="flex justify-between mt-6">
          <div>
            {player?.id && (
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                Delete Player
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
              {isLoading ? 'Saving...' : 'Save Player'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
