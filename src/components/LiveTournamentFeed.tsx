'use client';

import { useTournament } from '@/context/TournamentContext';
import { Clock, TrendingUp, TrendingDown, Zap, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

interface FeedItem {
  id: string;
  timestamp: string;
  type: 'score_update' | 'hole_complete' | 'match_complete' | 'position_change';
  teamName: string;
  teamColor: string;
  teamLogo: string;
  message: string;
  details?: string;
  isLive?: boolean;
}

const LiveTournamentFeed = () => {
  const { teams, matches, scores } = useTournament();
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);

  // Pre-tournament updates and announcements
  useEffect(() => {
    const generateFeedItems = () => {
      const items: FeedItem[] = [];
      
      // Tournament announcements
      items.push({
        id: '1',
        timestamp: '2025-08-22T06:30:00Z', // Static timestamp
        type: 'score_update',
        teamName: 'Tournament',
        teamColor: '#10b981',
        teamLogo: '📢',
        message: '4th Edition Patron\'s Cup 2025',
        details: 'Tournament starts Friday, August 22nd at 7:30 AM',
        isLive: true
      });

      items.push({
        id: '2',
        timestamp: '2025-08-22T06:00:00Z', // Static timestamp
        type: 'position_change',
        teamName: 'Muthaiga',
        teamColor: '#e1a730',
        teamLogo: '🏌️',
        message: 'Host Club Ready',
        details: 'Course preparation completed at Muthaiga Golf Club'
      });

      items.push({
        id: '3',
        timestamp: '2025-08-22T05:00:00Z', // Static timestamp
        type: 'match_complete',
        teamName: 'Teams',
        teamColor: '#3b82f6',
        teamLogo: '👥',
        message: 'Team Registration Complete',
        details: 'All 15 clubs confirmed and ready to compete'
      });

      items.push({
        id: '4',
        timestamp: '2025-08-22T04:00:00Z', // Static timestamp
        type: 'hole_complete',
        teamName: 'Officials',
        teamColor: '#6b7280',
        teamLogo: '⚖️',
        message: 'Referee Briefing Completed',
        details: 'Tournament officials briefed on rules and procedures'
      });

      items.push({
        id: '5',
        timestamp: '2025-08-22T03:00:00Z', // Static timestamp
        type: 'position_change',
        teamName: 'Weather',
        teamColor: '#059669',
        teamLogo: '☀️',
        message: 'Perfect Conditions Expected',
        details: 'Clear skies and light winds forecasted for tournament'
      });

      return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    };

    setFeedItems(generateFeedItems());

    // During tournament, this would update every 30 seconds
    // For now, showing pre-tournament information
    // const interval = setInterval(() => {
    //   setFeedItems(generateFeedItems());
    // }, 30000);
    // return () => clearInterval(interval);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'score_update':
        return <Zap className="w-4 h-4 text-yellow-500" />;
      case 'hole_complete':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'match_complete':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'position_change':
        return <TrendingUp className="w-4 h-4 text-purple-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    // Use static relative times to avoid hydration mismatch
    const time = new Date(timestamp);
    const tournamentDate = new Date('2025-08-22T07:00:00Z');
    
    // For pre-tournament, show static relative times
    if (timestamp === '2025-08-22T06:30:00Z') return '30m ago';
    if (timestamp === '2025-08-22T06:00:00Z') return '1h ago';
    if (timestamp === '2025-08-22T05:00:00Z') return '2h ago';
    if (timestamp === '2025-08-22T04:00:00Z') return '3h ago';
    if (timestamp === '2025-08-22T03:00:00Z') return '4h ago';
    
    // Fallback to date string for other timestamps
    return time.toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-700">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center">
            <Zap className="w-5 h-5 mr-2" />
            Tournament Updates
          </h2>
          <div className="text-purple-100 text-sm">
            Live Tournament
          </div>
        </div>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        {feedItems.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <Clock className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p>No recent updates</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {feedItems.map((item) => (
              <div 
                key={item.id} 
                className={`p-4 hover:bg-gray-50 transition-colors ${
                  item.isLive ? 'bg-yellow-50 border-l-4 border-l-yellow-400' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                      style={{ backgroundColor: item.teamColor }}
                    >
                      {item.teamLogo}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">{item.teamName}</span>
                      {getIcon(item.type)}
                      {item.isLive && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium">
                          LIVE
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-900 mt-1">{item.message}</p>
                    
                    {item.details && (
                      <p className="text-xs text-gray-600 mt-1">{item.details}</p>
                    )}
                    
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">
                        {formatTimeAgo(item.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="px-6 py-3 bg-gray-50 border-t">
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
          <Clock className="w-4 h-4" />
          <span>Tournament starts Friday, August 22nd at 7:30 AM</span>
        </div>
      </div>
    </div>
  );
};

export default LiveTournamentFeed;
