'use client';

import { Team, Score } from '@/types';
import { Users, Trophy, Medal } from 'lucide-react';
import Link from 'next/link';

interface TeamCardProps {
  team: Team;
  score?: Score;
  showDetails?: boolean;
}

const TeamCard: React.FC<TeamCardProps> = ({ team, score, showDetails = false }) => {
  const getDivisionColor = (division: string) => {
    return division === 'Trophy' ? 'bg-yellow-500' : 'bg-purple-500';
  };

  const getDivisionIcon = (division: string) => {
    return division === 'Trophy' ? Trophy : Medal;
  };

  const DivisionIcon = getDivisionIcon(team.division);

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
      {/* Team Header */}
      <div 
        className="p-4 text-white"
        style={{ backgroundColor: team.color }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">{team.logo}</div>
            <div>
              <h3 className="text-lg font-bold">{team.name}</h3>
              <p className="text-sm opacity-90">{team.description}</p>
            </div>
          </div>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${getDivisionColor(team.division)}`}>
            <div className="flex items-center">
              <DivisionIcon className="w-3 h-3 mr-1" />
              {team.division}
            </div>
          </div>
        </div>
      </div>

      {/* Team Stats */}
      {score && (
        <div className="p-4 bg-gray-50">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
                              <div className="text-2xl font-bold text-green-600">{score.points || 0}</div>
              <div className="text-xs text-gray-600">Points</div>
            </div>
            <div>
                              <div className="text-2xl font-bold text-blue-600">{score.matchesWon || 0}</div>
              <div className="text-xs text-gray-600">Wins</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-600">{score.matchesPlayed || 0}</div>
              <div className="text-xs text-gray-600">Matches</div>
            </div>
          </div>
        </div>
      )}

      {/* Action Button */}
      {showDetails && (
        <div className="p-4 border-t border-gray-100">
          <Link
            href={`/teams/${team.id}`}
            className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200"
          >
            <Users className="w-4 h-4 mr-2" />
            View Details
          </Link>
        </div>
      )}
    </div>
  );
};

export default TeamCard; 