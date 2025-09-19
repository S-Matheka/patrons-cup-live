import React, { useState } from 'react';
import { Tournament } from '@/types/tournament';

interface TournamentSelectorProps {
  tournaments: Tournament[];
  currentTournament: Tournament | null;
  onTournamentChange: (tournamentId: number) => void;
  isLoading?: boolean;
  className?: string;
  showStatus?: boolean;
}

const TournamentSelector: React.FC<TournamentSelectorProps> = ({
  tournaments,
  currentTournament,
  onTournamentChange,
  isLoading = false,
  className = '',
  showStatus = true
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleTournamentChange = (tournamentId: number) => {
    onTournamentChange(tournamentId);
    setIsOpen(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'completed': return 'text-gray-600 bg-gray-100';
      case 'upcoming': return 'text-blue-600 bg-blue-100';
      case 'archived': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return '🟢';
      case 'completed': return '✅';
      case 'upcoming': return '⏳';
      case 'archived': return '📦';
      default: return '❓';
    }
  };

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-10 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Current Tournament Display */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        disabled={tournaments.length === 0}
      >
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          {currentTournament ? (
            <>
              <span className="text-sm flex-shrink-0">
                {getStatusIcon(currentTournament.status)}
              </span>
              <div className="text-left min-w-0 flex-1">
                <div className="font-medium text-gray-900 truncate">
                  {currentTournament.name}
                </div>
                {showStatus && (
                  <div className={`text-xs px-1.5 py-0.5 rounded-full ${getStatusColor(currentTournament.status)}`}>
                    {currentTournament.status}
                  </div>
                )}
              </div>
            </>
          ) : (
            <span className="text-gray-500 text-sm">Select Tournament</span>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {tournaments.length === 0 ? (
            <div className="px-4 py-3 text-gray-500 text-center">
              No tournaments available
            </div>
          ) : (
            tournaments.map((tournament) => (
              <button
                key={tournament.id}
                onClick={() => handleTournamentChange(tournament.id)}
                className={`w-full flex items-center space-x-2 px-3 py-2 text-left hover:bg-gray-50 transition-colors text-sm ${
                  currentTournament?.id === tournament.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                }`}
              >
                <span className="text-sm flex-shrink-0">
                  {getStatusIcon(tournament.status)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {tournament.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(tournament.startDate).toLocaleDateString()} - {new Date(tournament.endDate).toLocaleDateString()}
                  </div>
                  {showStatus && (
                    <div className={`inline-block text-xs px-1.5 py-0.5 rounded-full mt-1 ${getStatusColor(tournament.status)}`}>
                      {tournament.status}
                    </div>
                  )}
                </div>
                {currentTournament?.id === tournament.id && (
                  <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))
          )}
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default TournamentSelector;
