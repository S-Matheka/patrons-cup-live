'use client';

import { useState, useEffect } from 'react';
import { getAdminClient } from '@/lib/supabase-admin';
import { Score, Team } from '@/types';
import { useTournament } from '@/context/TournamentContextSwitcher';
import { X, Save, Calculator, TrendingUp } from 'lucide-react';

interface ScoreEditModalProps {
  score: Score | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (score: Score) => void;
}

export default function ScoreEditModal({ score, isOpen, onClose, onSave }: ScoreEditModalProps) {
  const { getTeamById } = useTournament();
  const [formData, setFormData] = useState<Partial<Score>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (score) {
      setFormData(score);
    }
    setErrors({});
  }, [score]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.points === undefined || formData.points < 0) {
      newErrors.points = 'Points must be 0 or greater';
    }
    if (formData.matchesPlayed === undefined || formData.matchesPlayed < 0) {
      newErrors.matchesPlayed = 'Matches played must be 0 or greater';
    }
    if (formData.matchesWon === undefined || formData.matchesWon < 0) {
      newErrors.matchesWon = 'Matches won must be 0 or greater';
    }
    if (formData.matchesLost === undefined || formData.matchesLost < 0) {
      newErrors.matchesLost = 'Matches lost must be 0 or greater';
    }
    if (formData.matchesHalved === undefined || formData.matchesHalved < 0) {
      newErrors.matchesHalved = 'Matches halved must be 0 or greater';
    }

    // Validate that matches add up correctly
    const totalMatches = (formData.matchesWon || 0) + (formData.matchesLost || 0) + (formData.matchesHalved || 0);
    if (totalMatches !== (formData.matchesPlayed || 0)) {
      newErrors.matchesPlayed = 'Total matches (won + lost + halved) must equal matches played';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm() || !score?.teamId) return;

    setIsLoading(true);
    try {
      const scoreData = {
        points: formData.points,
        matches_played: formData.matchesPlayed,
        matches_won: formData.matchesWon,
        matches_lost: formData.matchesLost,
        matches_halved: formData.matchesHalved,
        holes_won: formData.holesWon,
        holes_lost: formData.holesLost,
        total_strokes: formData.totalStrokes,
        strokes_differential: formData.strokesDifferential,
        position: formData.position,
        position_change: formData.positionChange,
        last_updated: new Date().toISOString()
      };

      const adminClient = getAdminClient();
      if (!adminClient) {
        throw new Error('Admin client not available');
      }

      const { error, data } = await adminClient
        .from('scores')
        .update(scoreData)
        .eq('team_id', score.teamId)
        .select()
        .single();

      if (error) throw error;

      // Convert back to frontend format
      const savedScore: Score = {
        teamId: data.team_id,
        division: data.division,
        points: data.points,
        matchesPlayed: data.matches_played,
        matchesWon: data.matches_won,
        matchesLost: data.matches_lost,
        matchesHalved: data.matches_halved,
        holesWon: data.holes_won,
        holesLost: data.holes_lost,
        totalStrokes: data.total_strokes,
        strokesDifferential: data.strokes_differential,
        currentRound: data.current_round,
        position: data.position,
        positionChange: data.position_change,
        lastUpdated: data.last_updated
      };

      onSave(savedScore);
      onClose();
    } catch (error) {
      console.error('Error saving score:', error);
      setErrors({ general: 'Failed to save score. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStrokesDifferential = () => {
    const holesWon = formData.holesWon || 0;
    const holesLost = formData.holesLost || 0;
    const differential = holesWon - holesLost;
    setFormData({ ...formData, strokesDifferential: differential });
  };

  if (!isOpen || !score) return null;

  const team = getTeamById(score.teamId);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Edit Score - {team?.name}
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
          {/* Points */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Points *</label>
            <input
              type="number"
              min="0"
              step="0.5"
              className={`mt-1 block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                errors.points ? 'border-red-300' : 'border-gray-300'
              }`}
              value={formData.points || ''}
              onChange={(e) => setFormData({ ...formData, points: parseFloat(e.target.value) || 0 })}
            />
            {errors.points && <p className="text-red-500 text-sm mt-1">{errors.points}</p>}
          </div>

          {/* Match Statistics */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Matches Played *</label>
              <input
                type="number"
                min="0"
                className={`mt-1 block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.matchesPlayed ? 'border-red-300' : 'border-gray-300'
                }`}
                value={formData.matchesPlayed || ''}
                onChange={(e) => setFormData({ ...formData, matchesPlayed: parseInt(e.target.value) || 0 })}
              />
              {errors.matchesPlayed && <p className="text-red-500 text-sm mt-1">{errors.matchesPlayed}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Position</label>
              <input
                type="number"
                min="1"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                value={formData.position || ''}
                onChange={(e) => setFormData({ ...formData, position: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Matches Won *</label>
              <input
                type="number"
                min="0"
                className={`mt-1 block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.matchesWon ? 'border-red-300' : 'border-gray-300'
                }`}
                value={formData.matchesWon || ''}
                onChange={(e) => setFormData({ ...formData, matchesWon: parseInt(e.target.value) || 0 })}
              />
              {errors.matchesWon && <p className="text-red-500 text-sm mt-1">{errors.matchesWon}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Matches Lost *</label>
              <input
                type="number"
                min="0"
                className={`mt-1 block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.matchesLost ? 'border-red-300' : 'border-gray-300'
                }`}
                value={formData.matchesLost || ''}
                onChange={(e) => setFormData({ ...formData, matchesLost: parseInt(e.target.value) || 0 })}
              />
              {errors.matchesLost && <p className="text-red-500 text-sm mt-1">{errors.matchesLost}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Matches Halved *</label>
              <input
                type="number"
                min="0"
                className={`mt-1 block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.matchesHalved ? 'border-red-300' : 'border-gray-300'
                }`}
                value={formData.matchesHalved || ''}
                onChange={(e) => setFormData({ ...formData, matchesHalved: parseInt(e.target.value) || 0 })}
              />
              {errors.matchesHalved && <p className="text-red-500 text-sm mt-1">{errors.matchesHalved}</p>}
            </div>
          </div>

          {/* Hole Statistics */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Holes Won</label>
              <input
                type="number"
                min="0"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                value={formData.holesWon || ''}
                onChange={(e) => setFormData({ ...formData, holesWon: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Holes Lost</label>
              <input
                type="number"
                min="0"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                value={formData.holesLost || ''}
                onChange={(e) => setFormData({ ...formData, holesLost: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          {/* Strokes */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Total Strokes</label>
              <input
                type="number"
                min="0"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                value={formData.totalStrokes || ''}
                onChange={(e) => setFormData({ ...formData, totalStrokes: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Strokes Differential</label>
              <div className="flex">
                <input
                  type="number"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={formData.strokesDifferential || ''}
                  onChange={(e) => setFormData({ ...formData, strokesDifferential: parseInt(e.target.value) || 0 })}
                />
                <button
                  type="button"
                  onClick={calculateStrokesDifferential}
                  className="mt-1 px-3 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600"
                  title="Calculate from holes won/lost"
                >
                  <Calculator className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Position Change */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Position Change</label>
            <select
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              value={formData.positionChange || 'same'}
              onChange={(e) => setFormData({ ...formData, positionChange: e.target.value as 'up' | 'down' | 'same' })}
            >
              <option value="up">Up ↑</option>
              <option value="same">Same →</option>
              <option value="down">Down ↓</option>
            </select>
          </div>

          {/* Current Round */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Current Round</label>
            <select
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              value={formData.currentRound || 1}
              onChange={(e) => setFormData({ ...formData, currentRound: parseInt(e.target.value) })}
            >
              <option value={1}>Round 1 (Friday)</option>
              <option value={2}>Round 2 (Saturday)</option>
              <option value={3}>Round 3 (Sunday)</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 mt-6">
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
            {isLoading ? 'Saving...' : 'Save Score'}
          </button>
        </div>
      </div>
    </div>
  );
}
