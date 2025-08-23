'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTournament } from '@/context/TournamentContextSwitcher';
import { 
  Shield, 
  LogOut, 
  Users, 
  Calendar, 
  Trophy, 
  Edit3, 
  Eye,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  const { user, isAuthenticated, isOfficial, isAdmin, isScorer, logout } = useAuth();
  const { teams, matches, loading } = useTournament();
  const router = useRouter();
  const [officialRole, setOfficialRole] = useState('');

  useEffect(() => {
    if (!isAuthenticated || !isOfficial) {
      router.push('/admin/login');
      return;
    }

    // Get role from user object
    if (user) {
      setOfficialRole(user.username);
    }
  }, [isAuthenticated, isOfficial, user, router]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (!isAuthenticated || !isOfficial) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
          <p className="text-gray-600 mb-4">You need to be authenticated to access this area.</p>
          <Link
            href="/admin/login"
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  // Show loading state to prevent hydration mismatch
  if (loading || !teams || !matches) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tournament data...</p>
        </div>
      </div>
    );
  }

  const activeMatches = matches.filter(match => match.status === 'in-progress');
  const scheduledMatches = matches.filter(match => match.status === 'scheduled');
  const completedMatches = matches.filter(match => match.status === 'completed');

  const formatRole = (role: string) => {
    return role.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Tournament Official Dashboard</h1>
                <p className="text-sm text-gray-600">
                  Welcome, {user?.role || formatRole(officialRole)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link
                href="/"
                className="text-gray-600 hover:text-gray-900 flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-gray-100"
              >
                <Eye className="w-4 h-4" />
                <span className="text-sm">View Public</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Teams</p>
                <p className="text-2xl font-bold text-gray-900">{teams.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">{activeMatches.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Calendar className="w-6 h-6 text-gray-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Scheduled</p>
                <p className="text-2xl font-bold text-gray-900">{scheduledMatches.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{completedMatches.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Live Scoring - Available to both Admin and Scorer */}
              <Link
                href="/admin/scoring"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
              >
                <Edit3 className="w-8 h-8 text-green-600 mr-3" />
                <div>
                  <div className="font-medium text-gray-900">Live Scoring</div>
                  <div className="text-sm text-gray-600">Update match scores</div>
                </div>
              </Link>

              {/* Admin-only actions */}
              {isAdmin && (
                <>
                  <Link
                    href="/admin/matches"
                    className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    <Calendar className="w-8 h-8 text-blue-600 mr-3" />
                    <div>
                      <div className="font-medium text-gray-900">Match Management</div>
                      <div className="text-sm text-gray-600">Manage tournament matches</div>
                    </div>
                  </Link>

                  <Link
                    href="/admin/teams"
                    className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
                  >
                    <Users className="w-8 h-8 text-purple-600 mr-3" />
                    <div>
                      <div className="font-medium text-gray-900">Team Management</div>
                      <div className="text-sm text-gray-600">Manage teams & players</div>
                    </div>
                  </Link>

                  <Link
                    href="/admin/leaderboard"
                    className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-yellow-500 hover:bg-yellow-50 transition-colors"
                  >
                    <Trophy className="w-8 h-8 text-yellow-600 mr-3" />
                    <div>
                      <div className="font-medium text-gray-900">Leaderboard</div>
                      <div className="text-sm text-gray-600">Manage standings</div>
                    </div>
                  </Link>
                </>
              )}

              {/* Scorer-specific message */}
              {isScorer && !isAdmin && (
                <div className="col-span-full flex items-center p-4 border border-blue-200 rounded-lg bg-blue-50">
                  <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 mr-3" />
                  <div>
                    <div className="font-medium text-blue-900 text-sm sm:text-base">Scorer Access</div>
                    <div className="text-xs sm:text-sm text-blue-700">You have access to scoring functionality only</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tournament Status */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Tournament Status</h2>
          </div>
          <div className="p-4 sm:p-6">
            <div className="text-center py-6 sm:py-8">
              <Trophy className="w-12 h-12 sm:w-16 sm:h-16 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">4th Edition Patron&apos;s Cup 2025</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4">Muthaiga Golf Club • August 22-24, 2025</p>
              <div className="inline-flex items-center px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-blue-100 text-blue-800">
                Live Tournament Phase
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
