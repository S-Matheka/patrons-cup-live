'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Match, Team, Player } from '@/types';
import { useTournament } from '@/context/TournamentContext';
import { X, Save, Calendar, Clock, Users, MapPin } from 'lucide-react';

interface MatchEditModalProps {
  match: Match | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (match: Match) => void;
}

export default function MatchEditModal({ match, isOpen, onClose, onSave }: MatchEditModalProps) {
  const { teams, players } = useTournament();
  const [formData, setFormData] = useState<Partial<Match>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (match) {
      setFormData({
        ...match,
        players: match.players || { teamA: [], teamB: [], teamC: [] }
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
    }
    setErrors({});
  }, [match]);

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
      const matchData = {
        game_number: formData.gameNumber,
        division: formData.division,
        type: formData.type,
        session: formData.session,
        date: formData.date,
        tee_time: formData.teeTime,
        tee: formData.tee,
        status: formData.status,
        team_a_id: formData.teamAId,
        team_b_id: formData.teamBId,
        team_c_id: formData.teamCId,
        is_bye: formData.isBye,
        is_three_way: formData.isThreeWay,
        is_pro: formData.isPro,
        players: formData.players,
        updated_at: new Date().toISOString()
      };

      let result;
      if (match?.id) {
        // Update existing match
        result = await supabase
          .from('matches')
          .update(matchData)
          .eq('id', match.id)
          .select()
          .single();
      } else {
        // Create new match
        result = await supabase
          .from('matches')
          .insert(matchData)
          .select()
          .single();
      }

      if (result.error) throw result.error;

      // Convert back to frontend format
      const savedMatch: Match = {
        id: result.data.id,
        gameNumber: result.data.game_number,
        division: result.data.division,
        type: result.data.type,
        session: result.data.session,
        date: result.data.date,
        teeTime: result.data.tee_time,
        tee: result.data.tee,
        status: result.data.status,
        teamAId: result.data.team_a_id,
        teamBId: result.data.team_b_id,
        teamCId: result.data.team_c_id,
        isBye: result.data.is_bye,
        isThreeWay: result.data.is_three_way,
        isPro: result.data.is_pro,
        players: result.data.players,
        holes: []
      };

      onSave(savedMatch);
      onClose();
    } catch (error) {
      console.error('Error saving match:', error);
      setErrors({ general: 'Failed to save match. Please try again.' });
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
      const { error } = await supabase
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

        <div className="space-y-4 max-h-96 overflow-y-auto">
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
          <div className="grid grid-cols-2 gap-4">
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
          </div>

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
