'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
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
      // New player defaults
      setFormData({
        name: '',
        teamId: teamId || 0,
        handicap: 0,
        isPro: false,
        isExOfficio: false,
        isJunior: false,
        email: '',
        phone: '',
        position: '',
        medicalInfo: ''
      });
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
    if (formData.handicap === undefined || formData.handicap < 0) {
      newErrors.handicap = 'Handicap must be 0 or greater';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const playerData = {
        name: formData.name,
        team_id: formData.teamId,
        handicap: formData.handicap,
        is_pro: formData.isPro,
        is_ex_officio: formData.isExOfficio,
        is_junior: formData.isJunior,
        email: formData.email || null,
        phone: formData.phone || null,
        position: formData.position || null,
        medical_info: formData.medicalInfo || null,
        updated_at: new Date().toISOString()
      };

      let result;
      if (player?.id) {
        // Update existing player
        result = await supabase
          .from('players')
          .update(playerData)
          .eq('id', player.id)
          .select()
          .single();
      } else {
        // Create new player
        result = await supabase
          .from('players')
          .insert(playerData)
          .select()
          .single();
      }

      if (result.error) throw result.error;

      // Convert back to frontend format
      const savedPlayer: Player = {
        id: result.data.id,
        name: result.data.name,
        teamId: result.data.team_id,
        handicap: result.data.handicap,
        isPro: result.data.is_pro,
        isExOfficio: result.data.is_ex_officio,
        isJunior: result.data.is_junior,
        email: result.data.email,
        phone: result.data.phone,
        position: result.data.position,
        medicalInfo: result.data.medical_info
      };

      onSave(savedPlayer);
      onClose();
    } catch (error) {
      console.error('Error saving player:', error);
      setErrors({ general: 'Failed to save player. Please try again.' });
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
      const { error } = await supabase
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

          {/* Handicap */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Handicap *</label>
            <input
              type="number"
              min="0"
              max="54"
              step="0.1"
              className={`mt-1 block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                errors.handicap ? 'border-red-300' : 'border-gray-300'
              }`}
              value={formData.handicap || ''}
              onChange={(e) => setFormData({ ...formData, handicap: parseFloat(e.target.value) || 0 })}
            />
            {errors.handicap && <p className="text-red-500 text-sm mt-1">{errors.handicap}</p>}
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                className={`mt-1 block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                }`}
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="player@email.com"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                type="tel"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+254 xxx xxx xxx"
              />
            </div>
          </div>

          {/* Position/Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Position/Role</label>
            <select
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              value={formData.position || ''}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
            >
              <option value="">Select Position</option>
              <option value="Captain">Captain</option>
              <option value="Vice Captain">Vice Captain</option>
              <option value="Lady Player">Lady Player</option>
              <option value="Medical Professional">Medical Professional</option>
              <option value="Regular Player">Regular Player</option>
            </select>
          </div>

          {/* Player Designations */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Player Designations</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  checked={formData.isPro || false}
                  onChange={(e) => setFormData({ ...formData, isPro: e.target.checked })}
                />
                <span className="ml-2 text-sm text-gray-700">Professional Player (Pro)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  checked={formData.isExOfficio || false}
                  onChange={(e) => setFormData({ ...formData, isExOfficio: e.target.checked })}
                />
                <span className="ml-2 text-sm text-gray-700">Ex-Officio Member</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  checked={formData.isJunior || false}
                  onChange={(e) => setFormData({ ...formData, isJunior: e.target.checked })}
                />
                <span className="ml-2 text-sm text-gray-700">Junior Player</span>
              </label>
            </div>
          </div>

          {/* Medical Information */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Medical Information</label>
            <textarea
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              value={formData.medicalInfo || ''}
              onChange={(e) => setFormData({ ...formData, medicalInfo: e.target.value })}
              placeholder="Any medical conditions, allergies, or special requirements..."
            />
            <p className="text-xs text-gray-500 mt-1">This information is confidential and used for emergency purposes only.</p>
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
