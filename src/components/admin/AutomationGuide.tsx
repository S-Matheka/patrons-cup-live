'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Trophy, Clock, BarChart3, Zap } from 'lucide-react';

export default function AutomationGuide() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <Zap className="w-5 h-5 text-blue-600" />
          <div>
            <h3 className="font-semibold text-blue-900">Automated Tournament System</h3>
            <p className="text-sm text-blue-800">
              How matches auto-complete and leaderboards update
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-blue-600" />
        ) : (
          <ChevronDown className="w-5 h-5 text-blue-600" />
        )}
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Match Completion */}
            <div className="bg-white p-4 rounded-lg border border-blue-200">
              <div className="flex items-center mb-3">
                <Trophy className="w-5 h-5 text-yellow-600 mr-2" />
                <h4 className="font-semibold text-gray-900">Match Completion</h4>
              </div>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-start space-x-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span><strong>Auto-completes</strong> when a team is up by more holes than remain</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span><strong>Examples:</strong> 3up with 2 holes left = "3/2" win</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span><strong>Final hole:</strong> Completes after hole 18</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-blue-600 font-bold">i</span>
                  <span><strong>Status:</strong> "scheduled" → "in-progress" → "completed"</span>
                </div>
              </div>
            </div>

            {/* Leaderboard Updates */}
            <div className="bg-white p-4 rounded-lg border border-blue-200">
              <div className="flex items-center mb-3">
                <BarChart3 className="w-5 h-5 text-green-600 mr-2" />
                <h4 className="font-semibold text-gray-900">Leaderboard Updates</h4>
              </div>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-start space-x-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span><strong>Win:</strong> +1 point to winner</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span><strong>Halved:</strong> +0.5 points to both teams</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span><strong>Stats:</strong> Wins, losses, holes won/lost updated</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-blue-600 font-bold">i</span>
                  <span><strong>Real-time:</strong> All users see updates instantly</span>
                </div>
              </div>
            </div>

            {/* Timing System */}
            <div className="bg-white p-4 rounded-lg border border-blue-200">
              <div className="flex items-center mb-3">
                <Clock className="w-5 h-5 text-purple-600 mr-2" />
                <h4 className="font-semibold text-gray-900">Smart Timing</h4>
              </div>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-start space-x-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span><strong>Auto-start:</strong> Matches go live at tee time (EAT)</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span><strong>Scoring blocked</strong> until tee time reached</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span><strong>Admin override:</strong> Can start matches early</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-blue-600 font-bold">i</span>
                  <span><strong>Timezone:</strong> Nairobi, Kenya (EAT UTC+3)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Workflow Steps */}
          <div className="bg-white p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-gray-900 mb-3">🔄 Complete Automation Workflow</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h5 className="font-medium text-gray-800 mb-2">When Officials Enter Scores:</h5>
                <ol className="list-decimal list-inside space-y-1 text-gray-700">
                  <li>Score saved to hole in database</li>
                  <li>Match play logic checks for winner</li>
                  <li>If won: Match status → "completed"</li>
                  <li>Tournament points calculated</li>
                  <li>Leaderboard automatically updated</li>
                  <li>All users see changes instantly</li>
                </ol>
              </div>
              <div>
                <h5 className="font-medium text-gray-800 mb-2">What Users See:</h5>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>Live scorecard shows current status</li>
                  <li>Leaderboard updates in real-time</li>
                  <li>Standings page shows new rankings</li>
                  <li>Match cards show "completed" status</li>
                  <li>Tournament progress updates</li>
                  <li>No manual intervention needed!</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
            <p className="text-sm text-yellow-800">
              <strong>💡 Pro Tip:</strong> The system handles everything automatically! Officials just enter hole-by-hole scores, 
              and the tournament management system takes care of match completion, point allocation, and leaderboard updates.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
